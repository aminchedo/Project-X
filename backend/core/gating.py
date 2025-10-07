"""
Multi-layer gating system for trade filtering
Integrates RSI/MACD alignment, SMC quality checks, and sentiment filters
"""

from typing import Dict, Optional
import structlog

logger = structlog.get_logger()


def gate_alignment_rsi_macd(
    rsi: float,
    macd_hist: float,
    direction: str,
    rsi_oversold: float = 30.0,
    rsi_overbought: float = 70.0
) -> bool:
    """
    Check RSI and MACD alignment with trade direction
    
    Args:
        rsi: RSI value (0..100)
        macd_hist: MACD histogram value
        direction: "LONG" or "SHORT"
        rsi_oversold: RSI oversold threshold
        rsi_overbought: RSI overbought threshold
    
    Returns:
        True if aligned, False otherwise
    """
    if direction == "LONG":
        # For longs: RSI should be recovering from oversold and MACD positive
        return rsi < 60.0 and macd_hist > 0
    else:  # SHORT
        # For shorts: RSI should be declining from overbought and MACD negative
        return rsi > 40.0 and macd_hist < 0


def gate_sentiment(
    sentiment: float,
    direction: str,
    min_sentiment_long: float = 0.2,
    min_sentiment_short: float = -0.2
) -> bool:
    """
    Check if sentiment aligns with trade direction
    
    Args:
        sentiment: Sentiment score (-1..1)
        direction: "LONG" or "SHORT"
        min_sentiment_long: Minimum sentiment for longs
        min_sentiment_short: Maximum sentiment for shorts
    
    Returns:
        True if sentiment is favorable, False otherwise
    """
    if direction == "LONG":
        return sentiment >= min_sentiment_long
    else:  # SHORT
        return sentiment <= min_sentiment_short


def smc_gate(
    smc: Dict[str, float],
    thresholds: Dict[str, float]
) -> bool:
    """
    Check SMC quality thresholds (STRICTER: ZQS ≥ 0.60, FVG_ATR ≥ 0.18, LIQ_NEAR required)
    
    Args:
        smc: SMC features dict with keys: SMC_ZQS, FVG_ATR, LIQ_NEAR
        thresholds: Threshold dict with keys: ZQS_min, FVG_min_atr
    
    Returns:
        True if SMC quality is sufficient, False otherwise
    """
    if smc.get("SMC_ZQS", 0.0) < thresholds.get("ZQS_min", 0.60):
        logger.debug("SMC gate failed: ZQS too low", zqs=smc.get("SMC_ZQS"))
        return False
    
    if smc.get("FVG_ATR", 0.0) < thresholds.get("FVG_min_atr", 0.18):
        logger.debug("SMC gate failed: FVG too small", fvg_atr=smc.get("FVG_ATR"))
        return False
    
    # Require liquidity nearby
    if not smc.get("LIQ_NEAR", 0):
        logger.debug("SMC gate failed: no liquidity nearby")
        return False
    
    return True


def momentum_gate(
    macd_hist_slope: float,
    direction: str
) -> bool:
    """
    Check if MACD histogram slope aligns with entry direction
    
    Args:
        macd_hist_slope: Slope of MACD histogram (computed via momentum.slope())
        direction: "LONG" or "SHORT"
    
    Returns:
        True if slope is aligned with direction, False otherwise
    """
    if direction == "LONG" and macd_hist_slope <= 0:
        logger.debug("Momentum gate failed: LONG but slope <= 0", slope=macd_hist_slope)
        return False
    
    if direction == "SHORT" and macd_hist_slope >= 0:
        logger.debug("Momentum gate failed: SHORT but slope >= 0", slope=macd_hist_slope)
        return False
    
    return True


def gate_confluence(
    entry_score: float,
    conf_score: float,
    entry_threshold: float,
    conf_threshold: float
) -> bool:
    """
    Check if entry and confluence scores meet thresholds
    
    Args:
        entry_score: Weighted entry score (0..1)
        conf_score: Confluence score (0..1)
        entry_threshold: Minimum entry score required
        conf_threshold: Minimum confluence score required
    
    Returns:
        True if both thresholds are met, False otherwise
    """
    passed = entry_score >= entry_threshold and conf_score >= conf_threshold
    
    if not passed:
        logger.debug(
            "Confluence gate failed",
            entry_score=round(entry_score, 3),
            entry_threshold=entry_threshold,
            conf_score=round(conf_score, 3),
            conf_threshold=conf_threshold
        )
    
    return passed


def final_gate(
    direction: str,
    rsi_val: float,
    macd_hist_val: float,
    macd_hist_slope: float,
    sentiment: float,
    entry_score: float,
    conf_score: float,
    smc: Dict[str, float],
    thrs: Dict[str, float],
    countertrend: bool,
    has_second_BOS: bool
) -> bool:
    """
    Apply all gates with stricter logic (CHoCH/Flip + Liquidity + ZQS + FVG + Momentum + BOS2)
    
    Args:
        direction: "LONG" or "SHORT"
        rsi_val: RSI value (0..100)
        macd_hist_val: MACD histogram value
        macd_hist_slope: MACD histogram slope (from momentum.slope())
        sentiment: Sentiment score (-1..1)
        entry_score: Weighted entry score (0..1)
        conf_score: Confluence score (0..1)
        smc: SMC features dict (SMC_ZQS, FVG_ATR, LIQ_NEAR)
        thrs: All thresholds dict (EntryScore, ConfluenceScore, ZQS_min, FVG_min_atr, require_bos2_on_countertrend)
        countertrend: True if trading against HTF trend
        has_second_BOS: True if second BOS/CHoCH confirmed
    
    Returns:
        True if all gates pass, False otherwise
    """
    # Gate 1: RSI/MACD alignment
    if not gate_alignment_rsi_macd(rsi_val, macd_hist_val, direction):
        return False
    
    # Gate 2: SMC quality (ZQS, FVG, Liquidity)
    if not smc_gate(smc, thrs):
        return False
    
    # Gate 3: Momentum confirmation
    if not momentum_gate(macd_hist_slope, direction):
        return False
    
    # Gate 4: Counter-trend BOS2 requirement
    if countertrend and thrs.get("require_bos2_on_countertrend", True) and not has_second_BOS:
        logger.debug("Counter-trend gate failed: BOS2 required but not present")
        return False
    
    # Gate 5: Sentiment alignment
    if not gate_sentiment(sentiment, direction):
        return False
    
    # Gate 6: Confluence scores
    if not gate_confluence(
        entry_score,
        conf_score,
        thrs.get("EntryScore", 0.67),
        thrs.get("ConfluenceScore", 0.57)
    ):
        return False
    
    # All gates passed
    logger.info("All gates passed", direction=direction)
    return True
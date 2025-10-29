"""
Multi-layer gating system for trade filtering
Integrates RSI/MACD alignment, SMC quality checks, and sentiment filters
"""

from typing import Dict, Optional
import structlog
from backend.core.goal_conditioning import resolve_goal, adjust_thresholds

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
    Check SMC quality thresholds
    
    Args:
        smc: SMC features dict with keys: SMC_ZQS, FVG_ATR, LIQ_NEAR
        thresholds: Threshold dict with keys: ZQS_min, FVG_min_atr
    
    Returns:
        True if SMC quality is sufficient, False otherwise
    """
    if smc.get("SMC_ZQS", 0.0) < thresholds.get("ZQS_min", 0.55):
        logger.debug("SMC gate failed: ZQS too low", zqs=smc.get("SMC_ZQS"))
        return False
    
    if smc.get("FVG_ATR", 0.0) < thresholds.get("FVG_min_atr", 0.15):
        logger.debug("SMC gate failed: FVG too small", fvg_atr=smc.get("FVG_ATR"))
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
    rsi: float,
    macd_hist: float,
    sentiment: float,
    smc: Dict[str, float],
    direction: str,
    entry_score: float,
    conf_score: float,
    thresholds: Dict[str, float],
    user_goal: Optional[str] = None
) -> Dict[str, bool]:
    """
    Apply all gates and return detailed results
    
    Args:
        rsi: RSI value (0..100)
        macd_hist: MACD histogram value
        sentiment: Sentiment score (-1..1)
        smc: SMC features dict
        direction: "LONG" or "SHORT"
        entry_score: Weighted entry score
        conf_score: Confluence score
        thresholds: All thresholds dict
        user_goal: Optional goal ("auto", "continuation", "reversal")
    
    Returns:
        Dictionary with gate results:
        {
            "rsi_macd": bool,
            "sentiment": bool,
            "smc": bool,
            "confluence": bool,
            "liquidity": bool,
            "final": bool  # All gates passed
        }
    """
    # Apply goal-conditioning to thresholds if goal provided
    eff_thresholds = thresholds
    if user_goal:
        goal = resolve_goal(user_goal, smc.get("HTF_TREND", 0))
        from backend.core.goal_conditioning import apply_goal
        _, th_adj, _ = apply_goal(goal)
        eff_thresholds = adjust_thresholds(thresholds, th_adj)
        logger.debug("Goal-conditioned thresholds applied", goal=goal, adjustments=th_adj)
    
    # Apply individual gates
    gate_rsi_macd = gate_alignment_rsi_macd(rsi, macd_hist, direction)
    gate_sent = gate_sentiment(sentiment, direction)
    gate_smc_quality = smc_gate(smc, eff_thresholds)
    gate_conf = gate_confluence(
        entry_score,
        conf_score,
        eff_thresholds.get("EntryScore", 0.65),
        eff_thresholds.get("ConfluenceScore", 0.55)
    )
    
    # Liquidity gate: require liquidity nearby
    gate_liq = bool(smc.get("LIQ_NEAR", 0))
    
    # Final gate: all must pass
    all_passed = all([
        gate_rsi_macd,
        gate_sent,
        gate_smc_quality,
        gate_conf,
        gate_liq
    ])
    
    results = {
        "rsi_macd": gate_rsi_macd,
        "sentiment": gate_sent,
        "smc": gate_smc_quality,
        "confluence": gate_conf,
        "liquidity": gate_liq,
        "final": all_passed
    }
    
    if not all_passed:
        failed = [k for k, v in results.items() if not v and k != "final"]
        logger.info("Gate check failed", failed_gates=failed, direction=direction)
    else:
        logger.info("All gates passed", direction=direction)
    
    return results
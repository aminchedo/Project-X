"""
Scoring module with SMC integration
Combines traditional indicators with Smart Money Concepts
"""

from typing import Dict, List, Optional
import structlog
from backend.core.dynamic_weights import adjust_weights

logger = structlog.get_logger()


def weighted_score(
    signals: Dict[str, float], 
    weights: Dict[str, float],
    context: Optional[Dict] = None
) -> float:
    """
    Calculate weighted score from signals with dynamic weight adjustment
    
    Args:
        signals: Dictionary of signal values {signal_name: value}
        weights: Base dictionary of weights {signal_name: weight}
        context: Optional market context for dynamic weight adjustment
            Expected keys: atr_pct, spread_bp, htf_trend, realized_vol, news_high_impact
    
    Returns:
        Weighted score (0..1 range typically)
    """
    # Apply dynamic weight adjustment if context provided
    if context:
        eff_weights = adjust_weights(weights, context)
    else:
        eff_weights = weights
    
    # Calculate weighted sum
    s = wsum = 0.0
    for k, w in eff_weights.items():
        if k in signals:
            s += float(signals[k]) * w
            wsum += w
    
    return s / wsum if wsum > 0 else 0.0


def normalize_signals(signals: Dict[str, float]) -> Dict[str, float]:
    """
    Normalize signals to 0..1 range
    
    Assumes:
    - RSI, SMC_ZQS are already 0..1
    - MACD_hist needs normalization
    - Sentiment is -1..1 -> convert to 0..1
    """
    normalized = signals.copy()
    
    # Normalize sentiment from -1..1 to 0..1
    if "Sentiment" in normalized:
        normalized["Sentiment"] = (normalized["Sentiment"] + 1.0) / 2.0
    
    # MACD histogram normalization (simple clipping)
    if "MACD" in normalized:
        normalized["MACD"] = max(0.0, min(1.0, (normalized["MACD"] + 0.5)))
    
    # Ensure all values are in 0..1 range
    for key in normalized:
        normalized[key] = max(0.0, min(1.0, float(normalized[key])))
    
    return normalized


def compute_entry_score(
    signals: Dict[str, float],
    weights: Dict[str, float],
    smc_features: Optional[Dict[str, float]] = None,
    context: Optional[Dict] = None
) -> float:
    """
    Compute entry score including SMC features and dynamic weights
    
    Args:
        signals: Base signals (RSI, MACD, Sentiment, SAR, etc.)
        weights: Base signal weights
        smc_features: SMC features from compute_smc_features()
            Expected keys: HTF_TREND, FVG_ATR, SMC_ZQS, LIQ_NEAR
        context: Market context for dynamic weight adjustment
            Expected keys: atr_pct, spread_bp, htf_trend, realized_vol, news_high_impact
    
    Returns:
        Entry score (0..1)
    """
    # Merge SMC features into signals
    combined_signals = signals.copy()
    
    if smc_features:
        # Map SMC features to signal names
        combined_signals["SMC_ZQS"] = smc_features.get("SMC_ZQS", 0.0)
        combined_signals["FVG_ATR"] = smc_features.get("FVG_ATR", 0.0)
        combined_signals["LIQ_GRAB"] = float(smc_features.get("LIQ_NEAR", 0))
    
    # Normalize signals
    normalized = normalize_signals(combined_signals)
    
    # Calculate weighted score with dynamic weights
    entry_score = weighted_score(normalized, weights, context)
    
    logger.info(
        "Entry score computed",
        signals=len(combined_signals),
        entry_score=round(entry_score, 3),
        has_smc=smc_features is not None,
        has_context=context is not None
    )
    
    return entry_score


def compute_confluence_score(
    rsi: float,
    macd_hist: float,
    smc_zqs: float,
    liq_near: int
) -> float:
    """
    Compute confluence score from key indicators
    
    Args:
        rsi: RSI value (0..100)
        macd_hist: MACD histogram value
        smc_zqs: SMC Zone Quality Score (0..1)
        liq_near: Liquidity nearby flag (0 or 1)
    
    Returns:
        Confluence score (0..1)
    """
    # Normalize RSI to 0..1
    rsi_norm = rsi / 100.0
    
    # Simple confluence: average of normalized indicators
    components = [
        rsi_norm,
        max(0.0, min(1.0, (macd_hist + 0.5))),
        smc_zqs,
        float(liq_near)
    ]
    
    confluence = sum(components) / len(components)
    
    return confluence
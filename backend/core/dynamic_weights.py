"""
Dynamic weight adjustment system with three layers:
1. Regime-aware multipliers (fast, momentary rules based on market conditions)
2. Online EWMA per-signal (short-term learning from recent performance)
3. GA/RL periodic optimization (medium-term learning for base weights)

This module implements layers 1 and 2.
"""

from __future__ import annotations
from typing import Dict
import math
from backend.core.config import load_ai_config, save_ai_config

SignalW = Dict[str, float]


def _normalize(w: SignalW) -> SignalW:
    """
    Normalize weights to sum to 1.0
    
    Args:
        w: Weight dictionary
        
    Returns:
        Normalized weights
    """
    s = sum(max(v, 0.0) for v in w.values())
    return {k: (max(v, 0.0) / s if s > 0 else 0.0) for k, v in w.items()}


def detect_regime(context: Dict) -> Dict[str, bool]:
    """
    Detect market regime from context indicators
    
    Context keys (examples):
      - atr_pct: float       # e.g. 0.025 means 2.5% of price
      - spread_bp: float     # e.g. 15 basis points
      - htf_trend: int       # {-1, 0, 1}
      - realized_vol: float  # rolling std/atr ratio
      - news_high_impact: bool
    
    Args:
        context: Market context dictionary
        
    Returns:
        Dictionary of regime flags {regime_name: bool}
    """
    news = bool(context.get("news_high_impact", False))
    
    # High volatility: ATR > 3% or realized vol > 2.0x
    high_vol = (
        float(context.get("atr_pct", 0.0)) >= 0.03 or 
        float(context.get("realized_vol", 0.0)) >= 2.0
    )
    
    # Wide spread: > 20 basis points
    wide_spread = float(context.get("spread_bp", 0.0)) >= 20.0
    
    # Trend vs Range
    htf_trend_val = int(context.get("htf_trend", 0))
    trend = htf_trend_val != 0
    range_ = not trend
    
    return {
        "news_window": news,
        "high_vol": high_vol,
        "wide_spread": wide_spread,
        "trend": trend,
        "range": range_
    }


def apply_regime_multipliers(
    base: SignalW, 
    cfg: Dict, 
    regimes: Dict[str, bool]
) -> SignalW:
    """
    Apply regime-specific multipliers to base weights
    
    Args:
        base: Base signal weights
        cfg: Configuration dictionary
        regimes: Detected regime flags
        
    Returns:
        Weights with regime multipliers applied
    """
    w = dict(base)
    table = cfg.get("regime_multipliers", {})
    
    for regime, active in regimes.items():
        if not active:
            continue
            
        muls = table.get(regime, {})
        for k, m in muls.items():
            if k in w:
                w[k] *= float(m)
    
    return w


def apply_online_ewma(base: SignalW, cfg: Dict) -> SignalW:
    """
    Apply online EWMA multipliers learned from recent performance
    
    Args:
        base: Base signal weights (possibly already regime-adjusted)
        cfg: Configuration dictionary
        
    Returns:
        Weights with EWMA multipliers applied
    """
    w = dict(base)
    oa = cfg.get("online_adaptation", {})
    per = oa.get("per_signal", {})
    clip_min = float(oa.get("clip_min", 0.5))
    clip_max = float(oa.get("clip_max", 1.5))
    
    for k, m in per.items():
        if k in w:
            # Clip multiplier to valid range
            mm = max(clip_min, min(clip_max, float(m)))
            w[k] *= mm
    
    return w


def adjust_weights(base_weights: SignalW, context: Dict) -> SignalW:
    """
    Compose all weight adjustment layers:
    base -> regime multipliers -> online EWMA -> normalize
    
    Args:
        base_weights: Base signal weights from config
        context: Market context for regime detection
        
    Returns:
        Final adjusted and normalized weights
    """
    cfg = load_ai_config()
    
    # Layer 1: Regime-aware multipliers
    regimes = detect_regime(context)
    w_reg = apply_regime_multipliers(base_weights, cfg, regimes)
    
    # Layer 2: Online EWMA
    w_ewm = apply_online_ewma(w_reg, cfg)
    
    # Final normalization
    return _normalize(w_ewm)


def ewma_update(signal_contrib: SignalW):
    """
    Update online EWMA multipliers from ex-post performance attribution
    
    This is called after a trade closes to update the learned multipliers
    based on which signals contributed positively or negatively.
    
    Args:
        signal_contrib: Dictionary of signal contributions
            e.g. {'SMC_ZQS': +0.8, 'LIQ_GRAB': -0.2, ...}
            Positive values mean the signal contributed to profitable trades.
            Values should be in range [-1, 1] approximately.
    """
    cfg = load_ai_config()
    oa = cfg.setdefault("online_adaptation", {})
    decay = float(oa.get("decay", 0.94))
    alpha = float(oa.get("alpha", 0.2))
    per = oa.setdefault("per_signal", {})
    
    for k, v in signal_contrib.items():
        prev = float(per.get(k, 1.0))
        
        # Map contribution to a multiplier update around 1.0
        # Clamp contribution to [-1, 1] range
        v_clamped = max(-1.0, min(1.0, v))
        target = 1.0 + alpha * v_clamped
        
        # EWMA update
        per[k] = decay * prev + (1.0 - decay) * target
    
    save_ai_config(cfg)
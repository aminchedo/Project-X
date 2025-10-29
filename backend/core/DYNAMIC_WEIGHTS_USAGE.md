# Dynamic Weight Adjustment System - Usage Guide

## Overview

This system implements three-layer adaptive signal weighting:

1. **Regime-aware multipliers** - Fast, momentary rules based on market conditions
2. **Online EWMA per-signal** - Short-term learning from recent performance  
3. **GA/RL periodic** - Medium-term optimization (already implemented)

## Quick Start

### 1. Using Dynamic Weights in Scoring

```python
from backend.core.scoring import compute_entry_score
from backend.core.config import get_config

# Build market context
context = {
    "atr_pct": 0.025,              # Current ATR as % of price
    "spread_bp": 15.0,             # Bid-ask spread in basis points
    "htf_trend": 1,                # HTF trend: -1 (down), 0 (neutral), 1 (up)
    "realized_vol": 1.5,           # Realized volatility ratio
    "news_high_impact": False      # High-impact news nearby?
}

# Compute entry score with dynamic weights
config = get_config()
signals = {
    "RSI": 0.65,
    "MACD": 0.70,
    "Sentiment": 0.60,
    "SAR": 0.55
}

smc_features = {
    "SMC_ZQS": 0.75,
    "FVG_ATR": 0.20,
    "LIQ_NEAR": 1
}

score = compute_entry_score(
    signals=signals,
    weights=config.weights.model_dump(),
    smc_features=smc_features,
    context=context  # ← Dynamic weights applied here
)
```

### 2. Handling High-Impact News

```python
# Around major news events
context = {
    "news_high_impact": True,
    "atr_pct": 0.035,  # Usually higher volatility
    "spread_bp": 25.0,  # Usually wider spreads
    "htf_trend": 1
}

# Automatic adjustments:
# - SMC_ZQS weight × 0.7 (structure less reliable)
# - LIQ_GRAB weight × 1.15 (liquidity grabs more common)
# - Sentiment weight × 1.2 (sentiment drives price)

score = compute_entry_score(signals, weights, smc_features, context)
```

### 3. Position Sizing with News Awareness

```python
from backend.core.risk import position_size_with_policy, RiskPolicy

policy = RiskPolicy()
equity = 10000.0
atr_pct = 0.025

# Position size automatically reduced during high-impact news
size = position_size_with_policy(
    equity=equity,
    atr_pct=atr_pct,
    risk_policy=policy,
    countertrend=False,
    news_high_impact=context["news_high_impact"]  # ← Reduces size by 50%
)
```

### 4. Updating Online EWMA After Trade

```python
from backend.core.dynamic_weights import ewma_update

# After trade closes, attribute PnL to signals
def on_trade_closed(trade):
    # Get signals that were active at entry
    signals_at_entry = trade.meta["signals_at_entry"]  # e.g. {'SMC_ZQS': 0.75, 'LIQ_GRAB': 0.8, ...}
    
    # Get realized PnL (as fraction, e.g. 0.02 = 2% profit)
    pnl = trade.realized_return
    
    # Normalize PnL to [-1, 1] range
    # Assuming 1% = 1.0 unit
    pnl_normalized = max(-1.0, min(1.0, pnl / 0.01))
    
    # Compute contribution: signals centered around 0
    # (signal - 0.5) * 2 maps [0,1] to [-1,1]
    contributions = {
        signal: (value - 0.5) * 2.0 * pnl_normalized
        for signal, value in signals_at_entry.items()
    }
    
    # Update EWMA multipliers
    ewma_update(contributions)
    
    # Examples:
    # - Signal was 0.8 (high), PnL was +2% → contribution = +0.6 * 2.0 = +1.2 (clamped to +1.0)
    #   → Signal's multiplier increases slightly toward 1.0 + 0.2*1.0 = 1.2
    # - Signal was 0.3 (low), PnL was -1% → contribution = -0.4 * -1.0 = +0.4
    #   → Signal's multiplier increases (it correctly stayed low)
```

## Regime Detection Logic

| Condition | Detection Threshold | Regime Flag |
|-----------|-------------------|-------------|
| High-Impact News | `news_high_impact == True` | `news_window` |
| High Volatility | `atr_pct >= 0.03` OR `realized_vol >= 2.0` | `high_vol` |
| Wide Spread | `spread_bp >= 20.0` | `wide_spread` |
| Trending Market | `htf_trend != 0` | `trend` |
| Ranging Market | `htf_trend == 0` | `range` |

## Default Regime Multipliers

### News Window
- `SMC_ZQS`: **0.7** (↓ structure less reliable)
- `LIQ_GRAB`: **1.15** (↑ more liquidity grabs)
- `Sentiment`: **1.2** (↑ sentiment drives price)

### High Volatility
- `SMC_ZQS`: **0.85** (↓ structure less clear)
- `FVG_ATR`: **1.1** (↑ gaps more significant)

### Wide Spread
- `SMC_ZQS`: **0.8** (↓ structure harder to trade)

### Trending Market
- `SMC_ZQS`: **1.1** (↑ structure works better)
- `RSI`: **1.05** (↑ momentum reliable)
- `MACD`: **1.05** (↑ momentum reliable)

### Ranging Market
- `SMC_ZQS`: **1.05** (↑ structure important)
- `LIQ_GRAB`: **1.1** (↑ liquidity grabs common)

## Configuration

### Viewing Current Config

```python
from backend.core.config import load_ai_config
import json

cfg = load_ai_config()
print(json.dumps(cfg.get("regime_multipliers"), indent=2))
print(json.dumps(cfg.get("online_adaptation"), indent=2))
```

### Modifying Regime Multipliers

```python
from backend.core.config import load_ai_config, save_ai_config

cfg = load_ai_config()

# Adjust news window multipliers
cfg["regime_multipliers"]["news_window"]["SMC_ZQS"] = 0.6  # More aggressive reduction

# Save back
save_ai_config(cfg)
```

### Resetting EWMA Multipliers

```python
cfg = load_ai_config()
cfg["online_adaptation"]["per_signal"] = {}  # Reset all learned multipliers
save_ai_config(cfg)
```

## Integration Checklist

- [x] Extended `backend/core/config.py` with regime_multipliers and online_adaptation
- [x] Created `backend/core/dynamic_weights.py` with regime detection and EWMA
- [x] Updated `backend/core/scoring.py` to accept context parameter
- [x] Tests created in `backend/tests/test_dynamic_weights.py`
- [ ] Update signal generation to build context dictionary
- [ ] Update trade execution to pass context to scoring
- [ ] Add EWMA update hook in trade closure logic
- [ ] Add context logging for monitoring regime changes

## Example: Complete Signal Pipeline

```python
from backend.core.scoring import compute_entry_score
from backend.core.risk import position_size_with_policy, RiskPolicy
from backend.core.config import get_config

def generate_trade_signal(symbol, market_data, smc_data, news_feed):
    """Complete example of signal generation with dynamic weights"""
    
    # 1. Build context
    context = {
        "atr_pct": market_data["atr"] / market_data["close"],
        "spread_bp": market_data["spread_bp"],
        "htf_trend": smc_data["htf_bias"],
        "realized_vol": market_data["realized_vol_ratio"],
        "news_high_impact": news_feed.is_high_impact_nearby(symbol)
    }
    
    # 2. Compute entry score with dynamic weights
    config = get_config()
    score = compute_entry_score(
        signals=market_data["signals"],
        weights=config.weights.model_dump(),
        smc_features=smc_data["features"],
        context=context
    )
    
    # 3. Check threshold
    if score < config.thresholds.EntryScore:
        return None
    
    # 4. Calculate position size (also news-aware)
    size = position_size_with_policy(
        equity=10000.0,
        atr_pct=context["atr_pct"],
        risk_policy=config.risk,
        countertrend=(context["htf_trend"] * market_data["direction"] < 0),
        news_high_impact=context["news_high_impact"]
    )
    
    return {
        "symbol": symbol,
        "score": score,
        "size": size,
        "context": context,  # Store for later EWMA update
        "signals": market_data["signals"]  # Store for later EWMA update
    }
```

## Monitoring

Log regime changes and weight adjustments:

```python
import structlog

logger = structlog.get_logger()

def log_weight_adjustment(base_weights, final_weights, context, regimes):
    """Log weight changes for monitoring"""
    changes = {
        signal: {
            "base": base_weights[signal],
            "final": final_weights[signal],
            "change_pct": ((final_weights[signal] - base_weights[signal]) / base_weights[signal] * 100)
        }
        for signal in base_weights
    }
    
    logger.info(
        "Dynamic weights applied",
        regimes={k: v for k, v in regimes.items() if v},
        context=context,
        weight_changes=changes
    )
```

## Performance Tuning

### EWMA Parameters

- **alpha** (0.2): Learning rate. Higher = faster adaptation, lower = more stable
- **decay** (0.94): Memory decay. Higher = longer memory, lower = shorter memory
- **clip_min/max** (0.5/1.5): Multiplier bounds. Prevents extreme adjustments

### Regime Thresholds

Adjust detection thresholds in `dynamic_weights.py`:

```python
def detect_regime(context: Dict) -> Dict[str, bool]:
    # Make high_vol detection more sensitive
    high_vol = (
        float(context.get("atr_pct", 0.0)) >= 0.025  # Changed from 0.03
        or float(context.get("realized_vol", 0.0)) >= 1.5  # Changed from 2.0
    )
    # ...
```

## Testing

Run tests:
```bash
python3 -m pytest backend/tests/test_dynamic_weights.py -v
```

Expected: 20 tests pass, covering:
- Regime detection (7 tests)
- Regime multipliers (3 tests)
- EWMA application (2 tests)
- Normalization (2 tests)
- Complete pipeline (6 tests)
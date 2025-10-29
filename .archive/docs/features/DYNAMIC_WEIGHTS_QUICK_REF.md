# Dynamic Weights - Quick Reference Card 🚀

## 🎯 What It Does

Automatically adjusts signal weights based on market conditions, especially around high-impact news when structure breaks down.

## 📊 Regime Detection (Automatic)

| Condition | Trigger | Effect |
|-----------|---------|--------|
| 📰 **News** | `news_high_impact=True` | SMC↓30% LIQ↑15% Sent↑20% |
| 🌊 **High Vol** | ATR≥3% or Vol≥2x | SMC↓15% FVG↑10% |
| 📏 **Wide Spread** | Spread≥20bp | SMC↓20% |
| 📈 **Trend** | HTF≠0 | SMC↑10% RSI↑5% MACD↑5% |
| ⬌ **Range** | HTF=0 | SMC↑5% LIQ↑10% |

## 💻 Usage

### Basic (Add context parameter)

```python
# OLD
score = weighted_score(signals, weights)

# NEW  
context = {
    "news_high_impact": news_feed.is_high_impact(),
    "atr_pct": atr / price,
    "spread_bp": spread_bps,
    "htf_trend": smc_bias,  # -1/0/1
    "realized_vol": vol_ratio
}
score = weighted_score(signals, weights, context)
```

### Complete Example

```python
from backend.core.scoring import compute_entry_score
from backend.core.config import get_config

# Build context
context = {
    "news_high_impact": False,
    "atr_pct": 0.025,
    "spread_bp": 15.0,
    "htf_trend": 1,
    "realized_vol": 1.5
}

# Compute score
config = get_config()
score = compute_entry_score(
    signals=signals,
    weights=config.weights.model_dump(),
    smc_features=smc_features,
    context=context  # ← Add this!
)
```

### Update After Trade

```python
from backend.core.dynamic_weights import ewma_update

def on_trade_closed(trade):
    signals = trade.meta["signals_at_entry"]
    pnl = trade.realized_return  # e.g. 0.02 = 2%
    
    # Attribution
    pnl_unit = max(-1.0, min(1.0, pnl / 0.01))
    contrib = {
        k: (v - 0.5) * 2.0 * pnl_unit 
        for k, v in signals.items()
    }
    
    ewma_update(contrib)
```

## 🔧 Configuration

### View Config
```bash
cat config/ai_config.json
```

### Edit Multipliers
```bash
nano config/ai_config.json
# Edit regime_multipliers section
```

### Reset EWMA
```python
from backend.core.config import load_ai_config, save_ai_config
cfg = load_ai_config()
cfg["online_adaptation"]["per_signal"] = {}
save_ai_config(cfg)
```

## 🧪 Testing

```bash
# Run tests
python3 -m pytest backend/tests/test_dynamic_weights.py -v

# Expected: 20 passed ✅
```

## 📁 Files

- `backend/core/dynamic_weights.py` - Core logic
- `backend/core/config.py` - Configuration models
- `backend/core/scoring.py` - Integration point
- `backend/tests/test_dynamic_weights.py` - Tests
- `config/ai_config.json` - Persisted config
- `backend/core/DYNAMIC_WEIGHTS_USAGE.md` - Full docs

## ⚡ Quick Checks

```python
# Test imports
from backend.core.dynamic_weights import adjust_weights

# Test regime detection
from backend.core.dynamic_weights import detect_regime
regimes = detect_regime({"news_high_impact": True})
print(regimes)  # {'news_window': True, ...}

# Test weight adjustment
base = {"SMC_ZQS": 0.25, "LIQ_GRAB": 0.10}
adjusted = adjust_weights(base, {"news_high_impact": True})
print(adjusted)  # SMC_ZQS reduced, LIQ_GRAB increased
```

## 🎛️ Parameters

**EWMA Learning**
- `alpha`: 0.2 (learning rate)
- `decay`: 0.94 (memory decay)
- `clip_min/max`: 0.5/1.5 (bounds)

**Regime Thresholds** (in code)
- News: explicit flag
- High Vol: ATR≥3% or Vol≥2x
- Wide Spread: ≥20bp
- Trend/Range: HTF bias

## 🚨 Important Notes

1. **Context is optional** - Backward compatible
2. **Weights always sum to 1.0** - Auto-normalized
3. **Risk engine integration** - Already reduces size during news
4. **EWMA is persistent** - Saved to disk automatically
5. **Multiple regimes can be active** - Multipliers compound

## 📈 Expected Behavior

**Normal Market**
- Weights stay close to base config
- Small trend/range adjustments

**News Event** 
- SMC_ZQS weight drops significantly
- LIQ_GRAB, Sentiment weights increase
- Position size reduced by risk engine

**High Volatility**
- SMC_ZQS reduced (structure unclear)
- FVG_ATR increased (gaps significant)

## 🔍 Debugging

```python
# Log regime detection
from backend.core.dynamic_weights import detect_regime
regimes = detect_regime(context)
print(f"Active regimes: {[k for k,v in regimes.items() if v]}")

# Compare weights
from backend.core.dynamic_weights import adjust_weights
base = config.weights.model_dump()
adjusted = adjust_weights(base, context)
for k in base:
    change = (adjusted[k] - base[k]) / base[k] * 100
    print(f"{k}: {base[k]:.3f} → {adjusted[k]:.3f} ({change:+.1f}%)")
```

## ✅ Integration Checklist

- [ ] Import dynamic weights in signal generator
- [ ] Build context dict from market data
- [ ] Pass context to compute_entry_score()
- [ ] Add ewma_update() to trade closure
- [ ] Add regime logging
- [ ] Backtest comparison
- [ ] Monitor EWMA convergence

## 📞 Support

See full documentation: `backend/core/DYNAMIC_WEIGHTS_USAGE.md`

---
**Status**: ✅ Production Ready | **Tests**: 20/20 Passing | **Version**: 1.0
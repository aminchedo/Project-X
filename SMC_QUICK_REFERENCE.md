# 🚀 SMC Quick Reference Card

## 📦 Import های ضروری

```python
# SMC Features
from backend.pipeline.smc_features import compute_smc_features

# Config
from backend.core.config import get_config, update_config

# Scoring
from backend.core.scoring import compute_entry_score, compute_confluence_score

# Gating
from backend.core.gating import final_gate

# Risk Management
from backend.core.risk import (
    RiskPolicy,
    position_size_with_policy,
    is_countertrend,
    calculate_stop_loss,
    calculate_take_profit,
    calculate_risk_metrics
)
```

---

## ⚡ استفاده سریع (5 دقیقه)

### 1. محاسبه SMC Features

```python
# ورودی: کندل‌های HTF و LTF
smc = compute_smc_features(
    htf=candles_15m,      # List[Dict] با keys: o, h, l, c
    ltf=candles_1m,       # List[Dict] با keys: o, h, l, c
    atr_htf=atr_15m,      # float
    atr_ltf=atr_1m        # float
)

# خروجی:
# {
#   "HTF_TREND": 1,      # -1=bearish, 0=neutral, 1=bullish
#   "FVG_ATR": 0.23,     # Fair Value Gap size / ATR
#   "SMC_ZQS": 0.68,     # Zone Quality Score (0..1)
#   "LIQ_NEAR": 1        # Liquidity nearby (0 or 1)
# }
```

### 2. امتیازدهی

```python
config = get_config()

signals = {
    "RSI": 0.55,         # 0..1
    "MACD": 0.6,         # 0..1
    "Sentiment": 0.3,    # 0..1
    "SAR": 0.7           # 0..1
}

score = compute_entry_score(
    signals=signals,
    weights=config.weights.model_dump(),
    smc_features=smc
)
# => 0.712 (مثال)
```

### 3. گیت‌گذاری

```python
gates = final_gate(
    rsi=55.0,                                 # 0..100
    macd_hist=0.1,                           # signed value
    sentiment=0.3,                           # -1..1
    smc=smc,                                 # SMC features dict
    direction="LONG",                        # "LONG" or "SHORT"
    entry_score=score,                       # 0..1
    conf_score=0.6,                          # 0..1
    thresholds=config.thresholds.model_dump()
)

if gates["final"]:
    print("✅ Trade allowed")
else:
    print("❌ Trade rejected")
    print(f"Failed gates: {[k for k,v in gates.items() if not v]}")
```

### 4. مدیریت ریسک

```python
# تشخیص countertrend
countertrend = is_countertrend("LONG", smc["HTF_TREND"])

# محاسبه سایز
size = position_size_with_policy(
    equity=10000.0,
    atr_pct=0.02,                           # ATR / Price
    risk_policy=RiskPolicy(),
    countertrend=countertrend,              # کاهش سایز اگر True
    news_high_impact=False
)

# محاسبه SL/TP
entry = 50000.0
sl = calculate_stop_loss(entry, atr=1000, direction="LONG", atr_multiple=1.5)
tp = calculate_take_profit(entry, sl, direction="LONG", risk_reward_ratio=2.0)

print(f"Entry: ${entry}, SL: ${sl}, TP: ${tp}, Size: {size*100}%")
```

---

## 🎛️ تنظیمات پیش‌فرض

### Weights (جمع باید 1.0 باشد)

```python
config.weights = {
    "RSI": 0.15,
    "MACD": 0.15,
    "SMC_ZQS": 0.25,      # ⭐ وزن بالا
    "LIQ_GRAB": 0.10,
    "FVG_ATR": 0.10,
    "Sentiment": 0.15,
    "SAR": 0.10
}
```

### Thresholds

```python
config.thresholds = {
    "EntryScore": 0.65,
    "ConfluenceScore": 0.55,
    "ZQS_min": 0.55,          # حداقل Zone Quality
    "FVG_min_atr": 0.15       # حداقل FVG
}
```

### Risk Policy

```python
risk_policy = RiskPolicy(
    max_risk_per_trade=0.02,           # 2%
    max_position=0.25,                 # 25%
    stop_loss_atr_multiple=1.5,
    take_profit_rr=2.0,
    countertrend_reduction=0.5,        # کاهش 50% در countertrend
    news_impact_reduction=0.5
)
```

---

## 🔧 تغییر تنظیمات (GA/RL)

```python
# تغییر weights
new_config = update_config({
    "weights": {
        "SMC_ZQS": 0.30,
        "LIQ_GRAB": 0.12
    }
})

# تغییر thresholds
new_config = update_config({
    "thresholds": {
        "ZQS_min": 0.60,
        "FVG_min_atr": 0.20
    }
})

# تغییر risk parameters
new_config = update_config({
    "risk": {
        "max_risk_per_trade": 0.015,
        "countertrend_reduction": 0.3
    }
})
```

---

## 🐛 عیب‌یابی سریع

### مشکل: SMC features همه صفر

```python
# بررسی ورودی
print(f"HTF candles: {len(htf)}, LTF candles: {len(ltf)}")
print(f"ATR HTF: {atr_htf}, ATR LTF: {atr_ltf}")

# حداقل: 50 کندل HTF, 100 کندل LTF
# ATR نباید صفر باشد
```

### مشکل: همه gates fail می‌شوند

```python
# آستانه‌ها را موقتاً کاهش دهید
test_config = update_config({
    "thresholds": {
        "ZQS_min": 0.4,
        "FVG_min_atr": 0.1,
        "EntryScore": 0.5,
        "ConfluenceScore": 0.45
    }
})
```

### مشکل: Position size خیلی کوچک

```python
# بررسی
print(f"ATR%: {atr_pct}")
print(f"Countertrend: {countertrend}")
print(f"Risk policy: {risk_policy.max_risk_per_trade}")

# اگر countertrend=True → size × 0.5
# اگر atr_pct خیلی بزرگ → size کوچک
```

---

## 📊 لاگ نمونه

```json
{
  "sym": "BTCUSDT",
  "tf": "M1",
  "scores": {
    "entry": 0.71,
    "conf": 0.58,
    "SMC_ZQS": 0.66,
    "FVG_ATR": 0.19,
    "LIQ": 1
  },
  "gates": {
    "rsi_macd": true,
    "smc": true,
    "sentiment": true,
    "liquidity": true,
    "final": true
  },
  "risk": {
    "atr_pct": 0.021,
    "size": 0.08,
    "countertrend": false
  }
}
```

---

## 🧪 تست سریع

```bash
# تست همه ماژول‌های SMC
pytest backend/tests/test_smc_*.py -v

# تست یک ماژول خاص
pytest backend/tests/test_smc_structure.py -v

# اجرای مثال کامل
python backend/examples/smc_integration_example.py
```

---

## 📚 مراجع بیشتر

- **راهنمای کامل**: `SMC_INTEGRATION_GUIDE.md`
- **خلاصه پروژه**: `SMC_INTEGRATION_SUMMARY.md`
- **Deployment Checklist**: `SMC_DEPLOYMENT_CHECKLIST.md`
- **کد نمونه**: `backend/examples/smc_integration_example.py`

---

## 💡 نکات مهم

1. **همیشه بررسی کنید**: `gates["final"] == True` قبل از ورود
2. **لاگ کنید**: هر تصمیم را برای troubleshooting
3. **Backtest**: قبل از Live حتماً A/B test انجام دهید
4. **Monitoring**: KPIs را روزانه بررسی کنید
5. **Rollback plan**: همیشه آماده برگشت باشید

---

## 🎯 پیوند‌های سریع

| نیاز | فایل | خط |
|------|------|-----|
| محاسبه SMC | `backend/pipeline/smc_features.py` | L8-48 |
| امتیازدهی | `backend/core/scoring.py` | L35-76 |
| گیت‌گذاری | `backend/core/gating.py` | L106-177 |
| مدیریت ریسک | `backend/core/risk.py` | L39-85 |
| تنظیمات | `backend/core/config.py` | L13-87 |

---

*نسخه: 1.0.0 | آخرین به‌روزرسانی: 2025-10-07*
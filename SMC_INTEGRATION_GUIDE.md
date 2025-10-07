# 🎯 SMC Integration Guide - Project-X

## خلاصه اجرایی

یکپارچگی **Smart Money Concepts (SMC)** در سیستم معاملاتی Project-X با موفقیت کامل شد. این یکپارچگی:

- ✅ **بدون شکستن منطق فعلی**: GA/RL + Risk Engine + Gating + Parity + FastAPI
- ✅ **کاملاً الگوریتمیک**: بدون ری‌پینت (No Repaint)
- ✅ **قابل تنظیم**: وزن‌ها و آستانه‌های قابل بهینه‌سازی با GA/RL
- ✅ **تست‌شده**: شامل تست‌های جامع برای تمام ماژول‌ها
- ✅ **قابل مانیتورینگ**: لاگ‌های ساختاریافته برای عیب‌یابی

---

## 📂 ساختار فایل‌های ایجاد‌شده

```
backend/
├── smc/                              # ماژول‌های اصلی SMC
│   ├── __init__.py                  # صادرات ماژول
│   ├── structure.py                 # Pivots, HH/HL/LH/LL, BOS/CHoCH
│   ├── fvg.py                       # Fair Value Gap با نرمال‌سازی ATR
│   ├── zones.py                     # Order Blocks, Zone Quality Score
│   ├── liquidity.py                 # Equal High/Low clusters
│   └── entries.py                   # S/D Flip + Equilibrium entry
│
├── pipeline/                         # فیچر‌های یکپارچه
│   ├── __init__.py
│   └── smc_features.py              # تجمیع SMC features (HTF+LTF)
│
├── core/                             # هسته سیستم
│   ├── config.py                    # تنظیمات با SMC weights/thresholds
│   ├── scoring.py                   # امتیازدهی با SMC
│   ├── gating.py                    # چندلایه فیلترینگ
│   └── risk.py                      # مدیریت ریسک + countertrend sizing
│
├── tests/                            # تست‌های جامع
│   ├── test_smc_structure.py        # تست BOS/CHoCH/Pivots
│   ├── test_smc_fvg_zones.py        # تست FVG و Zone Quality
│   └── test_smc_entries.py          # تست Flip + Equilibrium + Liquidity
│
└── examples/                         # مثال‌های کاربردی
    └── smc_integration_example.py   # پایپ‌لاین کامل End-to-End
```

---

## 🔗 نقاط اتصال به سیستم فعلی

### 1️⃣ **Feature Aggregation** (پایپ‌لاین داده)

```python
from backend.pipeline.smc_features import compute_smc_features

# در جایی که کندل‌های HTF و LTF آماده است:
smc = compute_smc_features(
    htf=htf_candles,      # Higher timeframe (e.g., 15m)
    ltf=ltf_candles,      # Lower timeframe (e.g., 1m)
    atr_htf=atr_15m,
    atr_ltf=atr_1m
)

# خروجی:
# {
#   "HTF_TREND": 1,      # -1=down, 0=neutral, 1=up
#   "FVG_ATR": 0.23,     # FVG size relative to ATR
#   "SMC_ZQS": 0.68,     # Zone Quality Score (0..1)
#   "LIQ_NEAR": 1        # Liquidity cluster nearby (0 or 1)
# }
```

### 2️⃣ **Scoring** (امتیازدهی)

```python
from backend.core.scoring import compute_entry_score
from backend.core.config import get_config

config = get_config()

# سیگنال‌های سنتی
signals = {
    "RSI": 0.55,
    "MACD": 0.6,
    "Sentiment": 0.3,
    "SAR": 0.7
}

# محاسبه امتیاز نهایی (با SMC)
entry_score = compute_entry_score(
    signals=signals,
    weights=config.weights.model_dump(),
    smc_features=smc
)
```

### 3️⃣ **Gating** (فیلترینگ چندلایه)

```python
from backend.core.gating import final_gate

gate_results = final_gate(
    rsi=55.0,
    macd_hist=0.1,
    sentiment=0.3,
    smc=smc,
    direction="LONG",
    entry_score=entry_score,
    conf_score=conf_score,
    thresholds=config.thresholds.model_dump()
)

# خروجی:
# {
#   "rsi_macd": True,
#   "sentiment": True,
#   "smc": True,
#   "confluence": True,
#   "liquidity": True,
#   "final": True  # ✅ همه گیت‌ها پاس شدند
# }

if gate_results["final"]:
    # ورود به معامله مجاز است
    pass
```

### 4️⃣ **Risk Management** (مدیریت ریسک)

```python
from backend.core.risk import (
    position_size_with_policy,
    is_countertrend,
    RiskPolicy
)

# تشخیص countertrend
countertrend = is_countertrend("LONG", smc["HTF_TREND"])

# محاسبه سایز با احتساب countertrend
risk_policy = RiskPolicy(
    max_risk_per_trade=0.02,
    countertrend_reduction=0.5
)

size = position_size_with_policy(
    equity=10000.0,
    atr_pct=0.021,
    risk_policy=risk_policy,
    countertrend=countertrend,      # اگر True باشد، سایز × 0.5
    news_high_impact=False
)
```

---

## ⚙️ تنظیمات (Configuration)

### وزن‌های پیش‌فرض

```python
{
  "RSI": 0.15,
  "MACD": 0.15,
  "SMC_ZQS": 0.25,      # وزن بالا برای کیفیت زون SMC
  "LIQ_GRAB": 0.10,
  "FVG_ATR": 0.10,
  "Sentiment": 0.15,
  "SAR": 0.10
}
```

### آستانه‌های پیش‌فرض

```python
{
  "EntryScore": 0.65,         # حداقل امتیاز ورود
  "ConfluenceScore": 0.55,    # حداقل همگرایی
  "ZQS_min": 0.55,            # حداقل Zone Quality Score
  "FVG_min_atr": 0.15         # حداقل FVG به نسبت ATR
}
```

### بهینه‌سازی با GA/RL

این پارامترها قابل تنظیم هستند:

```python
from backend.core.config import update_config

# برای GA: تست ژن‌های مختلف
new_config = update_config({
    "weights": {"SMC_ZQS": 0.30, "LIQ_GRAB": 0.12},
    "thresholds": {"ZQS_min": 0.60}
})

# برای RL: تنظیم پویا بر اساس reward
# ACTIONS = [..., "increase_ZQS_min", "decrease_ZQS_min"]
```

---

## 🧪 اجرای تست‌ها

```bash
# نصب pytest (اگر نصب نیست)
pip install pytest

# اجرای همه تست‌های SMC
pytest backend/tests/test_smc_*.py -v

# اجرای یک تست خاص
pytest backend/tests/test_smc_structure.py::test_pivots_basic -v

# اجرای مثال یکپارچگی کامل
python backend/examples/smc_integration_example.py
```

### پوشش تست‌ها

- ✅ `test_smc_structure.py`: Pivots, HH/HL, BOS/CHoCH (7 تست)
- ✅ `test_smc_fvg_zones.py`: FVG, Zone Quality, Mitigation (8 تست)
- ✅ `test_smc_entries.py`: SD Flip, Equilibrium, Liquidity (7 تست)

---

## 🔍 مانیتورینگ و لاگ‌ها

هر تصمیم معاملاتی با این فرمت لاگ می‌شود:

```json
{
  "sym": "BTCUSDT",
  "tf": "M1",
  "ts": 1696789012,
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
    "countertrend": true,
    "circuit": false
  }
}
```

این لاگ‌ها را می‌توانید در Grafana/Elasticsearch تجزیه‌وتحلیل کنید.

---

## 🚀 رول‌اوت مرحله‌ای

### مرحله 1: Backtest A/B

```bash
# بدون SMC
python backtest.py --config base_config.json

# با SMC
python backtest.py --config smc_config.json

# مقایسه KPI‌ها:
# - Sharpe Ratio
# - Win Rate
# - Max Drawdown
```

### مرحله 2: Paper Trading

```python
# در FastAPI main.py
config = get_config()
if config.smc.enabled:
    # استفاده از پایپ‌لاین SMC
    smc = compute_smc_features(...)
else:
    # پایپ‌لاین قدیمی
    smc = None
```

**Feature Flag**: `flags.smc_enabled = true/false`

### مرحله 3: Live (Gradual)

1. **هفته 1**: فقط لاگ کردن (بدون اجرا)
2. **هفته 2**: 10% حجم معاملات
3. **هفته 3**: 50% حجم معاملات
4. **هفته 4**: 100% (اگر KPIs بهتر بود)

---

## 📊 KPIs برای ارزیابی

| Metric | قبل از SMC | بعد از SMC | هدف |
|--------|-----------|-----------|------|
| Win Rate | 52% | ? | >55% |
| Sharpe Ratio | 1.2 | ? | >1.5 |
| Max Drawdown | -15% | ? | <-12% |
| Profit Factor | 1.8 | ? | >2.0 |
| Avg R:R | 1.5 | ? | >2.0 |

---

## 🛠️ عیب‌یابی رایج

### مشکل: SMC features همه صفر هستند

**راه‌حل**:
- بررسی کنید که `htf_candles` و `ltf_candles` حداقل 50 کندل داشته باشند
- ATR نباید صفر باشد
- Log کنید: `logger.debug("SMC input", htf_len=len(htf), ltf_len=len(ltf), atr_htf=atr_htf)`

### مشکل: همه گیت‌ها fail می‌شوند

**راه‌حل**:
- آستانه‌ها را موقتاً کاهش دهید: `ZQS_min=0.4`, `FVG_min_atr=0.1`
- بررسی کنید که `smc["LIQ_NEAR"]` برای بازارهای بی‌نقدینگی همیشه 0 نباشد

### مشکل: Countertrend همیشه True است

**راه‌حل**:
- HTF باید حداقل 100 کندل برای تشخیص BOS داشته باشد
- بررسی کنید: `events = detect_bos_choc(tags); print(events[-5:])`

---

## 📝 چک‌لیست قبل از Production

- [ ] همه تست‌ها پاس شده‌اند
- [ ] Backtest A/B انجام شده (حداقل 6 ماه داده)
- [ ] Paper trading موفق بوده (حداقل 2 هفته)
- [ ] لاگ‌ها در Grafana/Elasticsearch مانیتور می‌شوند
- [ ] Feature flag برای on/off کردن وجود دارد
- [ ] Rollback plan آماده است
- [ ] اعضای تیم آموزش دیده‌اند
- [ ] Documentation به‌روز شده

---

## 🎓 منابع بیشتر

- **SMC Concepts**: [Smart Money Concepts Explained](https://www.youtube.com/...)
- **Code Examples**: `backend/examples/smc_integration_example.py`
- **API Docs**: `/docs` (FastAPI Swagger)
- **Test Coverage**: `pytest --cov=backend.smc`

---

## 📞 پشتیبانی

سوالات؟ مشکلی پیش آمد؟

- **GitHub Issues**: [Project-X/issues](https://github.com/...)
- **Slack**: #project-x-trading
- **Email**: dev@project-x.com

---

## ✅ خلاصه یکپارچگی

```
✅ ماژول‌های SMC ساخته شد (6 فایل)
✅ Pipeline features اضافه شد
✅ Scoring/Gating/Risk به‌روز شد
✅ Config با weights/thresholds آماده است
✅ تست‌های جامع نوشته شد (22 تست)
✅ مثال End-to-End آماده است
✅ Documentation کامل شد
```

**🎉 SMC Integration: COMPLETE!**

---

*آخرین به‌روزرسانی: 2025-10-07*
*نسخه: 1.0.0*
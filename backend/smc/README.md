# 📊 Smart Money Concepts (SMC) Module

## نمای کلی

این ماژول **Smart Money Concepts** را به‌صورت کاملاً الگوریتمیک و بدون ری‌پینت پیاده‌سازی می‌کند.

## ماژول‌ها

### 1. `structure.py` - تشخیص ساختار بازار

```python
from backend.smc.structure import pivots, hh_hl_lh_ll, detect_bos_choc

# تشخیص pivot points
piv = pivots(candles, left=2, right=2)

# تگ‌گذاری HH/HL/LH/LL
tags = hh_hl_lh_ll(piv, candles)

# تشخیص BOS و CHoCH
events = detect_bos_choc(tags)
```

**خروجی**: لیست رویدادهای BOS (Break of Structure) و CHoCH (Change of Character)

---

### 2. `fvg.py` - Fair Value Gaps

```python
from backend.smc.fvg import detect_fvg

# تشخیص FVG با فیلتر ATR
fvgs = detect_fvg(candles, min_atr_frac=0.1, atr=atr_value)
```

**خروجی**: لیست FVG‌ها با نوع (bull/bear)، gap range، و سایز

---

### 3. `zones.py` - Order Blocks و Zone Quality

```python
from backend.smc.zones import (
    last_opposing_candle_before_impulse,
    is_mitigated,
    zone_quality
)

# تشخیص Order Block
ob = last_opposing_candle_before_impulse(candles, i_impulse=50, direction='up')

# بررسی mitigation
mitigated = is_mitigated(ob, candles)

# محاسبه کیفیت زون
quality = zone_quality(
    bos_strength=1.0,
    fvg_size_atr=0.5,
    momentum_bars=4,
    mitigated=False
)
```

**خروجی**: Zone Quality Score (0..1)

---

### 4. `liquidity.py` - تشخیص نقدینگی

```python
from backend.smc.liquidity import equal_levels

# تشخیص equal highs
eq_highs = list(equal_levels(candles, kind='high', tol_frac=0.02))

# تشخیص equal lows
eq_lows = list(equal_levels(candles, kind='low', tol_frac=0.02))
```

**خروجی**: Liquidity clusters (Equal High/Low levels)

---

### 5. `entries.py` - منطق ورود

```python
from backend.smc.entries import sd_flip_valid, equilibrium_entry

# بررسی Supply/Demand flip
valid = sd_flip_valid(zone, close_price=50000, liquidity_grab=True)

# محاسبه نقطه ورود equilibrium
entry = equilibrium_entry(zone, spread=0.5)
```

**خروجی**: نقطه ورود بهینه با احتساب spread

---

## استفاده در Pipeline

```python
from backend.pipeline.smc_features import compute_smc_features

# محاسبه همه فیچرهای SMC
smc = compute_smc_features(
    htf=candles_15m,
    ltf=candles_1m,
    atr_htf=atr_15m,
    atr_ltf=atr_1m
)

# خروجی:
# {
#   "HTF_TREND": 1,      # بایاس HTF
#   "FVG_ATR": 0.23,     # سایز FVG
#   "SMC_ZQS": 0.68,     # کیفیت زون
#   "LIQ_NEAR": 1        # نقدینگی نزدیک
# }
```

---

## اصول طراحی

### ✅ بدون ری‌پینت (No Repaint)
- همه تشخیص‌ها بر مبنای کندل‌های **بسته‌شده**
- هیچ نگاه به آینده (lookahead bias) نداریم
- Parity کامل بین backtest و live

### ✅ الگوریتمیک و قابل تکرار
- قوانین مشخص و deterministic
- بدون تصمیم‌گیری دستی
- قابل بهینه‌سازی با GA/RL

### ✅ نرمال‌سازی با ATR
- FVG و zone sizes relative به ATR
- مقایسه‌پذیر در تمام سمبل‌ها
- کاهش false signals در نوسانات بالا

---

## تست‌ها

```bash
# اجرای همه تست‌های SMC
pytest backend/tests/test_smc_*.py -v

# تست ساختار
pytest backend/tests/test_smc_structure.py -v

# تست FVG و zones
pytest backend/tests/test_smc_fvg_zones.py -v

# تست entries
pytest backend/tests/test_smc_entries.py -v
```

---

## مثال کامل

مثال End-to-End در: `backend/examples/smc_integration_example.py`

```bash
python backend/examples/smc_integration_example.py
```

---

## پارامترهای قابل تنظیم

| پارامتر | پیش‌فرض | شرح |
|---------|---------|-----|
| `left`, `right` | 2, 2 | تعداد کندل‌های pivot |
| `min_atr_frac` | 0.1 | حداقل FVG به نسبت ATR |
| `tol_frac` | 0.02 | تلرانس برای equal levels |
| `ZQS_min` | 0.55 | حداقل Zone Quality Score |
| `FVG_min_atr` | 0.15 | حداقل FVG برای ورود |

این پارامترها در `backend/core/config.py` قابل تنظیم هستند.

---

## مستندات کامل

- **راهنمای یکپارچگی**: `/workspace/SMC_INTEGRATION_GUIDE.md`
- **خلاصه پروژه**: `/workspace/SMC_INTEGRATION_SUMMARY.md`
- **مرجع سریع**: `/workspace/SMC_QUICK_REFERENCE.md`

---

## پشتیبانی

سوالات یا مشکلات؟
- **Issues**: GitHub Issues
- **Docs**: مستندات فوق
- **Examples**: `backend/examples/`

---

*نسخه: 1.0.0 | تاریخ: 2025-10-07*
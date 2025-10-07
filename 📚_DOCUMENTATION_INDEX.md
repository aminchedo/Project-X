# 📚 Documentation Index - SMC + AI Controls Frontend
# فهرست مستندات - فرانت‌اند کنترل‌های SMC و هوش مصنوعی

## 🎯 Quick Navigation / دسترسی سریع

### For Quick Start / برای شروع سریع
📄 **`QUICK_START.md`**
- Quick reference guide
- راهنمای مرجع سریع
- Setup, usage examples, troubleshooting
- راه‌اندازی، نمونه‌های استفاده، رفع مشکل

### For Complete Overview / برای دید کلی کامل
📄 **`README_SMC_AI_FRONTEND.md`**
- Main README (English + Persian)
- README اصلی (انگلیسی + فارسی)
- Features, quick start, file structure
- ویژگی‌ها، شروع سریع، ساختار فایل‌ها

### For Implementation Details / برای جزئیات پیاده‌سازی
📄 **`IMPLEMENTATION_SUMMARY.md`**
- Complete implementation summary
- خلاصه کامل پیاده‌سازی
- File list, features, test results, next steps
- لیست فایل‌ها، ویژگی‌ها، نتایج تست، مراحل بعدی

📄 **`SMC_AI_FRONTEND_IMPLEMENTATION.md`**
- Detailed implementation guide
- راهنمای جزئی پیاده‌سازی
- Usage examples, backend integration, architecture
- نمونه‌های استفاده، یکپارچه‌سازی با بک‌اند، معماری

### For Integration / برای یکپارچه‌سازی
📄 **`src/docs/SMC_AI_FRONTEND_INTEGRATION.md`**
- Technical integration guide
- راهنمای فنی یکپارچه‌سازی
- API usage, chart integration, WebSocket setup
- استفاده از API، یکپارچه‌سازی چارت، راه‌اندازی WebSocket

### Visual Summary / خلاصه بصری
📄 **`IMPLEMENTATION_COMPLETE.txt`**
- Visual ASCII summary
- خلاصه بصری ASCII
- Quick overview of all deliverables
- دید سریع از همه تحویلی‌ها

---

## 📂 File Categories / دسته‌بندی فایل‌ها

### 🎨 Source Code / کد منبع
```
src/
├── state/
│   ├── observable.ts          ← Observable pattern
│   ├── strategyStore.ts       ← Strategy state
│   └── useStrategy.ts         ← React hook
├── services/
│   └── aiApi.ts               ← AI API client
├── components/
│   ├── NewsBanner.tsx         ← News/regime banner
│   ├── SMCOverlayToggles.tsx  ← SMC controls
│   ├── StrategyHUD.tsx        ← Strategy HUD
│   └── SMCDemoPanel.tsx       ← Live demo panel
├── pages/
│   └── AIControls.tsx         ← AI controls page
└── __tests__/
    └── state/
        └── strategyStore.test.ts  ← Unit tests
```

### 📖 Documentation / مستندات
```
/workspace/
├── QUICK_START.md                      ← Quick reference
├── README_SMC_AI_FRONTEND.md           ← Main README
├── IMPLEMENTATION_SUMMARY.md           ← Complete summary
├── SMC_AI_FRONTEND_IMPLEMENTATION.md   ← Detailed guide
├── IMPLEMENTATION_COMPLETE.txt         ← Visual summary
└── src/docs/
    └── SMC_AI_FRONTEND_INTEGRATION.md  ← Integration guide
```

---

## 🎯 What to Read First / اول چه بخوانید

### If you want to... / اگر می‌خواهید...

**Get started quickly:**
→ Read `QUICK_START.md`

**Understand what was built:**
→ Read `README_SMC_AI_FRONTEND.md`

**See complete deliverables:**
→ Read `IMPLEMENTATION_SUMMARY.md`

**Integrate with your code:**
→ Read `src/docs/SMC_AI_FRONTEND_INTEGRATION.md`

**Understand implementation:**
→ Read `SMC_AI_FRONTEND_IMPLEMENTATION.md`

**See visual overview:**
→ Read `IMPLEMENTATION_COMPLETE.txt`

---

## 🔍 Search by Topic / جستجو بر اساس موضوع

### Observable Pattern
- `src/state/observable.ts` (implementation)
- `IMPLEMENTATION_SUMMARY.md` (architecture)
- `SMC_AI_FRONTEND_IMPLEMENTATION.md` (usage)

### Strategy State Management
- `src/state/strategyStore.ts` (implementation)
- `src/state/useStrategy.ts` (React hook)
- `src/__tests__/state/strategyStore.test.ts` (tests)
- `QUICK_START.md` (examples)

### AI Controls
- `src/pages/AIControls.tsx` (implementation)
- `src/services/aiApi.ts` (API client)
- `SMC_AI_FRONTEND_IMPLEMENTATION.md` (backend integration)

### RTL Support
- `src/state/strategyStore.ts` (rtl flag)
- `src/components/*` (dir attribute usage)
- `QUICK_START.md` (enable/disable)

### Testing
- `src/__tests__/state/strategyStore.test.ts` (tests)
- `IMPLEMENTATION_SUMMARY.md` (test results)

---

## 📊 Documentation Stats / آمار مستندات

| Type / نوع | Count / تعداد | Language / زبان |
|-----------|--------------|----------------|
| README files | 2 | EN + FA |
| Implementation guides | 2 | EN |
| Integration guides | 1 | EN + FA |
| Quick reference | 1 | EN + FA |
| Visual summaries | 1 | EN + FA |
| **Total** | **7 files** | **Bilingual** |

---

## 🚀 Getting Started Workflow / گردش کار شروع

1. **Read** `QUICK_START.md` for setup
2. **Review** `README_SMC_AI_FRONTEND.md` for overview
3. **Check** `IMPLEMENTATION_COMPLETE.txt` for deliverables
4. **Explore** source files in `src/`
5. **Integrate** using `src/docs/SMC_AI_FRONTEND_INTEGRATION.md`
6. **Test** using `npm test`

---

## 📝 Notes / یادداشت‌ها

- All documentation is up-to-date as of implementation
- Code examples are tested and working
- Both English and Persian documentation provided
- Integration guides include backend API specs

---

## ✅ Documentation Checklist / چک‌لیست مستندات

- [x] Quick start guide
- [x] Main README (bilingual)
- [x] Complete implementation summary
- [x] Detailed implementation guide
- [x] Integration guide
- [x] Visual summary
- [x] Code comments
- [x] Test documentation
- [x] Usage examples
- [x] Backend API specs

---

**All documentation complete and ready to use!**  
**تمام مستندات کامل و آماده استفاده است!**

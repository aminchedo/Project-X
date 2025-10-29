این پکیج استخراج‌شده از پروژه BolT (Crepto_AiLastChance-main) است.

هدف این خروجی:
- آوردن بهترین بخش‌های قابل‌استفاده در پروژه «پروژه ایکس» (کنسول ترید زنده)
- بدون فایل‌های تست و بدون چیزهای صرفاً نمایشی که تکراری بودند

ساختار داخل src شامل:
1. contexts/FeatureFlagContext.tsx
   - سیستم مدیریت Feature Flag پیشرفته شامل rollout %, dependency, gating
   - می‌تونیم این رو در پروژه ایکس کنار Zustand سراسری اضافه کنیم

2. hooks/
   - useFeatureFlags.ts : هوک مصرف FeatureFlagContext
   - useCryptoData.ts   : هاب گرفتن و هماهنگ‌کردن دیتا مارکت

3. services/
   - لایه سرویس‌های مارکت، پرتفوی، اورکستریتور دیتا، news، sentiment، whale tracking، و Prediction AI
   - شامل fallback و error tracking، rate limiting، cache و retry
   - این سرویس‌ها می‌تونن پشت FastAPI فعلی ما قرار بگیرن یا به صورت local orchestrator عمل کنن

4. components/
   - Dashboard/EnhancedDashboard.tsx و سایر ماژول‌های داشبورد و مارکت (MarketTicker, CryptoDashboard, WhaleFeed, NewsPanel, SentimentDashboard, etc.)
   - TrainingDashboard/* و AIPredictor.tsx برای UI آموزش مدل و پیش‌بینی
   - Portfolio.tsx و RiskManagement/* برای نمایش پرتفوی، ریسک و محاسبات مدیریت ریسک
   - FeatureFlagManager.tsx و FeatureGate.tsx برای کنترل و تست فیچر فلگ‌ها در UI
   - Legal/* برای بنرهای هشدار و دیسکلایمر تطابق مقررات

   اینها برای مهاجرت UI و ماژول‌های product-ready عالی هستند و می‌توانند بدون mock مستقیم، به Zustand ما متصل شوند

5. types/
   - انواع داده‌های مارکت و اینترفیس‌ها (crypto.types.ts و index.ts)
   - باید با types فعلی پروژه ایکس merge شوند، نه جایگزین کامل

6. utils/
   - ابزار تحلیل تکنیکال، خطایابی، متریک‌ها و مانیتورینگ (technicalIndicators.ts ،aiModel.ts ،errorHandler.ts ،prometheus-client.ts)
   - این‌ها می‌توانند هم در FE و هم برای telemetry داخلی پروژه ایکس استفاده شوند

مهم:
- فایل‌های تست (test/ و __tests__) عمداً حذف شدند
- state قدیمی محلی (useState در App.tsx پروژه BolT) منتقل نشده چون در پروژه ایکس ما از Zustand سراسری استفاده می‌کنیم
- Router و Electron code منتقل نشدن چون پروژه ایکس الان Router خودش و backend FastAPI خودش رو دارد

مرحله بعد:
- این فولدر رو بنداز داخل repo پروژه ایکس (مثلاً پوشه bolt_extract/) و بعد شروع کنیم تدریجاً:
  1. اتصال FeatureFlagContext به بالاترین لایه AppLayout
  2. تطبیق Portfolio.tsx و RiskManagement/* با Zustand و داده واقعی backend ما
  3. آوردن TrainingDashboard/AIPredictor در مسیر /training در Router پروژه ایکس
  4. مهاجرت سرویس‌های data orchestration به جای mock های دستی/پراکنده
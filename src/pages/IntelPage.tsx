import React from "react";
import { FeatureGate } from "../bolt_import/components/FeatureGate";
// Temporarily disabled due to missing dependencies in Bolt export
// import MarketTicker from "../bolt_import/components/MarketTicker";
// import SentimentDashboard from "../bolt_import/components/crypto/SentimentDashboard";
// import NewsPanel from "../bolt_import/components/crypto/NewsPanel";
// import WhaleFeed from "../bolt_import/components/crypto/WhaleFeed";
// import CryptoDashboard from "../bolt_import/components/crypto/CryptoDashboard";

/**
 * Market Intelligence page - gated by feature flag
 * Provides market sentiment, news, whale tracking, and crypto analytics
 *
 * NOTE: Some Bolt components are temporarily disabled due to missing
 * dependencies (apiConfig) in the Bolt export.
 */
export function IntelPage() {
  return (
    <FeatureGate featureId="market-sentiment">
      <div dir="rtl" className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">اطلاعات بازار</h1>

          <div className="bg-slate-800/30 backdrop-blur-lg p-8 rounded-xl border border-slate-700/50 shadow-lg">
            <div className="text-center text-slate-300 space-y-4">
              <p className="text-lg">صفحه اطلاعات بازار در حال توسعه است.</p>
              <p className="text-sm text-slate-400">
                بخش‌های تحلیل احساسات، اخبار، و ردیابی نهنگ‌ها به زودی اضافه خواهند شد.
              </p>
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                <p>
                  <strong>توجه:</strong> برخی کامپوننت‌های Bolt به دلیل وابستگی‌های ناقص موقتاً غیرفعال شده‌اند.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}

import React from "react";
import { FeatureGate } from "../bolt_import/components/FeatureGate";
import MarketTicker from "../bolt_import/components/MarketTicker";
import SentimentDashboard from "../bolt_import/components/crypto/SentimentDashboard";
import NewsPanel from "../bolt_import/components/crypto/NewsPanel";
import WhaleFeed from "../bolt_import/components/crypto/WhaleFeed";
import CryptoDashboard from "../bolt_import/components/crypto/CryptoDashboard";

export function IntelPage() {
  return (
    <FeatureGate featureId="market-intel">
      <div dir="rtl" className="grid gap-4 p-4">
        <MarketTicker />
        <SentimentDashboard />
        <NewsPanel />
        <WhaleFeed />
        <CryptoDashboard />
      </div>
    </FeatureGate>
  );
}

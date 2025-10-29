import React from "react";
import { FeatureGate } from "../bolt_import/components/FeatureGate";
import BacktestingModule from "../bolt_import/components/Backtesting/BacktestingModule";

/**
 * Backtesting page - gated by feature flag
 * Provides strategy backtesting and performance analysis
 */
export function BacktestPage() {
  return (
    <FeatureGate featureId="backtesting">
      <div dir="rtl" className="p-4">
        <BacktestingModule />
      </div>
    </FeatureGate>
  );
}

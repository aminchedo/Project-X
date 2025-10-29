import React from "react";
import { FeatureGate } from "../bolt_import/components/FeatureGate";
import BacktestingModule from "../bolt_import/components/Backtesting/BacktestingModule";

export function BacktestPage() {
  return (
    <FeatureGate featureId="backtesting-module">
      <div dir="rtl" className="p-4">
        <BacktestingModule />
      </div>
    </FeatureGate>
  );
}

import React, { useState } from "react";
import { FeatureGate } from "../bolt_import/components/FeatureGate";
import { ConsentGate } from "../bolt_import/components/Legal/ConsentGate";
import BacktestingModule from "../bolt_import/components/Backtesting/BacktestingModule";
import { useNavigate } from "react-router-dom";

/**
 * Backtesting page - gated by feature flag and consent
 * Provides strategy backtesting and performance analysis
 */
export function BacktestPage() {
  const [consented, setConsented] = useState(false);
  const navigate = useNavigate();

  const handleConsent = () => {
    setConsented(true);
  };

  const handleDecline = () => {
    navigate('/');
  };

  return (
    <FeatureGate featureId="backtesting">
      <ConsentGate
        feature="Strategy Backtesting"
        description="This feature allows you to backtest trading strategies using historical data. Backtesting results are based on past performance and do not guarantee future results. Always consider multiple factors when evaluating strategies."
        riskLevel="high"
        onConsent={handleConsent}
        onDecline={handleDecline}
      >
        <div dir="rtl" className="p-4">
          <BacktestingModule />
        </div>
      </ConsentGate>
    </FeatureGate>
  );
}

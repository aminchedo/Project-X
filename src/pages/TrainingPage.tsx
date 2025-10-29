import React, { useState } from "react";
import { FeatureGate } from "../bolt_import/components/FeatureGate";
import { ConsentGate } from "../bolt_import/components/Legal/ConsentGate";
import TrainingDashboard from "../bolt_import/components/TrainingDashboard/TrainingDashboard";
import { useNavigate } from "react-router-dom";

/**
 * Training Dashboard page - gated by feature flag and consent
 * Provides AI model training interface and metrics
 */
export function TrainingPage() {
  const [consented, setConsented] = useState(false);
  const navigate = useNavigate();

  const handleConsent = () => {
    setConsented(true);
  };

  const handleDecline = () => {
    navigate('/');
  };

  return (
    <FeatureGate featureId="training-dashboard">
      <ConsentGate
        feature="AI Training Dashboard"
        description="This feature allows you to train AI models for trading predictions. Training involves computational resources and may produce predictions that should not be used as sole basis for trading decisions. Always validate AI predictions with other analysis methods."
        riskLevel="high"
        onConsent={handleConsent}
        onDecline={handleDecline}
      >
        <div dir="rtl" className="p-4">
          <TrainingDashboard />
        </div>
      </ConsentGate>
    </FeatureGate>
  );
}

import React from "react";
import { FeatureGate } from "../bolt_import/components/FeatureGate";
import TrainingDashboard from "../bolt_import/components/TrainingDashboard/TrainingDashboard";

export function TrainingPage() {
  return (
    <FeatureGate featureId="training-dashboard">
      <div dir="rtl" className="p-4">
        <TrainingDashboard />
      </div>
    </FeatureGate>
  );
}

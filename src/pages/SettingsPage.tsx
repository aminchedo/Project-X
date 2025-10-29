import React from "react";
import { FeatureGate } from "../bolt_import/components/FeatureGate";
import SettingsPanel from "../bolt_import/components/Settings/SettingsPanel";

export function SettingsPage() {
  return (
    <FeatureGate featureId="settings-panel">
      <div dir="rtl" className="p-4">
        <SettingsPanel />
      </div>
    </FeatureGate>
  );
}

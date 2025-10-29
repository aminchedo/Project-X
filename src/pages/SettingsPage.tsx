import React from "react";
import { FeatureGate } from "../bolt_import/components/FeatureGate";
import SettingsPanel from "../bolt_import/components/Settings/SettingsPanel";

/**
 * Settings page - gated by feature flag
 * Provides application settings and configuration
 */
export function SettingsPage() {
  return (
    <FeatureGate featureId="alerts-system">
      <div dir="rtl" className="p-4">
        <SettingsPanel />
      </div>
    </FeatureGate>
  );
}

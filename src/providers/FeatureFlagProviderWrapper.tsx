import React from "react";
import { FeatureFlagProvider } from "../bolt_import/contexts/FeatureFlagContext";

/**
 * Wraps the entire app with the Bolt feature flag system.
 * This provides global feature flag capabilities to control
 * which features are enabled/disabled across the application.
 */
export function FeatureFlagProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagProvider>
      {children}
    </FeatureFlagProvider>
  );
}

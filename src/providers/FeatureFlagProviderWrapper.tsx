import React from "react";
import { FeatureFlagProvider } from "../bolt_import/contexts/FeatureFlagContext";

/**
 * Wraps the entire app with the Bolt feature flag system.
 * This provides global capability toggles for all features.
 */
export function FeatureFlagProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagProvider>
      {children}
    </FeatureFlagProvider>
  );
}

import React, { ReactNode, useEffect, useState, useCallback, useMemo } from 'react';
import { useFeatureFlag } from '../contexts/FeatureFlagContext';
import { Lock, AlertTriangle, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react';

interface FeatureGateProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  showDisabledState?: boolean;
  disabledMessage?: string;
  className?: string;
  // Advanced options
  requireAll?: string[];
  requireAny?: string[];
  userGroups?: string[];
  environment?: string;
  rolloutPercentage?: number;
  // UI options
  showFeatureInfo?: boolean;
  showDependencies?: boolean;
  showRolloutInfo?: boolean;
}

interface FeatureGateState {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  dependencies: string[];
  missingDependencies: string[];
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  featureId,
  children,
  fallback = null,
  loadingComponent,
  errorComponent,
  showDisabledState = true,
  disabledMessage,
  className = '',
  requireAll = [],
  requireAny = [],
  userGroups = [],
  environment,
  rolloutPercentage,
  showFeatureInfo = false,
  showDependencies = false,
  showRolloutInfo = false
}) => {
  const { isEnabled, getFlag, userGroups: currentUserGroups, environment: currentEnvironment } = useFeatureFlag();
  const [state, setState] = useState<FeatureGateState>({
    isEnabled: false,
    isLoading: true,
    error: null,
    dependencies: [],
    missingDependencies: []
  });

  // Stabilize array dependencies using JSON stringify to prevent infinite re-renders
  const requireAllKey = useMemo(() => JSON.stringify(requireAll), [requireAll]);
  const requireAnyKey = useMemo(() => JSON.stringify(requireAny), [requireAny]);
  const userGroupsKey = useMemo(() => JSON.stringify(userGroups), [userGroups]);
  const currentUserGroupsKey = useMemo(() => JSON.stringify(currentUserGroups), [currentUserGroups]);

  const checkFeature = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Parse the stable keys back to arrays
      const requireAllArray = JSON.parse(requireAllKey);
      const requireAnyArray = JSON.parse(requireAnyKey);
      const userGroupsArray = JSON.parse(userGroupsKey);
      const currentUserGroupsArray = JSON.parse(currentUserGroupsKey);

      // Get feature flag details
      const flag = getFlag(featureId);
      if (!flag) {
        setState(prev => ({
          ...prev,
          isEnabled: false,
          isLoading: false,
          error: `Feature flag '${featureId}' not found`
        }));
        return;
      }

      // Check basic enablement
      const basicEnabled = isEnabled(featureId);

      // Check dependencies
      const dependencies = flag.dependencies || [];
      const missingDependencies = dependencies.filter(dep => !isEnabled(dep));

      // Check additional requirements
      const allRequiredEnabled = requireAllArray.every((req: string) => isEnabled(req));
      const anyOptionalEnabled = requireAnyArray.length === 0 || requireAnyArray.some((req: string) => isEnabled(req));

      // Check user groups
      const userGroupMatch = userGroupsArray.length === 0 ||
        userGroupsArray.some((group: string) => currentUserGroupsArray.includes(group));

      // Check environment
      const environmentMatch = !environment || environment === currentEnvironment;

      const finalEnabled = basicEnabled &&
        allRequiredEnabled &&
        anyOptionalEnabled &&
        userGroupMatch &&
        environmentMatch &&
        missingDependencies.length === 0;

      setState(prev => {
        // Only update state if values have actually changed
        if (prev.isEnabled === finalEnabled &&
          prev.isLoading === false &&
          prev.error === null &&
          JSON.stringify(prev.dependencies) === JSON.stringify(dependencies) &&
          JSON.stringify(prev.missingDependencies) === JSON.stringify(missingDependencies)) {
          return prev;
        }

        return {
          isEnabled: finalEnabled,
          isLoading: false,
          error: null,
          dependencies,
          missingDependencies
        };
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [featureId, requireAllKey, requireAnyKey, userGroupsKey, currentUserGroupsKey, environment, currentEnvironment, getFlag, isEnabled]);

  useEffect(() => {
    checkFeature();
  }, [checkFeature]);

  // Loading state
  if (state.isLoading) {
    return (
      <div className={className}>
        {loadingComponent || (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-400">Loading feature...</span>
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className={className}>
        {errorComponent || (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-red-400" size={20} />
              <span className="text-red-400 font-semibold">Feature Error</span>
            </div>
            <p className="text-red-300 text-sm mt-2">{state.error}</p>
          </div>
        )}
      </div>
    );
  }

  // Feature enabled - render children
  if (state.isEnabled) {
    return (
      <div className={className}>
        {children}
        {showFeatureInfo && (
          <FeatureInfo
            featureId={featureId}
            showDependencies={showDependencies}
            showRolloutInfo={showRolloutInfo}
            dependencies={state.dependencies}
          />
        )}
      </div>
    );
  }

  // Feature disabled - show fallback or disabled state
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  if (showDisabledState) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-800 p-6 ${className}`}>
        <FeatureDisabledState
          featureId={featureId}
          disabledMessage={disabledMessage}
          missingDependencies={state.missingDependencies}
          requireAll={requireAll}
          requireAny={requireAny}
        />
      </div>
    );
  }

  return null;
};

// Helper component for feature information
interface FeatureInfoProps {
  featureId: string;
  showDependencies: boolean;
  showRolloutInfo: boolean;
  dependencies: string[];
}

const FeatureInfo: React.FC<FeatureInfoProps> = ({
  featureId,
  showDependencies,
  showRolloutInfo,
  dependencies
}) => {
  const { getFlag } = useFeatureFlag();
  const flag = getFlag(featureId);

  if (!flag) return null;

  return (
    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
      <div className="flex items-center space-x-2 mb-2">
        <CheckCircle className="text-blue-400" size={16} />
        <span className="text-blue-400 text-sm font-medium">Feature Active</span>
      </div>

      {showDependencies && dependencies.length > 0 && (
        <div className="text-xs text-blue-300 mb-2">
          Dependencies: {dependencies.join(', ')}
        </div>
      )}

      {showRolloutInfo && flag.rolloutPercentage && (
        <div className="text-xs text-blue-300">
          Rollout: {flag.rolloutPercentage}%
        </div>
      )}
    </div>
  );
};

// Helper component for disabled state
interface FeatureDisabledStateProps {
  featureId: string;
  disabledMessage?: string;
  missingDependencies: string[];
  requireAll: string[];
  requireAny: string[];
}

const FeatureDisabledState: React.FC<FeatureDisabledStateProps> = ({
  featureId,
  disabledMessage,
  missingDependencies,
  requireAll,
  requireAny
}) => {
  const { getFlag } = useFeatureFlag();
  const flag = getFlag(featureId);

  return (
    <>
      <div className="flex items-center space-x-3 mb-4">
        <Lock className="text-gray-500" size={24} />
        <h3 className="text-lg font-semibold text-gray-400">
          {flag?.name || featureId} Disabled
        </h3>
      </div>

      <div className="text-center text-gray-500 py-6">
        <EyeOff size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">
          {disabledMessage || `This feature is currently disabled. Enable "${featureId}" in the feature flags to access this functionality.`}
        </p>

        {flag?.description && (
          <p className="text-sm text-gray-400 mb-4">{flag.description}</p>
        )}

        <div className="text-sm space-y-1">
          {missingDependencies.length > 0 && (
            <p className="text-red-400">
              Missing dependencies: {missingDependencies.join(', ')}
            </p>
          )}
          {requireAll.length > 0 && (
            <p className="text-yellow-400">
              Also requires: {requireAll.join(', ')}
            </p>
          )}
          {requireAny.length > 0 && (
            <p className="text-blue-400">
              Optional features: {requireAny.join(', ')}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

// Convenience wrappers for common patterns
export const FeatureGateSimple: React.FC<{
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ featureId, children, fallback }) => (
  <FeatureGate featureId={featureId} fallback={fallback}>
    {children}
  </FeatureGate>
);

export const FeatureGateWithDependencies: React.FC<{
  featureId: string;
  dependencies: string[];
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ featureId, dependencies, children, fallback }) => (
  <FeatureGate
    featureId={featureId}
    requireAll={dependencies}
    fallback={fallback}
    showDependencies={true}
  >
    {children}
  </FeatureGate>
);

export const FeatureGateExperimental: React.FC<{
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ featureId, children, fallback }) => (
  <FeatureGate
    featureId={featureId}
    fallback={fallback}
    showFeatureInfo={true}
    showRolloutInfo={true}
    disabledMessage="This experimental feature is not yet available."
  >
    {children}
  </FeatureGate>
);
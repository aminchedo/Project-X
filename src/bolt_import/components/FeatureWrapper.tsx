import React, { ReactNode } from 'react';
import { useFeature } from '../contexts/FeatureFlagContext';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface FeatureWrapperProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
  showDisabledState?: boolean;
  disabledMessage?: string;
  className?: string;
  requireAll?: string[]; // Array of feature IDs that must all be enabled
  requireAny?: string[]; // Array of feature IDs where at least one must be enabled
}

interface ConditionalFeatureWrapperProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface FeatureGroupWrapperProps {
  features: string[];
  mode: 'all' | 'any'; // 'all' means all features must be enabled, 'any' means at least one
  children: ReactNode;
  fallback?: ReactNode;
  showDisabledState?: boolean;
  disabledMessage?: string;
}

/**
 * Wrapper component that conditionally renders children based on feature flags
 */
export const FeatureWrapper: React.FC<FeatureWrapperProps> = ({
  featureId,
  children,
  fallback = null,
  showDisabledState = true,
  disabledMessage,
  className = '',
  requireAll = [],
  requireAny = []
}) => {
  const isEnabled = useFeature(featureId);
  const { isEnabled: checkFeature } = useFeature();

  // Check if all required features are enabled
  const allRequiredEnabled = requireAll.length === 0 || requireAll.every(id => checkFeature(id));
  
  // Check if any of the optional features are enabled
  const anyOptionalEnabled = requireAny.length === 0 || requireAny.some(id => checkFeature(id));

  const shouldRender = isEnabled && allRequiredEnabled && anyOptionalEnabled;

  if (shouldRender) {
    return <div className={className}>{children}</div>;
  }

  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  if (showDisabledState) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-800 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <Lock className="text-gray-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-400">Feature Disabled</h3>
        </div>
        
        <div className="text-center text-gray-500 py-6">
          <EyeOff size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">
            {disabledMessage || `This feature is currently disabled. Enable "${featureId}" in the feature flags to access this functionality.`}
          </p>
          <p className="text-sm">
            {requireAll.length > 0 && (
              <span className="block mt-2">
                Also requires: {requireAll.join(', ')}
              </span>
            )}
            {requireAny.length > 0 && (
              <span className="block mt-1">
                Optional features: {requireAny.join(', ')}
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Simple conditional wrapper that shows/hides content based on feature flag
 */
export const ConditionalFeature: React.FC<ConditionalFeatureWrapperProps> = ({
  featureId,
  children,
  fallback = null
}) => {
  const isEnabled = useFeature(featureId);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

/**
 * Wrapper for multiple features with AND/OR logic
 */
export const FeatureGroup: React.FC<FeatureGroupWrapperProps> = ({
  features,
  mode,
  children,
  fallback = null,
  showDisabledState = true,
  disabledMessage
}) => {
  const { isEnabled } = useFeature();
  
  const shouldRender = mode === 'all' 
    ? features.every(feature => isEnabled(feature))
    : features.some(feature => isEnabled(feature));

  if (shouldRender) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showDisabledState) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Lock className="text-gray-500" size={24} />
          <h3 className="text-lg font-semibold text-gray-400">Feature Group Disabled</h3>
        </div>
        
        <div className="text-center text-gray-500 py-6">
          <EyeOff size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">
            {disabledMessage || `This feature group is currently disabled.`}
          </p>
          <p className="text-sm">
            Required features ({mode === 'all' ? 'all' : 'any'}): {features.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Wrapper that shows a loading state while feature is being evaluated
 */
interface FeatureLoaderProps {
  featureId: string;
  children: ReactNode;
  loadingComponent?: ReactNode;
  fallback?: ReactNode;
}

export const FeatureLoader: React.FC<FeatureLoaderProps> = ({
  featureId,
  children,
  loadingComponent = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      <span className="ml-3 text-gray-400">Loading feature...</span>
    </div>
  ),
  fallback = null
}) => {
  const isEnabled = useFeature(featureId);
  
  // In a real app, you might have async feature flag loading
  // For now, we'll just show the loading state briefly
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  return isEnabled ? <>{children}</> : <>{fallback}</>;
};

/**
 * Wrapper that provides feature-specific styling
 */
interface FeatureStyleWrapperProps {
  featureId: string;
  children: ReactNode;
  enabledClassName?: string;
  disabledClassName?: string;
  fallback?: ReactNode;
}

export const FeatureStyleWrapper: React.FC<FeatureStyleWrapperProps> = ({
  featureId,
  children,
  enabledClassName = '',
  disabledClassName = 'opacity-50 pointer-events-none',
  fallback = null
}) => {
  const isEnabled = useFeature(featureId);
  
  if (!isEnabled && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={isEnabled ? enabledClassName : disabledClassName}>
      {children}
    </div>
  );
};

/**
 * Wrapper for navigation items that should be hidden when feature is disabled
 */
interface FeatureNavItemProps {
  featureId: string;
  children: ReactNode;
  className?: string;
}

export const FeatureNavItem: React.FC<FeatureNavItemProps> = ({
  featureId,
  children,
  className = ''
}) => {
  const isEnabled = useFeature(featureId);
  
  if (!isEnabled) {
    return null;
  }

  return <div className={className}>{children}</div>;
};

/**
 * Wrapper that shows a badge when feature is enabled
 */
interface FeatureBadgeProps {
  featureId: string;
  children: ReactNode;
  badgeText: string;
  badgeClassName?: string;
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  featureId,
  children,
  badgeText,
  badgeClassName = 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
}) => {
  const isEnabled = useFeature(featureId);
  
  return (
    <div className="relative">
      {children}
      {isEnabled && (
        <div className={`absolute -top-2 -right-2 ${badgeClassName}`}>
          {badgeText}
        </div>
      )}
    </div>
  );
};

// Export all wrappers as a single object for easier imports
export const FeatureWrappers = {
  FeatureWrapper,
  ConditionalFeature,
  FeatureGroup,
  FeatureLoader,
  FeatureStyleWrapper,
  FeatureNavItem,
  FeatureBadge,
};
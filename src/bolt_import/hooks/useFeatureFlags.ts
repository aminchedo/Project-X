import { useFeatureFlag } from '../contexts/FeatureFlagContext';

// Custom hook for common feature flag patterns
export const useFeatureFlags = () => {
  const { isEnabled, getFlag, getFlagsByCategory } = useFeatureFlag();

  return {
    // Core features
    isAIPredictionsEnabled: isEnabled('ai-predictions'),
    isPortfolioEnabled: isEnabled('portfolio-management'),
    isRealTimeChartsEnabled: isEnabled('real-time-charts'),
    isNewsFeedEnabled: isEnabled('news-feed'),
    isMarketSentimentEnabled: isEnabled('market-sentiment'),
    isTrainingDashboardEnabled: isEnabled('training-dashboard'),
    
    // Advanced features
    isAdvancedChartsEnabled: isEnabled('advanced-charts'),
    isBacktestingEnabled: isEnabled('backtesting'),
    isRiskManagementEnabled: isEnabled('risk-management'),
    isWhaleTrackingEnabled: isEnabled('whale-tracking'),
    isSocialSentimentEnabled: isEnabled('social-sentiment'),
    isAIOptimizationEnabled: isEnabled('ai-optimization'),
    isPaperTradingEnabled: isEnabled('paper-trading'),
    isAlertsSystemEnabled: isEnabled('alerts-system'),
    
    // UI features
    isDarkModeEnabled: isEnabled('dark-mode'),
    isMobileResponsiveEnabled: isEnabled('mobile-responsive'),
    
    // Experimental features
    isQuantumAIEnabled: isEnabled('quantum-ai'),
    isBlockchainAnalysisEnabled: isEnabled('blockchain-analysis'),
    
    // Utility functions
    isEnabled,
    getFlag,
    getFlagsByCategory,
  };
};

// Hook for conditional rendering with fallback
export const useConditionalFeature = <T>(
  featureId: string,
  enabledComponent: T,
  disabledComponent: T
): T => {
  const { isEnabled } = useFeatureFlag();
  return isEnabled(featureId) ? enabledComponent : disabledComponent;
};

// Hook for feature-dependent styling
export const useFeatureStyles = (featureId: string, enabledClass: string, disabledClass: string) => {
  const { isEnabled } = useFeatureFlag();
  return isEnabled(featureId) ? enabledClass : disabledClass;
};
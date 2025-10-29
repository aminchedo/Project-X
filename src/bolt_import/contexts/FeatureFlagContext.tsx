import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Feature flag types
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'ui' | 'functionality' | 'ai' | 'trading' | 'analytics' | 'experimental';
  dependencies?: string[];
  rolloutPercentage?: number;
  userGroups?: string[];
  environment?: 'development' | 'staging' | 'production';
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  userGroups: string[];
  environment: 'development' | 'staging' | 'production';
  userId?: string;
}

interface FeatureFlagContextType {
  flags: Record<string, FeatureFlag>;
  isEnabled: (flagId: string) => boolean;
  isEnabledForUser: (flagId: string, userId?: string) => boolean;
  getFlag: (flagId: string) => FeatureFlag | undefined;
  updateFlag: (flagId: string, enabled: boolean) => void;
  updateFlagConfig: (config: Partial<FeatureFlagConfig>) => void;
  getFlagsByCategory: (category: FeatureFlag['category']) => FeatureFlag[];
  userGroups: string[];
  environment: string;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

// Default feature flags configuration
const defaultFlags: Record<string, FeatureFlag> = {
  // UI Features
  'ai-predictions': {
    id: 'ai-predictions',
    name: 'AI Predictions',
    description: 'Enable AI-powered price predictions and trading signals',
    enabled: true,
    category: 'ai',
    rolloutPercentage: 100,
  },
  'portfolio-management': {
    id: 'portfolio-management',
    name: 'Portfolio Management',
    description: 'Enable portfolio tracking and P&L calculations',
    enabled: true,
    category: 'trading',
    rolloutPercentage: 100,
  },
  'real-time-charts': {
    id: 'real-time-charts',
    name: 'Real-time Charts',
    description: 'Enable real-time candlestick charts and technical indicators',
    enabled: true,
    category: 'ui',
    rolloutPercentage: 100,
  },
  'news-feed': {
    id: 'news-feed',
    name: 'News Feed',
    description: 'Enable cryptocurrency news and sentiment analysis',
    enabled: true,
    category: 'analytics',
    rolloutPercentage: 100,
  },
  'market-sentiment': {
    id: 'market-sentiment',
    name: 'Market Sentiment',
    description: 'Enable market sentiment analysis and fear/greed index',
    enabled: true,
    category: 'analytics',
    rolloutPercentage: 100,
  },
  'training-dashboard': {
    id: 'training-dashboard',
    name: 'AI Training Dashboard',
    description: 'Enable AI model training interface and metrics',
    enabled: true,
    category: 'ai',
    rolloutPercentage: 100,
  },
  'advanced-charts': {
    id: 'advanced-charts',
    name: 'Advanced Charts',
    description: 'Enable TradingView integration and advanced charting tools',
    enabled: false,
    category: 'ui',
    rolloutPercentage: 50,
    dependencies: ['real-time-charts'],
  },
  'backtesting': {
    id: 'backtesting',
    name: 'Backtesting Module',
    description: 'Enable strategy backtesting and performance analysis',
    enabled: false,
    category: 'trading',
    rolloutPercentage: 25,
    dependencies: ['portfolio-management'],
  },
  'risk-management': {
    id: 'risk-management',
    name: 'Risk Management',
    description: 'Enable position sizing and risk calculation tools',
    enabled: false,
    category: 'trading',
    rolloutPercentage: 30,
    dependencies: ['portfolio-management'],
  },
  'whale-tracking': {
    id: 'whale-tracking',
    name: 'Whale Tracking',
    description: 'Enable large transaction monitoring and whale alerts',
    enabled: false,
    category: 'analytics',
    rolloutPercentage: 20,
  },
  'social-sentiment': {
    id: 'social-sentiment',
    name: 'Social Sentiment',
    description: 'Enable social media sentiment analysis',
    enabled: false,
    category: 'analytics',
    rolloutPercentage: 15,
  },
  'ai-optimization': {
    id: 'ai-optimization',
    name: 'AI Model Optimization',
    description: 'Enable automatic AI model optimization and hyperparameter tuning',
    enabled: false,
    category: 'ai',
    rolloutPercentage: 10,
    dependencies: ['training-dashboard'],
  },
  'paper-trading': {
    id: 'paper-trading',
    name: 'Paper Trading',
    description: 'Enable simulated trading without real money',
    enabled: false,
    category: 'trading',
    rolloutPercentage: 40,
  },
  'alerts-system': {
    id: 'alerts-system',
    name: 'Alerts System',
    description: 'Enable price alerts and notification system',
    enabled: false,
    category: 'functionality',
    rolloutPercentage: 60,
  },
  'dark-mode': {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Enable dark theme toggle',
    enabled: true,
    category: 'ui',
    rolloutPercentage: 100,
  },
  'mobile-responsive': {
    id: 'mobile-responsive',
    name: 'Mobile Responsive',
    description: 'Enable mobile-optimized interface',
    enabled: true,
    category: 'ui',
    rolloutPercentage: 100,
  },
  // Experimental features
  'quantum-ai': {
    id: 'quantum-ai',
    name: 'Quantum AI',
    description: 'Experimental quantum computing integration for AI predictions',
    enabled: false,
    category: 'experimental',
    rolloutPercentage: 5,
    userGroups: ['beta-testers'],
  },
  'blockchain-analysis': {
    id: 'blockchain-analysis',
    name: 'Blockchain Analysis',
    description: 'Enable on-chain data analysis and transaction tracking',
    enabled: false,
    category: 'experimental',
    rolloutPercentage: 10,
  },
};

interface FeatureFlagProviderProps {
  children: ReactNode;
  initialConfig?: Partial<FeatureFlagConfig>;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  children,
  initialConfig
}) => {
  const [config, setConfig] = useState<FeatureFlagConfig>({
    flags: defaultFlags,
    userGroups: initialConfig?.userGroups || ['default'],
    environment: initialConfig?.environment || 'development',
    userId: initialConfig?.userId,
  });

  // Load feature flags from localStorage on mount
  useEffect(() => {
    const savedFlags = localStorage.getItem('feature-flags');
    if (savedFlags) {
      try {
        const parsedFlags = JSON.parse(savedFlags);
        setConfig(prev => ({
          ...prev,
          flags: { ...prev.flags, ...parsedFlags }
        }));
      } catch (error) {
        console.error('Failed to load feature flags from localStorage:', error);
      }
    }
  }, []);

  // Save feature flags to localStorage when they change
  useEffect(() => {
    localStorage.setItem('feature-flags', JSON.stringify(config.flags));
  }, [config.flags]);

  const isEnabled = (flagId: string): boolean => {
    const flag = config.flags[flagId];
    if (!flag) return false;

    // Check if flag is enabled
    if (!flag.enabled) return false;

    // Check environment restrictions
    if (flag.environment && flag.environment !== config.environment) {
      return false;
    }

    // Check user group restrictions
    if (flag.userGroups && flag.userGroups.length > 0) {
      const hasMatchingGroup = flag.userGroups.some(group =>
        config.userGroups.includes(group)
      );
      if (!hasMatchingGroup) return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage && flag.rolloutPercentage < 100) {
      const userId = config.userId || 'default';
      const hash = userId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const percentage = Math.abs(hash) % 100;
      return percentage < flag.rolloutPercentage;
    }

    // Check dependencies
    if (flag.dependencies && flag.dependencies.length > 0) {
      return flag.dependencies.every(depId => isEnabled(depId));
    }

    return true;
  };

  const isEnabledForUser = (flagId: string, userId?: string): boolean => {
    if (userId && userId !== config.userId) {
      // For different user, we'd need to recalculate based on their ID
      // This is a simplified version - in production, you'd want more sophisticated logic
      return isEnabled(flagId);
    }
    return isEnabled(flagId);
  };

  const getFlag = (flagId: string): FeatureFlag | undefined => {
    return config.flags[flagId];
  };

  const updateFlag = (flagId: string, enabled: boolean): void => {
    setConfig(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        [flagId]: {
          ...prev.flags[flagId],
          enabled
        }
      }
    }));
  };

  const updateFlagConfig = (newConfig: Partial<FeatureFlagConfig>): void => {
    setConfig(prev => ({
      ...prev,
      ...newConfig
    }));
  };

  const getFlagsByCategory = (category: FeatureFlag['category']): FeatureFlag[] => {
    return Object.values(config.flags).filter(flag => flag.category === category);
  };

  const value: FeatureFlagContextType = {
    flags: config.flags,
    isEnabled,
    isEnabledForUser,
    getFlag,
    updateFlag,
    updateFlagConfig,
    getFlagsByCategory,
    userGroups: config.userGroups,
    environment: config.environment,
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlag = (): FeatureFlagContextType => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }
  return context;
};

// Hook for checking if a specific feature is enabled
export const useFeature = (flagId: string): boolean => {
  const { isEnabled } = useFeatureFlag();
  return isEnabled(flagId);
};

// Hook for getting a feature flag with fallback
export const useFeatureWithFallback = <T,>(
  flagId: string,
  enabledValue: T,
  disabledValue: T
): T => {
  const { isEnabled } = useFeatureFlag();
  return isEnabled(flagId) ? enabledValue : disabledValue;
};
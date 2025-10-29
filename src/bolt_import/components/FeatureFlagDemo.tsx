import React from 'react';
import { 
  FeatureGate, 
  FeatureGateSimple, 
  FeatureGateWithDependencies, 
  FeatureGateExperimental 
} from './FeatureGate';
import { 
  FeatureWrapper, 
  ConditionalFeature, 
  FeatureGroup, 
  FeatureStyleWrapper,
  FeatureNavItem,
  FeatureBadge 
} from './FeatureWrapper';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { 
  Brain, 
  Wallet, 
  BarChart3, 
  Newspaper, 
  Settings, 
  Zap, 
  Shield, 
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export const FeatureFlagDemo: React.FC = () => {
  const {
    isAIPredictionsEnabled,
    isPortfolioEnabled,
    isTrainingDashboardEnabled,
    isNewsFeedEnabled,
    isAdvancedChartsEnabled,
    isBacktestingEnabled,
    isRiskManagementEnabled,
    isWhaleTrackingEnabled,
    isSocialSentimentEnabled,
    isAIOptimizationEnabled,
    isPaperTradingEnabled,
    isAlertsSystemEnabled,
    isQuantumAIEnabled,
    isBlockchainAnalysisEnabled
  } = useFeatureFlags();

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="text-blue-400" size={28} />
        <h3 className="text-xl font-bold text-white">Feature Flag Demo</h3>
      </div>

      <div className="space-y-6">
        {/* Basic Feature Wrapper Examples */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Basic Feature Wrappers</h4>
          
          {/* Simple conditional rendering */}
          <ConditionalFeature featureId="ai-predictions">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-400" size={20} />
                <span className="text-green-400 font-semibold">AI Predictions Enabled</span>
              </div>
              <p className="text-green-300 text-sm mt-2">
                This content only shows when the 'ai-predictions' feature is enabled.
              </p>
            </div>
          </ConditionalFeature>

          {/* Feature with fallback */}
          <ConditionalFeature 
            featureId="quantum-ai"
            fallback={
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="text-gray-400" size={20} />
                  <span className="text-gray-400 font-semibold">Quantum AI Not Available</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  This experimental feature is not yet enabled.
                </p>
              </div>
            }
          >
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Zap className="text-purple-400" size={20} />
                <span className="text-purple-400 font-semibold">Quantum AI Active</span>
              </div>
              <p className="text-purple-300 text-sm mt-2">
                Revolutionary quantum computing integration is now active!
              </p>
            </div>
          </ConditionalFeature>
        </div>

        {/* Feature Gate Examples */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Feature Gate Examples</h4>
          
          {/* Simple feature gate */}
          <FeatureGateSimple featureId="portfolio-management">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Wallet className="text-blue-400" size={20} />
                <span className="text-blue-400 font-semibold">Portfolio Management</span>
              </div>
              <p className="text-blue-300 text-sm mt-2">
                Portfolio tracking and management features are available.
              </p>
            </div>
          </FeatureGateSimple>

          {/* Feature gate with dependencies */}
          <FeatureGateWithDependencies 
            featureId="backtesting"
            dependencies={['portfolio-management']}
          >
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="text-orange-400" size={20} />
                <span className="text-orange-400 font-semibold">Backtesting Module</span>
              </div>
              <p className="text-orange-300 text-sm mt-2">
                Strategy backtesting is available with portfolio management.
              </p>
            </div>
          </FeatureGateWithDependencies>

          {/* Experimental feature gate */}
          <FeatureGateExperimental featureId="blockchain-analysis">
            <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Shield className="text-cyan-400" size={20} />
                <span className="text-cyan-400 font-semibold">Blockchain Analysis</span>
              </div>
              <p className="text-cyan-300 text-sm mt-2">
                Advanced on-chain data analysis and transaction tracking.
              </p>
            </div>
          </FeatureGateExperimental>
        </div>

        {/* Feature Group Examples */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Feature Group Examples</h4>
          
          {/* All features must be enabled */}
          <FeatureGroup 
            features={['ai-predictions', 'training-dashboard']}
            mode="all"
          >
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Brain className="text-green-400" size={20} />
                <span className="text-green-400 font-semibold">Complete AI Suite</span>
              </div>
              <p className="text-green-300 text-sm mt-2">
                Both AI predictions and training dashboard are enabled.
              </p>
            </div>
          </FeatureGroup>

          {/* Any feature can be enabled */}
          <FeatureGroup 
            features={['advanced-charts', 'real-time-charts']}
            mode="any"
          >
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="text-yellow-400" size={20} />
                <span className="text-yellow-400 font-semibold">Chart Features Available</span>
              </div>
              <p className="text-yellow-300 text-sm mt-2">
                At least one chart feature is enabled.
              </p>
            </div>
          </FeatureGroup>
        </div>

        {/* Feature Style Wrapper Examples */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Feature Style Wrapper Examples</h4>
          
          <FeatureStyleWrapper 
            featureId="alerts-system"
            enabledClassName="opacity-100"
            disabledClassName="opacity-50 grayscale"
          >
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="text-red-400" size={20} />
                <span className="text-red-400 font-semibold">Alerts System</span>
              </div>
              <p className="text-red-300 text-sm mt-2">
                This component is styled differently based on feature flag state.
              </p>
            </div>
          </FeatureStyleWrapper>
        </div>

        {/* Feature Badge Examples */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Feature Badge Examples</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FeatureBadge featureId="ai-optimization" badgeText="Optimized">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Zap className="text-purple-400" size={20} />
                  <span className="text-purple-400 font-semibold">AI Model</span>
                </div>
                <p className="text-purple-300 text-sm mt-2">
                  AI model with optimization features.
                </p>
              </div>
            </FeatureBadge>

            <FeatureBadge featureId="paper-trading" badgeText="Demo">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Wallet className="text-yellow-400" size={20} />
                  <span className="text-yellow-400 font-semibold">Trading Mode</span>
                </div>
                <p className="text-yellow-300 text-sm mt-2">
                  Paper trading mode for safe testing.
                </p>
              </div>
            </FeatureBadge>
          </div>
        </div>

        {/* Feature Status Summary */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Feature Status Summary</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { id: 'ai-predictions', name: 'AI Predictions', enabled: isAIPredictionsEnabled },
              { id: 'portfolio-management', name: 'Portfolio', enabled: isPortfolioEnabled },
              { id: 'training-dashboard', name: 'Training', enabled: isTrainingDashboardEnabled },
              { id: 'news-feed', name: 'News Feed', enabled: isNewsFeedEnabled },
              { id: 'advanced-charts', name: 'Advanced Charts', enabled: isAdvancedChartsEnabled },
              { id: 'backtesting', name: 'Backtesting', enabled: isBacktestingEnabled },
              { id: 'risk-management', name: 'Risk Management', enabled: isRiskManagementEnabled },
              { id: 'whale-tracking', name: 'Whale Tracking', enabled: isWhaleTrackingEnabled },
              { id: 'social-sentiment', name: 'Social Sentiment', enabled: isSocialSentimentEnabled },
              { id: 'ai-optimization', name: 'AI Optimization', enabled: isAIOptimizationEnabled },
              { id: 'paper-trading', name: 'Paper Trading', enabled: isPaperTradingEnabled },
              { id: 'alerts-system', name: 'Alerts System', enabled: isAlertsSystemEnabled },
              { id: 'quantum-ai', name: 'Quantum AI', enabled: isQuantumAIEnabled },
              { id: 'blockchain-analysis', name: 'Blockchain Analysis', enabled: isBlockchainAnalysisEnabled },
            ].map(({ id, name, enabled }) => (
              <div
                key={id}
                className={`p-3 rounded-lg border text-sm ${
                  enabled
                    ? 'bg-green-900/20 border-green-500/30 text-green-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {enabled ? (
                    <CheckCircle className="text-green-400" size={16} />
                  ) : (
                    <AlertTriangle className="text-gray-500" size={16} />
                  )}
                  <span className="font-medium">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
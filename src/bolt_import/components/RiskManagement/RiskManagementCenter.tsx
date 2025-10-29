import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Calculator, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  BarChart3,
  Activity,
  DollarSign,
  Percent,
  Zap
} from 'lucide-react';
import PositionSizeCalculator from './PositionSizeCalculator';
import VaRCalculator from './VaRCalculator';
import StressTesting from './StressTesting';
import PortfolioMetrics from './PortfolioMetrics';
import RiskAlerts from './RiskAlerts';

interface RiskMetrics {
  portfolio_value: number;
  total_exposure: number;
  var_95: number;
  cvar_95: number;
  max_drawdown: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  volatility: number;
  beta: number;
  correlation_btc: number;
  risk_score: number;
}

interface RiskAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: string;
  action_required: boolean;
}

const RiskManagementCenter: React.FC = () => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchRiskData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchRiskData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchRiskData = async () => {
    try {
      const [metricsRes, alertsRes] = await Promise.all([
        fetch('/api/risk/metrics'),
        fetch('/api/risk/alerts')
      ]);

      if (metricsRes.ok) {
        const metrics = await metricsRes.json();
        setRiskMetrics(metrics);
      }

      if (alertsRes.ok) {
        const alerts = await alertsRes.json();
        setRiskAlerts(alerts);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch risk data:', error);
      setLoading(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskScoreLabel = (score: number) => {
    if (score >= 80) return 'High Risk';
    if (score >= 60) return 'Moderate-High';
    if (score >= 40) return 'Moderate';
    return 'Low Risk';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number, decimals: number = 2) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'calculators', label: 'Calculators', icon: Calculator },
    { id: 'var', label: 'VaR Analysis', icon: TrendingDown },
    { id: 'stress', label: 'Stress Testing', icon: AlertTriangle },
    { id: 'portfolio', label: 'Portfolio', icon: BarChart3 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-blue-600" />
            Risk Management Center
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive risk analysis and portfolio protection</p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            <span className="text-sm">Auto Refresh</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchRiskData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Risk Overview Cards */}
      {riskMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Portfolio Value */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(riskMetrics.portfolio_value)}
                </div>
                <div className="text-sm text-gray-600">Portfolio Value</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Exposure:</span>
              <span className="font-semibold">
                {formatPercentage(riskMetrics.total_exposure / riskMetrics.portfolio_value)}
              </span>
            </div>
          </div>

          {/* Risk Score */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-blue-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {riskMetrics.risk_score.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Risk Score</div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium text-center ${getRiskScoreColor(riskMetrics.risk_score)}`}>
              {getRiskScoreLabel(riskMetrics.risk_score)}
            </div>
          </div>

          {/* VaR (95%) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="w-8 h-8 text-red-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {formatPercentage(riskMetrics.var_95)}
                </div>
                <div className="text-sm text-gray-600">VaR (95%)</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">CVaR:</span>
              <span className="font-semibold text-red-600">
                {formatPercentage(riskMetrics.cvar_95)}
              </span>
            </div>
          </div>

          {/* Sharpe Ratio */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-purple-600" />
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {riskMetrics.sharpe_ratio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Sharpe Ratio</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sortino:</span>
              <span className="font-semibold">
                {riskMetrics.sortino_ratio.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <RiskAlerts alerts={riskAlerts} className="mb-6" />
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && riskMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Metrics Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Metrics Summary</h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maximum Drawdown</span>
                    <span className="font-semibold text-red-600">
                      {formatPercentage(riskMetrics.max_drawdown)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volatility (Annualized)</span>
                    <span className="font-semibold">
                      {formatPercentage(riskMetrics.volatility)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Beta (vs BTC)</span>
                    <span className="font-semibold">
                      {riskMetrics.beta.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Correlation with BTC</span>
                    <span className="font-semibold">
                      {riskMetrics.correlation_btc.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calmar Ratio</span>
                    <span className="font-semibold">
                      {riskMetrics.calmar_ratio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Score Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Score Breakdown</h3>
                
                <div className="space-y-3">
                  {/* Concentration Risk */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Concentration Risk</span>
                      <span className="font-medium">25/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>

                  {/* Volatility Risk */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Volatility Risk</span>
                      <span className="font-medium">45/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>

                  {/* Correlation Risk */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Correlation Risk</span>
                      <span className="font-medium">35/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                  </div>

                  {/* Liquidity Risk */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Liquidity Risk</span>
                      <span className="font-medium">15/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>

                  {/* Overall Risk Score */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-gray-800">Overall Risk Score</span>
                      <span className="font-bold">{riskMetrics.risk_score.toFixed(0)}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${
                          riskMetrics.risk_score >= 80 ? 'bg-red-500' :
                          riskMetrics.risk_score >= 60 ? 'bg-orange-500' :
                          riskMetrics.risk_score >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${riskMetrics.risk_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calculators' && (
            <PositionSizeCalculator />
          )}

          {activeTab === 'var' && (
            <VaRCalculator />
          )}

          {activeTab === 'stress' && (
            <StressTesting />
          )}

          {activeTab === 'portfolio' && riskMetrics && (
            <PortfolioMetrics metrics={riskMetrics} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Risk Monitoring</span>
            </div>
            <span>Last Update: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="text-right">
            <p className="font-semibold text-red-600">
              ⚠️ Risk management tools are for informational purposes only
            </p>
            <p>Not financial advice • Past performance does not guarantee future results</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagementCenter;

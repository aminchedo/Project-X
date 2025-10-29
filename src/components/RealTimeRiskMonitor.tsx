import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  TrendingDown,
  TrendingUp,
  Activity,
  Zap,
  DollarSign,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import {
  fetchRiskSnapshot,
  RiskMetric,
  PositionRisk,
  RiskAlert
} from '../services/liveDataApi';

const RealTimeRiskMonitor: React.FC = () => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [positionRisks, setPositionRisks] = useState<PositionRisk[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [overallRiskScore, setOverallRiskScore] = useState<number>(0);
  const [portfolioVar, setPortfolioVar] = useState<number>(0);
  const [maxDrawdown, setMaxDrawdown] = useState<number>(0);
  const [sharpeRatio, setSharpeRatio] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load real risk data
    const loadRiskData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchRiskSnapshot();

        if (!data) {
          setError('No risk data available');
          setRiskMetrics([]);
          setPositionRisks([]);
          setRiskAlerts([]);
          setOverallRiskScore(0);
          setPortfolioVar(0);
          setMaxDrawdown(0);
          setSharpeRatio(0);
        } else {
          setRiskMetrics(data.riskMetrics || []);
          setPositionRisks(data.positionRisks || []);
          setRiskAlerts(data.riskAlerts || []);
          setOverallRiskScore(data.overallRiskScore || 0);
          setPortfolioVar(data.portfolioVar || 0);
          setMaxDrawdown(data.maxDrawdown || 0);
          setSharpeRatio(data.sharpeRatio || 0);
        }
      } catch (err) {
        console.error('Failed to load risk data:', err);
        setError('Failed to load risk data');
        setRiskMetrics([]);
        setPositionRisks([]);
        setRiskAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRiskData();

    // Refresh every 30 seconds
    const intervalId = setInterval(loadRiskData, 30000);

    return () => clearInterval(intervalId);
  }, []);


  const getRiskScoreColor = (score: number) => {
    if (score <= 3) return 'text-green-400';
    if (score <= 6) return 'text-yellow-400';
    if (score <= 8) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRiskScoreBackground = (score: number) => {
    if (score <= 3) return 'bg-green-500';
    if (score <= 6) return 'bg-yellow-500';
    if (score <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-500/20 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'critical': return 'bg-red-500/20 border-red-500/30';
      default: return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Risk Monitor</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
              <div className="h-6 bg-slate-700 rounded w-16"></div>
            </div>
          ))}
        </div>
        <div className="text-center py-12 text-slate-400">
          <Activity className="w-12 h-12 mx-auto mb-3 animate-pulse" />
          <p>Loading risk data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">Risk Monitor</h2>
        </div>
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <AlertCircleIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">{error}</p>
          <p className="text-slate-500 text-sm mb-4">
            Risk monitoring requires backend API to calculate metrics
          </p>
          <p className="text-slate-500 text-xs">
            Check backend connection or configure risk calculation endpoints
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header with Overall Risk Score - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Risk Monitor</h2>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
            <span>Live Data</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-400">Overall Risk Score</div>
            <div className={`text-2xl sm:text-3xl font-bold ${getRiskScoreColor(overallRiskScore)}`}>
              {overallRiskScore > 0 ? `${overallRiskScore.toFixed(1)}/10` : '--'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-400">Portfolio VaR</div>
            <div className="text-lg sm:text-xl font-bold text-yellow-400">
              {portfolioVar > 0 ? `$${portfolioVar.toFixed(0)}` : '--'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-400">Max Drawdown</div>
            <div className="text-lg sm:text-xl font-bold text-red-400">
              {maxDrawdown > 0 ? `${maxDrawdown.toFixed(1)}%` : '--'}
            </div>
          </div>

          {overallRiskScore > 0 && (
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-gray-700"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 35}`}
                  strokeDashoffset={`${2 * Math.PI * 35 * (1 - overallRiskScore / 10)}`}
                  className={getRiskScoreColor(overallRiskScore)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${getRiskScoreColor(overallRiskScore)}`}>
                  {Math.round((overallRiskScore / 10) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Portfolio Metrics - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Portfolio VaR</div>
              <div className="text-xl font-bold text-red-400">
                ${portfolioVar.toLocaleString()}
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Max Drawdown</div>
              <div className="text-xl font-bold text-orange-400">
                {maxDrawdown.toFixed(1)}%
              </div>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Sharpe Ratio</div>
              <div className="text-xl font-bold text-green-400">
                {sharpeRatio.toFixed(2)}
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Active Alerts</div>
              <div className="text-xl font-bold text-yellow-400">
                {riskAlerts.length}
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Risk Metrics */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Risk Metrics
          </h3>
          
          <div className="space-y-4">
            {riskMetrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getStatusBackground(metric.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{metric.name}</span>
                    {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-400" />}
                    {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-400" />}
                    {metric.trend === 'stable' && <Activity className="w-4 h-4 text-gray-400" />}
                  </div>
                  <span className={`text-sm font-bold ${getStatusColor(metric.status)}`}>
                    {metric.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {metric.value.toFixed(1)}{metric.unit}
                  </div>
                  <div className="text-sm text-gray-400">
                    Limit: {metric.threshold.toFixed(1)}{metric.unit}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        metric.status === 'critical' ? 'bg-red-500' :
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Position Risks */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            Position Risks
          </h3>
          
          <div className="space-y-4">
            {positionRisks.map((position, index) => (
              <motion.div
                key={position.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-lg">{position.symbol}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Risk Score:</span>
                    <span className={`font-bold ${getRiskScoreColor(position.riskScore)}`}>
                      {position.riskScore.toFixed(1)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Exposure</div>
                    <div className="font-semibold">${position.exposure.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">VaR (1D)</div>
                    <div className="font-semibold text-red-400">${position.var.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Leverage</div>
                    <div className="font-semibold">{position.leverage.toFixed(1)}x</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Unrealized P&L</div>
                    <div className={`font-semibold ${position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${position.unrealizedPnl.toLocaleString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
          Risk Alerts
        </h3>
        
        <div className="space-y-3">
          {riskAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-700/30 rounded-lg border border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <AlertCircle className={`w-5 h-5 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    {alert.symbol && (
                      <div className="text-sm text-gray-400">Symbol: {alert.symbol}</div>
                    )}
                    <div className="text-sm text-gray-400">
                      {alert.metric}: {alert.value.toFixed(2)} / {alert.threshold.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(alert.severity)} bg-opacity-20`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeRiskMonitor;
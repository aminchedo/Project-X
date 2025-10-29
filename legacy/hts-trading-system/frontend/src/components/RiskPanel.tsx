/**
 * HTS Trading System - Risk Panel Component
 * Comprehensive risk management dashboard with real-time monitoring
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Target,
  Activity,
  BarChart3,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

// Services
import { 
  apiClient, 
  PortfolioSummary,
  formatPrice,
  formatPercentage
} from '../services/api';

// Types
interface RiskPanelState {
  riskMetrics: RiskMetrics | null;
  riskLimits: RiskLimits;
  alerts: RiskAlert[];
  positionRisks: PositionRisk[];
  loading: boolean;
  showSettings: boolean;
}

interface RiskMetrics {
  portfolioVaR1d: number;
  portfolioVaR7d: number;
  expectedShortfall: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  volatility: number;
  beta: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  totalRisk: number;
  riskUtilization: number;
}

interface RiskLimits {
  maxPositionRisk: number;
  maxPortfolioRisk: number;
  maxDailyLoss: number;
  maxDrawdown: number;
  leverageLimit: number;
  varConfidence: number;
}

interface RiskAlert {
  id: string;
  type: 'POSITION_RISK' | 'PORTFOLIO_RISK' | 'DRAWDOWN' | 'VAR_BREACH' | 'CORRELATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  symbol?: string;
  value: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
}

interface PositionRisk {
  symbol: string;
  positionSize: number;
  marketValue: number;
  riskAmount: number;
  riskPercentage: number;
  stopLoss?: number;
  takeProfit?: number;
  riskRewardRatio: number;
  daysHeld: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const RiskPanel: React.FC = () => {
  const [state, setState] = useState<RiskPanelState>({
    riskMetrics: null,
    riskLimits: {
      maxPositionRisk: 2.0,
      maxPortfolioRisk: 10.0,
      maxDailyLoss: 5.0,
      maxDrawdown: 20.0,
      leverageLimit: 3.0,
      varConfidence: 95.0
    },
    alerts: [],
    positionRisks: [],
    loading: true,
    showSettings: false
  });

  useEffect(() => {
    loadRiskData();
    const interval = setInterval(loadRiskData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadRiskData = async () => {
    try {
      // Load portfolio data
      const portfolio = await apiClient.getPortfolioStatus();
      
      // Generate mock risk data (in production, this would come from the backend)
      const riskMetrics = generateMockRiskMetrics(portfolio);
      const alerts = generateMockAlerts();
      const positionRisks = generateMockPositionRisks();

      setState(prev => ({
        ...prev,
        riskMetrics,
        alerts,
        positionRisks,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load risk data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const generateMockRiskMetrics = (portfolio: PortfolioSummary): RiskMetrics => {
    return {
      portfolioVaR1d: 2.5,
      portfolioVaR7d: 6.8,
      expectedShortfall: 3.2,
      maxDrawdown: 8.5,
      sharpeRatio: 1.85,
      sortinoRatio: 2.15,
      volatility: 35.2,
      beta: 1.15,
      riskLevel: 'MEDIUM',
      totalRisk: 1250.75,
      riskUtilization: 65.5
    };
  };

  const generateMockAlerts = (): RiskAlert[] => {
    return [
      {
        id: '1',
        type: 'POSITION_RISK',
        severity: 'MEDIUM',
        message: 'BTCUSDT position risk exceeds 2% threshold',
        symbol: 'BTCUSDT',
        value: 2.3,
        threshold: 2.0,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        acknowledged: false
      },
      {
        id: '2',
        type: 'DRAWDOWN',
        severity: 'HIGH',
        message: 'Portfolio drawdown approaching limit',
        value: 15.2,
        threshold: 20.0,
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        acknowledged: false
      },
      {
        id: '3',
        type: 'VAR_BREACH',
        severity: 'LOW',
        message: 'Daily VaR slightly elevated',
        value: 2.8,
        threshold: 3.0,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: true
      }
    ];
  };

  const generateMockPositionRisks = (): PositionRisk[] => {
    return [
      {
        symbol: 'BTCUSDT',
        positionSize: 0.5,
        marketValue: 23750,
        riskAmount: 475,
        riskPercentage: 2.3,
        stopLoss: 45000,
        takeProfit: 52000,
        riskRewardRatio: 2.8,
        daysHeld: 5,
        riskLevel: 'MEDIUM'
      },
      {
        symbol: 'ETHUSDT',
        positionSize: 8,
        marketValue: 23600,
        riskAmount: 354,
        riskPercentage: 1.8,
        stopLoss: 2750,
        takeProfit: 3200,
        riskRewardRatio: 3.2,
        daysHeld: 3,
        riskLevel: 'LOW'
      },
      {
        symbol: 'ADAUSDT',
        positionSize: 5000,
        marketValue: 2400,
        riskAmount: 120,
        riskPercentage: 0.6,
        stopLoss: 0.46,
        riskRewardRatio: 2.0,
        daysHeld: 8,
        riskLevel: 'LOW'
      }
    ];
  };

  const acknowledgeAlert = (alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    }));
  };

  const dismissAlert = (alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
  };

  const updateRiskLimits = (newLimits: Partial<RiskLimits>) => {
    setState(prev => ({
      ...prev,
      riskLimits: { ...prev.riskLimits, ...newLimits }
    }));
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-bull-400 bg-bull-500/20';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/20';
      case 'EXTREME':
        return 'text-bear-400 bg-bear-500/20';
      default:
        return 'text-dark-400 bg-dark-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'CRITICAL':
        return 'text-bear-400 bg-bear-500/20 border-bear-500/30';
      default:
        return 'text-dark-400 bg-dark-500/20 border-dark-500/30';
    }
  };

  if (state.loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-dark-700 rounded mb-2"></div>
              <div className="h-8 bg-dark-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Prepare risk utilization data for radial chart
  const riskUtilizationData = [{
    name: 'Risk Utilization',
    value: state.riskMetrics?.riskUtilization || 0,
    fill: state.riskMetrics?.riskUtilization > 80 ? '#ef4444' : 
          state.riskMetrics?.riskUtilization > 60 ? '#f59e0b' : '#10b981'
  }];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <Shield className="w-6 h-6 mr-2 text-neon-blue" />
          Risk Management
        </h1>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setState(prev => ({ ...prev, showSettings: true }))}
            className="btn-secondary flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Risk Limits
          </button>
          
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg glass-light">
            <div className={`w-2 h-2 rounded-full ${
              state.riskMetrics?.riskLevel === 'LOW' ? 'bg-bull-400' :
              state.riskMetrics?.riskLevel === 'MEDIUM' ? 'bg-yellow-400' :
              state.riskMetrics?.riskLevel === 'HIGH' ? 'bg-orange-400' : 'bg-bear-400'
            }`} />
            <span className="text-sm">
              {state.riskMetrics?.riskLevel || 'UNKNOWN'} Risk
            </span>
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      {state.alerts.filter(alert => !alert.acknowledged).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center">
            <Bell className="w-5 h-5 mr-2 text-orange-400" />
            Active Risk Alerts
          </h2>
          
          <div className="space-y-2">
            {state.alerts
              .filter(alert => !alert.acknowledged)
              .map(alert => (
                <RiskAlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={acknowledgeAlert}
                  onDismiss={dismissAlert}
                />
              ))}
          </div>
        </div>
      )}

      {/* Risk Metrics Overview */}
      {state.riskMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="metric-card">
            <div className="metric-value text-bear-400">
              {state.riskMetrics.portfolioVaR1d.toFixed(1)}%
            </div>
            <div className="metric-label">1-Day VaR</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value text-orange-400">
              {state.riskMetrics.maxDrawdown.toFixed(1)}%
            </div>
            <div className="metric-label">Max Drawdown</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value text-neon-blue">
              {state.riskMetrics.sharpeRatio.toFixed(2)}
            </div>
            <div className="metric-label">Sharpe Ratio</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value text-yellow-400">
              {state.riskMetrics.riskUtilization.toFixed(1)}%
            </div>
            <div className="metric-label">Risk Utilization</div>
          </div>
        </div>
      )}

      {/* Risk Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Utilization Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-neon-blue" />
            Risk Utilization
          </h3>
          
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={riskUtilizationData}>
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  fill={riskUtilizationData[0].fill}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-current text-2xl font-bold">
                  {riskUtilizationData[0].value.toFixed(0)}%
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Total Risk:</span>
              <span className="font-semibold">{formatPrice(state.riskMetrics?.totalRisk || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Risk Limit:</span>
              <span className="font-semibold">{formatPrice(20000)}</span>
            </div>
          </div>
        </div>

        {/* Position Risk Breakdown */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Position Risk Analysis</h3>
          
          <div className="space-y-3">
            {state.positionRisks.map(position => (
              <PositionRiskCard key={position.symbol} position={position} />
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Risk Metrics */}
      {state.riskMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VaR and Risk Measures */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-neon-blue" />
              Risk Measures
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-dark-400">1-Day VaR (95%):</span>
                <span className="font-semibold text-bear-400">
                  {state.riskMetrics.portfolioVaR1d.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-dark-400">7-Day VaR (95%):</span>
                <span className="font-semibold text-bear-400">
                  {state.riskMetrics.portfolioVaR7d.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Expected Shortfall:</span>
                <span className="font-semibold text-bear-400">
                  {state.riskMetrics.expectedShortfall.toFixed(2)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Volatility (Annual):</span>
                <span className="font-semibold text-yellow-400">
                  {state.riskMetrics.volatility.toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Beta:</span>
                <span className="font-semibold">
                  {state.riskMetrics.beta.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Performance vs Risk */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-neon-blue" />
              Risk-Adjusted Returns
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Sharpe Ratio:</span>
                <span className={`font-semibold ${
                  state.riskMetrics.sharpeRatio >= 2 ? 'text-bull-400' :
                  state.riskMetrics.sharpeRatio >= 1 ? 'text-yellow-400' : 'text-bear-400'
                }`}>
                  {state.riskMetrics.sharpeRatio.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Sortino Ratio:</span>
                <span className={`font-semibold ${
                  state.riskMetrics.sortinoRatio >= 2 ? 'text-bull-400' :
                  state.riskMetrics.sortinoRatio >= 1 ? 'text-yellow-400' : 'text-bear-400'
                }`}>
                  {state.riskMetrics.sortinoRatio.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-dark-400">Risk Level:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskLevelColor(state.riskMetrics.riskLevel)}`}>
                  {state.riskMetrics.riskLevel}
                </span>
              </div>
            </div>

            {/* Risk Level Indicator */}
            <div className="mt-6">
              <div className="text-sm text-dark-400 mb-2">Risk Assessment</div>
              <div className="flex space-x-1">
                {['LOW', 'MEDIUM', 'HIGH', 'EXTREME'].map((level, index) => (
                  <div
                    key={level}
                    className={`flex-1 h-2 rounded ${
                      index <= (['LOW', 'MEDIUM', 'HIGH', 'EXTREME'].indexOf(state.riskMetrics.riskLevel))
                        ? index === 0 ? 'bg-bull-400' :
                          index === 1 ? 'bg-yellow-400' :
                          index === 2 ? 'bg-orange-400' : 'bg-bear-400'
                        : 'bg-dark-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Settings Modal */}
      {state.showSettings && (
        <RiskSettingsModal
          limits={state.riskLimits}
          onUpdate={updateRiskLimits}
          onClose={() => setState(prev => ({ ...prev, showSettings: false }))}
        />
      )}
    </div>
  );
};

// Risk Alert Card Component
interface RiskAlertCardProps {
  alert: RiskAlert;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
}

const RiskAlertCard: React.FC<RiskAlertCardProps> = ({ alert, onAcknowledge, onDismiss }) => {
  const severityColor = getSeverityColor(alert.severity);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 border-l-4 ${severityColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">{alert.type.replace('_', ' ')}</span>
            <span className={`px-2 py-1 rounded text-xs ${severityColor}`}>
              {alert.severity}
            </span>
          </div>
          
          <p className="text-sm text-dark-300 mb-2">{alert.message}</p>
          
          <div className="flex items-center space-x-4 text-xs text-dark-400">
            {alert.symbol && (
              <span>Symbol: {alert.symbol}</span>
            )}
            <span>Value: {alert.value.toFixed(2)}</span>
            <span>Threshold: {alert.threshold.toFixed(2)}</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="p-1 hover:bg-bull-500/20 rounded text-bull-400"
            title="Acknowledge"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDismiss(alert.id)}
            className="p-1 hover:bg-bear-500/20 rounded text-bear-400"
            title="Dismiss"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Position Risk Card Component
interface PositionRiskCardProps {
  position: PositionRisk;
}

const PositionRiskCard: React.FC<PositionRiskCardProps> = ({ position }) => {
  const riskColor = position.riskLevel === 'HIGH' ? 'text-bear-400' :
                   position.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-bull-400';
  
  return (
    <div className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
      <div className="flex items-center space-x-4">
        <div>
          <div className="font-semibold">{position.symbol}</div>
          <div className="text-xs text-dark-400">
            {position.positionSize} • {position.daysHeld} days
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-6 text-sm">
        <div className="text-center">
          <div className="text-dark-400">Risk</div>
          <div className={`font-semibold ${riskColor}`}>
            {position.riskPercentage.toFixed(1)}%
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-dark-400">R:R</div>
          <div className="font-semibold">
            {position.riskRewardRatio.toFixed(1)}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-dark-400">Value</div>
          <div className="font-semibold">
            {formatPrice(position.marketValue, 0)}
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded text-xs font-semibold ${getRiskLevelColor(position.riskLevel)}`}>
          {position.riskLevel}
        </div>
      </div>
    </div>
  );
};

// Risk Settings Modal Component
interface RiskSettingsModalProps {
  limits: RiskLimits;
  onUpdate: (limits: Partial<RiskLimits>) => void;
  onClose: () => void;
}

const RiskSettingsModal: React.FC<RiskSettingsModalProps> = ({ limits, onUpdate, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Risk Limits</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Position Risk (%)
            </label>
            <input
              type="number"
              value={limits.maxPositionRisk}
              onChange={(e) => onUpdate({ maxPositionRisk: parseFloat(e.target.value) })}
              className="input-primary w-full"
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Portfolio Risk (%)
            </label>
            <input
              type="number"
              value={limits.maxPortfolioRisk}
              onChange={(e) => onUpdate({ maxPortfolioRisk: parseFloat(e.target.value) })}
              className="input-primary w-full"
              min="1"
              max="50"
              step="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Daily Loss (%)
            </label>
            <input
              type="number"
              value={limits.maxDailyLoss}
              onChange={(e) => onUpdate({ maxDailyLoss: parseFloat(e.target.value) })}
              className="input-primary w-full"
              min="1"
              max="20"
              step="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Drawdown (%)
            </label>
            <input
              type="number"
              value={limits.maxDrawdown}
              onChange={(e) => onUpdate({ maxDrawdown: parseFloat(e.target.value) })}
              className="input-primary w-full"
              min="5"
              max="50"
              step="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              VaR Confidence (%)
            </label>
            <input
              type="number"
              value={limits.varConfidence}
              onChange={(e) => onUpdate({ varConfidence: parseFloat(e.target.value) })}
              className="input-primary w-full"
              min="90"
              max="99.9"
              step="0.1"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onClose} className="btn-primary">
            Save Limits
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper functions
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'LOW':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'MEDIUM':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'HIGH':
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    case 'CRITICAL':
      return 'text-bear-400 bg-bear-500/20 border-bear-500/30';
    default:
      return 'text-dark-400 bg-dark-500/20 border-dark-500/30';
  }
};

const getRiskLevelColor = (level: string) => {
  switch (level) {
    case 'LOW':
      return 'text-bull-400 bg-bull-500/20';
    case 'MEDIUM':
      return 'text-yellow-400 bg-yellow-500/20';
    case 'HIGH':
      return 'text-orange-400 bg-orange-500/20';
    case 'EXTREME':
      return 'text-bear-400 bg-bear-500/20';
    default:
      return 'text-dark-400 bg-dark-500/20';
  }
};

export default RiskPanel;
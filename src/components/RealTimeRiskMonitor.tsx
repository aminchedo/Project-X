import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { realtimeWs } from '../services/websocket';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown,
  Activity,
  DollarSign,
  Percent,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface RiskMetrics {
  current_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  portfolio_risk: number;
  var_95: number;
  sharpe_ratio: number;
  max_drawdown: number;
  current_drawdown: number;
  position_concentration: number;
  total_exposure: number;
  risk_score: number;
}

interface RiskAlert {
  id: string;
  level: 'warning' | 'danger' | 'critical';
  message: string;
  timestamp: string;
}

const RealTimeRiskMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchRiskMetrics();
    connectWebSocket();

    const interval = setInterval(fetchRiskMetrics, 30000); // Update every 30s
    return () => {
      clearInterval(interval);
      realtimeWs.disconnect();
    };
  }, []);

  const fetchRiskMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getRiskMetrics();
      setMetrics(response);
    } catch (err) {
      setError('Failed to load risk metrics');
      console.error('Risk metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    realtimeWs.connect();
    
    realtimeWs.onStateChange((state) => {
      setIsConnected(state === 'connected');
    });

    realtimeWs.onMessage((event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'risk_update') {
          setMetrics(data.metrics);
        } else if (data.type === 'risk_alert') {
          setAlerts(prev => [data.alert, ...prev].slice(0, 5));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  const getRiskLevelConfig = (level: string) => {
    switch (level) {
      case 'LOW':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          gradient: 'from-green-500 to-emerald-600'
        };
      case 'MEDIUM':
        return {
          icon: Activity,
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          gradient: 'from-yellow-500 to-amber-600'
        };
      case 'HIGH':
        return {
          icon: AlertTriangle,
          color: 'text-orange-400',
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/30',
          gradient: 'from-orange-500 to-red-600'
        };
      case 'CRITICAL':
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          gradient: 'from-red-500 to-rose-600'
        };
      default:
        return {
          icon: Activity,
          color: 'text-slate-400',
          bg: 'bg-slate-500/20',
          border: 'border-slate-500/30',
          gradient: 'from-slate-500 to-gray-600'
        };
    }
  };

  const getAlertConfig = (level: string) => {
    switch (level) {
      case 'warning':
        return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
      case 'danger':
        return { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
      case 'critical':
        return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
      default:
        return { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
    }
  };

  if (loading && !metrics) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading risk monitor...</p>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchRiskMetrics}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center">
        <Shield className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400 mb-2">No Risk Data</p>
        <p className="text-slate-500 text-sm">Risk metrics will appear when available</p>
      </div>
    );
  }

  const riskConfig = getRiskLevelConfig(metrics.current_risk_level);
  const RiskIcon = riskConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${riskConfig.gradient}`}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Risk Monitor</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <p className="text-sm text-slate-400">
                {isConnected ? 'Real-time monitoring active' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        <motion.button
          onClick={fetchRiskMetrics}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Current Risk Level */}
      <motion.div
        className={`bg-slate-900/80 backdrop-blur-xl border ${riskConfig.border} shadow-xl rounded-xl p-6`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <RiskIcon className={`w-8 h-8 ${riskConfig.color}`} />
            <div>
              <h3 className="text-lg font-semibold text-slate-50">Current Risk Level</h3>
              <p className="text-sm text-slate-400">Portfolio risk assessment</p>
            </div>
          </div>
          <div className={`px-6 py-3 rounded-xl ${riskConfig.bg} ${riskConfig.border} border-2`}>
            <span className={`text-2xl font-bold ${riskConfig.color}`}>
              {metrics.current_risk_level}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-slate-700/50 rounded-full h-3">
          <motion.div
            className={`bg-gradient-to-r ${riskConfig.gradient} h-3 rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${metrics.risk_score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2">
          <span>Safe</span>
          <span>Risk Score: {metrics.risk_score}%</span>
          <span>Critical</span>
        </div>
      </motion.div>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Portfolio Risk</span>
            <Percent className="text-cyan-400" size={18} />
          </div>
          <p className="text-3xl font-bold text-slate-50 mb-1">
            {metrics.portfolio_risk.toFixed(2)}%
          </p>
          <p className="text-xs text-slate-500">Current exposure</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">VaR (95%)</span>
            <DollarSign className="text-red-400" size={18} />
          </div>
          <p className="text-3xl font-bold text-red-400 mb-1">
            ${metrics.var_95.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-500">Value at Risk</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Sharpe Ratio</span>
            <Activity className="text-purple-400" size={18} />
          </div>
          <p className="text-3xl font-bold text-purple-400 mb-1">
            {metrics.sharpe_ratio.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500">Risk-adjusted return</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Max Drawdown</span>
            <TrendingDown className="text-orange-400" size={18} />
          </div>
          <p className="text-3xl font-bold text-orange-400 mb-1">
            {metrics.max_drawdown.toFixed(2)}%
          </p>
          <p className="text-xs text-slate-500">Historical maximum</p>
        </motion.div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-slate-50 mb-4">Current Drawdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Current</span>
              <span className="text-lg font-bold text-orange-400">{metrics.current_drawdown.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(metrics.current_drawdown / metrics.max_drawdown) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>0%</span>
              <span>Max: {metrics.max_drawdown.toFixed(2)}%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-lg font-semibold text-slate-50 mb-4">Position Concentration</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Concentration</span>
              <span className="text-lg font-bold text-cyan-400">{metrics.position_concentration.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div 
                className="bg-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.position_concentration}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Diversified</span>
              <span>Concentrated</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Risk Alerts */}
      {alerts.length > 0 && (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-lg font-semibold text-slate-50 mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => {
              const alertConfig = getAlertConfig(alert.level);
              const AlertIcon = alertConfig.icon;

              return (
                <motion.div
                  key={alert.id}
                  className={`flex items-start gap-3 p-4 rounded-lg ${alertConfig.bg} border ${alertConfig.border}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AlertIcon className={`w-5 h-5 ${alertConfig.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RealTimeRiskMonitor;

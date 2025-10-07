import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface OverviewStats {
  portfolio_value: number;
  total_pnl: number;
  pnl_percent: number;
  active_positions: number;
  open_signals: number;
  win_rate: number;
  total_trades_today: number;
  market_sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface QuickStat {
  label: string;
  value: string;
  change?: string;
  icon: any;
  color: string;
}

const OverviewPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getOverview();
      setStats(response);
    } catch (err) {
      setError('Failed to load overview');
      console.error('Overview error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading overview...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchOverview}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const quickStats: QuickStat[] = [
    {
      label: 'Portfolio Value',
      value: `$${stats.portfolio_value.toLocaleString()}`,
      change: `${stats.pnl_percent >= 0 ? '+' : ''}${stats.pnl_percent.toFixed(2)}%`,
      icon: DollarSign,
      color: 'cyan'
    },
    {
      label: 'Total P&L',
      value: `${stats.total_pnl >= 0 ? '+' : ''}$${Math.abs(stats.total_pnl).toLocaleString()}`,
      icon: TrendingUp,
      color: stats.total_pnl >= 0 ? 'green' : 'red'
    },
    {
      label: 'Active Positions',
      value: stats.active_positions.toString(),
      icon: Target,
      color: 'purple'
    },
    {
      label: 'Open Signals',
      value: stats.open_signals.toString(),
      icon: Zap,
      color: 'yellow'
    },
    {
      label: 'Win Rate',
      value: `${stats.win_rate.toFixed(1)}%`,
      icon: BarChart3,
      color: 'blue'
    },
    {
      label: 'Today\'s Trades',
      value: stats.total_trades_today.toString(),
      icon: Activity,
      color: 'orange'
    }
  ];

  const sentimentConfig = {
    bullish: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
    bearish: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    neutral: { color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' }
  }[stats.market_sentiment];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-50 mb-2">Welcome Back</h1>
            <p className="text-slate-300">Here's your trading overview for today</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg ${sentimentConfig.bg} border ${sentimentConfig.border}`}>
              <div className="text-xs text-slate-400 mb-1">Market Sentiment</div>
              <div className={`text-lg font-bold ${sentimentConfig.color} capitalize`}>
                {stats.market_sentiment}
              </div>
            </div>

            <motion.button
              onClick={fetchOverview}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            cyan: 'text-cyan-400 bg-cyan-500/20',
            green: 'text-green-400 bg-green-500/20',
            red: 'text-red-400 bg-red-500/20',
            purple: 'text-purple-400 bg-purple-500/20',
            yellow: 'text-yellow-400 bg-yellow-500/20',
            blue: 'text-blue-400 bg-blue-500/20',
            orange: 'text-orange-400 bg-orange-500/20'
          }[stat.color];

          return (
            <motion.div
              key={stat.label}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className={`p-2 rounded-lg ${colorClasses} w-fit mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-sm text-slate-400 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-slate-50">{stat.value}</div>
              {stat.change && (
                <div className={`text-sm font-semibold mt-1 ${
                  stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-center py-12">
          <Activity className="w-20 h-20 mx-auto mb-6 text-slate-600" />
          <h2 className="text-3xl font-bold text-slate-50 mb-3">Your Dashboard</h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Monitor your trading performance, active positions, and market signals in real-time.
            Navigate through the tabs above to access different features.
          </p>
          
          <div className="flex justify-center gap-4">
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-xl transition-all">
              View Scanner
            </button>
            <button className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-xl font-semibold transition-all">
              View Signals
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfessionalLayout;

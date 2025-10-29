import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { TrendingUp, Target, DollarSign, BarChart3, RefreshCw } from 'lucide-react';

interface Metrics {
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  average_win: number;
  average_loss: number;
  largest_win: number;
  largest_loss: number;
  profit_factor: number;
}

const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await api.trading.getPerformanceMetrics();
      setMetrics(response);
    } catch (err) {
      console.error('Metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!metrics) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading metrics...</p>
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Trades', value: metrics.total_trades, icon: BarChart3, color: 'cyan' },
    { label: 'Win Rate', value: `${metrics.win_rate.toFixed(1)}%`, icon: Target, color: 'purple' },
    { label: 'Total P&L', value: `$${metrics.total_pnl.toFixed(2)}`, icon: DollarSign, color: metrics.total_pnl >= 0 ? 'green' : 'red' },
    { label: 'Avg Win', value: `$${metrics.average_win.toFixed(2)}`, icon: TrendingUp, color: 'green' },
    { label: 'Avg Loss', value: `$${metrics.average_loss.toFixed(2)}`, icon: TrendingUp, color: 'red' },
    { label: 'Profit Factor', value: metrics.profit_factor.toFixed(2), icon: TrendingUp, color: 'cyan' }
  ];

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-50">Performance Metrics</h3>
        </div>

        <motion.button
          onClick={fetchMetrics}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          const colorClasses = {
            cyan: 'text-cyan-400 bg-cyan-500/20',
            purple: 'text-purple-400 bg-purple-500/20',
            green: 'text-green-400 bg-green-500/20',
            red: 'text-red-400 bg-red-500/20'
          }[metric.color];

          return (
            <motion.div
              key={metric.label}
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className={`p-2 rounded-lg w-fit mb-2 ${colorClasses}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400 mb-1">{metric.label}</div>
              <div className={`text-xl font-bold ${colorClasses.split(' ')[0]}`}>
                {metric.value}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default PerformanceMetrics;

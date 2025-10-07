import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Activity,
  Calendar,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Percent
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceData {
  total_value: number;
  total_pnl: number;
  total_pnl_percent: number;
  best_performer: { symbol: string; pnl_percent: number };
  worst_performer: { symbol: string; pnl_percent: number };
  total_trades: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  sharpe_ratio: number;
  max_drawdown: number;
  daily_returns: { date: string; return: number; cumulative: number }[];
  monthly_performance: { month: string; pnl: number }[];
  asset_performance: { symbol: string; pnl: number; pnl_percent: number; trades: number }[];
}

const PortfolioPerformance: React.FC = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchPerformance();
  }, [timeframe]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getPortfolioPerformance({ timeframe });
      setData(response);
    } catch (err) {
      setError('Failed to load performance data');
      console.error('Performance error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading performance data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchPerformance}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Charts
  const returnsChartData = {
    labels: data.daily_returns.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Cumulative Return (%)',
        data: data.daily_returns.map(d => d.cumulative),
        borderColor: data.total_pnl >= 0 ? '#4ade80' : '#f87171',
        backgroundColor: data.total_pnl >= 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const monthlyChartData = {
    labels: data.monthly_performance.map(m => m.month),
    datasets: [
      {
        label: 'Monthly P&L ($)',
        data: data.monthly_performance.map(m => m.pnl),
        backgroundColor: data.monthly_performance.map(m => m.pnl >= 0 ? 'rgba(74, 222, 128, 0.6)' : 'rgba(248, 113, 113, 0.6)'),
        borderColor: data.monthly_performance.map(m => m.pnl >= 0 ? '#4ade80' : '#f87171'),
        borderWidth: 1,
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
      },
      y: {
        ticks: { 
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          callback: (value) => value + '%'
        },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
      }
    }
  };

  const barOptions: ChartOptions<'bar'> = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales?.y,
        ticks: {
          ...chartOptions.scales?.y?.ticks,
          callback: (value) => '$' + value.toLocaleString()
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Portfolio Performance</h2>
            <p className="text-sm text-slate-400">Comprehensive performance analytics</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Timeframe Selector */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['7d', '30d', '90d', 'all'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-green-500 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <motion.button
            onClick={fetchPerformance}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          className={`backdrop-blur-xl border shadow-xl rounded-xl p-6 ${
            data.total_pnl >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-5 h-5 ${data.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm text-slate-400">Total P&L</span>
          </div>
          <p className={`text-3xl font-bold ${data.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.total_pnl >= 0 ? '+' : ''}${data.total_pnl.toFixed(2)}
          </p>
          <p className={`text-sm ${data.total_pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.total_pnl_percent >= 0 ? '+' : ''}{data.total_pnl_percent.toFixed(2)}%
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-slate-400">Total Value</span>
          </div>
          <p className="text-3xl font-bold text-slate-50">${data.total_value.toLocaleString()}</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-slate-400">Win Rate</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">{data.win_rate.toFixed(1)}%</p>
          <p className="text-sm text-slate-500">{data.total_trades} trades</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-slate-400">Sharpe Ratio</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{data.sharpe_ratio.toFixed(2)}</p>
        </motion.div>
      </div>

      {/* Best/Worst Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-green-400">Best Performer</h3>
          </div>
          <div className="text-2xl font-bold text-slate-50">{data.best_performer.symbol}</div>
          <div className="text-xl font-bold text-green-400">
            +{data.best_performer.pnl_percent.toFixed(2)}%
          </div>
        </motion.div>

        <motion.div
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-red-400">Worst Performer</h3>
          </div>
          <div className="text-2xl font-bold text-slate-50">{data.worst_performer.symbol}</div>
          <div className="text-xl font-bold text-red-400">
            {data.worst_performer.pnl_percent.toFixed(2)}%
          </div>
        </motion.div>
      </div>

      {/* Returns Chart */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-xl font-semibold text-slate-50 mb-6">Cumulative Returns</h3>
        <div className="h-[300px]">
          <Line data={returnsChartData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Monthly Performance */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="text-xl font-semibold text-slate-50 mb-6">Monthly Performance</h3>
        <div className="h-[300px]">
          <Bar data={monthlyChartData} options={barOptions} />
        </div>
      </motion.div>

      {/* Asset Performance Table */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-slate-50">Asset Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="text-left py-3 px-6 text-slate-300 font-semibold">Symbol</th>
                <th className="text-right py-3 px-6 text-slate-300 font-semibold">P&L</th>
                <th className="text-right py-3 px-6 text-slate-300 font-semibold">Return %</th>
                <th className="text-right py-3 px-6 text-slate-300 font-semibold">Trades</th>
              </tr>
            </thead>
            <tbody>
              {data.asset_performance.map((asset, index) => (
                <motion.tr
                  key={asset.symbol}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.03 }}
                >
                  <td className="py-3 px-6 font-semibold text-slate-50">{asset.symbol}</td>
                  <td className={`text-right py-3 px-6 font-semibold ${
                    asset.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {asset.pnl >= 0 ? '+' : ''}${asset.pnl.toFixed(2)}
                  </td>
                  <td className={`text-right py-3 px-6 font-semibold ${
                    asset.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {asset.pnl_percent >= 0 ? '+' : ''}{asset.pnl_percent.toFixed(2)}%
                  </td>
                  <td className="text-right py-3 px-6 text-slate-300">{asset.trades}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="text-xs text-slate-400 mb-1">Avg Win</div>
          <p className="text-lg font-bold text-green-400">${data.avg_win.toFixed(2)}</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <div className="text-xs text-slate-400 mb-1">Avg Loss</div>
          <p className="text-lg font-bold text-red-400">${data.avg_loss.toFixed(2)}</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <div className="text-xs text-slate-400 mb-1">Profit Factor</div>
          <p className="text-lg font-bold text-cyan-400">{data.profit_factor.toFixed(2)}</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <div className="text-xs text-slate-400 mb-1">Max Drawdown</div>
          <p className="text-lg font-bold text-red-400">{data.max_drawdown.toFixed(2)}%</p>
        </motion.div>
      </div>
    </div>
  );
};

export default PortfolioPerformance;

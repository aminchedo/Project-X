import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Activity,
  AlertCircle,
  Download,
  Calendar,
  Award
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PnLData {
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  best_trade: number;
  worst_trade: number;
  avg_win: number;
  avg_loss: number;
  equity_curve: { date: string; value: number }[];
}

const PnLDashboard: React.FC = () => {
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | 'ALL'>('30D');

  useEffect(() => {
    fetchPnLData();
  }, [timeframe]);

  const fetchPnLData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [equityData, metricsData] = await Promise.all([
        api.trading.getEquityCurve('1D', getTimeframeDays(timeframe)),
        api.trading.getPortfolioMetrics()
      ]);
      
      setPnlData({
        ...metricsData,
        equity_curve: equityData
      });
    } catch (err) {
      setError('Failed to load P&L data');
      console.error('P&L fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeframeDays = (tf: string): number => {
    switch (tf) {
      case '7D': return 7;
      case '30D': return 30;
      case '90D': return 90;
      case 'ALL': return 365;
      default: return 30;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading P&L data...</p>
      </div>
    );
  }

  if (error || !pnlData) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error || 'No data available'}</p>
        <button 
          onClick={fetchPnLData}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare equity curve chart
  const chartData = {
    labels: pnlData.equity_curve.map(d => d.date),
    datasets: [
      {
        label: 'Equity Curve',
        data: pnlData.equity_curve.map(d => d.value),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `Value: $${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 }
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)'
        }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)'
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
        <div>
          <h2 className="text-2xl font-bold text-slate-50">P&L Dashboard</h2>
          <p className="text-sm text-slate-400">Track your trading performance</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-800 rounded-lg p-1">
            {(['7D', '30D', '90D', 'ALL'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  timeframe === tf
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-slate-50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium shadow-lg shadow-purple-500/20"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm font-medium">Total P&L</span>
            <DollarSign className={pnlData.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'} size={20} />
          </div>
          <p className={`text-3xl font-bold mb-2 ${pnlData.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnlData.total_pnl >= 0 ? '+' : ''}${pnlData.total_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-slate-400">All time</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm font-medium">Win Rate</span>
            <Target className="text-cyan-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-50 mb-2">
            {pnlData.win_rate.toFixed(1)}%
          </p>
          <p className="text-sm text-slate-400">
            {pnlData.winning_trades}W / {pnlData.losing_trades}L
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm font-medium">Best Trade</span>
            <TrendingUp className="text-green-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-green-400 mb-2">
            +${pnlData.best_trade.toFixed(2)}
          </p>
          <p className="text-sm text-slate-400">Single trade</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm font-medium">Worst Trade</span>
            <TrendingDown className="text-red-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-red-400 mb-2">
            ${pnlData.worst_trade.toFixed(2)}
          </p>
          <p className="text-sm text-slate-400">Single trade</p>
        </motion.div>
      </div>

      {/* Equity Curve Chart */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-slate-50 mb-6">Equity Curve</h3>
        <div className="h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
            <Award className="text-cyan-400" size={20} />
            Win/Loss Analysis
          </h3>
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Average Win</span>
                <span className="text-lg font-bold text-green-400">+${pnlData.avg_win.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.min((pnlData.avg_win / (pnlData.avg_win + Math.abs(pnlData.avg_loss))) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Average Loss</span>
                <span className="text-lg font-bold text-red-400">${pnlData.avg_loss.toFixed(2)}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${Math.min((Math.abs(pnlData.avg_loss) / (pnlData.avg_win + Math.abs(pnlData.avg_loss))) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Profit Factor</span>
                <span className="text-lg font-bold text-cyan-400">
                  {(pnlData.avg_win / Math.abs(pnlData.avg_loss)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
            <Activity className="text-purple-400" size={20} />
            Trading Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-700">
              <span className="text-slate-400">Total Trades</span>
              <span className="text-lg font-semibold text-slate-50">{pnlData.total_trades}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-700">
              <span className="text-slate-400">Winning Trades</span>
              <span className="text-lg font-semibold text-green-400">{pnlData.winning_trades}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-700">
              <span className="text-slate-400">Losing Trades</span>
              <span className="text-lg font-semibold text-red-400">{pnlData.losing_trades}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-400">Win Rate</span>
              <span className="text-lg font-semibold text-cyan-400">{pnlData.win_rate.toFixed(1)}%</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PnLDashboard;

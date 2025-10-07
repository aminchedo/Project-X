import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { api } from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon,
  AlertCircle,
  RefreshCw,
  Download,
  Target
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Position {
  symbol: string;
  amount: number;
  value: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_percentage: number;
}

interface PortfolioSummary {
  total_value: number;
  total_pnl: number;
  total_pnl_percentage: number;
  positions: Position[];
  allocation: { [key: string]: number };
}

const PortfolioPanel: React.FC = () => {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getPortfolioSummary();
      setSummary(response);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to load portfolio data');
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading portfolio...</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchPortfolioData}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center">
        <PieChartIcon className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400 mb-2">No Portfolio Data</p>
        <p className="text-slate-500 text-sm">Start trading to see your portfolio</p>
      </div>
    );
  }

  // Prepare pie chart data
  const allocationData = {
    labels: Object.keys(summary.allocation),
    datasets: [
      {
        data: Object.values(summary.allocation),
        backgroundColor: [
          '#06b6d4', // cyan
          '#22c55e', // green
          '#f59e0b', // amber
          '#a855f7', // purple
          '#ef4444', // red
          '#3b82f6', // blue
          '#ec4899', // pink
          '#14b8a6', // teal
        ],
        borderColor: '#1e293b',
        borderWidth: 2,
      }
    ]
  };

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#f8fafc',
          font: {
            family: 'Inter',
            size: 12
          },
          padding: 15,
          usePointStyle: true
        }
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
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toFixed(2)}%`;
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Portfolio Overview</h2>
          <p className="text-sm text-slate-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            onClick={fetchPortfolioData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm font-medium">Total Value</span>
            <DollarSign className="text-cyan-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-50 mb-2">
            ${summary.total_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-slate-400">Portfolio balance</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm font-medium">Total P&L</span>
            {summary.total_pnl >= 0 ? (
              <TrendingUp className="text-green-400" size={20} />
            ) : (
              <TrendingDown className="text-red-400" size={20} />
            )}
          </div>
          <p className={`text-3xl font-bold mb-2 ${summary.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {summary.total_pnl >= 0 ? '+' : ''}${summary.total_pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm font-semibold ${summary.total_pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {summary.total_pnl_percentage >= 0 ? '+' : ''}{summary.total_pnl_percentage.toFixed(2)}%
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
            <span className="text-slate-400 text-sm font-medium">Positions</span>
            <Target className="text-purple-400" size={20} />
          </div>
          <p className="text-3xl font-bold text-slate-50 mb-2">
            {summary.positions.length}
          </p>
          <p className="text-sm text-slate-400">Active positions</p>
        </motion.div>
      </div>

      {/* Asset Allocation Chart */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold text-slate-50 mb-6">Asset Allocation</h3>
        <div className="h-[300px]">
          <Pie data={allocationData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Positions Table */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-slate-50">Open Positions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="text-left py-4 px-6 text-slate-300 font-semibold">Symbol</th>
                <th className="text-right py-4 px-6 text-slate-300 font-semibold">Amount</th>
                <th className="text-right py-4 px-6 text-slate-300 font-semibold">Entry</th>
                <th className="text-right py-4 px-6 text-slate-300 font-semibold">Current</th>
                <th className="text-right py-4 px-6 text-slate-300 font-semibold">Value</th>
                <th className="text-right py-4 px-6 text-slate-300 font-semibold">P&L</th>
              </tr>
            </thead>
            <tbody>
              {summary.positions.map((position, index) => (
                <motion.tr
                  key={position.symbol}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <td className="py-4 px-6 font-bold text-slate-50">{position.symbol}</td>
                  <td className="py-4 px-6 text-right text-slate-300 font-mono">{position.amount.toFixed(4)}</td>
                  <td className="py-4 px-6 text-right text-slate-300 font-mono">${position.entry_price.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right text-slate-300 font-mono">${position.current_price.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right text-slate-50 font-semibold">${position.value.toFixed(2)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className={`font-semibold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                    </div>
                    <div className={`text-sm ${position.pnl_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.pnl_percentage >= 0 ? '+' : ''}{position.pnl_percentage.toFixed(2)}%
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default PortfolioPanel;

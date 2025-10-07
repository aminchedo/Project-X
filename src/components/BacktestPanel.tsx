import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';
import { 
  TestTube, 
  Play, 
  Download,
  TrendingUp,
  Target,
  AlertCircle,
  Calendar,
  DollarSign,
  Percent,
  Activity
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

interface BacktestConfig {
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  strategy: {
    name: string;
    parameters: any;
  };
}

interface BacktestResult {
  total_return: number;
  total_trades: number;
  win_rate: number;
  sharpe_ratio: number;
  max_drawdown: number;
  profit_factor: number;
  equity_curve: { date: string; value: number }[];
  trades: any[];
}

const BacktestPanel: React.FC = () => {
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: 'BTCUSDT',
    start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    initial_capital: 10000,
    strategy: {
      name: 'RSI_MACD_Combined',
      parameters: {}
    }
  });
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.runBacktest(config);
      setResults(response);
    } catch (err) {
      setError('Backtest failed. Please check your configuration.');
      console.error('Backtest error:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = results ? {
    labels: results.equity_curve.map(e => e.date),
    datasets: [
      {
        label: 'Equity Curve',
        data: results.equity_curve.map(e => e.value),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  } : { labels: [], datasets: [] };

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
        ticks: { color: '#94a3b8', font: { family: 'Inter' } },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
      },
      y: {
        ticks: { 
          color: '#94a3b8',
          font: { family: 'Inter' },
          callback: (value) => '$' + value.toLocaleString()
        },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
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
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
            <TestTube className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Strategy Backtesting</h2>
            <p className="text-sm text-slate-400">Test strategies on historical data</p>
          </div>
        </div>
      </motion.div>

      {/* Configuration */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-slate-50 mb-4">Backtest Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Symbol</label>
            <select
              value={config.symbol}
              onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
            >
              <option value="BTCUSDT">BTC/USDT</option>
              <option value="ETHUSDT">ETH/USDT</option>
              <option value="BNBUSDT">BNB/USDT</option>
              <option value="SOLUSDT">SOL/USDT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Initial Capital</label>
            <input
              type="number"
              value={config.initial_capital}
              onChange={(e) => setConfig({ ...config, initial_capital: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
            <input
              type="date"
              value={config.start_date}
              onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
            <input
              type="date"
              value={config.end_date}
              onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <motion.button
          onClick={handleRunBacktest}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
            loading
              ? 'bg-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-purple-500/20'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Running Backtest...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Backtest
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {results && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <motion.div
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400">Total Return</span>
              </div>
              <p className={`text-xl font-bold ${results.total_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {results.total_return >= 0 ? '+' : ''}{results.total_return.toFixed(2)}%
              </p>
            </motion.div>

            <motion.div
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400">Total Trades</span>
              </div>
              <p className="text-xl font-bold text-slate-50">{results.total_trades}</p>
            </motion.div>

            <motion.div
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-400">Win Rate</span>
              </div>
              <p className="text-xl font-bold text-green-400">{results.win_rate.toFixed(1)}%</p>
            </motion.div>

            <motion.div
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400">Sharpe Ratio</span>
              </div>
              <p className="text-xl font-bold text-blue-400">{results.sharpe_ratio.toFixed(2)}</p>
            </motion.div>

            <motion.div
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs text-slate-400">Max Drawdown</span>
              </div>
              <p className="text-xl font-bold text-red-400">{results.max_drawdown.toFixed(2)}%</p>
            </motion.div>

            <motion.div
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-slate-400">Profit Factor</span>
              </div>
              <p className="text-xl font-bold text-yellow-400">{results.profit_factor.toFixed(2)}</p>
            </motion.div>
          </div>

          {/* Equity Curve */}
          <motion.div
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-50">Equity Curve</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 rounded-lg font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
            </div>
            <div className="h-[400px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* Trade History */}
          <motion.div
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-slate-50">Trade History</h3>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold text-sm">Date</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold text-sm">Type</th>
                    <th className="text-right py-3 px-4 text-slate-300 font-semibold text-sm">Entry</th>
                    <th className="text-right py-3 px-4 text-slate-300 font-semibold text-sm">Exit</th>
                    <th className="text-right py-3 px-4 text-slate-300 font-semibold text-sm">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {results.trades.slice(0, 20).map((trade, index) => (
                    <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-slate-300 text-sm">{trade.date}</td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-slate-300 font-mono">${trade.entry_price}</td>
                      <td className="text-right py-3 px-4 text-slate-300 font-mono">${trade.exit_price}</td>
                      <td className={`text-right py-3 px-4 font-semibold ${
                        trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {/* No Results State */}
      {!results && !loading && !error && (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <TestTube className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">Ready to Backtest</h3>
          <p className="text-slate-400">Configure your strategy and click "Run Backtest"</p>
        </motion.div>
      )}
    </div>
  );
};

export default BacktestPanel;

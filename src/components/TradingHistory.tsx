import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import {
  History,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  Search,
  ChevronDown
} from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  entry_price: number;
  exit_price: number;
  quantity: number;
  pnl: number;
  pnl_percent: number;
  entry_time: string;
  exit_time: string;
  duration: string;
  strategy: string;
  status: 'completed' | 'stopped' | 'target_reached';
}

const TradingHistory: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'winners' | 'losers'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'symbol'>('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchTrades();
  }, [selectedPeriod]);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getTradingHistory({ period: selectedPeriod });
      setTrades(response || []);
    } catch (err) {
      setError('Failed to load trading history');
      console.error('Trading history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Symbol', 'Type', 'Entry', 'Exit', 'Quantity', 'P&L', 'P&L %', 'Duration', 'Strategy'].join(','),
      ...filteredTrades.map(t => [
        new Date(t.exit_time).toLocaleDateString(),
        t.symbol,
        t.type,
        t.entry_price,
        t.exit_price,
        t.quantity,
        t.pnl,
        t.pnl_percent,
        t.duration,
        t.strategy
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTrades = trades
    .filter(t => {
      if (filter === 'winners') return t.pnl > 0;
      if (filter === 'losers') return t.pnl < 0;
      return true;
    })
    .filter(t => searchTerm === '' || t.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'pnl':
          return b.pnl - a.pnl;
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'date':
        default:
          return new Date(b.exit_time).getTime() - new Date(a.exit_time).getTime();
      }
    });

  const stats = {
    total: trades.length,
    winners: trades.filter(t => t.pnl > 0).length,
    losers: trades.filter(t => t.pnl < 0).length,
    totalPnL: trades.reduce((sum, t) => sum + t.pnl, 0),
    avgPnL: trades.length > 0 ? trades.reduce((sum, t) => sum + t.pnl, 0) / trades.length : 0,
  };

  if (loading && trades.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading trading history...</p>
      </div>
    );
  }

  if (error && trades.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchTrades}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

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
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Trading History</h2>
            <p className="text-sm text-slate-400">{trades.length} total trades</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Period Selector */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['7d', '30d', '90d', 'all'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {period.toUpperCase()}
              </button>
            ))}
          </div>

          <motion.button
            onClick={handleExport}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 rounded-lg font-medium"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </motion.button>

          <motion.button
            onClick={fetchTrades}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-sm text-slate-400 mb-1">Total Trades</div>
          <p className="text-3xl font-bold text-slate-50">{stats.total}</p>
        </motion.div>

        <motion.div
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-sm text-green-400 mb-1">Winners</div>
          <p className="text-3xl font-bold text-green-400">{stats.winners}</p>
          <p className="text-xs text-green-400/70">{((stats.winners / stats.total) * 100).toFixed(1)}%</p>
        </motion.div>

        <motion.div
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-sm text-red-400 mb-1">Losers</div>
          <p className="text-3xl font-bold text-red-400">{stats.losers}</p>
          <p className="text-xs text-red-400/70">{((stats.losers / stats.total) * 100).toFixed(1)}%</p>
        </motion.div>

        <motion.div
          className={`backdrop-blur-xl border shadow-xl rounded-xl p-6 ${
            stats.totalPnL >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={`text-sm mb-1 ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>Total P&L</div>
          <p className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)}
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbol..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Filter size={16} />
              Filter:
            </span>
            {(['all', 'winners', 'losers'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <ChevronDown size={16} />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm focus:border-cyan-500 focus:outline-none"
            >
              <option value="date">Date</option>
              <option value="pnl">P&L</option>
              <option value="symbol">Symbol</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Trades Table */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700 sticky top-0">
              <tr>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold text-sm">Date</th>
                <th className="text-left py-3 px-4 text-slate-300 font-semibold text-sm">Symbol</th>
                <th className="text-center py-3 px-4 text-slate-300 font-semibold text-sm">Type</th>
                <th className="text-right py-3 px-4 text-slate-300 font-semibold text-sm">Entry</th>
                <th className="text-right py-3 px-4 text-slate-300 font-semibold text-sm">Exit</th>
                <th className="text-right py-3 px-4 text-slate-300 font-semibold text-sm">Quantity</th>
                <th className="text-right py-3 px-4 text-slate-300 font-semibold text-sm">P&L</th>
                <th className="text-right py-3 px-4 text-slate-300 font-semibold text-sm">Return</th>
                <th className="text-center py-3 px-4 text-slate-300 font-semibold text-sm">Duration</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredTrades.map((trade, index) => (
                  <motion.tr
                    key={trade.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {new Date(trade.exit_time).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-50">{trade.symbol}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-slate-300 font-mono text-sm">
                      ${trade.entry_price.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-300 font-mono text-sm">
                      ${trade.exit_price.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 text-slate-300 text-sm">{trade.quantity}</td>
                    <td className={`text-right py-3 px-4 font-semibold ${
                      trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${
                      trade.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
                    </td>
                    <td className="text-center py-3 px-4 text-slate-400 text-sm">{trade.duration}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredTrades.length === 0 && (
            <div className="p-12 text-center">
              <History className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400">No trades found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TradingHistory;

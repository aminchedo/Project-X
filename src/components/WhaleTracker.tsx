import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { realtimeWs } from '../services/websocket';
import {
  Waves,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Activity,
  Filter
} from 'lucide-react';

interface WhaleTransaction {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  value_usd: number;
  from_address: string;
  to_address: string;
  timestamp: string;
  exchange?: string;
}

interface WhaleTrackerProps {
  minValue?: number;
}

const WhaleTracker: React.FC<WhaleTrackerProps> = ({ minValue = 100000 }) => {
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [stats, setStats] = useState({
    total_volume_24h: 0,
    buy_volume: 0,
    sell_volume: 0,
    whale_count: 0
  });

  useEffect(() => {
    fetchWhaleTransactions();
    connectWebSocket();

    const interval = setInterval(fetchWhaleTransactions, 30000);
    return () => {
      clearInterval(interval);
      realtimeWs.disconnect();
    };
  }, [minValue]);

  const fetchWhaleTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.analytics.getWhaleTransactions({ min_value: minValue });
      setTransactions(response.transactions || []);
      setStats(response.stats || stats);
    } catch (err) {
      setError('Failed to load whale transactions');
      console.error('Whale tracker error:', err);
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
        const message = JSON.parse(event.data);
        if (message.type === 'whale_transaction') {
          setTransactions(prev => [message.data, ...prev].slice(0, 50));
          
          // Update stats
          setStats(prev => ({
            ...prev,
            total_volume_24h: prev.total_volume_24h + message.data.value_usd,
            buy_volume: message.data.type === 'buy' ? prev.buy_volume + message.data.value_usd : prev.buy_volume,
            sell_volume: message.data.type === 'sell' ? prev.sell_volume + message.data.value_usd : prev.sell_volume,
            whale_count: prev.whale_count + 1
          }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  const getTransactionConfig = (type: string) => {
    switch (type) {
      case 'buy':
        return {
          icon: TrendingUp,
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30',
          label: 'BUY'
        };
      case 'sell':
        return {
          icon: TrendingDown,
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30',
          label: 'SELL'
        };
      default:
        return {
          icon: ArrowRight,
          bg: 'bg-blue-500/20',
          text: 'text-blue-400',
          border: 'border-blue-500/30',
          label: 'TRANSFER'
        };
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' || tx.type === filter
  );

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading whale activity...</p>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchWhaleTransactions}
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
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Whale Tracker</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <p className="text-sm text-slate-400">
                {isConnected ? 'Real-time whale monitoring' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Filter */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['all', 'buy', 'sell'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <motion.button
            onClick={fetchWhaleTransactions}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-slate-400">24h Volume</span>
          </div>
          <p className="text-2xl font-bold text-slate-50">
            ${(stats.total_volume_24h / 1000000).toFixed(2)}M
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Buy Volume</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            ${(stats.buy_volume / 1000000).toFixed(2)}M
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-sm text-slate-400">Sell Volume</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            ${(stats.sell_volume / 1000000).toFixed(2)}M
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-slate-400">Transactions</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{stats.whale_count}</p>
        </motion.div>
      </div>

      {/* Transactions List */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-slate-50">Recent Whale Transactions</h3>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <Waves className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No whale transactions found</p>
              </div>
            ) : (
              filteredTransactions.map((tx, index) => {
                const config = getTransactionConfig(tx.type);
                const Icon = config.icon;

                return (
                  <motion.div
                    key={tx.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="p-6 flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${config.bg} border ${config.border}`}>
                        <Icon className={`w-6 h-6 ${config.text}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-slate-50">{tx.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}>
                            {config.label}
                          </span>
                          {tx.exchange && (
                            <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs">
                              {tx.exchange}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-slate-400">
                            <span className="font-mono">{formatAddress(tx.from_address)}</span>
                            <ArrowRight className="inline w-3 h-3 mx-1" />
                            <span className="font-mono">{formatAddress(tx.to_address)}</span>
                          </div>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-50 mb-1">
                          {tx.amount.toLocaleString()} {tx.symbol.replace('USDT', '')}
                        </div>
                        <div className="text-lg font-semibold text-cyan-400">
                          ${(tx.value_usd / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default WhaleTracker;

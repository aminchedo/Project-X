import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { realtimeWs } from '../services/websocket';
import { playSound } from '../utils/sound';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronDown,
  Clock,
  Target
} from 'lucide-react';

interface Signal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  confidence: number;
  timeframe: string;
  created_at: string;
  status: 'active' | 'completed' | 'expired';
  indicators: string[];
}

interface SignalsListProps {
  onSignalClick?: (signal: Signal) => void;
}

const SignalsList: React.FC<SignalsListProps> = ({ onSignalClick }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'confidence' | 'time'>('confidence');

  useEffect(() => {
    fetchSignals();
    connectWebSocket();

    const interval = setInterval(fetchSignals, 30000);
    return () => {
      clearInterval(interval);
      realtimeWs.disconnect();
    };
  }, [statusFilter]);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.signals.getSignals({ status: statusFilter });
      setSignals(response || []);
    } catch (err) {
      setError('Failed to load signals');
      console.error('Signals error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    realtimeWs.connect();
    
    realtimeWs.onStateChange((state) => {
      setIsConnected(state === 'connected');
    });

    realtimeWs.onMessage(async (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'new_signal') {
          // Play sound when new signal is detected
          try {
            await playSound.signalDetected();
          } catch (err) {
            // Silently handle sound errors
            console.log('Sound playback skipped for signal:', err);
          }
          
          setSignals(prev => [message.data, ...prev]);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  const filteredSignals = signals
    .filter(s => filter === 'all' || s.type === filter)
    .filter(s => searchTerm === '' || s.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'BUY':
        return { icon: TrendingUp, bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
      case 'SELL':
        return { icon: TrendingDown, bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      default:
        return { icon: TrendingUp, bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
    }
  };

  if (loading && signals.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading signals...</p>
      </div>
    );
  }

  if (error && signals.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchSignals}
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
          <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Trading Signals</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <p className="text-sm text-slate-400">
                {signals.length} signal{signals.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <motion.button
          onClick={fetchSignals}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="signals-search"
              name="signals-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbols..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {(['all', 'BUY', 'SELL'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-sm focus:border-cyan-500 focus:outline-none"
          >
            <option value="confidence">Confidence</option>
            <option value="time">Time</option>
          </select>
        </div>
      </motion.div>

      {/* Signals List */}
      {filteredSignals.length === 0 ? (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Zap className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">No Signals Found</h3>
          <p className="text-slate-400">
            {searchTerm ? 'Try adjusting your filters' : 'New signals will appear here'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredSignals.map((signal, index) => {
              const config = getTypeConfig(signal.type);
              const Icon = config.icon;

              return (
                <motion.div
                  key={signal.id}
                  className={`bg-slate-900/80 backdrop-blur-xl border ${config.border} shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all cursor-pointer`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => onSignalClick?.(signal)}
                  whileHover={{ scale: 1.02, y: -4 }}
                  layout
                >
                  {/* Header */}
                  <div className={`p-4 ${config.bg} border-b ${config.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.bg} border ${config.border}`}>
                          <Icon className={`w-5 h-5 ${config.text}`} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-50">{signal.symbol}</h3>
                          <span className={`text-sm font-bold ${config.text}`}>{signal.type}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-slate-400">Confidence</div>
                        <div className={`text-xl font-bold ${
                          signal.confidence >= 80 ? 'text-green-400' :
                          signal.confidence >= 60 ? 'text-cyan-400' :
                          'text-yellow-400'
                        }`}>
                          {signal.confidence}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Entry</div>
                        <div className="text-lg font-bold text-slate-50">${signal.entry_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Target</div>
                        <div className="text-lg font-bold text-green-400">${signal.target_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Stop</div>
                        <div className="text-lg font-bold text-red-400">${signal.stop_loss.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Indicators */}
                    {signal.indicators && signal.indicators.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {signal.indicators.slice(0, 3).map((indicator, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded text-xs font-medium"
                          >
                            {indicator}
                          </span>
                        ))}
                        {signal.indicators.length > 3 && (
                          <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">
                            +{signal.indicators.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        <span>{signal.timeframe}</span>
                        <span>•</span>
                        <span>{new Date(signal.created_at).toLocaleTimeString()}</span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSignalClick?.(signal);
                        }}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SignalsList;

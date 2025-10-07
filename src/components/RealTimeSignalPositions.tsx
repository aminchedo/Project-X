import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { realtimeWs } from '../services/websocket';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Clock,
  DollarSign,
  Percent,
  RefreshCw,
  X
} from 'lucide-react';

interface Position {
  id: string;
  signal_id: string;
  symbol: string;
  type: 'long' | 'short';
  entry_price: number;
  current_price: number;
  target_price: number;
  stop_loss: number;
  quantity: number;
  pnl: number;
  pnl_percent: number;
  status: 'active' | 'winning' | 'losing' | 'near_target' | 'near_stop';
  opened_at: string;
  duration: string;
}

const RealTimeSignalPositions: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'winning' | 'losing'>('all');

  useEffect(() => {
    fetchPositions();
    connectWebSocket();

    const interval = setInterval(fetchPositions, 10000);
    return () => {
      clearInterval(interval);
      realtimeWs.disconnect();
    };
  }, []);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getActivePositions();
      setPositions(response || []);
    } catch (err) {
      setError('Failed to load positions');
      console.error('Positions error:', err);
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
        if (message.type === 'position_update') {
          setPositions(prev => 
            prev.map(p => p.id === message.data.id ? message.data : p)
          );
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  const handleClosePosition = async (positionId: string) => {
    if (!confirm('Close this position?')) return;
    
    try {
      await api.trading.closePosition(positionId);
      setPositions(positions.filter(p => p.id !== positionId));
    } catch (err) {
      console.error('Close position error:', err);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'winning':
        return { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', label: 'Winning' };
      case 'losing':
        return { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', label: 'Losing' };
      case 'near_target':
        return { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', label: 'Near Target' };
      case 'near_stop':
        return { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', label: 'Near Stop' };
      default:
        return { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400', label: 'Active' };
    }
  };

  const filteredPositions = positions.filter(p => {
    if (filter === 'winning') return p.pnl > 0;
    if (filter === 'losing') return p.pnl < 0;
    return true;
  });

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalValue = positions.reduce((sum, p) => sum + (p.quantity * p.current_price), 0);
  const winningCount = positions.filter(p => p.pnl > 0).length;

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
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Active Positions</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <p className="text-sm text-slate-400">
                {isConnected ? 'Real-time updates' : 'Disconnected'} • {positions.length} open
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Filter */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['all', 'winning', 'losing'] as const).map(f => (
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
            onClick={fetchPositions}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className={`backdrop-blur-xl border shadow-xl rounded-xl p-6 ${
            totalPnL >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-5 h-5 ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm text-slate-400">Total P&L</span>
          </div>
          <p className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
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
          <p className="text-3xl font-bold text-slate-50">${totalValue.toFixed(2)}</p>
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
          <p className="text-3xl font-bold text-purple-400">
            {positions.length > 0 ? ((winningCount / positions.length) * 100).toFixed(0) : 0}%
          </p>
        </motion.div>
      </div>

      {/* Positions List */}
      {filteredPositions.length === 0 ? (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Activity className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">No Active Positions</h3>
          <p className="text-slate-400">
            {filter !== 'all' ? `No ${filter} positions` : 'Open positions will appear here'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredPositions.map((position, index) => {
              const statusConfig = getStatusConfig(position.status);
              const priceDistance = position.type === 'long'
                ? ((position.current_price - position.entry_price) / position.entry_price) * 100
                : ((position.entry_price - position.current_price) / position.entry_price) * 100;

              return (
                <motion.div
                  key={position.id}
                  className={`bg-slate-900/80 backdrop-blur-xl border ${statusConfig.border} shadow-xl rounded-xl overflow-hidden`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  {/* Header */}
                  <div className="p-6 border-b border-slate-800">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-slate-50">{position.symbol}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            position.type === 'long' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {position.type.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{position.duration}</span>
                          </div>
                          <span>•</span>
                          <span>Qty: {position.quantity}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClosePosition(position.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-red-400" />
                      </button>
                    </div>

                    {/* P&L Display */}
                    <div className={`flex items-center justify-between p-4 rounded-lg ${statusConfig.bg} border ${statusConfig.border}`}>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Unrealized P&L</div>
                        <div className={`text-3xl font-bold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400 mb-1">Return</div>
                        <div className={`text-2xl font-bold ${position.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {position.pnl_percent >= 0 ? '+' : ''}{position.pnl_percent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Levels */}
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Entry Price</div>
                      <div className="text-lg font-bold text-slate-50">${position.entry_price.toFixed(2)}</div>
                    </div>

                    <div>
                      <div className="text-sm text-slate-400 mb-1">Current Price</div>
                      <div className="text-lg font-bold text-cyan-400">${position.current_price.toFixed(2)}</div>
                      <div className={`text-xs ${priceDistance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {priceDistance >= 0 ? '+' : ''}{priceDistance.toFixed(2)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-slate-400 mb-1">Target</div>
                      <div className="text-lg font-bold text-green-400">${position.target_price.toFixed(2)}</div>
                    </div>

                    <div>
                      <div className="text-sm text-slate-400 mb-1">Stop Loss</div>
                      <div className="text-lg font-bold text-red-400">${position.stop_loss.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-6 pb-6">
                    <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="absolute inset-0 flex">
                        <div className="w-1/3 bg-red-500/30"></div>
                        <div className="w-1/3 bg-slate-700"></div>
                        <div className="w-1/3 bg-green-500/30"></div>
                      </div>
                      <motion.div
                        className={`absolute top-0 h-full w-1 ${
                          position.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        initial={{ left: '50%' }}
                        animate={{
                          left: `${50 + (priceDistance / ((position.target_price - position.stop_loss) / position.entry_price * 100)) * 50}%`
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                      <span>Stop Loss</span>
                      <span>Entry</span>
                      <span>Target</span>
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

export default RealTimeSignalPositions;

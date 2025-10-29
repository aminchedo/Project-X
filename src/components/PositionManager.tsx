import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { realtimeWs } from '../services/websocket';
import {
  Target,
  TrendingUp,
  TrendingDown,
  X,
  Edit,
  Save,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Activity,
  Percent,
  Clock
} from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entry_price: number;
  current_price: number;
  quantity: number;
  pnl: number;
  pnl_percent: number;
  target_price: number;
  stop_loss: number;
  status: 'active' | 'near_target' | 'near_stop';
  opened_at: string;
  unrealized_pnl: number;
}

const PositionManager: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [editingPosition, setEditingPosition] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ target: string; stopLoss: string }>({ target: '', stopLoss: '' });

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
      const response = await api.trading.getPositions();
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
            prev.map(p => p.id === message.data.id ? { ...p, ...message.data } : p)
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

  const handleStartEdit = (position: Position) => {
    setEditingPosition(position.id);
    setEditValues({
      target: position.target_price.toString(),
      stopLoss: position.stop_loss.toString()
    });
  };

  const handleSaveEdit = async (positionId: string) => {
    try {
      await api.trading.updatePosition(positionId, {
        target_price: parseFloat(editValues.target),
        stop_loss: parseFloat(editValues.stopLoss)
      });
      
      setPositions(positions.map(p => 
        p.id === positionId 
          ? { ...p, target_price: parseFloat(editValues.target), stop_loss: parseFloat(editValues.stopLoss) }
          : p
      ));
      setEditingPosition(null);
    } catch (err) {
      console.error('Update position error:', err);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'near_target':
        return { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' };
      case 'near_stop':
        return { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' };
      default:
        return { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' };
    }
  };

  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalValue = positions.reduce((sum, p) => sum + (p.quantity * p.current_price), 0);

  if (loading && positions.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading positions...</p>
      </div>
    );
  }

  if (error && positions.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchPositions}
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
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Position Manager</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <p className="text-sm text-slate-400">
                {positions.length} open position{positions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
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
            <span className="text-sm text-slate-400">Total Unrealized P&L</span>
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
          <p className="text-3xl font-bold text-slate-50">${totalValue.toLocaleString()}</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-slate-400">Open Positions</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">{positions.length}</p>
        </motion.div>
      </div>

      {/* Positions List */}
      {positions.length === 0 ? (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Target className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">No Open Positions</h3>
          <p className="text-slate-400">Open positions will appear here</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {positions.map((position, index) => {
              const statusConfig = getStatusConfig(position.status);
              const isEditing = editingPosition === position.id;

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
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
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
                            {position.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{new Date(position.opened_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {!isEditing ? (
                          <>
                            <motion.button
                              onClick={() => handleStartEdit(position)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit className="w-5 h-5 text-cyan-400" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleClosePosition(position.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-red-400" />
                            </motion.button>
                          </>
                        ) : (
                          <>
                            <motion.button
                              onClick={() => handleSaveEdit(position.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                            >
                              <Save className="w-5 h-5 text-green-400" />
                            </motion.button>
                            <motion.button
                              onClick={() => setEditingPosition(null)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5 text-slate-400" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* P&L Display */}
                    <div className={`p-4 rounded-lg mb-6 ${statusConfig.bg} border ${statusConfig.border}`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-slate-400 mb-1">Unrealized P&L</div>
                          <div className={`text-2xl font-bold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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

                    {/* Position Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Entry Price</div>
                        <div className="text-lg font-bold text-slate-50">${position.entry_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Current Price</div>
                        <div className="text-lg font-bold text-cyan-400">${position.current_price.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Quantity</div>
                        <div className="text-lg font-bold text-slate-50">{position.quantity}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Position Size</div>
                        <div className="text-lg font-bold text-purple-400">
                          ${(position.quantity * position.current_price).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Target & Stop Loss */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-slate-400 mb-2">Take Profit</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.target}
                            onChange={(e) => setEditValues({ ...editValues, target: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 font-mono focus:border-green-500 focus:outline-none"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="text-lg font-bold text-green-400">${position.target_price.toFixed(2)}</div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-2">Stop Loss</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.stopLoss}
                            onChange={(e) => setEditValues({ ...editValues, stopLoss: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 font-mono focus:border-red-500 focus:outline-none"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="text-lg font-bold text-red-400">${position.stop_loss.toFixed(2)}</div>
                          </div>
                        )}
                      </div>
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

export default PositionManager;

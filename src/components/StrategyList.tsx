import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import {
  Layers,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  AlertCircle,
  Plus,
  Star
} from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  performance: {
    total_trades: number;
    win_rate: number;
    total_pnl: number;
    pnl_percent: number;
  };
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
}

interface StrategyListProps {
  onEdit?: (strategyId: string) => void;
  onCreate?: () => void;
}

const StrategyList: React.FC<StrategyListProps> = ({ onEdit, onCreate }) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'draft'>('all');

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getStrategies();
      setStrategies(response || []);
    } catch (err) {
      setError('Failed to load strategies');
      console.error('Strategies error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (strategyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await api.trading.updateStrategy(strategyId, { status: newStatus });
      setStrategies(strategies.map(s =>
        s.id === strategyId ? { ...s, status: newStatus as any } : s
      ));
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const handleDelete = async (strategyId: string) => {
    if (!confirm('Delete this strategy?')) return;
    
    try {
      await api.trading.deleteStrategy(strategyId);
      setStrategies(strategies.filter(s => s.id !== strategyId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleClone = async (strategyId: string) => {
    try {
      const cloned = await api.trading.cloneStrategy(strategyId);
      setStrategies([cloned, ...strategies]);
    } catch (err) {
      console.error('Clone error:', err);
    }
  };

  const handleToggleFavorite = async (strategyId: string) => {
    try {
      const strategy = strategies.find(s => s.id === strategyId);
      if (!strategy) return;

      await api.trading.updateStrategy(strategyId, { is_favorite: !strategy.is_favorite });
      setStrategies(strategies.map(s =>
        s.id === strategyId ? { ...s, is_favorite: !s.is_favorite } : s
      ));
    } catch (err) {
      console.error('Toggle favorite error:', err);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', icon: Play };
      case 'paused':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: Pause };
      default:
        return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30', icon: Edit };
    }
  };

  const filteredStrategies = strategies.filter(s =>
    filter === 'all' || s.status === filter
  );

  if (loading && strategies.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading strategies...</p>
      </div>
    );
  }

  if (error && strategies.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchStrategies}
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
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">My Strategies</h2>
            <p className="text-sm text-slate-400">{strategies.length} total strategies</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Filter */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['all', 'active', 'paused', 'draft'] as const).map(f => (
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

          {onCreate && (
            <motion.button
              onClick={onCreate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              New Strategy
            </motion.button>
          )}

          <motion.button
            onClick={fetchStrategies}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Strategies Grid */}
      {filteredStrategies.length === 0 ? (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Layers className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">No Strategies Found</h3>
          <p className="text-slate-400 mb-6">
            {filter !== 'all' ? `No ${filter} strategies` : 'Create your first strategy to get started'}
          </p>
          {onCreate && (
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Strategy
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredStrategies.map((strategy, index) => {
              const statusConfig = getStatusConfig(strategy.status);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={strategy.id}
                  className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  {/* Header */}
                  <div className="p-6 border-b border-slate-800">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-slate-50">{strategy.name}</h3>
                          <button
                            onClick={() => handleToggleFavorite(strategy.id)}
                            className="p-1 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Star className={`w-5 h-5 ${
                              strategy.is_favorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                            }`} />
                          </button>
                        </div>
                        <p className="text-sm text-slate-400">{strategy.description}</p>
                      </div>

                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusConfig.bg} border ${statusConfig.border}`}>
                        <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
                        <span className={`text-sm font-bold ${statusConfig.text} capitalize`}>
                          {strategy.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-800">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Total P&L</div>
                      <div className={`text-xl font-bold ${
                        strategy.performance.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {strategy.performance.total_pnl >= 0 ? '+' : ''}${strategy.performance.total_pnl.toFixed(2)}
                      </div>
                      <div className={`text-xs ${
                        strategy.performance.pnl_percent >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {strategy.performance.pnl_percent >= 0 ? '+' : ''}{strategy.performance.pnl_percent.toFixed(2)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-slate-400 mb-1">Win Rate</div>
                      <div className="text-xl font-bold text-purple-400">
                        {strategy.performance.win_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {strategy.performance.total_trades} trades
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex gap-2">
                    <motion.button
                      onClick={() => handleToggleStatus(strategy.id, strategy.status)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        strategy.status === 'active'
                          ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                          : 'bg-green-500/20 border border-green-500/30 text-green-400'
                      }`}
                    >
                      {strategy.status === 'active' ? (
                        <>
                          <Pause size={16} />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          Activate
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      onClick={() => onEdit?.(strategy.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all"
                    >
                      <Edit size={16} />
                    </motion.button>

                    <motion.button
                      onClick={() => handleClone(strategy.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-all"
                    >
                      <Copy size={16} />
                    </motion.button>

                    <motion.button
                      onClick={() => handleDelete(strategy.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </motion.button>
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

export default StrategyList;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import SignalCard from '../SignalCard';
import { Zap, RefreshCw, AlertCircle } from 'lucide-react';

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
}

const TradingSignalShowcase: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.signals.getTopSignals({ limit: 6 });
      setSignals(response || []);
    } catch (err) {
      setError('Failed to load signals');
      console.error('Signals error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && signals.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading top signals...</p>
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
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-50">Top Trading Signals</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SignalCard signal={signal} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TradingSignalShowcase;

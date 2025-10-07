import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, CheckCircle, BarChart3, Activity } from 'lucide-react';

interface Signal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  entry_price: number;
  target_price?: number;
  stop_loss?: number;
  confidence: number;
  timeframe: string;
  indicators: string[];
  reasoning: string;
  risk_reward_ratio?: number;
  timestamp: string;
  status?: 'active' | 'completed' | 'expired';
}

interface SignalDetailsProps {
  signal: Signal | null;
  isOpen: boolean;
  onClose: () => void;
}

const SignalDetails: React.FC<SignalDetailsProps> = ({ signal, isOpen, onClose }) => {
  if (!signal) return null;

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'BUY':
        return {
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/50',
          gradient: 'from-green-500 to-emerald-600'
        };
      case 'SELL':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/50',
          gradient: 'from-red-500 to-rose-600'
        };
      default:
        return {
          bg: 'bg-slate-500/20',
          text: 'text-slate-400',
          border: 'border-slate-500/50',
          gradient: 'from-slate-500 to-slate-600'
        };
    }
  };

  const config = getTypeConfig(signal.type);
  const potentialGain = signal.target_price 
    ? ((signal.target_price - signal.entry_price) / signal.entry_price) * 100
    : 0;
  const potentialLoss = signal.stop_loss
    ? ((signal.entry_price - signal.stop_loss) / signal.entry_price) * 100
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${config.gradient} p-6`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-bold text-white">{signal.symbol}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${config.bg} ${config.text} border ${config.border} bg-white/20`}>
                        {signal.type}
                      </span>
                      {signal.status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          signal.status === 'active' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' :
                          signal.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                          'bg-slate-500/20 text-slate-400 border border-slate-500/50'
                        }`}>
                          {signal.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Clock size={16} />
                      <span className="text-sm">{new Date(signal.timestamp).toLocaleString()}</span>
                      <span className="text-white/60">•</span>
                      <span className="text-sm">{signal.timeframe}</span>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Price Levels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-slate-400">Entry Price</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-50">
                      ${signal.entry_price.toLocaleString()}
                    </p>
                  </div>

                  {signal.target_price && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Target Price</span>
                      </div>
                      <p className="text-2xl font-bold text-green-400">
                        ${signal.target_price.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-400/70 mt-1">
                        +{potentialGain.toFixed(2)}%
                      </p>
                    </div>
                  )}

                  {signal.stop_loss && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Stop Loss</span>
                      </div>
                      <p className="text-2xl font-bold text-red-400">
                        ${signal.stop_loss.toLocaleString()}
                      </p>
                      <p className="text-xs text-red-400/70 mt-1">
                        -{potentialLoss.toFixed(2)}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Confidence & Risk/Reward */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-300">Confidence Level</span>
                      <span className={`text-lg font-bold ${
                        signal.confidence >= 80 ? 'text-green-400' :
                        signal.confidence >= 60 ? 'text-cyan-400' :
                        signal.confidence >= 40 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {signal.confidence}%
                      </span>
                    </div>
                    <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          signal.confidence >= 80 ? 'bg-green-500' :
                          signal.confidence >= 60 ? 'bg-cyan-500' :
                          signal.confidence >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${signal.confidence}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {signal.risk_reward_ratio && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-300">Risk/Reward Ratio</span>
                        <span className="text-lg font-bold text-purple-400">
                          1:{signal.risk_reward_ratio.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-red-500/20 h-3 rounded"></div>
                        <div 
                          className="bg-green-500/20 h-3 rounded"
                          style={{ width: `${signal.risk_reward_ratio * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Indicators */}
                {signal.indicators && signal.indicators.length > 0 && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-slate-50">Technical Indicators</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {signal.indicators.map((indicator, index) => (
                        <motion.div
                          key={index}
                          className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm font-medium"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {indicator}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-semibold text-slate-50">Signal Analysis</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{signal.reasoning}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-xl font-semibold transition-all"
                >
                  Close
                </button>
                <button
                  className={`flex-1 px-6 py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl font-semibold transition-all hover:shadow-lg`}
                >
                  Execute Trade
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SignalDetails;

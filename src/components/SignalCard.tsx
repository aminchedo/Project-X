import React from 'react';
import { motion } from 'framer-motion';
import { TradingSignal } from '../types';
import { TrendingUp, TrendingDown, Minus, Activity, Target, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SignalCardProps {
  signal: TradingSignal;
  onAnalyze: (symbol: string) => void;
  onExecute: (signal: TradingSignal) => void;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, onAnalyze, onExecute }) => {
  const getSignalIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp className="w-5 h-5" />;
      case 'SELL': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };

  const getSignalColors = (action: string) => {
    switch (action) {
      case 'BUY': 
        return {
          gradient: 'from-green-500 to-emerald-600',
          bg: 'bg-green-500/10',
          text: 'text-green-400',
          border: 'border-green-500/30',
          shadow: 'shadow-green-500/10'
        };
      case 'SELL': 
        return {
          gradient: 'from-red-500 to-rose-600',
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/30',
          shadow: 'shadow-red-500/10'
        };
      default: 
        return {
          gradient: 'from-slate-500 to-gray-600',
          bg: 'bg-slate-500/10',
          text: 'text-slate-400',
          border: 'border-slate-500/30',
          shadow: 'shadow-slate-500/10'
        };
    }
  };

  const colors = getSignalColors(signal.action);

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A';
    return price.toLocaleString('en-US', { 
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  };

  const formatTime = (timestamp: Date) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  const confidencePercentage = (signal.confidence * 100).toFixed(1);
  const riskRewardRatio = signal.take_profit && signal.entry_price && signal.stop_loss
    ? ((signal.take_profit - signal.entry_price) / (signal.entry_price - signal.stop_loss)).toFixed(2)
    : 'N/A';

  return (
    <motion.div
      className={`bg-slate-900/80 backdrop-blur-xl border ${colors.border} rounded-xl p-5 hover:shadow-xl ${colors.shadow} transition-all duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className={`p-2 rounded-lg bg-gradient-to-r ${colors.gradient}`}
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            {getSignalIcon(signal.action)}
          </motion.div>
          <div>
            <h3 className="text-lg font-bold text-slate-50">{signal.symbol}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{formatTime(signal.timestamp)}</span>
            </div>
          </div>
        </div>
        
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${colors.bg} ${colors.text} ${colors.border} border`}>
          {signal.action}
        </span>
      </div>

      {/* Signal Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Entry Price */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-slate-400">Entry Price</span>
          </div>
          <div className="text-lg font-bold text-slate-50 font-mono">
            {formatPrice(signal.entry_price)}
          </div>
        </div>

        {/* Target Price */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium text-slate-400">Target</span>
          </div>
          <div className="text-lg font-bold text-green-400 font-mono">
            {formatPrice(signal.take_profit)}
          </div>
        </div>

        {/* Stop Loss */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium text-slate-400">Stop Loss</span>
          </div>
          <div className="text-lg font-bold text-red-400 font-mono">
            {formatPrice(signal.stop_loss)}
          </div>
        </div>

        {/* Risk/Reward */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-slate-400">R:R Ratio</span>
          </div>
          <div className="text-lg font-bold text-purple-400 font-mono">
            {riskRewardRatio}
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-400">Confidence</span>
          <span className="text-sm font-bold text-cyan-400">{confidencePercentage}%</span>
        </div>
        <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${confidencePercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Position Size */}
      {signal.position_size && (
        <div className="bg-slate-800/30 rounded-lg p-3 mb-4 border border-slate-700/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Recommended Position Size</span>
            <span className="text-lg font-bold text-slate-50">
              ${signal.position_size.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          onClick={() => onAnalyze(signal.symbol)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg font-medium transition-all duration-200"
        >
          Analyze
        </motion.button>
        
        <motion.button
          onClick={() => onExecute(signal)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-4 py-2 bg-gradient-to-r ${colors.gradient} text-white rounded-lg font-semibold hover:shadow-lg ${colors.shadow} transition-all duration-200`}
        >
          Execute
        </motion.button>
      </div>

      {/* Additional Info */}
      {signal.reasoning && (
        <motion.div 
          className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">Reasoning: </span>
            {signal.reasoning}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SignalCard;

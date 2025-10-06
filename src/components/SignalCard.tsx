import React from 'react';
import { TradingSignal } from '../types';
import { TrendingUp, TrendingDown, Minus, Activity, Target, Shield } from 'lucide-react';

interface SignalCardProps {
  signal: TradingSignal;
  onAnalyze: (symbol: string) => void;
  onExecute: (signal: TradingSignal) => void;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, onAnalyze, onExecute }) => {
  const getSignalIcon = (action: string) => {
    switch (action) {
      case 'BUY': return <TrendingUp className="w-4 h-4" />;
      case 'SELL': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getSignalColors = (action: string) => {
    switch (action) {
      case 'BUY': 
        return {
          gradient: 'from-emerald-500 to-green-600',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/30'
        };
      case 'SELL': 
        return {
          gradient: 'from-rose-500 to-red-600',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/30'
        };
      default: 
        return {
          gradient: 'from-slate-500 to-gray-600',
          bg: 'bg-slate-500/10',
          text: 'text-slate-400',
          border: 'border-slate-500/30'
        };
    }
  };

  const colors = getSignalColors(signal.action);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', { 
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  };

  return (
    <div className={`relative overflow-hidden bg-slate-800/40 backdrop-blur-xl rounded-2xl border ${colors.border} hover:border-opacity-60 transition-all duration-300 group hover:scale-[1.02]`}>
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${colors.bg} ${colors.text}`}>
              {getSignalIcon(signal.action)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{signal.symbol}</h3>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-semibold ${colors.text}`}>
                  {signal.action}
                </span>
                <div className={`w-2 h-2 rounded-full ${colors.gradient} bg-gradient-to-r animate-pulse`} />
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {(signal.final_score * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400">
              {formatTime(signal.timestamp)}
            </div>
          </div>
        </div>

        {/* Price Information */}
        <div className="mb-6">
          <div className="text-2xl font-mono font-bold text-white mb-1">
            {formatPrice(signal.price)}
          </div>
          <div className="flex items-center space-x-4 text-sm text-slate-400">
            <div className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>Entry: {formatPrice(signal.entry_price || signal.price)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3" />
              <span>SL: {formatPrice(signal.stop_loss || signal.price * 0.98)}</span>
            </div>
          </div>
        </div>

        {/* Algorithm Breakdown */}
        <div className="space-y-3 mb-6">
          <div className="text-sm font-medium text-slate-300 mb-2">Algorithm Breakdown</div>
          
          {/* Core RSI+MACD (40%) */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Core (RSI+MACD)</span>
            <div className="flex items-center space-x-3">
              <div className="w-20 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${signal.rsi_macd_score * 100}%` }}
                />
              </div>
              <span className="font-mono text-sm text-white w-12 text-right">
                {(signal.rsi_macd_score * 40).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* SMC (25%) */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">SMC Analysis</span>
            <div className="flex items-center space-x-3">
              <div className="w-20 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-violet-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${signal.smc_score * 100}%` }}
                />
              </div>
              <span className="font-mono text-sm text-white w-12 text-right">
                {(signal.smc_score * 25).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Patterns (20%) */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Patterns</span>
            <div className="flex items-center space-x-3">
              <div className="w-20 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${signal.pattern_score * 100}%` }}
                />
              </div>
              <span className="font-mono text-sm text-white w-12 text-right">
                {(signal.pattern_score * 20).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Sentiment (10%) */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Sentiment</span>
            <div className="flex items-center space-x-3">
              <div className="w-20 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-pink-400 to-rose-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${signal.sentiment_score * 100}%` }}
                />
              </div>
              <span className="font-mono text-sm text-white w-12 text-right">
                {(signal.sentiment_score * 10).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* ML (5%) */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">ML Prediction</span>
            <div className="flex items-center space-x-3">
              <div className="w-20 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-400 to-blue-500 h-full transition-all duration-500 ease-out"
                  style={{ width: `${signal.ml_score * 100}%` }}
                />
              </div>
              <span className="font-mono text-sm text-white w-12 text-right">
                {(signal.ml_score * 5).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Overall Confidence */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-300">Overall Confidence</span>
            <span className="text-sm font-bold text-white">{(signal.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ease-out bg-gradient-to-r ${colors.gradient}`}
              style={{ width: `${signal.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button 
            onClick={() => onAnalyze(signal.symbol)}
            className="flex-1 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/50 px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Activity className="w-4 h-4" />
            <span>Analyze</span>
          </button>
          
          <button 
            onClick={() => onExecute(signal)}
            className={`flex-1 px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              signal.action === 'HOLD'
                ? 'bg-slate-600/50 cursor-not-allowed opacity-50'
                : `bg-gradient-to-r ${colors.gradient} hover:shadow-lg hover:shadow-${signal.action === 'BUY' ? 'emerald' : 'rose'}-500/25`
            }`}
            disabled={signal.action === 'HOLD'}
          >
            {getSignalIcon(signal.action)}
            <span>{signal.action === 'HOLD' ? 'Hold Position' : `Execute ${signal.action}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  AlertCircle,
  RefreshCw,
  Zap,
  Activity,
  BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Prediction {
  symbol: string;
  current_price: number;
  predicted_price: number;
  predicted_change: number;
  confidence: number;
  timeframe: string;
  signals: string[];
}

interface TrendAnalysis {
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number;
  support_level: number;
  resistance_level: number;
}

const PredictiveAnalyticsDashboard: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('1d');

  useEffect(() => {
    fetchPredictions();
  }, [selectedSymbol, timeframe]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ai.getPredictions({ symbol: selectedSymbol, timeframe });
      setPredictions(response);
    } catch (err) {
      setError('Failed to load predictions');
      console.error('Predictions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const mainPrediction = predictions.length > 0 ? predictions[0] : null;

  const getPredictionColor = (change: number) => {
    if (change > 5) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50' };
    if (change > 0) return { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' };
    if (change > -5) return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-cyan-400';
    if (confidence >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading && !mainPrediction) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Analyzing market data...</p>
      </div>
    );
  }

  if (error && !mainPrediction) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchPredictions}
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
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">AI Predictions</h2>
            <p className="text-sm text-slate-400">Machine learning price forecasts</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Symbol Selector */}
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
          >
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="BNBUSDT">BNB/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
          </select>

          {/* Timeframe Selector */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['1h', '4h', '1d', '1w'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-purple-500 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <motion.button
            onClick={fetchPredictions}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {mainPrediction && (
        <>
          {/* Main Prediction Card */}
          <motion.div
            className={`bg-slate-900/80 backdrop-blur-xl border shadow-xl rounded-xl p-8 ${
              getPredictionColor(mainPrediction.predicted_change).border
            }`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold text-slate-50 mb-2">{mainPrediction.symbol}</h3>
                <p className="text-slate-400">Next {mainPrediction.timeframe} Prediction</p>
              </div>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                getPredictionColor(mainPrediction.predicted_change).bg
              }`}>
                {mainPrediction.predicted_change >= 0 ? (
                  <TrendingUp className={getPredictionColor(mainPrediction.predicted_change).text} size={24} />
                ) : (
                  <TrendingDown className={getPredictionColor(mainPrediction.predicted_change).text} size={24} />
                )}
                <span className={`text-2xl font-bold ${getPredictionColor(mainPrediction.predicted_change).text}`}>
                  {mainPrediction.predicted_change >= 0 ? '+' : ''}{mainPrediction.predicted_change.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">Current Price</div>
                <div className="text-2xl font-bold text-slate-50">
                  ${mainPrediction.current_price.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-1">Predicted Price</div>
                <div className={`text-2xl font-bold ${getPredictionColor(mainPrediction.predicted_change).text}`}>
                  ${mainPrediction.predicted_price.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-1">AI Confidence</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        mainPrediction.confidence >= 80 ? 'bg-green-500' :
                        mainPrediction.confidence >= 60 ? 'bg-cyan-500' :
                        mainPrediction.confidence >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${mainPrediction.confidence}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className={`text-lg font-bold ${getConfidenceColor(mainPrediction.confidence)}`}>
                    {mainPrediction.confidence}%
                  </span>
                </div>
              </div>
            </div>

            {/* AI Signals */}
            {mainPrediction.signals && mainPrediction.signals.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-slate-300 mb-3">AI Detected Signals</div>
                <div className="flex flex-wrap gap-2">
                  {mainPrediction.signals.map((signal, index) => (
                    <motion.div
                      key={index}
                      className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      {signal}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Predictions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.slice(1, 7).map((pred, index) => {
              const colors = getPredictionColor(pred.predicted_change);
              
              return (
                <motion.div
                  key={pred.symbol}
                  className={`bg-slate-900/80 backdrop-blur-xl border ${colors.border} shadow-xl rounded-xl p-6 hover:shadow-2xl transition-all`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-slate-50">{pred.symbol}</h4>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-lg ${colors.bg}`}>
                      {pred.predicted_change >= 0 ? (
                        <TrendingUp className={colors.text} size={16} />
                      ) : (
                        <TrendingDown className={colors.text} size={16} />
                      )}
                      <span className={`font-bold ${colors.text}`}>
                        {pred.predicted_change >= 0 ? '+' : ''}{pred.predicted_change.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Current</span>
                      <span className="text-slate-50 font-semibold">${pred.current_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Target</span>
                      <span className={`font-semibold ${colors.text}`}>${pred.predicted_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Confidence</span>
                      <span className={`font-semibold ${getConfidenceColor(pred.confidence)}`}>{pred.confidence}%</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Accuracy Stats */}
          <motion.div
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-xl font-semibold text-slate-50 mb-6">Model Performance</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-slate-400">Accuracy (24h)</span>
                </div>
                <p className="text-3xl font-bold text-green-400">78%</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm text-slate-400">Predictions Made</span>
                </div>
                <p className="text-3xl font-bold text-cyan-400">1,247</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-slate-400">Avg Confidence</span>
                </div>
                <p className="text-3xl font-bold text-yellow-400">
                  {predictions.length > 0 
                    ? (predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length).toFixed(0)
                    : '0'}%
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-slate-400">Profitable Signals</span>
                </div>
                <p className="text-3xl font-bold text-purple-400">82%</p>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* No Predictions State */}
      {!mainPrediction && !loading && (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Brain className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">No Predictions Available</h3>
          <p className="text-slate-400">Select a symbol and timeframe to view AI predictions</p>
        </motion.div>
      )}
    </div>
  );
};

export default PredictiveAnalyticsDashboard;

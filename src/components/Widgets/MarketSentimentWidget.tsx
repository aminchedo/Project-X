import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MarketSentimentWidgetProps {
  compact?: boolean;
}

const MarketSentimentWidget: React.FC<MarketSentimentWidgetProps> = ({ compact = false }) => {
  const [sentiment, setSentiment] = useState<{ bullish: number; bearish: number; neutral: number }>({
    bullish: 0,
    bearish: 0,
    neutral: 0
  });

  useEffect(() => {
    fetchSentiment();
    const interval = setInterval(fetchSentiment, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSentiment = async () => {
    try {
      const response = await api.ai.getMarketSentiment();
      setSentiment(response);
    } catch (err) {
      console.error('Sentiment fetch error:', err);
    }
  };

  const total = sentiment.bullish + sentiment.bearish + sentiment.neutral;
  const overall = sentiment.bullish > sentiment.bearish ? 'bullish' : 
                  sentiment.bearish > sentiment.bullish ? 'bearish' : 'neutral';

  if (compact) {
    return (
      <motion.div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          overall === 'bullish' ? 'bg-green-500/20 text-green-400' :
          overall === 'bearish' ? 'bg-red-500/20 text-red-400' :
          'bg-slate-500/20 text-slate-400'
        }`}
        whileHover={{ scale: 1.02 }}
      >
        {overall === 'bullish' ? <TrendingUp size={16} /> :
         overall === 'bearish' ? <TrendingDown size={16} /> :
         <Minus size={16} />}
        <span className="text-sm font-bold capitalize">{overall}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <h3 className="text-lg font-semibold text-slate-50 mb-4">Market Sentiment</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-slate-300">Bullish</span>
          </div>
          <span className="text-lg font-bold text-green-400">{sentiment.bullish}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-sm text-slate-300">Bearish</span>
          </div>
          <span className="text-lg font-bold text-red-400">{sentiment.bearish}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">Neutral</span>
          </div>
          <span className="text-lg font-bold text-slate-400">{sentiment.neutral}</span>
        </div>
      </div>

      <div className="mt-4 relative h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute left-0 h-full bg-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${(sentiment.bullish / total) * 100}%` }}
        />
        <motion.div
          className="absolute right-0 h-full bg-red-500"
          initial={{ width: 0 }}
          animate={{ width: `${(sentiment.bearish / total) * 100}%` }}
        />
      </div>
    </motion.div>
  );
};

export default MarketSentimentWidget;

import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp } from 'lucide-react';

interface SentimentWidgetProps {
  selectedSymbol: string;
}

interface SentimentData {
  score: number;
  mood: string;
  socialVolume: number;
  newsSentiment: string;
}

const MOCK_SENTIMENT: Record<string, SentimentData> = {
  BTCUSDT: {
    score: 7.2,
    mood: 'Optimistic',
    socialVolume: 18,
    newsSentiment: 'Positive',
  },
  ETHUSDT: {
    score: 6.8,
    mood: 'Bullish',
    socialVolume: 22,
    newsSentiment: 'Very Positive',
  },
  BNBUSDT: {
    score: 6.5,
    mood: 'Neutral',
    socialVolume: 12,
    newsSentiment: 'Neutral',
  },
  DEFAULT: {
    score: 6.0,
    mood: 'Neutral',
    socialVolume: 10,
    newsSentiment: 'Neutral',
  },
};

export const SentimentWidget: React.FC<SentimentWidgetProps> = ({ selectedSymbol }) => {
  const [sentiment, setSentiment] = useState<SentimentData>(MOCK_SENTIMENT.DEFAULT);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      const data = MOCK_SENTIMENT[selectedSymbol] || MOCK_SENTIMENT.DEFAULT;
      setSentiment(data);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [selectedSymbol]);

  const scorePercentage = (sentiment.score / 10) * 100;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="badge-metal p-2 rounded-lg">
            <Brain className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Sentiment Score</h3>
            <p className="text-xs text-slate-400">
              {selectedSymbol.replace('USDT', '')} • Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-pink-400">{sentiment.score.toFixed(1)}/10</div>
          <div className="text-xs text-slate-400">{sentiment.mood}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="widget-loading">
          <div className="animate-pulse h-3 bg-slate-700/50 rounded-full"></div>
        </div>
      ) : (
        <>
          <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-pink-400 to-pink-600 h-3 rounded-full shadow-lg transition-all duration-500"
              style={{ width: `${scorePercentage}%` }}
              role="progressbar"
              aria-valuenow={sentiment.score}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-label={`Sentiment score: ${sentiment.score} out of 10`}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Social Volume</div>
              <div className="text-lg font-semibold text-emerald-400">+{sentiment.socialVolume}%</div>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">News Sentiment</div>
              <div className="text-lg font-semibold text-emerald-400">{sentiment.newsSentiment}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SentimentWidget;


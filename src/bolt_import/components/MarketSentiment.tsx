import React, { useState, useEffect } from 'react';
import { realDataService } from '../services/realDataService';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

interface SentimentData {
  fearGreed: {
    value: number;
    classification: string;
  };
}

export const MarketSentiment: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSentimentData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const fearGreed = await realDataService.getFearGreedIndex();
        setSentimentData({ fearGreed });
      } catch (err) {
        setError('Failed to load sentiment data');
        console.error('Sentiment loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSentimentData();
    
    // Refresh every hour
    const interval = setInterval(loadSentimentData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (value: number) => {
    if (value <= 25) return 'text-red-400';
    if (value <= 45) return 'text-orange-400';
    if (value <= 55) return 'text-yellow-400';
    if (value <= 75) return 'text-green-400';
    return 'text-blue-400';
  };

  const getSentimentIcon = (value: number) => {
    if (value <= 25) return <TrendingDown className="text-red-400" size={20} />;
    if (value <= 45) return <AlertTriangle className="text-orange-400" size={20} />;
    if (value <= 55) return <Activity className="text-yellow-400" size={20} />;
    if (value <= 75) return <TrendingUp className="text-green-400" size={20} />;
    return <TrendingUp className="text-blue-400" size={20} />;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center text-gray-400 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading market sentiment...</p>
        </div>
      </div>
    );
  }

  if (error || !sentimentData) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center text-red-400 py-8">
          <p>{error || 'No sentiment data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Activity className="text-purple-400" size={28} />
        <h3 className="text-xl font-bold text-white">Market Sentiment</h3>
      </div>

      {/* Fear & Greed Index */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getSentimentIcon(sentimentData.fearGreed.value)}
            <span className="text-white font-semibold">Fear & Greed Index</span>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getSentimentColor(sentimentData.fearGreed.value)}`}>
              {sentimentData.fearGreed.value}
            </div>
            <div className="text-gray-400 text-sm">
              {sentimentData.fearGreed.classification}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              sentimentData.fearGreed.value <= 25 ? 'bg-red-400' :
              sentimentData.fearGreed.value <= 45 ? 'bg-orange-400' :
              sentimentData.fearGreed.value <= 55 ? 'bg-yellow-400' :
              sentimentData.fearGreed.value <= 75 ? 'bg-green-400' : 'bg-blue-400'
            }`}
            style={{ width: `${sentimentData.fearGreed.value}%` }}
          ></div>
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Extreme Fear</span>
          <span>Fear</span>
          <span>Neutral</span>
          <span>Greed</span>
          <span>Extreme Greed</span>
        </div>

        {/* Interpretation */}
        <div className="mt-4 p-3 bg-gray-750 rounded text-sm text-gray-300">
          <strong>Interpretation:</strong> {
            sentimentData.fearGreed.value <= 25 ? 'Market is in extreme fear - potential buying opportunity' :
            sentimentData.fearGreed.value <= 45 ? 'Market shows fear - cautious optimism may be warranted' :
            sentimentData.fearGreed.value <= 55 ? 'Market sentiment is neutral - balanced approach recommended' :
            sentimentData.fearGreed.value <= 75 ? 'Market shows greed - consider taking profits' :
            'Market is in extreme greed - high risk of correction'
          }
        </div>
      </div>
    </div>
  );
};
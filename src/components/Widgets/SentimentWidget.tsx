import React, { useState, useEffect } from 'react';
import { Brain, AlertCircle } from 'lucide-react';
import { fetchFearGreedIndex, fetchSocialBuzz } from '../../services/liveDataApi';

interface SentimentWidgetProps {
  selectedSymbol: string;
}

interface SentimentData {
  indexValue: string | null;
  classification: string | null;
  socialVolume: number | null;
  timestamp: string | null;
}

export const SentimentWidget: React.FC<SentimentWidgetProps> = ({ selectedSymbol }) => {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSentimentData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch real Fear & Greed data
        const fearGreedData = await fetchFearGreedIndex();

        if (!fearGreedData || !fearGreedData.indexValue) {
          setError('No sentiment data available');
          setSentiment(null);
          setIsLoading(false);
          return;
        }

        // Fetch social buzz data for social volume
        const socialData = await fetchSocialBuzz();
        const topPostsCount = socialData.length;

        setSentiment({
          indexValue: fearGreedData.indexValue,
          classification: fearGreedData.classification,
          socialVolume: topPostsCount > 0 ? topPostsCount : null,
          timestamp: fearGreedData.timestamp,
        });
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to load sentiment data:', err);
        setError('Failed to load data');
        setSentiment(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSentimentData();

    // Refresh every 5 minutes (sentiment data doesn't change that often)
    const intervalId = setInterval(loadSentimentData, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [selectedSymbol]);

  // Calculate percentage for progress bar if we have valid data
  const indexValue = sentiment?.indexValue ? parseInt(sentiment.indexValue, 10) : 0;
  const scorePercentage = indexValue;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="badge-metal p-2 rounded-lg">
            <Brain className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Market Sentiment</h3>
            <p className="text-xs text-slate-400">
              Fear & Greed Index • Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        {sentiment && sentiment.indexValue && (
          <div className="text-right">
            <div className="text-2xl font-bold text-pink-400">{sentiment.indexValue}/100</div>
            <div className="text-xs text-slate-400">{sentiment.classification || '--'}</div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="widget-loading">
          <div className="animate-pulse h-3 bg-slate-700/50 rounded-full mb-3"></div>
          <div className="animate-pulse h-16 bg-slate-700/50 rounded-lg"></div>
        </div>
      ) : error || !sentiment ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">{error || 'No sentiment data available'}</p>
          <p className="text-slate-500 text-xs mt-2">Check backend connection</p>
        </div>
      ) : (
        <>
          <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-pink-400 to-pink-600 h-3 rounded-full shadow-lg transition-all duration-500"
              style={{ width: `${scorePercentage}%` }}
              role="progressbar"
              aria-valuenow={indexValue}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Sentiment score: ${indexValue} out of 100`}
            ></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Social Posts</div>
              <div className="text-lg font-semibold text-emerald-400">
                {sentiment.socialVolume !== null ? sentiment.socialVolume : '--'}
              </div>
            </div>
            <div className="text-center p-3 bg-slate-700/30 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Classification</div>
              <div className="text-lg font-semibold text-emerald-400">
                {sentiment.classification || '--'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SentimentWidget;


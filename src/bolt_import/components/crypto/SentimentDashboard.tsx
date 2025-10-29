/**
 * SentimentDashboard Component
 * 
 * Displays:
 * - Overall sentiment gauge
 * - Source breakdown (Fear & Greed, Reddit, CoinGecko)
 * - Visual sentiment indicators
 */

import React from 'react';
import { useSentiment } from '../../hooks/useCryptoData';
import { Activity, AlertTriangle, MessageCircle, Users } from 'lucide-react';

interface SentimentDashboardProps {
  symbol?: string;
}

export const SentimentDashboard: React.FC<SentimentDashboardProps> = ({ symbol = 'BTC' }) => {
  const { data, loading, error, refetch } = useSentiment(symbol, 300000);

  const getSentimentColor = (value: number): string => {
    if (value <= 25) return 'text-red-400';
    if (value <= 45) return 'text-orange-400';
    if (value <= 55) return 'text-yellow-400';
    if (value <= 75) return 'text-green-400';
    return 'text-blue-400';
  };

  const getSentimentBgColor = (value: number): string => {
    if (value <= 25) return 'bg-red-400';
    if (value <= 45) return 'bg-orange-400';
    if (value <= 55) return 'bg-yellow-400';
    if (value <= 75) return 'bg-green-400';
    return 'bg-blue-400';
  };

  const getSentimentEmoji = (value: number): string => {
    if (value <= 25) return '🐻';
    if (value <= 45) return '😰';
    if (value <= 55) return '😐';
    if (value <= 75) return '😊';
    return '🚀';
  };

  const getSentimentDescription = (value: number): string => {
    if (value <= 25) return 'Extreme Fear - Potential buying opportunity';
    if (value <= 45) return 'Fear - Market shows caution';
    if (value <= 55) return 'Neutral - Balanced market sentiment';
    if (value <= 75) return 'Greed - Consider taking profits';
    return 'Extreme Greed - High risk of correction';
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center text-gray-400 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p>Analyzing market sentiment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center text-red-400 py-8">
          <p className="mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Activity className="text-purple-400" size={28} />
        <div>
          <h3 className="text-xl font-bold text-white">Market Sentiment</h3>
          <p className="text-gray-400 text-sm">Aggregated from multiple sources</p>
        </div>
      </div>

      {/* Overall Sentiment Gauge */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-gray-400 text-sm mb-2">Overall Sentiment</div>
            <div className={`text-5xl font-bold ${getSentimentColor(data.overall)}`}>
              {data.overall}
            </div>
            <div className="text-gray-400 text-sm mt-2">
              {getSentimentDescription(data.overall)}
            </div>
          </div>

          {/* Circular Gauge */}
          <div className="relative w-40 h-40">
            <svg className="transform -rotate-90" width="160" height="160">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-700"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${(data.overall / 100) * 439.82} 439.82`}
                className={getSentimentColor(data.overall)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">{getSentimentEmoji(data.overall)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getSentimentBgColor(data.overall)}`}
            style={{ width: `${data.overall}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white mb-3">Source Breakdown</h4>

        {/* Fear & Greed Index */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-yellow-400" size={20} />
              <span className="text-white font-semibold">Fear & Greed Index</span>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getSentimentColor(data.fearGreed.value)}`}>
                {data.fearGreed.value}
              </div>
              <div className="text-gray-400 text-xs">{data.fearGreed.classification}</div>
            </div>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getSentimentBgColor(data.fearGreed.value)}`}
              style={{ width: `${data.fearGreed.value}%` }}
            ></div>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            Weight: 40% of overall sentiment
          </div>
        </div>

        {/* Reddit Sentiment */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <MessageCircle className="text-orange-400" size={20} />
              <span className="text-white font-semibold">Reddit Community</span>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getSentimentColor(data.reddit.score)}`}>
                {data.reddit.score}
              </div>
              <div className="text-gray-400 text-xs">{data.reddit.posts} posts analyzed</div>
            </div>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getSentimentBgColor(data.reddit.score)}`}
              style={{ width: `${data.reddit.score}%` }}
            ></div>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            Weight: 30% of overall sentiment
          </div>
        </div>

        {/* CoinGecko Community */}
        {data.coinGecko && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="text-green-400" size={20} />
                <span className="text-white font-semibold">CoinGecko Community</span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getSentimentColor(data.coinGecko.score)}`}>
                  {data.coinGecko.score}
                </div>
                <div className="text-gray-400 text-xs">Community metrics</div>
              </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getSentimentBgColor(data.coinGecko.score)}`}
                style={{ width: `${data.coinGecko.score}%` }}
              ></div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {data.coinGecko.metrics.twitterFollowers && (
                <div className="text-gray-400">
                  <div className="text-white font-medium">
                    {(data.coinGecko.metrics.twitterFollowers / 1000).toFixed(0)}K
                  </div>
                  <div>Twitter</div>
                </div>
              )}
              {data.coinGecko.metrics.redditSubscribers && (
                <div className="text-gray-400">
                  <div className="text-white font-medium">
                    {(data.coinGecko.metrics.redditSubscribers / 1000).toFixed(0)}K
                  </div>
                  <div>Reddit</div>
                </div>
              )}
              {data.coinGecko.metrics.telegramUsers && (
                <div className="text-gray-400">
                  <div className="text-white font-medium">
                    {(data.coinGecko.metrics.telegramUsers / 1000).toFixed(0)}K
                  </div>
                  <div>Telegram</div>
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-gray-400">
              Weight: 30% of overall sentiment
            </div>
          </div>
        )}
      </div>

      {/* Last Update */}
      <div className="mt-6 pt-4 border-t border-gray-800 text-center text-xs text-gray-500">
        Last updated: {new Date(data.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};


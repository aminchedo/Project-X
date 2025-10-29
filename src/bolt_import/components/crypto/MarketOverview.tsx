/**
 * MarketOverview Component
 * 
 * Displays:
 * - Price cards for major cryptocurrencies
 * - Fear & Greed gauge
 * - Top movers (gainers and losers)
 */

import React from 'react';
import { useMarketOverview } from '../../hooks/useCryptoData';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';

export const MarketOverview: React.FC = React.memo(() => {
  const { data, loading, error, refetch } = useMarketOverview(['BTC', 'ETH', 'BNB', 'SOL', 'ADA']);

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

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center text-gray-400 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading market overview...</p>
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
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Market Overview</h2>
        <button
          onClick={() => refetch()}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Price Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {data.prices.map((coin) => (
          <div
            key={coin.symbol}
            className="bg-gray-900 rounded-lg border border-gray-800 p-4 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">{coin.symbol}</span>
              <span className="text-gray-500 text-xs">{coin.name}</span>
            </div>

            <div className="mb-2">
              <div className="text-2xl font-bold text-white">
                ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-1 ${coin.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                {coin.changePercent24h >= 0 ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
                <span className="text-sm font-medium">
                  {coin.changePercent24h >= 0 ? '+' : ''}
                  {coin.changePercent24h.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="text-xs text-gray-500">
                Vol: ${(coin.volume24h / 1e9).toFixed(2)}B
              </div>
              <div className="text-xs text-gray-500">
                MCap: ${(coin.marketCap / 1e9).toFixed(2)}B
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fear & Greed Gauge */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="text-purple-400" size={24} />
          <h3 className="text-xl font-bold text-white">Fear & Greed Index</h3>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <div className={`text-4xl font-bold ${getSentimentColor(data.sentiment.fearGreed.value)}`}>
              {data.sentiment.fearGreed.value}
            </div>
            <div className="text-gray-400 text-sm mt-1">
              {data.sentiment.fearGreed.classification}
            </div>
          </div>

          {/* Circular Gauge */}
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90" width="128" height="128">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-800"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(data.sentiment.fearGreed.value / 100) * 351.86} 351.86`}
                className={getSentimentColor(data.sentiment.fearGreed.value)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${getSentimentColor(data.sentiment.fearGreed.value)}`}>
                {data.sentiment.fearGreed.value}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getSentimentBgColor(data.sentiment.fearGreed.value)}`}
            style={{ width: `${data.sentiment.fearGreed.value}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Extreme Fear</span>
          <span>Neutral</span>
          <span>Extreme Greed</span>
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="text-green-400" size={20} />
            <h3 className="text-lg font-bold text-white">Top Gainers</h3>
          </div>

          <div className="space-y-3">
            {data.topMovers.gainers.slice(0, 5).map((coin, index) => (
              <div
                key={coin.symbol}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 text-sm font-medium w-6">#{index + 1}</span>
                  <div>
                    <div className="text-white font-semibold">{coin.symbol}</div>
                    <div className="text-gray-400 text-xs">{coin.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">
                    ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-green-400 text-sm font-medium">
                    +{coin.changePercent24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingDown className="text-red-400" size={20} />
            <h3 className="text-lg font-bold text-white">Top Losers</h3>
          </div>

          <div className="space-y-3">
            {data.topMovers.losers.slice(0, 5).map((coin, index) => (
              <div
                key={coin.symbol}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-gray-500 text-sm font-medium w-6">#{index + 1}</span>
                  <div>
                    <div className="text-white font-semibold">{coin.symbol}</div>
                    <div className="text-gray-400 text-xs">{coin.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">
                    ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-red-400 text-sm font-medium">
                    {coin.changePercent24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});


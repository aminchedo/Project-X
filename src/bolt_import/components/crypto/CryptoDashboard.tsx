/**
 * CryptoDashboard Component
 * 
 * Main dashboard combining all crypto components:
 * - MarketOverview
 * - PriceChart
 * - SentimentDashboard
 * - WhaleFeed
 * - NewsPanel
 */

import React, { useState } from 'react';
import { MarketOverview } from './MarketOverview';
import { PriceChart } from './PriceChart';
import { SentimentDashboard } from './SentimentDashboard';
import { WhaleFeed } from './WhaleFeed';
import { NewsPanel } from './NewsPanel';
import { TrendingUp, Waves, Newspaper, BarChart3 } from 'lucide-react';

export const CryptoDashboard: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'whale' | 'news'>('overview');

  const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'charts', label: 'Charts', icon: TrendingUp },
    { id: 'whale', label: 'Whale Activity', icon: Waves },
    { id: 'news', label: 'News', icon: Newspaper },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="text-blue-400">Enhanced</span> Crypto Dashboard
        </h1>
        <p className="text-gray-400">
          Real-time cryptocurrency market data, sentiment analysis, and whale tracking
        </p>
      </div>

      {/* Symbol Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-gray-400 text-sm font-medium">Select Asset:</span>
          <div className="flex space-x-2">
            {symbols.map((symbol) => (
              <button
                key={symbol}
                onClick={() => setSelectedSymbol(symbol)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedSymbol === symbol
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-800">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${activeTab === id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Market Overview */}
            <MarketOverview />

            {/* Grid Layout for Sentiment and Quick Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SentimentDashboard symbol={selectedSymbol} />
              <div>
                <PriceChart symbol={selectedSymbol} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6">
            {/* Price Chart */}
            <PriceChart symbol={selectedSymbol} />

            {/* Sentiment Below Chart */}
            <SentimentDashboard symbol={selectedSymbol} />
          </div>
        )}

        {activeTab === 'whale' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Whale Feed takes 2 columns */}
            <div className="lg:col-span-2">
              <WhaleFeed />
            </div>

            {/* Sentiment in sidebar */}
            <div>
              <SentimentDashboard symbol={selectedSymbol} />
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* News Panel takes 2 columns */}
            <div className="lg:col-span-2">
              <NewsPanel />
            </div>

            {/* Sentiment in sidebar */}
            <div>
              <SentimentDashboard symbol={selectedSymbol} />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>
          Data aggregated from CoinMarketCap, CoinGecko, CryptoCompare, NewsAPI, Reddit, and more.
        </p>
        <p className="mt-2">
          Auto-refreshing every 1-5 minutes depending on data type. Whale tracking updates every 30 seconds.
        </p>
      </div>
    </div>
  );
};


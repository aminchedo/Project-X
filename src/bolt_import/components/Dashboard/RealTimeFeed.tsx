import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Volume2, Clock } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change_24h: number;
  change_percent_24h: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
}

interface RealTimeFeedProps {
  symbols: string[];
  className?: string;
}

const RealTimeFeed: React.FC<RealTimeFeedProps> = ({ 
  symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'MATIC', 'DOT', 'LINK', 'LTC', 'XRP'], 
  className = '' 
}) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch('/api/market/realtime', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbols }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch market data');
        }

        const data = await response.json();
        setMarketData(data);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [symbols]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    } else {
      return `$${marketCap.toFixed(2)}`;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Real-Time Market Data</h3>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Real-Time Market Data</h3>
        </div>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Real-Time Market Data</h3>
        </div>
        {lastUpdate && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {marketData.map((coin) => (
          <div
            key={coin.symbol}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {coin.symbol.slice(0, 2)}
                </span>
              </div>
              <div>
                <div className="font-semibold text-gray-800">{coin.symbol}</div>
                <div className="text-xs text-gray-500">
                  {formatMarketCap(coin.market_cap)} cap
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold text-gray-800">
                {formatPrice(coin.price)}
              </div>
              <div className={`flex items-center justify-end space-x-1 text-sm ${getChangeColor(coin.change_percent_24h)}`}>
                {getChangeIcon(coin.change_percent_24h)}
                <span>
                  {coin.change_percent_24h > 0 ? '+' : ''}
                  {coin.change_percent_24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Market Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-gray-600">Total Volume:</span>
            <span className="font-semibold">
              {formatVolume(marketData.reduce((sum, coin) => sum + coin.volume_24h, 0))}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">Assets:</span>
            <span className="font-semibold">{marketData.length}</span>
          </div>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="mt-3 flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-600">Live Data</span>
      </div>
    </div>
  );
};

export default RealTimeFeed;

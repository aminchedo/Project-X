import React from 'react';
import { MarketData } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketTickerProps {
  marketData: MarketData[];
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ marketData }) => {
  if (!marketData.length) return null;

  return (
    <div className="bg-gray-900 border-b border-gray-800 overflow-hidden">
      <div className="flex animate-scroll whitespace-nowrap py-3">
        {marketData.map((coin) => (
          <div key={coin.symbol} className="flex items-center px-6 min-w-max">
            <span className="text-gray-300 font-medium mr-2">
              {coin.symbol}
            </span>
            <span className="text-white font-semibold mr-3">
              ${coin.price.toLocaleString()}
            </span>
            <div className={`flex items-center ${coin.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
              {coin.changePercent24h >= 0 ? (
                <TrendingUp size={16} className="mr-1" />
              ) : (
                <TrendingDown size={16} className="mr-1" />
              )}
              <span className="font-medium">
                {coin.changePercent24h >= 0 ? '+' : ''}
                {coin.changePercent24h.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
      `}</style>
    </div>
  );
};
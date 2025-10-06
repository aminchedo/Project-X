import React from 'react';
import { MarketDepthData } from '../types';

interface MarketDepthBarsProps {
  data: MarketDepthData | null;
  maxLevels?: number;
}

export const MarketDepthBars: React.FC<MarketDepthBarsProps> = ({ 
  data, 
  maxLevels = 10 
}) => {
  if (!data || !data.bids?.length || !data.asks?.length) {
    return (
      <div className="text-center text-slate-400 py-8">
        <p>اطلاعات عمق بازار در دسترس نیست</p>
      </div>
    );
  }

  const bids = data.bids.slice(0, maxLevels);
  const asks = data.asks.slice(0, maxLevels);

  const maxBidSize = Math.max(...bids.map(b => b.size), 1);
  const maxAskSize = Math.max(...asks.map(a => a.size), 1);
  const maxSize = Math.max(maxBidSize, maxAskSize);

  return (
    <div className="space-y-4">
      {/* Asks (Sell Orders) - Top */}
      <div>
        <h4 className="text-sm font-medium text-red-400 mb-2">فروشندگان (Asks)</h4>
        <div className="space-y-1">
          {asks.reverse().map((ask, index) => {
            const widthPercent = (ask.size / maxSize) * 100;
            return (
              <div key={`ask-${index}`} className="relative">
                <div
                  className="absolute left-0 top-0 h-full bg-red-500/20 rounded transition-all duration-300"
                  style={{ width: `${widthPercent}%` }}
                />
                <div className="relative flex justify-between items-center px-2 py-1">
                  <span className="text-xs font-mono text-red-400">
                    ${ask.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    {ask.size.toFixed(4)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spread */}
      <div className="flex items-center justify-center py-2 border-y border-slate-700/50">
        <span className="text-xs text-slate-400">
          اسپرد: ${((asks[0]?.price || 0) - (bids[0]?.price || 0)).toFixed(2)}
        </span>
      </div>

      {/* Bids (Buy Orders) - Bottom */}
      <div>
        <h4 className="text-sm font-medium text-emerald-400 mb-2">خریداران (Bids)</h4>
        <div className="space-y-1">
          {bids.map((bid, index) => {
            const widthPercent = (bid.size / maxSize) * 100;
            return (
              <div key={`bid-${index}`} className="relative">
                <div
                  className="absolute left-0 top-0 h-full bg-emerald-500/20 rounded transition-all duration-300"
                  style={{ width: `${widthPercent}%` }}
                />
                <div className="relative flex justify-between items-center px-2 py-1">
                  <span className="text-xs font-mono text-emerald-400">
                    ${bid.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    {bid.size.toFixed(4)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketDepthBars;

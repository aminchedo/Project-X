import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Globe, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface MarketData {
  total_market_cap: number;
  total_volume_24h: number;
  btc_dominance: number;
  active_cryptocurrencies: number;
  market_trend: 'bullish' | 'bearish' | 'neutral';
}

const MarketOverview: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await api.crypto.getMarketOverview();
      setMarketData(response);
    } catch (err) {
      console.error('Market data error:', err);
    }
  };

  if (!marketData) return null;

  const trendConfig = {
    bullish: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20' },
    bearish: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20' },
    neutral: { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-500/20' }
  }[marketData.market_trend];

  const TrendIcon = trendConfig.icon;

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Globe className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-50">Market Overview</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-slate-400 mb-1">Market Cap</div>
          <div className="text-2xl font-bold text-slate-50">
            ${(marketData.total_market_cap / 1e12).toFixed(2)}T
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-400 mb-1">24h Volume</div>
          <div className="text-2xl font-bold text-cyan-400">
            ${(marketData.total_volume_24h / 1e9).toFixed(1)}B
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-400 mb-1">BTC Dominance</div>
          <div className="text-2xl font-bold text-orange-400">
            {marketData.btc_dominance.toFixed(1)}%
          </div>
        </div>

        <div>
          <div className="text-sm text-slate-400 mb-1">Active Coins</div>
          <div className="text-2xl font-bold text-purple-400">
            {marketData.active_cryptocurrencies.toLocaleString()}
          </div>
        </div>
      </div>

      <div className={`flex items-center gap-3 p-4 rounded-lg ${trendConfig.bg} border border-slate-700`}>
        <TrendIcon className={`w-6 h-6 ${trendConfig.color}`} />
        <div>
          <div className="text-xs text-slate-400">Market Trend</div>
          <div className={`text-lg font-bold ${trendConfig.color} capitalize`}>
            {marketData.market_trend}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketOverview;

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Bell, Search, TrendingUp, TrendingDown } from 'lucide-react';

interface MarketTicker {
  symbol: string;
  price: number;
  change: number;
}

interface CompactHeaderProps {
  tickers?: MarketTicker[];
}

const CompactHeader: React.FC<CompactHeaderProps> = ({ 
  tickers = [
    { symbol: 'BTC', price: 43250, change: 2.4 },
    { symbol: 'ETH', price: 2280, change: -1.2 },
    { symbol: 'BNB', price: 315, change: 3.8 },
    { symbol: 'SOL', price: 98, change: 5.2 },
  ]
}) => {
  return (
    <motion.header
      className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-50 hidden sm:inline">BoltAI</span>
          </div>

          {/* Market Tickers */}
          <div className="flex-1 flex items-center gap-4 overflow-x-auto scrollbar-hide px-4">
            {tickers.map((ticker) => (
              <motion.div
                key={ticker.symbol}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-sm font-medium text-slate-300">{ticker.symbol}</span>
                <span className="text-sm font-bold text-slate-50">
                  ${ticker.price.toLocaleString()}
                </span>
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  ticker.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {ticker.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(ticker.change)}%
                </div>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-slate-50" />
            </button>
            <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-50" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default CompactHeader;

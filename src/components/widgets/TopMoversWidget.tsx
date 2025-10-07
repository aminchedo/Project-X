import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';

interface Mover {
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
}

const TopMoversWidget: React.FC = () => {
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');

  useEffect(() => {
    fetchMovers();
    const interval = setInterval(fetchMovers, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMovers = async () => {
    try {
      const response = await api.crypto.getTopMovers();
      setGainers(response.gainers || []);
      setLosers(response.losers || []);
    } catch (err) {
      console.error('Top movers error:', err);
    }
  };

  const movers = tab === 'gainers' ? gainers : losers;

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-50">Top Movers</h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab('gainers')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              tab === 'gainers'
                ? 'bg-green-500 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            Gainers
          </button>
          <button
            onClick={() => setTab('losers')}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              tab === 'losers'
                ? 'bg-red-500 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            Losers
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        <AnimatePresence mode="wait">
          {movers.slice(0, 5).map((mover, index) => (
            <motion.div
              key={mover.symbol}
              className="p-4 hover:bg-slate-800/50 transition-colors"
              initial={{ opacity: 0, x: tab === 'gainers' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'gainers' ? 20 : -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-50">{mover.symbol}</div>
                  <div className="text-sm text-slate-400">${mover.price.toFixed(2)}</div>
                </div>
                <div className={`flex items-center gap-1 ${
                  tab === 'gainers' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {tab === 'gainers' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span className="text-lg font-bold">
                    {Math.abs(mover.change_24h).toFixed(2)}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TopMoversWidget;

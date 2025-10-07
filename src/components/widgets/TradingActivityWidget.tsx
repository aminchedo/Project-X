import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Activity, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
}

const TradingActivityWidget: React.FC = () => {
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);

  useEffect(() => {
    fetchRecentTrades();
    const interval = setInterval(fetchRecentTrades, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentTrades = async () => {
    try {
      const response = await api.trading.getRecentTrades({ limit: 5 });
      setRecentTrades(response || []);
    } catch (err) {
      console.error('Recent trades error:', err);
    }
  };

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-50">Recent Activity</h3>
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {recentTrades.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No recent trades</div>
        ) : (
          recentTrades.map((trade, index) => (
            <motion.div
              key={trade.id}
              className="p-4 hover:bg-slate-800/50 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-50">{trade.symbol}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    trade.type === 'BUY' 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.type}
                  </span>
                </div>
                {trade.type === 'BUY' ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{trade.quantity} @ ${trade.price.toFixed(2)}</span>
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock size={12} />
                  <span>{new Date(trade.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default TradingActivityWidget;

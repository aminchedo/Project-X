import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const PortfolioValueWidget: React.FC = () => {
  const [value, setValue] = useState<number>(0);
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    fetchPortfolioValue();
    const interval = setInterval(fetchPortfolioValue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPortfolioValue = async () => {
    try {
      const response = await api.trading.getPortfolioSummary();
      setValue(response.total_value);
      setChange(response.change_24h);
    } catch (err) {
      console.error('Portfolio value error:', err);
    }
  };

  return (
    <motion.div
      className={`backdrop-blur-xl border shadow-xl rounded-xl p-6 ${
        change >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
      }`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${change >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          <Wallet className={`w-5 h-5 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`} />
        </div>
        <h3 className="text-lg font-semibold text-slate-50">Portfolio Value</h3>
      </div>

      <div className="text-4xl font-bold text-slate-50 mb-2">
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>

      <div className={`flex items-center gap-2 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {change >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        <span className="text-lg font-semibold">
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
        <span className="text-sm text-slate-400">24h</span>
      </div>
    </motion.div>
  );
};

export default PortfolioValueWidget;

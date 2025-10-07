import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface ActiveSignalsWidgetProps {
  onViewAll?: () => void;
}

const ActiveSignalsWidget: React.FC<ActiveSignalsWidgetProps> = ({ onViewAll }) => {
  const [signalCount, setSignalCount] = useState({ buy: 0, sell: 0, total: 0 });

  useEffect(() => {
    fetchSignalCount();
    const interval = setInterval(fetchSignalCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSignalCount = async () => {
    try {
      const response = await api.signals.getSignalCount();
      setSignalCount(response);
    } catch (err) {
      console.error('Signal count error:', err);
    }
  };

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6 cursor-pointer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onViewAll}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-yellow-500/20 rounded-lg">
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-50">Active Signals</h3>
      </div>

      <div className="text-4xl font-bold text-yellow-400 mb-4">{signalCount.total}</div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-slate-300">{signalCount.buy} Buy</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <span className="text-slate-300">{signalCount.sell} Sell</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveSignalsWidget;

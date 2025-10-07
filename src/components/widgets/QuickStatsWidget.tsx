import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Activity, Target, TrendingUp, DollarSign } from 'lucide-react';

interface QuickStats {
  active_positions: number;
  open_signals: number;
  win_rate: number;
  total_pnl_today: number;
}

const QuickStatsWidget: React.FC = () => {
  const [stats, setStats] = useState<QuickStats>({
    active_positions: 0,
    open_signals: 0,
    win_rate: 0,
    total_pnl_today: 0
  });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.trading.getQuickStats();
      setStats(response);
    } catch (err) {
      console.error('Quick stats error:', err);
    }
  };

  const items = [
    { label: 'Positions', value: stats.active_positions, icon: Activity, color: 'purple' },
    { label: 'Signals', value: stats.open_signals, icon: TrendingUp, color: 'yellow' },
    { label: 'Win Rate', value: `${stats.win_rate.toFixed(0)}%`, icon: Target, color: 'cyan' },
    { label: "Today's P&L", value: `$${stats.total_pnl_today.toFixed(2)}`, icon: DollarSign, color: stats.total_pnl_today >= 0 ? 'green' : 'red' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        const colorClasses = {
          purple: 'text-purple-400 bg-purple-500/20',
          yellow: 'text-yellow-400 bg-yellow-500/20',
          cyan: 'text-cyan-400 bg-cyan-500/20',
          green: 'text-green-400 bg-green-500/20',
          red: 'text-red-400 bg-red-500/20'
        }[item.color];

        return (
          <motion.div
            key={item.label}
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className={`p-2 rounded-lg w-fit mb-3 ${colorClasses}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-sm text-slate-400 mb-1">{item.label}</div>
            <div className={`text-2xl font-bold ${colorClasses.split(' ')[0]}`}>
              {item.value}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default QuickStatsWidget;

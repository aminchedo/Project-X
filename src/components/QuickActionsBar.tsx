import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap, TrendingUp, Search, Target, Settings } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  onClick: () => void;
}

interface QuickActionsBarProps {
  onAction?: (actionId: string) => void;
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ onAction }) => {
  const actions: QuickAction[] = [
    { id: 'new-trade', label: 'New Trade', icon: Plus, color: 'cyan', onClick: () => onAction?.('new-trade') },
    { id: 'scan', label: 'Quick Scan', icon: Search, color: 'purple', onClick: () => onAction?.('scan') },
    { id: 'signals', label: 'View Signals', icon: Zap, color: 'yellow', onClick: () => onAction?.('signals') },
    { id: 'positions', label: 'Positions', icon: Target, color: 'green', onClick: () => onAction?.('positions') },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'slate', onClick: () => onAction?.('settings') }
  ];

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-2xl p-2 flex items-center gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const colorClasses = {
            cyan: 'hover:bg-cyan-500/20 hover:text-cyan-400',
            purple: 'hover:bg-purple-500/20 hover:text-purple-400',
            yellow: 'hover:bg-yellow-500/20 hover:text-yellow-400',
            green: 'hover:bg-green-500/20 hover:text-green-400',
            slate: 'hover:bg-slate-500/20 hover:text-slate-400'
          }[action.color];

          return (
            <motion.button
              key={action.id}
              onClick={action.onClick}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-slate-300 transition-all ${colorClasses}`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium hidden md:inline">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuickActionsBar;

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap, Target, Shield } from 'lucide-react';

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  filter: (result: any) => boolean;
}

interface QuickFiltersProps {
  onFilterSelect: (filter: QuickFilter) => void;
  activeFilter?: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'bullish',
    label: 'Bullish',
    icon: TrendingUp,
    color: 'green',
    description: 'Strong bullish signals',
    filter: (result) => result.overall_direction === 'BULLISH' && result.overall_score > 0.7
  },
  {
    id: 'bearish',
    label: 'Bearish',
    icon: TrendingDown,
    color: 'red',
    description: 'Strong bearish signals',
    filter: (result) => result.overall_direction === 'BEARISH' && result.overall_score > 0.7
  },
  {
    id: 'high-score',
    label: 'High Score',
    icon: Target,
    color: 'cyan',
    description: 'Score > 70%',
    filter: (result) => result.overall_score > 0.7
  },
  {
    id: 'high-confidence',
    label: 'High Confidence',
    icon: Zap,
    color: 'yellow',
    description: 'Multiple timeframes align',
    filter: (result) => result.tf_count >= 3
  },
  {
    id: 'low-risk',
    label: 'Low Risk',
    icon: Shield,
    color: 'blue',
    description: 'Conservative signals',
    filter: (result) => result.overall_score > 0.6 && result.overall_score < 0.8
  },
  {
    id: 'active',
    label: 'Most Active',
    icon: Activity,
    color: 'purple',
    description: 'High signal count',
    filter: (result) => {
      const components = result.sample_components || {};
      const activeCount = Object.values(components).filter((c: any) => c.score > 0.5).length;
      return activeCount >= 5;
    }
  }
];

const QuickFilters: React.FC<QuickFiltersProps> = ({ onFilterSelect, activeFilter }) => {
  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: { [key: string]: { active: string; inactive: string } } = {
      green: {
        active: 'bg-green-500/20 text-green-400 border-green-500/50',
        inactive: 'bg-slate-800/50 text-slate-400 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/30'
      },
      red: {
        active: 'bg-red-500/20 text-red-400 border-red-500/50',
        inactive: 'bg-slate-800/50 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
      },
      cyan: {
        active: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
        inactive: 'bg-slate-800/50 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30'
      },
      yellow: {
        active: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        inactive: 'bg-slate-800/50 text-slate-400 hover:bg-yellow-500/10 hover:text-yellow-400 hover:border-yellow-500/30'
      },
      blue: {
        active: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        inactive: 'bg-slate-800/50 text-slate-400 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30'
      },
      purple: {
        active: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
        inactive: 'bg-slate-800/50 text-slate-400 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30'
      }
    };

    return isActive ? colors[color].active : colors[color].inactive;
  };

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-slate-50">Quick Filters</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_FILTERS.map((filter, index) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;

          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterSelect(filter)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${getColorClasses(filter.color, isActive)}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-6 h-6" />
              <div className="text-center">
                <div className="text-sm font-semibold">{filter.label}</div>
                <div className="text-xs opacity-75 mt-1">{filter.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {activeFilter && (
        <motion.div
          className="mt-4 flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700/30"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <span className="text-sm text-slate-300">
            Filter active: <span className="font-semibold text-cyan-400">
              {QUICK_FILTERS.find(f => f.id === activeFilter)?.label}
            </span>
          </span>
          <button
            onClick={() => onFilterSelect({ ...QUICK_FILTERS[0], id: '' })}
            className="text-xs text-slate-400 hover:text-slate-50 underline transition-colors"
          >
            Clear Filter
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QuickFilters;
export { QUICK_FILTERS };
export type { QuickFilter };

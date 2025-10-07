import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, TrendingUp, Calendar } from 'lucide-react';

type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

interface TimeframeOption {
  value: Timeframe;
  label: string;
  description: string;
  category: 'intraday' | 'swing' | 'position';
  icon: any;
}

interface TimeframeSelectorProps {
  selected: Timeframe[];
  onChange: (timeframes: Timeframe[]) => void;
  multiple?: boolean;
  layout?: 'grid' | 'list';
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  selected,
  onChange,
  multiple = true,
  layout = 'grid'
}) => {
  const timeframes: TimeframeOption[] = [
    { value: '1m', label: '1 Minute', description: 'Ultra-short scalping', category: 'intraday', icon: Zap },
    { value: '5m', label: '5 Minutes', description: 'Short-term scalping', category: 'intraday', icon: Zap },
    { value: '15m', label: '15 Minutes', description: 'Quick day trading', category: 'intraday', icon: Clock },
    { value: '30m', label: '30 Minutes', description: 'Active day trading', category: 'intraday', icon: Clock },
    { value: '1h', label: '1 Hour', description: 'Intraday swings', category: 'swing', icon: TrendingUp },
    { value: '4h', label: '4 Hours', description: 'Swing trading', category: 'swing', icon: TrendingUp },
    { value: '1d', label: '1 Day', description: 'Position trading', category: 'position', icon: Calendar },
    { value: '1w', label: '1 Week', description: 'Long-term holds', category: 'position', icon: Calendar },
  ];

  const handleToggle = (timeframe: Timeframe) => {
    if (multiple) {
      const newSelected = selected.includes(timeframe)
        ? selected.filter(t => t !== timeframe)
        : [...selected, timeframe];
      onChange(newSelected);
    } else {
      onChange([timeframe]);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'intraday':
        return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', active: 'bg-red-500 border-red-500' };
      case 'swing':
        return { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', active: 'bg-orange-500 border-orange-500' };
      case 'position':
        return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', active: 'bg-green-500 border-green-500' };
      default:
        return { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-400', active: 'bg-slate-500 border-slate-500' };
    }
  };

  const categories = [
    { id: 'intraday', name: 'Intraday', icon: Zap },
    { id: 'swing', name: 'Swing', icon: TrendingUp },
    { id: 'position', name: 'Position', icon: Calendar },
  ];

  if (layout === 'list') {
    return (
      <div className="space-y-6">
        {categories.map((category) => {
          const Icon = category.icon;
          const categoryTimeframes = timeframes.filter(t => t.category === category.id);
          const colors = getCategoryColor(category.id);

          return (
            <div key={category.id}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${colors.text}`} />
                <h3 className="font-semibold text-slate-50">{category.name}</h3>
              </div>

              <div className="space-y-2">
                {categoryTimeframes.map((tf, index) => {
                  const isSelected = selected.includes(tf.value);
                  const TfIcon = tf.icon;

                  return (
                    <motion.button
                      key={tf.value}
                      onClick={() => handleToggle(tf.value)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? `${colors.active} text-white shadow-lg`
                          : `bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : colors.bg}`}>
                          <TfIcon className={`w-5 h-5 ${isSelected ? 'text-white' : colors.text}`} />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">{tf.label}</div>
                          <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                            {tf.description}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid layout
  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const Icon = category.icon;
        const categoryTimeframes = timeframes.filter(t => t.category === category.id);
        const colors = getCategoryColor(category.id);

        return (
          <div key={category.id}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-5 h-5 ${colors.text}`} />
              <h3 className="font-semibold text-slate-50">{category.name}</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categoryTimeframes.map((tf, index) => {
                const isSelected = selected.includes(tf.value);
                const TfIcon = tf.icon;

                return (
                  <motion.button
                    key={tf.value}
                    onClick={() => handleToggle(tf.value)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${colors.active} text-white shadow-lg shadow-${colors.text.split('-')[1]}-500/20`
                        : `bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600`
                    }`}
                  >
                    <div className={`p-2 rounded-lg mb-3 ${isSelected ? 'bg-white/20' : colors.bg}`}>
                      <TfIcon className={`w-6 h-6 mx-auto ${isSelected ? 'text-white' : colors.text}`} />
                    </div>
                    
                    <div className="font-bold text-lg mb-1">{tf.label}</div>
                    <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                      {tf.description}
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selection Summary */}
      {selected.length > 0 && (
        <motion.div
          className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-cyan-400">
                {selected.length} timeframe{selected.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={() => onChange([])}
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Clear All
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {selected.map((tf) => {
              const timeframe = timeframes.find(t => t.value === tf);
              if (!timeframe) return null;
              const colors = getCategoryColor(timeframe.category);
              
              return (
                <span
                  key={tf}
                  className={`px-2 py-1 rounded text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
                >
                  {timeframe.label}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TimeframeSelector;

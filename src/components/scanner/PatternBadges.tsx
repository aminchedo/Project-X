import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Zap, Target } from 'lucide-react';

interface Pattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

interface PatternBadgesProps {
  patterns: Pattern[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

const PatternBadges: React.FC<PatternBadgesProps> = ({ 
  patterns, 
  maxDisplay = 5,
  size = 'md'
}) => {
  const getPatternConfig = (type: string) => {
    switch (type) {
      case 'bullish':
        return {
          icon: TrendingUp,
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30'
        };
      case 'bearish':
        return {
          icon: TrendingDown,
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30'
        };
      default:
        return {
          icon: Activity,
          bg: 'bg-slate-500/20',
          text: 'text-slate-400',
          border: 'border-slate-500/30'
        };
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Sort by confidence and take top N
  const displayPatterns = patterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxDisplay);

  if (patterns.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg">
        <Activity className="w-4 h-4 text-slate-600" />
        <span className="text-sm text-slate-500">No patterns detected</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {displayPatterns.map((pattern, index) => {
        const config = getPatternConfig(pattern.type);
        const Icon = config.icon;

        return (
          <motion.div
            key={`${pattern.name}-${index}`}
            className={`flex items-center ${sizeClasses[size]} ${config.bg} ${config.text} border ${config.border} rounded-lg font-medium`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
          >
            <Icon className={iconSizes[size]} />
            <span>{pattern.name}</span>
            {pattern.confidence > 0 && (
              <span className="opacity-75 text-xs">
                {(pattern.confidence * 100).toFixed(0)}%
              </span>
            )}
          </motion.div>
        );
      })}

      {/* Show count if there are more patterns */}
      {patterns.length > maxDisplay && (
        <motion.div
          className="flex items-center px-3 py-1.5 bg-slate-700/50 text-slate-300 border border-slate-600/30 rounded-lg text-sm font-medium"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: maxDisplay * 0.05 }}
        >
          +{patterns.length - maxDisplay} more
        </motion.div>
      )}
    </div>
  );
};

export default PatternBadges;

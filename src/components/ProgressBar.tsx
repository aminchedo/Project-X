import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: 'cyan' | 'green' | 'red' | 'yellow' | 'purple';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  color = 'cyan',
  showPercentage = true,
  size = 'md'
}) => {
  const percentage = (value / max) * 100;

  const colorClasses = {
    cyan: 'bg-cyan-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  }[color];

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }[size];

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm text-slate-300">{label}</span>}
          {showPercentage && <span className="text-sm font-semibold text-slate-400">{percentage.toFixed(1)}%</span>}
        </div>
      )}

      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${heights}`}>
        <motion.div
          className={`${heights} ${colorClasses} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

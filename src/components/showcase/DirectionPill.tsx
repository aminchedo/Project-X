import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DirectionPillProps {
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const DirectionPill: React.FC<DirectionPillProps> = ({ 
  direction, 
  size = 'md',
  showIcon = true 
}) => {
  const config = {
    BULLISH: {
      label: 'صعودی',
      icon: TrendingUp,
      classes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    BEARISH: {
      label: 'نزولی',
      icon: TrendingDown,
      classes: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    NEUTRAL: {
      label: 'خنثی',
      icon: Minus,
      classes: 'bg-slate-600/20 text-slate-400 border-slate-500/30'
    }
  };

  const { label, icon: Icon, classes } = config[direction];
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-semibold ${classes} ${sizeClasses}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </span>
  );
};

export default DirectionPill;

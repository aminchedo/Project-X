import React from 'react';
import { Shield } from 'lucide-react';

interface ConfidenceGaugeProps {
  confidence: number; // 0-1
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ 
  confidence, 
  size = 'md' 
}) => {
  const percentage = Math.max(0, Math.min(100, confidence * 100));

  const getColor = (conf: number) => {
    if (conf < 0.5) return { text: 'text-red-400', bg: 'from-red-500 to-red-600' };
    if (conf < 0.7) return { text: 'text-amber-400', bg: 'from-amber-500 to-amber-600' };
    return { text: 'text-emerald-400', bg: 'from-emerald-500 to-emerald-600' };
  };

  const sizeClasses = {
    sm: { container: 'p-3', icon: 'w-6 h-6', text: 'text-lg' },
    md: { container: 'p-4', icon: 'w-8 h-8', text: 'text-2xl' },
    lg: { container: 'p-6', icon: 'w-10 h-10', text: 'text-3xl' }
  };

  const colors = getColor(confidence);
  const classes = sizeClasses[size];

  return (
    <div className={`bg-slate-800/40 rounded-xl ${classes.container} border border-slate-700/50`}>
      <div className="flex items-center gap-4">
        <div className={`${colors.text} opacity-80`}>
          <Shield className={classes.icon} />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`${classes.text} font-bold ${colors.text}`}>
              {percentage.toFixed(0)}%
            </span>
            <span className="text-sm text-slate-400">اطمینان</span>
          </div>
          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${colors.bg} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceGauge;

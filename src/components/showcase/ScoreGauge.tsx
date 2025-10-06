import React, { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number; // 0-1 range
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ 
  score, 
  size = 'md',
  showLabel = true,
  animate = true
}) => {
  // Clamp score to 0-1
  const clampedScore = Math.max(0, Math.min(1, score));
  const [animatedScore, setAnimatedScore] = useState(animate ? 0 : clampedScore);

  // Animate score on mount
  useEffect(() => {
    if (animate) {
      const duration = 700; // ms
      const steps = 30;
      const increment = clampedScore / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setAnimatedScore(clampedScore);
          clearInterval(timer);
        } else {
          setAnimatedScore(increment * currentStep);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [clampedScore, animate]);

  const displayScore = animate ? animatedScore : clampedScore;
  const percentage = displayScore * 100;

  // Color mapping: 0-0.3=bearish(red), 0.3-0.7=neutral(yellow), 0.7-1=bullish(green)
  const getColor = (s: number) => {
    if (s < 0.3) return 'text-red-400 border-red-500/50 bg-red-500/20';
    if (s < 0.7) return 'text-amber-400 border-amber-500/50 bg-amber-500/20';
    return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/20';
  };

  const getGradient = (s: number) => {
    if (s < 0.3) return 'from-red-500 via-red-500 to-red-600';
    if (s < 0.7) return 'from-amber-500 via-amber-500 to-amber-600';
    return 'from-emerald-500 via-emerald-500 to-emerald-600';
  };

  const sizeClasses = {
    sm: { container: 'w-16 h-16', text: 'text-xs', ring: 'w-14 h-14', stroke: '3' },
    md: { container: 'w-20 h-20', text: 'text-sm', ring: 'w-18 h-18', stroke: '4' },
    lg: { container: 'w-24 h-24', text: 'text-base', ring: 'w-22 h-22', stroke: '5' }
  };

  const classes = sizeClasses[size];
  const colorClasses = getColor(displayScore);
  const gradientClasses = getGradient(displayScore);

  // Calculate SVG circle properties for smooth animation
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${classes.container}`}>
        {/* SVG Circle Progress */}
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth={classes.stroke}
            fill="none"
            className="text-slate-700/30"
          />
          
          {/* Animated Progress Circle with Gradient */}
          <defs>
            <linearGradient id={`gradient-${size}-${Math.random()}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className={displayScore < 0.3 ? 'text-red-500' : displayScore < 0.7 ? 'text-amber-500' : 'text-emerald-500'} stopColor="currentColor" />
              <stop offset="100%" className={displayScore < 0.3 ? 'text-red-600' : displayScore < 0.7 ? 'text-amber-600' : 'text-emerald-600'} stopColor="currentColor" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={`url(#gradient-${size}-${Math.random()})`}
            strokeWidth={classes.stroke}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
            style={{
              filter: displayScore > 0.8 ? 'drop-shadow(0 0 8px currentColor)' : 'none'
            }}
          />
        </svg>
        
        {/* Score text with glow for high scores */}
        <div className={`absolute inset-0 flex items-center justify-center ${classes.text} font-bold ${colorClasses.split(' ')[0]}`}
          style={{
            textShadow: displayScore > 0.8 ? '0 0 10px currentColor' : 'none'
          }}
        >
          {percentage.toFixed(0)}
        </div>
      </div>
      
      {showLabel && (
        <div className={`mt-2 ${classes.text} font-medium ${colorClasses.split(' ')[0]}`}>
          امتیاز
        </div>
      )}
    </div>
  );
};

export default ScoreGauge;

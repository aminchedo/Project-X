import React, { useRef, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { ProfessionalCard } from '../Layout/ProfessionalLayout';

interface ChartData {
  timestamp: string;
  value: number;
  label?: string;
}

interface ProfessionalLineChartProps {
  data: ChartData[];
  title: string;
  subtitle?: string;
  color?: string;
  height?: number;
  showTrend?: boolean;
}

export const ProfessionalLineChart: React.FC<ProfessionalLineChartProps> = ({
  data,
  title,
  subtitle,
  color = '#06b6d4',
  height = 120,
  showTrend = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        setDimensions({
          width: canvasRef.current.parentElement.clientWidth,
          height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  useEffect(() => {
    if (!data.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chart settings
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Calculate data range
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    // Helper functions
    const getX = (index: number) => padding + (index * chartWidth) / (data.length - 1);
    const getY = (value: number) => padding + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    // Draw grid
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = padding + (chartWidth * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw gradient fill
    const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(getX(0), canvas.height - padding);
    
    data.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(getX(data.length - 1), canvas.height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw data points
    ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

  }, [data, dimensions, color]);

  const currentValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || 0;
  const change = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  return (
    <ProfessionalCard title={title} subtitle={subtitle}>
      <div className="space-y-4">
        {/* Value Display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-white">
              {typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue}
            </div>
            {showTrend && (
              <div className={`flex items-center space-x-1 text-sm ${
                change >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {change >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Chart */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: `${height}px` }}
          />
        </div>
      </div>
    </ProfessionalCard>
  );
};

// Professional Metric Card
interface ProfessionalMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<any>;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
}

export const ProfessionalMetricCard: React.FC<ProfessionalMetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'primary',
  trend = 'neutral'
}) => {
  const colorClasses = {
    primary: 'text-cyan-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  };

  const bgColorClasses = {
    primary: 'bg-gradient-to-br from-cyan-500/20 to-blue-600/10',
    success: 'bg-gradient-to-br from-emerald-500/20 to-green-600/10',
    warning: 'bg-gradient-to-br from-amber-500/20 to-yellow-600/10',
    error: 'bg-gradient-to-br from-red-500/20 to-pink-600/10',
    info: 'bg-gradient-to-br from-blue-500/20 to-indigo-600/10'
  };

  const shadowClasses = {
    primary: 'shadow-lg shadow-cyan-500/10',
    success: 'shadow-lg shadow-emerald-500/10',
    warning: 'shadow-lg shadow-amber-500/10',
    error: 'shadow-lg shadow-red-500/10',
    info: 'shadow-lg shadow-blue-500/10'
  };

  return (
    <ProfessionalCard className={`hover:scale-105 transition-all duration-300 hover:shadow-xl ${shadowClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center space-x-1 text-sm ${
              trend === 'up' ? 'text-emerald-400' : 
              trend === 'down' ? 'text-red-400' : 
              'text-slate-400'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'neutral' && <Activity className="w-3 h-3" />}
              <span>{change >= 0 ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-slate-500">({changeLabel})</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${bgColorClasses[color]} relative overflow-hidden`}>
            <Icon className={`w-6 h-6 ${colorClasses[color]} relative z-10`} />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        )}
      </div>
    </ProfessionalCard>
  );
};

// Professional Progress Bar
interface ProfessionalProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProfessionalProgressBar: React.FC<ProfessionalProgressBarProps> = ({
  value,
  max = 100,
  label,
  color = 'primary',
  showPercentage = true,
  size = 'md'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const colorClasses = {
    primary: 'bg-gradient-to-r from-cyan-500 to-blue-600',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600',
    warning: 'bg-gradient-to-r from-amber-500 to-yellow-600',
    error: 'bg-gradient-to-r from-red-500 to-pink-600'
  };

  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-slate-400">{label}</span>}
          {showPercentage && <span className="text-white font-medium">{percentage.toFixed(1)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-700/50 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

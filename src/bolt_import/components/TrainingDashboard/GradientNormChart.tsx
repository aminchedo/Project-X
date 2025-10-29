import React, { useRef, useEffect } from 'react';

interface TrainingMetrics {
  epoch: number;
  gradient_norm: number;
  learning_rate: number;
  timestamp: string;
}

interface GradientNormChartProps {
  data: TrainingMetrics[];
  className?: string;
}

const GradientNormChart: React.FC<GradientNormChartProps> = ({ data, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (data.length > 0 && canvasRef.current) {
      drawChart();
    }
  }, [data]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Chart dimensions
    const padding = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;

    // Get gradient norm values
    const gradientNorms = data.map(d => d.gradient_norm).filter(v => !isNaN(v) && isFinite(v));
    if (gradientNorms.length === 0) return;

    // Calculate ranges
    const minGradNorm = Math.min(...gradientNorms);
    const maxGradNorm = Math.max(...gradientNorms);
    const gradRange = maxGradNorm - minGradNorm;
    const paddedMin = Math.max(0, minGradNorm - gradRange * 0.1);
    const paddedMax = maxGradNorm + gradRange * 0.1;
    const paddedRange = paddedMax - paddedMin;

    // Gradient clipping threshold (typical value)
    const clippingThreshold = 1.0;

    // Draw grid
    drawGrid(ctx, rect.width, rect.height, padding);

    // Draw clipping threshold line
    if (clippingThreshold <= paddedMax && clippingThreshold >= paddedMin) {
      drawThresholdLine(ctx, clippingThreshold, padding, chartWidth, chartHeight, paddedMin, paddedRange);
    }

    // Draw gradient norm bars
    drawGradientBars(ctx, data, padding, chartWidth, chartHeight, paddedMin, paddedRange, clippingThreshold);

    // Draw axes labels
    drawAxesLabels(ctx, rect.width, rect.height, padding, paddedMin, paddedMax, data);

    // Draw statistics
    drawStatistics(ctx, rect.width, padding, gradientNorms, clippingThreshold);
  };

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    padding: any
  ) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * (height - padding.top - padding.bottom);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  const drawThresholdLine = (
    ctx: CanvasRenderingContext2D,
    threshold: number,
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minValue: number,
    valueRange: number
  ) => {
    const y = padding.top + chartHeight - ((threshold - minValue) / valueRange) * chartHeight;
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
    
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = '#ef4444';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`Clipping Threshold (${threshold})`, padding.left + 5, y - 5);
  };

  const drawGradientBars = (
    ctx: CanvasRenderingContext2D,
    data: TrainingMetrics[],
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minValue: number,
    valueRange: number,
    clippingThreshold: number
  ) => {
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length;

    data.forEach((point, index) => {
      if (isNaN(point.gradient_norm) || !isFinite(point.gradient_norm)) return;

      const x = padding.left + index * barSpacing + barSpacing / 2;
      const barHeight = ((point.gradient_norm - minValue) / valueRange) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // Color based on whether gradient was clipped
      const isClipped = point.gradient_norm >= clippingThreshold;
      ctx.fillStyle = isClipped ? '#ef4444' : '#10b981';

      ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);

      // Highlight clipped gradients
      if (isClipped) {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
      }
    });
  };

  const drawAxesLabels = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    padding: any,
    minValue: number,
    maxValue: number,
    data: TrainingMetrics[]
  ) => {
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';

    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (i / 5) * (maxValue - minValue);
      const y = padding.top + (height - padding.top - padding.bottom) - (i / 5) * (height - padding.top - padding.bottom);
      ctx.fillText(value.toFixed(3), padding.left - 10, y + 4);
    }

    // X-axis labels (epochs) - show only a few
    ctx.textAlign = 'center';
    const maxEpochs = Math.max(...data.map(d => d.epoch));
    const labelCount = Math.min(6, data.length);
    
    for (let i = 0; i < labelCount; i++) {
      const dataIndex = Math.floor((i / (labelCount - 1)) * (data.length - 1));
      const epoch = data[dataIndex]?.epoch || 0;
      const x = padding.left + (i / (labelCount - 1)) * (width - padding.left - padding.right);
      ctx.fillText(epoch.toString(), x, height - padding.bottom + 20);
    }

    // Axis titles
    ctx.font = '14px system-ui';
    ctx.fillStyle = '#374151';
    
    // Y-axis title
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Gradient Norm', 0, 0);
    ctx.restore();

    // X-axis title
    ctx.textAlign = 'center';
    ctx.fillText('Epoch', width / 2, height - 5);
  };

  const drawStatistics = (
    ctx: CanvasRenderingContext2D,
    width: number,
    padding: any,
    gradientNorms: number[],
    clippingThreshold: number
  ) => {
    const stats = {
      current: gradientNorms[gradientNorms.length - 1],
      average: gradientNorms.reduce((sum, val) => sum + val, 0) / gradientNorms.length,
      max: Math.max(...gradientNorms),
      clippedCount: gradientNorms.filter(norm => norm >= clippingThreshold).length,
      clippedPercentage: (gradientNorms.filter(norm => norm >= clippingThreshold).length / gradientNorms.length) * 100
    };

    ctx.font = '12px system-ui';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'left';

    const statsX = width - padding.right - 150;
    const statsY = padding.top + 20;
    const lineHeight = 16;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(statsX - 5, statsY - 15, 145, 100);
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(statsX - 5, statsY - 15, 145, 100);

    ctx.fillStyle = '#374151';
    ctx.fillText(`Current: ${stats.current.toFixed(4)}`, statsX, statsY);
    ctx.fillText(`Average: ${stats.average.toFixed(4)}`, statsX, statsY + lineHeight);
    ctx.fillText(`Max: ${stats.max.toFixed(4)}`, statsX, statsY + lineHeight * 2);
    
    ctx.fillStyle = stats.clippedCount > 0 ? '#ef4444' : '#10b981';
    ctx.fillText(`Clipped: ${stats.clippedCount} (${stats.clippedPercentage.toFixed(1)}%)`, statsX, statsY + lineHeight * 3);
    
    // Status indicator
    const statusY = statsY + lineHeight * 4.5;
    ctx.fillStyle = stats.current >= clippingThreshold ? '#ef4444' : '#10b981';
    ctx.fillRect(statsX, statusY, 8, 8);
    
    ctx.fillStyle = '#374151';
    ctx.fillText(stats.current >= clippingThreshold ? 'Clipping Active' : 'Normal Range', statsX + 12, statusY + 6);
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">No gradient data available</div>
            <div className="text-sm">Start training to see gradient norms</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded p-2 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500"></div>
            <span>Clipped</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-1 bg-red-500 border-dashed border border-red-500"></div>
            <span>Threshold</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradientNormChart;

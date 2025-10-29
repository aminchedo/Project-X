import React, { useRef, useEffect } from 'react';

interface TrainingMetrics {
  epoch: number;
  loss: number;
  val_loss: number;
  accuracy: number;
  val_accuracy: number;
  r2_score: number;
  val_r2_score: number;
  mse: number;
  mae: number;
  directional_accuracy: number;
  learning_rate: number;
  gradient_norm: number;
  timestamp: string;
}

interface MetricsChartProps {
  data: TrainingMetrics[];
  metric: string;
  className?: string;
}

const MetricsChart: React.FC<MetricsChartProps> = ({ data, metric, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (data.length > 0 && canvasRef.current) {
      drawChart();
    }
  }, [data, metric]);

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

    // Get metric values
    const trainValues = data.map(d => d[metric as keyof TrainingMetrics] as number);
    const valMetric = `val_${metric}`;
    const valValues = data.map(d => d[valMetric as keyof TrainingMetrics] as number || 0);

    // Calculate ranges
    const allValues = [...trainValues, ...valValues].filter(v => !isNaN(v) && isFinite(v));
    if (allValues.length === 0) return;

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const valueRange = maxValue - minValue;
    const paddedMin = minValue - valueRange * 0.1;
    const paddedMax = maxValue + valueRange * 0.1;
    const paddedRange = paddedMax - paddedMin;

    // Draw grid
    drawGrid(ctx, rect.width, rect.height, padding, paddedMin, paddedMax);

    // Draw training line
    if (trainValues.length > 0) {
      drawLine(ctx, trainValues, data, padding, chartWidth, chartHeight, paddedMin, paddedRange, '#3b82f6', 'Training');
    }

    // Draw validation line
    if (valValues.some(v => v !== 0)) {
      drawLine(ctx, valValues, data, padding, chartWidth, chartHeight, paddedMin, paddedRange, '#ef4444', 'Validation');
    }

    // Draw axes labels
    drawAxesLabels(ctx, rect.width, rect.height, padding, paddedMin, paddedMax, data);

    // Draw legend
    drawLegend(ctx, rect.width, padding, trainValues.length > 0, valValues.some(v => v !== 0));
  };

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    padding: any,
    minValue: number,
    maxValue: number
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

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (i / 10) * (width - padding.left - padding.right);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    values: number[],
    data: TrainingMetrics[],
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minValue: number,
    valueRange: number,
    color: string,
    label: string
  ) => {
    if (values.length < 2) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    let hasStarted = false;

    values.forEach((value, index) => {
      if (isNaN(value) || !isFinite(value)) return;

      const x = padding.left + (index / (values.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

      if (!hasStarted) {
        ctx.moveTo(x, y);
        hasStarted = true;
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    ctx.fillStyle = color;
    values.forEach((value, index) => {
      if (isNaN(value) || !isFinite(value)) return;

      const x = padding.left + (index / (values.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
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
      ctx.fillText(value.toFixed(4), padding.left - 10, y + 4);
    }

    // X-axis labels (epochs)
    ctx.textAlign = 'center';
    const maxEpochs = Math.max(...data.map(d => d.epoch));
    for (let i = 0; i <= 5; i++) {
      const epoch = Math.floor((i / 5) * maxEpochs);
      const x = padding.left + (i / 5) * (width - padding.left - padding.right);
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
    ctx.fillText(getMetricLabel(metric), 0, 0);
    ctx.restore();

    // X-axis title
    ctx.textAlign = 'center';
    ctx.fillText('Epoch', width / 2, height - 5);
  };

  const drawLegend = (
    ctx: CanvasRenderingContext2D,
    width: number,
    padding: any,
    hasTraining: boolean,
    hasValidation: boolean
  ) => {
    ctx.font = '12px system-ui';
    let legendX = width - padding.right - 120;
    const legendY = padding.top + 10;

    if (hasTraining) {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(legendX, legendY, 12, 2);
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';
      ctx.fillText('Training', legendX + 20, legendY + 6);
    }

    if (hasValidation) {
      const valLegendY = legendY + (hasTraining ? 20 : 0);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(legendX, valLegendY, 12, 2);
      ctx.fillStyle = '#374151';
      ctx.fillText('Validation', legendX + 20, valLegendY + 6);
    }
  };

  const getMetricLabel = (metric: string): string => {
    const labels: { [key: string]: string } = {
      'loss': 'Loss',
      'accuracy': 'Accuracy',
      'r2_score': 'R² Score',
      'mse': 'Mean Squared Error',
      'mae': 'Mean Absolute Error',
      'directional_accuracy': 'Directional Accuracy'
    };
    return labels[metric] || metric;
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
            <div className="text-lg mb-2">No training data available</div>
            <div className="text-sm">Start training to see metrics</div>
          </div>
        </div>
      )}

      {/* Current Value Display */}
      {data.length > 0 && (
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded p-2 text-sm">
          <div className="font-semibold">{getMetricLabel(metric)}</div>
          <div className="text-blue-600">
            Training: {(data[data.length - 1][metric as keyof TrainingMetrics] as number).toFixed(4)}
          </div>
          {data[data.length - 1][`val_${metric}` as keyof TrainingMetrics] && (
            <div className="text-red-600">
              Validation: {(data[data.length - 1][`val_${metric}` as keyof TrainingMetrics] as number).toFixed(4)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsChart;

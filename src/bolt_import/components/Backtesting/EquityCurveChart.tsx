import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface EquityCurveChartProps {
  backtest: {
    id: string;
    metrics: {
      total_return: number;
      max_drawdown: number;
      sharpe_ratio: number;
    };
    equity_curve: Array<{
      date: string;
      equity: number;
      drawdown: number;
    }>;
  };
}

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ backtest }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [showDrawdown, setShowDrawdown] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    drawChart();
  }, [backtest, zoomLevel, panOffset, showDrawdown, hoveredPoint]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up data
    const equityData = backtest.equity_curve;
    if (equityData.length === 0) return;

    // Calculate visible range based on zoom and pan
    const totalPoints = equityData.length;
    const visiblePoints = Math.floor(totalPoints / zoomLevel);
    const startIndex = Math.max(0, Math.floor(panOffset));
    const endIndex = Math.min(totalPoints, startIndex + visiblePoints);

    const visibleData = equityData.slice(startIndex, endIndex);

    // Find min/max values
    const equityValues = visibleData.map(d => d.equity);
    const drawdownValues = visibleData.map(d => d.drawdown);
    
    const minEquity = Math.min(...equityValues);
    const maxEquity = Math.max(...equityValues);
    const minDrawdown = Math.min(...drawdownValues);
    const maxDrawdown = Math.max(...drawdownValues);

    // Calculate scales
    const equityRange = maxEquity - minEquity;
    const drawdownRange = maxDrawdown - minDrawdown;
    const maxRange = Math.max(equityRange, drawdownRange * 2); // Scale drawdown to be more visible

    const xScale = chartWidth / visibleData.length;
    const yScale = chartHeight / maxRange;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Draw equity curve
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    visibleData.forEach((point, index) => {
      const x = padding + index * xScale;
      const y = padding + chartHeight - ((point.equity - minEquity) * yScale);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw drawdown area if enabled
    if (showDrawdown) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
      ctx.beginPath();

      visibleData.forEach((point, index) => {
        const x = padding + index * xScale;
        const y = padding + chartHeight - ((point.drawdown - minEquity) * yScale);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      // Close the area
      ctx.lineTo(padding + visibleData.length * xScale, padding + chartHeight);
      ctx.lineTo(padding, padding + chartHeight);
      ctx.closePath();
      ctx.fill();

      // Draw drawdown line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();

      visibleData.forEach((point, index) => {
        const x = padding + index * xScale;
        const y = padding + chartHeight - ((point.drawdown - minEquity) * yScale);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw hovered point
    if (hoveredPoint !== null && hoveredPoint >= startIndex && hoveredPoint < endIndex) {
      const pointIndex = hoveredPoint - startIndex;
      const point = visibleData[pointIndex];
      const x = padding + pointIndex * xScale;
      const y = padding + chartHeight - ((point.equity - minEquity) * yScale);

      // Draw circle
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw tooltip
      const tooltipText = `${new Date(point.date).toLocaleDateString()}: $${point.equity.toLocaleString()}`;
      const textMetrics = ctx.measureText(tooltipText);
      const tooltipWidth = textMetrics.width + 16;
      const tooltipHeight = 24;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(x - tooltipWidth / 2, y - tooltipHeight - 8, tooltipWidth, tooltipHeight);

      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(tooltipText, x, y - 2);
    }

    // Draw axes labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    // Y-axis labels (equity)
    for (let i = 0; i <= 5; i++) {
      const value = minEquity + (equityRange / 5) * i;
      const y = padding + chartHeight - (i * chartHeight / 5);
      ctx.fillText(`$${value.toLocaleString()}`, padding - 10, y + 4);
    }

    // X-axis labels (dates)
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const index = Math.floor((visibleData.length / 5) * i);
      if (index < visibleData.length) {
        const x = padding + index * xScale;
        const date = new Date(visibleData[index].date);
        ctx.fillText(date.toLocaleDateString(), x, height - padding + 20);
      }
    }

    // Draw title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Equity Curve', width / 2, 30);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const xScale = chartWidth / backtest.equity_curve.length;

    const pointIndex = Math.floor((x - padding) / xScale);
    
    if (pointIndex >= 0 && pointIndex < backtest.equity_curve.length) {
      setHoveredPoint(pointIndex);
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 1));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset(0);
  };

  const exportChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `equity-curve-${backtest.id}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Equity Curve Analysis</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={zoomIn}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={exportChart}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Export Chart"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Total Return</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatPercentage(backtest.metrics.total_return)}
          </div>
          <div className="text-sm text-gray-600">
            {formatCurrency(backtest.equity_curve[backtest.equity_curve.length - 1]?.equity || 0)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span className="text-sm text-gray-600">Max Drawdown</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {formatPercentage(backtest.metrics.max_drawdown)}
          </div>
          <div className="text-sm text-gray-600">
            Worst peak-to-trough
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Sharpe Ratio</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {backtest.metrics.sharpe_ratio.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            Risk-adjusted return
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Final Equity</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(backtest.equity_curve[backtest.equity_curve.length - 1]?.equity || 0)}
          </div>
          <div className="text-sm text-gray-600">
            End of period
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showDrawdown}
                onChange={(e) => setShowDrawdown(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Show Drawdown Area</span>
            </label>
          </div>

          <div className="text-sm text-gray-600">
            Zoom: {zoomLevel.toFixed(1)}x | 
            Points: {backtest.equity_curve.length} | 
            Period: {new Date(backtest.equity_curve[0]?.date).toLocaleDateString()} - {new Date(backtest.equity_curve[backtest.equity_curve.length - 1]?.date).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {/* Chart Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Chart Legend</h4>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-blue-600"></div>
            <span className="text-gray-700">Equity Curve</span>
          </div>
          {showDrawdown && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-0.5 bg-red-600 border-dashed border-t-2 border-red-600"></div>
              <span className="text-gray-700">Drawdown</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-gray-700">Hover Point</span>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Performance Insights</h4>
        <div className="text-sm text-blue-700 space-y-1">
          {backtest.metrics.total_return > 0 ? (
            <p>• Strategy generated positive returns over the testing period</p>
          ) : (
            <p>• Strategy generated negative returns over the testing period</p>
          )}
          {backtest.metrics.max_drawdown < 0.1 ? (
            <p>• Low maximum drawdown indicates good risk management</p>
          ) : (
            <p>• High maximum drawdown suggests potential risk management issues</p>
          )}
          {backtest.metrics.sharpe_ratio > 1 ? (
            <p>• Strong risk-adjusted returns (Sharpe ratio > 1)</p>
          ) : (
            <p>• Moderate risk-adjusted returns (Sharpe ratio < 1)</p>
          )}
          <p>• Hover over the chart to see detailed point information</p>
        </div>
      </div>
    </div>
  );
};

export default EquityCurveChart;

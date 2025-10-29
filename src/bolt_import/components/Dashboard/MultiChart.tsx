import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, LineChart, TrendingUp, Settings, Download, Maximize2 } from 'lucide-react';

interface ChartData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MultiChartProps {
  symbol: string;
  timeframe: string;
  className?: string;
}

type ChartType = 'candlestick' | 'line' | 'area' | 'volume' | 'heatmap';

const MultiChart: React.FC<MultiChartProps> = ({ symbol, timeframe, className = '' }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/market/chart/${symbol}?timeframe=${timeframe}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        const data = await response.json();
        setChartData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
    const interval = setInterval(fetchChartData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  useEffect(() => {
    if (chartData.length > 0 && canvasRef.current) {
      drawChart();
    }
  }, [chartData, chartType]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (chartData.length === 0) return;

    // Calculate dimensions
    const padding = 40;
    const chartWidth = rect.width - 2 * padding;
    const chartHeight = rect.height - 2 * padding;

    // Find price range
    const prices = chartData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw based on chart type
    switch (chartType) {
      case 'candlestick':
        drawCandlestickChart(ctx, chartData, padding, chartWidth, chartHeight, minPrice, priceRange);
        break;
      case 'line':
        drawLineChart(ctx, chartData, padding, chartWidth, chartHeight, minPrice, priceRange);
        break;
      case 'area':
        drawAreaChart(ctx, chartData, padding, chartWidth, chartHeight, minPrice, priceRange);
        break;
      case 'volume':
        drawVolumeChart(ctx, chartData, padding, chartWidth, chartHeight);
        break;
      case 'heatmap':
        drawHeatmapChart(ctx, chartData, padding, chartWidth, chartHeight, minPrice, priceRange);
        break;
    }

    // Draw axes
    drawAxes(ctx, rect.width, rect.height, padding, minPrice, maxPrice, chartData);
  };

  const drawCandlestickChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData[],
    padding: number,
    width: number,
    height: number,
    minPrice: number,
    priceRange: number
  ) => {
    const candleWidth = width / data.length * 0.8;
    const candleSpacing = width / data.length;

    data.forEach((candle, index) => {
      const x = padding + index * candleSpacing + candleSpacing / 2;
      const openY = padding + height - ((candle.open - minPrice) / priceRange) * height;
      const closeY = padding + height - ((candle.close - minPrice) / priceRange) * height;
      const highY = padding + height - ((candle.high - minPrice) / priceRange) * height;
      const lowY = padding + height - ((candle.low - minPrice) / priceRange) * height;

      const isGreen = candle.close > candle.open;
      const color = isGreen ? '#10b981' : '#ef4444';

      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, Math.max(bodyHeight, 1));
    });
  };

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData[],
    padding: number,
    width: number,
    height: number,
    minPrice: number,
    priceRange: number
  ) => {
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * width;
      const y = padding + height - ((point.close - minPrice) / priceRange) * height;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  const drawAreaChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData[],
    padding: number,
    width: number,
    height: number,
    minPrice: number,
    priceRange: number
  ) => {
    // Create gradient
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

    ctx.fillStyle = gradient;
    ctx.beginPath();

    // Start from bottom left
    ctx.moveTo(padding, padding + height);

    // Draw the line
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * width;
      const y = padding + height - ((point.close - minPrice) / priceRange) * height;
      ctx.lineTo(x, y);
    });

    // Close the area
    ctx.lineTo(padding + width, padding + height);
    ctx.closePath();
    ctx.fill();

    // Draw the line on top
    drawLineChart(ctx, data, padding, width, height, minPrice, priceRange);
  };

  const drawVolumeChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData[],
    padding: number,
    width: number,
    height: number
  ) => {
    const maxVolume = Math.max(...data.map(d => d.volume));
    const barWidth = width / data.length * 0.8;
    const barSpacing = width / data.length;

    data.forEach((bar, index) => {
      const x = padding + index * barSpacing + barSpacing / 2;
      const barHeight = (bar.volume / maxVolume) * height;
      const y = padding + height - barHeight;

      ctx.fillStyle = '#6b7280';
      ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
    });
  };

  const drawHeatmapChart = (
    ctx: CanvasRenderingContext2D,
    data: ChartData[],
    padding: number,
    width: number,
    height: number,
    minPrice: number,
    priceRange: number
  ) => {
    const cellWidth = width / data.length;
    const cellHeight = height / 20; // 20 price levels

    data.forEach((point, index) => {
      const x = padding + index * cellWidth;
      
      for (let level = 0; level < 20; level++) {
        const priceLevel = minPrice + (level / 19) * priceRange;
        const y = padding + height - (level + 1) * cellHeight;
        
        // Calculate intensity based on proximity to actual price
        const distance = Math.abs(point.close - priceLevel) / priceRange;
        const intensity = Math.max(0, 1 - distance * 5);
        
        const red = Math.floor(255 * intensity);
        const blue = Math.floor(255 * (1 - intensity));
        
        ctx.fillStyle = `rgba(${red}, 0, ${blue}, ${intensity * 0.7})`;
        ctx.fillRect(x, y, cellWidth, cellHeight);
      }
    });
  };

  const drawAxes = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    padding: number,
    minPrice: number,
    maxPrice: number,
    data: ChartData[]
  ) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.font = '12px system-ui';
    ctx.fillStyle = '#6b7280';

    // Y-axis (price)
    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const price = minPrice + (i / priceSteps) * (maxPrice - minPrice);
      const y = padding + (canvasHeight - 2 * padding) - (i / priceSteps) * (canvasHeight - 2 * padding);
      
      // Grid line
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvasWidth - padding, y);
      ctx.stroke();
      
      // Price label
      ctx.fillText(price.toFixed(2), canvasWidth - padding + 5, y + 4);
    }

    // X-axis (time)
    const timeSteps = 5;
    for (let i = 0; i <= timeSteps; i++) {
      const dataIndex = Math.floor((i / timeSteps) * (data.length - 1));
      const x = padding + (i / timeSteps) * (canvasWidth - 2 * padding);
      
      if (data[dataIndex]) {
        // Grid line
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, canvasHeight - padding);
        ctx.stroke();
        
        // Time label
        const time = new Date(data[dataIndex].timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        ctx.fillText(time, x - 20, canvasHeight - padding + 15);
      }
    }
  };

  const chartTypeButtons = [
    { type: 'candlestick' as ChartType, icon: BarChart3, label: 'Candlestick' },
    { type: 'line' as ChartType, icon: LineChart, label: 'Line' },
    { type: 'area' as ChartType, icon: TrendingUp, label: 'Area' },
    { type: 'volume' as ChartType, icon: BarChart3, label: 'Volume' },
    { type: 'heatmap' as ChartType, icon: Settings, label: 'Heatmap' },
  ];

  const exportChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${symbol}_${timeframe}_chart.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {symbol} Chart ({timeframe})
          </h3>
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <BarChart3 className="w-12 h-12 text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {symbol} Chart ({timeframe})
          </h3>
        </div>
        <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {symbol} Chart ({timeframe})
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportChart}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Export Chart"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chartTypeButtons.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
              chartType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-96 border border-gray-200 rounded-lg"
          style={{ display: 'block' }}
        />
        
        {/* Chart Info Overlay */}
        {chartData.length > 0 && (
          <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded p-2 text-sm">
            <div className="font-semibold">{symbol}</div>
            <div className="text-gray-600">
              Last: ${chartData[chartData.length - 1]?.close.toFixed(4)}
            </div>
            <div className="text-gray-600">
              Volume: {(chartData[chartData.length - 1]?.volume / 1e6).toFixed(2)}M
            </div>
          </div>
        )}
      </div>

      {/* Chart Statistics */}
      {chartData.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">High</div>
            <div className="font-semibold">
              ${Math.max(...chartData.map(d => d.high)).toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Low</div>
            <div className="font-semibold">
              ${Math.min(...chartData.map(d => d.low)).toFixed(4)}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Avg Volume</div>
            <div className="font-semibold">
              {(chartData.reduce((sum, d) => sum + d.volume, 0) / chartData.length / 1e6).toFixed(2)}M
            </div>
          </div>
          <div>
            <div className="text-gray-600">Data Points</div>
            <div className="font-semibold">{chartData.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiChart;

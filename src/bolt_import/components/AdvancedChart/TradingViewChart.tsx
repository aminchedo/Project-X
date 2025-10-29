import React, { useEffect, useRef, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  Activity, 
  Settings, 
  Download, 
  Maximize2,
  Eye,
  EyeOff,
  Layers,
  Target,
  Zap
} from 'lucide-react';

interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SMCData {
  orderBlocks: Array<{
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    type: 'bullish' | 'bearish';
    confidence: number;
  }>;
  fairValueGaps: Array<{
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    type: 'bullish' | 'bearish';
    filled: boolean;
  }>;
  liquidityZones: Array<{
    y: number;
    strength: number;
    type: 'support' | 'resistance';
  }>;
  breakOfStructure: Array<{
    x: number;
    y: number;
    type: 'bullish' | 'bearish';
    significance: number;
  }>;
}

interface TradingViewChartProps {
  symbol: string;
  timeframe: string;
  data: ChartData[];
  smcData?: SMCData;
  className?: string;
}

interface ChartSettings {
  chartType: 'candlestick' | 'line' | 'area' | 'heikin-ashi' | 'renko';
  showVolume: boolean;
  showSMC: boolean;
  showOrderBlocks: boolean;
  showFVG: boolean;
  showLiquidityZones: boolean;
  showBOS: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  theme: 'light' | 'dark';
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  timeframe,
  data,
  smcData,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<ChartSettings>({
    chartType: 'candlestick',
    showVolume: true,
    showSMC: true,
    showOrderBlocks: true,
    showFVG: true,
    showLiquidityZones: true,
    showBOS: true,
    showGrid: true,
    showCrosshair: true,
    theme: 'light'
  });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMouseOver, setIsMouseOver] = useState(false);
  const [selectedCandle, setSelectedCandle] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (data.length > 0 && canvasRef.current) {
      drawChart();
    }
  }, [data, settings, zoom, pan, mousePos, selectedCandle]);

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

    // Apply theme
    const theme = getTheme();
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Calculate chart dimensions
    const padding = { top: 20, right: 80, bottom: settings.showVolume ? 120 : 40, left: 20 };
    const chartWidth = rect.width - padding.left - padding.right;
    const chartHeight = rect.height - padding.top - padding.bottom;
    const volumeHeight = settings.showVolume ? 60 : 0;
    const priceHeight = chartHeight - volumeHeight;

    // Calculate price range
    const visibleData = getVisibleData();
    if (!visibleData.length) return;

    const prices = visibleData.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const paddedRange = priceRange * 0.1; // 10% padding

    // Draw grid
    if (settings.showGrid) {
      drawGrid(ctx, rect.width, rect.height, padding, theme);
    }

    // Draw SMC overlays (behind price)
    if (settings.showSMC && smcData) {
      drawSMCOverlays(ctx, visibleData, smcData, padding, chartWidth, priceHeight, minPrice - paddedRange / 2, priceRange + paddedRange, theme);
    }

    // Draw main chart
    switch (settings.chartType) {
      case 'candlestick':
        drawCandlesticks(ctx, visibleData, padding, chartWidth, priceHeight, minPrice - paddedRange / 2, priceRange + paddedRange, theme);
        break;
      case 'line':
        drawLineChart(ctx, visibleData, padding, chartWidth, priceHeight, minPrice - paddedRange / 2, priceRange + paddedRange, theme);
        break;
      case 'area':
        drawAreaChart(ctx, visibleData, padding, chartWidth, priceHeight, minPrice - paddedRange / 2, priceRange + paddedRange, theme);
        break;
      case 'heikin-ashi':
        drawHeikinAshi(ctx, visibleData, padding, chartWidth, priceHeight, minPrice - paddedRange / 2, priceRange + paddedRange, theme);
        break;
    }

    // Draw volume
    if (settings.showVolume) {
      drawVolume(ctx, visibleData, padding, chartWidth, volumeHeight, priceHeight, theme);
    }

    // Draw price scale
    drawPriceScale(ctx, rect.width, rect.height, padding, minPrice - paddedRange / 2, maxPrice + paddedRange / 2, theme);

    // Draw time scale
    drawTimeScale(ctx, rect.width, rect.height, padding, visibleData, theme);

    // Draw crosshair
    if (settings.showCrosshair && isMouseOver) {
      drawCrosshair(ctx, rect.width, rect.height, mousePos, theme);
    }

    // Draw price info
    if (selectedCandle !== null && visibleData[selectedCandle]) {
      drawPriceInfo(ctx, visibleData[selectedCandle], theme);
    }
  };

  const getTheme = () => {
    if (settings.theme === 'dark') {
      return {
        background: '#1a1a1a',
        grid: '#333333',
        text: '#ffffff',
        textSecondary: '#cccccc',
        bullish: '#00ff88',
        bearish: '#ff4757',
        volume: '#666666',
        crosshair: '#888888',
        orderBlockBull: 'rgba(0, 255, 136, 0.2)',
        orderBlockBear: 'rgba(255, 71, 87, 0.2)',
        fvgBull: 'rgba(0, 255, 136, 0.1)',
        fvgBear: 'rgba(255, 71, 87, 0.1)',
        liquidityZone: 'rgba(255, 193, 7, 0.3)'
      };
    } else {
      return {
        background: '#ffffff',
        grid: '#e5e5e5',
        text: '#333333',
        textSecondary: '#666666',
        bullish: '#26a69a',
        bearish: '#ef5350',
        volume: '#9e9e9e',
        crosshair: '#757575',
        orderBlockBull: 'rgba(38, 166, 154, 0.2)',
        orderBlockBear: 'rgba(239, 83, 80, 0.2)',
        fvgBull: 'rgba(38, 166, 154, 0.1)',
        fvgBear: 'rgba(239, 83, 80, 0.1)',
        liquidityZone: 'rgba(255, 193, 7, 0.3)'
      };
    }
  };

  const getVisibleData = () => {
    const startIndex = Math.max(0, Math.floor(-pan.x / (zoom * 10)));
    const endIndex = Math.min(data.length, startIndex + Math.ceil(canvasRef.current!.width / (zoom * 10)));
    return data.slice(startIndex, endIndex);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, padding: any, theme: any) => {
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = padding.top + (i / 10) * (height - padding.top - padding.bottom);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (i / 10) * (width - padding.left - padding.right);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  const drawCandlesticks = (
    ctx: CanvasRenderingContext2D,
    visibleData: ChartData[],
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minPrice: number,
    priceRange: number,
    theme: any
  ) => {
    const candleWidth = (chartWidth / visibleData.length) * 0.8 * zoom;
    const candleSpacing = chartWidth / visibleData.length * zoom;

    visibleData.forEach((candle, index) => {
      const x = padding.left + pan.x + index * candleSpacing + candleSpacing / 2;
      const openY = padding.top + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = padding.top + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = padding.top + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = padding.top + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;

      const isBullish = candle.close > candle.open;
      const color = isBullish ? theme.bullish : theme.bearish;

      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      if (isBullish) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - candleWidth / 2, closeY, candleWidth, openY - closeY);
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, openY, candleWidth, closeY - openY);
      }

      // Highlight selected candle
      if (selectedCandle === index) {
        ctx.strokeStyle = theme.text;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - candleWidth / 2 - 2, Math.min(openY, closeY) - 2, candleWidth + 4, Math.abs(closeY - openY) + 4);
      }
    });
  };

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    visibleData: ChartData[],
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minPrice: number,
    priceRange: number,
    theme: any
  ) => {
    ctx.strokeStyle = theme.bullish;
    ctx.lineWidth = 2;
    ctx.beginPath();

    visibleData.forEach((point, index) => {
      const x = padding.left + pan.x + (index / (visibleData.length - 1)) * chartWidth * zoom;
      const y = padding.top + chartHeight - ((point.close - minPrice) / priceRange) * chartHeight;

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
    visibleData: ChartData[],
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minPrice: number,
    priceRange: number,
    theme: any
  ) => {
    // Create gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, theme.bullish + '40');
    gradient.addColorStop(1, theme.bullish + '10');

    ctx.fillStyle = gradient;
    ctx.beginPath();

    // Start from bottom left
    ctx.moveTo(padding.left + pan.x, padding.top + chartHeight);

    // Draw the line
    visibleData.forEach((point, index) => {
      const x = padding.left + pan.x + (index / (visibleData.length - 1)) * chartWidth * zoom;
      const y = padding.top + chartHeight - ((point.close - minPrice) / priceRange) * chartHeight;
      ctx.lineTo(x, y);
    });

    // Close the area
    ctx.lineTo(padding.left + pan.x + chartWidth * zoom, padding.top + chartHeight);
    ctx.closePath();
    ctx.fill();

    // Draw the line on top
    drawLineChart(ctx, visibleData, padding, chartWidth, chartHeight, minPrice, priceRange, theme);
  };

  const drawHeikinAshi = (
    ctx: CanvasRenderingContext2D,
    visibleData: ChartData[],
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minPrice: number,
    priceRange: number,
    theme: any
  ) => {
    // Convert to Heikin-Ashi
    const haData = visibleData.map((candle, index) => {
      if (index === 0) {
        return {
          open: (candle.open + candle.close) / 2,
          close: (candle.open + candle.high + candle.low + candle.close) / 4,
          high: candle.high,
          low: candle.low
        };
      } else {
        const prevHA = haData[index - 1];
        return {
          open: (prevHA.open + prevHA.close) / 2,
          close: (candle.open + candle.high + candle.low + candle.close) / 4,
          high: Math.max(candle.high, (prevHA.open + prevHA.close) / 2, (candle.open + candle.high + candle.low + candle.close) / 4),
          low: Math.min(candle.low, (prevHA.open + prevHA.close) / 2, (candle.open + candle.high + candle.low + candle.close) / 4)
        };
      }
    });

    const candleWidth = (chartWidth / visibleData.length) * 0.8 * zoom;
    const candleSpacing = chartWidth / visibleData.length * zoom;

    haData.forEach((candle, index) => {
      const x = padding.left + pan.x + index * candleSpacing + candleSpacing / 2;
      const openY = padding.top + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = padding.top + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = padding.top + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = padding.top + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;

      const isBullish = candle.close > candle.open;
      const color = isBullish ? theme.bullish : theme.bearish;

      // Draw wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Draw body
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, Math.min(openY, closeY), candleWidth, Math.abs(closeY - openY));
    });
  };

  const drawVolume = (
    ctx: CanvasRenderingContext2D,
    visibleData: ChartData[],
    padding: any,
    chartWidth: number,
    volumeHeight: number,
    priceHeight: number,
    theme: any
  ) => {
    const maxVolume = Math.max(...visibleData.map(d => d.volume));
    const barWidth = (chartWidth / visibleData.length) * 0.6 * zoom;
    const barSpacing = chartWidth / visibleData.length * zoom;
    const volumeTop = padding.top + priceHeight + 20;

    visibleData.forEach((bar, index) => {
      const x = padding.left + pan.x + index * barSpacing + barSpacing / 2;
      const barHeight = (bar.volume / maxVolume) * volumeHeight;
      const y = volumeTop + volumeHeight - barHeight;

      const isBullish = index > 0 ? bar.close > visibleData[index - 1].close : true;
      ctx.fillStyle = isBullish ? theme.bullish + '80' : theme.bearish + '80';
      ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
    });
  };

  const drawSMCOverlays = (
    ctx: CanvasRenderingContext2D,
    visibleData: ChartData[],
    smcData: SMCData,
    padding: any,
    chartWidth: number,
    chartHeight: number,
    minPrice: number,
    priceRange: number,
    theme: any
  ) => {
    // Draw Order Blocks
    if (settings.showOrderBlocks) {
      smcData.orderBlocks.forEach(block => {
        const x1 = padding.left + pan.x + (block.x1 / visibleData.length) * chartWidth * zoom;
        const x2 = padding.left + pan.x + (block.x2 / visibleData.length) * chartWidth * zoom;
        const y1 = padding.top + chartHeight - ((block.y1 - minPrice) / priceRange) * chartHeight;
        const y2 = padding.top + chartHeight - ((block.y2 - minPrice) / priceRange) * chartHeight;

        ctx.fillStyle = block.type === 'bullish' ? theme.orderBlockBull : theme.orderBlockBear;
        ctx.fillRect(x1, Math.min(y1, y2), x2 - x1, Math.abs(y2 - y1));

        // Border
        ctx.strokeStyle = block.type === 'bullish' ? theme.bullish : theme.bearish;
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, Math.min(y1, y2), x2 - x1, Math.abs(y2 - y1));
      });
    }

    // Draw Fair Value Gaps
    if (settings.showFVG) {
      smcData.fairValueGaps.forEach(fvg => {
        const x1 = padding.left + pan.x + (fvg.x1 / visibleData.length) * chartWidth * zoom;
        const x2 = padding.left + pan.x + (fvg.x2 / visibleData.length) * chartWidth * zoom;
        const y1 = padding.top + chartHeight - ((fvg.y1 - minPrice) / priceRange) * chartHeight;
        const y2 = padding.top + chartHeight - ((fvg.y2 - minPrice) / priceRange) * chartHeight;

        ctx.fillStyle = fvg.type === 'bullish' ? theme.fvgBull : theme.fvgBear;
        ctx.fillRect(x1, Math.min(y1, y2), x2 - x1, Math.abs(y2 - y1));

        // Dashed border if not filled
        if (!fvg.filled) {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = fvg.type === 'bullish' ? theme.bullish : theme.bearish;
          ctx.lineWidth = 1;
          ctx.strokeRect(x1, Math.min(y1, y2), x2 - x1, Math.abs(y2 - y1));
          ctx.setLineDash([]);
        }
      });
    }

    // Draw Liquidity Zones
    if (settings.showLiquidityZones) {
      smcData.liquidityZones.forEach(zone => {
        const y = padding.top + chartHeight - ((zone.y - minPrice) / priceRange) * chartHeight;
        
        ctx.strokeStyle = theme.liquidityZone;
        ctx.lineWidth = Math.max(1, zone.strength * 3);
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = theme.text;
        ctx.font = '12px system-ui';
        ctx.fillText(`${zone.type.toUpperCase()} (${zone.strength.toFixed(1)})`, padding.left + 5, y - 5);
      });
    }

    // Draw Break of Structure
    if (settings.showBOS) {
      smcData.breakOfStructure.forEach(bos => {
        const x = padding.left + pan.x + (bos.x / visibleData.length) * chartWidth * zoom;
        const y = padding.top + chartHeight - ((bos.y - minPrice) / priceRange) * chartHeight;

        // Draw arrow
        ctx.fillStyle = bos.type === 'bullish' ? theme.bullish : theme.bearish;
        ctx.beginPath();
        if (bos.type === 'bullish') {
          ctx.moveTo(x, y);
          ctx.lineTo(x - 8, y + 12);
          ctx.lineTo(x + 8, y + 12);
        } else {
          ctx.moveTo(x, y);
          ctx.lineTo(x - 8, y - 12);
          ctx.lineTo(x + 8, y - 12);
        }
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = theme.text;
        ctx.font = '10px system-ui';
        ctx.fillText('BOS', x - 10, y + (bos.type === 'bullish' ? 25 : -15));
      });
    }
  };

  const drawPriceScale = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    padding: any,
    minPrice: number,
    maxPrice: number,
    theme: any
  ) => {
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'left';

    const priceSteps = 8;
    for (let i = 0; i <= priceSteps; i++) {
      const price = minPrice + (i / priceSteps) * (maxPrice - minPrice);
      const y = padding.top + (height - padding.top - padding.bottom) - (i / priceSteps) * (height - padding.top - padding.bottom);
      
      ctx.fillText(price.toFixed(4), width - padding.right + 5, y + 4);
    }
  };

  const drawTimeScale = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    padding: any,
    visibleData: ChartData[],
    theme: any
  ) => {
    ctx.fillStyle = theme.textSecondary;
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';

    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
      const dataIndex = Math.floor((i / timeSteps) * (visibleData.length - 1));
      const x = padding.left + pan.x + (i / timeSteps) * (width - padding.left - padding.right) * zoom;
      
      if (visibleData[dataIndex]) {
        const time = new Date(visibleData[dataIndex].timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        ctx.fillText(time, x, height - padding.bottom + 15);
      }
    }
  };

  const drawCrosshair = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mousePos: { x: number; y: number },
    theme: any
  ) => {
    ctx.strokeStyle = theme.crosshair;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(mousePos.x, 0);
    ctx.lineTo(mousePos.x, height);
    ctx.stroke();

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(0, mousePos.y);
    ctx.lineTo(width, mousePos.y);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const drawPriceInfo = (ctx: CanvasRenderingContext2D, candle: ChartData, theme: any) => {
    const info = [
      `O: ${candle.open.toFixed(4)}`,
      `H: ${candle.high.toFixed(4)}`,
      `L: ${candle.low.toFixed(4)}`,
      `C: ${candle.close.toFixed(4)}`,
      `V: ${(candle.volume / 1e6).toFixed(2)}M`
    ];

    ctx.fillStyle = theme.background + 'E6';
    ctx.fillRect(10, 10, 200, 100);
    
    ctx.strokeStyle = theme.grid;
    ctx.strokeRect(10, 10, 200, 100);

    ctx.fillStyle = theme.text;
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';

    info.forEach((text, index) => {
      ctx.fillText(text, 20, 35 + index * 16);
    });
  };

  // Event handlers
  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMousePos({ x, y });

    // Find selected candle
    const visibleData = getVisibleData();
    const candleSpacing = (rect.width - 100) / visibleData.length * zoom;
    const candleIndex = Math.floor((x - 20 - pan.x) / candleSpacing);
    
    if (candleIndex >= 0 && candleIndex < visibleData.length) {
      setSelectedCandle(candleIndex);
    } else {
      setSelectedCandle(null);
    }

    if (isDragging) {
      setPan({
        x: pan.x + (x - dragStart.x),
        y: pan.y + (y - dragStart.y)
      });
      setDragStart({ x, y });
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * zoomFactor)));
  };

  const toggleSetting = (key: keyof ChartSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${symbol}_${timeframe}_advanced_chart.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`} ref={containerRef}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {symbol} • {timeframe}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Chart Type:</span>
            <select
              value={settings.chartType}
              onChange={(e) => setSettings(prev => ({ ...prev, chartType: e.target.value as any }))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="candlestick">Candlestick</option>
              <option value="line">Line</option>
              <option value="area">Area</option>
              <option value="heikin-ashi">Heikin-Ashi</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* SMC Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => toggleSetting('showSMC')}
              className={`p-1 rounded ${settings.showSMC ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="Smart Money Concepts"
            >
              <Target className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleSetting('showVolume')}
              className={`p-1 rounded ${settings.showVolume ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="Volume"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleSetting('showGrid')}
              className={`p-1 rounded ${settings.showGrid ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="Grid"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleSetting('showCrosshair')}
              className={`p-1 rounded ${settings.showCrosshair ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
              title="Crosshair"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setSettings(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Toggle Theme"
          >
            {settings.theme === 'light' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Export */}
          <button
            onClick={exportChart}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Export Chart"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-96 cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseEnter={() => setIsMouseOver(true)}
          onMouseLeave={() => setIsMouseOver(false)}
          onWheel={handleWheel}
        />

        {/* SMC Legend */}
        {settings.showSMC && (
          <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded p-2 text-xs">
            <div className="font-semibold mb-1">Smart Money Concepts</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-2 bg-green-400 opacity-50"></div>
                <span>Bullish Order Block</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-2 bg-red-400 opacity-50"></div>
                <span>Bearish Order Block</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-1 border-2 border-dashed border-yellow-500"></div>
                <span>Liquidity Zone</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">▲</span>
                <span>Bullish BOS</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Controls */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span>Data Points: {data.length}</span>
          {selectedCandle !== null && (
            <span>
              Time: {new Date(getVisibleData()[selectedCandle]?.timestamp).toLocaleString()}
            </span>
          )}
        </div>
        <div className="text-xs">
          Use mouse wheel to zoom • Click and drag to pan • Hover for details
        </div>
      </div>
    </div>
  );
};

export default TradingViewChart;

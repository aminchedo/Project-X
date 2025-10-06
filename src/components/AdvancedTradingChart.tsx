import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ProfessionalCard } from './Layout/ProfessionalLayout';

interface OHLCVData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AdvancedTradingChartProps {
  data: OHLCVData[];
  symbol: string;
  timeframe?: string;
  indicators?: string[];
  onTimeframeChange?: (timeframe: string) => void;
  onIndicatorToggle?: (indicator: string) => void;
  className?: string;
}

interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

const AdvancedTradingChart: React.FC<AdvancedTradingChartProps> = ({
  data,
  symbol,
  timeframe = '1h',
  indicators = [],
  onTimeframeChange,
  onIndicatorToggle,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: 800,
    height: 400,
    margin: { top: 20, right: 30, bottom: 60, left: 60 }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('');

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
  const availableIndicators = ['SMA', 'EMA', 'RSI', 'MACD', 'Bollinger', 'Volume'];

  // Calculate chart dimensions
  const chartWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
  const chartHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // Handle resize
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = isFullscreen ? window.innerHeight - 100 : 400;
      
      setDimensions(prev => ({
        ...prev,
        width: containerWidth,
        height: containerHeight
      }));
    }
  }, [isFullscreen]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Generate mock data if none provided
  const generateMockData = (count: number): OHLCVData[] => {
    const now = Date.now();
    const interval = 60 * 60 * 1000; // 1 hour
    let price = 50000;
    
    return Array.from({ length: count }, (_, i) => {
      const timestamp = now - (count - i) * interval;
      const change = (Math.random() - 0.5) * 1000;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 500;
      const low = Math.min(open, close) - Math.random() * 500;
      const volume = Math.random() * 1000000;
      
      price = close;
      
      return {
        timestamp,
        open,
        high,
        low,
        close,
        volume
      };
    });
  };

  const chartData = data.length > 0 ? data : generateMockData(100);

  // Calculate technical indicators
  const calculateSMA = (data: OHLCVData[], period: number): number[] => {
    const sma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  const calculateRSI = (data: OHLCVData[], period: number = 14): number[] => {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        rsi.push(NaN);
      } else {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return [NaN, ...rsi]; // Add NaN for first data point
  };

  // Render chart
  useEffect(() => {
    if (!svgRef.current || chartData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(chartData, d => new Date(d.timestamp)) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(chartData, d => [d.low, d.high]).flat() as [number, number])
      .range([chartHeight, 0]);

    const volumeScale = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.volume) || 0])
      .range([chartHeight * 0.2, 0]);

    // Create main chart group
    const chartGroup = svg.append('g')
      .attr('transform', `translate(${dimensions.margin.left}, ${dimensions.margin.top})`);

    // Add grid lines
    chartGroup.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-chartHeight)
        .tickFormat(() => '')
      )
      .style('stroke', '#374151')
      .style('opacity', 0.3);

    chartGroup.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat(() => '')
      )
      .style('stroke', '#374151')
      .style('opacity', 0.3);

    // Draw candlesticks
    const candlesticks = chartGroup.selectAll('.candlestick')
      .data(chartData)
      .enter()
      .append('g')
      .attr('class', 'candlestick')
      .attr('transform', d => `translate(${xScale(new Date(d.timestamp))}, 0)`);

    // High-Low lines
    candlesticks.append('line')
      .attr('class', 'hl-line')
      .attr('y1', d => yScale(d.high))
      .attr('y2', d => yScale(d.low))
      .style('stroke', d => d.close >= d.open ? '#10b981' : '#ef4444')
      .style('stroke-width', 1);

    // Open-Close rectangles
    candlesticks.append('rect')
      .attr('class', 'oc-rect')
      .attr('x', -2)
      .attr('y', d => yScale(Math.max(d.open, d.close)))
      .attr('width', 4)
      .attr('height', d => Math.abs(yScale(d.close) - yScale(d.open)))
      .style('fill', d => d.close >= d.open ? '#10b981' : '#ef4444')
      .style('stroke', d => d.close >= d.open ? '#10b981' : '#ef4444');

    // Add technical indicators
    if (indicators.includes('SMA')) {
      const sma20 = calculateSMA(chartData, 20);
      const smaLine = d3.line<{ timestamp: number; value: number }>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d.value))
        .defined(d => !isNaN(d.value));

      chartGroup.append('path')
        .datum(chartData.map((d, i) => ({ timestamp: d.timestamp, value: sma20[i] })))
        .attr('class', 'sma-line')
        .attr('d', smaLine)
        .style('fill', 'none')
        .style('stroke', '#3b82f6')
        .style('stroke-width', 2);
    }

    if (indicators.includes('RSI')) {
      const rsi = calculateRSI(chartData);
      const rsiScale = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight * 0.8, chartHeight * 0.2]);

      const rsiLine = d3.line<{ timestamp: number; value: number }>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => rsiScale(d.value))
        .defined(d => !isNaN(d.value));

      chartGroup.append('path')
        .datum(chartData.map((d, i) => ({ timestamp: d.timestamp, value: rsi[i] })))
        .attr('class', 'rsi-line')
        .attr('d', rsiLine)
        .style('fill', 'none')
        .style('stroke', '#f59e0b')
        .style('stroke-width', 2);

      // RSI overbought/oversold lines
      chartGroup.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', rsiScale(70))
        .attr('y2', rsiScale(70))
        .style('stroke', '#ef4444')
        .style('stroke-dasharray', '5,5')
        .style('opacity', 0.7);

      chartGroup.append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', rsiScale(30))
        .attr('y2', rsiScale(30))
        .style('stroke', '#10b981')
        .style('stroke-dasharray', '5,5')
        .style('opacity', 0.7);
    }

    // Add volume bars
    if (indicators.includes('Volume')) {
      chartGroup.selectAll('.volume-bar')
        .data(chartData)
        .enter()
        .append('rect')
        .attr('class', 'volume-bar')
        .attr('x', d => xScale(new Date(d.timestamp)) - 1)
        .attr('y', d => chartHeight - volumeScale(d.volume))
        .attr('width', 2)
        .attr('height', d => volumeScale(d.volume))
        .style('fill', d => d.close >= d.open ? '#10b981' : '#ef4444')
        .style('opacity', 0.3);
    }

    // Add axes
    chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%H:%M'))
      )
      .style('color', '#9ca3af');

    chartGroup.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisRight(yScale)
        .tickFormat(d3.format('.2f'))
      )
      .style('color', '#9ca3af');

    // Add crosshair
    const crosshair = chartGroup.append('g')
      .attr('class', 'crosshair')
      .style('display', 'none');

    crosshair.append('line')
      .attr('class', 'crosshair-x')
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .style('stroke', '#6b7280')
      .style('stroke-dasharray', '3,3');

    crosshair.append('line')
      .attr('class', 'crosshair-y')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .style('stroke', '#6b7280')
      .style('stroke-dasharray', '3,3');

    // Add mouse interaction
    const overlay = chartGroup.append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all');

    overlay
      .on('mouseover', () => crosshair.style('display', null))
      .on('mouseout', () => crosshair.style('display', 'none'))
      .on('mousemove', function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const x0 = xScale.invert(mouseX);
        const y0 = yScale.invert(mouseY);

        crosshair.select('.crosshair-x')
          .attr('x1', mouseX)
          .attr('x2', mouseX);

        crosshair.select('.crosshair-y')
          .attr('y1', mouseY)
          .attr('y2', mouseY);
      });

  }, [chartData, dimensions, indicators, chartWidth, chartHeight]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicator(indicator);
    if (onIndicatorToggle) {
      onIndicatorToggle(indicator);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900' : ''} ${className}`}
    >
      <ProfessionalCard 
        title={`${symbol} - Advanced Chart`}
        subtitle={`Timeframe: ${timeframe} | Indicators: ${indicators.join(', ') || 'None'}`}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-slate-700/50 rounded transition-colors"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        }
      >
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Timeframe:</span>
            <select
              value={timeframe}
              onChange={(e) => onTimeframeChange?.(e.target.value)}
              className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeframes.map(tf => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>

          {/* Indicator Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Indicators:</span>
            <select
              value={selectedIndicator}
              onChange={(e) => toggleIndicator(e.target.value)}
              className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Add Indicator</option>
              {availableIndicators.map(indicator => (
                <option key={indicator} value={indicator}>{indicator}</option>
              ))}
            </select>
          </div>

          {/* Current Price */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Price:</span>
            <span className="text-sm font-medium text-white">
              ${chartData[chartData.length - 1]?.close.toFixed(2) || '0.00'}
            </span>
            <span className={`text-xs ${chartData[chartData.length - 1]?.close >= chartData[chartData.length - 1]?.open ? 'text-green-400' : 'text-red-400'}`}>
              {chartData[chartData.length - 1]?.close >= chartData[chartData.length - 1]?.open ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-400">Bullish</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-400">Bearish</span>
          </div>
          {indicators.includes('SMA') && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-slate-400">SMA(20)</span>
            </div>
          )}
          {indicators.includes('RSI') && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-yellow-500"></div>
              <span className="text-slate-400">RSI(14)</span>
            </div>
          )}
        </div>
      </ProfessionalCard>
    </div>
  );
};

export default AdvancedTradingChart;

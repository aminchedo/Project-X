import React, { useEffect, useRef, useState } from 'react';
import { OHLCVData } from '../types';
import { BarChart3, Activity } from 'lucide-react';

interface TradingChartProps {
  symbol: string;
  data: OHLCVData[];
  indicators?: any;
}

const TradingChart: React.FC<TradingChartProps> = ({ symbol, data, indicators }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    if (data.length > 0) {
      drawChart();
    }
  }, [data, chartDimensions]);

  useEffect(() => {
    const handleResize = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        setChartDimensions({
          width: container.clientWidth - 32,
          height: 400
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = chartDimensions.width;
    canvas.height = chartDimensions.height;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chart settings
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Calculate price range
    const prices = data.flatMap(d => [d.open, d.high, d.low, d.close]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Helper functions
    const getX = (index: number) => padding + (index * chartWidth) / (data.length - 1);
    const getY = (price: number) => padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 0.5;
    
    // Horizontal lines (price levels)
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceRange * i) / 5;
      const y = getY(price);
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
      
      // Price labels
      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), padding - 10, y + 4);
    }

    // Vertical lines (time)
    const timeInterval = Math.max(1, Math.floor(data.length / 8));
    for (let i = 0; i < data.length; i += timeInterval) {
      const x = getX(i);
      
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
      
      // Time labels
      const timeStr = data[i].timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, canvas.height - padding + 20);
    }

    // Draw candlesticks
    data.forEach((candle, index) => {
      const x = getX(index);
      const openY = getY(candle.open);
      const highY = getY(candle.high);
      const lowY = getY(candle.low);
      const closeY = getY(candle.close);

      const isBullish = candle.close > candle.open;
      const candleWidth = Math.max(1, chartWidth / data.length * 0.7);

      // Wick
      ctx.strokeStyle = isBullish ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = isBullish ? '#10b981' : '#ef4444';
      const bodyHeight = Math.abs(closeY - openY);
      const bodyY = Math.min(openY, closeY);
      
      ctx.fillRect(x - candleWidth / 2, bodyY, candleWidth, bodyHeight || 1);
    });

    // Draw moving averages if available
    if (indicators?.ema_20) {
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      indicators.ema_20.forEach((price: number, index: number) => {
        const x = getX(index);
        const y = getY(price);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw current price line
    const currentPrice = data[data.length - 1].close;
    const currentY = getY(currentPrice);
    
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, currentY);
    ctx.lineTo(canvas.width - padding, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price label
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(canvas.width - padding + 5, currentY - 10, 80, 20);
    ctx.fillStyle = '#0f172a';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentPrice.toFixed(2), canvas.width - padding + 45, currentY + 4);
  };

  return (
    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">{symbol} Chart</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Activity className="w-4 h-4" />
          <span>{data.length} candles</span>
        </div>
      </div>
      
      <div className="p-4">
        <canvas 
          ref={canvasRef}
          className="w-full border border-slate-700/30 rounded-lg"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
};

export default TradingChart;
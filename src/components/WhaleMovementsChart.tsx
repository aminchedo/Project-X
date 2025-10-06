import React, { useRef, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface WhaleMovement {
  timestamp: number;
  amount: number;
  type: 'buy' | 'sell';
  price: number;
  symbol: string;
}

interface WhaleMovementsChartProps {
  symbol: string;
  height?: number;
  className?: string;
}

export const WhaleMovementsChart: React.FC<WhaleMovementsChartProps> = ({
  symbol,
  height = 200,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [whaleData, setWhaleData] = useState<WhaleMovement[]>([]);

  // Generate mock whale movement data
  useEffect(() => {
    const generateWhaleData = () => {
      const data: WhaleMovement[] = [];
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      for (let i = 0; i < 50; i++) {
        const timestamp = now - (Math.random() * oneDay);
        const amount = Math.random() * 1000 + 100; // 100-1100 BTC
        const type = Math.random() > 0.5 ? 'buy' : 'sell';
        const price = 45000 + Math.random() * 10000; // Mock price
        
        data.push({
          timestamp,
          amount,
          type,
          price,
          symbol
        });
      }
      
      setWhaleData(data.sort((a, b) => a.timestamp - b.timestamp));
    };

    generateWhaleData();
    const interval = setInterval(generateWhaleData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [symbol]);

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
    if (!whaleData.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up chart area
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw background grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    if (whaleData.length === 0) return;

    // Calculate scales
    const minTime = Math.min(...whaleData.map(d => d.timestamp));
    const maxTime = Math.max(...whaleData.map(d => d.timestamp));
    const minAmount = Math.min(...whaleData.map(d => d.amount));
    const maxAmount = Math.max(...whaleData.map(d => d.amount));

    // Draw whale movements as points
    whaleData.forEach((movement, index) => {
      const x = padding + ((movement.timestamp - minTime) / (maxTime - minTime)) * chartWidth;
      const y = padding + chartHeight - ((movement.amount - minAmount) / (maxAmount - minAmount)) * chartHeight;

      // Color based on movement type
      const color = movement.type === 'buy' ? '#10b981' : '#ef4444';
      const glowColor = movement.type === 'buy' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';

      // Draw glow effect
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw main point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Draw trend line
    if (whaleData.length > 1) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      whaleData.forEach((movement, index) => {
        const x = padding + ((movement.timestamp - minTime) / (maxTime - minTime)) * chartWidth;
        const y = padding + chartHeight - ((movement.amount - minAmount) / (maxAmount - minAmount)) * chartHeight;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Amount (BTC)', padding, padding - 10);
    
    ctx.textAlign = 'right';
    ctx.fillText('Time', width - padding, height - padding + 20);

  }, [whaleData, dimensions, symbol]);

  const buyMovements = whaleData.filter(d => d.type === 'buy').length;
  const sellMovements = whaleData.filter(d => d.type === 'sell').length;
  const totalVolume = whaleData.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className={`${className}`}>
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-white">Whale Movements - {symbol}</h4>
          <p className="text-xs text-slate-400">Large transactions in the last 24h</p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-slate-400">Buy: {buyMovements}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-slate-400">Sell: {sellMovements}</span>
          </div>
          <div className="text-slate-400">
            Vol: {totalVolume.toFixed(0)} BTC
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg bg-slate-800/30 border border-slate-700/50"
          style={{ height: `${height}px` }}
        />
        
        {/* Chart overlay info */}
        <div className="absolute top-2 right-2 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-700/50">
          <div className="text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Active Whales</span>
            </div>
            <div className="text-slate-400 mt-1">
              {whaleData.length} transactions
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            <span className="text-slate-400">Buy Orders</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-slate-400">Sell Orders</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-cyan-400"></div>
            <span className="text-slate-400">Trend Line</span>
          </div>
        </div>
        <div className="text-slate-500">
          Updated {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default WhaleMovementsChart;

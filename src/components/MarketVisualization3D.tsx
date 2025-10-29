import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Box, RefreshCw, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';

interface MarketData {
  symbol: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
}

interface MarketVisualization3DProps {
  symbols?: string[];
}

const MarketVisualization3D: React.FC<MarketVisualization3DProps> = ({ 
  symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK']
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      startAnimation();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, rotation]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.crypto.getMarketOverview();
      setData(response.slice(0, symbols.length));
    } catch (err) {
      setError('Failed to load market data');
      console.error('Market data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Draw 3D visualization (simplified without Three.js)
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Auto-rotation
    setRotation(prev => ({
      x: prev.x + 0.002,
      y: prev.y + 0.001
    }));

    // Draw bubbles for each crypto
    data.forEach((item, index) => {
      const angle = (index / data.length) * Math.PI * 2 + rotation.y;
      const elevationAngle = Math.sin(rotation.x) * 0.5;
      
      // 3D position
      const x = centerX + Math.cos(angle) * radius * Math.cos(elevationAngle);
      const y = centerY + Math.sin(angle) * radius * Math.cos(elevationAngle) + Math.sin(rotation.x) * 50;
      const z = Math.sin(elevationAngle) * radius;
      
      // Size based on market cap (depth illusion)
      const baseSize = Math.sqrt(item.market_cap / 1000000000) * 10;
      const size = baseSize * (1 + z / radius * 0.5);
      
      // Color based on 24h change
      const color = item.change_24h >= 0 
        ? `rgba(74, 222, 128, ${0.6 + z / radius * 0.4})` 
        : `rgba(248, 113, 113, ${0.6 + z / radius * 0.4})`;
      
      // Draw bubble
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = item.change_24h >= 0 ? '#4ade80' : '#f87171';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw symbol
      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${Math.max(12, size / 3)}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.symbol, x, y);
      
      // Draw change percentage
      ctx.font = `${Math.max(10, size / 4)}px Inter`;
      ctx.fillText(
        `${item.change_24h >= 0 ? '+' : ''}${item.change_24h.toFixed(2)}%`,
        x,
        y + size / 2 + 15
      );
    });

    // Draw connecting lines
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 1;
    data.forEach((item, i) => {
      if (i < data.length - 1) {
        const angle1 = (i / data.length) * Math.PI * 2 + rotation.y;
        const angle2 = ((i + 1) / data.length) * Math.PI * 2 + rotation.y;
        const elevationAngle = Math.sin(rotation.x) * 0.5;
        
        const x1 = centerX + Math.cos(angle1) * radius * Math.cos(elevationAngle);
        const y1 = centerY + Math.sin(angle1) * radius * Math.cos(elevationAngle);
        const x2 = centerX + Math.cos(angle2) * radius * Math.cos(elevationAngle);
        const y2 = centerY + Math.sin(angle2) * radius * Math.cos(elevationAngle);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    animationRef.current = requestAnimationFrame(startAnimation);
  };

  const handleCanvasResize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = isFullscreen ? window.innerHeight : 600;
  };

  useEffect(() => {
    handleCanvasResize();
    window.addEventListener('resize', handleCanvasResize);
    return () => window.removeEventListener('resize', handleCanvasResize);
  }, [isFullscreen]);

  if (loading && data.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading 3D visualization...</p>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchMarketData}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6' : ''}`}>
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
            <Box className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">3D Market Visualization</h2>
            <p className="text-sm text-slate-400">Interactive real-time market overview</p>
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={() => setIsFullscreen(!isFullscreen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </motion.button>

          <motion.button
            onClick={fetchMarketData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Canvas */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <canvas
          ref={canvasRef}
          className="w-full cursor-move"
          onMouseMove={(e) => {
            if (e.buttons === 1) {
              setRotation(prev => ({
                x: prev.x + e.movementY * 0.01,
                y: prev.y + e.movementX * 0.01
              }));
            }
          }}
        />
      </motion.div>

      {/* Legend */}
      {!isFullscreen && (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-slate-50 mb-4">How to Use</h3>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>• <strong>Bubble size:</strong> Represents market capitalization</li>
            <li>• <strong>Green bubbles:</strong> Positive 24h price change</li>
            <li>• <strong>Red bubbles:</strong> Negative 24h price change</li>
            <li>• <strong>Click and drag:</strong> Rotate the visualization</li>
            <li>• <strong>Auto-rotation:</strong> Enabled by default for better viewing</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default MarketVisualization3D;

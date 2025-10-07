import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { realtimeWs } from '../services/websocket';
import { api } from '../services/api';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PricePoint {
  timestamp: number;
  price: number;
}

interface RealTimeChartProps {
  symbol?: string;
  maxDataPoints?: number;
  updateInterval?: number;
  height?: number;
}

const RealTimeChart: React.FC<RealTimeChartProps> = ({
  symbol = 'BTCUSDT',
  maxDataPoints = 60,
  updateInterval = 1000,
  height = 400
}) => {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [high24h, setHigh24h] = useState<number>(0);
  const [low24h, setLow24h] = useState<number>(0);

  useEffect(() => {
    fetchInitialData();
    connectWebSocket();

    return () => {
      realtimeWs.disconnect();
    };
  }, [symbol]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.crypto.getCurrentPrice(symbol);
      const initialPrice = response.price;
      
      // Initialize with some data points
      const now = Date.now();
      const initial = Array.from({ length: 30 }, (_, i) => ({
        timestamp: now - (30 - i) * updateInterval,
        price: initialPrice + (Math.random() - 0.5) * initialPrice * 0.001
      }));
      
      setPriceData(initial);
      setCurrentPrice(initialPrice);
      setHigh24h(response.high_24h || initialPrice);
      setLow24h(response.low_24h || initialPrice);
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Initial data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    realtimeWs.connect();
    
    realtimeWs.onStateChange((state) => {
      setIsConnected(state === 'connected');
    });

    realtimeWs.onMessage((event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'price' && message.symbol === symbol) {
          const newPrice = message.price;
          const now = Date.now();
          
          setPriceData(prev => {
            const updated = [...prev, { timestamp: now, price: newPrice }];
            return updated.slice(-maxDataPoints);
          });
          
          setCurrentPrice(prev => {
            if (prev) {
              setPriceChange(((newPrice - prev) / prev) * 100);
            }
            return newPrice;
          });

          setHigh24h(prev => Math.max(prev, newPrice));
          setLow24h(prev => prev === 0 ? newPrice : Math.min(prev, newPrice));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  if (loading) {
    return (
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Connecting to live feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-8">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <p className="text-slate-50 mb-4">{error}</p>
          <button 
            onClick={fetchInitialData}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: priceData.map(p => new Date(p.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })),
    datasets: [
      {
        label: symbol,
        data: priceData.map(p => p.price),
        borderColor: priceChange >= 0 ? '#4ade80' : '#f87171',
        backgroundColor: priceChange >= 0 
          ? 'rgba(74, 222, 128, 0.1)' 
          : 'rgba(248, 113, 113, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context) => `$${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        display: true,
        ticks: { 
          color: '#94a3b8',
          font: { family: 'Inter', size: 9 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        },
        grid: { display: false }
      },
      y: {
        position: 'right',
        ticks: { 
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          callback: (value) => '$' + value.toLocaleString()
        },
        grid: { color: 'rgba(51, 65, 85, 0.2)' }
      }
    }
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6' : ''}`}>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-slate-50">{symbol}</h3>
              <div className={`flex items-center gap-2 px-2 py-1 rounded ${
                isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-xs font-semibold">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
              </div>
            </div>
          </div>

          {currentPrice && (
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-50">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)}%
              </div>
            </div>
          )}
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
            onClick={fetchInitialData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ height: isFullscreen ? 'calc(100vh - 300px)' : height }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Stats */}
      {!isFullscreen && (
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">24h High</div>
            <div className="text-lg font-bold text-green-400">${high24h.toFixed(2)}</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">24h Low</div>
            <div className="text-lg font-bold text-red-400">${low24h.toFixed(2)}</div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">Data Points</div>
            <div className="text-lg font-bold text-cyan-400">{priceData.length}/{maxDataPoints}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RealTimeChart;

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';
import { realtimeWs } from '../services/websocket';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Maximize2,
  AlertCircle,
  Crosshair
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

interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  symbol?: string;
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  height?: number;
  showVolume?: boolean;
  showIndicators?: boolean;
  onCrosshairMove?: (price: number, time: number) => void;
}

const TradingChart: React.FC<TradingChartProps> = ({
  symbol = 'BTCUSDT',
  timeframe = '1h',
  height = 400,
  showVolume = true,
  showIndicators = true,
  onCrosshairMove
}) => {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    fetchChartData();
    connectWebSocket();

    const interval = setInterval(fetchChartData, 60000); // Refresh every minute
    return () => {
      clearInterval(interval);
      realtimeWs.disconnect();
    };
  }, [symbol, timeframe]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.crypto.getCandlesticks(symbol, timeframe);
      setData(response);
      
      if (response.length > 0) {
        const latest = response[response.length - 1];
        const previous = response[response.length - 2];
        setCurrentPrice(latest.close);
        if (previous) {
          const change = ((latest.close - previous.close) / previous.close) * 100;
          setPriceChange(change);
        }
      }
    } catch (err) {
      setError('Failed to load chart data');
      console.error('Chart data error:', err);
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
          setCurrentPrice(message.price);
          
          // Update the last candle
          setData(prevData => {
            if (prevData.length === 0) return prevData;
            const newData = [...prevData];
            const lastCandle = { ...newData[newData.length - 1] };
            lastCandle.close = message.price;
            lastCandle.high = Math.max(lastCandle.high, message.price);
            lastCandle.low = Math.min(lastCandle.low, message.price);
            newData[newData.length - 1] = lastCandle;
            return newData;
          });
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  if (loading && data.length === 0) {
    return (
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-8">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <p className="text-slate-50 mb-4">{error}</p>
          <button 
            onClick={fetchChartData}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })),
    datasets: [
      {
        label: symbol,
        data: data.map(d => d.close),
        borderColor: priceChange >= 0 ? '#4ade80' : '#f87171',
        backgroundColor: priceChange >= 0 
          ? 'rgba(74, 222, 128, 0.1)' 
          : 'rgba(248, 113, 113, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: priceChange >= 0 ? '#4ade80' : '#f87171',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return data[context[0].dataIndex] 
              ? new Date(data[context[0].dataIndex].timestamp).toLocaleString()
              : '';
          },
          label: function(context) {
            const candle = data[context.dataIndex];
            if (!candle) return '';
            return [
              `Open: $${candle.open.toFixed(2)}`,
              `High: $${candle.high.toFixed(2)}`,
              `Low: $${candle.low.toFixed(2)}`,
              `Close: $${candle.close.toFixed(2)}`,
              `Volume: ${candle.volume.toLocaleString()}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { 
          color: '#94a3b8',
          font: { family: 'Inter', size: 10 },
          maxRotation: 0
        },
        grid: { color: 'rgba(51, 65, 85, 0.2)' }
      },
      y: {
        position: 'right',
        ticks: { 
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          callback: (value) => '$' + value.toLocaleString()
        },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
      }
    },
    onHover: (event, elements) => {
      if (elements.length > 0 && onCrosshairMove) {
        const index = elements[0].index;
        const candle = data[index];
        if (candle) {
          onCrosshairMove(candle.close, candle.timestamp);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-50">{symbol}</h3>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-xs text-slate-400">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
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
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => window.location.href = `?timeframe=${tf}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                timeframe === tf
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tf}
            </button>
          ))}
          
          <motion.button
            onClick={fetchChartData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
        <div style={{ height }}>
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Stats */}
      {data.length > 0 && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">24h High</div>
            <div className="text-lg font-bold text-green-400">
              ${Math.max(...data.map(d => d.high)).toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">24h Low</div>
            <div className="text-lg font-bold text-red-400">
              ${Math.min(...data.map(d => d.low)).toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">Volume</div>
            <div className="text-lg font-bold text-cyan-400">
              {data.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4">
            <div className="text-xs text-slate-400 mb-1">24h Change</div>
            <div className={`text-lg font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TradingChart;

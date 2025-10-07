import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';
import { realtimeTradingWs } from '../services/websocket';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Layers,
  AlertCircle,
  Eye,
  EyeOff
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

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Indicators {
  sma_20: number[];
  sma_50: number[];
  ema_12: number[];
  ema_26: number[];
  rsi: number[];
  macd: number[];
  signal: number[];
  bb_upper: number[];
  bb_lower: number[];
  bb_middle: number[];
}

interface AdvancedTradingChartProps {
  symbol?: string;
  timeframe?: string;
  height?: number;
}

const AdvancedTradingChart: React.FC<AdvancedTradingChartProps> = ({
  symbol = 'BTCUSDT',
  timeframe = '1h',
  height = 500
}) => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [indicators, setIndicators] = useState<Indicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [visibleIndicators, setVisibleIndicators] = useState<string[]>(['sma_20', 'sma_50']);

  useEffect(() => {
    fetchChartData();
    connectWebSocket();

    const interval = setInterval(fetchChartData, 60000);
    return () => {
      clearInterval(interval);
      realtimeTradingWs.disconnect();
    };
  }, [symbol, timeframe]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.crypto.getCandlesticks(symbol, timeframe);
      setCandles(response.candles || []);
      setIndicators(response.indicators || null);
    } catch (err) {
      setError('Failed to load chart data');
      console.error('Chart data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    realtimeTradingWs.connect();
    
    realtimeTradingWs.onStateChange((state) => {
      setIsConnected(state === 'connected');
    });

    realtimeTradingWs.onMessage((event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'candle' && message.symbol === symbol) {
          setCandles(prev => {
            const newCandles = [...prev];
            newCandles[newCandles.length - 1] = message.data;
            return newCandles;
          });
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  const toggleIndicator = (indicator: string) => {
    setVisibleIndicators(prev =>
      prev.includes(indicator)
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  if (loading && candles.length === 0) {
    return (
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading advanced chart...</p>
        </div>
      </div>
    );
  }

  if (error && candles.length === 0) {
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

  const chartData = {
    labels: candles.map(c => new Date(c.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })),
    datasets: [
      // Price Line
      {
        label: symbol,
        data: candles.map(c => c.close),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      // SMA 20
      ...(visibleIndicators.includes('sma_20') && indicators?.sma_20 ? [{
        label: 'SMA 20',
        data: indicators.sma_20,
        borderColor: '#fbbf24',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      }] : []),
      // SMA 50
      ...(visibleIndicators.includes('sma_50') && indicators?.sma_50 ? [{
        label: 'SMA 50',
        data: indicators.sma_50,
        borderColor: '#f97316',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      }] : []),
      // Bollinger Bands
      ...(visibleIndicators.includes('bb') && indicators?.bb_upper ? [
        {
          label: 'BB Upper',
          data: indicators.bb_upper,
          borderColor: 'rgba(139, 92, 246, 0.5)',
          borderWidth: 1,
          pointRadius: 0,
          fill: false,
          borderDash: [5, 5],
        },
        {
          label: 'BB Lower',
          data: indicators.bb_lower,
          borderColor: 'rgba(139, 92, 246, 0.5)',
          borderWidth: 1,
          pointRadius: 0,
          fill: '-1',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderDash: [5, 5],
        }
      ] : []),
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
      legend: {
        position: 'top',
        labels: {
          color: '#f8fafc',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
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
    }
  };

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;
  const priceChange = candles.length > 1 
    ? ((currentPrice - candles[candles.length - 2].close) / candles[candles.length - 2].close) * 100
    : 0;

  const indicatorOptions = [
    { key: 'sma_20', label: 'SMA 20', color: 'text-yellow-400' },
    { key: 'sma_50', label: 'SMA 50', color: 'text-orange-400' },
    { key: 'bb', label: 'Bollinger Bands', color: 'text-purple-400' },
  ];

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

          {currentPrice > 0 && (
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-50">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

        {/* Indicator Toggles */}
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-slate-400" />
          {indicatorOptions.map((ind) => (
            <motion.button
              key={ind.key}
              onClick={() => toggleIndicator(ind.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                visibleIndicators.includes(ind.key)
                  ? `bg-${ind.color.split('-')[1]}-500/20 border border-${ind.color.split('-')[1]}-500/30 ${ind.color}`
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {visibleIndicators.includes(ind.key) ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="hidden sm:inline">{ind.label}</span>
            </motion.button>
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
          <Line data={chartData} options={chartOptions} />
        </div>
      </motion.div>
    </div>
  );
};

export default AdvancedTradingChart;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import { realtimeTradingWs } from '../services/websocket';
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OrderBookLevel {
  price: number;
  amount: number;
  total: number;
}

interface MarketDepthData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  mid_price: number;
  timestamp: string;
}

interface MarketDepthChartProps {
  symbol?: string;
  depth?: number;
}

const MarketDepthChart: React.FC<MarketDepthChartProps> = ({ 
  symbol = 'BTCUSDT',
  depth = 20
}) => {
  const [data, setData] = useState<MarketDepthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchMarketDepth();
    connectWebSocket();

    const interval = setInterval(fetchMarketDepth, 5000);
    return () => {
      clearInterval(interval);
      realtimeTradingWs.disconnect();
    };
  }, [symbol]);

  const fetchMarketDepth = async () => {
    try {
      setLoading(true);
      setError(null);
      if (api && api.trading && api.trading.getMarketDepth) {
        const response = await api.trading.getMarketDepth(symbol);
        setData(response);
      } else {
        // Use mock data if API is not available
        console.warn('API not available, using mock market depth data');
        setData({
          timestamp: new Date().toISOString(),
          bids: Array.from({ length: 20 }, (_, i) => {
            const amount = Math.random() * 100;
            return {
              price: 50000 - i * 10,
              amount: amount,
              total: (50000 - i * 10) * amount
            };
          }),
          asks: Array.from({ length: 20 }, (_, i) => {
            const amount = Math.random() * 100;
            return {
              price: 50000 + i * 10,
              amount: amount,
              total: (50000 + i * 10) * amount
            };
          }),
          spread: 20,
          mid_price: 50000
        });
      }
    } catch (err) {
      setError('Failed to load market depth');
      console.error('Market depth error:', err);
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
        if (message.type === 'orderbook' && message.symbol === symbol) {
          setData(message.data);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  if (loading && !data) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading market depth...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchMarketDepth}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400 mb-2">No Market Depth Data</p>
        <p className="text-slate-500 text-sm">Data will appear when available</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: [
      ...data.bids.slice(0, depth).reverse().map(b => b.price.toFixed(2)),
      ...data.asks.slice(0, depth).map(a => a.price.toFixed(2))
    ],
    datasets: [
      {
        label: 'Bids',
        data: [
          ...data.bids.slice(0, depth).reverse().map(b => b.total),
          ...new Array(depth).fill(0)
        ],
        backgroundColor: 'rgba(74, 222, 128, 0.5)',
        borderColor: 'rgba(74, 222, 128, 1)',
        borderWidth: 1,
      },
      {
        label: 'Asks',
        data: [
          ...new Array(depth).fill(0),
          ...data.asks.slice(0, depth).map(a => a.total)
        ],
        backgroundColor: 'rgba(248, 113, 113, 0.5)',
        borderColor: 'rgba(248, 113, 113, 1)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f8fafc',
          font: { family: 'Inter', size: 12, weight: 600 },
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `Total: ${context.parsed.y.toFixed(4)}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 10 },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)'
        }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 }
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)'
        }
      }
    }
  };

  const spreadPercentage = ((data.spread / data.mid_price) * 100).toFixed(4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Market Depth - {symbol}</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <p className="text-sm text-slate-400">
              {isConnected ? 'Real-time order book' : 'Disconnected'}
            </p>
          </div>
        </div>
        <motion.button
          onClick={fetchMarketDepth}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">Mid Price</span>
            <TrendingUp className="text-cyan-400" size={18} />
          </div>
          <p className="text-3xl font-bold text-slate-50">
            ${data.mid_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">Spread</span>
            <TrendingDown className="text-orange-400" size={18} />
          </div>
          <p className="text-3xl font-bold text-orange-400">
            ${data.spread.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{spreadPercentage}%</p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">Total Volume</span>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-lg font-bold text-green-400">
                {data.bids.reduce((sum, b) => sum + b.total, 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">Bids</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400">
                {data.asks.reduce((sum, a) => sum + a.total, 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">Asks</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold text-slate-50 mb-6">Order Book Depth</h3>
        <div className="h-[400px]">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </motion.div>
    </div>
  );
};

export default MarketDepthChart;

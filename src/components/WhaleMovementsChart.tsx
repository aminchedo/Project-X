import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Scatter, Bar } from 'react-chartjs-2';
import { api } from '../services/api';
import { realtimeTradingWs } from '../services/websocket';
import {
  Waves,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Activity,
  DollarSign
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WhaleMovement {
  timestamp: string;
  symbol: string;
  type: 'buy' | 'sell';
  amount: number;
  value_usd: number;
  exchange: string;
}

interface WhaleMovementsChartProps {
  symbol?: string;
  timeframe?: '1h' | '24h' | '7d' | '30d';
}

const WhaleMovementsChart: React.FC<WhaleMovementsChartProps> = ({ 
  symbol = 'BTC',
  timeframe = '24h'
}) => {
  const [movements, setMovements] = useState<WhaleMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chartType, setChartType] = useState<'scatter' | 'bar'>('scatter');

  useEffect(() => {
    fetchWhaleMovements();
    connectWebSocket();

    const interval = setInterval(fetchWhaleMovements, 60000); // Every 60 seconds (reduced frequency)
    return () => {
      clearInterval(interval);
      realtimeTradingWs.disconnect();
    };
  }, [symbol, timeframe]);

  const fetchWhaleMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.analytics.getWhaleMovements({ symbol, timeframe });
      setMovements(response || []);
    } catch (err) {
      setError('Failed to load whale movements');
      console.error('Whale movements error:', err);
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
        if (message.type === 'whale_movement' && message.data.symbol === symbol) {
          setMovements(prev => [message.data, ...prev].slice(0, 100));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  if (loading && movements.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading whale movements...</p>
      </div>
    );
  }

  if (error && movements.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchWhaleMovements}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Prepare scatter chart data
  const scatterData = {
    datasets: [
      {
        label: 'Buy',
        data: movements
          .filter(m => m.type === 'buy')
          .map((m, i) => ({
            x: new Date(m.timestamp).getTime(),
            y: m.value_usd / 1000,
          })),
        backgroundColor: 'rgba(74, 222, 128, 0.6)',
        borderColor: 'rgba(74, 222, 128, 1)',
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Sell',
        data: movements
          .filter(m => m.type === 'sell')
          .map((m, i) => ({
            x: new Date(m.timestamp).getTime(),
            y: m.value_usd / 1000,
          })),
        backgroundColor: 'rgba(248, 113, 113, 0.6)',
        borderColor: 'rgba(248, 113, 113, 1)',
        pointRadius: 6,
        pointHoverRadius: 8,
      }
    ]
  };

  // Prepare bar chart data (aggregated by hour)
  const aggregateByHour = () => {
    const hourly: { [key: string]: { buy: number; sell: number } } = {};
    movements.forEach(m => {
      const hour = new Date(m.timestamp).toISOString().slice(0, 13);
      if (!hourly[hour]) hourly[hour] = { buy: 0, sell: 0 };
      hourly[hour][m.type] += m.value_usd / 1000000;
    });
    return hourly;
  };

  const hourlyData = aggregateByHour();
  const barData = {
    labels: Object.keys(hourlyData).map(h => new Date(h).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Buy Volume ($M)',
        data: Object.values(hourlyData).map(h => h.buy),
        backgroundColor: 'rgba(74, 222, 128, 0.6)',
        borderColor: 'rgba(74, 222, 128, 1)',
        borderWidth: 1,
      },
      {
        label: 'Sell Volume ($M)',
        data: Object.values(hourlyData).map(h => h.sell),
        backgroundColor: 'rgba(248, 113, 113, 0.6)',
        borderColor: 'rgba(248, 113, 113, 1)',
        borderWidth: 1,
      }
    ]
  };

  const scatterOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f8fafc',
          font: { family: 'Inter', size: 12, weight: 600 }
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
          label: (context) => `$${context.parsed.y.toFixed(0)}K`
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 10 },
          callback: (value) => new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          callback: (value) => `$${value}K`
        },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
      }
    }
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f8fafc',
          font: { family: 'Inter', size: 12, weight: 600 }
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
        stacked: false,
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          callback: (value) => `$${value}M`
        },
        grid: { color: 'rgba(51, 65, 85, 0.3)' }
      }
    }
  };

  const totalBuy = movements.filter(m => m.type === 'buy').reduce((sum, m) => sum + m.value_usd, 0);
  const totalSell = movements.filter(m => m.type === 'sell').reduce((sum, m) => sum + m.value_usd, 0);
  const netFlow = totalBuy - totalSell;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Whale Movements - {symbol}</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <p className="text-sm text-slate-400">
                {isConnected ? 'Real-time updates' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Chart Type Toggle */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setChartType('scatter')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                chartType === 'scatter'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Scatter
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                chartType === 'bar'
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Bar
            </button>
          </div>

          <motion.button
            onClick={fetchWhaleMovements}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">Total Buy</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            ${(totalBuy / 1000000).toFixed(2)}M
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-sm text-slate-400">Total Sell</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            ${(totalSell / 1000000).toFixed(2)}M
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-slate-400">Net Flow</span>
          </div>
          <p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netFlow >= 0 ? '+' : ''}${(netFlow / 1000000).toFixed(2)}M
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-slate-400">Transactions</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">{movements.length}</p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-slate-50 mb-6">
          {chartType === 'scatter' ? 'Individual Transactions' : 'Aggregated Volume'}
        </h3>
        <div className="h-[400px]">
          {chartType === 'scatter' ? (
            <Scatter data={scatterData} options={scatterOptions} />
          ) : (
            <Bar data={barData} options={barOptions} />
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WhaleMovementsChart;

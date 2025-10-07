import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pie } from 'react-chartjs-2';
import { api } from '../../services/api';
import { Wallet, TrendingUp, RefreshCw } from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Asset {
  symbol: string;
  quantity: number;
  value: number;
  allocation_percent: number;
}

const PortfolioOverview: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await api.trading.getPortfolio();
      setAssets(response.assets || []);
      setTotalValue(response.total_value || 0);
    } catch (err) {
      console.error('Portfolio error:', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: assets.map(a => a.symbol),
    datasets: [{
      data: assets.map(a => a.value),
      backgroundColor: [
        '#06b6d4', '#4ade80', '#f97316', '#a855f7', '#facc15', '#f87171',
        '#3b82f6', '#10b981', '#ec4899', '#14b8a6'
      ],
      borderWidth: 2,
      borderColor: '#0f172a'
    }]
  };

  const chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#f8fafc',
          font: { family: 'Inter', size: 11 },
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        callbacks: {
          label: (context) => {
            const asset = assets[context.dataIndex];
            return `${asset.symbol}: $${asset.value.toLocaleString()} (${asset.allocation_percent.toFixed(1)}%)`;
          }
        }
      }
    }
  };

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-50">Portfolio Overview</h3>
        </div>

        <motion.button
          onClick={fetchPortfolio}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      <div className="text-3xl font-bold text-slate-50 mb-6">
        ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>

      <div className="h-64">
        <Pie data={chartData} options={chartOptions} />
      </div>
    </motion.div>
  );
};

export default PortfolioOverview;

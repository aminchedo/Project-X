import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type ChartType = 'line' | 'bar' | 'pie';

interface ChartProps {
  type?: ChartType;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string | string[];
      fill?: boolean;
      tension?: number;
    }>;
  };
  title?: string;
  height?: number;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  options?: any;
}

const Chart: React.FC<ChartProps> = ({
  type = 'line',
  data,
  title,
  height = 300,
  loading = false,
  error,
  onRefresh,
  options: customOptions
}) => {
  const getDefaultOptions = (): ChartOptions<any> => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: data.datasets.length > 1,
          position: 'top' as const,
          labels: {
            color: '#f8fafc',
            font: { family: 'Inter', size: 12, weight: '600' },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (type === 'pie') {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                label += `${context.parsed.toLocaleString()} (${percentage}%)`;
              } else {
                label += context.parsed.y?.toLocaleString() || context.parsed.toLocaleString();
              }
              return label;
            }
          }
        }
      }
    };

    if (type !== 'pie') {
      return {
        ...baseOptions,
        scales: {
          x: {
            ticks: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 10 }
            },
            grid: {
              color: 'rgba(51, 65, 85, 0.3)',
              display: type === 'bar'
            }
          },
          y: {
            ticks: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 11 },
              callback: (value: any) => {
                if (typeof value === 'number') {
                  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0);
                }
                return value;
              }
            },
            grid: {
              color: 'rgba(51, 65, 85, 0.3)'
            }
          }
        }
      };
    }

    return baseOptions;
  };

  const chartOptions = customOptions || getDefaultOptions();

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <Bar data={data} options={chartOptions} />;
      case 'pie':
        return <Pie data={data} options={chartOptions} />;
      case 'line':
      default:
        return <Line data={data} options={chartOptions} />;
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-8">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <p className="text-slate-50 mb-4">{error}</p>
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div 
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
            <span className="text-3xl text-slate-600">📊</span>
          </div>
          <p className="text-slate-400 mb-2">No Data Available</p>
          <p className="text-slate-500 text-sm">Chart data will appear when available</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      {(title || onRefresh) && (
        <div className="flex items-center justify-between mb-6">
          {title && (
            <h3 className="text-xl font-semibold text-slate-50">{title}</h3>
          )}
          {onRefresh && (
            <motion.button
              onClick={onRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          )}
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        {renderChart()}
      </div>
    </motion.div>
  );
};

export default Chart;

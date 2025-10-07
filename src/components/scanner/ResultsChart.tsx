import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Scatter } from 'react-chartjs-2';
import { ScanResult } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ResultsChartProps {
  results: ScanResult[];
  onPointClick?: (symbol: string) => void;
}

const ResultsChart: React.FC<ResultsChartProps> = ({ results, onPointClick }) => {
  // Helper functions
  const getScore = (result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  };

  const getDirection = (result: ScanResult): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
  };

  const getSignalCount = (result: ScanResult): number => {
    if (result.sample_components) {
      const components = Object.values(result.sample_components);
      return components.filter((c: any) => c.score > 0.5).length;
    }
    return 0;
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    const bullishData = results
      .filter(r => getDirection(r) === 'BULLISH')
      .map(r => ({
        x: getSignalCount(r),
        y: getScore(r) * 100,
        symbol: r.symbol
      }));

    const bearishData = results
      .filter(r => getDirection(r) === 'BEARISH')
      .map(r => ({
        x: getSignalCount(r),
        y: getScore(r) * 100,
        symbol: r.symbol
      }));

    const neutralData = results
      .filter(r => getDirection(r) === 'NEUTRAL')
      .map(r => ({
        x: getSignalCount(r),
        y: getScore(r) * 100,
        symbol: r.symbol
      }));

    return {
      datasets: [
        {
          label: 'Bullish',
          data: bullishData,
          backgroundColor: 'rgba(74, 222, 128, 0.6)',
          borderColor: 'rgba(74, 222, 128, 1)',
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 12,
        },
        {
          label: 'Bearish',
          data: bearishData,
          backgroundColor: 'rgba(248, 113, 113, 0.6)',
          borderColor: 'rgba(248, 113, 113, 1)',
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 12,
        },
        {
          label: 'Neutral',
          data: neutralData,
          backgroundColor: 'rgba(148, 163, 184, 0.6)',
          borderColor: 'rgba(148, 163, 184, 1)',
          borderWidth: 2,
          pointRadius: 8,
          pointHoverRadius: 12,
        }
      ]
    };
  }, [results]);

  const chartOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f8fafc',
          font: {
            family: 'Inter',
            size: 12,
            weight: '600'
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
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
            const point = context.raw;
            return [
              `Symbol: ${point.symbol}`,
              `Active Signals: ${point.x}`,
              `Score: ${point.y.toFixed(1)}%`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Active Signals',
          color: '#cbd5e1',
          font: {
            family: 'Inter',
            size: 13,
            weight: '600'
          }
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Inter',
            size: 11
          },
          stepSize: 1
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          lineWidth: 1
        }
      },
      y: {
        title: {
          display: true,
          text: 'Overall Score (%)',
          color: '#cbd5e1',
          font: {
            family: 'Inter',
            size: 13,
            weight: '600'
          }
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Inter',
            size: 11
          }
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          lineWidth: 1
        },
        min: 0,
        max: 100
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0 && onPointClick) {
        const datasetIndex = elements[0].datasetIndex;
        const index = elements[0].index;
        const point = chartData.datasets[datasetIndex].data[index] as any;
        onPointClick(point.symbol);
      }
    }
  };

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-50 mb-2">
          Score vs Signal Count Distribution
        </h3>
        <p className="text-sm text-slate-400">
          Click on points to view details • Higher and right is better
        </p>
      </div>

      {/* Chart */}
      <div className="h-[500px]">
        {results.length > 0 ? (
          <Scatter data={chartData} options={chartOptions} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-slate-400 mb-2">No Data to Display</p>
              <p className="text-sm text-slate-500">Run a scan to see the distribution chart</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend Info */}
      {results.length > 0 && (
        <motion.div 
          className="mt-6 grid grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-sm font-semibold text-green-400">Bullish</span>
            </div>
            <div className="text-2xl font-bold text-slate-50">
              {results.filter(r => getDirection(r) === 'BULLISH').length}
            </div>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <span className="text-sm font-semibold text-red-400">Bearish</span>
            </div>
            <div className="text-2xl font-bold text-slate-50">
              {results.filter(r => getDirection(r) === 'BEARISH').length}
            </div>
          </div>

          <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-sm font-semibold text-slate-400">Neutral</span>
            </div>
            <div className="text-2xl font-bold text-slate-50">
              {results.filter(r => getDirection(r) === 'NEUTRAL').length}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResultsChart;

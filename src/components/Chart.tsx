import React, { useState, useEffect, useRef } from 'react';
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
  TimeScale
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { apiService } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ChartProps {
  symbol: string;
  timeframe?: string;
}

interface OHLCVData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalIndicators {
  rsi: number[];
  macd: number[];
  signal: number[];
  histogram: number[];
  sma_20: number[];
  sma_50: number[];
  bb_upper: number[];
  bb_lower: number[];
  bb_middle: number[];
}

const Chart: React.FC<ChartProps> = ({ symbol, timeframe = '1h' }) => {
  const [ohlcvData, setOhlcvData] = useState<OHLCVData[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['SMA20', 'SMA50', 'RSI']);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'area'>('line');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chartRef = useRef<any>(null);

  // Timeframe options
  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' }
  ];

  // Available indicators
  const availableIndicators = [
    'SMA20', 'SMA50', 'RSI', 'MACD', 'BB', 'Volume'
  ];

  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  const fetchChartData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.get(`/api/ohlcv/${symbol}?interval=${timeframe}&limit=200`);
      setOhlcvData(response.data || response || []);
      await calculateIndicators(response.data || response || []);
    } catch (err) {
      setError('Failed to fetch chart data');
      console.error('Chart data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateIndicators = async (data: OHLCVData[]) => {
    if (data.length < 50) return;

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    // Calculate SMA
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);

    // Calculate RSI
    const rsi = calculateRSI(closes, 14);

    // Calculate MACD
    const macdData = calculateMACD(closes);

    // Calculate Bollinger Bands
    const bbData = calculateBollingerBands(closes, 20, 2);

    setIndicators({
      rsi,
      macd: macdData.macd,
      signal: macdData.signal,
      histogram: macdData.histogram,
      sma_20: sma20,
      sma_50: sma50,
      bb_upper: bbData.upper,
      bb_lower: bbData.lower,
      bb_middle: bbData.middle
    });
  };

  // Technical indicator calculations
  const calculateSMA = (prices: number[], period: number): number[] => {
    const sma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  const calculateRSI = (prices: number[], period: number = 14): number[] => {
    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    for (let i = 0; i < gains.length; i++) {
      if (i < period - 1) {
        rsi.push(NaN);
      } else {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return [NaN, ...rsi]; // Add NaN for first price point
  };

  const calculateMACD = (prices: number[]) => {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macd = ema12.map((val, i) => val - ema26[i]);
    const signal = calculateEMA(macd, 9);
    const histogram = macd.map((val, i) => val - signal[i]);

    return { macd, signal, histogram };
  };

  const calculateEMA = (prices: number[], period: number): number[] => {
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
    }

    return ema;
  };

  const calculateBollingerBands = (prices: number[], period: number, multiplier: number) => {
    const sma = calculateSMA(prices, period);
    const upper = [];
    const lower = [];

    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        
        upper.push(mean + (stdDev * multiplier));
        lower.push(mean - (stdDev * multiplier));
      }
    }

    return { upper, lower, middle: sma };
  };

  // Chart data preparation
  const prepareChartData = () => {
    if (!ohlcvData.length) return null;

    const labels = ohlcvData.map(d => new Date(d.timestamp));
    const datasets = [];

    // Main price line
    datasets.push({
      label: `${symbol} Price`,
      data: ohlcvData.map(d => d.close),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0.1,
      fill: chartType === 'area'
    });

    // Add selected indicators
    if (indicators) {
      if (selectedIndicators.includes('SMA20')) {
        datasets.push({
          label: 'SMA 20',
          data: indicators.sma_20,
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5]
        });
      }

      if (selectedIndicators.includes('SMA50')) {
        datasets.push({
          label: 'SMA 50',
          data: indicators.sma_50,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'transparent',
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [10, 5]
        });
      }

      if (selectedIndicators.includes('BB')) {
        datasets.push(
          {
            label: 'BB Upper',
            data: indicators.bb_upper,
            borderColor: 'rgba(156, 163, 175, 0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            pointRadius: 0,
            borderDash: [2, 2]
          },
          {
            label: 'BB Lower',
            data: indicators.bb_lower,
            borderColor: 'rgba(156, 163, 175, 0.5)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            pointRadius: 0,
            borderDash: [2, 2]
          }
        );
      }
    }

    return { labels, datasets };
  };

  // RSI Chart data
  const prepareRSIData = () => {
    if (!indicators?.rsi.length) return null;

    return {
      labels: ohlcvData.map(d => new Date(d.timestamp)),
      datasets: [{
        label: 'RSI',
        data: indicators.rsi,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true
      }]
    };
  };

  // MACD Chart data
  const prepareMACDData = () => {
    if (!indicators?.macd.length) return null;

    return {
      labels: ohlcvData.map(d => new Date(d.timestamp)),
      datasets: [
        {
          label: 'MACD',
          data: indicators.macd,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          type: 'line' as const
        },
        {
          label: 'Signal',
          data: indicators.signal,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          type: 'line' as const
        },
        {
          label: 'Histogram',
          data: indicators.histogram,
          backgroundColor: (ctx: any) => ctx.parsed.y >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
          borderColor: 'transparent',
          type: 'bar' as const
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(31, 41, 55, 0.9)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(209, 213, 219)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MMM dd HH:mm',
            day: 'MMM dd'
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y: {
        position: 'right' as const,
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  const indicatorOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: {
          ...chartOptions.scales.y.ticks,
          callback: function(value: any) {
            return value.toFixed(2);
          }
        }
      }
    }
  };

  const chartData = prepareChartData();
  const rsiData = prepareRSIData();
  const macdData = prepareMACDData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-400">
        <div className="text-center">
          <p className="text-lg">{error}</p>
          <button 
            onClick={fetchChartData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-800/30 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            {timeframes.map(tf => (
              <button
                key={tf.value}
                onClick={() => window.location.hash = `timeframe=${tf.value}`}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  timeframe === tf.value 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded text-sm ${
                chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded text-sm ${
                chartType === 'area' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              Area
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Indicators:</span>
          {availableIndicators.map(indicator => (
            <button
              key={indicator}
              onClick={() => {
                setSelectedIndicators(prev => 
                  prev.includes(indicator) 
                    ? prev.filter(i => i !== indicator)
                    : [...prev, indicator]
                );
              }}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedIndicators.includes(indicator)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {indicator}
            </button>
          ))}
        </div>
      </div>

      {/* Main Price Chart */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <div className="h-96">
          {chartData && <Line ref={chartRef} data={chartData} options={chartOptions} />}
        </div>
      </div>

      {/* RSI Chart */}
      {selectedIndicators.includes('RSI') && rsiData && (
        <div className="bg-gray-800/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">RSI (14)</h3>
          <div className="h-32 relative">
            <Line data={rsiData} options={{
              ...indicatorOptions,
              scales: {
                ...indicatorOptions.scales,
                y: {
                  ...indicatorOptions.scales.y,
                  min: 0,
                  max: 100,
                  ticks: {
                    ...indicatorOptions.scales.y.ticks,
                    stepSize: 20
                  }
                }
              }
            }} />
          </div>
        </div>
      )}

      {/* MACD Chart */}
      {selectedIndicators.includes('MACD') && macdData && (
        <div className="bg-gray-800/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">MACD (12, 26, 9)</h3>
          <div className="h-32">
            <Line data={macdData} options={indicatorOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chart;
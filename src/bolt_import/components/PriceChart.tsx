import React, { useState, useEffect } from 'react';
import { CandlestickData, TechnicalIndicators } from '../types';
import { Activity, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  data: CandlestickData[];
  indicators?: TechnicalIndicators;
}

export const PriceChart: React.FC<PriceChartProps> = ({ symbol, data, indicators }) => {
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [timeframe, setTimeframe] = useState('1h');
  const [showIndicators, setShowIndicators] = useState(false);

  if (!data.length) return null;

  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const priceRange = maxPrice - minPrice;

  const getYPosition = (price: number, height: number = 300) => {
    return height - ((price - minPrice) / priceRange) * height;
  };

  const currentPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-bold text-white">{symbol}/USDT</h3>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">
                ${currentPrice.toLocaleString()}
              </span>
              <div className={`flex items-center ${
                priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceChange >= 0 ? (
                  <TrendingUp size={20} className="mr-1" />
                ) : (
                  <TrendingDown size={20} className="mr-1" />
                )}
                <span className="font-semibold">
                  {priceChange >= 0 ? '+' : ''}
                  {priceChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-700"
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
            
            <button
              onClick={() => setChartType(chartType === 'candlestick' ? 'line' : 'candlestick')}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-700 transition-colors"
            >
              {chartType === 'candlestick' ? <Activity size={16} /> : <BarChart3 size={16} />}
            </button>
            
            <button
              onClick={() => setShowIndicators(!showIndicators)}
              className={`px-3 py-1 rounded border transition-colors ${
                showIndicators 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Indicators
            </button>
          </div>
        </div>

        {showIndicators && indicators && (
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400">RSI</span>
              <div className={`font-semibold ${
                indicators.rsi > 70 ? 'text-red-400' : indicators.rsi < 30 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {indicators.rsi.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400">MACD</span>
              <div className={`font-semibold ${
                indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {indicators.macd.macd.toFixed(4)}
              </div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400">SMA 20</span>
              <div className={`font-semibold ${
                currentPrice > indicators.sma20 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${indicators.sma20.toFixed(2)}
              </div>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <span className="text-gray-400">BB %B</span>
              <div className="text-blue-400 font-semibold">
                {(((currentPrice - indicators.bb.lower) / (indicators.bb.upper - indicators.bb.lower)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="relative h-80 bg-gray-950 rounded border border-gray-800 overflow-hidden">
          <svg width="100%" height="100%" className="absolute inset-0">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Price data visualization */}
            {chartType === 'candlestick' ? (
              data.map((candle, index) => {
                const x = (index / (data.length - 1)) * 100;
                const yHigh = getYPosition(candle.high, 300);
                const yLow = getYPosition(candle.low, 300);
                const yOpen = getYPosition(candle.open, 300);
                const yClose = getYPosition(candle.close, 300);
                const isGreen = candle.close > candle.open;

                return (
                  <g key={index}>
                    {/* Wick */}
                    <line
                      x1={`${x}%`}
                      y1={yHigh}
                      x2={`${x}%`}
                      y2={yLow}
                      stroke={isGreen ? '#10b981' : '#ef4444'}
                      strokeWidth="1"
                    />
                    {/* Body */}
                    <rect
                      x={`calc(${x}% - 2px)`}
                      y={Math.min(yOpen, yClose)}
                      width="4"
                      height={Math.abs(yOpen - yClose) || 1}
                      fill={isGreen ? '#10b981' : '#ef4444'}
                    />
                  </g>
                );
              })
            ) : (
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={data.map((candle, index) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = getYPosition(candle.close, 300);
                  return `${x}%,${y}`;
                }).join(' ')}
              />
            )}

            {/* Technical indicators overlay */}
            {showIndicators && indicators && (
              <>
                {/* Bollinger Bands */}
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="1"
                  opacity="0.5"
                  strokeDasharray="3,3"
                  points={data.map((_, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = getYPosition(indicators.bb.upper, 300);
                    return `${x}%,${y}`;
                  }).join(' ')}
                />
                <polyline
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="1"
                  opacity="0.5"
                  strokeDasharray="3,3"
                  points={data.map((_, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = getYPosition(indicators.bb.lower, 300);
                    return `${x}%,${y}`;
                  }).join(' ')}
                />
                {/* SMA 20 */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  opacity="0.8"
                  points={data.map((_, index) => {
                    const x = (index / (data.length - 1)) * 100;
                    const y = getYPosition(indicators.sma20, 300);
                    return `${x}%,${y}`;
                  }).join(' ')}
                />
              </>
            )}
          </svg>

          {/* Price labels */}
          <div className="absolute right-2 top-2 text-xs text-gray-400">
            ${maxPrice.toFixed(2)}
          </div>
          <div className="absolute right-2 bottom-2 text-xs text-gray-400">
            ${minPrice.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
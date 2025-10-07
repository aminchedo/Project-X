import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { AlertCircle, RefreshCw, Info } from 'lucide-react';

interface CorrelationData {
  symbols: string[];
  matrix: number[][];
  timestamp: string;
}

interface CorrelationHeatMapProps {
  symbols?: string[];
  onCellClick?: (symbol1: string, symbol2: string, correlation: number) => void;
}

const CorrelationHeatMap: React.FC<CorrelationHeatMapProps> = ({ 
  symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP'],
  onCellClick
}) => {
  const [data, setData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  useEffect(() => {
    fetchCorrelationData();
  }, [symbols]);

  const fetchCorrelationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getCorrelations();
      setData(response);
    } catch (err) {
      setError('Failed to load correlation data');
      console.error('Correlation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationColor = (value: number): string => {
    // Normalize to 0-1 range (correlation is -1 to 1)
    const normalized = (value + 1) / 2;
    
    if (value > 0.7) return 'bg-green-500';
    if (value > 0.4) return 'bg-green-600';
    if (value > 0.1) return 'bg-green-700';
    if (value > -0.1) return 'bg-slate-600';
    if (value > -0.4) return 'bg-red-700';
    if (value > -0.7) return 'bg-red-600';
    return 'bg-red-500';
  };

  const getCorrelationOpacity = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue > 0.7) return 'opacity-100';
    if (absValue > 0.4) return 'opacity-80';
    return 'opacity-60';
  };

  const getCorrelationLabel = (value: number): string => {
    if (value > 0.7) return 'Strong Positive';
    if (value > 0.3) return 'Moderate Positive';
    if (value > 0) return 'Weak Positive';
    if (value > -0.3) return 'Weak Negative';
    if (value > -0.7) return 'Moderate Negative';
    return 'Strong Negative';
  };

  if (loading) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading correlation matrix...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error || 'No data available'}</p>
        <button 
          onClick={fetchCorrelationData}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Correlation Matrix</h2>
          <p className="text-sm text-slate-400">Asset correlation analysis</p>
        </div>
        <motion.button
          onClick={fetchCorrelationData}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Info Banner */}
      <motion.div 
        className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Understanding Correlation</h4>
            <p className="text-sm text-slate-300">
              Correlation ranges from -1 (perfect negative) to +1 (perfect positive). 
              Hover over cells for detailed information.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Heatmap */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6 overflow-x-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="min-w-[600px]">
          {/* Column Headers */}
          <div className="flex mb-2">
            <div className="w-16"></div>
            {data.symbols.map((symbol, index) => (
              <motion.div
                key={symbol}
                className="flex-1 text-center text-sm font-semibold text-slate-300 px-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                {symbol}
              </motion.div>
            ))}
          </div>

          {/* Matrix Rows */}
          {data.matrix.map((row, rowIndex) => (
            <motion.div
              key={rowIndex}
              className="flex mb-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + rowIndex * 0.05 }}
            >
              {/* Row Header */}
              <div className="w-16 flex items-center justify-end pr-2 text-sm font-semibold text-slate-300">
                {data.symbols[rowIndex]}
              </div>

              {/* Correlation Cells */}
              {row.map((value, colIndex) => {
                const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;
                const color = getCorrelationColor(value);
                const opacity = getCorrelationOpacity(value);
                const isDiagonal = rowIndex === colIndex;

                return (
                  <motion.button
                    key={colIndex}
                    onClick={() => onCellClick?.(data.symbols[rowIndex], data.symbols[colIndex], value)}
                    onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`flex-1 aspect-square ${color} ${opacity} ${
                      isDiagonal ? 'border-2 border-slate-700' : ''
                    } m-0.5 rounded transition-all duration-200 relative group`}
                    whileHover={{ scale: 1.1, zIndex: 10 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isDiagonal}
                  >
                    {/* Value Text */}
                    <span className="text-white text-xs font-semibold">
                      {value.toFixed(2)}
                    </span>

                    {/* Hover Tooltip */}
                    {isHovered && !isDiagonal && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-2xl whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-50 mb-1">
                            {data.symbols[rowIndex]} ↔ {data.symbols[colIndex]}
                          </div>
                          <div className="text-xs text-slate-400 mb-1">
                            Correlation: {value.toFixed(3)}
                          </div>
                          <div className={`text-xs font-semibold ${
                            value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {getCorrelationLabel(value)}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-slate-50 mb-4">Color Legend</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <span className="text-sm text-slate-300">Strong Negative (-1 to -0.7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-700 rounded"></div>
            <span className="text-sm text-slate-300">Moderate Negative (-0.7 to -0.3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-600 rounded"></div>
            <span className="text-sm text-slate-300">No Correlation (-0.3 to 0.3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-700 rounded"></div>
            <span className="text-sm text-slate-300">Moderate Positive (0.3 to 0.7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-sm text-slate-300">Strong Positive (0.7 to 1)</span>
          </div>
        </div>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h4 className="text-sm font-medium text-slate-400 mb-2">Highest Correlation</h4>
          <p className="text-2xl font-bold text-green-400">
            {Math.max(...data.matrix.flat().filter(v => v < 1)).toFixed(3)}
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h4 className="text-sm font-medium text-slate-400 mb-2">Lowest Correlation</h4>
          <p className="text-2xl font-bold text-red-400">
            {Math.min(...data.matrix.flat()).toFixed(3)}
          </p>
        </motion.div>

        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h4 className="text-sm font-medium text-slate-400 mb-2">Average Correlation</h4>
          <p className="text-2xl font-bold text-cyan-400">
            {(data.matrix.flat().reduce((a, b) => a + b, 0) / (data.matrix.length * data.matrix[0].length)).toFixed(3)}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CorrelationHeatMap;

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScanResult } from '../../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ScannerHeatmapProps {
  results: ScanResult[];
  onCellClick?: (symbol: string) => void;
}

const ScannerHeatmap: React.FC<ScannerHeatmapProps> = ({ results, onCellClick }) => {
  // Helper functions
  const getScore = (result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  };

  const getDirection = (result: ScanResult): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
  };

  // Calculate cell color based on score and direction
  const getCellColor = (score: number, direction: string) => {
    const intensity = Math.min(100, Math.max(0, score * 100));
    
    if (direction === 'BULLISH') {
      if (intensity >= 70) return 'bg-green-500 hover:bg-green-400';
      if (intensity >= 40) return 'bg-green-600 hover:bg-green-500';
      return 'bg-green-700 hover:bg-green-600';
    } else if (direction === 'BEARISH') {
      if (intensity >= 70) return 'bg-red-500 hover:bg-red-400';
      if (intensity >= 40) return 'bg-red-600 hover:bg-red-500';
      return 'bg-red-700 hover:bg-red-600';
    } else {
      if (intensity >= 70) return 'bg-slate-400 hover:bg-slate-300';
      if (intensity >= 40) return 'bg-slate-500 hover:bg-slate-400';
      return 'bg-slate-600 hover:bg-slate-500';
    }
  };

  const getOpacity = (score: number) => {
    const intensity = score * 100;
    if (intensity >= 70) return 'opacity-100';
    if (intensity >= 40) return 'opacity-75';
    return 'opacity-50';
  };

  // Sort results by score
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => getScore(b) - getScore(a));
  }, [results]);

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-50 mb-2">Market Heatmap</h3>
        <p className="text-sm text-slate-400">Color intensity represents signal strength</p>
      </div>

      {/* Heatmap Grid */}
      {sortedResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {sortedResults.map((result, index) => {
            const score = getScore(result);
            const direction = getDirection(result);
            const cellColor = getCellColor(score, direction);
            const opacity = getOpacity(score);

            return (
              <motion.button
                key={result.symbol}
                onClick={() => onCellClick?.(result.symbol)}
                className={`${cellColor} ${opacity} rounded-lg p-4 transition-all duration-200 transform hover:scale-105 hover:shadow-lg relative group`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Symbol */}
                <div className="text-white font-bold text-sm mb-1 truncate">
                  {result.symbol}
                </div>

                {/* Score */}
                <div className="text-white text-xs opacity-90">
                  {(score * 100).toFixed(0)}%
                </div>

                {/* Direction Icon */}
                <div className="absolute top-1 right-1">
                  {direction === 'BULLISH' ? (
                    <TrendingUp className="w-3 h-3 text-white/80" />
                  ) : direction === 'BEARISH' ? (
                    <TrendingDown className="w-3 h-3 text-white/80" />
                  ) : null}
                </div>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-50 mb-1">{result.symbol}</div>
                    <div className="text-xs text-slate-400">Score: {(score * 100).toFixed(1)}%</div>
                    <div className={`text-xs font-semibold ${
                      direction === 'BULLISH' ? 'text-green-400' :
                      direction === 'BEARISH' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {direction}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 mb-2">No Data for Heatmap</p>
          <p className="text-sm text-slate-500">Run a scan to see the market heatmap</p>
        </div>
      )}

      {/* Legend */}
      {sortedResults.length > 0 && (
        <motion.div 
          className="mt-6 pt-6 border-t border-slate-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 font-medium">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-slate-400">Bullish</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs text-slate-400">Bearish</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-500 rounded"></div>
                <span className="text-xs text-slate-400">Neutral</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Lighter = Stronger Signal</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ScannerHeatmap;

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Target, Eye } from 'lucide-react';
import { ScanResult } from '../../types';
import ScoreGauge from '../showcase/ScoreGauge';
import DirectionPill from '../showcase/DirectionPill';

interface ResultsGridProps {
  results: ScanResult[];
  onViewDetails?: (symbol: string) => void;
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ results, onViewDetails }) => {
  // Helper functions
  const getScore = (result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  };

  const getDirection = (result: ScanResult): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
  };

  const getTfCount = (result: ScanResult): number => {
    return result.tf_count ?? result.timeframes?.length ?? 0;
  };

  const getSignalCount = (result: ScanResult): { active: number; total: number } => {
    if (result.sample_components) {
      const components = Object.values(result.sample_components);
      const total = components.length;
      const active = components.filter((c: any) => c.score > 0.5).length;
      return { active, total };
    }
    return { active: 0, total: 9 };
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'BULLISH':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'BEARISH':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {results.map((result, index) => {
        const score = getScore(result);
        const direction = getDirection(result);
        const tfCount = getTfCount(result);
        const signalCount = getSignalCount(result);

        return (
          <motion.div
            key={result.symbol}
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-5 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            {/* Header with Symbol and Direction */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {getDirectionIcon(direction)}
                <h3 className="text-xl font-bold text-slate-50">{result.symbol}</h3>
              </div>
              <DirectionPill direction={direction} />
            </div>

            {/* Score Display */}
            <div className="flex justify-center mb-4">
              <ScoreGauge score={score} size="lg" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Signals Count */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-slate-400">Signals</span>
                </div>
                <div className="text-lg font-bold text-slate-50">
                  {signalCount.active}/{signalCount.total}
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1 mt-2">
                  <motion.div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(signalCount.active / signalCount.total) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                  />
                </div>
              </div>

              {/* Timeframes */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                <div className="flex items-center gap-1 mb-1">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-medium text-slate-400">Timeframes</span>
                </div>
                <div className="text-lg font-bold text-slate-50">
                  {tfCount}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {tfCount > 1 ? 'Multiple TFs' : 'Single TF'}
                </div>
              </div>
            </div>

            {/* Sample Components Preview */}
            {result.sample_components && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-400 mb-2">Top Indicators</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(result.sample_components)
                    .slice(0, 4)
                    .map(([key, value]: [string, any]) => (
                      <span
                        key={key}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          value.score > 0.7
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : value.score > 0.5
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                        }`}
                      >
                        {key.split('_')[0]}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* View Details Button */}
            <motion.button
              onClick={() => onViewDetails?.(result.symbol)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-cyan-500/20"
            >
              <Eye className="w-4 h-4" />
              View Details
            </motion.button>
          </motion.div>
        );
      })}

      {/* Empty State */}
      {results.length === 0 && (
        <motion.div
          className="col-span-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Activity className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">No Results</h3>
          <p className="text-slate-400">Run a scan to see results here</p>
        </motion.div>
      )}
    </div>
  );
};

export default ResultsGrid;

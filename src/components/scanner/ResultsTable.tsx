import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpDown, CheckSquare, Square, Eye } from 'lucide-react';
import { ScanResult } from '../../types';
import ScoreGauge from '../showcase/ScoreGauge';
import DirectionPill from '../showcase/DirectionPill';

interface ResultsTableProps {
  results: ScanResult[];
  selectedSymbols: Set<string>;
  onToggleSelection: (symbol: string) => void;
  onViewDetails?: (symbol: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ 
  results, 
  selectedSymbols,
  onToggleSelection,
  onViewDetails
}) => {
  const [sortBy, setSortBy] = useState<string>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Helper to extract score
  const getScore = (result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  };

  // Helper to extract direction
  const getDirection = (result: ScanResult): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
  };

  // Helper to get timeframe count
  const getTfCount = (result: ScanResult): number => {
    return result.tf_count ?? result.timeframes?.length ?? 0;
  };

  // Helper to get active signal count
  const getSignalCount = (result: ScanResult): { active: number; total: number } => {
    if (result.sample_components) {
      const components = Object.values(result.sample_components);
      const total = components.length;
      const active = components.filter((c: any) => c.score > 0.5).length;
      return { active, total };
    }
    return { active: 0, total: 9 };
  };

  // Sorting logic
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let aVal: any, bVal: any;

    switch (sortBy) {
      case 'score':
        aVal = getScore(a);
        bVal = getScore(b);
        break;
      case 'symbol':
        aVal = a.symbol;
        bVal = b.symbol;
        break;
      case 'timeframes':
        aVal = getTfCount(a);
        bVal = getTfCount(b);
        break;
      default:
        aVal = getScore(a);
        bVal = getScore(b);
    }

    const order = sortOrder === 'asc' ? 1 : -1;
    return aVal > bVal ? order : -order;
  });

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              {/* Selection Column */}
              <th className="text-left py-4 px-4 text-slate-300 font-semibold text-sm w-12">
                <CheckSquare className="w-5 h-5 text-slate-400" />
              </th>
              
              {/* Symbol Column */}
              <th 
                className="text-left py-4 px-4 text-slate-300 font-semibold text-sm cursor-pointer hover:text-slate-50 transition-colors group"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center gap-2">
                  Symbol
                  <ArrowUpDown className={`w-4 h-4 ${sortBy === 'symbol' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                </div>
              </th>
              
              {/* Score Column */}
              <th 
                className="text-center py-4 px-4 text-slate-300 font-semibold text-sm cursor-pointer hover:text-slate-50 transition-colors group"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center justify-center gap-2">
                  Score
                  <ArrowUpDown className={`w-4 h-4 ${sortBy === 'score' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                </div>
              </th>
              
              {/* Direction Column */}
              <th className="text-center py-4 px-4 text-slate-300 font-semibold text-sm">
                Direction
              </th>
              
              {/* Signals Column */}
              <th className="text-center py-4 px-4 text-slate-300 font-semibold text-sm">
                Signals
              </th>
              
              {/* Timeframes Column */}
              <th 
                className="text-center py-4 px-4 text-slate-300 font-semibold text-sm cursor-pointer hover:text-slate-50 transition-colors group"
                onClick={() => handleSort('timeframes')}
              >
                <div className="flex items-center justify-center gap-2">
                  Timeframes
                  <ArrowUpDown className={`w-4 h-4 ${sortBy === 'timeframes' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                </div>
              </th>
              
              {/* Actions Column */}
              <th className="text-center py-4 px-4 text-slate-300 font-semibold text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => {
              const score = getScore(result);
              const direction = getDirection(result);
              const tfCount = getTfCount(result);
              const signalCount = getSignalCount(result);
              const isSelected = selectedSymbols.has(result.symbol);

              return (
                <motion.tr
                  key={result.symbol}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                >
                  {/* Selection Checkbox */}
                  <td className="py-4 px-4">
                    <motion.button
                      onClick={() => onToggleSelection(result.symbol)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </motion.button>
                  </td>
                  
                  {/* Symbol */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-50 text-lg">{result.symbol}</div>
                  </td>
                  
                  {/* Score Gauge */}
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <ScoreGauge score={score} size="md" />
                    </div>
                  </td>
                  
                  {/* Direction Pill */}
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <DirectionPill direction={direction} />
                    </div>
                  </td>
                  
                  {/* Signals Count */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-slate-50 font-semibold">
                        {signalCount.active}/{signalCount.total}
                      </span>
                      <div className="w-full max-w-[80px] bg-slate-700/50 rounded-full h-1.5">
                        <motion.div
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(signalCount.active / signalCount.total) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </td>
                  
                  {/* Timeframes */}
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {tfCount} TF
                      </span>
                    </div>
                  </td>
                  
                  {/* Actions */}
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-2">
                      <motion.button
                        onClick={() => onViewDetails?.(result.symbol)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/20"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with stats */}
      <motion.div 
        className="bg-slate-800/50 px-6 py-4 border-t border-slate-700 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-6">
          <div className="text-sm text-slate-400">
            Total Results: <span className="font-semibold text-slate-50">{results.length}</span>
          </div>
          <div className="text-sm text-slate-400">
            Selected: <span className="font-semibold text-cyan-400">{selectedSymbols.size}</span>
          </div>
        </div>
        
        <div className="text-xs text-slate-500">
          Click headers to sort • Click rows to view details
        </div>
      </motion.div>
    </div>
  );
};

export default ResultsTable;

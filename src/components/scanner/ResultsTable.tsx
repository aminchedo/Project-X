import React from 'react';
import { TrendingUp, CheckSquare, Square } from 'lucide-react';
import { ScanResult } from '../../types';
import ScoreGauge from '../showcase/ScoreGauge';
import DirectionPill from '../showcase/DirectionPill';

interface ResultsTableProps {
  results: ScanResult[];
  selectedSymbols: Set<string>;
  onToggleSelection: (symbol: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ 
  results, 
  selectedSymbols,
  onToggleSelection 
}) => {
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
    return { active: 0, total: 9 }; // Default: assume 9 detectors
  };

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-slate-700/50">
            <th className="text-right py-4 px-4 text-slate-400 font-semibold text-sm w-10">
              {/* Selection column */}
            </th>
            <th className="text-right py-4 px-4 text-slate-400 font-semibold text-sm">
              نماد
            </th>
            <th className="text-center py-4 px-4 text-slate-400 font-semibold text-sm">
              امتیاز نهایی
            </th>
            <th className="text-center py-4 px-4 text-slate-400 font-semibold text-sm">
              جهت
            </th>
            <th className="text-center py-4 px-4 text-slate-400 font-semibold text-sm">
              سیگنال‌ها
            </th>
            <th className="text-center py-4 px-4 text-slate-400 font-semibold text-sm">
              بازه‌های زمانی
            </th>
            <th className="text-center py-4 px-4 text-slate-400 font-semibold text-sm">
              عملیات
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => {
            const score = getScore(result);
            const direction = getDirection(result);
            const tfCount = getTfCount(result);
            const signalCount = getSignalCount(result);
            const isSelected = selectedSymbols.has(result.symbol);

            return (
              <tr
                key={`${result.symbol}-${index}`}
                className={`
                  border-b border-slate-800/50 transition-all duration-200 group
                  hover:bg-slate-700/30 hover:scale-[1.01] hover:shadow-lg cursor-pointer
                  ${isSelected ? 'bg-purple-500/10' : ''}
                `}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Navigate to details (implement later)
                    console.log('Open details for', result.symbol);
                  }
                }}
              >
                {/* Selection Checkbox */}
                <td className="py-4 px-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelection(result.symbol);
                    }}
                    className="p-1 hover:bg-slate-600/50 rounded transition-colors"
                    aria-label={`انتخاب ${result.symbol}`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />
                    )}
                  </button>
                </td>

                {/* Symbol */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-white text-lg">
                      {result.symbol}
                    </div>
                  </div>
                </td>

                {/* Score Gauge with Enhanced Visual */}
                <td className="py-4 px-4">
                  <div className="flex flex-col items-center gap-2">
                    <ScoreGauge score={score} size="sm" showLabel={false} />
                    <div className="flex items-center gap-1">
                      <div 
                        className="h-2 rounded-full overflow-hidden bg-slate-700/50"
                        style={{ width: '100px' }}
                      >
                        <div
                          className={`h-full transition-all duration-700 ease-out ${
                            score < 0.3 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            score < 0.7 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                            'bg-gradient-to-r from-emerald-500 to-emerald-600'
                          }`}
                          style={{ width: `${score * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </td>

                {/* Direction with Pulse Animation */}
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    <div className={score > 0.8 ? 'animate-pulse' : ''}>
                      <DirectionPill direction={direction} size="sm" />
                    </div>
                  </div>
                </td>

                {/* Signal Count */}
                <td className="py-4 px-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-slate-300 font-mono font-semibold">
                      {signalCount.active}/{signalCount.total}
                    </span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: signalCount.total }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            i < signalCount.active 
                              ? 'bg-emerald-500' 
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </td>

                {/* Timeframe Badges */}
                <td className="py-4 px-4">
                  <div className="flex justify-center gap-1 flex-wrap">
                    {result.timeframes?.slice(0, 4).map((tf) => (
                      <span
                        key={tf}
                        className={`
                          px-2 py-1 rounded text-xs font-mono font-semibold border
                          ${direction === 'BULLISH' 
                            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                            : direction === 'BEARISH'
                            ? 'bg-red-500/20 border-red-500/30 text-red-300'
                            : 'bg-slate-600/20 border-slate-500/30 text-slate-400'
                          }
                        `}
                      >
                        {tf}
                      </span>
                    ))}
                    {tfCount > 4 && (
                      <span className="px-2 py-1 text-xs text-slate-400">
                        +{tfCount - 4}
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-4 px-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => console.log('Open details for', result.symbol)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition-all hover:scale-105"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>جزئیات</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;

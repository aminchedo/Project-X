import React from 'react';
import { TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { ScanResult } from '../../types';
import ScoreGauge from '../showcase/ScoreGauge';
import DirectionPill from '../showcase/DirectionPill';

interface ResultsGridProps {
  results: ScanResult[];
  selectedSymbols: Set<string>;
  onToggleSelection: (symbol: string) => void;
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ 
  results, 
  selectedSymbols,
  onToggleSelection 
}) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {results.map((result, index) => {
        const score = getScore(result);
        const direction = getDirection(result);
        const tfCount = getTfCount(result);
        const signalCount = getSignalCount(result);
        const isSelected = selectedSymbols.has(result.symbol);

        return (
          <div
            key={`${result.symbol}-${index}`}
            className={`
              relative bg-slate-800/40 backdrop-blur-sm border rounded-xl p-5 space-y-4
              transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer group
              ${isSelected 
                ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/20' 
                : 'border-slate-700/50 hover:border-slate-600/50'
              }
            `}
            style={{
              animationDelay: `${index * 50}ms`,
              animation: 'fadeInUp 0.5s ease-out forwards',
            }}
          >
            {/* Selection Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(result.symbol);
              }}
              className="absolute top-3 left-3 p-1 hover:bg-slate-700/50 rounded transition-colors z-10"
              aria-label={`انتخاب ${result.symbol}`}
            >
              {isSelected ? (
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
              ) : (
                <Circle className="w-5 h-5 text-slate-500 group-hover:text-slate-400" />
              )}
            </button>

            {/* Header: Symbol */}
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold text-white">{result.symbol}</h4>
              <div className={score > 0.8 ? 'animate-pulse' : ''}>
                <DirectionPill direction={direction} size="sm" />
              </div>
            </div>

            {/* Score Gauge (Centered, Large) */}
            <div className="flex justify-center py-2">
              <ScoreGauge score={score} size="lg" showLabel={true} />
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>قدرت سیگنال</span>
                <span>{(score * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-700/50">
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    score < 0.3 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    score < 0.7 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                    'bg-gradient-to-r from-emerald-500 to-emerald-600'
                  }`}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                <div className="text-xs text-slate-400 mb-1">سیگنال‌ها</div>
                <div className="text-lg font-bold text-slate-200">
                  {signalCount.active}/{signalCount.total}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                <div className="text-xs text-slate-400 mb-1">بازه‌ها</div>
                <div className="text-lg font-bold text-slate-200">
                  {tfCount}
                </div>
              </div>
            </div>

            {/* Timeframe Badges */}
            {result.timeframes && result.timeframes.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center">
                {result.timeframes.slice(0, 4).map((tf) => (
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
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => console.log('Open details for', result.symbol)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-cyan-400 rounded-lg font-medium transition-all hover:scale-105"
            >
              <TrendingUp className="w-4 h-4" />
              <span>مشاهده جزئیات</span>
            </button>
          </div>
        );
      })}
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ResultsGrid;

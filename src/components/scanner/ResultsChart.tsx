import React from 'react';
import { ScanResult } from '../../types';
import ScoreGauge from '../showcase/ScoreGauge';
import DirectionPill from '../showcase/DirectionPill';

interface ResultsChartProps {
  results: ScanResult[];
}

const ResultsChart: React.FC<ResultsChartProps> = ({ results }) => {
  const getScore = (result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  };

  const getDirection = (result: ScanResult): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-400 text-center py-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
        💡 نمای نمودار: نمایش بصری امتیازات و روندها
      </div>
      
      {/* Bar Chart Visualization */}
      <div className="space-y-4">
        {results.map((result, index) => {
          const score = getScore(result);
          const direction = getDirection(result);
          
          return (
            <div
              key={`${result.symbol}-${index}`}
              className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-slate-600/50 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Symbol and Direction */}
                <div className="w-32 flex flex-col gap-2">
                  <div className="font-bold text-white text-lg">
                    {result.symbol}
                  </div>
                  <DirectionPill direction={direction} size="sm" />
                </div>

                {/* Score Gauge */}
                <div className="flex-shrink-0">
                  <ScoreGauge score={score} size="sm" showLabel={false} />
                </div>

                {/* Horizontal Bar */}
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>امتیاز: {(score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="relative h-8 rounded-lg overflow-hidden bg-slate-900/50 border border-slate-700/30">
                    <div
                      className={`
                        absolute inset-y-0 right-0 transition-all duration-1000 ease-out
                        ${score < 0.3 ? 'bg-gradient-to-l from-red-500 to-red-600' :
                          score < 0.7 ? 'bg-gradient-to-l from-amber-500 to-amber-600' :
                          'bg-gradient-to-l from-emerald-500 to-emerald-600'
                        }
                      `}
                      style={{ 
                        width: `${score * 100}%`,
                        animationDelay: `${index * 100}ms`,
                      }}
                    />
                    {/* Percentage Label Inside Bar */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm drop-shadow-lg">
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="flex gap-2">
                  {result.timeframes?.slice(0, 3).map((tf) => (
                    <span
                      key={tf}
                      className={`
                        px-2 py-1 rounded text-xs font-mono border
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

                {/* View Details Button */}
                <button
                  onClick={() => console.log('Open details for', result.symbol)}
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                >
                  جزئیات
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsChart;

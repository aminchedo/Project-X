import React, { useState } from 'react';
import { ScanResult } from '../../types';

interface ScannerHeatmapProps {
  results: ScanResult[];
}

const ScannerHeatmap: React.FC<ScannerHeatmapProps> = ({ results }) => {
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  const getScore = (result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  };

  const getDirection = (result: ScanResult): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
  };

  const getColor = (score: number) => {
    if (score < 0.3) return 'bg-red-500';
    if (score < 0.4) return 'bg-red-400';
    if (score < 0.5) return 'bg-orange-400';
    if (score < 0.6) return 'bg-yellow-400';
    if (score < 0.7) return 'bg-lime-400';
    if (score < 0.8) return 'bg-emerald-400';
    return 'bg-emerald-500';
  };

  const getOpacity = (score: number) => {
    // Higher scores get higher opacity
    return Math.max(0.3, Math.min(1, score + 0.2));
  };

  // Calculate grid dimensions based on result count
  const resultCount = results.length;
  const cols = Math.ceil(Math.sqrt(resultCount));
  const rows = Math.ceil(resultCount / cols);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
        <h3 className="text-lg font-semibold text-white mb-2">🗺️ نقشه حرارتی بازار</h3>
        <p className="text-sm text-slate-400">
          اندازه مربع = امتیاز | رنگ = جهت | شدت رنگ = قدرت سیگنال
        </p>
      </div>

      {/* Heatmap Grid */}
      <div 
        className="bg-slate-900/30 rounded-xl border border-slate-700/30 p-6 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '8px',
          minHeight: '400px'
        }}
      >
        {results.map((result) => {
          const score = getScore(result);
          const direction = getDirection(result);
          const size = Math.max(60, score * 150); // Min 60px, max 150px
          const isHovered = hoveredSymbol === result.symbol;

          return (
            <div
              key={result.symbol}
              className="flex items-center justify-center relative"
              onMouseEnter={() => setHoveredSymbol(result.symbol)}
              onMouseLeave={() => setHoveredSymbol(null)}
            >
              <div
                className={`
                  ${getColor(score)} rounded-lg flex flex-col items-center justify-center
                  transition-all duration-300 cursor-pointer
                  ${isHovered ? 'scale-110 shadow-2xl z-10' : 'hover:scale-105'}
                `}
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  opacity: getOpacity(score),
                }}
              >
                <span className="text-white font-bold text-sm drop-shadow-lg">
                  {result.symbol.replace('USDT', '')}
                </span>
                <span className="text-white text-xs font-semibold mt-1 drop-shadow-lg">
                  {(score * 100).toFixed(0)}%
                </span>
                {direction === 'BULLISH' && <span className="text-white text-lg">↑</span>}
                {direction === 'BEARISH' && <span className="text-white text-lg">↓</span>}
              </div>

              {/* Tooltip on Hover */}
              {isHovered && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-20 w-48 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl text-sm">
                  <div className="font-bold text-white mb-1">{result.symbol}</div>
                  <div className="text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">امتیاز:</span>
                      <span className="font-mono">{(score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">جهت:</span>
                      <span className={
                        direction === 'BULLISH' ? 'text-emerald-400' :
                        direction === 'BEARISH' ? 'text-red-400' : 'text-slate-400'
                      }>
                        {direction === 'BULLISH' ? 'صعودی' : direction === 'BEARISH' ? 'نزولی' : 'خنثی'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">بازه‌ها:</span>
                      <span className="font-mono">{result.tf_count || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-slate-900/30 rounded-lg border border-slate-700/30">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">جهت:</span>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-emerald-500 rounded"></div>
              <span className="text-xs text-slate-300">صعودی</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs text-slate-300">نزولی</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-xs text-slate-300">خنثی</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">قدرت:</span>
          <div className="flex gap-1 items-center">
            <div className="w-8 h-3 bg-emerald-500 opacity-30 rounded"></div>
            <div className="w-8 h-3 bg-emerald-500 opacity-50 rounded"></div>
            <div className="w-8 h-3 bg-emerald-500 opacity-70 rounded"></div>
            <div className="w-8 h-3 bg-emerald-500 opacity-100 rounded"></div>
            <span className="text-xs text-slate-300 mr-2">ضعیف → قوی</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerHeatmap;

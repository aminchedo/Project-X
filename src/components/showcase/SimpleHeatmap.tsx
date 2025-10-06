import React from 'react';
import { CorrelationData } from '../types';

interface SimpleHeatmapProps {
  data: CorrelationData | null;
}

export const SimpleHeatmap: React.FC<SimpleHeatmapProps> = ({ data }) => {
  if (!data || !data.assets?.length || !data.matrix?.length) {
    return (
      <div className="text-center text-slate-400 py-8">
        <p>اطلاعات همبستگی در دسترس نیست</p>
      </div>
    );
  }

  const { assets, matrix } = data;

  // Helper to get color based on correlation value
  const getColor = (value: number) => {
    // Normalize to 0-1 range (correlation is -1 to 1)
    const normalized = (value + 1) / 2;
    
    if (value > 0.7) return 'bg-emerald-600 text-white';
    if (value > 0.3) return 'bg-emerald-500/50 text-white';
    if (value > -0.3) return 'bg-slate-600 text-slate-200';
    if (value > -0.7) return 'bg-red-500/50 text-white';
    return 'bg-red-600 text-white';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-xs font-medium text-slate-400 text-right sticky right-0 bg-slate-900/95 z-10">
              نماد
            </th>
            {assets.map((asset, index) => (
              <th
                key={`header-${index}`}
                className="p-2 text-xs font-medium text-slate-400 text-center min-w-[60px]"
              >
                {asset}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((rowAsset, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="border-t border-slate-800/50">
              <td className="p-2 text-xs font-medium text-white sticky right-0 bg-slate-900/95 z-10">
                {rowAsset}
              </td>
              {assets.map((colAsset, colIndex) => {
                const value = matrix[rowIndex]?.[colIndex] ?? 0;
                const colorClass = getColor(value);
                
                return (
                  <td
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={`p-2 text-center transition-all duration-200 hover:ring-2 hover:ring-cyan-500/50 ${colorClass}`}
                  >
                    <div className="text-xs font-mono font-bold">
                      {value.toFixed(2)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs">
        <span className="text-slate-400">همبستگی:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span className="text-slate-400">منفی قوی</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-slate-600 rounded"></div>
          <span className="text-slate-400">خنثی</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-emerald-600 rounded"></div>
          <span className="text-slate-400">مثبت قوی</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleHeatmap;

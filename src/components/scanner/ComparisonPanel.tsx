import React from 'react';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { ScanResult } from '../../types';
import ScoreGauge from '../showcase/ScoreGauge';
import DirectionPill from '../showcase/DirectionPill';

interface ComparisonPanelProps {
  symbols: string[];
  results: ScanResult[];
  onClose: () => void;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ symbols, results, onClose }) => {
  const getScore = (result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  };

  const getDirection = (result: ScanResult): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
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

  // Find best opportunity
  const bestResult = results.reduce((best, current) => {
    return getScore(current) > getScore(best) ? current : best;
  }, results[0]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              📊 مقایسه نمادها
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              مقایسه جانبه {results.length} نماد انتخاب شده
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="بستن"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-cyan-300">بهترین فرصت:</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-white">{bestResult?.symbol}</span>
              <DirectionPill direction={getDirection(bestResult)} size="md" />
              <span className="text-cyan-400 text-lg font-mono">
                {(getScore(bestResult) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-right py-3 px-4 text-slate-400 font-semibold text-sm">
                    معیار
                  </th>
                  {results.map((result) => (
                    <th key={result.symbol} className="text-center py-3 px-4 text-slate-400 font-semibold text-sm">
                      {result.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Score Row */}
                <tr className="border-b border-slate-800">
                  <td className="py-4 px-4 text-slate-300 font-medium">امتیاز نهایی</td>
                  {results.map((result) => (
                    <td key={result.symbol} className="py-4 px-4">
                      <div className="flex justify-center">
                        <ScoreGauge score={getScore(result)} size="sm" showLabel={false} />
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Direction Row */}
                <tr className="border-b border-slate-800">
                  <td className="py-4 px-4 text-slate-300 font-medium">جهت</td>
                  {results.map((result) => (
                    <td key={result.symbol} className="py-4 px-4">
                      <div className="flex justify-center">
                        <DirectionPill direction={getDirection(result)} size="sm" />
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Signal Count Row */}
                <tr className="border-b border-slate-800">
                  <td className="py-4 px-4 text-slate-300 font-medium">سیگنال‌های فعال</td>
                  {results.map((result) => {
                    const { active, total } = getSignalCount(result);
                    return (
                      <td key={result.symbol} className="py-4 px-4 text-center">
                        <span className="text-slate-200 font-mono font-semibold">
                          {active}/{total}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Timeframes Row */}
                <tr className="border-b border-slate-800">
                  <td className="py-4 px-4 text-slate-300 font-medium">تعداد بازه‌ها</td>
                  {results.map((result) => (
                    <td key={result.symbol} className="py-4 px-4 text-center">
                      <span className="text-slate-200 font-mono font-semibold">
                        {result.tf_count || result.timeframes?.length || 0}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Recommendation Row */}
                <tr>
                  <td className="py-4 px-4 text-slate-300 font-medium">توصیه</td>
                  {results.map((result) => {
                    const score = getScore(result);
                    const isBest = result.symbol === bestResult.symbol;
                    return (
                      <td key={result.symbol} className="py-4 px-4">
                        <div className="flex flex-col items-center gap-1">
                          {isBest && (
                            <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">
                              ⭐ بهترین
                            </span>
                          )}
                          {score >= 0.7 ? (
                            <span className="text-xs text-emerald-400">✓ قوی</span>
                          ) : score >= 0.5 ? (
                            <span className="text-xs text-amber-400">~ متوسط</span>
                          ) : (
                            <span className="text-xs text-red-400">✗ ضعیف</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Insights */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              💡 تحلیل مقایسه‌ای
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>
                  <strong className="text-white">{bestResult?.symbol}</strong> بالاترین امتیاز 
                  ({(getScore(bestResult) * 100).toFixed(0)}%) را دارد و بهترین فرصت معاملاتی است.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>
                  {results.filter(r => getDirection(r) === 'BULLISH').length} نماد روند صعودی و{' '}
                  {results.filter(r => getDirection(r) === 'BEARISH').length} نماد روند نزولی دارند.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>
                  توصیه می‌شود ابتدا نمادهای با امتیاز بالاتر از ۷۰٪ را بررسی کنید.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
          >
            بستن
          </button>
          <button
            onClick={() => console.log('Open details for best:', bestResult?.symbol)}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all"
          >
            جزئیات {bestResult?.symbol}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPanel;

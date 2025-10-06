import React, { useState } from 'react';
import { Download, FileText, Share2, Clipboard, Check } from 'lucide-react';
import { ScanResult } from '../../types';

interface ExportMenuProps {
  results: ScanResult[];
}

const ExportMenu: React.FC<ExportMenuProps> = ({ results }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const getScore = (result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  };

  const getDirection = (result: ScanResult): string => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
  };

  const handleExportCSV = () => {
    const headers = ['نماد', 'امتیاز', 'جهت', 'تعداد بازه‌های زمانی', 'بازه‌ها'];
    const rows = results.map(r => [
      r.symbol,
      getScore(r).toFixed(2),
      getDirection(r),
      r.tf_count || 0,
      (r.timeframes || []).join('; '),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scanner-results-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleExportJSON = () => {
    const data = results.map(r => ({
      symbol: r.symbol,
      score: getScore(r),
      direction: getDirection(r),
      timeframes: r.timeframes || [],
      tf_count: r.tf_count || 0,
      sample_components: r.sample_components,
    }));

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scanner-results-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleCopyToClipboard = async () => {
    const text = results
      .map(r => `${r.symbol}: ${(getScore(r) * 100).toFixed(0)}% - ${getDirection(r)}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
    setShowMenu(false);
  };

  const handleShare = async () => {
    // Create a shareable summary
    const summary = `🔍 نتایج اسکن بازار\n\n` +
      results.slice(0, 5).map(r => 
        `${r.symbol}: ${(getScore(r) * 100).toFixed(0)}% - ${getDirection(r)}`
      ).join('\n') +
      (results.length > 5 ? `\n\n... و ${results.length - 5} نماد دیگر` : '');

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'نتایج اسکن بازار',
          text: summary,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      await handleCopyToClipboard();
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={results.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700/70 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        <span>خروجی</span>
      </button>

      {showMenu && (
        <div className="absolute left-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 overflow-hidden">
          <button
            onClick={handleExportCSV}
            className="w-full px-4 py-3 text-right hover:bg-slate-700/50 text-slate-300 transition-colors flex items-center gap-3 border-b border-slate-700"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <div className="flex-1">
              <div className="font-medium">خروجی CSV</div>
              <div className="text-xs text-slate-400">برای Excel و Google Sheets</div>
            </div>
          </button>

          <button
            onClick={handleExportJSON}
            className="w-full px-4 py-3 text-right hover:bg-slate-700/50 text-slate-300 transition-colors flex items-center gap-3 border-b border-slate-700"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <div className="flex-1">
              <div className="font-medium">خروجی JSON</div>
              <div className="text-xs text-slate-400">فرمت داده ساختاریافته</div>
            </div>
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="w-full px-4 py-3 text-right hover:bg-slate-700/50 text-slate-300 transition-colors flex items-center gap-3 border-b border-slate-700"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Clipboard className="w-4 h-4 text-blue-400" />
            )}
            <div className="flex-1">
              <div className="font-medium">
                {copied ? 'کپی شد!' : 'کپی متن'}
              </div>
              <div className="text-xs text-slate-400">کپی به کلیپ‌بورد</div>
            </div>
          </button>

          <button
            onClick={handleShare}
            className="w-full px-4 py-3 text-right hover:bg-slate-700/50 text-slate-300 transition-colors flex items-center gap-3"
          >
            <Share2 className="w-4 h-4 text-purple-400" />
            <div className="flex-1">
              <div className="font-medium">اشتراک‌گذاری</div>
              <div className="text-xs text-slate-400">ارسال به دیگران</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportMenu;

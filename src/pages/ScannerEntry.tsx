import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { scanSignals } from '../services/api';
import GlobalTradeControls from '../components/Trading/GlobalTradeControls';

export function ScannerEntry() {
  const {
    scannerFilters,
    scanResults,
    watchlist,
    setScannerFilters,
    setScanResults,
    addWatchSymbol,
    removeWatchSymbol,
  } = useAppStore();

  const [running, setRunning] = useState(false);

  const handleRunScan = async () => {
    try {
      setRunning(true);
      const results = await scanSignals(scannerFilters);
      setScanResults(results || []);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setRunning(false);
    }
  };

  // local editing of filters (timeframes, symbols, score, types etc)
  const handleMinScoreChange = (val: number) => {
    setScannerFilters({
      ...scannerFilters,
      minScore: val,
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-[1920px] mx-auto px-6 py-8">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            اسکنر بازار
          </h1>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT: Trading Controls */}
          <aside className="col-span-12 xl:col-span-3">
            <GlobalTradeControls />
          </aside>

          {/* MIDDLE: Scanner Filters + Results */}
          <section className="col-span-12 xl:col-span-6 flex flex-col gap-6">
            {/* Scan Filters */}
            <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    فیلترهای اسکن
                  </div>
                  <div className="text-[11px] text-slate-400">
                    فیلترها را تنظیم کرده و اسکن را برای فرصت‌های رتبه‌بندی شده اجرا کنید
                  </div>
                </div>

                <button
                  onClick={handleRunScan}
                  disabled={running}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25"
                >
                  {running ? 'در حال اسکن...' : 'اجرای اسکن'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Timeframes */}
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-300 mb-1">
                    بازه‌های زمانی
                  </label>
                  <input
                    className="rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    value={scannerFilters.timeframes.join(',')}
                    onChange={(e) =>
                      setScannerFilters({
                        ...scannerFilters,
                        timeframes: e.target.value
                          .split(',')
                          .map((tf) => tf.trim().toLowerCase())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>

                {/* Symbols */}
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-300 mb-1">
                    نمادها
                  </label>
                  <input
                    className="rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    value={scannerFilters.symbols.join(',')}
                    onChange={(e) =>
                      setScannerFilters({
                        ...scannerFilters,
                        symbols: e.target.value
                          .split(',')
                          .map((s) => s.trim().toUpperCase())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>

              {/* Types / Score */}
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-300 mb-1">
                    انواع سیگنال
                  </label>
                  <div className="flex items-center gap-4 text-xs text-slate-300">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="accent-cyan-500"
                        checked={scannerFilters.signalTypes.includes('SHORT')}
                        onChange={(e) => {
                          const next = new Set(scannerFilters.signalTypes);
                          if (e.target.checked) next.add('SHORT');
                          else next.delete('SHORT');
                          setScannerFilters({
                            ...scannerFilters,
                            signalTypes: Array.from(next),
                          });
                        }}
                      />
                      <span>فروش</span>
                    </label>

                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        className="accent-cyan-500"
                        checked={scannerFilters.signalTypes.includes('LONG')}
                        onChange={(e) => {
                          const next = new Set(scannerFilters.signalTypes);
                          if (e.target.checked) next.add('LONG');
                          else next.delete('LONG');
                          setScannerFilters({
                            ...scannerFilters,
                            signalTypes: Array.from(next),
                          });
                        }}
                      />
                      <span>خرید</span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      حداقل امتیاز
                    </label>
                    <span className="text-[11px] font-semibold text-white">
                      {scannerFilters.minScore}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={scannerFilters.minScore}
                    onChange={(e) => handleMinScoreChange(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Scan Results */}
            <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">
                  نتایج اسکن
                </div>
                <div className="text-[11px] font-medium text-slate-400">
                  {scanResults.length} نتیجه
                </div>
              </div>

              {scanResults.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  هنوز نتیجه‌ای از اسکن وجود ندارد. روی "اجرای اسکن" کلیک کنید.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-white">
                    <thead className="text-[11px] uppercase text-slate-400 border-b border-slate-700/50">
                      <tr>
                        <th className="py-2 text-right">نماد</th>
                        <th className="py-2 text-right">بازه</th>
                        <th className="py-2 text-right">جهت</th>
                        <th className="py-2 text-right">امتیاز</th>
                        <th className="py-2 text-right">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResults.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-700/30 last:border-none hover:bg-slate-700/20"
                        >
                          <td className="py-2 font-semibold">{row.symbol}</td>
                          <td className="py-2 text-slate-300">{row.timeframe}</td>
                          <td
                            className={`py-2 font-medium ${
                              row.type === 'LONG'
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}
                          >
                            {row.type === 'LONG' ? 'خرید' : 'فروش'}
                          </td>
                          <td className="py-2 text-right font-semibold">
                            {row.score}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                              onClick={() => addWatchSymbol(row.symbol)}
                            >
                              + دنبال
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: Watchlist */}
          <aside className="col-span-12 xl:col-span-3 flex flex-col gap-4">
            <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl shadow-lg border border-slate-700/50 p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-white">
                  لیست دنبال‌شده
                </div>
                <div className="text-[11px] font-medium text-slate-400">
                  {watchlist.length} نماد
                </div>
              </div>

              {watchlist.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-8">
                  هیچ نمادی در لیست دنبال‌شده نیست.
                </div>
              ) : (
                <ul className="text-sm text-white divide-y divide-slate-700/30">
                  {watchlist.map((sym) => (
                    <li
                      key={sym}
                      className="flex items-center justify-between py-2 hover:bg-slate-700/20 rounded px-2 transition-colors"
                    >
                      <span className="font-semibold">{sym}</span>
                      <button
                        className="text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors"
                        onClick={() => removeWatchSymbol(sym)}
                      >
                        حذف
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default ScannerEntry;

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
    <div className="w-full h-full flex flex-col gap-6 px-6 py-4 bg-gray-50 text-gray-900">

      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
          Market Scanner
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
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  Scan Filters
                </div>
                <div className="text-[11px] text-gray-500">
                  Adjust filters and run scan for ranked opportunities
                </div>
              </div>

              <button
                onClick={handleRunScan}
                disabled={running}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {running ? 'Scanning…' : 'Run Scan'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Timeframes */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-gray-600 mb-1">
                  Timeframes
                </label>
                <input
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="text-xs font-medium text-gray-600 mb-1">
                  Symbols
                </label>
                <input
                  className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="text-xs font-medium text-gray-600 mb-1">
                  Signal Types
                </label>
                <div className="flex items-center gap-4 text-xs text-gray-700">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
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
                    <span>SHORT</span>
                  </label>

                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
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
                    <span>LONG</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-600">
                    Min Score
                  </label>
                  <span className="text-[11px] font-semibold text-gray-800">
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
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Scan Results */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-800">
                Scan Results
              </div>
              <div className="text-[11px] font-medium text-gray-500">
                {scanResults.length} results
              </div>
            </div>

            {scanResults.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-8">
                No scan results yet. Click "Run Scan".
              </div>
            ) : (
              <table className="w-full text-sm text-gray-800">
                <thead className="text-[11px] uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="py-1 text-left">Symbol</th>
                    <th className="py-1 text-left">TF</th>
                    <th className="py-1 text-left">Direction</th>
                    <th className="py-1 text-right">Score</th>
                    <th className="py-1 text-right">Watch</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResults.map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-100 last:border-none"
                    >
                      <td className="py-2 font-semibold">{row.symbol}</td>
                      <td className="py-2">{row.timeframe}</td>
                      <td
                        className={`py-2 font-medium ${
                          row.type === 'LONG'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {row.type}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {row.score}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                          onClick={() => addWatchSymbol(row.symbol)}
                        >
                          + Watch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* RIGHT: Watchlist */}
        <aside className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-gray-800">
                Watchlist
              </div>
              <div className="text-[11px] font-medium text-gray-500">
                {watchlist.length} symbols
              </div>
            </div>

            {watchlist.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-8">
                No symbols in watchlist.
              </div>
            ) : (
              <ul className="text-sm text-gray-800 divide-y divide-gray-100">
                {watchlist.map((sym) => (
                  <li
                    key={sym}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="font-semibold">{sym}</span>
                    <button
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                      onClick={() => removeWatchSymbol(sym)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ScannerEntry;

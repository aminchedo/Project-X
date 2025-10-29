import React, { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { scanSignals } from '../../services/api';

export function GlobalTradeControls() {
  const {
    currentSymbol,
    timeframe,
    leverage,
    riskProfile,
    scannerFilters,
    setSymbol,
    setTimeframe,
    setLeverage,
    setRiskProfile,
    setScanResults,
  } = useAppStore();

  const [loading, setLoading] = useState(false);

  // quick scan uses the synced scannerFilters from the store
  const handleQuickScan = async () => {
    try {
      setLoading(true);
      const results = await scanSignals(scannerFilters);
      setScanResults(results || []);
    } catch (err) {
      console.error('Quick Scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
          Trading Controls
        </h2>
        <span className="text-[10px] font-medium text-gray-400 uppercase">
          Auto-syncs scanner filters
        </span>
      </div>

      {/* Symbol / Timeframe */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">
            Symbol
          </label>
          <select
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={currentSymbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            <option value="BTCUSDT">BTCUSDT</option>
            <option value="ETHUSDT">ETHUSDT</option>
            <option value="SOLUSDT">SOLUSDT</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">
            Timeframe
          </label>
          <select
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
          </select>
        </div>
      </div>

      {/* Leverage / Risk Profile */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600">
              Leverage
            </label>
            <span className="text-[11px] font-semibold text-gray-800">
              {leverage}x
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={25}
            step={1}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600 mb-1">
            Risk Profile
          </label>
          <select
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={riskProfile}
            onChange={(e) => setRiskProfile(e.target.value as any)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* CTA */}
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-md py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleQuickScan}
        disabled={loading}
      >
        {loading ? 'Scanning…' : 'Quick Scan'}
      </button>
    </div>
  );
}

export default GlobalTradeControls;

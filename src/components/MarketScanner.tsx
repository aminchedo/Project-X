import React, { useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import { useScannerConfig } from '../state/hooks';
import { api } from '../services/api';
import { ScanResponse, ScanResult } from '../types';
import ScoreGauge from './showcase/ScoreGauge';
import DirectionPill from './showcase/DirectionPill';
import Loading from './Loading';
import Empty from './Empty';
import ErrorBlock from './ErrorBlock';

interface MarketScannerProps {
  onOpenDetails?: (symbol: string) => void;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({ onOpenDetails }) => {
  const config = useScannerConfig();
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  // Local symbol and timeframe input (editable)
  const [symbolsInput, setSymbolsInput] = useState(config.symbols.join(', '));
  const [timeframesInput, setTimeframesInput] = useState(config.timeframes.join(', '));

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    setHasScanned(true);

    try {
      // Parse inputs
      const symbols = symbolsInput.split(',').map(s => s.trim()).filter(Boolean);
      const timeframes = timeframesInput.split(',').map(t => t.trim()).filter(Boolean);

      if (symbols.length === 0) {
        throw new Error('لطفاً حداقل یک نماد وارد کنید');
      }
      if (timeframes.length === 0) {
        throw new Error('لطفاً حداقل یک بازه زمانی وارد کنید');
      }

      const scanRequest = {
        symbols,
        timeframes,
        weights: config.weights,
        rules: {
          min_score: config.rules.any_tf,
          min_confidence: config.rules.majority_tf,
          max_risk_level: config.rules.mode === 'aggressive' ? 'HIGH' : 'MEDIUM'
        }
      };

      console.log('Scanner request:', scanRequest);
      const response = await api.trading.runScanner(scanRequest);
      
      // Be tolerant to backend response variations
      const scanResults = response.results || response.result || [];
      
      // Sort by score (descending)
      const sorted = scanResults.sort((a, b) => {
        const scoreA = a.overall_score ?? a.final_score ?? a.score ?? 0;
        const scoreB = b.overall_score ?? b.final_score ?? b.score ?? 0;
        return scoreB - scoreA;
      });

      setResults(sorted);
      setError(null);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(err.message || 'خطا در اسکن بازار');
      setResults([]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isScanning) {
      handleScan();
    }
  };

  // Helper to extract score from result
  const getScore = (result: ScanResult): number => {
    return result.overall_score ?? result.final_score ?? result.score ?? 0;
  };

  // Helper to extract direction from result
  const getDirection = (result: ScanResult): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
    return result.overall_direction ?? result.direction ?? 'NEUTRAL';
  };

  // Helper to extract timeframe count
  const getTfCount = (result: ScanResult): number => {
    return result.tf_count ?? result.timeframes?.length ?? 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">اسکنر بازار</h2>
          <p className="text-slate-400 text-sm">
            اسکن چند بازه زمانی با استراتژی ترکیبی الگوریتم‌ها
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Symbols Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              نمادها (با کاما جدا کنید)
            </label>
            <input
              type="text"
              value={symbolsInput}
              onChange={(e) => setSymbolsInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="BTCUSDT, ETHUSDT, SOLUSDT"
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none"
              disabled={isScanning}
            />
          </div>

          {/* Timeframes Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              بازه‌های زمانی (با کاما جدا کنید)
            </label>
            <input
              type="text"
              value={timeframesInput}
              onChange={(e) => setTimeframesInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="15m, 1h, 4h"
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none"
              disabled={isScanning}
            />
          </div>
        </div>

        {/* Scan Button */}
        <button
          onClick={handleScan}
          disabled={isScanning}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isScanning
              ? 'bg-slate-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:shadow-cyan-500/25'
          } text-white`}
        >
          <Search className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'در حال اسکن...' : 'اسکن بازار'}</span>
        </button>
      </div>

      {/* Results Section */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 animate-pulse"></div>
            نتایج اسکن
          </h3>
          {results.length > 0 && (
            <span className="text-sm text-slate-400">
              {results.length} فرصت پیدا شد
            </span>
          )}
        </div>

        {/* Loading State */}
        {isScanning && <Loading message="در حال تحلیل نمادها..." />}

        {/* Error State */}
        {!isScanning && error && (
          <ErrorBlock
            message={error}
            onRetry={handleScan}
          />
        )}

        {/* Empty State */}
        {!isScanning && !error && hasScanned && results.length === 0 && (
          <Empty
            icon="🔍"
            title="فرصتی یافت نشد"
            description="هیچ نمادی با معیارهای تنظیم شده مطابقت نداشت. تنظیمات را تغییر دهید یا نمادهای بیشتری امتحان کنید."
          />
        )}

        {/* Results Table */}
        {!isScanning && !error && results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/30 border-b border-slate-700/50">
                  <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">
                    نماد
                  </th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">
                    امتیاز نهایی
                  </th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">
                    جهت
                  </th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">
                    تعداد TF
                  </th>
                  <th className="text-center py-3 px-4 text-slate-400 font-medium text-sm">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr
                    key={`${result.symbol}-${index}`}
                    className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onOpenDetails) {
                        onOpenDetails(result.symbol);
                      }
                    }}
                  >
                    {/* Symbol */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white text-lg">
                        {result.symbol}
                      </div>
                    </td>

                    {/* Score Gauge */}
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <ScoreGauge score={getScore(result)} size="sm" showLabel={false} />
                      </div>
                    </td>

                    {/* Direction */}
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <DirectionPill direction={getDirection(result)} size="sm" />
                      </div>
                    </td>

                    {/* TF Count */}
                    <td className="py-4 px-4 text-center">
                      <span className="text-slate-300 font-mono">
                        {getTfCount(result)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onOpenDetails && onOpenDetails(result.symbol)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>جزئیات</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Initial State (before first scan) */}
        {!isScanning && !error && !hasScanned && (
          <Empty
            icon="📊"
            title="آماده برای اسکن"
            description="نمادها و بازه‌های زمانی را وارد کنید و دکمه اسکن را فشار دهید"
          />
        )}
      </div>
    </div>
  );
};

export default MarketScanner;

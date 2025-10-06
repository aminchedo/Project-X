import React, { useState } from 'react';
import { Play, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useScannerConfig } from '../state/hooks';
import Loading from './Loading';
import ErrorBlock from './ErrorBlock';

const BacktestPanel: React.FC = () => {
  const config = useScannerConfig();
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Backtest configuration
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [initialCapital, setInitialCapital] = useState(10000);

  const runBacktest = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const backtestConfig = {
        symbols: config.symbols,
        timeframes: config.timeframes,
        weights: config.weights,
        rules: config.rules,
        start_date: startDate,
        end_date: endDate,
        initial_capital: initialCapital
      };
      
      const response = await api.trading.runBacktest(backtestConfig);
      setResults(response);
    } catch (err: any) {
      console.error('Backtest error:', err);
      setError(err.message || 'خطا در اجرای بک‌تست');
      
      // Fallback to mock data for demo
      setResults({
        totalTrades: 45,
        winRate: 68.9,
        profitFactor: 2.34,
        maxDrawdown: -12.5,
        totalReturn: 34.2,
        sharpeRatio: 1.87,
        _isMock: true
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <h2 className="text-xl font-bold text-white mb-6">تنظیمات بک‌تست</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              تاریخ شروع
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-cyan-500/50 focus:outline-none"
              disabled={isRunning}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              تاریخ پایان
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-cyan-500/50 focus:outline-none"
              disabled={isRunning}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              سرمایه اولیه ($)
            </label>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(parseFloat(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-cyan-500/50 focus:outline-none"
              disabled={isRunning}
            />
          </div>
        </div>
        
        <button
          onClick={runBacktest}
          disabled={isRunning}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isRunning
              ? 'bg-slate-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-500/25'
          } text-white`}
        >
          {isRunning ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              <span>در حال اجرای بک‌تست...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>اجرای بک‌تست</span>
            </>
          )}
        </button>
      </div>

      {/* Error State */}
      {error && !results && (
        <ErrorBlock message={error} onRetry={runBacktest} />
      )}

      {/* Loading State */}
      {isRunning && <Loading message="در حال شبیه‌سازی معاملات..." />}

      {/* Results Card */}
      {results && !isRunning && (
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-400 animate-pulse ml-3"></div>
              نتایج بک‌تست
            </h2>
            {results._isMock && (
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                داده‌های نمونه (سرور در دسترس نیست)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-slate-400 text-sm mb-2">تعداد معاملات</div>
              <div className="text-2xl font-bold text-white">{results.totalTrades}</div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-slate-400 text-sm mb-2">نرخ برد</div>
              <div className="text-2xl font-bold text-emerald-400">{results.winRate}%</div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-slate-400 text-sm mb-2">ضریب سود</div>
              <div className="text-2xl font-bold text-cyan-400">{results.profitFactor}</div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-slate-400 text-sm mb-2">حداکثر افت</div>
              <div className="text-2xl font-bold text-red-400">{results.maxDrawdown}%</div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-slate-400 text-sm mb-2">بازده کل</div>
              <div className="text-2xl font-bold text-emerald-400">{results.totalReturn}%</div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-slate-400 text-sm mb-2">نسبت شارپ</div>
              <div className="text-2xl font-bold text-purple-400">{results.sharpeRatio}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BacktestPanel;

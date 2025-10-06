import React, { useState, useEffect } from 'react';
import { Search, Zap, RefreshCw } from 'lucide-react';

interface ScanButtonsProps {
  onDeepScan: () => void;
  onQuickScan: () => void;
  isScanning: boolean;
  autoRefresh: boolean;
  autoRefreshInterval: number; // in seconds
  onAutoRefreshToggle: (enabled: boolean, interval?: number) => void;
}

const REFRESH_OPTIONS = [
  { value: 60, label: '۱ دقیقه' },
  { value: 300, label: '۵ دقیقه' },
  { value: 900, label: '۱۵ دقیقه' },
  { value: 1800, label: '۳۰ دقیقه' },
];

const ScanButtons: React.FC<ScanButtonsProps> = ({
  onDeepScan,
  onQuickScan,
  isScanning,
  autoRefresh,
  autoRefreshInterval,
  onAutoRefreshToggle,
}) => {
  const [countdown, setCountdown] = useState(autoRefreshInterval);
  const [showRefreshOptions, setShowRefreshOptions] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (autoRefresh) {
      setCountdown(autoRefreshInterval);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return autoRefreshInterval;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, autoRefreshInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col md:flex-row gap-3">
      {/* Deep Scan Button (Primary) */}
      <button
        onClick={onDeepScan}
        disabled={isScanning}
        className={`
          flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg
          transition-all duration-300 transform
          ${isScanning
            ? 'bg-slate-600 cursor-not-allowed opacity-50'
            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:shadow-2xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]'
          }
          text-white shadow-xl
        `}
      >
        <Search className={`w-6 h-6 ${isScanning ? 'animate-spin' : ''}`} />
        <span>{isScanning ? 'در حال اسکن عمیق...' : '🔍 اسکن عمیق'}</span>
      </button>
      
      {/* Quick Scan Button (Secondary) */}
      <button
        onClick={onQuickScan}
        disabled={isScanning}
        className={`
          flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold
          transition-all duration-200
          ${isScanning
            ? 'bg-slate-700 cursor-not-allowed opacity-50'
            : 'bg-slate-700/70 hover:bg-slate-700 border border-slate-600'
          }
          text-white
        `}
      >
        <Zap className="w-5 h-5" />
        <span>⚡ اسکن سریع</span>
      </button>
      
      {/* Auto-Refresh Toggle */}
      <div className="relative">
        <button
          onClick={() => setShowRefreshOptions(!showRefreshOptions)}
          className={`
            h-full px-4 py-4 rounded-xl font-semibold transition-all duration-200 border
            ${autoRefresh
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-slate-700/70 border-slate-600 text-slate-300 hover:bg-slate-700'
            }
            flex items-center gap-2
          `}
        >
          <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-70">تازه‌سازی خودکار</span>
            {autoRefresh ? (
              <span className="text-sm font-mono">{formatTime(countdown)}</span>
            ) : (
              <span className="text-sm">خاموش</span>
            )}
          </div>
        </button>
        
        {/* Dropdown Options */}
        {showRefreshOptions && (
          <div className="absolute left-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
            <button
              onClick={() => {
                onAutoRefreshToggle(false);
                setShowRefreshOptions(false);
              }}
              className="w-full px-4 py-3 text-right hover:bg-slate-700/50 text-slate-300 transition-colors border-b border-slate-700"
            >
              ❌ خاموش
            </button>
            {REFRESH_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onAutoRefreshToggle(true, option.value);
                  setShowRefreshOptions(false);
                }}
                className={`
                  w-full px-4 py-3 text-right hover:bg-slate-700/50 transition-colors
                  ${autoRefreshInterval === option.value && autoRefresh
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-300'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanButtons;

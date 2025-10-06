import React from 'react';
import { Clock } from 'lucide-react';

interface TimeframePreset {
  id: string;
  label: string;
  timeframes: string[];
}

const TIMEFRAME_PRESETS: TimeframePreset[] = [
  { id: 'scalp', label: '⚡ اسکالپ', timeframes: ['1m', '5m', '15m'] },
  { id: 'day', label: '📈 روزانه', timeframes: ['15m', '1h', '4h'] },
  { id: 'swing', label: '📊 سوئینگ', timeframes: ['4h', '1d', '1w'] },
];

const ALL_TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '1w'];

interface TimeframeSelectorProps {
  timeframes: string[];
  onChange: (timeframes: string[]) => void;
  disabled?: boolean;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({ timeframes, onChange, disabled }) => {
  const handleToggleTimeframe = (tf: string) => {
    if (timeframes.includes(tf)) {
      // Prevent removing last timeframe
      if (timeframes.length === 1) return;
      onChange(timeframes.filter(t => t !== tf));
    } else {
      onChange([...timeframes, tf]);
    }
  };

  const handlePresetClick = (preset: TimeframePreset) => {
    onChange(preset.timeframes);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-300 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        بازه‌های زمانی ({timeframes.length} انتخاب شده)
      </label>
      
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {TIMEFRAME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset)}
            disabled={disabled}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-sm font-medium hover:from-purple-500/30 hover:to-pink-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {preset.label}
          </button>
        ))}
      </div>
      
      {/* Individual Timeframes */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
        {ALL_TIMEFRAMES.map((tf) => {
          const isActive = timeframes.includes(tf);
          
          return (
            <button
              key={tf}
              onClick={() => handleToggleTimeframe(tf)}
              disabled={disabled}
              className={`
                px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200 border
                ${isActive
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:bg-slate-700/50 hover:border-slate-500/50 hover:text-slate-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              aria-pressed={isActive}
            >
              {tf}
            </button>
          );
        })}
      </div>
      
      {/* Helper Text */}
      <p className="text-xs text-slate-400">
        💡 حداقل ۱ بازه زمانی لازم است. بازه‌های کوتاه‌تر برای معاملات سریع‌تر مناسب‌اند.
      </p>
    </div>
  );
};

export default TimeframeSelector;

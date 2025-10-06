import React from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { AdvancedFilterConfig } from '../../pages/Scanner';

interface AdvancedFiltersProps {
  filters: AdvancedFilterConfig;
  onChange: (filters: Partial<AdvancedFilterConfig>) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({ 
  filters, 
  onChange, 
  isExpanded, 
  onToggle 
}) => {
  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-700/30 border border-slate-600/30 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300"
      >
        <span className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="w-4 h-4" />
          فیلترهای پیشرفته
        </span>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      
      {/* Expandable Content */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-900/30 border border-slate-700/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Score Range */}
          <div className="space-y-2">
            <label htmlFor="score-min" className="block text-sm font-medium text-slate-300">
              محدوده امتیاز
            </label>
            <div className="flex items-center gap-3">
              <input
                id="score-min"
                name="score-min"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={filters.scoreMin}
                onChange={(e) => onChange({ scoreMin: parseFloat(e.target.value) || 0 })}
                className="w-20 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
              />
              <span className="text-slate-400">تا</span>
              <input
                id="score-max"
                name="score-max"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={filters.scoreMax}
                onChange={(e) => onChange({ scoreMax: parseFloat(e.target.value) || 1 })}
                className="w-20 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
              />
            </div>
            <p className="text-xs text-slate-400">
              فقط امتیازهای بین {filters.scoreMin} و {filters.scoreMax}
            </p>
          </div>
          
          {/* Price Change Filter */}
          <div className="space-y-2">
            <label htmlFor="price-change" className="block text-sm font-medium text-slate-300">
              تغییر قیمت (۲۴ ساعت)
            </label>
            <select
              id="price-change"
              name="price-change"
              value={filters.priceChange}
              onChange={(e) => onChange({ priceChange: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
            >
              <option value="any">همه</option>
              <option value="gainers">صعودی (&gt;0%)</option>
              <option value="losers">نزولی (&lt;0%)</option>
              <option value="bigmovers">حرکت بزرگ (&gt;5%)</option>
            </select>
          </div>
          
          {/* Volume Filter */}
          <div className="space-y-2">
            <label htmlFor="volume-min" className="block text-sm font-medium text-slate-300">
              حداقل حجم معاملات
            </label>
            <input
              id="volume-min"
              name="volume-min"
              type="number"
              min="0"
              step="1000000"
              value={filters.volumeMin}
              onChange={(e) => onChange({ volumeMin: parseFloat(e.target.value) || 0 })}
              placeholder="۰ (بدون محدودیت)"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              حجم به دلار (مثلاً ۱۰۰۰۰۰۰۰ = ۱۰M)
            </p>
          </div>
          
          {/* Signal Count */}
          <div className="space-y-2">
            <label htmlFor="signal-count" className="block text-sm font-medium text-slate-300">
              حداقل تعداد سیگنال فعال
            </label>
            <div className="flex items-center gap-3">
              <input
                id="signal-count"
                name="signal-count"
                type="range"
                min="0"
                max="9"
                value={filters.signalCountMin}
                onChange={(e) => onChange({ signalCountMin: parseInt(e.target.value) })}
                className="flex-1 accent-cyan-500"
              />
              <span className="w-12 px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-center text-white text-sm font-mono">
                {filters.signalCountMin}
              </span>
            </div>
          </div>
          
          {/* Timeframe Agreement */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-slate-300">
              توافق بازه‌های زمانی
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'any', label: 'حداقل یکی' },
                { value: 'majority', label: 'اکثریت' },
                { value: 'full', label: 'اجماع کامل' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => onChange({ tfAgreement: option.value as any })}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all border
                    ${filters.tfAgreement === option.value
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:bg-slate-700/50'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Reset Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={() => onChange({
                scoreMin: 0,
                scoreMax: 1,
                priceChange: 'any',
                volumeMin: 0,
                signalCountMin: 0,
                tfAgreement: 'any',
              })}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
            >
              بازنشانی فیلترها
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;

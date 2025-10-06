import React from 'react';
import { ScanRules } from '../state/store';
import { Settings, TrendingUp, Shield } from 'lucide-react';

interface RulesConfigProps {
  rules: ScanRules;
  onChange: (rules: Partial<ScanRules>) => void;
}

export const RulesConfig: React.FC<RulesConfigProps> = ({ rules, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h4 className="text-lg font-semibold text-white">حالت معاملاتی</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onChange({ mode: 'conservative' })}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              rules.mode === 'conservative'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className={`w-5 h-5 ${rules.mode === 'conservative' ? 'text-cyan-400' : 'text-slate-400'}`} />
            </div>
            <div className="text-center">
              <div className={`font-semibold mb-1 ${rules.mode === 'conservative' ? 'text-white' : 'text-slate-300'}`}>
                محافظه‌کارانه
              </div>
              <div className="text-xs text-slate-400">
                ریسک پایین، دقت بالا
              </div>
            </div>
          </button>

          <button
            onClick={() => onChange({ mode: 'aggressive' })}
            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
              rules.mode === 'aggressive'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className={`w-5 h-5 ${rules.mode === 'aggressive' ? 'text-cyan-400' : 'text-slate-400'}`} />
            </div>
            <div className="text-center">
              <div className={`font-semibold mb-1 ${rules.mode === 'aggressive' ? 'text-white' : 'text-slate-300'}`}>
                تهاجمی
              </div>
              <div className="text-xs text-slate-400">
                ریسک بالا، فرصت بیشتر
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Threshold Knobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Any TF Threshold */}
        <div className="space-y-3">
          <label htmlFor="any-tf-threshold" className="text-sm font-medium text-white block">
            حداقل امتیاز (هر بازه زمانی)
          </label>
          <div className="flex items-center gap-4">
            <input
              id="any-tf-threshold"
              name="any-tf-threshold"
              type="range"
              min="0"
              max="100"
              value={rules.any_tf * 100}
              onChange={(e) => onChange({ any_tf: parseFloat(e.target.value) / 100 })}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-emerald-500 
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-emerald-500/50
                [&::-moz-range-thumb]:w-4 
                [&::-moz-range-thumb]:h-4 
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-emerald-500 
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <span className="text-lg font-bold text-emerald-400 min-w-[50px] text-center">
              {(rules.any_tf * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-slate-400">
            حداقل امتیازی که یک بازه زمانی باید داشته باشد
          </p>
        </div>

        {/* Majority TF Threshold */}
        <div className="space-y-3">
          <label htmlFor="majority-tf-threshold" className="text-sm font-medium text-white block">
            حداقل امتیاز (اکثریت بازه‌ها)
          </label>
          <div className="flex items-center gap-4">
            <input
              id="majority-tf-threshold"
              name="majority-tf-threshold"
              type="range"
              min="0"
              max="100"
              value={rules.majority_tf * 100}
              onChange={(e) => onChange({ majority_tf: parseFloat(e.target.value) / 100 })}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-amber-500 
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-amber-500/50
                [&::-moz-range-thumb]:w-4 
                [&::-moz-range-thumb]:h-4 
                [&::-moz-range-thumb]:rounded-full 
                [&::-moz-range-thumb]:bg-amber-500 
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
            />
            <span className="text-lg font-bold text-amber-400 min-w-[50px] text-center">
              {(rules.majority_tf * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-slate-400">
            حداقل امتیازی که اکثریت بازه‌ها باید داشته باشند
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
        <h5 className="text-sm font-medium text-slate-400 mb-3">خلاصه تنظیمات</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400">حالت:</span>
            <span className="mr-2 font-semibold text-white">
              {rules.mode === 'aggressive' ? 'تهاجمی' : 'محافظه‌کارانه'}
            </span>
          </div>
          <div>
            <span className="text-slate-400">آستانه هر TF:</span>
            <span className="mr-2 font-semibold text-emerald-400">
              {(rules.any_tf * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400">آستانه اکثریت:</span>
            <span className="mr-2 font-semibold text-amber-400">
              {(rules.majority_tf * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400">سطح ریسک:</span>
            <span className="mr-2 font-semibold text-white">
              {rules.mode === 'aggressive' ? 'بالا' : 'متوسط'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesConfig;

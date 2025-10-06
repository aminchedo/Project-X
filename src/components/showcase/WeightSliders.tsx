import React from 'react';
import { WeightConfig } from '../state/store';

interface WeightSlidersProps {
  weights: WeightConfig;
  onChange: (weights: Partial<WeightConfig>) => void;
}

const detectorLabels: Record<keyof WeightConfig, string> = {
  harmonic: 'هارمونیک',
  elliott: 'امواج الیوت',
  smc: 'SMC',
  fibonacci: 'فیبوناچی',
  price_action: 'پرایس اکشن',
  sar: 'SAR',
  sentiment: 'احساسات',
  news: 'اخبار',
  whales: 'نهنگ‌ها'
};

export const WeightSliders: React.FC<WeightSlidersProps> = ({ weights, onChange }) => {
  const handleChange = (key: keyof WeightConfig, value: number) => {
    onChange({ [key]: value });
  };

  // Calculate total weight
  const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(totalWeight - 1.0) < 0.01;

  return (
    <div className="space-y-6">
      {/* Total Weight Indicator */}
      <div className={`p-4 rounded-lg border ${
        isValid 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : 'bg-amber-500/10 border-amber-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">مجموع وزن‌ها</span>
          <span className={`text-lg font-bold ${
            isValid ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {(totalWeight * 100).toFixed(1)}%
          </span>
        </div>
        {!isValid && (
          <p className="text-xs text-amber-400 mt-2">
            مجموع وزن‌ها باید ۱۰۰٪ باشد (خودکار نرمال‌سازی می‌شود)
          </p>
        )}
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(weights) as Array<keyof WeightConfig>).map((key) => {
          const value = weights[key];
          const percentage = (value * 100).toFixed(0);

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                  {detectorLabels[key]}
                </label>
                <span className="text-sm font-mono font-bold text-cyan-400">
                  {percentage}%
                </span>
              </div>
              
              <input
                id={`weight-${key}`}
                name={`weight-${key}`}
                type="range"
                min="0"
                max="100"
                value={value * 100}
                onChange={(e) => handleChange(key, parseFloat(e.target.value) / 100)}
                aria-label={`${key} weight`}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer 
                  [&::-webkit-slider-thumb]:appearance-none 
                  [&::-webkit-slider-thumb]:w-4 
                  [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-cyan-500 
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-cyan-500/50
                  [&::-webkit-slider-thumb]:hover:bg-cyan-400
                  [&::-moz-range-thumb]:w-4 
                  [&::-moz-range-thumb]:h-4 
                  [&::-moz-range-thumb]:rounded-full 
                  [&::-moz-range-thumb]:bg-cyan-500 
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:shadow-cyan-500/50
                  [&::-moz-range-thumb]:hover:bg-cyan-400"
              />
              
              {/* Visual indicator bar */}
              <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-200"
                  style={{ width: `${value * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeightSliders;

import React from 'react';
import { ComponentScore } from '../../types/index';
import DirectionPill from './DirectionPill';

interface ComponentBreakdownProps {
  components: ComponentScore[];
}

const detectorLabels: Record<string, string> = {
  harmonic: 'هارمونیک',
  elliott: 'امواج الیوت',
  smc: 'SMC',
  fibonacci: 'فیبوناچی',
  price_action: 'پرایس اکشن',
  sar: 'SAR',
  sentiment: 'احساسات بازار',
  news: 'اخبار',
  whales: 'نهنگ‌ها'
};

export const ComponentBreakdown: React.FC<ComponentBreakdownProps> = ({ components }) => {
  if (!components || components.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        <p>اطلاعات اجزای سیگنال در دسترس نیست</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {components.map((component, index) => (
        <div
          key={`${component.detector}-${index}`}
          className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">
              {detectorLabels[component.detector] || component.detector}
            </h4>
            <DirectionPill direction={component.direction} size="sm" showIcon={false} />
          </div>

          {/* Score Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">امتیاز</span>
              <span className="text-sm font-mono font-bold text-white">
                {(component.score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  component.score >= 0.7
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : component.score >= 0.3
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${component.score * 100}%` }}
              />
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">اطمینان</span>
            <span className="font-mono text-slate-300">
              {(component.confidence * 100).toFixed(0)}%
            </span>
          </div>

          {/* Meta Info (if available) */}
          {component.meta && Object.keys(component.meta).length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="text-xs text-slate-400 space-y-1">
                {Object.entries(component.meta).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="truncate">{key}:</span>
                    <span className="font-mono text-slate-300">
                      {typeof value === 'number' ? value.toFixed(2) : String(value).slice(0, 20)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ComponentBreakdown;

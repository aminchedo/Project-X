/**
 * PortfolioEntry - Portfolio Management Page
 *
 * Shows: Open positions, P&L breakdown, risk metrics
 */

import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { usePortfolioSync } from '../hooks/usePortfolioSync';

export const PortfolioEntry: React.FC = () => {
  // Enable polling
  usePortfolioSync(true);

  // Read from global store
  const {
    portfolioSummary,
    pnlSummary,
    riskSnapshot,
  } = useAppStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white">مدیریت پورتفولیو</h1>

        {/* P&L Summary Cards */}
        {pnlSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/30 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 shadow-lg">
              <div className="text-sm text-slate-400 mb-2">سود/زیان محقق شده</div>
              <div className={`text-3xl font-bold ${pnlSummary.realized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${pnlSummary.realized.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">موقعیت‌های بسته شده</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 shadow-lg">
              <div className="text-sm text-slate-400 mb-2">سود/زیان محقق نشده</div>
              <div className={`text-3xl font-bold ${pnlSummary.unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${pnlSummary.unrealized.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">موقعیت‌های باز</div>
            </div>

            <div className="bg-slate-800/30 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 shadow-lg">
              <div className="text-sm text-slate-400 mb-2">مجموع سود/زیان</div>
              <div className={`text-3xl font-bold ${pnlSummary.total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${pnlSummary.total.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">ترکیبی</div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 shadow-lg text-center">
            <div className="text-slate-400">هیچ داده سود/زیانی در دسترس نیست</div>
          </div>
        )}

        {/* Risk Snapshot */}
        {riskSnapshot ? (
          <div className="bg-slate-800/30 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">وضعیت ریسک</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-slate-400 mb-1">ریسک انحلال</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${
                    riskSnapshot.liquidationRisk < 20 ? 'text-emerald-400' :
                    riskSnapshot.liquidationRisk < 50 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {riskSnapshot.liquidationRisk.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    {riskSnapshot.liquidationRisk < 20 ? 'ریسک پایین' :
                     riskSnapshot.liquidationRisk < 50 ? 'ریسک متوسط' :
                     'ریسک بالا'}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-slate-400 mb-1">استفاده از مارجین</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${
                    riskSnapshot.marginUsage < 50 ? 'text-emerald-400' :
                    riskSnapshot.marginUsage < 75 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {riskSnapshot.marginUsage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    {riskSnapshot.marginUsage < 50 ? 'سالم' :
                     riskSnapshot.marginUsage < 75 ? 'متوسط' :
                     'بحرانی'}
                  </span>
                </div>
              </div>
            </div>
            {riskSnapshot.notes && (
              <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded text-sm text-blue-300">
                {riskSnapshot.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 shadow-lg text-center">
            <div className="text-slate-400">هیچ داده ریسکی در دسترس نیست</div>
          </div>
        )}

        {/* Open Positions */}
        {portfolioSummary ? (
          <div className="bg-slate-800/30 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">موقعیت‌های باز</h2>

            {portfolioSummary.positions.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                هیچ موقعیت بازی وجود ندارد
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-right py-3 px-3 text-slate-400 font-medium">نماد</th>
                      <th className="text-right py-3 px-3 text-slate-400 font-medium">حجم</th>
                      <th className="text-right py-3 px-3 text-slate-400 font-medium">ورود</th>
                      <th className="text-right py-3 px-3 text-slate-400 font-medium">اهرم</th>
                      <th className="text-right py-3 px-3 text-slate-400 font-medium">سود/زیان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioSummary.positions.map((pos, idx) => (
                      <tr key={idx} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="py-3 px-3 font-medium text-white">{pos.symbol}</td>
                        <td className="py-3 px-3 text-right text-slate-300">{pos.size.toFixed(4)}</td>
                        <td className="py-3 px-3 text-right text-slate-300">${pos.entry.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-slate-300">{pos.leverage}x</td>
                        <td className={`py-3 px-3 text-right font-bold ${
                          pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          ${pos.pnl.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">مجموع اکسپوژر:</span>
                <span className="font-bold text-white">${portfolioSummary.exposureUsd.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-lg p-6 rounded-xl border border-slate-700/50 shadow-lg text-center">
            <div className="text-slate-400">هیچ داده پورتفولیویی در دسترس نیست</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioEntry;

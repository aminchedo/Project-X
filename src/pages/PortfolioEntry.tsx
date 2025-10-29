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
    <div className="p-6 space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold">Portfolio Management</h1>

      {/* P&L Summary Cards */}
      {pnlSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">Realized P&L</div>
            <div className={`text-3xl font-bold ${pnlSummary.realized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${pnlSummary.realized.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Closed positions</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">Unrealized P&L</div>
            <div className={`text-3xl font-bold ${pnlSummary.unrealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${pnlSummary.unrealized.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Open positions</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600 mb-2">Total P&L</div>
            <div className={`text-3xl font-bold ${pnlSummary.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${pnlSummary.total.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Combined</div>
          </div>
        </div>
      )}

      {/* Risk Snapshot */}
      {riskSnapshot && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Risk Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Liquidation Risk</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  riskSnapshot.liquidationRisk < 20 ? 'text-green-600' :
                  riskSnapshot.liquidationRisk < 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {riskSnapshot.liquidationRisk.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">
                  {riskSnapshot.liquidationRisk < 20 ? 'Low Risk' :
                   riskSnapshot.liquidationRisk < 50 ? 'Medium Risk' :
                   'High Risk'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Margin Usage</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${
                  riskSnapshot.marginUsage < 50 ? 'text-green-600' :
                  riskSnapshot.marginUsage < 75 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {riskSnapshot.marginUsage.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">
                  {riskSnapshot.marginUsage < 50 ? 'Healthy' :
                   riskSnapshot.marginUsage < 75 ? 'Moderate' :
                   'Critical'}
                </span>
              </div>
            </div>
          </div>
          {riskSnapshot.notes && (
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
              {riskSnapshot.notes}
            </div>
          )}
        </div>
      )}

      {/* Open Positions */}
      {portfolioSummary && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Open Positions</h2>
          
          {portfolioSummary.positions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No open positions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Symbol</th>
                    <th className="text-right py-2 px-3">Size</th>
                    <th className="text-right py-2 px-3">Entry</th>
                    <th className="text-right py-2 px-3">Leverage</th>
                    <th className="text-right py-2 px-3">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioSummary.positions.map((pos, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium">{pos.symbol}</td>
                      <td className="py-3 px-3 text-right">{pos.size.toFixed(4)}</td>
                      <td className="py-3 px-3 text-right">${pos.entry.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right">{pos.leverage}x</td>
                      <td className={`py-3 px-3 text-right font-bold ${
                        pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${pos.pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Exposure:</span>
              <span className="font-bold">${portfolioSummary.exposureUsd.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioEntry;

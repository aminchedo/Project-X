import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Bell, Search, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface CompactHeaderProps {
  // No props needed - all data comes from store
}

const CompactHeader: React.FC<CompactHeaderProps> = () => {
  const {
    connectionStatus,
    ticker,
    pnlSummary,
    riskSnapshot,
    currentSymbol,
  } = useAppStore();
  const wsStatusConfig = {
    connected: { color: 'text-emerald-400', icon: Wifi },
    disconnected: { color: 'text-red-400', icon: WifiOff },
    connecting: { color: 'text-amber-400', icon: Wifi },
    reconnecting: { color: 'text-amber-400', icon: Wifi },
    error: { color: 'text-red-400', icon: WifiOff },
  };

  const statusInfo = wsStatusConfig[connectionStatus] || wsStatusConfig.disconnected;
  const StatusIcon = statusInfo.icon;

  return (
    <motion.header
      className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-50 hidden sm:inline">Trading Console</span>
          </div>

          {/* Live Market Data from Store */}
          <div className="flex-1 flex items-center gap-4 overflow-x-auto scrollbar-hide px-4">
            {ticker ? (
              <motion.div
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-sm font-medium text-slate-300">{currentSymbol}</span>
                <span className="text-sm font-bold text-slate-50">
                  ${ticker.last.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span>Bid: ${ticker.bid.toFixed(2)}</span>
                  <span>|</span>
                  <span>Ask: ${ticker.ask.toFixed(2)}</span>
                </div>
              </motion.div>
            ) : (
              <div className="text-sm text-slate-500 px-3 py-1.5">
                Waiting for market data...
              </div>
            )}

            {/* PnL Summary */}
            {pnlSummary && (
              <motion.div
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-xs text-slate-400">P&L:</span>
                <span className={`text-sm font-bold ${
                  pnlSummary.total >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {pnlSummary.total >= 0 ? <TrendingUp size={12} className="inline" /> : <TrendingDown size={12} className="inline" />}
                  ${Math.abs(pnlSummary.total).toFixed(2)}
                </span>
              </motion.div>
            )}

            {/* Risk Snapshot */}
            {riskSnapshot && (
              <motion.div
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-xs text-slate-400">Risk:</span>
                <span className={`text-sm font-semibold ${
                  riskSnapshot.liquidationRisk < 20 ? 'text-emerald-400' :
                  riskSnapshot.liquidationRisk < 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {riskSnapshot.liquidationRisk.toFixed(1)}%
                </span>
              </motion.div>
            )}
          </div>

          {/* Actions + WS Status */}
          <div className="flex items-center gap-2">
            {/* WebSocket Status Badge */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              connectionStatus === 'connected' ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${
                connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'animate-pulse' : ''
              }`} />
              <span className={`text-xs font-medium ${statusInfo.color} hidden sm:inline`}>
                {connectionStatus}
              </span>
            </div>

            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-slate-50" />
            </button>
            <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-slate-50" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default CompactHeader;

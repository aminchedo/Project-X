import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../stores/useAppStore';
import WSBadge from '../components/WSBadge';
import { TrendingUp, PieChart, Search, Zap } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  const {
    currentSymbol,
    timeframe,
    leverage,
    connectionStatus,
    pnlSummary,
    riskSnapshot,
    setSymbol,
  } = useAppStore();

  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT'];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Global Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50 shadow-lg shadow-slate-900/20">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 py-3">
            {/* Top Row: Logo + Navigation */}
            <div className="flex items-center justify-between flex-1">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">کنسول معاملاتی</h1>
                  <p className="text-xs text-slate-400 hidden sm:block">سیستم معاملاتی حرفه‌ای</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex items-center gap-2">
                <Link
                  to="/"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActivePath('/')
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">داشبورد</span>
                </Link>
                <Link
                  to="/portfolio"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActivePath('/portfolio')
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <PieChart className="w-4 h-4" />
                  <span className="hidden sm:inline">پورتفولیو</span>
                </Link>
                <Link
                  to="/scanner"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActivePath('/scanner')
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">اسکنر</span>
                </Link>
              </nav>
            </div>

            {/* Bottom Row: Status + Controls */}
            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              {/* WebSocket Badge */}
              <WSBadge />

              {/* Symbol Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">نماد:</span>
                <select
                  value={currentSymbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                >
                  {symbols.map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
              </div>

              {/* Timeframe Display */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                <span className="text-xs text-slate-400">بازه:</span>
                <span className="text-sm font-medium text-white">{timeframe || '15m'}</span>
              </div>

              {/* Leverage Display */}
              {leverage != null && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                  <span className="text-xs text-slate-400">اهرم:</span>
                  <span className="text-sm font-medium text-white">{leverage}x</span>
                </div>
              )}

              {/* PnL Summary */}
              {pnlSummary && (
                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">سود/زیان کل</span>
                    <span className={`text-sm font-bold ${
                      pnlSummary.total >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      ${pnlSummary.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Risk Snapshot */}
              {riskSnapshot && (
                <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">ریسک انحلال</span>
                    <span className={`text-sm font-bold ${
                      riskSnapshot.liquidationRisk < 20 ? 'text-emerald-400' :
                      riskSnapshot.liquidationRisk < 50 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {riskSnapshot.liquidationRisk.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-px h-8 bg-slate-600/50"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400">مارجین</span>
                    <span className={`text-sm font-bold ${
                      riskSnapshot.marginUsage < 50 ? 'text-emerald-400' :
                      riskSnapshot.marginUsage < 75 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {riskSnapshot.marginUsage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Fallback when no PnL data */}
              {!pnlSummary && (
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                  <span className="text-xs text-slate-500">سود/زیان: -</span>
                </div>
              )}

              {/* Fallback when no risk data */}
              {!riskSnapshot && (
                <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                  <span className="text-xs text-slate-500">ریسک: -</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

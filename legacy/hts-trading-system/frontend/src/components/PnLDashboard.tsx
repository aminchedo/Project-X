/**
 * HTS Trading System - P&L Dashboard Component
 * Comprehensive profit and loss analytics with detailed trade analysis
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Services
import { 
  apiClient, 
  Trade,
  formatPrice,
  formatPercentage,
  formatTimestamp
} from '../services/api';

// Types
interface PnLDashboardState {
  trades: Trade[];
  analytics: PnLAnalytics | null;
  dailyPnL: DailyPnL[];
  symbolPerformance: SymbolPerformance[];
  loading: boolean;
  timeframe: '7d' | '30d' | '90d' | '1y';
  selectedSymbol: string | null;
}

interface PnLAnalytics {
  totalPnL: number;
  totalFees: number;
  netPnL: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  totalVolume: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

interface DailyPnL {
  date: string;
  pnl: number;
  fees: number;
  netPnL: number;
  tradeCount: number;
  volume: number;
}

interface SymbolPerformance {
  symbol: string;
  totalPnL: number;
  totalFees: number;
  netPnL: number;
  tradeCount: number;
  winningTrades: number;
  winRate: number;
  avgPnL: number;
  bestTrade: number;
  worstTrade: number;
  totalVolume: number;
}

const PnLDashboard: React.FC = () => {
  const [state, setState] = useState<PnLDashboardState>({
    trades: [],
    analytics: null,
    dailyPnL: [],
    symbolPerformance: [],
    loading: true,
    timeframe: '30d',
    selectedSymbol: null
  });

  useEffect(() => {
    loadPnLData();
  }, [state.timeframe]);

  const loadPnLData = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      // Load trade history
      const trades = await apiClient.getTradeHistory(1000);
      
      // Generate mock analytics (in production, this would come from the backend)
      const analytics = generateMockAnalytics(trades);
      const dailyPnL = generateMockDailyPnL();
      const symbolPerformance = generateMockSymbolPerformance();

      setState(prev => ({
        ...prev,
        trades,
        analytics,
        dailyPnL,
        symbolPerformance,
        loading: false
      }));
    } catch (error) {
      console.error('Failed to load P&L data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const generateMockAnalytics = (trades: Trade[]): PnLAnalytics => {
    // Mock analytics calculation (in production, this would be done on the backend)
    return {
      totalPnL: 2450.75,
      totalFees: 125.30,
      netPnL: 2325.45,
      totalTrades: 47,
      winningTrades: 32,
      losingTrades: 15,
      winRate: 68.1,
      avgWin: 125.50,
      avgLoss: -85.25,
      profitFactor: 2.35,
      largestWin: 485.60,
      largestLoss: -245.80,
      totalVolume: 125450.75,
      sharpeRatio: 1.85,
      maxDrawdown: 8.5
    };
  };

  const generateMockDailyPnL = (): DailyPnL[] => {
    const data: DailyPnL[] = [];
    const days = state.timeframe === '7d' ? 7 : state.timeframe === '30d' ? 30 : state.timeframe === '90d' ? 90 : 365;
    
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
      const pnl = (Math.random() - 0.4) * 200; // Slightly positive bias
      const fees = Math.random() * 10;
      
      data.push({
        date: date.toISOString().split('T')[0],
        pnl: Math.round(pnl * 100) / 100,
        fees: Math.round(fees * 100) / 100,
        netPnL: Math.round((pnl - fees) * 100) / 100,
        tradeCount: Math.floor(Math.random() * 5),
        volume: Math.random() * 5000
      });
    }
    
    return data;
  };

  const generateMockSymbolPerformance = (): SymbolPerformance[] => {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT'];
    
    return symbols.map(symbol => ({
      symbol,
      totalPnL: (Math.random() - 0.3) * 1000,
      totalFees: Math.random() * 50,
      netPnL: (Math.random() - 0.3) * 950,
      tradeCount: Math.floor(Math.random() * 20) + 5,
      winningTrades: Math.floor(Math.random() * 15) + 3,
      winRate: Math.random() * 40 + 50, // 50-90%
      avgPnL: (Math.random() - 0.3) * 50,
      bestTrade: Math.random() * 200 + 50,
      worstTrade: -(Math.random() * 150 + 25),
      totalVolume: Math.random() * 25000 + 5000
    }));
  };

  const handleTimeframeChange = (timeframe: '7d' | '30d' | '90d' | '1y') => {
    setState(prev => ({ ...prev, timeframe }));
  };

  const exportData = () => {
    const data = {
      analytics: state.analytics,
      dailyPnL: state.dailyPnL,
      symbolPerformance: state.symbolPerformance,
      trades: state.trades,
      timeframe: state.timeframe,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pnl-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (state.loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-dark-700 rounded mb-2"></div>
              <div className="h-8 bg-dark-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cumulativePnL = state.dailyPnL.reduce((acc, day, index) => {
    const cumulative = index === 0 ? day.netPnL : acc[index - 1].cumulative + day.netPnL;
    acc.push({ ...day, cumulative });
    return acc;
  }, [] as any[]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-neon-blue" />
          P&L Analytics
        </h1>
        
        <div className="flex items-center space-x-3">
          {/* Timeframe Selector */}
          <div className="flex items-center space-x-1 bg-dark-800/50 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  state.timeframe === tf 
                    ? 'bg-bull-500 text-white' 
                    : 'text-dark-300 hover:text-white hover:bg-dark-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={loadPnLData}
            className="btn-secondary flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>

          <button
            onClick={exportData}
            className="btn-primary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {state.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card">
            <div className={`metric-value ${
              state.analytics.netPnL >= 0 ? 'text-bull-400' : 'text-bear-400'
            }`}>
              {state.analytics.netPnL >= 0 ? '+' : ''}{formatPrice(state.analytics.netPnL)}
            </div>
            <div className="metric-label">Net P&L</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value text-yellow-400">
              {state.analytics.winRate.toFixed(1)}%
            </div>
            <div className="metric-label">Win Rate</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value text-neon-blue">
              {state.analytics.profitFactor.toFixed(2)}
            </div>
            <div className="metric-label">Profit Factor</div>
          </div>
          
          <div className="metric-card">
            <div className="metric-value text-dark-300">
              {state.analytics.totalTrades}
            </div>
            <div className="metric-label">Total Trades</div>
          </div>
        </div>
      )}

      {/* P&L Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-neon-blue" />
            Cumulative P&L
          </h2>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativePnL}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
                tickFormatter={(value) => formatPrice(value, 0)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                formatter={(value, name) => [
                  formatPrice(Number(value)),
                  name === 'cumulative' ? 'Cumulative P&L' : 'Daily P&L'
                ]}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#10b981"
                fill="url(#colorPnL)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily P&L Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Daily P&L Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={state.dailyPnL}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => formatPrice(value, 0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                  formatter={(value) => [formatPrice(Number(value)), 'Daily P&L']}
                />
                <Bar 
                  dataKey="netPnL" 
                  fill={(entry: any) => entry.netPnL >= 0 ? '#10b981' : '#ef4444'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Symbol Performance */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Symbol Performance</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
            {state.symbolPerformance
              .sort((a, b) => b.netPnL - a.netPnL)
              .map((symbol) => (
                <SymbolPerformanceCard key={symbol.symbol} symbol={symbol} />
              ))}
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      {state.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trade Statistics */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-neon-blue" />
              Trade Statistics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-bull-500/10 rounded-lg border border-bull-500/20">
                  <div className="text-2xl font-bold text-bull-400">
                    {state.analytics.winningTrades}
                  </div>
                  <div className="text-sm text-dark-400">Winning Trades</div>
                </div>
                <div className="text-center p-3 bg-bear-500/10 rounded-lg border border-bear-500/20">
                  <div className="text-2xl font-bold text-bear-400">
                    {state.analytics.losingTrades}
                  </div>
                  <div className="text-sm text-dark-400">Losing Trades</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-400">Average Win:</span>
                  <span className="font-semibold text-bull-400">
                    {formatPrice(state.analytics.avgWin)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Average Loss:</span>
                  <span className="font-semibold text-bear-400">
                    {formatPrice(Math.abs(state.analytics.avgLoss))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Largest Win:</span>
                  <span className="font-semibold text-bull-400">
                    {formatPrice(state.analytics.largestWin)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Largest Loss:</span>
                  <span className="font-semibold text-bear-400">
                    {formatPrice(Math.abs(state.analytics.largestLoss))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-neon-blue" />
              Risk Metrics
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-neon-blue/10 rounded-lg border border-neon-blue/20">
                  <div className="text-2xl font-bold text-neon-blue">
                    {state.analytics.sharpeRatio.toFixed(2)}
                  </div>
                  <div className="text-sm text-dark-400">Sharpe Ratio</div>
                </div>
                <div className="text-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="text-2xl font-bold text-yellow-400">
                    {state.analytics.maxDrawdown.toFixed(1)}%
                  </div>
                  <div className="text-sm text-dark-400">Max Drawdown</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-dark-400">Total Volume:</span>
                  <span className="font-semibold">
                    {formatPrice(state.analytics.totalVolume)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Total Fees:</span>
                  <span className="font-semibold text-bear-400">
                    {formatPrice(state.analytics.totalFees)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-400">Profit Factor:</span>
                  <span className={`font-semibold ${
                    state.analytics.profitFactor >= 2 ? 'text-bull-400' :
                    state.analytics.profitFactor >= 1.5 ? 'text-yellow-400' : 'text-bear-400'
                  }`}>
                    {state.analytics.profitFactor.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Trades */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Trades</h3>
          <button className="btn-secondary text-sm">
            View All Trades
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-2 text-dark-400">Time</th>
                <th className="text-left py-2 text-dark-400">Symbol</th>
                <th className="text-left py-2 text-dark-400">Side</th>
                <th className="text-right py-2 text-dark-400">Quantity</th>
                <th className="text-right py-2 text-dark-400">Price</th>
                <th className="text-right py-2 text-dark-400">P&L</th>
              </tr>
            </thead>
            <tbody>
              {state.trades.slice(0, 10).map((trade) => (
                <tr key={trade.id} className="border-b border-dark-800 hover:bg-dark-800/30">
                  <td className="py-2 text-dark-300">
                    {new Date(trade.executed_at).toLocaleTimeString()}
                  </td>
                  <td className="py-2 font-semibold">{trade.symbol}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.side === 'BUY' ? 'bg-bull-500/20 text-bull-400' : 'bg-bear-500/20 text-bear-400'
                    }`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono">{trade.quantity}</td>
                  <td className="py-2 text-right font-mono">{formatPrice(trade.price)}</td>
                  <td className={`py-2 text-right font-mono ${
                    trade.pnl >= 0 ? 'text-bull-400' : 'text-bear-400'
                  }`}>
                    {trade.pnl >= 0 ? '+' : ''}{formatPrice(trade.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Symbol Performance Card Component
interface SymbolPerformanceCardProps {
  symbol: SymbolPerformance;
}

const SymbolPerformanceCard: React.FC<SymbolPerformanceCardProps> = ({ symbol }) => {
  const pnlColor = symbol.netPnL >= 0 ? 'text-bull-400' : 'text-bear-400';
  
  return (
    <div className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
      <div className="flex items-center space-x-3">
        <div>
          <div className="font-semibold">{symbol.symbol}</div>
          <div className="text-xs text-dark-400">
            {symbol.tradeCount} trades • {symbol.winRate.toFixed(1)}% win rate
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className={`font-semibold ${pnlColor}`}>
          {symbol.netPnL >= 0 ? '+' : ''}{formatPrice(symbol.netPnL)}
        </div>
        <div className="text-xs text-dark-400">
          {formatPrice(symbol.totalVolume)} volume
        </div>
      </div>
    </div>
  );
};

export default PnLDashboard;
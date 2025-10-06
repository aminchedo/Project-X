/**
 * HTS Trading System - Backtest Panel Component
 * Strategy testing and performance analysis with detailed metrics
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  DollarSign,
  Percent,
  Activity,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Services
import { 
  apiClient, 
  BacktestResult,
  formatPrice,
  formatPercentage,
  formatDuration
} from '../services/api';

// Types
interface BacktestPanelState {
  results: Record<string, BacktestResult>;
  selectedResult: BacktestResult | null;
  loading: boolean;
  runningBacktest: string | null;
  settings: BacktestSettings;
  showSettings: boolean;
}

interface BacktestSettings {
  symbols: string[];
  days: number;
  initialCapital: number;
  riskPerTrade: number;
  commission: number;
}

const BacktestPanel: React.FC = () => {
  const [state, setState] = useState<BacktestPanelState>({
    results: {},
    selectedResult: null,
    loading: false,
    runningBacktest: null,
    settings: {
      symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT'],
      days: 30,
      initialCapital: 10000,
      riskPerTrade: 2,
      commission: 0.1
    },
    showSettings: false
  });

  useEffect(() => {
    // Load any existing backtest results
    loadExistingResults();
  }, []);

  const loadExistingResults = async () => {
    // In a real implementation, this would load saved backtest results
    // For now, we'll start with empty results
  };

  const runBacktest = async (symbol: string) => {
    setState(prev => ({ ...prev, runningBacktest: symbol }));

    try {
      const result = await apiClient.runBacktest(symbol, state.settings.days);
      
      setState(prev => ({
        ...prev,
        results: { ...prev.results, [symbol]: result },
        runningBacktest: null,
        selectedResult: result
      }));
    } catch (error) {
      console.error('Backtest failed:', error);
      setState(prev => ({ ...prev, runningBacktest: null }));
    }
  };

  const runAllBacktests = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const results: Record<string, BacktestResult> = {};
      
      for (const symbol of state.settings.symbols) {
        setState(prev => ({ ...prev, runningBacktest: symbol }));
        const result = await apiClient.runBacktest(symbol, state.settings.days);
        results[symbol] = result;
      }

      setState(prev => ({
        ...prev,
        results,
        loading: false,
        runningBacktest: null,
        selectedResult: Object.values(results)[0] || null
      }));
    } catch (error) {
      console.error('Batch backtest failed:', error);
      setState(prev => ({ ...prev, loading: false, runningBacktest: null }));
    }
  };

  const handleResultSelect = (result: BacktestResult) => {
    setState(prev => ({ ...prev, selectedResult: result }));
  };

  const updateSettings = (newSettings: Partial<BacktestSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const exportResults = () => {
    if (!state.selectedResult) return;

    const data = {
      backtest: state.selectedResult,
      settings: state.settings,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest-${state.selectedResult.symbol}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-neon-blue" />
          Strategy Backtesting
        </h1>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setState(prev => ({ ...prev, showSettings: true }))}
            className="btn-secondary flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
          
          <button
            onClick={runAllBacktests}
            disabled={state.loading || !!state.runningBacktest}
            className="btn-primary flex items-center"
          >
            {state.loading || state.runningBacktest ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Run All Tests
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-neon-blue">
            {Object.keys(state.results).length}
          </div>
          <div className="metric-label">Completed Tests</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-bull-400">
            {Object.values(state.results).filter(r => r.total_return_pct > 0).length}
          </div>
          <div className="metric-label">Profitable</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-yellow-400">
            {Object.values(state.results).length > 0 ? 
              (Object.values(state.results).reduce((acc, r) => acc + r.win_rate, 0) / Object.values(state.results).length).toFixed(1) : 0}%
          </div>
          <div className="metric-label">Avg Win Rate</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-dark-300">
            {Object.values(state.results).length > 0 ? 
              (Object.values(state.results).reduce((acc, r) => acc + r.sharpe_ratio, 0) / Object.values(state.results).length).toFixed(2) : 0}
          </div>
          <div className="metric-label">Avg Sharpe</div>
        </div>
      </div>

      {/* Backtest Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Symbol List and Controls */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test Symbols</h2>
          
          <div className="space-y-2">
            {state.settings.symbols.map((symbol) => {
              const result = state.results[symbol];
              const isRunning = state.runningBacktest === symbol;
              const isSelected = state.selectedResult?.symbol === symbol;
              
              return (
                <BacktestSymbolCard
                  key={symbol}
                  symbol={symbol}
                  result={result}
                  isRunning={isRunning}
                  isSelected={isSelected}
                  onRun={() => runBacktest(symbol)}
                  onSelect={() => result && handleResultSelect(result)}
                />
              );
            })}
          </div>
        </div>

        {/* Main Results Display */}
        <div className="lg:col-span-2">
          {state.selectedResult ? (
            <BacktestResults 
              result={state.selectedResult}
              onExport={exportResults}
            />
          ) : (
            <div className="glass-card p-12 text-center">
              <BarChart3 className="w-16 h-16 text-dark-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-dark-400 mb-2">No Results Selected</h3>
              <p className="text-dark-500 mb-4">
                Run a backtest to see detailed performance analysis
              </p>
              <button
                onClick={runAllBacktests}
                className="btn-primary"
              >
                Start Backtesting
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {state.showSettings && (
        <BacktestSettingsModal
          settings={state.settings}
          onUpdate={updateSettings}
          onClose={() => setState(prev => ({ ...prev, showSettings: false }))}
        />
      )}
    </div>
  );
};

// Symbol Card Component
interface BacktestSymbolCardProps {
  symbol: string;
  result?: BacktestResult;
  isRunning: boolean;
  isSelected: boolean;
  onRun: () => void;
  onSelect: () => void;
}

const BacktestSymbolCard: React.FC<BacktestSymbolCardProps> = ({
  symbol,
  result,
  isRunning,
  isSelected,
  onRun,
  onSelect
}) => {
  const returnColor = result ? (result.total_return_pct >= 0 ? 'text-bull-400' : 'text-bear-400') : 'text-dark-400';
  
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-bull-500/50' : ''
      }`}
      onClick={result ? onSelect : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{symbol}</h3>
        {!result && !isRunning && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRun();
            }}
            className="btn-secondary text-xs py-1 px-2"
          >
            <Play className="w-3 h-3 mr-1" />
            Run
          </button>
        )}
        {isRunning && (
          <div className="flex items-center text-yellow-400">
            <RefreshCw className="w-4 h-4 animate-spin mr-1" />
            <span className="text-xs">Running...</span>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-dark-400">Return:</span>
            <span className={`font-semibold ${returnColor}`}>
              {formatPercentage(result.total_return_pct)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-dark-400">Sharpe:</span>
            <span className="font-mono">{result.sharpe_ratio.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-dark-400">Win Rate:</span>
            <span className="font-mono">{result.win_rate.toFixed(1)}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-dark-400">Trades:</span>
            <span className="font-mono">{result.total_trades}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Results Display Component
interface BacktestResultsProps {
  result: BacktestResult;
  onExport: () => void;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ result, onExport }) => {
  const returnColor = result.total_return_pct >= 0 ? 'text-bull-400' : 'text-bear-400';
  
  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{result.symbol} Results</h2>
          <button
            onClick={onExport}
            className="btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${returnColor}`}>
              {formatPercentage(result.total_return_pct)}
            </div>
            <div className="text-sm text-dark-400">Total Return</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-neon-blue">
              {result.sharpe_ratio.toFixed(2)}
            </div>
            <div className="text-sm text-dark-400">Sharpe Ratio</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {result.win_rate.toFixed(1)}%
            </div>
            <div className="text-sm text-dark-400">Win Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-bear-400">
              -{result.max_drawdown.toFixed(1)}%
            </div>
            <div className="text-sm text-dark-400">Max Drawdown</div>
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.equity_curve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
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
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                formatter={(value) => [formatPrice(Number(value)), 'Capital']}
              />
              <Area
                type="monotone"
                dataKey="capital"
                stroke={result.total_return_pct >= 0 ? "#10b981" : "#ef4444"}
                fill={`url(#color${result.total_return_pct >= 0 ? 'Bull' : 'Bear'})`}
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorBull" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBear" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <MetricRow 
              label="Initial Capital" 
              value={formatPrice(result.initial_capital)} 
            />
            <MetricRow 
              label="Final Capital" 
              value={formatPrice(result.final_capital)} 
              valueColor={returnColor}
            />
            <MetricRow 
              label="Total Return" 
              value={formatPrice(result.total_return)} 
              valueColor={returnColor}
            />
            <MetricRow 
              label="Sortino Ratio" 
              value={result.sortino_ratio.toFixed(2)} 
            />
            <MetricRow 
              label="Profit Factor" 
              value={result.profit_factor.toFixed(2)} 
            />
          </div>
        </div>

        {/* Trade Statistics */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Trade Statistics</h3>
          <div className="space-y-3">
            <MetricRow 
              label="Total Trades" 
              value={result.total_trades.toString()} 
            />
            <MetricRow 
              label="Winning Trades" 
              value={result.winning_trades.toString()} 
              valueColor="text-bull-400"
            />
            <MetricRow 
              label="Losing Trades" 
              value={result.losing_trades.toString()} 
              valueColor="text-bear-400"
            />
            <MetricRow 
              label="Average Win" 
              value={formatPrice(result.avg_win)} 
              valueColor="text-bull-400"
            />
            <MetricRow 
              label="Average Loss" 
              value={formatPrice(Math.abs(result.avg_loss))} 
              valueColor="text-bear-400"
            />
            <MetricRow 
              label="Avg Trade Duration" 
              value={formatDuration(result.avg_trade_duration)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Row Component
interface MetricRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, valueColor = 'text-dark-100' }) => (
  <div className="flex justify-between items-center">
    <span className="text-dark-400">{label}:</span>
    <span className={`font-semibold ${valueColor}`}>{value}</span>
  </div>
);

// Settings Modal Component
interface BacktestSettingsModalProps {
  settings: BacktestSettings;
  onUpdate: (settings: Partial<BacktestSettings>) => void;
  onClose: () => void;
}

const BacktestSettingsModal: React.FC<BacktestSettingsModalProps> = ({
  settings,
  onUpdate,
  onClose
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4">Backtest Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Test Period (Days)
            </label>
            <input
              type="number"
              value={settings.days}
              onChange={(e) => onUpdate({ days: parseInt(e.target.value) })}
              className="input-primary w-full"
              min="1"
              max="365"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Initial Capital ($)
            </label>
            <input
              type="number"
              value={settings.initialCapital}
              onChange={(e) => onUpdate({ initialCapital: parseFloat(e.target.value) })}
              className="input-primary w-full"
              min="1000"
              step="1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Risk Per Trade (%)
            </label>
            <input
              type="number"
              value={settings.riskPerTrade}
              onChange={(e) => onUpdate({ riskPerTrade: parseFloat(e.target.value) })}
              className="input-primary w-full"
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Commission (%)
            </label>
            <input
              type="number"
              value={settings.commission}
              onChange={(e) => onUpdate({ commission: parseFloat(e.target.value) })}
              className="input-primary w-full"
              min="0"
              max="1"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onClose} className="btn-primary">
            Save Settings
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BacktestPanel;
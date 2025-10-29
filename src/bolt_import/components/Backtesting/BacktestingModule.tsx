import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Percent
} from 'lucide-react';
import WalkForwardInterface from './WalkForwardInterface';
import StrategyComparison from './StrategyComparison';
import EquityCurveChart from './EquityCurveChart';
import TradeAnalysis from './TradeAnalysis';
import ReportGenerator from './ReportGenerator';

interface BacktestConfig {
  start_date: string;
  end_date: string;
  initial_capital: number;
  symbols: string[];
  timeframe: string;
  walk_forward: {
    enabled: boolean;
    train_period: number;
    test_period: number;
    step_size: number;
  };
  strategy: {
    name: string;
    parameters: Record<string, any>;
  };
}

interface BacktestResult {
  id: string;
  config: BacktestConfig;
  metrics: {
    total_return: number;
    annualized_return: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown: number;
    calmar_ratio: number;
    win_rate: number;
    profit_factor: number;
    total_trades: number;
    avg_trade_return: number;
    var_95: number;
    cvar_95: number;
  };
  equity_curve: Array<{
    date: string;
    equity: number;
    drawdown: number;
  }>;
  trades: Array<{
    id: string;
    symbol: string;
    entry_date: string;
    exit_date: string;
    entry_price: number;
    exit_price: number;
    quantity: number;
    pnl: number;
    return_pct: number;
    duration_hours: number;
    signal_strength: number;
  }>;
  status: 'running' | 'completed' | 'failed' | 'pending';
  created_at: string;
  completed_at?: string;
}

const BacktestingModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('walk-forward');
  const [backtests, setBacktests] = useState<BacktestResult[]>([]);
  const [selectedBacktest, setSelectedBacktest] = useState<BacktestResult | null>(null);
  const [runningBacktest, setRunningBacktest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBacktests();
  }, []);

  const fetchBacktests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/backtesting/results');
      if (response.ok) {
        const results = await response.json();
        setBacktests(results);
        if (results.length > 0 && !selectedBacktest) {
          setSelectedBacktest(results[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch backtests:', error);
    } finally {
      setLoading(false);
    }
  };

  const startBacktest = async (config: BacktestConfig) => {
    try {
      const response = await fetch('/api/backtesting/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        const result = await response.json();
        setRunningBacktest(result.id);
        fetchBacktests(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to start backtest:', error);
    }
  };

  const stopBacktest = async (backtestId: string) => {
    try {
      const response = await fetch(`/api/backtesting/stop/${backtestId}`, {
        method: 'POST'
      });

      if (response.ok) {
        setRunningBacktest(null);
        fetchBacktests();
      }
    } catch (error) {
      console.error('Failed to stop backtest:', error);
    }
  };

  const deleteBacktest = async (backtestId: string) => {
    if (!window.confirm('Are you sure you want to delete this backtest? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/backtesting/delete/${backtestId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBacktests(prev => prev.filter(b => b.id !== backtestId));
        if (selectedBacktest?.id === backtestId) {
          setSelectedBacktest(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete backtest:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number, decimals: number = 2) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  const getStatusColor = (status: BacktestResult['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: BacktestResult['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'walk-forward', label: 'Walk-Forward Analysis', icon: TrendingUp },
    { id: 'comparison', label: 'Strategy Comparison', icon: BarChart3 },
    { id: 'equity-curve', label: 'Equity Curve', icon: TrendingUp },
    { id: 'trade-analysis', label: 'Trade Analysis', icon: Target },
    { id: 'reports', label: 'Reports', icon: Download }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
            Backtesting Module
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive strategy validation and performance analysis</p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{backtests.length}</div>
            <div className="text-sm text-gray-600">Total Backtests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {backtests.filter(b => b.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {backtests.filter(b => b.status === 'running').length}
            </div>
            <div className="text-sm text-gray-600">Running</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Backtest List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Recent Backtests</h3>
              <button
                onClick={fetchBacktests}
                className="p-1 text-gray-600 hover:text-gray-800"
                title="Refresh"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : backtests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No backtests yet</p>
                <p className="text-sm">Start a new walk-forward analysis</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {backtests.map((backtest) => (
                  <div
                    key={backtest.id}
                    onClick={() => setSelectedBacktest(backtest)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedBacktest?.id === backtest.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(backtest.status)}
                        <span className="font-medium text-sm">{backtest.strategy.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {runningBacktest === backtest.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              stopBacktest(backtest.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                            title="Stop"
                          >
                            <Pause className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBacktest(backtest.id);
                          }}
                          className="p-1 text-gray-600 hover:bg-red-100 rounded"
                          title="Delete"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Period:</span>
                        <span>{new Date(backtest.config.start_date).toLocaleDateString()} - {new Date(backtest.config.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Capital:</span>
                        <span>{formatCurrency(backtest.config.initial_capital)}</span>
                      </div>
                      {backtest.status === 'completed' && (
                        <div className="flex justify-between">
                          <span>Return:</span>
                          <span className={backtest.metrics.total_return >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(backtest.metrics.total_return)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={`mt-2 px-2 py-1 rounded text-xs text-center ${getStatusColor(backtest.status)}`}>
                      {backtest.status.charAt(0).toUpperCase() + backtest.status.slice(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'walk-forward' && (
                <WalkForwardInterface
                  onStartBacktest={startBacktest}
                  runningBacktest={runningBacktest}
                />
              )}

              {activeTab === 'comparison' && (
                <StrategyComparison
                  backtests={backtests}
                  selectedBacktest={selectedBacktest}
                />
              )}

              {activeTab === 'equity-curve' && selectedBacktest && (
                <EquityCurveChart
                  backtest={selectedBacktest}
                />
              )}

              {activeTab === 'trade-analysis' && selectedBacktest && (
                <TradeAnalysis
                  backtest={selectedBacktest}
                />
              )}

              {activeTab === 'reports' && selectedBacktest && (
                <ReportGenerator
                  backtest={selectedBacktest}
                />
              )}

              {!selectedBacktest && activeTab !== 'walk-forward' && (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Backtest Selected</h3>
                  <p className="text-gray-600">Select a backtest from the list to view detailed analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Backtesting Engine Active</span>
            </div>
            <span>Last Update: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="text-right">
            <p className="font-semibold text-red-600">
              ⚠️ Backtesting results are for historical analysis only
            </p>
            <p>Past performance does not guarantee future results</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestingModule;

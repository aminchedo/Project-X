import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface StrategyComparisonProps {
  backtests: Array<{
    id: string;
    config: {
      strategy: {
        name: string;
        parameters: Record<string, any>;
      };
      start_date: string;
      end_date: string;
      initial_capital: number;
    };
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
    status: string;
  }>;
  selectedBacktest: any;
}

const StrategyComparison: React.FC<StrategyComparisonProps> = ({ backtests, selectedBacktest }) => {
  const [selectedBacktests, setSelectedBacktests] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof StrategyComparisonProps['backtests'][0]['metrics']>('total_return');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const completedBacktests = backtests.filter(b => b.status === 'completed');

  const handleBacktestSelection = (backtestId: string) => {
    setSelectedBacktests(prev => {
      if (prev.includes(backtestId)) {
        return prev.filter(id => id !== backtestId);
      } else {
        return [...prev, backtestId].slice(-3); // Limit to 3 comparisons
      }
    });
  };

  const handleSort = (field: keyof StrategyComparisonProps['backtests'][0]['metrics']) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedBacktests = () => {
    return [...completedBacktests].sort((a, b) => {
      const aValue = a.metrics[sortField];
      const bValue = b.metrics[sortField];
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
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

  const getPerformanceColor = (value: number, field: string) => {
    if (field === 'max_drawdown' || field === 'var_95' || field === 'cvar_95') {
      return value > 0.1 ? 'text-red-600' : value > 0.05 ? 'text-yellow-600' : 'text-green-600';
    }
    if (field === 'total_return' || field === 'annualized_return' || field === 'sharpe_ratio' || 
        field === 'sortino_ratio' || field === 'calmar_ratio' || field === 'win_rate' || 
        field === 'profit_factor' || field === 'avg_trade_return') {
      return value > 0 ? 'text-green-600' : 'text-red-600';
    }
    return 'text-gray-600';
  };

  const getRankingColor = (rank: number, total: number) => {
    const percentile = rank / total;
    if (percentile <= 0.2) return 'bg-green-100 text-green-800';
    if (percentile <= 0.4) return 'bg-blue-100 text-blue-800';
    if (percentile <= 0.6) return 'bg-yellow-100 text-yellow-800';
    if (percentile <= 0.8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const sortedBacktests = getSortedBacktests();
  const comparisonBacktests = selectedBacktests.map(id => 
    completedBacktests.find(b => b.id === id)
  ).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Strategy Comparison</h2>
      </div>

      {/* Strategy Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Strategies to Compare</h3>
        
        {completedBacktests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No completed backtests available for comparison</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedBacktests.map((backtest) => (
              <label
                key={backtest.id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedBacktests.includes(backtest.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedBacktests.includes(backtest.id)}
                  onChange={() => handleBacktestSelection(backtest.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {backtest.config.strategy.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatPercentage(backtest.metrics.total_return)} return
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(backtest.config.start_date).toLocaleDateString()} - {new Date(backtest.config.end_date).toLocaleDateString()}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {selectedBacktests.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">
              <span className="font-medium">{selectedBacktests.length} strategy(ies) selected for comparison</span>
              <span className="ml-2 text-blue-600">(Maximum 3 strategies)</span>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {comparisonBacktests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Strategy Comparison</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Strategy
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_return')}
                  >
                    Total Return
                    {sortField === 'total_return' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('sharpe_ratio')}
                  >
                    Sharpe Ratio
                    {sortField === 'sharpe_ratio' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('max_drawdown')}
                  >
                    Max Drawdown
                    {sortField === 'max_drawdown' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('win_rate')}
                  >
                    Win Rate
                    {sortField === 'win_rate' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('profit_factor')}
                  >
                    Profit Factor
                    {sortField === 'profit_factor' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_trades')}
                  >
                    Total Trades
                    {sortField === 'total_trades' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisonBacktests.map((backtest, index) => {
                  const rank = sortedBacktests.findIndex(b => b.id === backtest.id) + 1;
                  const total = sortedBacktests.length;
                  
                  return (
                    <tr key={backtest.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${getRankingColor(rank, total)}`}>
                            #{rank}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {backtest.config.strategy.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(backtest.config.start_date).toLocaleDateString()} - {new Date(backtest.config.end_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${getPerformanceColor(backtest.metrics.total_return, 'total_return')}`}>
                        {formatPercentage(backtest.metrics.total_return)}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${getPerformanceColor(backtest.metrics.sharpe_ratio, 'sharpe_ratio')}`}>
                        {backtest.metrics.sharpe_ratio.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${getPerformanceColor(backtest.metrics.max_drawdown, 'max_drawdown')}`}>
                        {formatPercentage(backtest.metrics.max_drawdown)}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${getPerformanceColor(backtest.metrics.win_rate, 'win_rate')}`}>
                        {formatPercentage(backtest.metrics.win_rate)}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${getPerformanceColor(backtest.metrics.profit_factor, 'profit_factor')}`}>
                        {backtest.metrics.profit_factor.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {backtest.metrics.total_trades}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Ranking */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Ranking</h3>
        
        {sortedBacktests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No completed backtests to rank</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedBacktests.slice(0, 10).map((backtest, index) => {
              const rank = index + 1;
              const percentile = rank / sortedBacktests.length;
              
              return (
                <div
                  key={backtest.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${getRankingColor(rank, sortedBacktests.length)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-lg font-bold">#{rank}</div>
                    <div>
                      <div className="font-medium">{backtest.config.strategy.name}</div>
                      <div className="text-xs opacity-75">
                        {new Date(backtest.config.start_date).toLocaleDateString()} - {new Date(backtest.config.end_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {formatPercentage(backtest.metrics.total_return)}
                    </div>
                    <div className="text-xs opacity-75">
                      Sharpe: {backtest.metrics.sharpe_ratio.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Strategy Insights */}
      {comparisonBacktests.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">Comparison Insights</h4>
          <div className="text-sm text-blue-700 space-y-1">
            {(() => {
              const bestReturn = Math.max(...comparisonBacktests.map(b => b.metrics.total_return));
              const bestSharpe = Math.max(...comparisonBacktests.map(b => b.metrics.sharpe_ratio));
              const bestDrawdown = Math.min(...comparisonBacktests.map(b => b.metrics.max_drawdown));
              
              const bestReturnStrategy = comparisonBacktests.find(b => b.metrics.total_return === bestReturn);
              const bestSharpeStrategy = comparisonBacktests.find(b => b.metrics.sharpe_ratio === bestSharpe);
              const bestDrawdownStrategy = comparisonBacktests.find(b => b.metrics.max_drawdown === bestDrawdown);
              
              return (
                <>
                  <p>• <strong>{bestReturnStrategy?.config.strategy.name}</strong> achieved the highest total return of {formatPercentage(bestReturn)}</p>
                  <p>• <strong>{bestSharpeStrategy?.config.strategy.name}</strong> has the best risk-adjusted returns (Sharpe: {bestSharpe.toFixed(2)})</p>
                  <p>• <strong>{bestDrawdownStrategy?.config.strategy.name}</strong> showed the lowest maximum drawdown of {formatPercentage(bestDrawdown)}</p>
                  <p>• Consider combining the best aspects of each strategy for optimal performance</p>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Comparison Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Comparison Tips</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>• Compare strategies tested over the same time period for fair comparison</p>
          <p>• Consider both return and risk metrics when evaluating performance</p>
          <p>• Higher Sharpe ratio indicates better risk-adjusted returns</p>
          <p>• Lower maximum drawdown suggests better risk management</p>
          <p>• Profit factor above 1.0 indicates profitable strategy</p>
        </div>
      </div>
    </div>
  );
};

export default StrategyComparison;

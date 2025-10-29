import React, { useState } from 'react';
import { Target, TrendingUp, TrendingDown, Calendar, DollarSign, Clock, BarChart3, Filter } from 'lucide-react';

interface TradeAnalysisProps {
  backtest: {
    id: string;
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
    metrics: {
      total_trades: number;
      win_rate: number;
      profit_factor: number;
      avg_trade_return: number;
    };
  };
}

const TradeAnalysis: React.FC<TradeAnalysisProps> = ({ backtest }) => {
  const [sortField, setSortField] = useState<keyof TradeAnalysisProps['backtest']['trades'][0]>('entry_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterSymbol, setFilterSymbol] = useState<string>('all');
  const [filterPnL, setFilterPnL] = useState<string>('all');

  const handleSort = (field: keyof TradeAnalysisProps['backtest']['trades'][0]) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortedAndFilteredTrades = () => {
    let filtered = [...backtest.trades];

    // Apply symbol filter
    if (filterSymbol !== 'all') {
      filtered = filtered.filter(trade => trade.symbol === filterSymbol);
    }

    // Apply PnL filter
    if (filterPnL === 'profit') {
      filtered = filtered.filter(trade => trade.pnl > 0);
    } else if (filterPnL === 'loss') {
      filtered = filtered.filter(trade => trade.pnl < 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
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

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours.toFixed(0)}h`;
    }
  };

  const getSymbols = () => {
    return Array.from(new Set(backtest.trades.map(trade => trade.symbol))).sort();
  };

  const getTradeStats = () => {
    const trades = getSortedAndFilteredTrades();
    const profitableTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgWin = profitableTrades.length > 0 
      ? profitableTrades.reduce((sum, t) => sum + t.pnl, 0) / profitableTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length 
      : 0;
    
    const winRate = trades.length > 0 ? profitableTrades.length / trades.length : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin * profitableTrades.length) / Math.abs(avgLoss * losingTrades.length) : 0;

    return {
      totalTrades: trades.length,
      profitableTrades: profitableTrades.length,
      losingTrades: losingTrades.length,
      totalPnL,
      avgWin,
      avgLoss,
      winRate,
      profitFactor
    };
  };

  const stats = getTradeStats();
  const sortedTrades = getSortedAndFilteredTrades();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Target className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Trade Analysis</h2>
      </div>

      {/* Trade Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Trades</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalTrades}</div>
          <div className="text-sm text-gray-600">
            {backtest.metrics.total_trades} in backtest
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatPercentage(stats.winRate)}
          </div>
          <div className="text-sm text-gray-600">
            {stats.profitableTrades} wins, {stats.losingTrades} losses
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Total P&L</span>
          </div>
          <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.totalPnL)}
          </div>
          <div className="text-sm text-gray-600">
            Avg: {formatCurrency(stats.totalPnL / Math.max(stats.totalTrades, 1))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Profit Factor</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.profitFactor.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            {stats.profitFactor > 1 ? 'Profitable' : 'Unprofitable'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Symbol:</label>
            <select
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Symbols</option>
              {getSymbols().map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">P&L:</label>
            <select
              value={filterPnL}
              onChange={(e) => setFilterPnL(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Trades</option>
              <option value="profit">Profitable Only</option>
              <option value="loss">Losses Only</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {sortedTrades.length} of {backtest.trades.length} trades
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('symbol')}
                >
                  Symbol
                  {sortField === 'symbol' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('entry_date')}
                >
                  Entry Date
                  {sortField === 'entry_date' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('exit_date')}
                >
                  Exit Date
                  {sortField === 'exit_date' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('entry_price')}
                >
                  Entry Price
                  {sortField === 'entry_price' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('exit_price')}
                >
                  Exit Price
                  {sortField === 'exit_price' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity')}
                >
                  Quantity
                  {sortField === 'quantity' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pnl')}
                >
                  P&L
                  {sortField === 'pnl' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('return_pct')}
                >
                  Return %
                  {sortField === 'return_pct' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('duration_hours')}
                >
                  Duration
                  {sortField === 'duration_hours' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('signal_strength')}
                >
                  Signal Strength
                  {sortField === 'signal_strength' && (
                    <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {trade.symbol}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(trade.entry_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(trade.exit_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatCurrency(trade.entry_price)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatCurrency(trade.exit_price)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {trade.quantity.toFixed(4)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${
                    trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(trade.pnl)}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${
                    trade.return_pct >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(trade.return_pct)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDuration(trade.duration_hours)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${trade.signal_strength * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{(trade.signal_strength * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedTrades.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trades Found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more trades</p>
          </div>
        )}
      </div>

      {/* Trade Distribution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-4">P&L Distribution</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average Win:</span>
              <span className="font-medium text-green-600">{formatCurrency(stats.avgWin)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average Loss:</span>
              <span className="font-medium text-red-600">{formatCurrency(stats.avgLoss)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Win/Loss Ratio:</span>
              <span className="font-medium">
                {Math.abs(stats.avgLoss) > 0 ? (Math.abs(stats.avgWin) / Math.abs(stats.avgLoss)).toFixed(2) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Profit Factor:</span>
              <span className="font-medium">{stats.profitFactor.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Trade Duration Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-4">Trade Duration Analysis</h4>
          
          <div className="space-y-3">
            {(() => {
              const durations = sortedTrades.map(t => t.duration_hours);
              const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
              const minDuration = Math.min(...durations);
              const maxDuration = Math.max(...durations);
              
              return (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Average Duration:</span>
                    <span className="font-medium">{formatDuration(avgDuration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shortest Trade:</span>
                    <span className="font-medium">{formatDuration(minDuration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Longest Trade:</span>
                    <span className="font-medium">{formatDuration(maxDuration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Duration:</span>
                    <span className="font-medium">{formatDuration(durations.reduce((sum, d) => sum + d, 0))}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Trade Analysis Insights</h4>
        <div className="text-sm text-blue-700 space-y-1">
          {stats.winRate > 0.6 ? (
            <p>• High win rate suggests good entry timing and risk management</p>
          ) : stats.winRate < 0.4 ? (
            <p>• Low win rate indicates potential issues with entry criteria or market conditions</p>
          ) : (
            <p>• Moderate win rate with room for improvement in entry timing</p>
          )}
          
          {stats.profitFactor > 1.5 ? (
            <p>• Strong profit factor indicates profitable strategy with good risk management</p>
          ) : stats.profitFactor < 1 ? (
            <p>• Profit factor below 1 suggests strategy needs improvement</p>
          ) : (
            <p>• Moderate profit factor indicates room for optimization</p>
          )}
          
          <p>• Analyze losing trades to identify common patterns and improve strategy</p>
          <p>• Consider position sizing adjustments based on signal strength</p>
        </div>
      </div>
    </div>
  );
};

export default TradeAnalysis;

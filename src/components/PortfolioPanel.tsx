import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface PortfolioData {
  total_value: number;
  daily_pnl: number;
  daily_pnl_pct: number;
  positions: Position[];
  risk_metrics: RiskMetrics;
}

interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  timestamp: string;
}

interface RiskMetrics {
  portfolio_var: number;
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  profit_factor: number;
}

const PortfolioPanel: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');

  useEffect(() => {
    loadPortfolioData();
    const interval = setInterval(loadPortfolioData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const loadPortfolioData = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockData: PortfolioData = {
        total_value: 125750.50,
        daily_pnl: 2847.25,
        daily_pnl_pct: 2.31,
        positions: [
          {
            symbol: 'BTCUSDT',
            side: 'LONG',
            size: 0.5,
            entry_price: 43250.00,
            current_price: 44180.50,
            unrealized_pnl: 465.25,
            unrealized_pnl_pct: 2.15,
            timestamp: new Date().toISOString()
          },
          {
            symbol: 'ETHUSDT',
            side: 'LONG',
            size: 5.2,
            entry_price: 2650.00,
            current_price: 2734.80,
            unrealized_pnl: 440.96,
            unrealized_pnl_pct: 3.20,
            timestamp: new Date().toISOString()
          },
          {
            symbol: 'ADAUSDT',
            side: 'SHORT',
            size: 1000,
            entry_price: 0.485,
            current_price: 0.472,
            unrealized_pnl: 13.00,
            unrealized_pnl_pct: 2.68,
            timestamp: new Date().toISOString()
          }
        ],
        risk_metrics: {
          portfolio_var: 2.45,
          max_drawdown: -8.32,
          sharpe_ratio: 1.87,
          win_rate: 68.5,
          profit_factor: 1.94
        }
      };
      
      setPortfolioData(mockData);
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <div className="text-center text-red-400">Failed to load portfolio data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 animate-pulse mr-3"></div>
            Portfolio Overview
          </h3>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-1 text-white text-sm focus:border-cyan-500/50 focus:outline-none"
          >
            <option value="1D">1D</option>
            <option value="1W">1W</option>
            <option value="1M">1M</option>
            <option value="3M">3M</option>
          </select>
        </div>

        {/* Total Value */}
        <div className="mb-6">
          <div className="text-3xl font-bold text-white mb-2">
            {formatCurrency(portfolioData.total_value)}
          </div>
          <div className="flex items-center space-x-4">
            <div className={`text-lg font-semibold ${
              portfolioData.daily_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {portfolioData.daily_pnl >= 0 ? '+' : ''}{formatCurrency(portfolioData.daily_pnl)}
            </div>
            <div className={`text-sm font-medium px-2 py-1 rounded-full ${
              portfolioData.daily_pnl_pct >= 0 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {formatPercentage(portfolioData.daily_pnl_pct)}
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Portfolio VaR</div>
            <div className="text-lg font-semibold text-white">
              {portfolioData.risk_metrics.portfolio_var.toFixed(2)}%
            </div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Max Drawdown</div>
            <div className="text-lg font-semibold text-red-400">
              {portfolioData.risk_metrics.max_drawdown.toFixed(2)}%
            </div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Sharpe Ratio</div>
            <div className="text-lg font-semibold text-cyan-400">
              {portfolioData.risk_metrics.sharpe_ratio.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Win Rate</div>
            <div className="text-lg font-semibold text-emerald-400">
              {portfolioData.risk_metrics.win_rate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse mr-3"></div>
          Active Positions ({portfolioData.positions.length})
        </h3>

        <div className="space-y-3">
          {portfolioData.positions.map((position, index) => (
            <div 
              key={`${position.symbol}-${index}`}
              className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-white font-semibold">{position.symbol}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    position.side === 'LONG' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {position.side}
                  </span>
                </div>
                <div className={`text-right ${
                  position.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  <div className="font-semibold">
                    {position.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency(position.unrealized_pnl)}
                  </div>
                  <div className="text-xs">
                    {formatPercentage(position.unrealized_pnl_pct)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Size</div>
                  <div className="text-white font-mono">{position.size}</div>
                </div>
                <div>
                  <div className="text-gray-400">Entry</div>
                  <div className="text-white font-mono">{formatCurrency(position.entry_price)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Current</div>
                  <div className="text-white font-mono">{formatCurrency(position.current_price)}</div>
                </div>
              </div>

              {/* P&L Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-600/50 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full transition-all duration-500 ${
                      position.unrealized_pnl >= 0 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                        : 'bg-gradient-to-r from-red-500 to-red-400'
                    }`}
                    style={{ 
                      width: `${Math.min(Math.abs(position.unrealized_pnl_pct) * 10, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-400 animate-pulse mr-3"></div>
          Performance Metrics
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Profit Factor</div>
            <div className="text-2xl font-bold text-white">
              {portfolioData.risk_metrics.profit_factor.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Gross Profit / Gross Loss
            </div>
          </div>

          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Win Rate</div>
            <div className="text-2xl font-bold text-emerald-400">
              {portfolioData.risk_metrics.win_rate.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-600/50 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${portfolioData.risk_metrics.win_rate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPanel;
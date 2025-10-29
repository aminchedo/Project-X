import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, PieChart as PieChartIcon, Activity, AlertTriangle, Filter } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { api } from '../services/api';
import clsx from 'clsx';

interface PortfolioSummary {
  timestamp: string;
  portfolio_value: number;
  initial_capital: number;
  total_return: number;
  total_return_pct: number;
  realized_pnl: number;
  unrealized_pnl: number;
  open_positions_count: number;
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  daily_pnl: number;
  daily_trades: number;
  daily_signals: number;
  open_positions: Array<{
    trade_id: string;
    symbol: string;
    action: string;
    quantity: number;
    entry_price: number;
    current_price: number;
    unrealized_pnl: number;
    unrealized_pnl_pct: number;
    entry_time: string;
    days_held: number;
  }>;
  symbol_breakdown: Record<string, number>;
}

interface EquityCurvePoint {
  timestamp: string;
  portfolio_value: number;
  total_pnl: number;
  daily_pnl: number;
  total_return_pct: number;
  trade_count: number;
}

interface PerformanceByAsset {
  symbol: string;
  total_pnl: number;
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  largest_win: number;
  largest_loss: number;
}

interface TradeHistory {
  id: string;
  symbol: string;
  action: string;
  quantity: number;
  entry_price: number;
  exit_price?: number;
  entry_time: string;
  exit_time?: string;
  pnl?: number;
  status: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];

const PnLDashboard: React.FC = () => {
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityCurvePoint[]>([]);
  const [performanceByAsset, setPerformanceByAsset] = useState<PerformanceByAsset[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D'>('30D');
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'trades' | 'performance'>('overview');

  useEffect(() => {
    fetchPnLData();
  }, [timeframe]);

  const fetchPnLData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch portfolio summary using API service with proper base URL
      if (api && api.trading && api.trading.getPortfolioSummary) {
        try {
          const summaryData = await api.trading.getPortfolioSummary();
          setPortfolioSummary(summaryData.data);
        } catch (err) {
          console.warn('Using mock portfolio data due to API error', err);
          setPortfolioSummary(getMockPortfolioData());
        }
      } else {
        console.warn('API not available, using mock portfolio data');
        setPortfolioSummary(getMockPortfolioData());
      }

      // Fetch equity curve
      if (api && api.trading && api.trading.getEquityCurve) {
        try {
          const daysBack = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
          const equityData = await api.trading.getEquityCurve("1D", daysBack);
          setEquityCurve(equityData.data);
        } catch (err) {
          console.warn('Using mock equity curve data due to API error', err);
          setEquityCurve(getMockEquityCurveData(timeframe));
        }
      } else {
        console.warn('API not available, using mock equity curve data');
        setEquityCurve(getMockEquityCurveData(timeframe));
      }

      // Fetch performance by asset
      if (api && api.trading && api.trading.getPerformanceByAsset) {
        try {
          const performanceData = await api.trading.getPerformanceByAsset(timeframe);
          setPerformanceByAsset(performanceData.data);
        } catch (err) {
          console.warn('Using mock performance data due to API error', err);
          setPerformanceByAsset(getMockPerformanceData());
        }
      } else {
        console.warn('API not available, using mock performance data');
        setPerformanceByAsset(getMockPerformanceData());
      }

      // Fetch trade history
      if (api && api.trading && api.trading.getTradeHistory) {
        try {
          const tradesData = await api.trading.getTradeHistory(20);
          setTradeHistory(tradesData.data);
        } catch (err) {
          console.warn('Using mock trade history due to API error', err);
          setTradeHistory(getMockTradeHistory());
        }
      } else {
        console.warn('API not available, using mock trade history');
        setTradeHistory(getMockTradeHistory());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch P&L data');
    } finally {
      setLoading(false);
    }
  };
  
  // Mock data generators for fallback
  const getMockPortfolioData = (): PortfolioSummary => {
    return {
      timestamp: new Date().toISOString(),
      portfolio_value: 12450.75,
      initial_capital: 10000,
      total_return: 2450.75,
      total_return_pct: 24.51,
      realized_pnl: 1850.25,
      unrealized_pnl: 600.50,
      open_positions_count: 3,
      total_trades: 42,
      win_rate: 62.5,
      profit_factor: 2.3,
      daily_pnl: 125.50,
      daily_trades: 4,
      daily_signals: 8,
      open_positions: [
        {
          trade_id: "t1",
          symbol: "BTCUSDT",
          action: "BUY",
          quantity: 0.05,
          entry_price: 42500,
          current_price: 43100,
          unrealized_pnl: 30,
          unrealized_pnl_pct: 1.41,
          entry_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          days_held: 3
        },
        {
          trade_id: "t2",
          symbol: "ETHUSDT",
          action: "BUY",
          quantity: 0.5,
          entry_price: 2300,
          current_price: 2450,
          unrealized_pnl: 75,
          unrealized_pnl_pct: 6.52,
          entry_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          days_held: 5
        },
        {
          trade_id: "t3",
          symbol: "SOLUSDT",
          action: "BUY",
          quantity: 5,
          entry_price: 120,
          current_price: 115,
          unrealized_pnl: -25,
          unrealized_pnl_pct: -4.17,
          entry_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          days_held: 2
        }
      ],
      symbol_breakdown: {
        "BTC": 850.25,
        "ETH": 650.50,
        "SOL": 450.00,
        "BNB": 350.00,
        "ADA": 150.00
      }
    };
  };
  
  const getMockEquityCurveData = (timeframe: string): EquityCurvePoint[] => {
    const days = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
    const data: EquityCurvePoint[] = [];
    let value = 10000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate some realistic-looking data with small variations
      const dailyChange = (Math.random() * 4) - 1.5; // Between -1.5% and 2.5%
      value = value * (1 + (dailyChange / 100));
      
      data.push({
        timestamp: date.toISOString(),
        portfolio_value: value,
        total_pnl: value - 10000,
        daily_pnl: value * (dailyChange / 100),
        total_return_pct: ((value - 10000) / 10000) * 100,
        trade_count: Math.floor(Math.random() * 5)
      });
    }
    
    return data;
  };
  
  const getMockPerformanceData = (): PerformanceByAsset[] => {
    return [
      {
        symbol: "BTCUSDT",
        total_pnl: 850.25,
        total_trades: 15,
        win_rate: 66.7,
        profit_factor: 2.5,
        largest_win: 320.50,
        largest_loss: -125.75
      },
      {
        symbol: "ETHUSDT",
        total_pnl: 650.50,
        total_trades: 12,
        win_rate: 58.3,
        profit_factor: 2.1,
        largest_win: 280.25,
        largest_loss: -110.50
      },
      {
        symbol: "SOLUSDT",
        total_pnl: 450.00,
        total_trades: 8,
        win_rate: 62.5,
        profit_factor: 2.3,
        largest_win: 210.75,
        largest_loss: -95.25
      },
      {
        symbol: "BNBUSDT",
        total_pnl: 350.00,
        total_trades: 5,
        win_rate: 60.0,
        profit_factor: 2.0,
        largest_win: 180.50,
        largest_loss: -85.75
      },
      {
        symbol: "ADAUSDT",
        total_pnl: 150.00,
        total_trades: 2,
        win_rate: 50.0,
        profit_factor: 1.8,
        largest_win: 95.25,
        largest_loss: -45.25
      }
    ];
  };
  
  const getMockTradeHistory = (): TradeHistory[] => {
    const trades: TradeHistory[] = [];
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "ADAUSDT"];
    const actions = ["BUY", "SELL"];
    
    for (let i = 0; i < 20; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const entryTime = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
      const exitTime = new Date(entryTime.getTime() + 12 * 60 * 60 * 1000);
      const entryPrice = symbol === "BTCUSDT" ? 42000 + Math.random() * 2000 :
                        symbol === "ETHUSDT" ? 2200 + Math.random() * 300 :
                        symbol === "SOLUSDT" ? 110 + Math.random() * 20 :
                        symbol === "BNBUSDT" ? 300 + Math.random() * 50 :
                        1.2 + Math.random() * 0.3;
      const exitPrice = entryPrice * (1 + (Math.random() * 0.1 - 0.05));
      const quantity = symbol === "BTCUSDT" ? 0.05 :
                      symbol === "ETHUSDT" ? 0.5 :
                      symbol === "SOLUSDT" ? 5 :
                      symbol === "BNBUSDT" ? 1 : 100;
      const pnl = (exitPrice - entryPrice) * quantity * (action === "BUY" ? 1 : -1);
      
      trades.push({
        id: `trade-${i}`,
        symbol,
        action,
        quantity,
        entry_price: entryPrice,
        exit_price: exitPrice,
        entry_time: entryTime.toISOString(),
        exit_time: exitTime.toISOString(),
        pnl,
        status: "CLOSED"
      });
    }
    
    return trades;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    positive?: boolean;
    icon: React.ComponentType<any>;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
  }> = ({ title, value, change, positive, icon: Icon, description, trend }) => (
    <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-medium text-gray-400">{title}</h3>
        </div>
        {trend && (
          <div className={clsx(
            "p-1 rounded-full",
            trend === 'up' ? "bg-green-500/20" : trend === 'down' ? "bg-red-500/20" : "bg-gray-500/20"
          )}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : (
              <Activity className="w-4 h-4 text-gray-400" />
            )}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">
        {typeof value === 'number' ? formatCurrency(value) : value}
      </div>
      {change !== undefined && (
        <div className="flex items-center space-x-1 mb-1">
          <span className={clsx(
            "text-sm font-medium",
            positive ? "text-green-400" : "text-red-400"
          )}>
            {formatPercentage(change)}
          </span>
        </div>
      )}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading P&L data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 rounded-xl p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      </div>
    );
  }

  if (!portfolioSummary) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No P&L data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio Analytics</h1>
          <p className="text-gray-400">Track your trading performance and P&L</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-gray-800/30 rounded-lg p-1">
            {(['7D', '30D', '90D'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={clsx(
                  "px-3 py-1 rounded-md text-sm font-medium transition-all",
                  timeframe === period
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                )}
              >
                {period}
              </button>
            ))}
          </div>
          <button
            onClick={fetchPnLData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800/30 backdrop-blur-lg rounded-xl p-1 border border-gray-700/50">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'positions', label: 'Positions', icon: PieChartIcon },
          { id: 'trades', label: 'Trade History', icon: Target },
          { id: 'performance', label: 'Performance', icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all flex-1 justify-center",
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Portfolio Value"
              value={portfolioSummary.portfolio_value}
              change={portfolioSummary.total_return_pct}
              positive={portfolioSummary.total_return > 0}
              icon={DollarSign}
              description={`${formatCurrency(portfolioSummary.total_return)} total return`}
              trend={portfolioSummary.total_return > 0 ? 'up' : portfolioSummary.total_return < 0 ? 'down' : 'neutral'}
            />
            <MetricCard
              title="Daily P&L"
              value={portfolioSummary.daily_pnl}
              positive={portfolioSummary.daily_pnl > 0}
              icon={TrendingUp}
              description={`${portfolioSummary.daily_trades} trades today`}
              trend={portfolioSummary.daily_pnl > 0 ? 'up' : portfolioSummary.daily_pnl < 0 ? 'down' : 'neutral'}
            />
            <MetricCard
              title="Win Rate"
              value={`${portfolioSummary.win_rate.toFixed(1)}%`}
              icon={Target}
              description={`${portfolioSummary.total_trades} total trades`}
              trend={portfolioSummary.win_rate > 60 ? 'up' : portfolioSummary.win_rate < 40 ? 'down' : 'neutral'}
            />
            <MetricCard
              title="Open Positions"
              value={portfolioSummary.open_positions_count}
              icon={Activity}
              description={formatCurrency(portfolioSummary.unrealized_pnl) + ' unrealized'}
              trend={portfolioSummary.unrealized_pnl > 0 ? 'up' : portfolioSummary.unrealized_pnl < 0 ? 'down' : 'neutral'}
            />
          </div>

          {/* Equity Curve */}
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">Portfolio Equity Curve</h3>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={equityCurve}>
                  <defs>
                    <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#9CA3AF"
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis stroke="#9CA3AF" tickFormatter={formatCurrency} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    formatter={(value: any, name: string) => [
                      name === 'portfolio_value' ? formatCurrency(value) : formatPercentage(value),
                      name === 'portfolio_value' ? 'Portfolio Value' : 'Total Return %'
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="portfolio_value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#portfolioGradient)"
                    name="Portfolio Value"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* P&L Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Realized vs Unrealized */}
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-6">P&L Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div>
                    <span className="text-green-300 text-sm font-medium">Realized P&L</span>
                    <p className="text-green-400 text-xl font-bold">{formatCurrency(portfolioSummary.realized_pnl)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div>
                    <span className="text-blue-300 text-sm font-medium">Unrealized P&L</span>
                    <p className={clsx(
                      "text-xl font-bold",
                      portfolioSummary.unrealized_pnl >= 0 ? "text-blue-400" : "text-red-400"
                    )}>
                      {formatCurrency(portfolioSummary.unrealized_pnl)}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Performance by Asset Pie Chart */}
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-6">P&L by Asset</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={Object.entries(portfolioSummary.symbol_breakdown).map(([symbol, pnl], index) => ({
                        name: symbol,
                        value: Math.abs(pnl),
                        actualValue: pnl,
                        color: COLORS[index % COLORS.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(portfolioSummary.symbol_breakdown).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string, props: any) => [
                        formatCurrency(props.payload.actualValue),
                        name
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'positions' && (
        <div className="space-y-6">
          {/* Position Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Open Positions"
              value={portfolioSummary.open_positions_count}
              icon={PieChartIcon}
              description="Currently active"
            />
            <MetricCard
              title="Unrealized P&L"
              value={portfolioSummary.unrealized_pnl}
              positive={portfolioSummary.unrealized_pnl > 0}
              icon={TrendingUp}
              description="Mark-to-market"
              trend={portfolioSummary.unrealized_pnl > 0 ? 'up' : portfolioSummary.unrealized_pnl < 0 ? 'down' : 'neutral'}
            />
            <MetricCard
              title="Avg Position Size"
              value={portfolioSummary.open_positions_count > 0 ? 
                formatCurrency(portfolioSummary.portfolio_value / portfolioSummary.open_positions_count) : 
                formatCurrency(0)}
              icon={DollarSign}
              description="Per position"
            />
          </div>

          {/* Open Positions Table */}
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">Open Positions</h3>
            {portfolioSummary.open_positions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 font-medium py-3">Symbol</th>
                      <th className="text-left text-gray-400 font-medium py-3">Action</th>
                      <th className="text-right text-gray-400 font-medium py-3">Quantity</th>
                      <th className="text-right text-gray-400 font-medium py-3">Entry Price</th>
                      <th className="text-right text-gray-400 font-medium py-3">Current Price</th>
                      <th className="text-right text-gray-400 font-medium py-3">Unrealized P&L</th>
                      <th className="text-right text-gray-400 font-medium py-3">Return %</th>
                      <th className="text-right text-gray-400 font-medium py-3">Days Held</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioSummary.open_positions.map((position) => (
                      <tr key={position.trade_id} className="border-b border-gray-800/50">
                        <td className="py-3 text-white font-medium">{position.symbol}</td>
                        <td className="py-3">
                          <span className={clsx(
                            "px-2 py-1 rounded-md text-xs font-medium",
                            position.action === 'BUY' 
                              ? "bg-green-900/50 text-green-300" 
                              : "bg-red-900/50 text-red-300"
                          )}>
                            {position.action}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-300">{position.quantity.toFixed(6)}</td>
                        <td className="py-3 text-right text-gray-300">{formatCurrency(position.entry_price)}</td>
                        <td className="py-3 text-right text-gray-300">{formatCurrency(position.current_price)}</td>
                        <td className={clsx(
                          "py-3 text-right font-medium",
                          position.unrealized_pnl >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {formatCurrency(position.unrealized_pnl)}
                        </td>
                        <td className={clsx(
                          "py-3 text-right font-medium",
                          position.unrealized_pnl_pct >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {formatPercentage(position.unrealized_pnl_pct)}
                        </td>
                        <td className="py-3 text-right text-gray-400">
                          {position.days_held}d
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <PieChartIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No open positions</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'trades' && (
        <div className="space-y-6">
          {/* Trade Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Trades"
              value={portfolioSummary.total_trades}
              icon={Target}
              description="All time"
            />
            <MetricCard
              title="Win Rate"
              value={`${portfolioSummary.win_rate.toFixed(1)}%`}
              icon={TrendingUp}
              description="Success rate"
            />
            <MetricCard
              title="Profit Factor"
              value={portfolioSummary.profit_factor.toFixed(2)}
              icon={DollarSign}
              description="Gross profit/loss ratio"
            />
            <MetricCard
              title="Daily Trades"
              value={portfolioSummary.daily_trades}
              icon={Activity}
              description="Today's activity"
            />
          </div>

          {/* Trade History Table */}
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">Recent Trades</h3>
            {tradeHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 font-medium py-3">Symbol</th>
                      <th className="text-left text-gray-400 font-medium py-3">Action</th>
                      <th className="text-right text-gray-400 font-medium py-3">Quantity</th>
                      <th className="text-right text-gray-400 font-medium py-3">Entry Price</th>
                      <th className="text-right text-gray-400 font-medium py-3">Exit Price</th>
                      <th className="text-right text-gray-400 font-medium py-3">P&L</th>
                      <th className="text-left text-gray-400 font-medium py-3">Status</th>
                      <th className="text-right text-gray-400 font-medium py-3">Entry Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistory.map((trade) => (
                      <tr key={trade.id} className="border-b border-gray-800/50">
                        <td className="py-3 text-white font-medium">{trade.symbol}</td>
                        <td className="py-3">
                          <span className={clsx(
                            "px-2 py-1 rounded-md text-xs font-medium",
                            trade.action === 'BUY' 
                              ? "bg-green-900/50 text-green-300" 
                              : "bg-red-900/50 text-red-300"
                          )}>
                            {trade.action}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-300">{trade.quantity.toFixed(6)}</td>
                        <td className="py-3 text-right text-gray-300">{formatCurrency(trade.entry_price)}</td>
                        <td className="py-3 text-right text-gray-300">
                          {trade.exit_price ? formatCurrency(trade.exit_price) : '-'}
                        </td>
                        <td className={clsx(
                          "py-3 text-right font-medium",
                          trade.pnl !== undefined ? (trade.pnl >= 0 ? "text-green-400" : "text-red-400") : "text-gray-400"
                        )}>
                          {trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
                        </td>
                        <td className="py-3">
                          <span className={clsx(
                            "px-2 py-1 rounded-md text-xs font-medium",
                            trade.status === 'CLOSED' 
                              ? "bg-gray-900/50 text-gray-300"
                              : "bg-blue-900/50 text-blue-300"
                          )}>
                            {trade.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-400">
                          {format(new Date(trade.entry_time), 'MMM dd, HH:mm')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No trades found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance by Asset */}
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">Performance by Asset</h3>
            {performanceByAsset.length > 0 ? (
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={performanceByAsset}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="symbol" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" tickFormatter={formatCurrency} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any) => [formatCurrency(value), 'Total P&L']}
                    />
                    <Bar 
                      dataKey="total_pnl" 
                      fill="#3B82F6"
                      name="Total P&L"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No performance data available</p>
              </div>
            )}
          </div>

          {/* Asset Performance Table */}
          {performanceByAsset.length > 0 && (
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-6">Detailed Asset Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 font-medium py-3">Symbol</th>
                      <th className="text-right text-gray-400 font-medium py-3">Total P&L</th>
                      <th className="text-right text-gray-400 font-medium py-3">Total Trades</th>
                      <th className="text-right text-gray-400 font-medium py-3">Win Rate</th>
                      <th className="text-right text-gray-400 font-medium py-3">Profit Factor</th>
                      <th className="text-right text-gray-400 font-medium py-3">Best Trade</th>
                      <th className="text-right text-gray-400 font-medium py-3">Worst Trade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceByAsset.map((asset) => (
                      <tr key={asset.symbol} className="border-b border-gray-800/50">
                        <td className="py-3 text-white font-medium">{asset.symbol}</td>
                        <td className={clsx(
                          "py-3 text-right font-medium",
                          asset.total_pnl >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {formatCurrency(asset.total_pnl)}
                        </td>
                        <td className="py-3 text-right text-gray-300">{asset.total_trades}</td>
                        <td className="py-3 text-right text-gray-300">{asset.win_rate.toFixed(1)}%</td>
                        <td className="py-3 text-right text-gray-300">{asset.profit_factor.toFixed(2)}</td>
                        <td className="py-3 text-right text-green-400">{formatCurrency(asset.largest_win)}</td>
                        <td className="py-3 text-right text-red-400">{formatCurrency(asset.largest_loss)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PnLDashboard;
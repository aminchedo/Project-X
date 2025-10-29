import React, { useState, useEffect } from 'react';
import { Activity, Brain, BarChart3, Settings, Bell, RefreshCw } from 'lucide-react';
import PredictionPanel from './PredictionPanel';
import RealTimeFeed from './RealTimeFeed';
import MultiChart from './MultiChart';

interface DashboardState {
  selectedSymbol: string;
  selectedTimeframe: string;
  autoRefresh: boolean;
  notifications: boolean;
}

const EnhancedDashboard: React.FC = () => {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    selectedSymbol: 'BTC',
    selectedTimeframe: '1h',
    autoRefresh: true,
    notifications: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'MATIC', 'DOT', 'LINK', 'LTC', 'XRP'];
  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' },
  ];

  useEffect(() => {
    if (dashboardState.autoRefresh) {
      const interval = setInterval(() => {
        // Trigger refresh of all components
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }
  }, [dashboardState.autoRefresh]);

  const handleSymbolChange = (symbol: string) => {
    setDashboardState(prev => ({ ...prev, selectedSymbol: symbol }));
  };

  const handleTimeframeChange = (timeframe: string) => {
    setDashboardState(prev => ({ ...prev, selectedTimeframe: timeframe }));
  };

  const toggleAutoRefresh = () => {
    setDashboardState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }));
  };

  const toggleNotifications = () => {
    setDashboardState(prev => ({ ...prev, notifications: !prev.notifications }));
  };

  const manualRefresh = () => {
    setIsRefreshing(true);
    // Force refresh all components
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BOLT AI Neural Agent</h1>
            <p className="text-gray-600 mt-1">Advanced Cryptocurrency Analysis Dashboard</p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Symbol Selector */}
            <select
              value={dashboardState.selectedSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>

            {/* Timeframe Selector */}
            <select
              value={dashboardState.selectedTimeframe}
              onChange={(e) => handleTimeframeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeframes.map(tf => (
                <option key={tf.value} value={tf.value}>{tf.label}</option>
              ))}
            </select>

            {/* Auto Refresh Toggle */}
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                dashboardState.autoRefresh
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Auto Refresh</span>
            </button>

            {/* Notifications Toggle */}
            <button
              onClick={toggleNotifications}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                dashboardState.notifications
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm">Alerts</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={manualRefresh}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Real-time Feed */}
        <div className="lg:col-span-1">
          <RealTimeFeed 
            symbols={symbols}
            className="h-fit"
          />
        </div>

        {/* Middle Column - Chart */}
        <div className="lg:col-span-1">
          <MultiChart
            symbol={dashboardState.selectedSymbol}
            timeframe={dashboardState.selectedTimeframe}
            className="h-fit"
          />
        </div>

        {/* Right Column - AI Prediction */}
        <div className="lg:col-span-1">
          <PredictionPanel
            symbol={dashboardState.selectedSymbol}
            className="h-fit"
          />
        </div>
      </div>

      {/* Secondary Grid - Additional Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
        {/* Market Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Market Overview</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Market Cap</span>
              <span className="font-semibold">$2.1T</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">24h Volume</span>
              <span className="font-semibold">$89.2B</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">BTC Dominance</span>
              <span className="font-semibold">42.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fear & Greed</span>
              <span className="font-semibold text-orange-600">Neutral (52)</span>
            </div>
          </div>
        </div>

        {/* AI Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">AI Performance</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Accuracy (7d)</span>
              <span className="font-semibold text-green-600">73.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Predictions</span>
              <span className="font-semibold">1,247</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Confidence</span>
              <span className="font-semibold text-blue-600">High</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Training</span>
              <span className="font-semibold">2h ago</span>
            </div>
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">Risk Metrics</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">VaR (95%)</span>
              <span className="font-semibold text-red-600">-2.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Drawdown</span>
              <span className="font-semibold text-red-600">-8.7%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sharpe Ratio</span>
              <span className="font-semibold text-green-600">1.42</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Volatility</span>
              <span className="font-semibold text-orange-600">Medium</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">System Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Status</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-green-600">Online</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Data Feed</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">Live</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">AI Model</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-green-600">Active</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime</span>
              <span className="font-semibold">99.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <p>BOLT AI Neural Agent System v1.0.0</p>
            <p className="mt-1">
              ⚠️ <strong>Disclaimer:</strong> This system provides AI-generated predictions for informational purposes only. 
              Not financial advice. Cryptocurrency trading involves significant risk.
            </p>
          </div>
          <div className="text-right">
            <p>Last Updated: {new Date().toLocaleString()}</p>
            <p className="mt-1">
              {dashboardState.autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;

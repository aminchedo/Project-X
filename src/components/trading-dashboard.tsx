import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Play, Pause, RefreshCw, AlertTriangle, CheckCircle,
  ArrowUpRight, ArrowDownRight, Clock, DollarSign,
  BookOpen, Brain, History, Settings, Filter
} from 'lucide-react';

// Technical Panel Component
function TechnicalPanel() {
  const [selectedIndicator, setSelectedIndicator] = useState('RSI');
  const [timeframe, setTimeframe] = useState('1D');
  
  const chartData = Array.from({ length: 20 }, (_, i) => ({
    date: `2024-01-${i + 1}`,
    price: 50000 + Math.random() * 5000,
    volume: Math.random() * 1000000,
    rsi: 30 + Math.random() * 40
  }));

  const indicators = ['RSI', 'MACD', 'Bollinger Bands', 'Moving Average'];
  const timeframes = ['5m', '15m', '1H', '4H', '1D', '1W'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          {indicators.map(ind => (
            <button
              key={ind}
              onClick={() => setSelectedIndicator(ind)}
              className={`px-4 py-2 rounded-lg ${
                selectedIndicator === ind 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded ${
                timeframe === tf 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Price Chart</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#2563eb" 
                    fill="#3b82f6" 
                    fillOpacity={0.1} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">{selectedIndicator}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="rsi" 
                    stroke="#2563eb" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Orders Panel Component
function OrdersPanel() {
  const [activeTab, setActiveTab] = useState('open');
  
  const orders = {
    open: [
      { id: 1, pair: 'BTC/USD', type: 'Buy', amount: 0.5, price: 51200, status: 'pending' },
      { id: 2, pair: 'ETH/USD', type: 'Sell', amount: 2.0, price: 3100, status: 'partial' }
    ],
    history: [
      { id: 3, pair: 'BTC/USD', type: 'Sell', amount: 0.3, price: 50900, status: 'completed' },
      { id: 4, pair: 'SOL/USD', type: 'Buy', amount: 10, price: 102, status: 'cancelled' }
    ]
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      partial: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    
    const badge = badges[status];
    const Icon = badge.icon;
    
    return (
      <span className={`flex items-center space-x-1 px-2 py-1 rounded-full ${badge.color}`}>
        <Icon size={14} />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveTab('open')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'open' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          Open Orders
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'history' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          Order History
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="px-6 py-3 text-left">Pair</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Price</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders[activeTab].map(order => (
              <tr key={order.id}>
                <td className="px-6 py-4">{order.pair}</td>
                <td className="px-6 py-4">
                  <span className={`${
                    order.type === 'Buy' 
                      ? 'text-green-500' 
                      : 'text-red-500'
                  }`}>
                    {order.type}
                  </span>
                </td>
                <td className="px-6 py-4">{order.amount}</td>
                <td className="px-6 py-4">${order.price}</td>
                <td className="px-6 py-4">
                  {getStatusBadge(order.status)}
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-500 hover:text-blue-700">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main Dashboard Component
const TradingDashboard = () => {
  const [activeTab, setActiveTab] = useState('technical');

  const tabs = [
    { id: 'technical', label: 'Technical Analysis' },
    { id: 'orders', label: 'Orders' }
  ];

  const renderPanel = () => {
    switch (activeTab) {
      case 'technical':
        return <TechnicalPanel />;
      case 'orders':
        return <OrdersPanel />;
      default:
        return <TechnicalPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex space-x-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
/**
 * HTS Trading System - Main Application Component
 * Professional cryptocurrency trading platform with real-time signals and portfolio management
 */

import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Dashboard from './components/Dashboard';
import PortfolioPanel from './components/PortfolioPanel';
import BacktestPanel from './components/BacktestPanel';
import PnLDashboard from './components/PnLDashboard';
import RiskPanel from './components/RiskPanel';

// Services
import { apiClient } from './services/api';
import telegramService from './services/telegram';

// Icons
import { 
  TrendingUp, 
  Briefcase, 
  BarChart3, 
  DollarSign, 
  Shield, 
  Activity,
  Wifi,
  WifiOff,
  Bell,
  Settings
} from 'lucide-react';

// Types
interface AppState {
  currentTab: string;
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  portfolioValue: number;
  dailyPnL: number;
  apiHealthCount: { healthy: number; total: number };
}

const App: React.FC = () => {
  // State
  const [state, setState] = useState<AppState>({
    currentTab: 'signals',
    isConnected: false,
    connectionStatus: 'disconnected',
    portfolioValue: 0,
    dailyPnL: 0,
    apiHealthCount: { healthy: 0, total: 0 }
  });

  const [websocket, setWebSocket] = useState<WebSocket | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Navigation tabs
  const tabs = [
    { id: 'signals', name: 'Trading Signals', icon: TrendingUp, component: Dashboard },
    { id: 'portfolio', name: 'Portfolio', icon: Briefcase, component: PortfolioPanel },
    { id: 'backtest', name: 'Backtesting', icon: BarChart3, component: BacktestPanel },
    { id: 'pnl', name: 'P&L Analytics', icon: DollarSign, component: PnLDashboard },
    { id: 'risk', name: 'Risk Management', icon: Shield, component: RiskPanel }
  ];

  // WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    // Load initial data
    loadInitialData();

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    try {
      const ws = apiClient.createWebSocket(
        handleWebSocketMessage,
        handleWebSocketError
      );

      ws.onopen = () => {
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          connectionStatus: 'connected' 
        }));
      };

      ws.onclose = () => {
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          connectionStatus: 'disconnected' 
        }));
        
        // Attempt reconnection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      setWebSocket(ws);
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
      
      // Retry connection after 5 seconds
      setTimeout(connectWebSocket, 5000);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.channel) {
      case 'portfolio':
        if (data.data) {
          setState(prev => ({
            ...prev,
            portfolioValue: data.data.total_value || 0,
            dailyPnL: data.data.daily_pnl || 0
          }));

          // Send Telegram notification for significant portfolio changes
          if (Math.abs(data.data.daily_pnl_pct) >= 2) {
            telegramService.notifyPortfolioUpdate(data.data);
          }
        }
        break;

      case 'signals':
        // Handle signal updates
        if (data.data) {
          Object.values(data.data).forEach((signal: any) => {
            if (signal.confidence >= 75) {
              telegramService.notifySignalAlert(signal);
            }
          });
        }
        break;

      case 'api_health':
        if (data.data) {
          const healthyCount = Object.values(data.data).filter(
            (api: any) => api.status === 'healthy'
          ).length;
          const totalCount = Object.keys(data.data).length;
          
          setState(prev => ({
            ...prev,
            apiHealthCount: { healthy: healthyCount, total: totalCount }
          }));

          // Notify if API health is degraded
          if (healthyCount / totalCount < 0.9) {
            telegramService.notifyAPIStatus(data.data);
          }
        }
        break;

      default:
        console.log('Unhandled WebSocket message:', data);
    }
  };

  const handleWebSocketError = (error: Event) => {
    console.error('WebSocket error:', error);
    setState(prev => ({ 
      ...prev, 
      isConnected: false, 
      connectionStatus: 'disconnected' 
    }));
  };

  const loadInitialData = async () => {
    try {
      // Load portfolio data
      const portfolio = await apiClient.getPortfolioStatus();
      setState(prev => ({
        ...prev,
        portfolioValue: portfolio.total_value,
        dailyPnL: portfolio.daily_pnl
      }));

      // Load API health data
      const apiHealth = await apiClient.getAllAPIsHealth();
      const healthyCount = Object.values(apiHealth).filter(
        (api: any) => api.status === 'healthy'
      ).length;
      
      setState(prev => ({
        ...prev,
        apiHealthCount: { healthy: healthyCount, total: Object.keys(apiHealth).length }
      }));
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const handleTabChange = (tabId: string) => {
    setState(prev => ({ ...prev, currentTab: tabId }));
  };

  const getCurrentComponent = () => {
    const currentTab = tabs.find(tab => tab.id === state.currentTab);
    if (currentTab) {
      const Component = currentTab.component;
      return <Component />;
    }
    return <Dashboard />;
  };

  const getConnectionIcon = () => {
    switch (state.connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-bull-400" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-yellow-400 animate-pulse" />;
      default:
        return <WifiOff className="w-4 h-4 text-bear-400" />;
    }
  };

  const getConnectionText = () => {
    switch (state.connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-dark-50">
      {/* Header */}
      <header className="glass-card border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-bull-500 to-neon-blue rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient-neon">
                HTS Trading System
              </h1>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-6">
            {/* Portfolio Value */}
            <div className="text-right">
              <div className="text-sm text-dark-400">Portfolio Value</div>
              <div className="text-lg font-semibold">
                ${state.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Daily P&L */}
            <div className="text-right">
              <div className="text-sm text-dark-400">Daily P&L</div>
              <div className={`text-lg font-semibold ${
                state.dailyPnL >= 0 ? 'text-bull-400' : 'text-bear-400'
              }`}>
                {state.dailyPnL >= 0 ? '+' : ''}${state.dailyPnL.toFixed(2)}
              </div>
            </div>

            {/* API Health */}
            <div className="text-right">
              <div className="text-sm text-dark-400">API Health</div>
              <div className="text-lg font-semibold">
                <span className="text-bull-400">{state.apiHealthCount.healthy}</span>
                <span className="text-dark-400">/{state.apiHealthCount.total}</span>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg glass-light">
              {getConnectionIcon()}
              <span className="text-sm">{getConnectionText()}</span>
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gray-700/50 px-6 py-3">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = state.currentTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {getCurrentComponent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />

      {/* Settings Modal (placeholder) */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Telegram Notifications
                </label>
                <p className="text-sm text-dark-400 mb-2">
                  Configure Telegram bot for real-time alerts
                </p>
                <button
                  onClick={() => telegramService.setupWizard()}
                  className="btn-secondary w-full"
                >
                  Setup Telegram Bot
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Connection Status
                </label>
                <div className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                  <span>WebSocket</span>
                  <div className="flex items-center space-x-2">
                    {getConnectionIcon()}
                    <span className="text-sm">{getConnectionText()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default App;
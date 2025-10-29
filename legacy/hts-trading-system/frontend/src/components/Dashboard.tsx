/**
 * HTS Trading System - Main Dashboard Component
 * Real-time trading signals with professional dark theme and glassmorphism effects
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Zap,
  Eye,
  BarChart3,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react';

// Services
import { 
  apiClient, 
  TradingSignal, 
  PriceData, 
  APIHealthStatus,
  formatPrice,
  formatPercentage,
  getSignalColor,
  getStatusColor
} from '../services/api';

// Types
interface DashboardState {
  signals: Record<string, TradingSignal>;
  prices: Record<string, PriceData>;
  apiHealth: Record<string, APIHealthStatus>;
  loading: boolean;
  selectedSymbol: string | null;
  lastUpdate: Date;
}

interface SignalCardProps {
  signal: TradingSignal;
  price: PriceData | undefined;
  onSelect: (symbol: string) => void;
  isSelected: boolean;
}

interface APIStatusProps {
  apiHealth: Record<string, APIHealthStatus>;
}

const Dashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    signals: {},
    prices: {},
    apiHealth: {},
    loading: true,
    selectedSymbol: null,
    lastUpdate: new Date()
  });

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all data in parallel
      const [signalsData, pricesData, apiHealthData] = await Promise.all([
        apiClient.getAllSignals(),
        apiClient.getAllPrices(),
        apiClient.getAllAPIsHealth()
      ]);

      setState(prev => ({
        ...prev,
        signals: signalsData,
        prices: pricesData,
        apiHealth: apiHealthData,
        loading: false,
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSignalSelect = (symbol: string) => {
    setState(prev => ({
      ...prev,
      selectedSymbol: prev.selectedSymbol === symbol ? null : symbol
    }));
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return <TrendingUp className="w-5 h-5" />;
      case 'BUY':
        return <TrendingUp className="w-4 h-4" />;
      case 'HOLD':
        return <Minus className="w-4 h-4" />;
      case 'SELL':
        return <TrendingDown className="w-4 h-4" />;
      case 'STRONG_SELL':
        return <TrendingDown className="w-5 h-5" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-bull-400';
    if (confidence >= 60) return 'text-yellow-400';
    if (confidence >= 40) return 'text-orange-400';
    return 'text-bear-400';
  };

  if (state.loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 bg-dark-700 rounded mb-4"></div>
              <div className="h-8 bg-dark-700 rounded mb-2"></div>
              <div className="h-4 bg-dark-700 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-dark-700 rounded w-20"></div>
                <div className="h-4 bg-dark-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-bull-400">
            {Object.values(state.signals).filter(s => s.signal === 'STRONG_BUY' || s.signal === 'BUY').length}
          </div>
          <div className="metric-label">Buy Signals</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-bear-400">
            {Object.values(state.signals).filter(s => s.signal === 'STRONG_SELL' || s.signal === 'SELL').length}
          </div>
          <div className="metric-label">Sell Signals</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-yellow-400">
            {Object.values(state.signals).filter(s => s.signal === 'HOLD').length}
          </div>
          <div className="metric-label">Hold Signals</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-dark-300">
            {Object.values(state.signals).reduce((acc, s) => acc + s.confidence, 0) / Object.values(state.signals).length || 0}%
          </div>
          <div className="metric-label">Avg Confidence</div>
        </div>
      </div>

      {/* Trading Signals Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <Zap className="w-5 h-5 mr-2 text-neon-blue" />
            Live Trading Signals
          </h2>
          <div className="text-sm text-dark-400">
            Last updated: {state.lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(state.signals).map(([symbol, signal]) => (
            <SignalCard
              key={symbol}
              signal={signal}
              price={state.prices[symbol]}
              onSelect={handleSignalSelect}
              isSelected={state.selectedSymbol === symbol}
            />
          ))}
        </div>
      </div>

      {/* Selected Signal Details */}
      {state.selectedSymbol && state.signals[state.selectedSymbol] && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <SignalDetails 
            signal={state.signals[state.selectedSymbol]}
            price={state.prices[state.selectedSymbol]}
          />
        </motion.div>
      )}

      {/* API Health Status */}
      <APIHealthPanel apiHealth={state.apiHealth} />
    </div>
  );
};

// Signal Card Component
const SignalCard: React.FC<SignalCardProps> = ({ signal, price, onSelect, isSelected }) => {
  const signalColorClass = getSignalColor(signal.signal);
  const confidenceColor = signal.confidence >= 75 ? 'text-bull-400' : 
                         signal.confidence >= 50 ? 'text-yellow-400' : 'text-bear-400';
  
  const priceChange = price?.change_24h || 0;
  const priceChangeClass = priceChange >= 0 ? 'text-bull-400' : 'text-bear-400';

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`trading-card cursor-pointer ${isSelected ? 'ring-2 ring-bull-500/50' : ''}`}
      onClick={() => onSelect(signal.symbol)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-lg">{signal.symbol}</h3>
          {signal.confidence >= 75 && (
            <div className="w-2 h-2 bg-bull-400 rounded-full animate-pulse-glow"></div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-dark-400">Price</div>
          <div className="font-semibold">{formatPrice(signal.price)}</div>
        </div>
      </div>

      {/* Signal Badge */}
      <div className={`signal-badge ${signalColorClass} mb-4 flex items-center justify-center`}>
        {React.createElement(
          signal.signal.includes('STRONG') ? TrendingUp : 
          signal.signal === 'BUY' ? TrendingUp :
          signal.signal === 'SELL' ? TrendingDown : Minus,
          { className: 'w-4 h-4 mr-1' }
        )}
        {signal.signal.replace('_', ' ')}
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-dark-400">Confidence</span>
          <div className="flex items-center space-x-2">
            <div className={`text-sm font-semibold ${confidenceColor}`}>
              {signal.confidence.toFixed(1)}%
            </div>
            <div className="w-12 h-1 bg-dark-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  signal.confidence >= 75 ? 'bg-bull-400' :
                  signal.confidence >= 50 ? 'bg-yellow-400' : 'bg-bear-400'
                }`}
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
          </div>
        </div>

        {price && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-dark-400">24h Change</span>
            <span className={`text-sm font-semibold ${priceChangeClass}`}>
              {formatPercentage(priceChange)}
            </span>
          </div>
        )}

        {signal.rsi && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-dark-400">RSI</span>
            <span className="text-sm font-mono">{signal.rsi.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="mt-4 pt-3 border-t border-dark-700/50">
        <div className="flex items-center text-xs text-dark-400">
          <Clock className="w-3 h-3 mr-1" />
          {new Date(signal.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
};

// Signal Details Component
const SignalDetails: React.FC<{ signal: TradingSignal; price?: PriceData }> = ({ 
  signal, 
  price 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center">
          <Target className="w-5 h-5 mr-2 text-neon-blue" />
          {signal.symbol} Signal Analysis
        </h3>
        <div className={`signal-badge ${getSignalColor(signal.signal)}`}>
          {signal.signal.replace('_', ' ')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Price Info */}
        <div className="glass-light p-4 rounded-lg">
          <div className="text-sm text-dark-400 mb-1">Current Price</div>
          <div className="text-xl font-bold">{formatPrice(signal.price)}</div>
          {price && (
            <div className={`text-sm ${price.change_24h >= 0 ? 'text-bull-400' : 'text-bear-400'}`}>
              {formatPercentage(price.change_24h)} 24h
            </div>
          )}
        </div>

        {/* Confidence */}
        <div className="glass-light p-4 rounded-lg">
          <div className="text-sm text-dark-400 mb-1">Confidence</div>
          <div className="text-xl font-bold">{signal.confidence.toFixed(1)}%</div>
          <div className="w-full h-2 bg-dark-700 rounded-full mt-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                signal.confidence >= 75 ? 'bg-bull-400' :
                signal.confidence >= 50 ? 'bg-yellow-400' : 'bg-bear-400'
              }`}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
        </div>

        {/* RSI */}
        {signal.rsi && (
          <div className="glass-light p-4 rounded-lg">
            <div className="text-sm text-dark-400 mb-1">RSI</div>
            <div className="text-xl font-bold">{signal.rsi.toFixed(1)}</div>
            <div className="text-sm text-dark-400">
              {signal.rsi < 30 ? 'Oversold' : signal.rsi > 70 ? 'Overbought' : 'Neutral'}
            </div>
          </div>
        )}

        {/* MACD */}
        {signal.macd && (
          <div className="glass-light p-4 rounded-lg">
            <div className="text-sm text-dark-400 mb-1">MACD</div>
            <div className="text-xl font-bold">{signal.macd.toFixed(4)}</div>
            <div className="text-sm text-dark-400">
              {signal.macd > 0 ? 'Bullish' : 'Bearish'}
            </div>
          </div>
        )}
      </div>

      {/* Signal Components */}
      {signal.components && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Signal Components</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(signal.components).map(([key, value]) => (
              <div key={key} className="glass-light p-3 rounded-lg text-center">
                <div className="text-xs text-dark-400 uppercase tracking-wide mb-1">
                  {key.replace('_', ' ')}
                </div>
                <div className="text-lg font-bold">{value.toFixed(1)}</div>
                <div className="w-full h-1 bg-dark-700 rounded-full mt-2">
                  <div 
                    className="h-full bg-gradient-to-r from-bear-400 via-yellow-400 to-bull-400 rounded-full"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// API Health Panel Component
const APIHealthPanel: React.FC<APIStatusProps> = ({ apiHealth }) => {
  const healthyCount = Object.values(apiHealth).filter(api => api.status === 'healthy').length;
  const totalCount = Object.keys(apiHealth).length;
  const uptimePercentage = totalCount > 0 ? (healthyCount / totalCount) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <div className="w-2 h-2 bg-bull-400 rounded-full" />;
      case 'degraded':
        return <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />;
      case 'down':
        return <div className="w-2 h-2 bg-bear-400 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-dark-400 rounded-full" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-neon-blue" />
          API Health Status
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-bull-400">{healthyCount}</span>
            <span className="text-dark-400">/{totalCount}</span>
            <span className="text-dark-400 ml-2">APIs Online</span>
          </div>
          <div className={`text-sm font-semibold ${
            uptimePercentage >= 95 ? 'text-bull-400' :
            uptimePercentage >= 80 ? 'text-yellow-400' : 'text-bear-400'
          }`}>
            {uptimePercentage.toFixed(1)}% Uptime
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {Object.entries(apiHealth).slice(0, 15).map(([name, api]) => (
          <div key={name} className="glass-light p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium truncate">{api.name}</div>
              {getStatusIcon(api.status)}
            </div>
            <div className="text-xs text-dark-400">
              {api.response_time.toFixed(0)}ms
            </div>
            <div className={`text-xs ${getStatusColor(api.status)}`}>
              {api.status}
            </div>
          </div>
        ))}
        
        {totalCount > 15 && (
          <div className="glass-light p-3 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-dark-400">
                +{totalCount - 15}
              </div>
              <div className="text-xs text-dark-400">More APIs</div>
            </div>
          </div>
        )}
      </div>

      {uptimePercentage < 90 && (
        <div className="glass-card border-l-4 border-yellow-400 p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <div className="font-medium text-yellow-400">API Health Warning</div>
              <div className="text-sm text-dark-300 mt-1">
                System uptime is below optimal levels. Some APIs may be experiencing issues.
                Automatic failover is active to maintain service reliability.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
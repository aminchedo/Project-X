import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  Zap, 
  Brain, 
  BarChart3, 
  Layers,
  Settings,
  Maximize2,
  Minimize2,
  RefreshCw,
  Shield
} from 'lucide-react';

import Market3DVisualization from './MarketVisualization3D';
import CorrelationHeatMap from './showcase/CorrelationHeatMap';
import MarketDepthChart from './MarketDepthChart';
import RealTimeRiskMonitor from './RealTimeRiskMonitor';
import AIInsightsPanel from './AIInsightsPanel';

interface Signal {
  symbol: string;
  timestamp: number;
  signal_type: string;
  strength: number;
  confidence: number;
  direction: string;
  metadata: any;
}

interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
  volatility: number;
}

interface Prediction {
  symbol: string;
  timestamp: string;
  prediction: number;
  confidence: number;
  signal_direction: string;
  signal_strength: number;
  individual_predictions: {
    random_forest: number;
    gradient_boosting: number;
    neural_network: number;
  };
}

interface Strategy {
  id: string;
  name: string;
  symbol: string;
  type: string;
  created_at: string;
  parameters: any;
  expected_performance: {
    win_rate: number;
    avg_return: number;
    max_drawdown: number;
  };
}

const PredictiveAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | '3d' | 'depth' | 'correlations' | 'strategies' | 'risk' | 'ai'>('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  
  // Real-time data states
  const [signals, setSignals] = useState<Signal[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [predictions, setPredictions] = useState<{[key: string]: Prediction}>({});
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [correlationData, setCorrelationData] = useState<any>(null);
  const [depthData, setDepthData] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection and management
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionStatus('connecting');
    
    try {
      wsRef.current = new WebSocket('ws://localhost:8000/ws/realtime');
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setIsConnected(true);
        
        // Subscribe to all symbols
        const subscribeMessage = {
          action: 'subscribe',
          symbols: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 'AAPL', 'GOOGL', 'TSLA', 'MSFT']
        };
        wsRef.current?.send(JSON.stringify(subscribeMessage));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };
      
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'market_data':
        updateMarketData(message.data);
        break;
      case 'signal':
        updateSignals(message.data);
        break;
      case 'prediction_response':
        updatePredictions(message.symbol, message.data);
        break;
      case 'strategy_generated':
        updateStrategies(message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const updateMarketData = (data: any) => {
    setMarketData(prevData => {
      const existingIndex = prevData.findIndex(item => item.symbol === data.symbol);
      const newItem: MarketData = {
        symbol: data.symbol,
        price: data.price,
        volume: data.volume,
        change24h: Math.random() * 10 - 5, // Mock change
        volatility: Math.random() * 0.05
      };
      
      if (existingIndex >= 0) {
        const updated = [...prevData];
        updated[existingIndex] = newItem;
        return updated;
      } else {
        return [...prevData, newItem];
      }
    });
  };

  const updateSignals = (data: any) => {
    setSignals(prevSignals => {
      const newSignal: Signal = {
        symbol: data.symbol,
        timestamp: data.timestamp,
        signal_type: data.signal_type,
        strength: data.strength,
        confidence: data.confidence,
        direction: data.direction,
        metadata: data.metadata
      };
      
      // Keep only the last 50 signals
      const updated = [newSignal, ...prevSignals].slice(0, 50);
      return updated;
    });
  };

  const updatePredictions = (symbol: string, data: any) => {
    setPredictions(prev => ({
      ...prev,
      [symbol]: data
    }));
  };

  const updateStrategies = (data: any) => {
    setStrategies(prev => [data, ...prev].slice(0, 10));
  };

  // Fetch additional data
  useEffect(() => {
    const fetchCorrelations = async () => {
      try {
        const response = await fetch('/api/analytics/correlations');
        const data = await response.json();
        setCorrelationData(data);
      } catch (error) {
        console.error('Error fetching correlations:', error);
      }
    };

    const fetchDepthData = async () => {
      try {
        const response = await fetch(`/api/analytics/market-depth/${selectedSymbol}`);
        const data = await response.json();
        setDepthData(data);
      } catch (error) {
        console.error('Error fetching depth data:', error);
      }
    };

    const fetchPerformanceMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/performance-metrics');
        const data = await response.json();
        setPerformanceMetrics(data);
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
      }
    };

    const interval = setInterval(() => {
      fetchCorrelations();
      fetchDepthData();
      fetchPerformanceMetrics();
    }, 5000);

    fetchCorrelations();
    fetchDepthData();
    fetchPerformanceMetrics();

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const requestPrediction = (symbol: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'get_prediction',
        symbol: symbol
      };
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const generateStrategy = (symbol: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        action: 'generate_strategy',
        symbol: symbol,
        market_conditions: {
          volatility: 0.03,
          trend_strength: 0.6,
          volume_profile: 'high'
        }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'ai', label: 'AI Insights', icon: Brain },
    { id: '3d', label: '3D Market', icon: Layers },
    { id: 'depth', label: 'Market Depth', icon: BarChart3 },
    { id: 'correlations', label: 'Correlations', icon: TrendingUp },
    { id: 'strategies', label: 'Strategies', icon: Settings },
    { id: 'risk', label: 'Risk Monitor', icon: Shield }
  ];

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-gray-900 text-white min-h-screen`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold">Predictive Analytics Dashboard</h1>
            </div>
            
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              connectionStatus === 'connected' ? 'bg-green-900 text-green-300' :
              connectionStatus === 'connecting' ? 'bg-yellow-900 text-yellow-300' :
              'bg-red-900 text-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`} />
              <span>{connectionStatus}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Performance Metrics */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-gray-400">
                Connections: <span className="text-white">{performanceMetrics.active_connections || 0}</span>
              </div>
              <div className="text-gray-400">
                Symbols: <span className="text-white">{performanceMetrics.cached_symbols || 0}</span>
              </div>
              <div className="text-gray-400">
                Latency: <span className="text-white">{(performanceMetrics.latency_avg || 0).toFixed(1)}ms</span>
              </div>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-700 rounded"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Signal Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                      Real-time Signals
                    </h2>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {signals.map((signal, index) => (
                        <motion.div
                          key={`${signal.symbol}-${signal.timestamp}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-3 rounded border-l-4 ${
                            signal.direction === 'BUY' ? 'border-green-400 bg-green-900/20' : 'border-red-400 bg-red-900/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold">{signal.symbol}</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                signal.direction === 'BUY' ? 'bg-green-600' : 'bg-red-600'
                              }`}>
                                {signal.direction}
                              </span>
                              <span className="text-sm text-gray-400">
                                Strength: {(signal.strength * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(signal.timestamp * 1000).toLocaleTimeString()}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <select
                        value={selectedSymbol}
                        onChange={(e) => setSelectedSymbol(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                      >
                        {marketData.map(item => (
                          <option key={item.symbol} value={item.symbol}>
                            {item.symbol}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => requestPrediction(selectedSymbol)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded flex items-center justify-center space-x-2"
                      >
                        <Brain className="w-4 h-4" />
                        <span>Get Prediction</span>
                      </button>
                      
                      <button
                        onClick={() => generateStrategy(selectedSymbol)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded flex items-center justify-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Generate Strategy</span>
                      </button>
                    </div>
                  </div>

                  {/* Latest Prediction */}
                  {predictions[selectedSymbol] && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Latest Prediction</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Direction:</span>
                          <span className={
                            predictions[selectedSymbol].signal_direction === 'BUY' ? 'text-green-400' : 'text-red-400'
                          }>
                            {predictions[selectedSymbol].signal_direction}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span>{(predictions[selectedSymbol].confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Strength:</span>
                          <span>{predictions[selectedSymbol].signal_strength.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AIInsightsPanel
                selectedSymbol={selectedSymbol}
                onSymbolChange={setSelectedSymbol}
              />
            </motion.div>
          )}

          {activeTab === '3d' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Market3DVisualization
                marketData={marketData}
                selectedSymbol={selectedSymbol}
                onSymbolSelect={setSelectedSymbol}
              />
            </motion.div>
          )}

          {activeTab === 'depth' && depthData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MarketDepthChart
                data={depthData}
                width={1000}
                height={500}
              />
            </motion.div>
          )}

          {activeTab === 'correlations' && correlationData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CorrelationHeatMap
                data={correlationData}
                width={800}
                height={600}
                onCellClick={(symbol1, symbol2, correlation) => {
                  console.log(`Correlation between ${symbol1} and ${symbol2}: ${correlation}`);
                }}
              />
            </motion.div>
          )}

          {activeTab === 'strategies' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Auto-Generated Strategies</h2>
                <button
                  onClick={() => generateStrategy(selectedSymbol)}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded flex items-center space-x-2"
                >
                  <Brain className="w-4 h-4" />
                  <span>Generate New Strategy</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {strategies.map((strategy) => (
                  <div key={strategy.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">{strategy.name}</h3>
                      <span className="text-xs text-gray-400">
                        {new Date(strategy.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Symbol:</span>
                        <span className="font-mono">{strategy.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{strategy.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Win Rate:</span>
                        <span className="text-green-400">
                          {(strategy.expected_performance.win_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Return:</span>
                        <span className="text-blue-400">
                          {(strategy.expected_performance.avg_return * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Drawdown:</span>
                        <span className="text-red-400">
                          {(strategy.expected_performance.max_drawdown * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'risk' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RealTimeRiskMonitor />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
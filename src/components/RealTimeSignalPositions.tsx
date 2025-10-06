import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Clock, 
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface SignalPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  timestamp: number;
  confidence: number;
  status: 'active' | 'closed' | 'pending';
  stopLoss?: number;
  takeProfit?: number;
  riskScore: number;
}

interface SignalAlert {
  id: string;
  symbol: string;
  type: 'entry' | 'exit' | 'stop_loss' | 'take_profit';
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  price: number;
  side: 'long' | 'short';
}

const RealTimeSignalPositions: React.FC = () => {
  const [positions, setPositions] = useState<SignalPosition[]>([]);
  const [alerts, setAlerts] = useState<SignalAlert[]>([]);
  const [totalPnl, setTotalPnl] = useState<number>(0);
  const [activePositions, setActivePositions] = useState<number>(0);
  const [showClosed, setShowClosed] = useState<boolean>(false);

  useEffect(() => {
    generateMockPositions();
    
    // Real-time position updates every 2 seconds
    const positionInterval = setInterval(() => {
      updatePositions();
    }, 2000);

    // Alert updates every 3 seconds
    const alertInterval = setInterval(() => {
      updateAlerts();
    }, 3000);

    // PnL updates every 1 second
    const pnlInterval = setInterval(() => {
      updatePnL();
    }, 1000);

    return () => {
      clearInterval(positionInterval);
      clearInterval(alertInterval);
      clearInterval(pnlInterval);
    };
  }, []);

  const generateMockPositions = () => {
    const mockPositions: SignalPosition[] = [
      {
        id: '1',
        symbol: 'BTCUSDT',
        side: 'long',
        entryPrice: 43250.50,
        currentPrice: 43800.25,
        quantity: 0.5,
        unrealizedPnl: 274.88,
        unrealizedPnlPercent: 1.27,
        timestamp: Date.now() - 3600000,
        confidence: 0.85,
        status: 'active',
        stopLoss: 42000,
        takeProfit: 45000,
        riskScore: 6.5
      },
      {
        id: '2',
        symbol: 'ETHUSDT',
        side: 'short',
        entryPrice: 2650.75,
        currentPrice: 2620.30,
        quantity: 2.0,
        unrealizedPnl: 60.90,
        unrealizedPnlPercent: 1.15,
        timestamp: Date.now() - 7200000,
        confidence: 0.78,
        status: 'active',
        stopLoss: 2700,
        takeProfit: 2550,
        riskScore: 4.2
      },
      {
        id: '3',
        symbol: 'SOLUSDT',
        side: 'long',
        entryPrice: 98.45,
        currentPrice: 95.20,
        quantity: 10.0,
        unrealizedPnl: -32.50,
        unrealizedPnlPercent: -3.30,
        timestamp: Date.now() - 1800000,
        confidence: 0.72,
        status: 'active',
        stopLoss: 92.00,
        takeProfit: 105.00,
        riskScore: 7.8
      },
      {
        id: '4',
        symbol: 'ADAUSDT',
        side: 'long',
        entryPrice: 0.4850,
        currentPrice: 0.4920,
        quantity: 1000.0,
        unrealizedPnl: 70.00,
        unrealizedPnlPercent: 1.44,
        timestamp: Date.now() - 900000,
        confidence: 0.68,
        status: 'active',
        stopLoss: 0.4700,
        takeProfit: 0.5100,
        riskScore: 5.1
      }
    ];

    setPositions(mockPositions);
    setActivePositions(mockPositions.filter(p => p.status === 'active').length);
    setTotalPnl(mockPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0));
  };

  const updatePositions = () => {
    setPositions(prev => prev.map(position => {
      if (position.status !== 'active') return position;

      // Simulate price movement
      const priceChange = (Math.random() - 0.5) * position.currentPrice * 0.02;
      const newPrice = Math.max(0.01, position.currentPrice + priceChange);
      
      // Calculate new PnL
      const priceDiff = position.side === 'long' 
        ? newPrice - position.entryPrice 
        : position.entryPrice - newPrice;
      const newPnl = priceDiff * position.quantity;
      const newPnlPercent = (priceDiff / position.entryPrice) * 100;

      // Update risk score based on PnL
      const newRiskScore = Math.max(0, Math.min(10, 
        position.riskScore + (Math.random() - 0.5) * 0.5
      ));

      return {
        ...position,
        currentPrice: newPrice,
        unrealizedPnl: newPnl,
        unrealizedPnlPercent: newPnlPercent,
        riskScore: newRiskScore
      };
    }));

    // Update totals
    setPositions(current => {
      const active = current.filter(p => p.status === 'active');
      setActivePositions(active.length);
      setTotalPnl(active.reduce((sum, p) => sum + p.unrealizedPnl, 0));
      return current;
    });
  };

  const updateAlerts = () => {
    // Occasionally add new alerts
    if (Math.random() > 0.7) {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT'];
      const types = ['entry', 'exit', 'stop_loss', 'take_profit'];
      const severities = ['low', 'medium', 'high'];
      const sides = ['long', 'short'];

      const newAlert: SignalAlert = {
        id: Date.now().toString(),
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        type: types[Math.floor(Math.random() * types.length)] as any,
        message: `Signal alert for ${symbols[Math.floor(Math.random() * symbols.length)]}`,
        timestamp: Date.now(),
        severity: severities[Math.floor(Math.random() * severities.length)] as any,
        price: Math.random() * 50000,
        side: sides[Math.floor(Math.random() * sides.length)] as any
      };

      setAlerts(prev => [newAlert, ...prev].slice(0, 15)); // Keep last 15 alerts
    }
  };

  const updatePnL = () => {
    setTotalPnl(prev => prev + (Math.random() - 0.5) * 50);
  };

  const getPnlColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-400';
    if (score <= 6) return 'text-yellow-400';
    if (score <= 8) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'closed': return 'text-gray-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    return `${minutes}m ago`;
  };

  const filteredPositions = showClosed 
    ? positions 
    : positions.filter(p => p.status === 'active');

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Signal Positions</h2>
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-400">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
            <span>Real-time</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-400">Total P&L</div>
            <div className={`text-lg sm:text-2xl font-bold ${getPnlColor(totalPnl)}`}>
              ${totalPnl.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-400">Active Positions</div>
            <div className="text-lg sm:text-2xl font-bold text-blue-400">
              {activePositions}
            </div>
          </div>
          <button
            onClick={() => setShowClosed(!showClosed)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {showClosed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-sm">{showClosed ? 'Hide Closed' : 'Show Closed'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-gray-400">Total P&L</div>
              <div className={`text-lg sm:text-xl font-bold ${getPnlColor(totalPnl)}`}>
                ${totalPnl.toFixed(2)}
              </div>
            </div>
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-gray-400">Active Positions</div>
              <div className="text-lg sm:text-xl font-bold text-blue-400">
                {activePositions}
              </div>
            </div>
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-gray-400">Win Rate</div>
              <div className="text-lg sm:text-xl font-bold text-green-400">
                73.5%
              </div>
            </div>
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm text-gray-400">Avg Risk Score</div>
              <div className="text-lg sm:text-xl font-bold text-yellow-400">
                5.8
              </div>
            </div>
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        {/* Positions List */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-400" />
            {showClosed ? 'All Positions' : 'Active Positions'}
          </h3>
          
          <div className="space-y-3">
            {filteredPositions.map((position) => (
              <div key={position.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      position.side === 'long' ? 'bg-green-900/30' : 'bg-red-900/30'
                    }`}>
                      {position.side === 'long' ? 
                        <TrendingUp className="w-4 h-4 text-green-400" /> : 
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      }
                    </div>
                    <div>
                      <div className="font-semibold text-white">{position.symbol}</div>
                      <div className="text-sm text-gray-400">
                        {position.side.toUpperCase()} • {position.quantity} units
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Entry / Current</div>
                      <div className="text-sm text-white">
                        ${position.entryPrice.toFixed(2)} / ${position.currentPrice.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-400">P&L</div>
                      <div className={`font-semibold ${getPnlColor(position.unrealizedPnl)}`}>
                        ${position.unrealizedPnl.toFixed(2)} ({position.unrealizedPnlPercent.toFixed(2)}%)
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Risk</div>
                      <div className={`font-semibold ${getRiskColor(position.riskScore)}`}>
                        {position.riskScore.toFixed(1)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`${getStatusColor(position.status)}`}>
                        {getStatusIcon(position.status)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(position.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress bars for stop loss and take profit */}
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Stop Loss: ${position.stopLoss?.toFixed(2)}</span>
                    <span>Take Profit: ${position.takeProfit?.toFixed(2)}</span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-red-400 h-1 rounded-full" 
                        style={{ 
                          width: position.stopLoss ? 
                            `${Math.max(0, Math.min(100, ((position.entryPrice - position.stopLoss) / position.entryPrice) * 100))}%` : 
                            '0%' 
                        }}
                      />
                    </div>
                    <div className="flex-1 bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-green-400 h-1 rounded-full" 
                        style={{ 
                          width: position.takeProfit ? 
                            `${Math.max(0, Math.min(100, ((position.takeProfit - position.entryPrice) / position.entryPrice) * 100))}%` : 
                            '0%' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
            Recent Alerts
          </h3>
          
          <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                  <div className={`p-1 rounded ${
                    alert.severity === 'high' ? 'bg-red-900/50' :
                    alert.severity === 'medium' ? 'bg-yellow-900/50' :
                    'bg-blue-900/50'
                  }`}>
                    <AlertTriangle className={`w-3 h-3 ${
                      alert.severity === 'high' ? 'text-red-400' :
                      alert.severity === 'medium' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">
                      {alert.symbol} {alert.type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {alert.message}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ${alert.price.toFixed(2)} • {formatTime(alert.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeSignalPositions;

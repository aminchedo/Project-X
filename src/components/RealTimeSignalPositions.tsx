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
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { fetchSignalPositions, SignalPosition, SignalAlert } from '../services/liveDataApi';

const RealTimeSignalPositions: React.FC = () => {
  const [positions, setPositions] = useState<SignalPosition[]>([]);
  const [alerts, setAlerts] = useState<SignalAlert[]>([]);
  const [totalPnl, setTotalPnl] = useState<number>(0);
  const [activePositions, setActivePositions] = useState<number>(0);
  const [showClosed, setShowClosed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [winRate, setWinRate] = useState<number | null>(null);
  const [avgRiskScore, setAvgRiskScore] = useState<number | null>(null);

  useEffect(() => {
    // Load real positions data
    const loadPositions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchSignalPositions();

        if (!data || data.positions.length === 0) {
          setError('No active positions');
          setPositions([]);
          setAlerts([]);
          setTotalPnl(0);
          setActivePositions(0);
          setWinRate(null);
          setAvgRiskScore(null);
        } else {
          setPositions(data.positions);
          setAlerts(data.alerts);
          setTotalPnl(data.totalPnl);
          setActivePositions(data.activeCount);
          setWinRate(data.winRate ?? null);
          setAvgRiskScore(data.avgRiskScore ?? null);
        }
      } catch (err) {
        console.error('Failed to load signal positions:', err);
        setError('Failed to load positions');
        setPositions([]);
        setAlerts([]);
        setTotalPnl(0);
        setActivePositions(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadPositions();

    // Refresh every 30 seconds
    const intervalId = setInterval(loadPositions, 30000);

    return () => clearInterval(intervalId);
  }, []);


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
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3 sm:p-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-24 mb-2"></div>
              <div className="h-6 bg-slate-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-2">{error}</p>
          <p className="text-slate-500 text-xs">Check backend connection or wait for positions to be opened</p>
        </div>
      ) : (
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
                  {winRate !== null ? `${winRate.toFixed(1)}%` : '--'}
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
                  {avgRiskScore !== null ? avgRiskScore.toFixed(1) : '--'}
                </div>
              </div>
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
            </div>
          </div>
        </div>
      )}

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

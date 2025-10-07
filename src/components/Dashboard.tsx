import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { realtimeWs } from '../services/websocket';
import { Activity, TrendingUp, TrendingDown, AlertCircle, DollarSign, Target, Shield, Zap, Search, Sliders, PieChart, TestTube, MessageSquare, Brain } from 'lucide-react';
import SignalCard from './SignalCard';
import TradingChart from './TradingChart';
import RiskPanel from './RiskPanel';
import PortfolioPanel from './PortfolioPanel';
import BacktestPanel from './BacktestPanel';
import PnLDashboard from './PnLDashboard';
import PredictiveAnalyticsDashboard from './PredictiveAnalyticsDashboard';
import WSBadge from './WSBadge';
import MarketScanner from './MarketScanner';
import Scanner from '../pages/Scanner';
import SignalDetails from './SignalDetails';
import StrategyBuilder from './StrategyBuilder';
import { TradingSignal, MarketData, OHLCVData } from '../types';
import { tradingEngine } from '../services/tradingEngine';
import { binanceApi } from '../services/binanceApi';
import clsx from 'clsx';

interface DashboardProps {
  user?: any;
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('scanner2');
  const [apiHealthData, setApiHealthData] = useState<any>(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState<any>(null);
  const [selectedSymbolForDetails, setSelectedSymbolForDetails] = useState<string | null>(null);

  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT'];

  // Real-time updates using polling
  useEffect(() => {
    loadInitialData();
    loadApiHealth();
    
    const priceInterval = setInterval(updateMarketData, 3000);
    const signalInterval = setInterval(refreshSignals, 30000);
    const healthInterval = setInterval(checkSystemHealth, 15000);
    const apiHealthInterval = setInterval(loadApiHealth, 60000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(signalInterval);
      clearInterval(healthInterval);
      clearInterval(apiHealthInterval);
    };
  }, []);

  useEffect(() => {
    loadChartData(selectedSymbol);
  }, [selectedSymbol]);

  const loadInitialData = async () => {
    await Promise.all([
      updateMarketData(),
      loadChartData(selectedSymbol),
      checkSystemHealth()
    ]);
  };

  const updateMarketData = async () => {
    try {
      const promises = symbols.map(symbol => binanceApi.get24hrTicker(symbol));
      const results = await Promise.all(promises);
      setMarketData(results);
    } catch (error) {
      console.error('Failed to update market data:', error);
    }
  };

  const loadChartData = async (symbol: string) => {
    try {
      const data = await binanceApi.getKlines(symbol, '1h', 100);
      setChartData(data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  const refreshSignals = async () => {
    const promises = symbols.slice(0, 3).map(async symbol => {
      try {
        return await tradingEngine.generateSignal(symbol);
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(promises);
    const validSignals = results.filter(s => s !== null) as TradingSignal[];
    
    if (validSignals.length > 0) {
      setSignals(prev => {
        const updated = [...prev];
        validSignals.forEach(signal => {
          const index = updated.findIndex(s => s.symbol === signal.symbol);
          if (index >= 0) {
            updated[index] = signal;
          } else {
            updated.push(signal);
          }
        });
        return updated;
      });
    }
  };

  const checkSystemHealth = async () => {
    try {
      await binanceApi.getTickerPrice('BTCUSDT');
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const loadApiHealth = async () => {
    try {
      const healthData = await api.get('/api/health/all-apis');
      setApiHealthData(healthData);
    } catch (error) {
      console.error('Failed to load API health:', error);
    }
  };

  const generateSignal = async (symbol: string) => {
    setIsLoading(true);
    try {
      const signal = await tradingEngine.generateSignal(symbol);
      
      setSignals(prev => {
        const updated = [...prev];
        const index = updated.findIndex(s => s.symbol === symbol);
        if (index >= 0) {
          updated[index] = signal;
        } else {
          updated.push(signal);
        }
        return updated;
      });

      const analysis = await tradingEngine.getDetailedAnalysis(symbol);
      setDetailedAnalysis(analysis);
    } catch (error) {
      console.error('Failed to generate signal:', error);
      alert('Failed to generate signal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (symbol: string) => {
    setSelectedSymbol(symbol);
    await loadChartData(symbol);
    
    try {
      const analysis = await tradingEngine.getDetailedAnalysis(symbol);
      setDetailedAnalysis(analysis);
    } catch (error) {
      console.error('Failed to get analysis:', error);
    }
  };

  const handleExecute = (signal: TradingSignal) => {
    const message = `
Trade Execution Request:
Symbol: ${signal.symbol}
Action: ${signal.action}
Entry: ${signal.entry_price?.toFixed(2)}
Stop Loss: ${signal.stop_loss?.toFixed(2)}
Take Profit: ${signal.take_profit?.toFixed(2)}
Position Size: $${signal.position_size?.toFixed(0)}
Confidence: ${(signal.confidence * 100).toFixed(1)}%
    `;
    
    if (window.confirm(`Execute this trade?\n\n${message}`)) {
      console.log('Trade executed:', signal);
      alert('Trade execution simulation completed!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header - Professional Glassmorphism */}
      <motion.header 
        className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50 shadow-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Zap className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-50">BoltAiCrypto</h1>
                  <p className="text-xs text-slate-400">Advanced Trading System</p>
                </div>
              </div>
              
              <WSBadge />
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-50 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
              >
                {symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
              
              <motion.button
                onClick={() => generateSignal(selectedSymbol)}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  isLoading 
                    ? 'bg-slate-700 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg hover:shadow-cyan-500/25'
                } text-white`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Analyzing...' : 'Generate Signal'}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex space-x-1 bg-slate-900/80 backdrop-blur-xl rounded-xl p-1 border border-slate-700/50 overflow-x-auto shadow-xl">
            {[
              { id: 'scanner2', label: '🔍 Comprehensive Scanner', icon: Search },
              { id: 'scanner', label: 'Simple Scanner', icon: Search },
              { id: 'strategy', label: 'Strategy Builder', icon: Sliders },
              { id: 'signals', label: 'Signals', icon: TrendingUp },
              { id: 'portfolio', label: 'Portfolio', icon: PieChart },
              { id: 'pnl', label: 'P&L Analysis', icon: DollarSign },
              { id: 'backtest', label: 'Backtest', icon: TestTube },
              { id: 'analytics', label: 'Advanced Analysis', icon: Brain },
              { id: 'notifications', label: 'Notifications', icon: MessageSquare },
              { id: 'apis', label: 'API Status', icon: Activity }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex-1 justify-center",
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800/50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-8">
          {/* Comprehensive Scanner Tab */}
          {activeTab === 'scanner2' && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Scanner />
            </motion.div>
          )}
          
          {/* Market Scanner Tab */}
          {activeTab === 'scanner' && !selectedSymbolForDetails && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <MarketScanner 
                onOpenDetails={(symbol) => {
                  setSelectedSymbolForDetails(symbol);
                }}
              />
            </motion.div>
          )}

          {/* Signal Details View */}
          {activeTab === 'scanner' && selectedSymbolForDetails && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <SignalDetails
                symbol={selectedSymbolForDetails}
                onBack={() => setSelectedSymbolForDetails(null)}
              />
            </motion.div>
          )}

          {/* Strategy Builder Tab */}
          {activeTab === 'strategy' && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <StrategyBuilder />
            </motion.div>
          )}

          {/* Signals Tab Content */}
          {activeTab === 'signals' && (
            <>
              {/* Live Signals Panel */}
              <motion.div 
                className="col-span-12 lg:col-span-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 shadow-xl">
                  <h2 className="text-xl font-bold text-slate-50 mb-4 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-3"></div>
                    Live Signals
                  </h2>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {signals.length > 0 ? (
                      signals.map(signal => (
                        <SignalCard
                          key={signal.symbol}
                          signal={signal}
                          onAnalyze={handleAnalyze}
                          onExecute={handleExecute}
                        />
                      ))
                    ) : (
                      <div className="text-center text-slate-400 py-12">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                        <p className="text-lg mb-2">No Active Signals</p>
                        <p className="text-sm">Select a symbol and generate a signal to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Price Charts */}
              <motion.div 
                className="col-span-12 lg:col-span-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 shadow-xl">
                  <h2 className="text-xl font-bold text-slate-50 mb-4 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mr-3"></div>
                    Price Chart - {selectedSymbol}
                  </h2>
                  <TradingChart 
                    symbol={selectedSymbol}
                    data={chartData}
                    indicators={detailedAnalysis?.analysis}
                  />
                </div>
              </motion.div>

              {/* Analysis Details */}
              <motion.div 
                className="col-span-12 lg:col-span-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {detailedAnalysis && (
                  <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 shadow-xl mb-6">
                    <h3 className="text-lg font-semibold text-slate-50 mb-4">Analysis Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400 mb-1">RSI Value</div>
                        <div className="text-slate-50 font-mono">
                          {detailedAnalysis.analysis.core_signal?.details?.rsi?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-slate-400 mb-1">MACD Histogram</div>
                        <div className="text-slate-50 font-mono">
                          {detailedAnalysis.analysis.core_signal?.details?.histogram?.toFixed(4) || 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-slate-400 mb-1">ATR</div>
                        <div className="text-slate-50 font-mono">
                          {detailedAnalysis.analysis.atr?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-slate-400 mb-1">Trend Strength</div>
                        <div className="text-slate-50 font-mono">
                          {detailedAnalysis.analysis.core_signal?.strength?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <RiskPanel />
              </motion.div>
            </>
          )}

          {activeTab === 'portfolio' && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <PortfolioPanel />
            </motion.div>
          )}

          {activeTab === 'pnl' && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <PnLDashboard />
            </motion.div>
          )}

          {activeTab === 'backtest' && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <BacktestPanel />
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <PredictiveAnalyticsDashboard />
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 shadow-xl">
                <h2 className="text-xl font-bold text-slate-50 mb-6 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse mr-3"></div>
                  Telegram Notifications
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-50">Notification Settings</h3>
                      <div className="space-y-3">
                        {['Signal Alerts', 'Portfolio Alerts', 'Risk Alerts', 'Daily Summary'].map((setting, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                            <span className="text-slate-300">{setting}</span>
                            <button className={`w-12 h-6 ${index % 2 === 0 ? 'bg-cyan-500' : 'bg-slate-600'} rounded-full relative transition-colors`}>
                              <div className={`w-5 h-5 bg-white rounded-full absolute ${index % 2 === 0 ? 'right-0.5' : 'left-0.5'} top-0.5 transition-all`}></div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-50">Configuration</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Telegram Chat ID
                          </label>
                          <input
                            type="text"
                            placeholder="Enter your chat ID"
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Min Confidence Threshold
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="1"
                            step="0.1"
                            defaultValue="0.7"
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-slate-400 mt-1">
                            <span>50%</span>
                            <span>70%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'apis' && (
            <motion.div 
              className="col-span-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 shadow-xl">
                <h2 className="text-xl font-bold text-slate-50 mb-4 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse mr-3"></div>
                  API Health Status
                </h2>
                
                {apiHealthData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Total APIs</div>
                        <div className="text-2xl font-bold text-slate-50">{apiHealthData.total_apis}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Healthy</div>
                        <div className="text-2xl font-bold text-green-400">{apiHealthData.healthy_apis}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Unhealthy</div>
                        <div className="text-2xl font-bold text-red-400">{apiHealthData.unhealthy_apis}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">Overall Health</div>
                        <div className="text-2xl font-bold text-cyan-400">{apiHealthData.overall_health.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-slate-800/50 rounded-full h-3">
                      <motion.div 
                        className="bg-gradient-to-r from-green-500 to-cyan-400 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${apiHealthData.overall_health}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p>Loading API health data...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Market Overview Table */}
        {activeTab === 'signals' && marketData.length > 0 && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 shadow-xl">
              <h2 className="text-xl font-bold text-slate-50 mb-4 flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-3"></div>
                Market Overview
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Symbol</th>
                      <th className="text-right py-4 px-6 text-slate-400 font-medium">Price</th>
                      <th className="text-right py-4 px-6 text-slate-400 font-medium">24h Change</th>
                      <th className="text-right py-4 px-6 text-slate-400 font-medium">Volume (24h)</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-medium">Signal</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-medium">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.map((data, index) => {
                      const signal = signals.find(s => s.symbol === data.symbol);
                      return (
                        <motion.tr 
                          key={data.symbol} 
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors cursor-pointer"
                          onClick={() => setSelectedSymbol(data.symbol)}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-50">{data.symbol}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="text-slate-50 font-mono text-lg">
                              ${data.price.toLocaleString('en-US', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 8 
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className={`font-mono font-bold ${
                              data.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {data.change_24h >= 0 ? '+' : ''}{data.change_24h.toFixed(2)}%
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="text-slate-300 font-mono">
                              ${(data.volume / 1000000).toFixed(1)}M
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {signal ? (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                signal.action === 'BUY' 
                                  ? 'bg-green-500/20 text-green-400'
                                  : signal.action === 'SELL'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-slate-600/20 text-slate-400'
                              }`}>
                                {signal.action}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">No Signal</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {signal ? (
                              <div className="text-slate-50 font-medium">
                                {(signal.confidence * 100).toFixed(0)}%
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;

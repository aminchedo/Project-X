import React, { useState, useEffect } from 'react';
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
import { ProfessionalLayout, ProfessionalCard } from './Layout/ProfessionalLayout';
import { ProfessionalNavigation } from './Navigation/ProfessionalNavigation';
import { ProfessionalMetricCard, ProfessionalProgressBar } from './DataVisualization/ProfessionalCharts';
import { TradingSignal, MarketData, OHLCVData } from '../types';
import { tradingEngine } from '../services/tradingEngine';
import { binanceApi } from '../services/binanceApi';
import { api } from '../services/api';
import { Activity, RefreshCw, Zap, TrendingUp, PieChart, DollarSign, TestTube, MessageSquare, Brain, Search, Sliders } from 'lucide-react';
import clsx from 'clsx';

interface DashboardProps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  user?: any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('scanner2'); // Use new comprehensive scanner by default
  const [apiHealthData, setApiHealthData] = useState<any>(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState<any>(null);
  const [selectedSymbolForDetails, setSelectedSymbolForDetails] = useState<string | null>(null);

  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT'];

  // Real-time updates using polling
  useEffect(() => {
    loadInitialData();
    
    loadApiHealth();
    // Set up real-time price updates
    const priceInterval = setInterval(updateMarketData, 3000); // Every 3 seconds
    const signalInterval = setInterval(refreshSignals, 30000); // Every 30 seconds
    const healthInterval = setInterval(checkSystemHealth, 15000); // Every 15 seconds
    const apiHealthInterval = setInterval(loadApiHealth, 60000); // Check API health every minute

    return () => {
      clearInterval(priceInterval);
      clearInterval(signalInterval);
      clearInterval(healthInterval);
      clearInterval(apiHealthInterval);
    };
  }, []);

  // Update chart when symbol changes
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
    // Auto-refresh signals for all watched symbols
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
      // Simple health check by testing API connectivity
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

      // Load detailed analysis
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header - RTL Aware */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50 shadow-lg shadow-slate-900/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">HTS Trading System</h1>
                  <p className="text-xs text-slate-400">Combined Trading Strategy v1.0</p>
                </div>
              </div>
              
              {/* WebSocket Status Badge */}
              <WSBadge />
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
              >
                {symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
              
              <button
                onClick={() => generateSignal(selectedSymbol)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isLoading 
                    ? 'bg-slate-600 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:shadow-cyan-500/25'
                } text-white`}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Analyzing...' : 'Generate Signal'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-800/40 backdrop-blur-lg rounded-xl p-1 border border-slate-700/50 overflow-x-auto shadow-lg shadow-slate-900/10">
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
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 flex-1 justify-center transform hover:scale-105",
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50 hover:shadow-md'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Comprehensive Scanner Tab (New) */}
          {activeTab === 'scanner2' && (
            <div className="col-span-12">
              <Scanner />
            </div>
          )}
          
          {/* Market Scanner Tab (Simple/Legacy) */}
          {activeTab === 'scanner' && !selectedSymbolForDetails && (
            <div className="col-span-12">
              <MarketScanner 
                onOpenDetails={(symbol) => {
                  setSelectedSymbolForDetails(symbol);
                }}
              />
            </div>
          )}

          {/* Signal Details View */}
          {activeTab === 'scanner' && selectedSymbolForDetails && (
            <div className="col-span-12">
              <SignalDetails
                symbol={selectedSymbolForDetails}
                onBack={() => setSelectedSymbolForDetails(null)}
              />
            </div>
          )}

          {/* Strategy Builder Tab */}
          {activeTab === 'strategy' && (
            <div className="col-span-12">
              <StrategyBuilder />
            </div>
          )}

          {/* Conditional Content Based on Active Tab */}
          {activeTab === 'signals' && (
            <>
              {/* Live Signals Panel */}
              <div className="col-span-12 lg:col-span-4">
                <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-400 animate-pulse mr-3"></div>
                    Live Signals
                  </h2>
                  <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
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
                      <div className="text-center text-gray-400 py-12">
                        <div className="text-4xl mb-4">📊</div>
                        <p className="text-lg mb-2">No Active Signals</p>
                        <p className="text-sm">Select a symbol and generate a signal to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Charts */}
              <div className="col-span-12 lg:col-span-5">
                <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-pulse mr-3"></div>
                    Price Chart - {selectedSymbol}
                  </h2>
                  <TradingChart 
                    symbol={selectedSymbol}
                    data={chartData}
                    indicators={detailedAnalysis?.analysis}
                  />
                </div>
              </div>

              {/* Analysis Details */}
              <div className="col-span-12 lg:col-span-3">
                {detailedAnalysis && (
                  <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Analysis Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400 mb-1">RSI Value</div>
                        <div className="text-white font-mono">
                          {detailedAnalysis.analysis.core_signal?.details?.rsi?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-slate-400 mb-1">MACD Histogram</div>
                        <div className="text-white font-mono">
                          {detailedAnalysis.analysis.core_signal?.details?.histogram?.toFixed(4) || 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-slate-400 mb-1">ATR</div>
                        <div className="text-white font-mono">
                          {detailedAnalysis.analysis.atr?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-slate-400 mb-1">Trend Strength</div>
                        <div className="text-white font-mono">
                          {detailedAnalysis.analysis.core_signal?.strength?.toFixed(2) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk & Settings Panel */}
                <RiskPanel />
              </div>
            </>
          )}

          {activeTab === 'portfolio' && (
            <div className="col-span-12">
              <PortfolioPanel />
            </div>
          )}

          {activeTab === 'apis' && (
            <div className="col-span-12">
              <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-400 animate-pulse mr-3"></div>
                  API Health Status
                </h2>
                
                {apiHealthData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Total APIs</div>
                        <div className="text-2xl font-bold text-white">{apiHealthData.total_apis}</div>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Healthy</div>
                        <div className="text-2xl font-bold text-emerald-400">{apiHealthData.healthy_apis}</div>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Unhealthy</div>
                        <div className="text-2xl font-bold text-red-400">{apiHealthData.unhealthy_apis}</div>
                      </div>
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Overall Health</div>
                        <div className="text-2xl font-bold text-cyan-400">{apiHealthData.overall_health.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-700/50 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-green-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${apiHealthData.overall_health}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">Loading API health data...</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pnl' && (
            <div className="col-span-12">
              <PnLDashboard />
            </div>
          )}

          {activeTab === 'backtest' && (
            <div className="col-span-12">
              <BacktestPanel />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="col-span-12">
              <PredictiveAnalyticsDashboard />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="col-span-12">
              <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-400 animate-pulse mr-3"></div>
                  Telegram Notifications
                </h2>
                
                <div className="space-y-6">
                  {/* Notification Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Notification Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-300">Signal Alerts</span>
                          <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                            <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-300">Portfolio Alerts</span>
                          <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                            <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-300">Risk Alerts</span>
                          <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                            <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                          <span className="text-gray-300">Daily Summary</span>
                          <button className="w-12 h-6 bg-blue-600 rounded-full relative">
                            <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Configuration</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Telegram Chat ID
                          </label>
                          <input
                            type="text"
                            placeholder="Enter your chat ID"
                            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
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
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>50%</span>
                            <span>70%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Test Notification */}
                  <div className="border-t border-gray-700 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Test Connection</h3>
                        <p className="text-gray-400 text-sm">Send a test message to verify your Telegram setup</p>
                      </div>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span>Send Test</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Recent Notifications */}
                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-gray-300">BUY signal for BTCUSDT at $45,000</span>
                        </div>
                        <span className="text-gray-500 text-sm">2 min ago</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          <span className="text-gray-300">Portfolio risk threshold reached</span>
                        </div>
                        <span className="text-gray-500 text-sm">1 hour ago</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-gray-300">Daily P&L summary: +$125.50</span>
                        </div>
                        <span className="text-gray-500 text-sm">Yesterday</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Market Overview Table */}
        {activeTab === 'signals' && (
          <div className="mt-6">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 border border-gray-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-400 animate-pulse mr-3"></div>
                Market Overview (KuCoin Data)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/30">
                      <th className="text-left py-4 px-6 text-slate-400 font-medium">Symbol</th>
                      <th className="text-right py-4 px-6 text-slate-400 font-medium">Price</th>
                      <th className="text-right py-4 px-6 text-slate-400 font-medium">24h Change</th>
                      <th className="text-right py-4 px-6 text-slate-400 font-medium">Volume (24h)</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-medium">Signal</th>
                      <th className="text-center py-2 text-gray-400">Data Source</th>
                      <th className="text-center py-4 px-6 text-slate-400 font-medium">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.map(data => {
                      const signal = signals.find(s => s.symbol === data.symbol);
                      return (
                        <tr 
                          key={data.symbol} 
                          className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors cursor-pointer"
                          onClick={() => setSelectedSymbol(data.symbol)}
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-white">{data.symbol}</div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="text-white font-mono text-lg">
                              ${data.price.toLocaleString('en-US', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 8 
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className={`font-mono font-bold ${
                              data.change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
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
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : signal.action === 'SELL'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-slate-600/20 text-slate-400 border border-slate-500/30'
                              }`}>
                                {signal.action}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-xs">No Signal</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-1 rounded text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              KuCoin
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {signal ? (
                              <div className="text-white font-medium">
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
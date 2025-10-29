import React, { useState, useEffect } from 'react';
import { ProfessionalLayout, ProfessionalCard, ProfessionalButton } from './Layout/ProfessionalLayout';
import SidebarLayout from './Layout/SidebarLayout';
import CompactHeader from './Layout/CompactHeader';
import { ProfessionalMetricCard, ProfessionalProgressBar, ProfessionalLineChart } from './DataVisualization/ProfessionalCharts';
import WSBadge from './WSBadge';
import Scanner from '../pages/Scanner';
import MarketScanner from './MarketScanner';
import StrategyBuilder from './StrategyBuilder';
import SignalCard from './SignalCard';
import PortfolioPanel from './PortfolioPanel';
import PnLDashboard from './PnLDashboard';
import BacktestPanel from './BacktestPanel';
import PredictiveAnalyticsDashboard from './PredictiveAnalyticsDashboard';
import RiskPanel from './RiskPanel';
import IntegrationStatus from './IntegrationStatus';
import Chart from './Chart';
import TradingChart from './TradingChart';
import MarketDepthChart from './MarketDepthChart';
import MarketVisualization3D from './MarketVisualization3D';
import RealTimeRiskMonitor from './RealTimeRiskMonitor';
import RealTimeSignalPositions from './RealTimeSignalPositions';
import SignalDetails from './SignalDetails';
import { SystemStatus } from './showcase/SystemStatus';
import Login from './Login';
import Dashboard from './Dashboard';
import TradingDashboard from './trading-dashboard';
import AIInsightsPanel from './AIInsightsPanel';
import SystemTester from './SystemTester';
import AccessibilityEnhancer from './AccessibilityEnhancer';
import AccessibilitySkipLink from './AccessibilitySkipLink';
import AdvancedTradingChart from './AdvancedTradingChart';
import PerformanceMonitor from './PerformanceMonitor';
import WhaleTracker from './WhaleTracker';
import RealTimeNewsSentiment from './RealTimeNewsSentiment';
import { DemoSystem } from './DemoSystem';
import { TestingFramework } from './TestingFramework';
import WhaleMovementsChart from './WhaleMovementsChart';
import { 
  LazyPredictiveAnalyticsDashboard,
  LazyAIInsightsPanel,
  LazyRealTimeRiskMonitor,
  LazyRealTimeSignalPositions,
  LazyMarketVisualization3D,
  LazyMarketDepthChart,
  LazyTradingChart,
  LazyChart,
  LazySystemTester
} from './LazyComponents';
import { TradingSignal, MarketData, OHLCVData } from '../types';
import { tradingEngine } from '../services/tradingEngine';
import { binanceApi } from '../services/binanceApi';
import { api } from '../services/api';
import { realtimeTradingWs } from '../services/websocket';
import { realApiService } from '../services/RealApiService';
import { dataManager } from '../services/DataManager';
import { NewsWidget } from './Widgets/NewsWidget';
import { SentimentWidget } from './Widgets/SentimentWidget';
import { WhaleActivityWidget } from './Widgets/WhaleActivityWidget';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Activity, 
  Zap,
  BarChart3,
  Shield,
  Brain,
  MessageSquare,
  Waves,
  Grid3x3,
  Maximize2,
  Minimize2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  TrendingUpIcon,
  LineChart
} from 'lucide-react';

interface ProfessionalDashboardProps {
  user?: any;
  onLogout?: () => void;
  isBackendConnected?: boolean;
  backendStatus?: any;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ 
  user, 
  onLogout, 
  isBackendConnected = false, 
  backendStatus 
}) => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [chartData, setChartData] = useState<OHLCVData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1h');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [apiHealthData, setApiHealthData] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    metrics: true,
    charts: true,
    signals: true,
    market: true,
    analytics: true,
    portfolio: true
  });
  const [layoutMode, setLayoutMode] = useState<'compact' | 'expanded'>('compact');

  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT'];

  useEffect(() => {
    loadInitialData();
    loadApiHealth();
    setupWebSocket();
    
    const priceInterval = setInterval(updateMarketData, 10000); // Every 10 seconds (reduced frequency)
    const signalInterval = setInterval(refreshSignals, 60000); // Every 60 seconds (reduced frequency)
    const healthInterval = setInterval(checkSystemHealth, 30000); // Every 30 seconds (reduced frequency)
    const apiHealthInterval = setInterval(loadApiHealth, 120000); // Every 2 minutes (reduced frequency)

    return () => {
      clearInterval(priceInterval);
      clearInterval(signalInterval);
      clearInterval(healthInterval);
      clearInterval(apiHealthInterval);
      realtimeTradingWs.disconnect();
    };
  }, []);

  const setupWebSocket = () => {
    if (isBackendConnected) {
      realtimeTradingWs.connect();
      realtimeTradingWs.onMessage((event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
      realtimeTradingWs.subscribeToMultipleSymbols(symbols);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'market_data':
        updateMarketDataFromWS(data.data);
        break;
      case 'signal_update':
        updateSignalsFromWS(data.data);
        break;
      case 'price_update':
        updateMarketDataFromWS(data.data);
        break;
    }
  };

  const updateMarketDataFromWS = (data: any) => {
    setMarketData(prevData => {
      const existingIndex = prevData.findIndex(item => item.symbol === data.symbol);
      const newItem: MarketData = {
        symbol: data.symbol,
        price: data.price,
        high_24h: data.high_24h || data.price * 1.05,
        low_24h: data.low_24h || data.price * 0.95,
        change_24h: data.change_24h || data.change24h || 0,
        volume: data.volume || 0,
        timestamp: new Date()
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

  const updateSignalsFromWS = (data: any) => {
    setSignals(prevSignals => {
      const newSignal = {
        symbol: data.symbol,
        action: data.action,
        confidence: data.confidence,
        final_score: data.final_score,
        rsi_macd_score: data.rsi_macd_score,
        smc_score: data.smc_score,
        pattern_score: data.pattern_score,
        sentiment_score: data.sentiment_score,
        ml_score: data.ml_score,
        timestamp: new Date(data.timestamp),
        price: data.price,
        entry_price: data.entry_price,
        stop_loss: data.stop_loss,
        take_profit: data.take_profit,
        position_size: data.position_size
      };
      
      return [newSignal, ...prevSignals].slice(0, 20);
    });
  };

  const loadInitialData = async () => {
    try {
      await Promise.all([
        updateMarketData(),
        refreshSignals(),
        loadChartData()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const updateMarketData = async () => {
    try {
      const realData = dataManager.getMarketData();
      if (realData.length > 0) {
        setMarketData(realData as MarketData[]);
      } else {
        const mockData: MarketData[] = [{
          symbol: selectedSymbol,
          price: 50000 + Math.random() * 10000,
          change_24h: (Math.random() - 0.5) * 10,
          volume: Math.random() * 1000000,
          high_24h: 55000 + Math.random() * 5000,
          low_24h: 45000 + Math.random() * 5000,
          timestamp: new Date()
        }];
        setMarketData(mockData);
      }
    } catch (error) {
      console.error('Error updating market data:', error);
    }
  };

  const refreshSignals = async () => {
    try {
      const newSignal = await tradingEngine.generateSignal(selectedSymbol);
      setSignals(prev => [...prev, newSignal]);
    } catch (error) {
      console.error('Error refreshing signals:', error);
    }
  };

  const loadChartData = async () => {
    try {
      const data = await binanceApi.getKlines(selectedSymbol, '1h', 100);
      setChartData(data);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const loadApiHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/health/all-apis');
      if (response.ok) {
        const data = await response.json();
        setApiHealthData(data);
      }
    } catch (error) {
      console.warn('API health check failed, using mock data:', error);
      // Set mock API health data when backend is not available
      setApiHealthData({
        total_apis: 8,
        healthy_apis: 6,
        unhealthy_apis: 2,
        overall_health: 75.0,
        services: [
          { name: 'Binance API', status: 'healthy' },
          { name: 'KuCoin API', status: 'healthy' },
          { name: 'Trading Engine', status: 'healthy' },
          { name: 'WebSocket', status: 'healthy' },
          { name: 'Database', status: 'healthy' },
          { name: 'Risk Manager', status: 'healthy' },
          { name: 'Sentiment API', status: 'unhealthy' },
          { name: 'News API', status: 'unhealthy' }
        ]
      });
    }
  };

  const checkSystemHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (!response.ok) {
        console.warn('System health check failed');
      }
    } catch (error) {
      // Silently fail - backend not available, frontend works standalone
      console.warn('Backend health check failed (expected if backend not running):', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const mockMetrics = [
    {
      title: 'Portfolio Value',
      value: '$125,750.50',
      change: 2.31,
      changeLabel: '24h',
      icon: DollarSign,
      color: 'success' as const,
      trend: 'up' as const
    },
    {
      title: 'Active Signals',
      value: signals.length,
      change: 12.5,
      changeLabel: '1h',
      icon: Zap,
      color: 'primary' as const,
      trend: 'up' as const
    },
    {
      title: 'Win Rate',
      value: '68.9%',
      change: -2.1,
      changeLabel: '7d',
      icon: TrendingUp,
      color: 'warning' as const,
      trend: 'down' as const
    },
    {
      title: 'Risk Score',
      value: '6.8/10',
      change: 0.5,
      changeLabel: '1h',
      icon: Shield,
      color: 'info' as const,
      trend: 'up' as const
    }
  ];

  const CollapsibleSection = ({ title, icon: Icon, children, sectionKey }: any) => (
    <div className="modern-section">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="section-toggle"
      >
        <div className="section-header-content">
          <Icon className="section-icon" size={22} />
          <h2 className="section-title">{title}</h2>
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="chevron-icon" size={20} />
        ) : (
          <ChevronDown className="chevron-icon" size={20} />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="section-content-wrapper">
          {children}
        </div>
      )}
    </div>
  );

  const renderUnifiedDashboard = () => {
    return (
      <div className="unified-dashboard">
        <div className="dashboard-inner">
          
          {/* Quick Action Bar */}
          <div className="action-control-bar">
            <div className="action-buttons">
              <button
                onClick={() => setLayoutMode(layoutMode === 'compact' ? 'expanded' : 'compact')}
                className="action-btn primary"
              >
                {layoutMode === 'compact' ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                <span>{layoutMode === 'compact' ? 'Expand' : 'Compact'}</span>
              </button>
              <button
                onClick={loadInitialData}
                className="action-btn success"
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
            </div>
            <div className="live-status">
              <div className="live-pulse"></div>
              <span>Live</span>
            </div>
          </div>

          {/* Key Metrics */}
          <CollapsibleSection title="Key Metrics" icon={BarChart3} sectionKey="metrics">
            <div className="metrics-grid">
              {mockMetrics.map((metric, index) => (
                <ProfessionalMetricCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  changeLabel={metric.changeLabel}
                  icon={metric.icon}
                  color={metric.color}
                  trend={metric.trend}
                />
              ))}
            </div>
          </CollapsibleSection>

          {/* Trading Charts */}
          <CollapsibleSection title="Market Charts" icon={LineChart} sectionKey="charts">
            <div className="charts-grid">
              <div className="chart-box">
                <div className="chart-header">
                  <Activity size={18} />
                  <span>Price Chart</span>
                </div>
                <div className="chart-content">
                  <LazyChart data={{labels: chartData.map(d => new Date(d.timestamp).toLocaleTimeString()), datasets: [{label: 'Price', data: chartData.map(d => d.close), borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)', fill: true}]}} type="line" />
                </div>
              </div>
              <div className="chart-box">
                <div className="chart-header">
                  <BarChart3 size={18} />
                  <span>Market Depth</span>
                </div>
                <div className="chart-content">
                  <LazyMarketDepthChart symbol={selectedSymbol} />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Trading Signals & Sentiment */}
          <CollapsibleSection title="Trading Signals & Market Sentiment" icon={Zap} sectionKey="signals">
            <div className="signals-grid">
              <div className="widget-box">
                <div className="widget-header">
                  <Zap size={18} />
                  <span>Recent Signals</span>
                  <span className="badge">{signals.length} active</span>
                </div>
                <div className="signals-list">
                  {signals.slice(0, 6).map((signal, index) => (
                    <div key={index} className="signal-item">
                      <div className="signal-left">
                        <div className={`signal-dot ${signal.action === 'BUY' ? 'buy' : 'sell'}`}></div>
                        <div>
                          <p className="signal-symbol">{signal.symbol}</p>
                          <p className="signal-action">{signal.action}</p>
                        </div>
                      </div>
                      <div className="signal-right">
                        <p className="signal-confidence">{(signal.confidence * 100).toFixed(1)}%</p>
                        <p className="signal-label">Confidence</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="widget-box">
                <SentimentWidget selectedSymbol={selectedSymbol} />
              </div>
              
              <div className="widget-box">
                <WhaleActivityWidget selectedSymbol={selectedSymbol} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Market Overview & News */}
          <CollapsibleSection title="Market Overview & News" icon={MessageSquare} sectionKey="market">
            <div className="market-grid">
              <div className="widget-box">
                <div className="widget-header">
                  <Activity size={18} />
                  <span>Market Scanner</span>
                </div>
                <div className="scanner-content">
                  <MarketScanner />
                </div>
              </div>
              
              <div className="widget-box">
                <NewsWidget selectedSymbol={selectedSymbol} />
              </div>
            </div>
          </CollapsibleSection>

          {/* Analytics & Risk */}
          <CollapsibleSection title="Analytics & Risk Management" icon={Brain} sectionKey="analytics">
            <div className="analytics-grid">
              <div className="widget-box">
                <div className="widget-header">
                  <Shield size={18} />
                  <span>Risk Monitor</span>
                </div>
                <div className="risk-content">
                  <RiskPanel />
                </div>
              </div>
              
              <div className="widget-box">
                <div className="widget-header">
                  <Brain size={18} />
                  <span>AI Insights</span>
                </div>
                <div className="ai-content">
                  <LazyAIInsightsPanel selectedSymbol={selectedSymbol} />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Portfolio & Performance */}
          <CollapsibleSection title="Portfolio & Performance" icon={PieChart} sectionKey="portfolio">
            <div className="portfolio-grid">
              <div className="widget-box">
                <div className="widget-header">
                  <PieChart size={18} />
                  <span>Portfolio Overview</span>
                </div>
                <div className="portfolio-content">
                  <PortfolioPanel />
                </div>
              </div>
              
              <div className="widget-box">
                <div className="widget-header">
                  <TrendingUp size={18} />
                  <span>P&L Dashboard</span>
                </div>
                <div className="pnl-content">
                  <PnLDashboard />
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* System Status */}
          <div className="system-status-section">
            <div className="widget-box">
              <div className="widget-header">
                <Activity size={18} />
                <span>System Status</span>
              </div>
              <IntegrationStatus 
                isBackendConnected={isBackendConnected}
                backendStatus={backendStatus}
              />
            </div>
          </div>
        </div>

        <style data-jsx="true">{`
          .unified-dashboard {
            height: 100%;
            overflow-y: auto;
            background: 
              radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at bottom, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
              linear-gradient(180deg, #0a0e1a 0%, #151923 50%, #0f1419 100%);
            position: relative;
          }

          .unified-dashboard::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
          }

          .dashboard-inner {
            max-width: 2000px;
            margin: 0 auto;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            position: relative;
            z-index: 1;
          }

          .action-control-bar {
            background: 
              linear-gradient(135deg, 
                rgba(99, 102, 241, 0.12) 0%, 
                rgba(139, 92, 246, 0.08) 50%,
                rgba(99, 102, 241, 0.12) 100%
              );
            backdrop-filter: blur(20px);
            border: 1px solid rgba(99, 102, 241, 0.25);
            border-radius: 20px;
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 
              0 8px 32px rgba(99, 102, 241, 0.15),
              0 4px 16px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
          }

          .action-control-bar::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
              transparent, 
              rgba(255, 255, 255, 0.1), 
              transparent
            );
            transition: left 0.6s ease;
          }

          .action-control-bar:hover::before {
            left: 100%;
          }

          .action-buttons {
            display: flex;
            gap: 0.75rem;
          }

          .action-btn {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            padding: 0.875rem 1.75rem;
            border-radius: 14px;
            border: none;
            font-weight: 700;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .action-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, 
              transparent, 
              rgba(255, 255, 255, 0.2), 
              transparent
            );
            transform: translateX(-100%);
            transition: transform 0.8s ease;
          }

          .action-btn::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.6s ease;
          }

          .action-btn:hover::before {
            transform: translateX(100%);
          }

          .action-btn:hover::after {
            width: 300px;
            height: 300px;
          }

          .action-btn.primary {
            background: 
              linear-gradient(135deg, 
                #6366f1 0%, 
                #8b5cf6 50%, 
                #a855f7 100%
              );
            color: white;
            box-shadow: 
              0 8px 25px rgba(99, 102, 241, 0.4),
              0 4px 12px rgba(99, 102, 241, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .action-btn.primary:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 
              0 12px 35px rgba(99, 102, 241, 0.5),
              0 8px 20px rgba(99, 102, 241, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }

          .action-btn.success {
            background: 
              linear-gradient(135deg, 
                #10b981 0%, 
                #059669 50%, 
                #047857 100%
              );
            color: white;
            box-shadow: 
              0 8px 25px rgba(16, 185, 129, 0.4),
              0 4px 12px rgba(16, 185, 129, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .action-btn.success:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 
              0 12px 35px rgba(16, 185, 129, 0.5),
              0 8px 20px rgba(16, 185, 129, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }

          .live-status {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1.5rem;
            background: 
              linear-gradient(135deg, 
                rgba(16, 185, 129, 0.15) 0%, 
                rgba(5, 150, 105, 0.1) 50%,
                rgba(16, 185, 129, 0.15) 100%
              );
            backdrop-filter: blur(15px);
            border: 1px solid rgba(16, 185, 129, 0.4);
            border-radius: 16px;
            color: #e2e8f0;
            font-weight: 700;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 
              0 6px 20px rgba(16, 185, 129, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
          }

          .live-status::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
              transparent, 
              rgba(255, 255, 255, 0.1), 
              transparent
            );
            animation: shimmer 3s ease-in-out infinite;
          }

          @keyframes shimmer {
            0% { left: -100%; }
            50% { left: 100%; }
            100% { left: 100%; }
          }

          .live-pulse {
            width: 12px;
            height: 12px;
            background: 
              radial-gradient(circle, 
                #10b981 0%, 
                #059669 70%, 
                transparent 100%
              );
            border-radius: 50%;
            box-shadow: 
              0 0 20px rgba(16, 185, 129, 0.8),
              0 0 40px rgba(16, 185, 129, 0.4),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            position: relative;
          }

          .live-pulse::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: 
              radial-gradient(circle, 
                rgba(16, 185, 129, 0.3) 0%, 
                transparent 70%
              );
            border-radius: 50%;
            animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          @keyframes pulse {
            0%, 100% { 
              opacity: 1;
              transform: scale(1);
            }
            50% { 
              opacity: 0.8;
              transform: scale(1.2);
            }
          }

          @keyframes pulse-ring {
            0% {
              transform: scale(0.8);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }

          .modern-section {
            background: 
              linear-gradient(135deg, 
                rgba(17, 24, 39, 0.8) 0%, 
                rgba(30, 41, 59, 0.6) 50%,
                rgba(17, 24, 39, 0.8) 100%
              );
            backdrop-filter: blur(20px);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 24px;
            overflow: hidden;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.2),
              0 4px 16px rgba(99, 102, 241, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          .modern-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, 
              transparent, 
              rgba(99, 102, 241, 0.5), 
              transparent
            );
          }

          .modern-section::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.5s ease;
          }

          .modern-section:hover {
            border-color: rgba(99, 102, 241, 0.4);
            box-shadow: 
              0 16px 48px rgba(0, 0, 0, 0.3),
              0 8px 24px rgba(99, 102, 241, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }

          .modern-section:hover::after {
            opacity: 1;
          }

          .section-toggle {
            width: 100%;
            background: 
              linear-gradient(135deg, 
                rgba(30, 41, 59, 0.8) 0%, 
                rgba(17, 24, 39, 0.6) 50%,
                rgba(30, 41, 59, 0.8) 100%
              );
            backdrop-filter: blur(15px);
            border: none;
            padding: 1.5rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 
              0 4px 16px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          .section-toggle::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
              transparent, 
              rgba(99, 102, 241, 0.1), 
              transparent
            );
            transition: left 0.6s ease;
          }

          .section-toggle:hover {
            background: 
              linear-gradient(135deg, 
                rgba(30, 41, 59, 0.9) 0%, 
                rgba(17, 24, 39, 0.7) 50%,
                rgba(30, 41, 59, 0.9) 100%
              );
            box-shadow: 
              0 6px 20px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transform: translateY(-1px);
          }

          .section-toggle:hover::before {
            left: 100%;
          }

          .section-header-content {
            display: flex;
            align-items: center;
            gap: 0.875rem;
          }

          .section-icon {
            color: #8b5cf6;
            filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.4));
            transition: all 0.3s ease;
          }

          .section-toggle:hover .section-icon {
            color: #a855f7;
            filter: drop-shadow(0 0 12px rgba(168, 85, 247, 0.6));
            transform: scale(1.1);
          }

          .section-title {
            font-size: 1.25rem;
            font-weight: 800;
            color: #e2e8f0;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
          }

          .section-toggle:hover .section-title {
            color: #f1f5f9;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          }

          .chevron-icon {
            color: #94a3b8;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          }

          .section-toggle:hover .chevron-icon {
            color: #cbd5e1;
            transform: scale(1.2);
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
          }

          .section-content-wrapper {
            padding: 1.75rem;
            animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.25rem;
          }

          .charts-grid,
          .market-grid,
          .analytics-grid,
          .portfolio-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.25rem;
          }

          .signals-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 1.25rem;
          }

          .chart-box,
          .widget-box {
            background: 
              linear-gradient(135deg, 
                rgba(30, 41, 59, 0.7) 0%, 
                rgba(17, 24, 39, 0.6) 50%,
                rgba(30, 41, 59, 0.7) 100%
              );
            backdrop-filter: blur(15px);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 20px;
            padding: 1.75rem;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 
              0 6px 24px rgba(0, 0, 0, 0.15),
              0 2px 8px rgba(99, 102, 241, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          .chart-box::before,
          .widget-box::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, 
              transparent, 
              rgba(99, 102, 241, 0.4), 
              transparent
            );
          }

          .chart-box::after,
          .widget-box::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.4s ease;
          }

          .chart-box:hover,
          .widget-box:hover {
            border-color: rgba(99, 102, 241, 0.4);
            box-shadow: 
              0 12px 36px rgba(0, 0, 0, 0.2),
              0 4px 16px rgba(99, 102, 241, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transform: translateY(-3px);
          }

          .chart-box:hover::after,
          .widget-box:hover::after {
            opacity: 1;
          }

          .chart-header,
          .widget-header {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            margin-bottom: 1.5rem;
            padding-bottom: 1.25rem;
            border-bottom: 1px solid rgba(99, 102, 241, 0.15);
            color: #e2e8f0;
            font-weight: 800;
            font-size: 1.125rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            letter-spacing: 0.5px;
            position: relative;
          }

          .chart-header::after,
          .widget-header::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, 
              #6366f1 0%, 
              #8b5cf6 50%, 
              #a855f7 100%
            );
            transition: width 0.4s ease;
          }

          .chart-box:hover .chart-header::after,
          .widget-box:hover .widget-header::after {
            width: 100%;
          }

          .badge {
            margin-left: auto;
            font-size: 0.75rem;
            color: #cbd5e1;
            background: 
              linear-gradient(135deg, 
                rgba(99, 102, 241, 0.2) 0%, 
                rgba(139, 92, 246, 0.15) 100%
              );
            backdrop-filter: blur(10px);
            padding: 0.375rem 0.875rem;
            border-radius: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid rgba(99, 102, 241, 0.3);
            box-shadow: 
              0 2px 8px rgba(99, 102, 241, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }

          .badge:hover {
            background: 
              linear-gradient(135deg, 
                rgba(99, 102, 241, 0.3) 0%, 
                rgba(139, 92, 246, 0.25) 100%
              );
            box-shadow: 
              0 4px 12px rgba(99, 102, 241, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
          }

          .chart-content,
          .scanner-content,
          .risk-content,
          .ai-content,
          .portfolio-content,
          .pnl-content {
            min-height: 300px;
          }

          .signals-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-height: 360px;
            overflow-y: auto;
          }

          .signal-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.5rem;
            background: 
              linear-gradient(135deg, 
                rgba(30, 41, 59, 0.6) 0%, 
                rgba(17, 24, 39, 0.5) 50%,
                rgba(30, 41, 59, 0.6) 100%
              );
            backdrop-filter: blur(10px);
            border: 1px solid rgba(99, 102, 241, 0.15);
            border-radius: 18px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 
              0 4px 16px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          .signal-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, 
              transparent, 
              rgba(99, 102, 241, 0.1), 
              transparent
            );
            transition: left 0.6s ease;
          }

          .signal-item:hover {
            background: 
              linear-gradient(135deg, 
                rgba(30, 41, 59, 0.8) 0%, 
                rgba(17, 24, 39, 0.7) 50%,
                rgba(30, 41, 59, 0.8) 100%
              );
            border-color: rgba(99, 102, 241, 0.4);
            transform: translateX(8px) translateY(-2px);
            box-shadow: 
              0 8px 24px rgba(0, 0, 0, 0.15),
              0 4px 16px rgba(99, 102, 241, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          .signal-item:hover::before {
            left: 100%;
          }

          .signal-left {
            display: flex;
            align-items: center;
            gap: 0.875rem;
          }

          .signal-dot {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            position: relative;
            animation: pulse 2s ease-in-out infinite;
          }

          .signal-dot::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 50%;
            animation: pulse-ring 2s ease-in-out infinite;
          }

          .signal-dot.buy {
            background: 
              radial-gradient(circle, 
                #10b981 0%, 
                #059669 70%, 
                #047857 100%
              );
            box-shadow: 
              0 0 20px rgba(16, 185, 129, 0.6),
              0 0 40px rgba(16, 185, 129, 0.3),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }

          .signal-dot.buy::before {
            background: 
              radial-gradient(circle, 
                rgba(16, 185, 129, 0.3) 0%, 
                transparent 70%
              );
          }

          .signal-dot.sell {
            background: 
              radial-gradient(circle, 
                #ef4444 0%, 
                #dc2626 70%, 
                #b91c1c 100%
              );
            box-shadow: 
              0 0 20px rgba(239, 68, 68, 0.6),
              0 0 40px rgba(239, 68, 68, 0.3),
              inset 0 1px 2px rgba(255, 255, 255, 0.3);
          }

          .signal-dot.sell::before {
            background: 
              radial-gradient(circle, 
                rgba(239, 68, 68, 0.3) 0%, 
                transparent 70%
              );
          }

          .signal-symbol {
            font-size: 1.125rem;
            font-weight: 700;
            margin-bottom: 0.375rem;
            color: #e2e8f0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            letter-spacing: 0.5px;
          }

          .signal-action {
            font-size: 0.75rem;
            color: #94a3b8;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.75px;
            margin: 0;
            padding: 0.25rem 0.5rem;
            background: rgba(99, 102, 241, 0.1);
            border-radius: 6px;
            border: 1px solid rgba(99, 102, 241, 0.2);
          }

          .signal-right {
            text-align: right;
            position: relative;
          }

          .signal-confidence {
            font-size: 1.5rem;
            font-weight: 800;
            line-height: 1;
            margin-bottom: 0.375rem;
            color: #e2e8f0;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            background: 
              linear-gradient(135deg, 
                #e2e8f0 0%, 
                #cbd5e1 100%
              );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .signal-label {
            font-size: 0.6875rem;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.75px;
            margin: 0;
            font-weight: 600;
          }

          .system-status-section {
            background: 
              linear-gradient(135deg, 
                rgba(17, 24, 39, 0.8) 0%, 
                rgba(30, 41, 59, 0.6) 50%,
                rgba(17, 24, 39, 0.8) 100%
              );
            backdrop-filter: blur(20px);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 24px;
            padding: 2rem;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.2),
              0 4px 16px rgba(99, 102, 241, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
          }

          .system-status-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, 
              transparent, 
              rgba(99, 102, 241, 0.5), 
              transparent
            );
          }

          .system-status-section::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.5s ease;
          }

          .system-status-section:hover {
            border-color: rgba(99, 102, 241, 0.4);
            box-shadow: 
              0 16px 48px rgba(0, 0, 0, 0.3),
              0 8px 24px rgba(99, 102, 241, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
          }

          .system-status-section:hover::after {
            opacity: 1;
          }

          /* Enhanced Scrollbar Styling */
          .unified-dashboard::-webkit-scrollbar,
          .signals-list::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }

          .unified-dashboard::-webkit-scrollbar-track,
          .signals-list::-webkit-scrollbar-track {
            background: 
              linear-gradient(135deg, 
                rgba(15, 23, 42, 0.6) 0%, 
                rgba(30, 41, 59, 0.4) 100%
              );
            border-radius: 12px;
            border: 1px solid rgba(99, 102, 241, 0.1);
          }

          .unified-dashboard::-webkit-scrollbar-thumb,
          .signals-list::-webkit-scrollbar-thumb {
            background: 
              linear-gradient(135deg, 
                rgba(99, 102, 241, 0.6) 0%, 
                rgba(139, 92, 246, 0.6) 50%,
                rgba(168, 85, 247, 0.6) 100%
              );
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 
              0 2px 8px rgba(99, 102, 241, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }

          .unified-dashboard::-webkit-scrollbar-thumb:hover,
          .signals-list::-webkit-scrollbar-thumb:hover {
            background: 
              linear-gradient(135deg, 
                rgba(99, 102, 241, 0.8) 0%, 
                rgba(139, 92, 246, 0.8) 50%,
                rgba(168, 85, 247, 0.8) 100%
              );
            box-shadow: 
              0 4px 12px rgba(99, 102, 241, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
            transform: scale(1.1);
          }

          .unified-dashboard::-webkit-scrollbar-corner,
          .signals-list::-webkit-scrollbar-corner {
            background: rgba(15, 23, 42, 0.6);
          }

          /* Responsive Design */
          @media (max-width: 1200px) {
            .metrics-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .signals-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 768px) {
            .dashboard-inner {
              padding: 1rem;
              gap: 1rem;
            }

            .action-control-bar {
              flex-direction: column;
              gap: 1rem;
            }

            .metrics-grid,
            .charts-grid,
            .signals-grid,
            .market-grid,
            .analytics-grid,
            .portfolio-grid {
              grid-template-columns: 1fr;
            }

            .action-buttons {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>
      </div>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return renderUnifiedDashboard();
    }

    const tabRoutes: {[key: string]: JSX.Element} = {
      'scanner': <div className="tab-content"><MarketScanner /></div>,
      'strategy': <div className="tab-content"><StrategyBuilder /></div>,
      'signals': <div className="tab-content"><div className="signals-tab-grid">{signals.map((signal, index) => (<SignalCard key={index} signal={signal} onAnalyze={() => console.log('Analyze signal:', signal)} onExecute={() => console.log('Execute signal:', signal)} />))}</div></div>,
      'portfolio': <div className="tab-content"><PortfolioPanel /></div>,
      'pnl': <div className="tab-content"><PnLDashboard /></div>,
      'backtest': <div className="tab-content"><BacktestPanel /></div>,
      'analytics': <div className="tab-content"><LazyPredictiveAnalyticsDashboard /></div>,
      'predictive-analytics': <div className="tab-content"><LazyPredictiveAnalyticsDashboard /></div>,
      'risk': <div className="tab-content"><RiskPanel /></div>,
      'market-3d': <div className="tab-content"><LazyMarketVisualization3D symbols={marketData.map(m => m.symbol)} /></div>,
      'risk-monitor': <div className="tab-content"><LazyRealTimeRiskMonitor /></div>,
      'signal-positions': <div className="tab-content"><LazyRealTimeSignalPositions /></div>,
      'system-status': <div className="tab-content"><SystemStatus /></div>,
      'alt-dashboard': <Dashboard user={user} onLogout={onLogout} />,
      'alternative-dashboard': <Dashboard user={user} onLogout={onLogout} />,
      'trading-dashboard': <TradingDashboard />,
      'enhanced-trading': <TradingDashboard />,
      'ai-insights': <div className="tab-content"><LazyAIInsightsPanel selectedSymbol={selectedSymbol} /></div>,
      'system-tester': <div className="tab-content"><LazySystemTester /></div>,
      'performance-monitor': <div className="tab-content"><PerformanceMonitor showDetails={true} /></div>,
      'whale-tracker': <div className="tab-content"><WhaleTracker /></div>,
      'news-sentiment': <div className="tab-content"><RealTimeNewsSentiment /></div>,
      'demo-system': <div className="tab-content"><DemoSystem /></div>,
      'testing-framework': <div className="tab-content"><TestingFramework /></div>,
      'advanced-chart': <div className="tab-content"><AdvancedTradingChart symbol={selectedSymbol} timeframe="1h" onTimeframeChange={(tf) => console.log('Timeframe changed:', tf)} onIndicatorToggle={(indicator) => console.log('Indicator toggled:', indicator)} /></div>,
      'charts': <div className="tab-content"><div className="charts-page-grid"><div className="chart-box"><div className="chart-header"><Activity size={18} /><span>Advanced Chart</span></div><LazyChart data={{labels: chartData.map(d => new Date(d.timestamp).toLocaleTimeString()), datasets: [{label: 'Price', data: chartData.map(d => d.close), borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)', fill: true}]}} type="line" /></div><div className="chart-box"><div className="chart-header"><BarChart3 size={18} /><span>Trading Chart</span></div><LazyTradingChart symbol={selectedSymbol} timeframe="1h" /></div><div className="chart-box full-width"><div className="chart-header"><Waves size={18} /><span>Market Depth</span></div><LazyMarketDepthChart symbol={selectedSymbol} /></div></div></div>,
      'signal-details': <div className="tab-content">{signals.length > 0 ? (<><div className="chart-box"><div className="chart-header"><Zap size={18} /><span>Signal Component Breakdown</span></div><div className="text-center py-8 text-slate-400"><p>Component breakdown feature is being updated</p></div></div><div className="chart-box"><div className="chart-header"><Activity size={18} /><span>Signal Details</span></div><SignalDetails signal={null} isOpen={true} onClose={() => setActiveTab('signals')} /></div></>) : (<div className="chart-box"><div className="chart-header"><Zap size={18} /><span>No Signals Available</span></div><div className="text-center py-8 text-slate-400"><p>No signals available for detailed analysis</p></div></div>)}</div>,
      'notifications': <div className="tab-content"><div className="chart-box"><div className="chart-header"><MessageSquare size={18} /><span>Notifications</span></div><div className="notifications-list"><div className="notification-item info"><div className="notification-dot"></div><div><p className="notification-title">New signal detected for BTCUSDT</p><p className="notification-time">2 minutes ago</p></div></div><div className="notification-item success"><div className="notification-dot"></div><div><p className="notification-title">Portfolio performance updated</p><p className="notification-time">5 minutes ago</p></div></div></div></div></div>,
      'apis': <div className="tab-content"><IntegrationStatus isBackendConnected={isBackendConnected} backendStatus={backendStatus} /><div className="apis-grid"><div className="chart-box"><div className="chart-header"><Activity size={18} /><span>API Health Status</span></div><div className="api-health-list">{apiHealthData?.services?.map((service: any, index: number) => (<div key={index} className="api-health-item"><div className="health-indicator-wrapper"><div className={`health-indicator ${service.status === 'healthy' ? 'healthy' : 'error'}`}></div><span className="health-name">{service.name}</span></div><span className={`health-status ${service.status === 'healthy' ? 'healthy' : 'error'}`}>{service.status}</span></div>))}</div></div><div className="chart-box"><div className="chart-header"><BarChart3 size={18} /><span>System Performance</span></div><div className="performance-bars"><ProfessionalProgressBar value={85} label="CPU Usage" color="primary" showPercentage /><ProfessionalProgressBar value={62} label="Memory Usage" color="success" showPercentage /><ProfessionalProgressBar value={23} label="Network Latency" color="warning" showPercentage /></div></div></div></div>,
    };

    return tabRoutes[activeTab] || <Scanner />;
  };

  return (
    <>
      <AccessibilitySkipLink />
      <SidebarLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onLogout={onLogout}
        isBackendConnected={isBackendConnected}
        backendStatus={backendStatus}
      >
        <div className="main-dashboard-container">
          <CompactHeader
            selectedSymbol={selectedSymbol}
            onSymbolChange={(symbol) => {
              setSelectedSymbol(symbol);
              loadChartData();
            }}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
          />
          
          <main 
            id="main-content" 
            className="dashboard-main-content"
            role="main"
            aria-label="Dashboard content"
          >
            {renderTabContent()}
          </main>
        </div>
        
        <AccessibilityEnhancer />
      </SidebarLayout>

      <style data-jsx="true">{`
        .main-dashboard-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 50%, #0a0e1a 100%);
        }

        .dashboard-main-content {
          flex: 1;
          overflow: hidden;
        }

        .tab-content {
          padding: 1.5rem;
          height: 100%;
          overflow-y: auto;
        }

        .signals-tab-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .charts-page-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .charts-page-grid .full-width {
          grid-column: 1 / -1;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .notification-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 12px;
        }

        .notification-item.info {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .notification-item.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .notification-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .notification-item.info .notification-dot {
          background: #3b82f6;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
        }

        .notification-item.success .notification-dot {
          background: #10b981;
        }

        .notification-title {
          color: #e2e8f0;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .notification-time {
          color: #64748b;
          font-size: 0.875rem;
        }

        .apis-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .api-health-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .api-health-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1rem;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.3), rgba(17, 24, 39, 0.3));
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .api-health-item:hover {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(17, 24, 39, 0.5));
        }

        .health-indicator-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .health-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .health-indicator.healthy {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
        }

        .health-indicator.error {
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
        }

        .health-name {
          color: #e2e8f0;
          font-weight: 600;
        }

        .health-status {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .health-status.healthy {
          color: #10b981;
        }

        .health-status.error {
          color: #ef4444;
        }

        .performance-bars {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .signals-tab-grid,
          .charts-page-grid,
          .apis-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default ProfessionalDashboard;
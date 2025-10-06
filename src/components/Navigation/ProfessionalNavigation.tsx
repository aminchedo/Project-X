import React, { useState } from 'react';
import { 
  Search, 
  Sliders, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  TestTube, 
  Brain, 
  MessageSquare, 
  Activity,
  BarChart3,
  Shield,
  Settings,
  Zap,
  ChartBar,
  Box,
  Eye,
  Target,
  Layers,
  Gauge,
  Map,
  Calculator,
  Cog,
  SlidersHorizontal,
  Monitor,
  Grid3X3,
  Layout,
  Terminal,
  Sparkles,
  Cpu,
  Crosshair,
  Wrench,
  LineChart,
  Fish,
  Newspaper,
  Play
} from 'lucide-react';
import { ProfessionalButton } from '../Layout/ProfessionalLayout';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  disabled?: boolean;
}

interface ProfessionalNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  isLoading?: boolean;
  onGenerateSignal?: () => void;
}

export const ProfessionalNavigation: React.FC<ProfessionalNavigationProps> = ({
  activeTab,
  onTabChange,
  selectedSymbol,
  onSymbolChange,
  isLoading = false,
  onGenerateSignal
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems: NavigationItem[] = [
    { id: 'overview', label: 'Overview', icon: Activity, badge: 'MAIN' },
    { id: 'scanner', label: 'Market Scanner', icon: Search },
    { id: 'strategy', label: 'Strategy Builder', icon: Sliders },
    { id: 'signals', label: 'Signals', icon: TrendingUp, badge: 5 },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'pnl', label: 'P&L Analysis', icon: DollarSign },
    { id: 'backtest', label: 'Backtest', icon: TestTube },
    { id: 'analytics', label: 'AI Analytics', icon: Brain, badge: 'AI' },
    { id: 'risk', label: 'Risk Monitor', icon: Shield },
    { id: 'charts', label: 'Charts', icon: ChartBar },
    { id: 'advanced-chart', label: 'Advanced Chart', icon: LineChart },
    { id: 'market-3d', label: '3D Market', icon: Box },
    { id: 'risk-monitor', label: 'Risk Monitor', icon: Eye },
    { id: 'signal-positions', label: 'Signal Positions', icon: Crosshair },
    { id: 'signal-details', label: 'Signal Details', icon: Target },
    { id: 'correlation', label: 'Correlation', icon: Map },
    { id: 'position-sizer', label: 'Position Sizer', icon: Calculator },
    { id: 'rules-config', label: 'Rules Config', icon: Cog },
    { id: 'weight-sliders', label: 'Weights', icon: SlidersHorizontal },
    { id: 'system-status', label: 'System Status', icon: Monitor },
    { id: 'heatmap', label: 'Heatmap', icon: Grid3X3 },
    { id: 'alt-dashboard', label: 'Alt Dashboard', icon: Layout },
    { id: 'trading-dashboard', label: 'Trading Dashboard', icon: Terminal },
    { id: 'enhanced-trading', label: 'Enhanced Trading', icon: Cpu },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkles },
    { id: 'component-showcase', label: 'Components', icon: Layers },
    { id: 'system-tester', label: 'System Tester', icon: Wrench },
    { id: 'performance-monitor', label: 'Performance', icon: Activity },
    { id: 'whale-tracker', label: 'Whale Tracker', icon: Fish },
    { id: 'news-sentiment', label: 'News & Sentiment', icon: Newspaper },
    { id: 'demo-system', label: 'Demo System', icon: Play, badge: 'DEMO' },
    { id: 'testing-framework', label: 'Testing Framework', icon: TestTube, badge: 'TEST' },
    { id: 'alternative-dashboard', label: 'Alternative Dashboard', icon: Layout, badge: 'ALT' },
    { id: 'notifications', label: 'Notifications', icon: MessageSquare, badge: 3 },
    { id: 'apis', label: 'API Status', icon: BarChart3 }
  ];

  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT'];

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-lg shadow-slate-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 py-4 lg:py-0 lg:h-16">
          {/* Logo and Title - Responsive */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">HTS Trading System</h1>
                <p className="text-xs text-slate-400">Professional Trading Platform v1.0</p>
              </div>
            </div>
          </div>
          
          {/* Center Controls - Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {/* Symbol Selector */}
            <div className="relative">
              <label htmlFor="symbol-selector" className="sr-only">
                Select Trading Symbol
              </label>
              <select
                id="symbol-selector"
                name="symbol-selector"
                value={selectedSymbol}
                onChange={(e) => onSymbolChange(e.target.value)}
                className="appearance-none bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2 pr-8 text-white focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200"
              >
                {symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            
            {/* Generate Signal Button */}
            <ProfessionalButton
              onClick={onGenerateSignal}
              loading={isLoading}
              size="md"
              className="min-w-[140px]"
            >
              {isLoading ? 'Analyzing...' : 'Generate Signal'}
            </ProfessionalButton>
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Collapse Toggle */}
            <ProfessionalButton
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex"
            >
              <Settings className="w-4 h-4" />
            </ProfessionalButton>
          </div>
        </div>
        
        {/* Navigation Tabs - Responsive */}
        <div className="pb-2 sm:pb-4">
          <div className="flex space-x-1 bg-slate-800/40 backdrop-blur-lg rounded-xl p-1 border border-slate-700/50 overflow-x-auto shadow-lg shadow-slate-900/10 scrollbar-hide">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && onTabChange(item.id)}
                  disabled={item.disabled}
                  className={`
                    flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 flex-1 justify-center transform hover:scale-105 min-w-0
                    ${isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50 hover:shadow-md'
                    }
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {item.badge && (
                    <span className={`
                      px-2 py-0.5 text-xs rounded-full font-bold
                      ${isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-cyan-500/20 text-cyan-400'
                      }
                    `}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Breadcrumb Component
interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface ProfessionalBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const ProfessionalBreadcrumb: React.FC<ProfessionalBreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-slate-500">/</span>
          )}
          {item.active ? (
            <span className="text-white font-medium">{item.label}</span>
          ) : (
            <a
              href={item.href}
              className="text-slate-400 hover:text-white transition-colors duration-200"
            >
              {item.label}
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

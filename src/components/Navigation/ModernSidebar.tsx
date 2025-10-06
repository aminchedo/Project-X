import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Sliders,
  TrendingUp,
  PieChart,
  DollarSign,
  TestTube,
  Brain,
  Shield,
  ChartBar,
  LineChart,
  Box,
  Eye,
  Crosshair,
  Target,
  Map,
  Calculator,
  Cog,
  SlidersHorizontal,
  Monitor,
  Grid3X3,
  Layout,
  Terminal,
  Cpu,
  Sparkles,
  Layers,
  Wrench,
  Fish,
  Newspaper,
  Play,
  MessageSquare,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  Settings,
  User,
  Bell,
  HelpCircle,
  LogOut,
  // New attractive icons
  Zap,
  Rocket,
  Crown,
  Star,
  Gem,
  Flame,
  Thunder,
  Diamond,
  Trophy,
  Award,
  Compass,
  Navigation,
  Radar,
  Satellite,
  Telescope,
  Microscope,
  Atom,
  CircuitBoard,
  Database,
  Server,
  Cloud,
  Globe,
  Mountain,
  Waves,
  Sun,
  Moon,
  Palette,
  Brush,
  MagicWand,
  Wand2,
  Sparkle,
  Heart,
  Infinity,
  Target2,
  Focus,
  Lightbulb,
  Idea,
  Key,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle,
  AlertCircle,
  XCircle,
  PlusCircle,
  MinusCircle,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Share,
  Link,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronsRight,
  ChevronsLeft,
  ChevronsUp,
  ChevronsDown,
  RotateCcw,
  RotateCw,
  RefreshCw,
  RefreshCcw,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Video,
  VideoOff,
  Image,
  FileText,
  File,
  Folder,
  FolderOpen,
  Archive,
  Package,
  Truck,
  Plane,
  Car,
  Bike,
  Ship,
  Anchor,
  Compass2,
  MapPin,
  MapPinned,
  Navigation2,
  Route,
  Waypoints,
  Flag,
  FlagTriangleRight,
  FlagTriangleLeft,
  Milestone,
  Signpost,
  SignpostBig,
  SignpostSplit,
  TreePine,
  TreeDeciduous,
  Leaf,
  Flower,
  Seedling,
  Sprout
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  disabled?: boolean;
  category?: string;
}

interface ModernSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export const ModernSidebar: React.FC<ModernSidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  className = ''
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core']));

  const navigationItems: NavigationItem[] = [
    // Core Trading
    { id: 'overview', label: 'Overview', icon: Crown, category: 'Core' },
    { id: 'scanner', label: 'Market Scanner', icon: Radar, category: 'Core' },
    { id: 'strategy', label: 'Strategy Builder', icon: Wand2, category: 'Core' },
    { id: 'signals', label: 'Trading Signals', icon: Zap, badge: 5, category: 'Core' },
    
    // Portfolio & Analysis
    { id: 'portfolio', label: 'Portfolio', icon: Trophy, category: 'Portfolio' },
    { id: 'pnl', label: 'P&L Analysis', icon: Diamond, category: 'Portfolio' },
    { id: 'backtest', label: 'Backtesting', icon: Microscope, category: 'Portfolio' },
    
    // AI & Analytics
    { id: 'analytics', label: 'AI Analytics', icon: Brain, badge: 'AI', category: 'AI' },
    { id: 'ai-insights', label: 'AI Insights', icon: Sparkle, category: 'AI' },
    { id: 'predictive-analytics', label: 'Predictive Analytics', icon: Lightbulb, category: 'AI' },
    
    // Risk & Monitoring
    { id: 'risk', label: 'Risk Monitor', icon: ShieldCheck, category: 'Risk' },
    { id: 'risk-monitor', label: 'Risk Dashboard', icon: Focus, category: 'Risk' },
    { id: 'system-status', label: 'System Status', icon: Server, category: 'Risk' },
    
    // Charts & Visualization
    { id: 'charts', label: 'Charts', icon: Telescope, category: 'Charts' },
    { id: 'advanced-chart', label: 'Advanced Chart', icon: Satellite, category: 'Charts' },
    { id: 'market-3d', label: '3D Market', icon: Globe, category: 'Charts' },
    { id: 'heatmap', label: 'Heatmap', icon: Palette, category: 'Charts' },
    
    // Market Data
    { id: 'whale-tracker', label: 'Whale Tracker', icon: Waves, category: 'Market' },
    { id: 'news-sentiment', label: 'News & Sentiment', icon: Newspaper, category: 'Market' },
    { id: 'correlation', label: 'Correlation', icon: Compass, category: 'Market' },
    
    // Tools & Configuration
    { id: 'position-sizer', label: 'Position Sizer', icon: Calculator, category: 'Tools' },
    { id: 'rules-config', label: 'Rules Config', icon: Key, category: 'Tools' },
    { id: 'weight-sliders', label: 'Weights', icon: SlidersHorizontal, category: 'Tools' },
    
    // Development & Testing
    { id: 'demo-system', label: 'Demo System', icon: Rocket, badge: 'DEMO', category: 'Dev' },
    { id: 'testing-framework', label: 'Testing Framework', icon: TestTube, badge: 'TEST', category: 'Dev' },
    { id: 'component-showcase', label: 'Components', icon: Layers, category: 'Dev' },
    { id: 'system-tester', label: 'System Tester', icon: CircuitBoard, category: 'Dev' },
    
    // Alternative Views
    { id: 'alternative-dashboard', label: 'Alt Dashboard', icon: Layout, badge: 'ALT', category: 'Alt' },
    { id: 'trading-dashboard', label: 'Trading Dashboard', icon: Terminal, category: 'Alt' },
    { id: 'enhanced-trading', label: 'Enhanced Trading', icon: Atom, category: 'Alt' },
    
    // System
    { id: 'performance-monitor', label: 'Performance', icon: Activity, category: 'System' },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 3, category: 'System' },
    { id: 'apis', label: 'API Status', icon: Database, category: 'System' }
  ];

  const categories = [
    { id: 'Core', label: 'Core Trading', icon: Crown },
    { id: 'Portfolio', label: 'Portfolio', icon: Trophy },
    { id: 'AI', label: 'AI & Analytics', icon: Brain },
    { id: 'Risk', label: 'Risk & Monitor', icon: ShieldCheck },
    { id: 'Charts', label: 'Charts & Viz', icon: Telescope },
    { id: 'Market', label: 'Market Data', icon: Waves },
    { id: 'Tools', label: 'Tools', icon: Key },
    { id: 'Dev', label: 'Development', icon: Rocket },
    { id: 'Alt', label: 'Alternative', icon: Atom },
    { id: 'System', label: 'System', icon: Server }
  ];

  const groupedItems = categories.reduce((acc, category) => {
    acc[category.id] = navigationItems.filter(item => item.category === category.id);
    return acc;
  }, {} as Record<string, NavigationItem[]>);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getIconColor = (iconName: string, isActive: boolean) => {
    if (isActive) return 'text-cyan-400';
    
    const colorMap: Record<string, string> = {
      'Brain': 'text-purple-500',
      'Sparkles': 'text-pink-500',
      'Cpu': 'text-blue-500',
      'Shield': 'text-green-500',
      'Eye': 'text-emerald-500',
      'TrendingUp': 'text-emerald-500',
      'PieChart': 'text-orange-500',
      'DollarSign': 'text-yellow-500',
      'TestTube': 'text-red-500',
      'ChartBar': 'text-indigo-500',
      'LineChart': 'text-violet-500',
      'Box': 'text-cyan-500',
      'Fish': 'text-blue-500',
      'Newspaper': 'text-amber-500',
      'Calculator': 'text-lime-500',
      'Cog': 'text-gray-500',
      'Monitor': 'text-slate-500',
      'Grid3X3': 'text-teal-500',
      'Layout': 'text-purple-500',
      'Terminal': 'text-green-500',
      'Activity': 'text-red-500',
      'MessageSquare': 'text-blue-500',
      'BarChart3': 'text-indigo-500',
      'Search': 'text-blue-500',
      'Sliders': 'text-orange-500',
      'Crosshair': 'text-red-500',
      'Target': 'text-yellow-500',
      'Map': 'text-green-500',
      'SlidersHorizontal': 'text-orange-500',
      'Wrench': 'text-gray-500',
      'Play': 'text-green-500',
      'Layers': 'text-purple-500',
      'Home': 'text-blue-500'
    };
    
    return colorMap[iconName] || 'text-slate-500';
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    const isHovered = hoveredItem === item.id;
    const iconColor = getIconColor(Icon.name || item.label, isActive);

    return (
      <button
        key={item.id}
        onClick={() => !item.disabled && onTabChange(item.id)}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        disabled={item.disabled}
        className={`
          group relative flex items-center w-full px-3 py-2.5 rounded-lg font-medium transition-all duration-300
          ${isActive
            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 transform scale-[1.02]'
            : 'text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-700/30 hover:to-slate-600/30 hover:shadow-md'
          }
          ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isHovered && !isActive ? 'transform translate-x-1 scale-[1.01]' : ''}
        `}
      >
        {/* Icon with enhanced styling and light pink background */}
        <div className="relative">
          <div className={`p-2 rounded-lg transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-br from-pink-300/40 to-pink-500/40 shadow-lg shadow-pink-400/20'
              : 'bg-gradient-to-br from-pink-200/30 to-pink-300/30 group-hover:from-pink-300/40 group-hover:to-pink-400/40'
          }`}>
            <Icon className={`w-5 h-5 transition-all duration-300 ${iconColor} group-hover:scale-110 group-hover:drop-shadow-lg`} style={{
              filter: isActive ? 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.5))' : 'none'
            }} />
          </div>
          {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-pink-600/20 rounded-lg blur-sm"></div>
          )}
        </div>
        
        {!isCollapsed && (
          <>
            <span className="ml-4 text-sm font-medium truncate transition-all duration-200">{item.label}</span>
            {item.badge && (
              <span className={`
                ml-auto px-2 py-0.5 text-xs rounded-full font-bold transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 text-cyan-300 shadow-md' 
                  : 'bg-slate-600/50 text-slate-400 group-hover:bg-slate-500/50 group-hover:text-slate-300 group-hover:shadow-sm'
                }
              `}>
                {item.badge}
              </span>
            )}
          </>
        )}

        {/* Enhanced tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
            <div className="text-sm font-medium text-white">{item.label}</div>
            {item.badge && (
              <div className="text-xs text-slate-400 mt-1">Badge: {item.badge}</div>
            )}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700/50"></div>
          </div>
        )}

        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-pink-400 to-pink-600 rounded-r-full shadow-lg shadow-pink-500/50"></div>
        )}
      </button>
    );
  };

  return (
    <div className={`
      h-full bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border-l border-pink-500/30 shadow-2xl shadow-pink-500/10
      transition-all duration-300 ease-in-out z-40
      ${isCollapsed ? 'w-full' : 'w-full'}
      ${className}
    `}>
      {/* Enhanced Header with Gradient */}
      <div className="relative p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/30">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-pink-600/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-pink-500/5 to-transparent rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-pink-500/25">
              <TrendingUp className="w-5 h-5 text-white" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">HTS Trading</h1>
              <p className="text-xs text-slate-400">Professional System</p>
            </div>
          </div>
        )}
        
        <button
          onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 text-slate-400 hover:text-white hover:scale-105"
        >
          {isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        {categories.map((category) => {
          const items = groupedItems[category.id];
          if (!items.length) return null;

          const CategoryIcon = category.icon;
          const isExpanded = expandedCategories.has(category.id);
          const categoryIconColor = getIconColor(CategoryIcon.name || category.label, false);

          return (
            <div key={category.id} className="mb-4">
              {!isCollapsed && (
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center justify-between w-full px-3 py-2 mb-2 hover:bg-slate-700/30 rounded-lg transition-colors group"
                >
                  <div className="flex items-center">
                    <CategoryIcon className={`w-4 h-4 ${categoryIconColor} mr-2 group-hover:scale-110 transition-all duration-200 group-hover:drop-shadow-lg`} />
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-300">
                      {category.label}
                    </h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  )}
                </button>
              )}
              
              {(isExpanded || isCollapsed) && (
                <div className="space-y-1 px-2">
                  {items.map(renderNavigationItem)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enhanced Footer */}
      <div className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/30 to-slate-700/20">
        <div className="space-y-2">
          <button className="flex items-center w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-700/30 hover:to-slate-600/30 rounded-lg transition-all duration-200 group">
            <Settings className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            {!isCollapsed && <span className="ml-3 text-sm">Settings</span>}
          </button>
          
          <button className="flex items-center w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-700/30 hover:to-slate-600/30 rounded-lg transition-all duration-200 group">
            <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            {!isCollapsed && <span className="ml-3 text-sm">Help</span>}
          </button>
          
          <button className="flex items-center w-full px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-red-600/10 rounded-lg transition-all duration-200 group">
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            {!isCollapsed && <span className="ml-3 text-sm">Logout</span>}
          </button>
        </div>
        
        {/* Version info */}
        {!isCollapsed && (
          <div className="mt-4 pt-3 border-t border-slate-700/30">
            <div className="text-xs text-slate-500 text-center">
              HTS Trading System v1.0
            </div>
            <div className="text-xs text-slate-600 text-center mt-1">
              Professional Edition
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernSidebar;

import React, { useEffect, useMemo, useState } from 'react';
import {
  Crown,
  Radar,
  Wand2,
  Zap,
  Trophy,
  Diamond,
  Microscope,
  Brain,
  Sparkle,
  Lightbulb,
  ShieldCheck,
  Focus,
  Server,
  Telescope,
  Satellite,
  Globe,
  Palette,
  Waves,
  Newspaper,
  Compass,
  Calculator,
  Key,
  SlidersHorizontal,
  Rocket,
  TestTube,
  Layers,
  CircuitBoard,
  Layout,
  Terminal,
  Atom,
  Activity,
  Bell,
  Database,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface NavigationItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const NAV_SECTIONS: NavigationSection[] = [
  {
    title: "Core Trading",
    items: [
      { id: "overview", icon: Crown, label: "Overview" },
      { id: "scanner", icon: Radar, label: "Market Scanner" },
      { id: "strategy", icon: Wand2, label: "Strategy Builder" },
      { id: "signals", icon: Zap, label: "Trading Signals", badge: "5" },
    ]
  },
  {
    title: "Portfolio",
    items: [
      { id: "portfolio", icon: Trophy, label: "Portfolio" },
      { id: "pnl", icon: Diamond, label: "P&L Analysis" },
      { id: "backtest", icon: Microscope, label: "Backtesting" },
    ]
  },
  {
    title: "AI & Analytics",
    items: [
      { id: "analytics", icon: Brain, label: "AI Analytics", badge: "AI" },
      { id: "ai-insights", icon: Sparkle, label: "AI Insights" },
      { id: "predictive-analytics", icon: Lightbulb, label: "Predictive Analytics" },
    ]
  },
  {
    title: "Risk & Monitor",
    items: [
      { id: "risk", icon: ShieldCheck, label: "Risk Monitor" },
      { id: "risk-monitor", icon: Focus, label: "Risk Dashboard" },
      { id: "system-status", icon: Server, label: "System Status" },
    ]
  },
  {
    title: "Charts & Viz",
    items: [
      { id: "charts", icon: Telescope, label: "Charts" },
      { id: "advanced-chart", icon: Satellite, label: "Advanced Chart" },
      { id: "market-3d", icon: Globe, label: "3D Market" },
      { id: "heatmap", icon: Palette, label: "Heatmap" },
    ]
  },
  {
    title: "Market Data",
    items: [
      { id: "whale-tracker", icon: Waves, label: "Whale Tracker" },
      { id: "news-sentiment", icon: Newspaper, label: "News & Sentiment" },
      { id: "correlation", icon: Compass, label: "Correlation" },
    ]
  },
  {
    title: "Tools",
    items: [
      { id: "position-sizer", icon: Calculator, label: "Position Sizer" },
      { id: "rules-config", icon: Key, label: "Rules Config" },
      { id: "weight-sliders", icon: SlidersHorizontal, label: "Weights" },
    ]
  },
  {
    title: "Development",
    items: [
      { id: "demo-system", icon: Rocket, label: "Demo System", badge: "DEMO" },
      { id: "testing-framework", icon: TestTube, label: "Testing Framework", badge: "TEST" },
      { id: "component-showcase", icon: Layers, label: "Components" },
      { id: "system-tester", icon: CircuitBoard, label: "System Tester" },
    ]
  },
  {
    title: "Alternative",
    items: [
      { id: "alternative-dashboard", icon: Layout, label: "Alt Dashboard", badge: "ALT" },
      { id: "trading-dashboard", icon: Terminal, label: "Trading Dashboard" },
      { id: "enhanced-trading", icon: Atom, label: "Enhanced Trading" },
    ]
  },
  {
    title: "System",
    items: [
      { id: "performance-monitor", icon: Activity, label: "Performance" },
      { id: "notifications", icon: Bell, label: "Notifications", badge: "3" },
      { id: "apis", icon: Database, label: "API Status" },
    ]
  }
];

interface ModernSidebarNewProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function ModernSidebarNew({ activeTab = 'overview', onTabChange }: ModernSidebarNewProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsCompact(w < 1280 || h < 720);
    };
    
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isCollapsed = useMemo(() => collapsed || isCompact, [collapsed, isCompact]);

  return (
    <aside 
      dir="rtl" 
      className={`hts-sidebar ${isCollapsed ? "is-collapsed" : ""}`} 
      aria-label="Primary Navigation"
    >
      {/* Header */}
      <div className="sb-header">
        <div className="brand">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <span className="brand-text">HTS Trading</span>
        </div>
        <button 
          className="sb-toggle" 
          aria-pressed={isCollapsed} 
          aria-label="Toggle sidebar" 
          onClick={() => setCollapsed(v => !v)}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sb-nav" role="navigation">
        {NAV_SECTIONS.map(section => (
          <div className="sb-section" key={section.title}>
            <div className="sb-section-title">{section.title}</div>
            <ul className="sb-list" role="menubar">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id} role="none">
                    <button
                      onClick={() => onTabChange?.(item.id)}
                      role="menuitem" 
                      className={`sb-link ${isActive ? "is-active" : ""}`} 
                      tabIndex={0} 
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span className="sb-icon">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="sb-label">{item.label}</span>
                      {item.badge && <span className="sb-badge">{item.badge}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <button className="sb-link" title="Settings">
          <span className="sb-icon">
            <Settings className="w-5 h-5" />
          </span>
          <span className="sb-label">Settings</span>
        </button>
        <button className="sb-link" title="Help">
          <span className="sb-icon">
            <HelpCircle className="w-5 h-5" />
          </span>
          <span className="sb-label">Help</span>
        </button>
      </div>
    </aside>
  );
}

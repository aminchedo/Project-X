import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Scan,
  TrendingUp,
  Wallet,
  BarChart3,
  Shield,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  Target
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: number;
  children?: NavItem[];
}

interface ModernSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activePath?: string;
  onNavigate?: (href: string) => void;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  activePath = '/dashboard',
  onNavigate
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['trading']);

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard'
    },
    {
      id: 'scanner',
      label: 'Market Scanner',
      icon: Scan,
      href: '/scanner',
      badge: 12
    },
    {
      id: 'trading',
      label: 'Trading',
      icon: TrendingUp,
      href: '/trading',
      children: [
        { id: 'signals', label: 'Signals', icon: Zap, href: '/trading/signals', badge: 5 },
        { id: 'positions', label: 'Positions', icon: Target, href: '/trading/positions' },
        { id: 'history', label: 'History', icon: Activity, href: '/trading/history' }
      ]
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      icon: Wallet,
      href: '/portfolio'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/analytics'
    },
    {
      id: 'risk',
      label: 'Risk Management',
      icon: Shield,
      href: '/risk'
    },
    {
      id: 'ai',
      label: 'AI Insights',
      icon: Brain,
      href: '/ai',
      badge: 3
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings'
    }
  ];

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href: string) => activePath === href;
  const isExpanded = (itemId: string) => expandedItems.includes(itemId);

  return (
    <motion.aside
      className="bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 h-screen sticky top-0 flex flex-col shadow-2xl"
      initial={{ width: isCollapsed ? 80 : 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-50">BoltAI</h1>
                  <p className="text-xs text-slate-400">Trading System</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {onToggleCollapse && (
            <motion.button
              onClick={onToggleCollapse}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-slate-400" />
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <div className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const expanded = isExpanded(item.id);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.id}>
                <motion.button
                  onClick={() => {
                    if (hasChildren) {
                      toggleExpand(item.id);
                    } else {
                      onNavigate?.(item.href);
                    }
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      
                      {item.badge && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}

                      {hasChildren && (
                        <motion.div
                          animate={{ rotate: expanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.button>

                {/* Submenu */}
                {hasChildren && !isCollapsed && (
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-4"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.children?.map((child, childIndex) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.href);

                          return (
                            <motion.button
                              key={child.id}
                              onClick={() => onNavigate?.(child.href)}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: childIndex * 0.05 }}
                              whileHover={{ x: 4 }}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                childActive
                                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 flex-shrink-0" />
                              <span className="flex-1 text-left text-sm">{child.label}</span>
                              {child.badge && (
                                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400">
                                  {child.badge}
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        {!isCollapsed ? (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-50 text-sm">Upgrade to Pro</h4>
                <p className="text-xs text-slate-400 mt-1">Unlock advanced features</p>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
              Upgrade Now
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default ModernSidebar;

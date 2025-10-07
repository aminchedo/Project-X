import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Scan,
  TrendingUp,
  Wallet,
  BarChart3,
  Shield,
  Brain,
  Settings
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: number;
}

interface ProfessionalNavigationProps {
  activePath?: string;
  onNavigate?: (href: string) => void;
  variant?: 'horizontal' | 'vertical';
}

const ProfessionalNavigation: React.FC<ProfessionalNavigationProps> = ({
  activePath = '/dashboard',
  onNavigate,
  variant = 'horizontal'
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'scanner', label: 'Scanner', icon: Scan, href: '/scanner', badge: 12 },
    { id: 'trading', label: 'Trading', icon: TrendingUp, href: '/trading', badge: 5 },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet, href: '/portfolio' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'risk', label: 'Risk', icon: Shield, href: '/risk' },
    { id: 'ai', label: 'AI', icon: Brain, href: '/ai', badge: 3 },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' }
  ];

  const isActive = (href: string) => activePath === href;

  if (variant === 'vertical') {
    return (
      <nav className="space-y-2 p-4">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate?.(item.href)}
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
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-cyan-500/20 text-cyan-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 py-2">
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <motion.button
            key={item.id}
            onClick={() => onNavigate?.(item.href)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              active
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                active ? 'bg-white/20 text-white' : 'bg-cyan-500/20 text-cyan-400'
              }`}>
                {item.badge}
              </span>
            )}
            {active && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full"
                layoutId="activeIndicator"
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};

export default ProfessionalNavigation;

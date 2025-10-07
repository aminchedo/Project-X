import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  User, 
  Search,
  Menu,
  X,
  TrendingUp,
  Activity,
  LogOut
} from 'lucide-react';

interface TopbarProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, isSidebarOpen = true }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const notifications = [
    { id: 1, title: 'New Signal Alert', message: 'BTC bullish signal detected', time: '2m ago', type: 'signal' },
    { id: 2, title: 'Position Update', message: 'ETH target reached', time: '5m ago', type: 'position' },
    { id: 3, title: 'Risk Alert', message: 'Portfolio risk level: Medium', time: '10m ago', type: 'risk' },
  ];

  return (
    <motion.header
      className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50 shadow-xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Menu Toggle */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X className="w-6 h-6 text-slate-50" /> : <Menu className="w-6 h-6 text-slate-50" />}
            </button>

            {/* Logo */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-50">BoltAI</span>
            </div>

            {/* Search */}
            <motion.div
              className={`hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 border rounded-lg transition-all ${
                searchFocused ? 'border-cyan-500 w-96' : 'border-slate-700 w-64'
              }`}
              animate={{ width: searchFocused ? 384 : 256 }}
            >
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search symbols, signals..."
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent text-slate-50 placeholder-slate-500 focus:outline-none"
              />
              <kbd className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">⌘K</kbd>
            </motion.div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Market Status */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-300">BTC</span>
                <span className="text-sm font-bold text-green-400">+2.4%</span>
              </div>
              <div className="w-px h-4 bg-slate-700"></div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-slate-300">32 Active</span>
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <motion.button
                onClick={() => setShowNotifications(!showNotifications)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6 text-slate-50" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>

              {showNotifications && (
                <motion.div
                  className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                >
                  <div className="p-4 border-b border-slate-700">
                    <h3 className="font-semibold text-slate-50">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notif.type === 'signal' ? 'bg-cyan-500/20' :
                            notif.type === 'position' ? 'bg-green-500/20' :
                            'bg-orange-500/20'
                          }`}>
                            <Bell className={`w-4 h-4 ${
                              notif.type === 'signal' ? 'text-cyan-400' :
                              notif.type === 'position' ? 'text-green-400' :
                              'text-orange-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-50 text-sm">{notif.title}</h4>
                            <p className="text-slate-400 text-xs mt-1">{notif.message}</p>
                            <span className="text-slate-500 text-xs mt-1">{notif.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-700">
                    <button className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 font-medium">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Settings */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6 text-slate-50" />
            </motion.button>

            {/* User Menu */}
            <div className="relative">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="hidden lg:inline text-slate-50 font-medium">User</span>
              </motion.button>

              {showUserMenu && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                >
                  <div className="p-2">
                    <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-50">Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg transition-colors text-left">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-50">Settings</span>
                    </button>
                    <div className="my-1 border-t border-slate-700"></div>
                    <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-500/20 rounded-lg transition-colors text-left">
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Logout</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Topbar;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { User, Mail, Shield, Settings, LogOut, X } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  joined: string;
  stats: {
    total_trades: number;
    total_pnl: number;
    win_rate: number;
  };
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const response = await api.trading.getUserProfile();
      setProfile(response);
    } catch (err) {
      console.error('Profile error:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-start justify-between">
                <h2 className="text-xl font-bold text-slate-50">Profile</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {profile && (
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-50">{profile.name}</h3>
                    <p className="text-sm text-slate-400">{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-xs text-slate-400 mb-1">Trades</div>
                    <div className="text-xl font-bold text-slate-50">{profile.stats.total_trades}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-xs text-slate-400 mb-1">P&L</div>
                    <div className={`text-xl font-bold ${profile.stats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${profile.stats.total_pnl.toFixed(0)}
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="text-xs text-slate-400 mb-1">Win Rate</div>
                    <div className="text-xl font-bold text-purple-400">{profile.stats.win_rate.toFixed(0)}%</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition-colors">
                    <Settings className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-50">Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition-colors">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-50">Security</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span>Log Out</span>
                  </button>
                </div>

                <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-800">
                  Member since {new Date(profile.joined).toLocaleDateString()}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserProfileModal;

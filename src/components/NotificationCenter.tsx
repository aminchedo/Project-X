import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Bell, X, Check, Info, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const response = await api.trading.getNotifications();
      setNotifications(response || []);
    } catch (err) {
      console.error('Notifications error:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.trading.markNotificationRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.trading.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return Check;
      case 'warning': return AlertTriangle;
      case 'error': return X;
      default: return Info;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      default: return 'text-cyan-400 bg-cyan-500/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-700 z-50 overflow-hidden flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-xl font-bold text-slate-50">Notifications</h2>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map((notification, index) => {
                    const Icon = getIcon(notification.type);
                    const colorClass = getColor(notification.type);

                    return (
                      <motion.div
                        key={notification.id}
                        className={`p-4 hover:bg-slate-800/50 transition-colors ${
                          !notification.read ? 'bg-cyan-500/5' : ''
                        }`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-50 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-slate-400 mb-2">
                              {notification.message}
                            </p>
                            <span className="text-xs text-slate-500">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex gap-1">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4 text-green-400" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 hover:bg-slate-700 rounded transition-colors"
                              title="Delete"
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;

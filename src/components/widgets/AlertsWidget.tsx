import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  timestamp: string;
}

const AlertsWidget: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await api.trading.getAlerts({ limit: 5 });
      setAlerts(response || []);
    } catch (err) {
      console.error('Alerts error:', err);
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'warning':
        return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
      case 'error':
        return { icon: X, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
      case 'success':
        return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
      default:
        return { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' };
    }
  };

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-50">Alerts</h3>
          {alerts.length > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div
              className="p-8 text-center text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              No active alerts
            </motion.div>
          ) : (
            alerts.map((alert, index) => {
              const config = getAlertConfig(alert.type);
              const Icon = config.icon;

              return (
                <motion.div
                  key={alert.id}
                  className={`p-4 border-b border-slate-800 ${config.bg} ${config.border} border-l-4`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                    <div className="flex-1">
                      <p className="text-sm text-slate-50 mb-1">{alert.message}</p>
                      <span className="text-xs text-slate-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AlertsWidget;

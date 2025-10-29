import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { playSound } from '../utils/sound';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, duration = 5000, onDismiss }) => {
  useEffect(() => {
    // Play sound based on toast type
    const playToastSound = async () => {
      try {
        switch (type) {
          case 'success':
            await playSound.success();
            break;
          case 'error':
            await playSound.error();
            break;
          case 'warning':
            await playSound.warning();
            break;
          case 'info':
            await playSound.info();
            break;
        }
      } catch (err) {
        // Silently handle sound errors
        console.log('Sound playback skipped:', err);
      }
    };

    playToastSound();

    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss, type]);

  const config = {
    success: { icon: CheckCircle, bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
    error: { icon: AlertCircle, bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
    warning: { icon: AlertCircle, bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
    info: { icon: Info, bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' }
  }[type];

  const Icon = config.icon;

  return (
    <motion.div
      className={`flex items-center gap-3 p-4 ${config.bg} backdrop-blur-xl border ${config.border} rounded-lg shadow-lg min-w-[300px] max-w-md`}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      layout
    >
      <Icon className={`w-5 h-5 ${config.text}`} />
      <p className="flex-1 text-sm text-slate-50">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-slate-400 hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default Toast;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel
}) => {
  const config = {
    danger: { icon: X, color: 'text-red-400', bg: 'bg-red-500/20', button: 'bg-red-500 hover:bg-red-600' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20', button: 'bg-yellow-500 hover:bg-yellow-600' },
    info: { icon: Check, color: 'text-cyan-400', bg: 'bg-cyan-500/20', button: 'bg-cyan-500 hover:bg-cyan-600' }
  }[variant];

  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${config.color}`} />
              </div>

              <h3 className="text-xl font-bold text-slate-50 mb-2">{title}</h3>
              <p className="text-slate-400 mb-6">{message}</p>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg font-semibold transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-3 ${config.button} text-white rounded-lg font-semibold transition-colors shadow-lg`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;

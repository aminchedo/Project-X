import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const shortcuts: Shortcut[] = [
    { keys: ['⌘', 'K'], description: 'Quick search', category: 'Navigation' },
    { keys: ['⌘', 'N'], description: 'New trade', category: 'Trading' },
    { keys: ['⌘', 'S'], description: 'Quick scan', category: 'Scanner' },
    { keys: ['⌘', 'P'], description: 'View positions', category: 'Portfolio' },
    { keys: ['⌘', 'G'], description: 'View signals', category: 'Signals' },
    { keys: ['⌘', ','], description: 'Settings', category: 'Navigation' },
    { keys: ['Esc'], description: 'Close dialog', category: 'Navigation' },
    { keys: ['?'], description: 'Show shortcuts', category: 'Help' }
  ];

  const categories = [...new Set(shortcuts.map(s => s.category))];

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
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-6 h-6 text-cyan-400" />
                  <h2 className="text-xl font-bold text-slate-50">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {categories.map(category => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {shortcuts
                        .filter(s => s.category === category)
                        .map((shortcut, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <span className="text-slate-300">{shortcut.description}</span>
                            <div className="flex gap-1">
                              {shortcut.keys.map((key, i) => (
                                <React.Fragment key={i}>
                                  <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs font-semibold text-slate-200">
                                    {key}
                                  </kbd>
                                  {i < shortcut.keys.length - 1 && (
                                    <span className="text-slate-500 mx-1">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcuts;

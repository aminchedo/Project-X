import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command, Search, Play, RefreshCw, Filter, Download, Zap } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: 'general' | 'scanning' | 'navigation' | 'actions';
}

interface KeyboardShortcutsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({ isOpen, onClose }) => {
  const shortcuts: Shortcut[] = [
    // General
    { keys: ['?'], description: 'Show keyboard shortcuts', category: 'general' },
    { keys: ['Esc'], description: 'Close modal or dialog', category: 'general' },
    { keys: ['Ctrl', 'K'], description: 'Quick search', category: 'general' },
    
    // Scanning
    { keys: ['Ctrl', 'Enter'], description: 'Run scan', category: 'scanning' },
    { keys: ['Ctrl', 'R'], description: 'Refresh results', category: 'scanning' },
    { keys: ['Ctrl', 'S'], description: 'Save scan preset', category: 'scanning' },
    { keys: ['Ctrl', 'E'], description: 'Export results', category: 'scanning' },
    
    // Navigation
    { keys: ['1'], description: 'View results table', category: 'navigation' },
    { keys: ['2'], description: 'View results grid', category: 'navigation' },
    { keys: ['3'], description: 'View results chart', category: 'navigation' },
    { keys: ['4'], description: 'View results heatmap', category: 'navigation' },
    { keys: ['Tab'], description: 'Navigate between tabs', category: 'navigation' },
    
    // Actions
    { keys: ['Ctrl', 'F'], description: 'Toggle filters', category: 'actions' },
    { keys: ['Ctrl', 'A'], description: 'Select all results', category: 'actions' },
    { keys: ['Delete'], description: 'Clear selection', category: 'actions' },
  ];

  const categories = {
    general: { title: 'General', icon: Command, color: 'cyan' },
    scanning: { title: 'Scanning', icon: Play, color: 'green' },
    navigation: { title: 'Navigation', icon: Zap, color: 'purple' },
    actions: { title: 'Actions', icon: Keyboard, color: 'orange' }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Keyboard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                      <p className="text-white/80 text-sm">Master the scanner with these shortcuts</p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(categories).map(([key, category]) => {
                    const categoryShortcuts = shortcuts.filter(s => s.category === key);
                    const Icon = category.icon;
                    
                    return (
                      <motion.div
                        key={key}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * Object.keys(categories).indexOf(key) }}
                      >
                        {/* Category Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 rounded-lg bg-${category.color}-500/20`}>
                            <Icon className={`w-5 h-5 text-${category.color}-400`} />
                          </div>
                          <h3 className="text-lg font-semibold text-slate-50">{category.title}</h3>
                        </div>

                        {/* Shortcuts List */}
                        <div className="space-y-3">
                          {categoryShortcuts.map((shortcut, index) => (
                            <motion.div
                              key={index}
                              className="flex items-center justify-between group hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 + index * 0.03 }}
                            >
                              <span className="text-slate-300 text-sm">{shortcut.description}</span>
                              
                              <div className="flex gap-1">
                                {shortcut.keys.map((key, i) => (
                                  <React.Fragment key={i}>
                                    <kbd className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-50 text-xs font-mono font-semibold shadow-sm">
                                      {key}
                                    </kbd>
                                    {i < shortcut.keys.length - 1 && (
                                      <span className="text-slate-500 px-1">+</span>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Tips */}
                <motion.div
                  className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-400 mb-2">Pro Tips</h4>
                      <ul className="text-sm text-slate-300 space-y-1">
                        <li>• Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">?</kbd> anytime to show this panel</li>
                        <li>• Hold <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Shift</kbd> to invert some actions</li>
                        <li>• Use <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">Tab</kbd> to navigate between input fields</li>
                        <li>• Combine shortcuts for maximum efficiency</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/20"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsPanel;

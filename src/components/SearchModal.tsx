import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { Search, X, TrendingUp, Zap, Activity, Clock } from 'lucide-react';

interface SearchResult {
  type: 'symbol' | 'signal' | 'position' | 'strategy';
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: SearchResult) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length > 1) {
      searchGlobal();
    } else {
      setResults([]);
    }
  }, [query]);

  const searchGlobal = async () => {
    try {
      setLoading(true);
      const response = await api.trading.globalSearch({ query });
      setResults(response || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onSelect?.(result);
    onClose();
    setQuery('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'signal': return Zap;
      case 'position': return Activity;
      case 'strategy': return TrendingUp;
      default: return Search;
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
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search symbols, signals, positions..."
                  className="flex-1 bg-transparent text-slate-50 placeholder-slate-500 outline-none text-lg"
                  autoFocus
                />
                {loading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-500"></div>
                )}
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {query.length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">Start typing to search...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-400">No results found</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {results.map((result, index) => {
                    const Icon = getIcon(result.type);

                    return (
                      <motion.button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-slate-800/50 transition-colors text-left"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4 }}
                      >
                        <div className="p-2 bg-cyan-500/20 rounded-lg">
                          <Icon className="w-4 h-4 text-cyan-400" />
                        </div>

                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-50">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-slate-400">
                              {result.subtitle}
                            </div>
                          )}
                        </div>

                        <span className="text-xs text-slate-500 capitalize">
                          {result.type}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-700 bg-slate-800/50">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Press ESC to close</span>
                <span>↑↓ to navigate</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;

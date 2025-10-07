import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Star, Clock } from 'lucide-react';

interface Symbol {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  volume_24h: number;
  market_cap: number;
  isFavorite?: boolean;
}

interface SymbolInputProps {
  selectedSymbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
  maxSymbols?: number;
  placeholder?: string;
}

const SymbolInput: React.FC<SymbolInputProps> = ({
  selectedSymbols,
  onSymbolsChange,
  maxSymbols = 10,
  placeholder = 'Search and add symbols...'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Symbol[]>([]);
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);
  const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Popular symbols
  const popularSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'MATIC', 'LINK'];

  useEffect(() => {
    // Load favorites and recent from localStorage
    const stored = localStorage.getItem('favoriteSymbols');
    if (stored) setFavoriteSymbols(JSON.parse(stored));
    
    const recent = localStorage.getItem('recentSymbols');
    if (recent) setRecentSymbols(JSON.parse(recent));
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 1) {
      // Filter suggestions based on search
      const filtered = popularSymbols
        .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(s => ({
          symbol: s,
          name: `${s} Token`,
          price: Math.random() * 10000,
          change_24h: (Math.random() - 0.5) * 10,
          volume_24h: Math.random() * 1000000000,
          market_cap: Math.random() * 100000000000,
          isFavorite: favoriteSymbols.includes(s)
        }));
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [searchTerm, favoriteSymbols]);

  const handleAddSymbol = (symbol: string) => {
    if (selectedSymbols.length >= maxSymbols) {
      alert(`Maximum ${maxSymbols} symbols allowed`);
      return;
    }

    if (!selectedSymbols.includes(symbol)) {
      onSymbolsChange([...selectedSymbols, symbol]);
      
      // Add to recent symbols
      const updated = [symbol, ...recentSymbols.filter(s => s !== symbol)].slice(0, 10);
      setRecentSymbols(updated);
      localStorage.setItem('recentSymbols', JSON.stringify(updated));
    }

    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveSymbol = (symbol: string) => {
    onSymbolsChange(selectedSymbols.filter(s => s !== symbol));
  };

  const toggleFavorite = (symbol: string) => {
    const updated = favoriteSymbols.includes(symbol)
      ? favoriteSymbols.filter(s => s !== symbol)
      : [...favoriteSymbols, symbol];
    
    setFavoriteSymbols(updated);
    localStorage.setItem('favoriteSymbols', JSON.stringify(updated));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleAddSymbol(suggestions[0].symbol);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input Area */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={selectedSymbols.length >= maxSymbols}
            className="flex-1 bg-transparent text-slate-50 placeholder-slate-500 focus:outline-none"
          />
          {selectedSymbols.length > 0 && (
            <span className="text-sm text-slate-400">
              {selectedSymbols.length}/{maxSymbols}
            </span>
          )}
        </div>

        {/* Selected Symbols */}
        {selectedSymbols.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {selectedSymbols.map((symbol) => (
                <motion.div
                  key={symbol}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout
                >
                  <span className="font-semibold">{symbol}</span>
                  <button
                    onClick={() => handleRemoveSymbol(symbol)}
                    className="hover:bg-cyan-500/30 rounded p-0.5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {isOpen && (searchTerm || (!searchTerm && selectedSymbols.length === 0)) && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search Results */}
            {suggestions.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Search Results
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => handleAddSymbol(item.symbol)}
                    disabled={selectedSymbols.includes(item.symbol)}
                    className={`w-full flex items-center justify-between p-3 hover:bg-slate-800 transition-colors text-left ${
                      selectedSymbols.includes(item.symbol) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div>
                        <div className="font-semibold text-slate-50">{item.symbol}</div>
                        <div className="text-xs text-slate-400">{item.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-50">
                          ${item.price.toLocaleString()}
                        </div>
                        <div className={`text-xs font-semibold ${
                          item.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {item.change_24h >= 0 ? '+' : ''}{item.change_24h.toFixed(2)}%
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.symbol);
                        }}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                      >
                        <Star className={`w-4 h-4 ${
                          item.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'
                        }`} />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Access Sections */}
            {!searchTerm && (
              <>
                {/* Favorites */}
                {favoriteSymbols.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      Favorites
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {favoriteSymbols.map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => handleAddSymbol(symbol)}
                          disabled={selectedSymbols.includes(symbol)}
                          className={`px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-semibold hover:bg-yellow-500/30 transition-colors ${
                            selectedSymbols.includes(symbol) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent */}
                {recentSymbols.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Recent
                    </div>
                    <div className="flex flex-wrap gap-2 p-3">
                      {recentSymbols.slice(0, 5).map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => handleAddSymbol(symbol)}
                          disabled={selectedSymbols.includes(symbol)}
                          className={`px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors ${
                            selectedSymbols.includes(symbol) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular */}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Popular
                  </div>
                  <div className="flex flex-wrap gap-2 p-3">
                    {popularSymbols.slice(0, 8).map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => handleAddSymbol(symbol)}
                        disabled={selectedSymbols.includes(symbol)}
                        className={`px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-semibold hover:bg-cyan-500/30 transition-colors ${
                          selectedSymbols.includes(symbol) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* No Results */}
            {searchTerm && suggestions.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No symbols found for "{searchTerm}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SymbolInput;

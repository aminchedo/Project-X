import React, { useState } from 'react';
import { Search, X, Plus } from 'lucide-react';

interface SymbolInputProps {
  symbols: string[];
  onChange: (symbols: string[]) => void;
  disabled?: boolean;
}

const SymbolInput: React.FC<SymbolInputProps> = ({ symbols, onChange, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Popular symbols for autocomplete
  const popularSymbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
    'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT', 'AVAXUSDT', 'LINKUSDT',
    'UNIUSDT', 'ATOMUSDT', 'ETCUSDT', 'XLMUSDT', 'NEARUSDT', 'ALGOUSDT',
  ];

  const suggestions = popularSymbols.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !symbols.includes(s)
  ).slice(0, 8);

  const handleAddSymbol = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    if (normalized && !symbols.includes(normalized)) {
      onChange([...symbols, normalized]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleRemoveSymbol = (symbol: string) => {
    onChange(symbols.filter(s => s !== symbol));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddSymbol(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSuggestions(value.length > 0);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-300">
        📊 نمادها ({symbols.length} انتخاب شده)
      </label>
      
      {/* Selected Symbols */}
      {symbols.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
          {symbols.map((symbol) => (
            <span
              key={symbol}
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700/50 text-slate-200 rounded-lg text-sm font-medium border border-slate-600/30"
            >
              {symbol}
              <button
                onClick={() => handleRemoveSymbol(symbol)}
                disabled={disabled}
                className="p-0.5 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                aria-label={`حذف ${symbol}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Input with Autocomplete */}
      <div className="relative">
        <div className="relative">
          <label htmlFor="symbol-input" className="sr-only">
            Add Trading Symbol
          </label>
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            id="symbol-input"
            name="symbol-input"
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="نماد را تایپ کنید (مثال: BTCUSDT)"
            disabled={disabled}
            className="w-full px-4 py-3 pr-10 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:border-cyan-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {inputValue && (
            <button
              onClick={() => {
                setInputValue('');
                setShowSuggestions(false);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-600/50 rounded transition-colors"
              aria-label="پاک کردن"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 text-xs text-slate-400 border-b border-slate-700">
              پیشنهادات:
            </div>
            {suggestions.map((symbol) => (
              <button
                key={symbol}
                onClick={() => handleAddSymbol(symbol)}
                className="w-full px-4 py-2 text-right hover:bg-slate-700/50 text-slate-200 transition-colors flex items-center justify-between group"
              >
                <span className="font-medium">{symbol}</span>
                <Plus className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Helper Text */}
      <p className="text-xs text-slate-400">
        💡 نماد را تایپ کنید و Enter بزنید. حداقل ۱ نماد لازم است.
      </p>
    </div>
  );
};

export default SymbolInput;

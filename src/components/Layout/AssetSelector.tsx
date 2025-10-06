import React, { useState, useRef, useEffect } from 'react';
import { Search, Star, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  isFavorite?: boolean;
}

interface AssetSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const QUICK_PICKS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT'];

const ASSETS: Asset[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', price: 65432.10, change24h: 2.34, isFavorite: true },
  { symbol: 'ETHUSDT', name: 'Ethereum', price: 3456.78, change24h: 1.89, isFavorite: true },
  { symbol: 'BNBUSDT', name: 'BNB', price: 542.33, change24h: -0.45, isFavorite: true },
  { symbol: 'SOLUSDT', name: 'Solana', price: 145.67, change24h: 5.23, isFavorite: false },
  { symbol: 'XRPUSDT', name: 'Ripple', price: 0.5234, change24h: -1.12, isFavorite: false },
  { symbol: 'ADAUSDT', name: 'Cardano', price: 0.4567, change24h: 3.45, isFavorite: false },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', price: 0.0876, change24h: 4.56, isFavorite: false },
  { symbol: 'MATICUSDT', name: 'Polygon', price: 0.8765, change24h: -2.34, isFavorite: false },
];

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedSymbol,
  onSymbolChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(ASSETS.filter(a => a.isFavorite).map(a => a.symbol))
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter assets based on search
  const filteredAssets = ASSETS.filter(asset =>
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAsset = ASSETS.find(a => a.symbol === selectedSymbol);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(symbol)) {
        newSet.delete(symbol);
      } else {
        newSet.add(symbol);
      }
      return newSet;
    });
  };

  const handleSelect = (symbol: string) => {
    onSymbolChange(symbol);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="asset-select relative">
      {/* Quick Picks - Hidden on small screens */}
      <div className="asset-quick hidden lg:flex">
        {QUICK_PICKS.slice(0, 4).map((symbol) => (
          <button
            key={symbol}
            className={`asset-chip ${selectedSymbol === symbol ? 'is-active' : ''}`}
            onClick={() => onSymbolChange(symbol)}
            aria-label={`Select ${symbol}`}
          >
            {symbol.replace('USDT', '')}
          </button>
        ))}
      </div>

      {/* Main Combo Selector */}
      <div className="relative">
        <button
          ref={buttonRef}
          className="asset-combo cursor-pointer hover:border-[var(--acc-blue)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-label="Asset selector"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span className="font-semibold text-white">{selectedAsset?.symbol.replace('USDT', '') || 'Select'}</span>
          {selectedAsset && (
            <span className={`text-xs ${selectedAsset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h.toFixed(2)}%
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full right-0 mt-2 w-72 bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50"
            role="listbox"
            aria-label="Asset options"
          >
            {/* Search */}
            <div className="p-3 border-b border-slate-700/50">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg">
                <Search className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-0 outline-none w-full text-sm text-white placeholder-slate-400 focus-visible:outline-none"
                  aria-label="Search assets"
                  autoFocus
                />
              </div>
            </div>

            {/* Asset List */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => {
                  const isSelected = asset.symbol === selectedSymbol;
                  const isFav = favorites.has(asset.symbol);
                  
                  return (
                    <button
                      key={asset.symbol}
                      role="option"
                      aria-selected={isSelected}
                      className={`w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-cyan-500/10' : ''
                      }`}
                      onClick={() => handleSelect(asset.symbol)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                          onClick={(e) => toggleFavorite(asset.symbol, e)}
                          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star
                            className={`w-4 h-4 transition-colors ${
                              isFav ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500'
                            }`}
                          />
                        </button>
                        <div className="text-left flex-1">
                          <div className="font-semibold text-white text-sm">{asset.symbol}</div>
                          <div className="text-xs text-slate-400">{asset.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-white font-medium">
                          ${asset.price.toLocaleString()}
                        </div>
                        <div className={`text-xs flex items-center gap-1 ${
                          asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {asset.change24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <TrendingDown className="w-3 h-3" aria-hidden="true" />
                          )}
                          {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="widget-empty py-8">
                  <p className="text-sm">No assets found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700/50 text-xs text-slate-400 text-center">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetSelector;


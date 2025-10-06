import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { useAssetStore } from '../../stores/assetStore';

export function AssetSelect() {
  const { selectedSymbol, setSymbol } = useAssetStore();
  const [searchValue, setSearchValue] = useState('');
  
  const topPicks = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT'];
  
  const allSymbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT', 'XRPUSDT',
    'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'BCHUSDT', 'UNIUSDT', 'AVAXUSDT',
    'MATICUSDT', 'ATOMUSDT', 'FILUSDT', 'TRXUSDT', 'ETCUSDT', 'XLMUSDT'
  ];

  const handleSymbolSelect = (symbol: string) => {
    setSymbol(symbol);
    setSearchValue('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSearchValue(value);
    
    // Auto-select if exact match found
    if (allSymbols.includes(value)) {
      setSymbol(value);
    }
  };

  return (
    <div className="asset-select" role="group" aria-label="Select asset">
      {/* Quick Picks */}
      <div className="asset-quick">
        {topPicks.map(symbol => (
          <button
            key={symbol}
            className={`asset-chip ${selectedSymbol === symbol ? 'is-active' : ''}`}
            onClick={() => handleSymbolSelect(symbol)}
            title={`Select ${symbol}`}
          >
            {symbol}
          </button>
        ))}
      </div>
      
      {/* Combo Selector */}
      <div className="asset-combo">
        <Coins className="w-4 h-4" />
        <input
          list="asset-list"
          placeholder="Choose asset…"
          value={searchValue}
          onChange={handleSearchChange}
          aria-label="Search and select asset"
        />
        <datalist id="asset-list">
          {allSymbols.map(symbol => (
            <option key={symbol} value={symbol} />
          ))}
        </datalist>
      </div>
    </div>
  );
}

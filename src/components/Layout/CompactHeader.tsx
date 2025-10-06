import React, { useState } from 'react';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import { AssetSelector } from './AssetSelector';

interface TimeframeOption {
  id: string;
  label: string;
}

interface CompactHeaderProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  selectedTimeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  onMenuToggle?: () => void;
  showMenu?: boolean;
}

const TIMEFRAMES: TimeframeOption[] = [
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
];

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  selectedSymbol,
  onSymbolChange,
  selectedTimeframe = '1h',
  onTimeframeChange = () => {},
  onMenuToggle,
  showMenu = true,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header 
      className="hts-topbar sticky top-0 z-40"
      role="banner"
      aria-label="Main navigation"
    >
      {/* Left Section */}
      <div className="tb-left">
        {showMenu && (
          <button
            className="tb-burger"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
            aria-expanded="false"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        <div className="tb-brand" aria-label="HTS Trading">
          HTS Trading
        </div>
        
        <nav className="tb-crumbs" aria-label="Breadcrumb">
          <span>Core Trading</span>
          <span aria-hidden="true">›</span>
          <strong>Overview</strong>
        </nav>
      </div>

      {/* Center Section - Timeframe Tabs */}
      <div className="tb-center" role="tablist" aria-label="Timeframe selection">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.id}
            role="tab"
            aria-selected={selectedTimeframe === tf.id}
            aria-label={`${tf.label} timeframe`}
            className={`tf-tab ${selectedTimeframe === tf.id ? 'is-active' : ''}`}
            onClick={() => onTimeframeChange(tf.id)}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Right Section */}
      <div className="tb-right">
        <AssetSelector 
          selectedSymbol={selectedSymbol}
          onSymbolChange={onSymbolChange}
        />
        
        {/* Global Search */}
        <div className="tb-search" role="search">
          <Search className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Global search"
            className="focus:outline-none focus-visible:outline-none"
          />
        </div>

        {/* Notifications */}
        <button 
          className="tb-action relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" aria-hidden="true" />
          <span 
            className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full text-[10px] font-bold flex items-center justify-center"
            aria-label="3 unread notifications"
          >
            3
          </span>
        </button>

        {/* Settings */}
        <button 
          className="tb-action"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};

export default CompactHeader;


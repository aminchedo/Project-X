import React, { useState } from 'react';
import { Menu, Search, Bell, Settings, ChevronLeft } from 'lucide-react';
import { AssetSelect } from './AssetSelect';

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const [activeTimeframe, setActiveTimeframe] = useState('1h');
  const [searchQuery, setSearchQuery] = useState('');

  const timeframes = ['1h', '4h', '1d'];

  return (
    <header className="hts-topbar" dir="rtl" role="banner">
      {/* Left Section */}
      <div className="tb-left">
        <button 
          className="tb-burger" 
          aria-label="Toggle Menu"
          onClick={onMenuToggle}
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="tb-brand">HTS Trading</div>
        <nav aria-label="Breadcrumb" className="tb-crumbs">
          <span>Core Trading</span>
          <ChevronLeft className="w-3 h-3" />
          <strong>Overview</strong>
        </nav>
      </div>

      {/* Center Section - Timeframe Tabs */}
      <div className="tb-center" role="tablist" aria-label="Timeframe">
        {timeframes.map(tf => (
          <button 
            key={tf} 
            role="tab" 
            className={`tf-tab ${activeTimeframe === tf ? 'is-active' : ''}`}
            onClick={() => setActiveTimeframe(tf)}
            aria-selected={activeTimeframe === tf}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Right Section */}
      <div className="tb-right">
        <AssetSelect />
        <div className="tb-search">
          <Search className="w-4 h-4" />
          <input 
            placeholder="Search assets…" 
            aria-label="Search assets"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="tb-action" aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </button>
        <button className="tb-action" aria-label="Settings">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

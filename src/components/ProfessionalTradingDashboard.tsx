import React, { useState, useEffect } from 'react';
import { cryptoService } from '../services/cryptoService';
import './ProfessionalTradingDashboard.css';

interface MetricCardProps {
  icon: string;
  label: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, change, changeType }) => (
  <div className="metric-card">
    <div className="metric-icon">{icon}</div>
    <div className="metric-content">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-change ${changeType}`}>{change}</div>
    </div>
  </div>
);

export const ProfessionalTradingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('professional-dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [liveStatus, setLiveStatus] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCryptoPrices();
    const interval = setInterval(loadCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCryptoPrices = async () => {
    try {
      const symbols = ['SOL', 'BNB', 'ETH', 'BTC'];
      const results = await cryptoService.getMultiplePrices(symbols);
      setCryptoPrices(results.data);
    } catch (error) {
      console.error('Failed to load prices:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadCryptoPrices();
    setLoading(false);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', badge: null },
    { id: 'market-scanner', label: 'Market Scanner', icon: '🔍', badge: 12 },
    { id: 'trading', label: 'Trading', icon: '📈', badge: null, submenu: [
      { id: 'signals', label: 'Signals', badge: 5 },
      { id: 'positions', label: 'Positions', badge: null },
      { id: 'history', label: 'History', badge: null }
    ]},
    { id: 'portfolio', label: 'Portfolio', icon: '💼', badge: null },
    { id: 'analytics', label: 'Analytics', icon: '📉', badge: null },
    { id: 'risk-management', label: 'Risk Management', icon: '🛡️', badge: null },
    { id: 'ai-insights', label: 'AI Insights', icon: '🤖', badge: 3 },
    { id: 'settings', label: 'Settings', icon: '⚙️', badge: null }
  ];

  return (
    <div className="professional-trading-dashboard">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="nav-left">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">BoltAI</span>
          </div>
          <div className="nav-tabs">
            <button className={activeTab === 'calibration' ? 'active' : ''} onClick={() => setActiveTab('calibration')}>
              Calibration
            </button>
            <button className={activeTab === 'ai-controls' ? 'active' : ''} onClick={() => setActiveTab('ai-controls')}>
              AI Controls
            </button>
            <button className={activeTab === 'scanner' ? 'active' : ''} onClick={() => setActiveTab('scanner')}>
              Scanner
            </button>
            <button className={activeTab === 'strategy-smc' ? 'active' : ''} onClick={() => setActiveTab('strategy-smc')}>
              Strategy & SMC
            </button>
            <button className={activeTab === 'professional-dashboard' ? 'active' : ''} onClick={() => setActiveTab('professional-dashboard')}>
              Professional Dashboard
            </button>
          </div>
        </div>
        <div className="nav-right">
          <button className="nav-icon-btn">
            <span className="notification-badge">1</span>
            🔔
          </button>
          <button className="nav-icon-btn">⚙️</button>
          <button className="nav-icon-btn user-btn">
            👤
          </button>
        </div>
      </nav>

      {/* Secondary Header with Stats */}
      <div className="secondary-header">
        <div className="header-left">
          <div className="status-indicator">
            <span className="active-count">Active 32</span>
            <span className="activity-icon">📊</span>
          </div>
        </div>
        <div className="crypto-ticker">
          {cryptoPrices.map((crypto, index) => (
            <div key={index} className="ticker-item">
              <span className={`ticker-change ${crypto.change24h >= 0 ? 'positive' : 'negative'}`}>
                {crypto.change24h >= 0 ? '↗' : '↘'} {Math.abs(crypto.change24h).toFixed(1)}%
              </span>
              <span className="ticker-price">${crypto.price?.toLocaleString() || '0'}</span>
              <span className="ticker-symbol">{crypto.symbol}</span>
            </div>
          ))}
        </div>
        <div className="header-right">
          <div className="btc-main">
            <span className="btc-change positive">2.4% ↗</span>
            <span className="btc-label">BTC</span>
            <span className="btc-icon">₿</span>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar Navigation */}
        <aside className={`sidebar ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="sidebar-header">
            <button className="sidebar-toggle" onClick={() => setSidebarExpanded(!sidebarExpanded)}>
              {sidebarExpanded ? '◀' : '▶'}
            </button>
          </div>
          <nav className="sidebar-nav">
            {navigationItems.map(item => (
              <div key={item.id} className="nav-item-group">
                <button className={`nav-item ${item.id === 'dashboard' ? 'active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  {sidebarExpanded && <span className="nav-label">{item.label}</span>}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </button>
                {item.submenu && sidebarExpanded && (
                  <div className="submenu">
                    {item.submenu.map(subitem => (
                      <button key={subitem.id} className="submenu-item">
                        <span className="submenu-label">{subitem.label}</span>
                        {subitem.badge && <span className="submenu-badge">{subitem.badge}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="upgrade-btn">
              <span className="upgrade-icon">🚀</span>
              {sidebarExpanded && (
                <div className="upgrade-content">
                  <div className="upgrade-title">Upgrade to Pro</div>
                  <div className="upgrade-subtitle">Unlock advanced features</div>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <div className="content-header">
            <div className="search-bar">
              <input 
                id="search-symbols"
                name="search-symbols"
                type="text" 
                placeholder="🔍 Search symbols, signals, strategies..." 
              />
            </div>
            <div className="header-actions">
              <button className={`status-btn ${liveStatus ? 'live' : ''}`} onClick={() => setLiveStatus(!liveStatus)}>
                <span className="status-dot"></span>
                LIVE
              </button>
              <button className="action-btn refresh" onClick={handleRefresh} disabled={loading}>
                🔄 REFRESH
              </button>
              <button className="action-btn expand">
                ⛶ EXPAND
              </button>
            </div>
          </div>

          {/* Key Metrics Section */}
          <section className="metrics-section">
            <div className="section-header">
              <h2>Key Metrics</h2>
              <button className="collapse-btn">▲</button>
            </div>
            <div className="metrics-grid">
              <MetricCard
                icon="📈"
                label="Win Rate"
                value="68.9%"
                change="(7d) 2.1% ↘"
                changeType="negative"
              />
              <MetricCard
                icon="⚡"
                label="Active Signals"
                value="15"
                change="(1h) 12.5% ↗"
                changeType="positive"
              />
              <MetricCard
                icon="💰"
                label="Portfolio Value"
                value="$125,750.50"
                change="(24h) 2.31% ↗"
                changeType="positive"
              />
              <MetricCard
                icon="🛡️"
                label="Risk Score"
                value="6.8/10"
                change="(1h) 0.5% ↗"
                changeType="positive"
              />
            </div>
          </section>

          {/* Additional Content Sections */}
          <section className="content-section">
            <div className="section-placeholder">
              <h3>📊 Advanced Analytics</h3>
              <p>Real-time market analysis and trading insights</p>
            </div>
          </section>
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <div className="sidebar-section">
            <div className="section-title">
              <span className="title-icon">⚡</span>
              <span>BoltAI</span>
            </div>
            <div className="section-subtitle">Trading System</div>
          </div>

          <div className="sidebar-section active-section">
            <button className="section-btn active">
              <span className="btn-icon">📊</span>
              <span className="btn-label">Dashboard</span>
              <span className="btn-arrow">⛶</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="section-label">
              <span className="label-badge">12</span>
              <span className="label-text">Market Scanner</span>
              <span className="label-icon">⛶</span>
            </div>
          </div>

          <div className="sidebar-section">
            <button className="section-btn collapsed">
              <span className="btn-icon">📈</span>
              <span className="btn-label">Trading</span>
              <span className="btn-arrow">▶</span>
            </button>
          </div>

          <div className="sidebar-quick-stats">
            <div className="quick-stat">
              <span className="stat-label">Open Positions</span>
              <span className="stat-value">8</span>
            </div>
            <div className="quick-stat">
              <span className="stat-label">P&L Today</span>
              <span className="stat-value positive">+$2,340</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProfessionalTradingDashboard;


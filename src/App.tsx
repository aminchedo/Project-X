import React, { useState, useEffect } from 'react';
import { AppShell } from './components/Layout/AppShell';
import { OverviewPage } from './components/Overview/OverviewPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api } from './services/api';
import { NewsBanner } from './components/NewsBanner';
import { SMCOverlayToggles } from './components/SMCOverlayToggles';
import { StrategyHUD } from './components/StrategyHUD';
import { SMCDemoPanel } from './components/SMCDemoPanel';
import AIControls from './pages/AIControls';
import { useStrategy } from './state/useStrategy';

type Tab = 'dashboard' | 'strategy' | 'ai';

function Dashboard() {
  const [s] = useStrategy();
  return (
    <div dir={s.rtl ? 'rtl':'ltr'} className="p-4 space-y-3">
      <SMCDemoPanel />
      <NewsBanner news={s.regime.news} highVol={s.regime.highVol} wideSpread={s.regime.wideSpread}/>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">SMC Overlay Controls</h3>
        <SMCOverlayToggles/>
      </div>
      <StrategyHUD/>
      <div className="mt-4">
        <OverviewPage />
      </div>
    </div>
  );
}

function App() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Check backend connectivity on startup
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const health = await api.get('/health');
        setBackendStatus(health);
        setIsBackendConnected(true);
        console.log('✅ Backend connected successfully:', health);
      } catch (error) {
        console.warn('⚠️ Backend not available, running in offline mode:', error);
        setIsBackendConnected(false);
      }
    };

    checkBackendHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ErrorBoundary>
      <div className="App">
        {/* Backend Status Indicator */}
        {!isBackendConnected && (
          <div className="fixed top-4 right-4 z-50 bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-2 text-amber-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <span>Running in offline mode - Backend not connected</span>
            </div>
          </div>
        )}

        <AppShell>
          {/* Tab Navigation */}
          <nav className="p-3 border-b border-gray-200 dark:border-gray-700 flex gap-3 bg-white dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'strategy'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Strategy & SMC
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === 'ai'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              AI Controls
            </button>
          </nav>

          {/* Tab Content */}
          {activeTab === 'dashboard' && <OverviewPage />}
          {activeTab === 'strategy' && <Dashboard />}
          {activeTab === 'ai' && <AIControls />}
        </AppShell>
      </div>
    </ErrorBoundary>
  );
}

export default App;
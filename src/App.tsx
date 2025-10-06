import React, { useState, useEffect } from 'react';
import { AppShell } from './components/Layout/AppShell';
import { OverviewPage } from './components/Overview/OverviewPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { api } from './services/api';

function App() {
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [backendStatus, setBackendStatus] = useState<any>(null);

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
          <OverviewPage />
        </AppShell>
      </div>
    </ErrorBoundary>
  );
}

export default App;
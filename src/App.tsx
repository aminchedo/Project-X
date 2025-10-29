import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LiveDataProvider } from './context/LiveDataContext';
import { FeatureFlagProviderWrapper } from './providers/FeatureFlagProviderWrapper';
import { AppLayout } from './layout/AppLayout';

import Dashboard from './components/Dashboard';
import { PortfolioEntry } from './pages/PortfolioEntry';
import { ScannerEntry } from './pages/ScannerEntry';
import { TrainingPage } from './pages/TrainingPage';
import { BacktestPage } from './pages/BacktestPage';
import { IntelPage } from './pages/IntelPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <FeatureFlagProviderWrapper>
        <LiveDataProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/portfolio" element={<PortfolioEntry />} />
              <Route path="/scanner" element={<ScannerEntry />} />

              {/* New Bolt-integrated pages (feature-gated) */}
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/backtest" element={<BacktestPage />} />
              <Route path="/intel" element={<IntelPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </LiveDataProvider>
      </FeatureFlagProviderWrapper>
    </BrowserRouter>
  );
}

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LiveDataProvider } from './context/LiveDataContext';
import { FeatureFlagProviderWrapper } from './providers/FeatureFlagProviderWrapper';
import { AppLayout } from './layout/AppLayout';

import Dashboard from './components/Dashboard';
import { PortfolioEntry } from './pages/PortfolioEntry';
import { ScannerEntry } from './pages/ScannerEntry';

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
            </Route>
          </Routes>
        </LiveDataProvider>
      </FeatureFlagProviderWrapper>
    </BrowserRouter>
  );
}

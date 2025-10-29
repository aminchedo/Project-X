import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LiveDataProvider } from './context/LiveDataContext';

import Dashboard from './components/Dashboard';
import { PortfolioEntry } from './pages/PortfolioEntry';
import { ScannerEntry } from './pages/ScannerEntry';

export default function App() {
  return (
    <BrowserRouter>
      <LiveDataProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/portfolio" element={<PortfolioEntry />} />
          <Route path="/scanner" element={<ScannerEntry />} />
        </Routes>
      </LiveDataProvider>
    </BrowserRouter>
  );
}

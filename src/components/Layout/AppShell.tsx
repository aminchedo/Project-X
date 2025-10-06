import React, { useState } from 'react';
import { ModernSidebarNew } from '../Navigation/ModernSidebarNew';
import { Topbar } from './Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="hts-page" dir="rtl">
      <div className="hts-shell">
        <ModernSidebarNew activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="hts-main">
          <Topbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
          {children}
        </main>
      </div>
    </div>
  );
}

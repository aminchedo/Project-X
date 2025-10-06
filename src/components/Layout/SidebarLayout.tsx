import React, { useState, useEffect } from 'react';
import { ModernSidebar } from '../Navigation/ModernSidebar';

interface SidebarLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  user?: any;
  onLogout?: () => void;
  isBackendConnected?: boolean;
  backendStatus?: any;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  user,
  onLogout,
  isBackendConnected = false,
  backendStatus
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-collapse sidebar based on viewport size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Auto-collapse when width < 1280px or height < 720px
      if (width < 1280 || height < 720) {
        setIsSidebarCollapsed(true);
      }
    };

    // Check on mount
    handleResize();

    // Add resize listener with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Calculate sidebar width in pixels (for proper spacing)
  const sidebarWidth = isSidebarCollapsed ? 'clamp(64px, 7vw, 88px)' : 'clamp(240px, 18vw, 280px)';

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-white overflow-hidden fullscreen-container" dir="rtl">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop Sidebar - Positioned on the right */}
      <div 
        className="hidden lg:block fixed top-0 right-0 h-full z-30 transition-all duration-300"
        style={{ width: sidebarWidth }}
      >
        <ModernSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full transition-all duration-300">
        {/* Main Content with dynamic padding based on sidebar width */}
        <main 
          className="flex-1 overflow-hidden bg-slate-950 transition-all duration-300"
          style={{ 
            paddingRight: `calc(${sidebarWidth} + 8px)` // Add small gap
          }}
        >
          <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <div 
        className={`lg:hidden fixed top-0 right-0 h-full z-50 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <ModernSidebar
          activeTab={activeTab}
          onTabChange={(tabId) => {
            onTabChange(tabId);
            setIsMobileMenuOpen(false);
          }}
          isCollapsed={false}
          onToggleCollapse={() => {}}
        />
      </div>
    </div>
  );
};

export default SidebarLayout;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModernSidebar from './ModernSidebar';
import Topbar from './Topbar';

interface SidebarLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (href: string) => void;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ 
  children, 
  activePath = '/dashboard',
  onNavigate 
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (href: string) => {
    onNavigate?.(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ModernSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activePath={activePath}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <ModernSidebar
                isCollapsed={false}
                activePath={activePath}
                onNavigate={handleNavigate}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isSidebarOpen={isMobileMenuOpen}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <motion.div
            className="p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;

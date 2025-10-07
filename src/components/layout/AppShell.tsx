import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../ErrorBoundary';
import Loading from '../Loading';

interface AppShellProps {
  children: React.ReactNode;
  layout?: 'sidebar' | 'professional' | 'minimal';
  loading?: boolean;
}

const AppShell: React.FC<AppShellProps> = ({ 
  children,
  layout = 'sidebar',
  loading = false
}) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => setIsInitialized(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized || loading) {
    return <Loading fullScreen message="Initializing BoltAI Trading System..." />;
  }

  return (
    <ErrorBoundary>
      <motion.div
        className="min-h-screen bg-slate-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Global Notifications */}
        <AnimatePresence>
          {/* Future: Global notification system */}
        </AnimatePresence>

        {/* Main Content */}
        {children}

        {/* Global Modals */}
        <AnimatePresence>
          {/* Future: Global modal system */}
        </AnimatePresence>
      </motion.div>
    </ErrorBoundary>
  );
};

export default AppShell;

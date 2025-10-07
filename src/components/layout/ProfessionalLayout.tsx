import React from 'react';
import { motion } from 'framer-motion';
import CompactHeader from './CompactHeader';
import ProfessionalNavigation from './ProfessionalNavigation';

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (href: string) => void;
  showHeader?: boolean;
  showNavigation?: boolean;
}

const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({ 
  children,
  activePath = '/dashboard',
  onNavigate,
  showHeader = true,
  showNavigation = true
}) => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      {showHeader && <CompactHeader />}

      {/* Navigation */}
      {showNavigation && (
        <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
          <ProfessionalNavigation
            activePath={activePath}
            onNavigate={onNavigate}
            variant="horizontal"
          />
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>© 2025 BoltAI Trading System. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfessionalLayout;

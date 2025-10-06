import React from 'react';
import { designTokens } from '../../design/tokens';

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  sidebar,
  header
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      {/* Main Layout */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        {header && (
          <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-lg shadow-slate-900/20">
            {header}
          </header>
        )}
        
        {/* Content Area - Responsive */}
        <div className="flex flex-col lg:flex-row flex-1">
          {/* Sidebar - Responsive */}
          {sidebar && (
            <aside className="w-full lg:w-64 bg-slate-800/40 backdrop-blur-lg border-r border-slate-700/50 lg:block">
              {sidebar}
            </aside>
          )}
          
          {/* Main Content - Responsive */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {/* Page Header - Responsive */}
              {(title || subtitle || actions) && (
                <div className="mb-6 sm:mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      {title && (
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                          {title}
                        </h1>
                      )}
                      {subtitle && (
                        <p className="text-slate-400 text-base sm:text-lg">
                          {subtitle}
                        </p>
                      )}
                    </div>
                    {actions && (
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        {actions}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Page Content - Responsive */}
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Professional Card Component
interface ProfessionalCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  variant = 'default'
}) => {
  const baseClasses = "rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.01]";
  
  const variantClasses = {
    default: "bg-gradient-to-br from-slate-800/40 to-slate-700/30 backdrop-blur-lg border border-slate-700/50 shadow-lg shadow-slate-900/10 hover:shadow-cyan-500/10",
    elevated: "bg-gradient-to-br from-slate-800/60 to-slate-700/40 backdrop-blur-lg border border-slate-700/50 shadow-xl shadow-slate-900/20 hover:shadow-cyan-500/20",
    outlined: "bg-gradient-to-br from-slate-800/20 to-slate-700/10 backdrop-blur-lg border-2 border-slate-700/50 shadow-md shadow-slate-900/5 hover:shadow-cyan-500/5"
  };
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {/* Enhanced Card Header */}
      {(title || subtitle || actions) && (
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {title && (
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-slate-400 text-xs sm:text-sm">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Card Content */}
      <div>
        {children}
      </div>
    </div>
  );
};

// Professional Button Component
interface ProfessionalButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const ProfessionalButton: React.FC<ProfessionalButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button'
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden";
  
  const sizeClasses = {
    sm: "px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm",
    md: "px-3 sm:px-4 py-2 text-sm sm:text-base",
    lg: "px-4 sm:px-6 py-2 sm:py-3 text-base sm:text-lg"
  };
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transform hover:scale-105 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
    secondary: "bg-gradient-to-r from-slate-700/50 to-slate-600/50 text-slate-200 hover:from-slate-600/50 hover:to-slate-500/50 focus:ring-slate-500 border border-slate-600/50 hover:shadow-md",
    outline: "border-2 border-cyan-500/50 text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-600/10 focus:ring-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20",
    ghost: "text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 focus:ring-slate-500 hover:shadow-md"
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loading: React.FC<LoadingProps> = ({ 
  message = 'در حال بارگذاری...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-cyan-500 mb-3`} />
      {message && (
        <p className="text-slate-400 text-sm">{message}</p>
      )}
    </div>
  );
};

export default Loading;

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBlockProps {
  code?: number;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export const ErrorBlock: React.FC<ErrorBlockProps> = ({ 
  code, 
  message, 
  details,
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      
      {code && (
        <div className="text-xs font-mono text-slate-500 mb-2">
          خطا {code}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-white mb-2 text-center">
        {message}
      </h3>
      
      {details && (
        <p className="text-sm text-slate-400 text-center mb-4 max-w-md font-mono">
          {details}
        </p>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4 ml-2" />
          <span>تلاش مجدد</span>
        </button>
      )}
    </div>
  );
};

export default ErrorBlock;

import React, { useState } from 'react';
import { AlertTriangle, X, Info, ExternalLink } from 'lucide-react';

interface DisclaimerBannerProps {
  variant?: 'persistent' | 'dismissible' | 'minimal';
  onDismiss?: () => void;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ 
  variant = 'persistent',
  onDismiss 
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed && variant === 'dismissible') {
    return null;
  }

  const getBannerStyle = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'dismissible':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'minimal':
        return 'text-yellow-600';
      case 'dismissible':
        return 'text-orange-600';
      default:
        return 'text-red-600';
    }
  };

  return (
    <div className={`border-l-4 ${getBannerStyle()} p-4 mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {variant === 'minimal' ? (
            <Info className={`h-5 w-5 ${getIconColor()}`} />
          ) : (
            <AlertTriangle className={`h-5 w-5 ${getIconColor()}`} />
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-medium">
                {variant === 'minimal' 
                  ? 'Educational Use Only' 
                  : 'Important Disclaimer - Not Financial Advice'
                }
              </h3>
              
              <div className="mt-1 text-sm">
                <p>
                  {variant === 'minimal' ? (
                    'This software is for educational purposes only. Not financial advice.'
                  ) : (
                    'This software is NOT financial advice and is provided for educational purposes only. Cryptocurrency trading involves substantial risk of loss. You are solely responsible for your trading decisions.'
                  )}
                </p>
                
                {variant !== 'minimal' && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs">
                      • Past performance does not guarantee future results
                    </p>
                    <p className="text-xs">
                      • AI predictions are probabilistic and may be incorrect
                    </p>
                    <p className="text-xs">
                      • Consult a licensed financial advisor before trading
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-2 flex items-center space-x-4">
                <a
                  href="#disclaimers"
                  className="text-xs font-medium hover:underline flex items-center space-x-1"
                >
                  <span>View Full Disclaimers</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                
                {variant === 'dismissible' && (
                  <button
                    onClick={handleDismiss}
                    className="text-xs font-medium hover:underline"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
            
            {variant === 'dismissible' && (
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={handleDismiss}
                  className={`rounded-md p-1 hover:bg-opacity-20 hover:bg-current ${getIconColor()}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

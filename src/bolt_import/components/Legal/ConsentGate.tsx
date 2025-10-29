import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ConsentGateProps {
  feature: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  onConsent: () => void;
  onDecline: () => void;
  children?: React.ReactNode;
}

export const ConsentGate: React.FC<ConsentGateProps> = ({
  feature,
  description,
  riskLevel,
  onConsent,
  onDecline,
  children
}) => {
  const [hasConsented, setHasConsented] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [consentTime, setConsentTime] = useState(0);
  const [requiredTime] = useState(riskLevel === 'high' ? 15 : riskLevel === 'medium' ? 10 : 5);

  useEffect(() => {
    // Check if user has already consented to this feature
    const consentKey = `consent_${feature}`;
    const consentData = localStorage.getItem(consentKey);
    
    if (consentData) {
      const { timestamp, version } = JSON.parse(consentData);
      const consentDate = new Date(timestamp);
      const daysSinceConsent = (Date.now() - consentDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Consent expires after 30 days
      if (daysSinceConsent < 30 && version === '1.0') {
        setHasConsented(true);
        return;
      }
    }
    
    setShowGate(true);
  }, [feature]);

  useEffect(() => {
    if (showGate && !hasConsented) {
      const timer = setInterval(() => {
        setConsentTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showGate, hasConsented]);

  const handleConsent = () => {
    if (consentTime >= requiredTime) {
      const consentData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        feature,
        riskLevel
      };
      
      localStorage.setItem(`consent_${feature}`, JSON.stringify(consentData));
      setHasConsented(true);
      setShowGate(false);
      onConsent();
    }
  };

  const handleDecline = () => {
    setShowGate(false);
    onDecline();
  };

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      default:
        return 'yellow';
    }
  };

  const getRiskIcon = () => {
    switch (riskLevel) {
      case 'high':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'medium':
        return <Shield className="h-6 w-6 text-orange-600" />;
      default:
        return <Shield className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getRiskMessage = () => {
    switch (riskLevel) {
      case 'high':
        return 'This feature involves high risk. Please ensure you understand the implications before proceeding.';
      case 'medium':
        return 'This feature involves moderate risk. Please review the information carefully.';
      default:
        return 'This feature involves low risk. Please review the information before proceeding.';
    }
  };

  if (hasConsented) {
    return <>{children}</>;
  }

  if (!showGate) {
    return null;
  }

  const canConsent = consentTime >= requiredTime;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className={`bg-${getRiskColor()}-600 text-white p-6 rounded-t-lg`}>
          <div className="flex items-center space-x-3">
            {getRiskIcon()}
            <div>
              <h2 className="text-xl font-bold">Consent Required</h2>
              <p className="text-sm opacity-90">{feature}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Risk Warning */}
          <div className={`bg-${getRiskColor()}-50 border border-${getRiskColor()}-200 rounded-lg p-4`}>
            <div className="flex items-start space-x-3">
              {getRiskIcon()}
              <div>
                <h3 className={`font-semibold text-${getRiskColor()}-800 mb-2`}>
                  Risk Level: {riskLevel.toUpperCase()}
                </h3>
                <p className={`text-sm text-${getRiskColor()}-700`}>
                  {getRiskMessage()}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Description */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Feature Description</h3>
            <p className="text-sm text-gray-700">{description}</p>
          </div>

          {/* Important Considerations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Important Considerations</h3>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  This feature may involve financial risk or data exposure
                </p>
              </div>
              
              <div className="flex items-start space-x-2">
                <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  You are responsible for any consequences of using this feature
                </p>
              </div>
              
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  Consent will expire after 30 days and require renewal
                </p>
              </div>
            </div>
          </div>

          {/* Read Time Progress */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Reading time required</span>
              <span className="text-sm text-gray-500">
                {consentTime}s / {requiredTime}s
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-${getRiskColor()}-600 h-2 rounded-full transition-all duration-1000`}
                style={{ width: `${Math.min((consentTime / requiredTime) * 100, 100)}%` }}
              />
            </div>
            {consentTime < requiredTime && (
              <p className="text-xs text-gray-500 mt-1">
                Please read for at least {requiredTime} seconds before proceeding
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleDecline}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <XCircle className="h-5 w-5" />
              <span>Decline</span>
            </button>
            
            <button
              onClick={handleConsent}
              disabled={!canConsent}
              className={`px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 ${
                canConsent
                  ? `bg-${getRiskColor()}-600 text-white hover:bg-${getRiskColor()}-700`
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>I Understand & Proceed</span>
            </button>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            <p>
              By proceeding, you acknowledge that you have read and understood the risks associated with this feature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

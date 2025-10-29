import React, { useState, useEffect } from 'react';
import { DisclaimerModal } from './DisclaimerModal';
import { DisclaimerBanner } from './DisclaimerBanner';
import { ConsentGate } from './ConsentGate';

interface LegalManagerProps {
  children: React.ReactNode;
}

interface ConsentState {
  disclaimerAccepted: boolean;
  disclaimerDate: string | null;
  disclaimerVersion: string | null;
  featureConsents: Record<string, any>;
}

export const LegalManager: React.FC<LegalManagerProps> = ({ children }) => {
  const [consentState, setConsentState] = useState<ConsentState>({
    disclaimerAccepted: false,
    disclaimerDate: null,
    disclaimerVersion: null,
    featureConsents: {}
  });
  
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Check disclaimer acceptance
    const disclaimerAccepted = localStorage.getItem('disclaimerAccepted') === 'true';
    const disclaimerDate = localStorage.getItem('disclaimerDate');
    const disclaimerVersion = localStorage.getItem('disclaimerVersion');
    
    // Check feature consents
    const featureConsents: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('consent_')) {
        const feature = key.replace('consent_', '');
        const consentData = localStorage.getItem(key);
        if (consentData) {
          try {
            featureConsents[feature] = JSON.parse(consentData);
          } catch (e) {
            console.error('Failed to parse consent data:', e);
          }
        }
      }
    }

    setConsentState({
      disclaimerAccepted,
      disclaimerDate,
      disclaimerVersion,
      featureConsents
    });

    // Show disclaimer modal if not accepted
    if (!disclaimerAccepted) {
      setShowDisclaimerModal(true);
    } else {
      // Show banner if disclaimer is accepted but banner not dismissed
      const bannerDismissed = localStorage.getItem('bannerDismissed') === 'true';
      if (!bannerDismissed) {
        setShowBanner(true);
      }
    }
  }, []);

  const handleDisclaimerAccept = () => {
    setShowDisclaimerModal(false);
    setShowBanner(true);
    setConsentState(prev => ({
      ...prev,
      disclaimerAccepted: true,
      disclaimerDate: new Date().toISOString(),
      disclaimerVersion: '1.0'
    }));
  };

  const handleDisclaimerReject = () => {
    // Close the application or redirect to exit page
    window.close();
  };

  const handleBannerDismiss = () => {
    setShowBanner(false);
    setBannerDismissed(true);
    localStorage.setItem('bannerDismissed', 'true');
  };

  const checkFeatureConsent = (feature: string): boolean => {
    const consent = consentState.featureConsents[feature];
    if (!consent) return false;
    
    const consentDate = new Date(consent.timestamp);
    const daysSinceConsent = (Date.now() - consentDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Consent expires after 30 days
    return daysSinceConsent < 30 && consent.version === '1.0';
  };

  const requireFeatureConsent = (
    feature: string,
    description: string,
    riskLevel: 'low' | 'medium' | 'high'
  ): boolean => {
    return checkFeatureConsent(feature);
  };

  // Don't render children until disclaimer is accepted
  if (!consentState.disclaimerAccepted) {
    return (
      <>
        {showDisclaimerModal && (
          <DisclaimerModal
            onAccept={handleDisclaimerAccept}
            onReject={handleDisclaimerReject}
          />
        )}
      </>
    );
  }

  return (
    <>
      {/* Disclaimer Banner */}
      {showBanner && !bannerDismissed && (
        <DisclaimerBanner
          variant="dismissible"
          onDismiss={handleBannerDismiss}
        />
      )}
      
      {/* Main Application */}
      {children}
    </>
  );
};

// Hook for checking feature consent
export const useFeatureConsent = (feature: string) => {
  const [hasConsent, setHasConsent] = useState(false);
  const [consentData, setConsentData] = useState<any>(null);

  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem(`consent_${feature}`);
      if (consent) {
        try {
          const parsed = JSON.parse(consent);
          const consentDate = new Date(parsed.timestamp);
          const daysSinceConsent = (Date.now() - consentDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceConsent < 30 && parsed.version === '1.0') {
            setHasConsent(true);
            setConsentData(parsed);
          } else {
            setHasConsent(false);
            setConsentData(null);
          }
        } catch (e) {
          setHasConsent(false);
          setConsentData(null);
        }
      } else {
        setHasConsent(false);
        setConsentData(null);
      }
    };

    checkConsent();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `consent_${feature}`) {
        checkConsent();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [feature]);

  return { hasConsent, consentData };
};

// Higher-order component for feature consent gating
export const withFeatureConsent = <P extends object>(
  Component: React.ComponentType<P>,
  feature: string,
  description: string,
  riskLevel: 'low' | 'medium' | 'high' = 'medium'
) => {
  return (props: P) => {
    const { hasConsent } = useFeatureConsent(feature);
    const [showConsentGate, setShowConsentGate] = useState(!hasConsent);

    const handleConsent = () => {
      setShowConsentGate(false);
    };

    const handleDecline = () => {
      setShowConsentGate(false);
    };

    if (showConsentGate) {
      return (
        <ConsentGate
          feature={feature}
          description={description}
          riskLevel={riskLevel}
          onConsent={handleConsent}
          onDecline={handleDecline}
        />
      );
    }

    return <Component {...props} />;
  };
};

// Utility functions for consent management
export const consentUtils = {
  // Check if disclaimer is accepted
  isDisclaimerAccepted: (): boolean => {
    return localStorage.getItem('disclaimerAccepted') === 'true';
  },

  // Check if feature consent is valid
  hasFeatureConsent: (feature: string): boolean => {
    const consent = localStorage.getItem(`consent_${feature}`);
    if (!consent) return false;
    
    try {
      const parsed = JSON.parse(consent);
      const consentDate = new Date(parsed.timestamp);
      const daysSinceConsent = (Date.now() - consentDate.getTime()) / (1000 * 60 * 60 * 24);
      
      return daysSinceConsent < 30 && parsed.version === '1.0';
    } catch (e) {
      return false;
    }
  },

  // Get consent data for a feature
  getFeatureConsent: (feature: string): any => {
    const consent = localStorage.getItem(`consent_${feature}`);
    if (!consent) return null;
    
    try {
      return JSON.parse(consent);
    } catch (e) {
      return null;
    }
  },

  // Revoke consent for a feature
  revokeFeatureConsent: (feature: string): void => {
    localStorage.removeItem(`consent_${feature}`);
  },

  // Revoke all consents
  revokeAllConsents: (): void => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('consent_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  // Get all consent data
  getAllConsents: (): Record<string, any> => {
    const consents: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('consent_')) {
        const feature = key.replace('consent_', '');
        const consentData = localStorage.getItem(key);
        if (consentData) {
          try {
            consents[feature] = JSON.parse(consentData);
          } catch (e) {
            console.error('Failed to parse consent data:', e);
          }
        }
      }
    }
    
    return consents;
  }
};

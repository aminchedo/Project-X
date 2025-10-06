import React from 'react';

export const AccessibilitySkipLink: React.FC = () => {
  return (
    <a 
      href="#main-content" 
      className="skip-to-content"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
};

export default AccessibilitySkipLink;


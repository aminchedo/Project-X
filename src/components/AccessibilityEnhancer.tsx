import React, { useEffect, useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Contrast, 
  Type, 
  MousePointer,
  Keyboard,
  Monitor,
  Smartphone
} from 'lucide-react';
import { ProfessionalCard } from './Layout/ProfessionalLayout';
import { soundManager } from '../utils/sound';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  soundEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorScheme: 'auto' | 'light' | 'dark';
}

interface AccessibilityEnhancerProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

export const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({ 
  onSettingsChange 
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
    soundEnabled: true,
    fontSize: 'medium',
    colorScheme: 'dark'
  });

  const [isVisible, setIsVisible] = useState(false);
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    // Detect device type
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 640) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
    };
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    // Apply accessibility settings
    applyAccessibilitySettings(settings);
    
    // Sync sound settings with sound manager
    soundManager.updateConfig({
      soundEnabled: settings.soundEnabled,
      volume: 0.5
    });
  }, [settings]);

  useEffect(() => {
    // Check for system preferences only once on mount
    checkSystemPreferences();
  }, []); // Empty dependency array to run only once

  const checkSystemPreferences = () => {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }

    // Check for high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }

    // Check for color scheme preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setSettings(prev => ({ ...prev, colorScheme: 'light' }));
    }
  };

  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (newSettings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Font size
    root.style.setProperty('--font-size-multiplier', getFontSizeMultiplier(newSettings.fontSize));

    // Color scheme
    if (newSettings.colorScheme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else if (newSettings.colorScheme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      // Auto - use system preference
      root.classList.remove('light-theme', 'dark-theme');
    }

    // Notify parent component
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  const getFontSizeMultiplier = (size: string): string => {
    switch (size) {
      case 'small': return '0.875';
      case 'medium': return '1';
      case 'large': return '1.125';
      case 'extra-large': return '1.25';
      default: return '1';
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    updateSetting(key, !settings[key as keyof AccessibilitySettings]);
  };

  const announceToScreenReader = (message: string) => {
    if (settings.screenReader) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // ESC to close
    if (event.key === 'Escape') {
      setIsVisible(false);
      announceToScreenReader('Accessibility settings closed');
    }
    
    // Enter or Space to toggle
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const target = event.target as HTMLElement;
      const button = target.closest('button');
      if (button) {
        button.click();
      }
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        onKeyDown={handleKeyDown}
        className="fixed bottom-4 right-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Open accessibility settings"
        title="Accessibility Settings"
      >
        <Eye className="w-5 h-5 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
      <ProfessionalCard 
        title="Accessibility Settings" 
        subtitle="Customize your experience"
        actions={
          <button
            onClick={() => setIsVisible(false)}
            onKeyDown={handleKeyDown}
            className="p-1 hover:bg-slate-700/50 rounded transition-colors"
            aria-label="Close accessibility settings"
          >
            <EyeOff className="w-4 h-4 text-slate-400" />
          </button>
        }
      >
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          {/* Device Type Indicator */}
          <div className="flex items-center space-x-2 p-2 bg-slate-700/30 rounded-lg">
            {deviceType === 'mobile' && <Smartphone className="w-4 h-4 text-blue-400" />}
            {deviceType === 'tablet' && <Monitor className="w-4 h-4 text-green-400" />}
            {deviceType === 'desktop' && <Monitor className="w-4 h-4 text-purple-400" />}
            <span className="text-sm text-slate-300 capitalize">
              {deviceType} viewport detected
            </span>
          </div>

          {/* Visual Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Visual Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Contrast className="w-4 h-4 text-slate-400" />
                <span className="text-sm">High Contrast</span>
              </div>
              <button
                onClick={() => {
                  toggleSetting('highContrast');
                  announceToScreenReader(`High contrast ${!settings.highContrast ? 'enabled' : 'disabled'}`);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.highContrast ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.highContrast}
                aria-label="Toggle high contrast mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Large Text</span>
              </div>
              <button
                onClick={() => {
                  toggleSetting('largeText');
                  announceToScreenReader(`Large text ${!settings.largeText ? 'enabled' : 'disabled'}`);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.largeText ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.largeText}
                aria-label="Toggle large text mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.largeText ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Font Size</label>
              <select
                value={settings.fontSize}
                onChange={(e) => {
                  updateSetting('fontSize', e.target.value as any);
                  announceToScreenReader(`Font size changed to ${e.target.value}`);
                }}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select font size"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
              </select>
            </div>
          </div>

          {/* Interaction Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Interaction Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MousePointer className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Reduced Motion</span>
              </div>
              <button
                onClick={() => {
                  toggleSetting('reducedMotion');
                  announceToScreenReader(`Reduced motion ${!settings.reducedMotion ? 'enabled' : 'disabled'}`);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.reducedMotion ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.reducedMotion}
                aria-label="Toggle reduced motion"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Keyboard className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Keyboard Navigation</span>
              </div>
              <button
                onClick={() => {
                  toggleSetting('keyboardNavigation');
                  announceToScreenReader(`Keyboard navigation ${!settings.keyboardNavigation ? 'enabled' : 'disabled'}`);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.keyboardNavigation ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.keyboardNavigation}
                aria-label="Toggle keyboard navigation"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-slate-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm">Sound Effects</span>
              </div>
              <button
                onClick={() => {
                  toggleSetting('soundEnabled');
                  announceToScreenReader(`Sound effects ${!settings.soundEnabled ? 'enabled' : 'disabled'}`);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.soundEnabled ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.soundEnabled}
                aria-label="Toggle sound effects"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Screen Reader Support */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">Screen Reader</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-sm">Screen Reader Mode</span>
              </div>
              <button
                onClick={() => {
                  toggleSetting('screenReader');
                  announceToScreenReader(`Screen reader mode ${!settings.screenReader ? 'enabled' : 'disabled'}`);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.screenReader ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-pressed={settings.screenReader}
                aria-label="Toggle screen reader mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.screenReader ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-300">Keyboard Shortcuts</h3>
            <div className="text-xs text-slate-400 space-y-1">
              <div>ESC - Close this panel</div>
              <div>Tab - Navigate between options</div>
              <div>Enter/Space - Toggle settings</div>
              <div>Arrow keys - Navigate menus</div>
            </div>
          </div>
        </div>
      </ProfessionalCard>
    </div>
  );
};

export default AccessibilityEnhancer;

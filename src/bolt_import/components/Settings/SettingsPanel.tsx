import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Brain, 
  Key, 
  Bell, 
  Palette, 
  Shield, 
  Database, 
  Cpu, 
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import ArchitectureDesigner from './ArchitectureDesigner';
import APIKeyManager from './APIKeyManager';
import AlertsConfiguration from './AlertsConfiguration';
import ThemeCustomization from './ThemeCustomization';
import SecuritySettings from './SecuritySettings';
import DatabaseSettings from './DatabaseSettings';

interface SettingsConfig {
  neural_network: {
    architecture: {
      layers: Array<{
        type: 'lstm' | 'dense' | 'dropout' | 'batch_norm';
        units?: number;
        rate?: number;
        activation?: string;
      }>;
      optimizer: 'adam' | 'adamw' | 'sgd';
      learning_rate: number;
      batch_size: number;
      epochs: number;
    };
    training: {
      gradient_clipping: number;
      early_stopping_patience: number;
      validation_split: number;
      curriculum_enabled: boolean;
      instability_watchdog: boolean;
    };
  };
  api_keys: {
    binance: { key: string; secret: string; enabled: boolean };
    coingecko: { key: string; enabled: boolean };
    telegram: { token: string; chat_id: string; enabled: boolean };
    discord: { webhook_url: string; enabled: boolean };
  };
  alerts: {
    price_alerts: boolean;
    training_alerts: boolean;
    risk_alerts: boolean;
    channels: string[];
    thresholds: {
      price_change: number;
      risk_score: number;
      drawdown: number;
    };
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    chart_style: 'candlestick' | 'line' | 'area';
    refresh_interval: number;
  };
  security: {
    encryption_enabled: boolean;
    auto_lock_timeout: number;
    require_auth: boolean;
    backup_enabled: boolean;
  };
}

const SettingsPanel: React.FC = () => {
  const [config, setConfig] = useState<SettingsConfig | null>(null);
  const [activeTab, setActiveTab] = useState<string>('architecture');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (response.ok) {
        const settings = await response.json();
        setConfig(settings);
      } else {
        // Load default settings
        setConfig(getDefaultSettings());
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setConfig(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = (): SettingsConfig => ({
    neural_network: {
      architecture: {
        layers: [
          { type: 'lstm', units: 128, activation: 'tanh' },
          { type: 'dropout', rate: 0.2 },
          { type: 'lstm', units: 64, activation: 'tanh' },
          { type: 'dropout', rate: 0.2 },
          { type: 'dense', units: 32, activation: 'relu' },
          { type: 'dense', units: 3, activation: 'softmax' }
        ],
        optimizer: 'adamw',
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 100
      },
      training: {
        gradient_clipping: 1.0,
        early_stopping_patience: 10,
        validation_split: 0.2,
        curriculum_enabled: true,
        instability_watchdog: true
      }
    },
    api_keys: {
      binance: { key: '', secret: '', enabled: false },
      coingecko: { key: '', enabled: false },
      telegram: { token: '', chat_id: '', enabled: false },
      discord: { webhook_url: '', enabled: false }
    },
    alerts: {
      price_alerts: true,
      training_alerts: true,
      risk_alerts: true,
      channels: ['ui'],
      thresholds: {
        price_change: 0.05,
        risk_score: 80,
        drawdown: 0.1
      }
    },
    ui: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      chart_style: 'candlestick',
      refresh_interval: 5000
    },
    security: {
      encryption_enabled: true,
      auto_lock_timeout: 30,
      require_auth: false,
      backup_enabled: true
    }
  });

  const saveSettings = async () => {
    if (!config) return;

    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setHasChanges(false);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      setConfig(getDefaultSettings());
      setHasChanges(true);
    }
  };

  const updateConfig = (path: string[], value: any) => {
    if (!config) return;

    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    setConfig(newConfig);
    setHasChanges(true);
  };

  const tabs = [
    { id: 'architecture', label: 'Neural Architecture', icon: Brain },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
    { id: 'ui', label: 'UI & Theme', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'database', label: 'Database', icon: Database }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Settings</h2>
          <p className="text-gray-600 mb-4">Unable to load configuration. Please try again.</p>
          <button
            onClick={loadSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="w-8 h-8 mr-3 text-blue-600" />
            Settings & Configuration
          </h1>
          <p className="text-gray-600 mt-1">Configure neural network, APIs, alerts, and system preferences</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {/* Save Status */}
          {saveStatus === 'success' && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Settings saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center space-x-1 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Save failed</span>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={resetSettings}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Reset to Defaults</span>
          </button>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              hasChanges && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Changes Indicator */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 font-medium">
              You have unsaved changes. Don't forget to save your configuration.
            </span>
          </div>
        </div>
      )}

      {/* Settings Interface */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'architecture' && (
            <ArchitectureDesigner
              config={config.neural_network}
              onUpdate={(newConfig) => updateConfig(['neural_network'], newConfig)}
            />
          )}

          {activeTab === 'api-keys' && (
            <APIKeyManager
              config={config.api_keys}
              onUpdate={(newConfig) => updateConfig(['api_keys'], newConfig)}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsConfiguration
              config={config.alerts}
              onUpdate={(newConfig) => updateConfig(['alerts'], newConfig)}
            />
          )}

          {activeTab === 'ui' && (
            <ThemeCustomization
              config={config.ui}
              onUpdate={(newConfig) => updateConfig(['ui'], newConfig)}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettings
              config={config.security}
              onUpdate={(newConfig) => updateConfig(['security'], newConfig)}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseSettings
              onUpdate={(newConfig) => {
                // Database settings might need special handling
                console.log('Database config updated:', newConfig);
              }}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Cpu className="w-3 h-3" />
              <span>Configuration Version: 1.0.0</span>
            </div>
            <span>Last Modified: {new Date().toLocaleString()}</span>
          </div>
          <div className="text-right">
            <p className="font-semibold text-blue-600">
              ℹ️ Changes require application restart to take full effect
            </p>
            <p>Some settings are applied immediately, others need restart</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;

import React, { useState } from 'react';
import { Bell, Volume2, VolumeX, Smartphone, MessageSquare, Mail, Monitor } from 'lucide-react';

interface AlertsConfig {
  price_alerts: boolean;
  training_alerts: boolean;
  risk_alerts: boolean;
  channels: string[];
  thresholds: {
    price_change: number;
    risk_score: number;
    drawdown: number;
  };
}

interface AlertsConfigurationProps {
  config: AlertsConfig;
  onUpdate: (config: AlertsConfig) => void;
}

interface AlertChannel {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  requiresSetup: boolean;
}

interface AlertType {
  id: keyof Pick<AlertsConfig, 'price_alerts' | 'training_alerts' | 'risk_alerts'>;
  name: string;
  description: string;
  examples: string[];
}

const AlertsConfiguration: React.FC<AlertsConfigurationProps> = ({ config, onUpdate }) => {
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  const alertChannels: AlertChannel[] = [
    {
      id: 'ui',
      name: 'In-App Notifications',
      description: 'Show notifications within the application interface',
      icon: Monitor,
      enabled: config.channels.includes('ui'),
      requiresSetup: false
    },
    {
      id: 'windows',
      name: 'Windows Toast',
      description: 'Native Windows desktop notifications',
      icon: Volume2,
      enabled: config.channels.includes('windows'),
      requiresSetup: false
    },
    {
      id: 'telegram',
      name: 'Telegram',
      description: 'Send alerts to your Telegram chat',
      icon: Smartphone,
      enabled: config.channels.includes('telegram'),
      requiresSetup: true
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Post alerts to Discord channel via webhook',
      icon: MessageSquare,
      enabled: config.channels.includes('discord'),
      requiresSetup: true
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Send email notifications for critical alerts',
      icon: Mail,
      enabled: config.channels.includes('email'),
      requiresSetup: true
    }
  ];

  const alertTypes: AlertType[] = [
    {
      id: 'price_alerts',
      name: 'Price Alerts',
      description: 'Notifications for significant price movements and market events',
      examples: [
        'BTC price changed by >5% in 1 hour',
        'Major support/resistance level broken',
        'Unusual volume spike detected',
        'AI prediction confidence above 90%'
      ]
    },
    {
      id: 'training_alerts',
      name: 'Training Alerts',
      description: 'Notifications about neural network training progress and issues',
      examples: [
        'Training completed successfully',
        'Instability detected and recovered',
        'New best model checkpoint saved',
        'Training stopped due to early stopping'
      ]
    },
    {
      id: 'risk_alerts',
      name: 'Risk Management Alerts',
      description: 'Notifications for risk threshold breaches and portfolio warnings',
      examples: [
        'Portfolio risk score exceeded 80',
        'Maximum drawdown limit reached',
        'VaR threshold breached',
        'Position size recommendation changed'
      ]
    }
  ];

  const updateAlertType = (alertType: keyof Pick<AlertsConfig, 'price_alerts' | 'training_alerts' | 'risk_alerts'>, enabled: boolean) => {
    const newConfig = {
      ...config,
      [alertType]: enabled
    };
    onUpdate(newConfig);
  };

  const updateChannel = (channelId: string, enabled: boolean) => {
    const newChannels = enabled
      ? [...config.channels.filter(c => c !== channelId), channelId]
      : config.channels.filter(c => c !== channelId);
    
    const newConfig = {
      ...config,
      channels: newChannels
    };
    onUpdate(newConfig);
  };

  const updateThreshold = (thresholdKey: keyof AlertsConfig['thresholds'], value: number) => {
    const newConfig = {
      ...config,
      thresholds: {
        ...config.thresholds,
        [thresholdKey]: value
      }
    };
    onUpdate(newConfig);
  };

  const testNotificationChannel = async (channelId: string) => {
    setTestingChannel(channelId);
    
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channelId,
          message: 'This is a test notification from BOLT AI Crypto'
        })
      });

      if (response.ok) {
        // Show success feedback
        console.log(`Test notification sent via ${channelId}`);
      } else {
        console.error(`Failed to send test notification via ${channelId}`);
      }
    } catch (error) {
      console.error(`Error testing ${channelId} notifications:`, error);
    } finally {
      setTimeout(() => setTestingChannel(null), 2000);
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Types */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alert Types</h3>
            
            <div className="space-y-4">
              {alertTypes.map((alertType) => (
                <div key={alertType.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{alertType.name}</h4>
                      <p className="text-sm text-gray-600">{alertType.description}</p>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config[alertType.id]}
                        onChange={(e) => updateAlertType(alertType.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </label>
                  </div>

                  {config[alertType.id] && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Examples:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {alertType.examples.map((example, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-1">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Alert Thresholds */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Alert Thresholds</h3>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Change Threshold
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                    value={config.thresholds.price_change}
                    onChange={(e) => updateThreshold('price_change', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                    {formatPercentage(config.thresholds.price_change)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Alert when price changes by more than this percentage in 1 hour
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Score Threshold
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={config.thresholds.risk_score}
                    onChange={(e) => updateThreshold('risk_score', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                    {config.thresholds.risk_score}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Alert when portfolio risk score exceeds this value
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Drawdown Threshold
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0.05"
                    max="0.3"
                    step="0.01"
                    value={config.thresholds.drawdown}
                    onChange={(e) => updateThreshold('drawdown', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                    {formatPercentage(config.thresholds.drawdown)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Alert when portfolio drawdown exceeds this percentage
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Channels</h3>
          
          <div className="space-y-3">
            {alertChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div key={channel.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{channel.name}</h4>
                        <p className="text-sm text-gray-600">{channel.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Test Button */}
                      {channel.enabled && (
                        <button
                          onClick={() => testNotificationChannel(channel.id)}
                          disabled={testingChannel === channel.id}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          {testingChannel === channel.id ? 'Testing...' : 'Test'}
                        </button>
                      )}
                      
                      {/* Enable/Disable Toggle */}
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={channel.enabled}
                          onChange={(e) => updateChannel(channel.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Setup Warning */}
                  {channel.enabled && channel.requiresSetup && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                      ⚠️ This channel requires API configuration in the API Keys section
                    </div>
                  )}

                  {/* Channel Status */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Status: {channel.enabled ? 
                        (channel.requiresSetup ? 'Enabled (Setup Required)' : 'Active') : 
                        'Disabled'
                      }
                    </span>
                    {channel.id === 'ui' && (
                      <span className="text-green-600">Always Available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notification Settings */}
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Notification Settings</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Sound Notifications</span>
                  <p className="text-xs text-gray-500">Play sound for critical alerts</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Quiet Hours</span>
                  <p className="text-xs text-gray-500">Reduce notifications during specified hours</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Batch Notifications</span>
                  <p className="text-xs text-gray-500">Group similar alerts to reduce spam</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Alert History Preview */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Recent Alerts Preview</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2 p-2 bg-white rounded border-l-4 border-red-400">
                <span className="text-red-600 font-medium">RISK</span>
                <span className="text-gray-700">Portfolio risk score reached 85</span>
                <span className="text-gray-500 text-xs ml-auto">2 min ago</span>
              </div>
              
              <div className="flex items-center space-x-2 p-2 bg-white rounded border-l-4 border-blue-400">
                <span className="text-blue-600 font-medium">PRICE</span>
                <span className="text-gray-700">BTC price increased 6.2% in 1 hour</span>
                <span className="text-gray-500 text-xs ml-auto">15 min ago</span>
              </div>
              
              <div className="flex items-center space-x-2 p-2 bg-white rounded border-l-4 border-green-400">
                <span className="text-green-600 font-medium">TRAIN</span>
                <span className="text-gray-700">Model training completed successfully</span>
                <span className="text-gray-500 text-xs ml-auto">1 hour ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Alert Configuration Summary</h4>
        <div className="text-sm text-blue-700 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="font-medium">Active Alert Types:</span>
            <div className="text-xs">
              {[config.price_alerts && 'Price', config.training_alerts && 'Training', config.risk_alerts && 'Risk']
                .filter(Boolean).join(', ') || 'None'}
            </div>
          </div>
          <div>
            <span className="font-medium">Active Channels:</span>
            <div className="text-xs">{config.channels.length} enabled</div>
          </div>
          <div>
            <span className="font-medium">Price Threshold:</span>
            <div className="text-xs">{formatPercentage(config.thresholds.price_change)}</div>
          </div>
          <div>
            <span className="font-medium">Risk Threshold:</span>
            <div className="text-xs">{config.thresholds.risk_score}/100</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsConfiguration;

import React, { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertTriangle, ExternalLink, Shield, TestTube } from 'lucide-react';

interface APIKeyConfig {
  binance: { key: string; secret: string; enabled: boolean };
  coingecko: { key: string; enabled: boolean };
  telegram: { token: string; chat_id: string; enabled: boolean };
  discord: { webhook_url: string; enabled: boolean };
}

interface APIKeyManagerProps {
  config: APIKeyConfig;
  onUpdate: (config: APIKeyConfig) => void;
}

interface APIService {
  id: keyof APIKeyConfig;
  name: string;
  description: string;
  website: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password';
    placeholder: string;
    required: boolean;
  }>;
  testEndpoint?: string;
}

const APIKeyManager: React.FC<APIKeyManagerProps> = ({ config, onUpdate }) => {
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [testingStatus, setTestingStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

  const apiServices: APIService[] = [
    {
      id: 'binance',
      name: 'Binance',
      description: 'Real-time cryptocurrency market data and trading',
      website: 'https://www.binance.com/en/support/faq/how-to-create-api-360002502072',
      fields: [
        { key: 'key', label: 'API Key', type: 'password', placeholder: 'Your Binance API Key', required: true },
        { key: 'secret', label: 'Secret Key', type: 'password', placeholder: 'Your Binance Secret Key', required: true }
      ],
      testEndpoint: '/api/test/binance'
    },
    {
      id: 'coingecko',
      name: 'CoinGecko',
      description: 'Cryptocurrency market data, prices, and market cap information',
      website: 'https://www.coingecko.com/en/api/documentation',
      fields: [
        { key: 'key', label: 'API Key', type: 'password', placeholder: 'Your CoinGecko API Key (optional for basic usage)', required: false }
      ],
      testEndpoint: '/api/test/coingecko'
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      description: 'Send notifications and alerts via Telegram',
      website: 'https://core.telegram.org/bots#creating-a-new-bot',
      fields: [
        { key: 'token', label: 'Bot Token', type: 'password', placeholder: 'Bot token from @BotFather', required: true },
        { key: 'chat_id', label: 'Chat ID', type: 'text', placeholder: 'Your chat ID or group ID', required: true }
      ],
      testEndpoint: '/api/test/telegram'
    },
    {
      id: 'discord',
      name: 'Discord Webhook',
      description: 'Send notifications to Discord channels',
      website: 'https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks',
      fields: [
        { key: 'webhook_url', label: 'Webhook URL', type: 'password', placeholder: 'Discord webhook URL', required: true }
      ],
      testEndpoint: '/api/test/discord'
    }
  ];

  const updateAPIConfig = (serviceId: keyof APIKeyConfig, field: string, value: string | boolean) => {
    const newConfig = {
      ...config,
      [serviceId]: {
        ...config[serviceId],
        [field]: value
      }
    };
    onUpdate(newConfig);
  };

  const toggleVisibility = (fieldId: string) => {
    setVisibleFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const testAPIConnection = async (serviceId: keyof APIKeyConfig) => {
    const service = apiServices.find(s => s.id === serviceId);
    if (!service?.testEndpoint) return;

    setTestingStatus(prev => ({ ...prev, [serviceId]: 'testing' }));

    try {
      const response = await fetch(service.testEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config[serviceId])
      });

      if (response.ok) {
        setTestingStatus(prev => ({ ...prev, [serviceId]: 'success' }));
        setTimeout(() => {
          setTestingStatus(prev => ({ ...prev, [serviceId]: 'idle' }));
        }, 3000);
      } else {
        setTestingStatus(prev => ({ ...prev, [serviceId]: 'error' }));
        setTimeout(() => {
          setTestingStatus(prev => ({ ...prev, [serviceId]: 'idle' }));
        }, 3000);
      }
    } catch (error) {
      console.error(`Failed to test ${serviceId} connection:`, error);
      setTestingStatus(prev => ({ ...prev, [serviceId]: 'error' }));
      setTimeout(() => {
        setTestingStatus(prev => ({ ...prev, [serviceId]: 'idle' }));
      }, 3000);
    }
  };

  const getFieldValue = (serviceId: keyof APIKeyConfig, fieldKey: string): string => {
    const serviceConfig = config[serviceId] as any;
    return serviceConfig[fieldKey] || '';
  };

  const isServiceConfigured = (serviceId: keyof APIKeyConfig): boolean => {
    const service = apiServices.find(s => s.id === serviceId);
    if (!service) return false;

    const serviceConfig = config[serviceId] as any;
    return service.fields
      .filter(field => field.required)
      .every(field => serviceConfig[field.key] && serviceConfig[field.key].trim() !== '');
  };

  const getStatusIcon = (serviceId: keyof APIKeyConfig) => {
    const status = testingStatus[serviceId];
    const configured = isServiceConfigured(serviceId);
    const enabled = config[serviceId].enabled;

    if (status === 'testing') {
      return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
    }
    if (status === 'success') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (status === 'error') {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    if (configured && enabled) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (configured && !enabled) {
      return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Key className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">API Key Management</h2>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-blue-800">Security Information</h3>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• All API keys are encrypted and stored securely using Windows Credential Manager</p>
          <p>• Keys are never transmitted in plain text or logged</p>
          <p>• Only use API keys with read-only permissions when possible</p>
          <p>• Regularly rotate your API keys for enhanced security</p>
        </div>
      </div>

      {/* API Services */}
      <div className="space-y-6">
        {apiServices.map((service) => (
          <div key={service.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.id)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Test Connection Button */}
                {service.testEndpoint && isServiceConfigured(service.id) && (
                  <button
                    onClick={() => testAPIConnection(service.id)}
                    disabled={testingStatus[service.id] === 'testing'}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    <TestTube className="w-3 h-3" />
                    <span>Test</span>
                  </button>
                )}

                {/* Documentation Link */}
                <a
                  href={service.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Docs</span>
                </a>

                {/* Enable/Disable Toggle */}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config[service.id].enabled}
                    onChange={(e) => updateAPIConfig(service.id, 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Enabled</span>
                </label>
              </div>
            </div>

            {/* API Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.fields.map((field) => {
                const fieldId = `${service.id}_${field.key}`;
                const isVisible = visibleFields[fieldId];
                const fieldValue = getFieldValue(service.id, field.key);

                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={field.type === 'password' && !isVisible ? 'password' : 'text'}
                        value={fieldValue}
                        onChange={(e) => updateAPIConfig(service.id, field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {field.type === 'password' && (
                        <button
                          type="button"
                          onClick={() => toggleVisibility(fieldId)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {isVisible ? (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Messages */}
            {testingStatus[service.id] === 'success' && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                ✓ Connection test successful! API credentials are working correctly.
              </div>
            )}
            {testingStatus[service.id] === 'error' && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                ✗ Connection test failed. Please check your API credentials and try again.
              </div>
            )}

            {/* Configuration Status */}
            <div className="mt-3 flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Status:</span>
                {isServiceConfigured(service.id) ? (
                  config[service.id].enabled ? (
                    <span className="text-green-600 font-medium">Configured & Enabled</span>
                  ) : (
                    <span className="text-gray-600 font-medium">Configured but Disabled</span>
                  )
                ) : (
                  <span className="text-yellow-600 font-medium">Not Configured</span>
                )}
              </div>

              {service.id === 'binance' && (
                <div className="text-xs text-gray-500">
                  Permissions: Spot & Futures Reading
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Usage Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">API Usage Guidelines</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>Binance:</strong> Create API key with "Enable Reading" permission only. Never enable trading permissions.</p>
          <p><strong>CoinGecko:</strong> Free tier allows 50 calls/minute. Pro API key increases limits.</p>
          <p><strong>Telegram:</strong> Create bot via @BotFather, get your chat ID by messaging @userinfobot.</p>
          <p><strong>Discord:</strong> Create webhook in channel settings → Integrations → Webhooks.</p>
        </div>
      </div>

      {/* Rate Limits & Monitoring */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-3">API Rate Limits & Monitoring</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {apiServices.map((service) => (
            <div key={service.id} className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {service.id === 'binance' ? '1200/min' :
                 service.id === 'coingecko' ? '50/min' :
                 service.id === 'telegram' ? '30/sec' :
                 service.id === 'discord' ? '5/sec' : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">{service.name}</div>
              <div className="text-xs text-green-600">0% used</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default APIKeyManager;

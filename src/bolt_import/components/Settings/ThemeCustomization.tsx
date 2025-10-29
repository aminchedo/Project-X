import React from 'react';
import { Palette, Sun, Moon, Monitor, Globe, Clock, BarChart3 } from 'lucide-react';

interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  chart_style: 'candlestick' | 'line' | 'area';
  refresh_interval: number;
}

interface ThemeCustomizationProps {
  config: UIConfig;
  onUpdate: (config: UIConfig) => void;
}

const ThemeCustomization: React.FC<ThemeCustomizationProps> = ({ config, onUpdate }) => {
  const themes = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Easy on the eyes for extended use' },
    { value: 'auto', label: 'Auto', icon: Monitor, description: 'Follow system preference' }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Seoul',
    'Australia/Sydney'
  ];

  const chartStyles = [
    { value: 'candlestick', label: 'Candlestick', description: 'Traditional OHLC candles' },
    { value: 'line', label: 'Line Chart', description: 'Simple price line' },
    { value: 'area', label: 'Area Chart', description: 'Filled area under price line' }
  ];

  const refreshIntervals = [
    { value: 1000, label: '1 second' },
    { value: 5000, label: '5 seconds' },
    { value: 10000, label: '10 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' }
  ];

  const updateConfig = (field: keyof UIConfig, value: any) => {
    const newConfig = {
      ...config,
      [field]: value
    };
    onUpdate(newConfig);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Palette className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">UI & Theme Customization</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Selection */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Theme</h3>
          
          <div className="space-y-3">
            {themes.map((theme) => {
              const Icon = theme.icon;
              return (
                <label
                  key={theme.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    config.theme === theme.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={theme.value}
                    checked={config.theme === theme.value}
                    onChange={(e) => updateConfig('theme', e.target.value as UIConfig['theme'])}
                    className="sr-only"
                  />
                  <Icon className={`w-5 h-5 mr-3 ${
                    config.theme === theme.value ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <div>
                    <div className={`font-medium ${
                      config.theme === theme.value ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {theme.label}
                    </div>
                    <div className={`text-sm ${
                      config.theme === theme.value ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {theme.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Theme Preview */}
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div className={`p-3 rounded ${
              config.theme === 'dark' ? 'bg-gray-800 text-white' :
              config.theme === 'light' ? 'bg-white text-gray-900 border border-gray-200' :
              'bg-gradient-to-r from-white to-gray-100 text-gray-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sample Dashboard</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Language & Localization */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Language & Localization</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Language
              </label>
              <select
                value={config.language}
                onChange={(e) => updateConfig('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Timezone
              </label>
              <select
                value={config.timezone}
                onChange={(e) => updateConfig('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz} ({new Date().toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' })})
                  </option>
                ))}
              </select>
            </div>

            {/* Date/Time Format Preview */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Format Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Date: {new Date().toLocaleDateString(config.language)}</div>
                <div>Time: {new Date().toLocaleTimeString(config.language, { timeZone: config.timezone })}</div>
                <div>Currency: {new Intl.NumberFormat(config.language, { 
                  style: 'currency', 
                  currency: 'USD' 
                }).format(50000)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Preferences */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Chart Preferences</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BarChart3 className="w-4 h-4 inline mr-1" />
                Default Chart Style
              </label>
              <div className="space-y-2">
                {chartStyles.map((style) => (
                  <label
                    key={style.value}
                    className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
                      config.chart_style === style.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="chart_style"
                      value={style.value}
                      checked={config.chart_style === style.value}
                      onChange={(e) => updateConfig('chart_style', e.target.value as UIConfig['chart_style'])}
                      className="sr-only"
                    />
                    <div>
                      <div className={`font-medium text-sm ${
                        config.chart_style === style.value ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {style.label}
                      </div>
                      <div className={`text-xs ${
                        config.chart_style === style.value ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {style.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Chart Color Scheme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chart Colors</label>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border border-gray-200 rounded text-center">
                  <div className="w-4 h-4 bg-green-500 mx-auto mb-1 rounded"></div>
                  <span className="text-xs text-gray-600">Bullish</span>
                </div>
                <div className="p-2 border border-gray-200 rounded text-center">
                  <div className="w-4 h-4 bg-red-500 mx-auto mb-1 rounded"></div>
                  <span className="text-xs text-gray-600">Bearish</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Refresh Interval
              </label>
              <select
                value={config.refresh_interval}
                onChange={(e) => updateConfig('refresh_interval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {refreshIntervals.map((interval) => (
                  <option key={interval.value} value={interval.value}>
                    {interval.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Faster intervals provide more real-time data but use more resources
              </p>
            </div>

            {/* Performance Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-700">Hardware Acceleration</span>
                  <p className="text-xs text-gray-500">Use GPU for chart rendering</p>
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
                  <span className="text-sm font-medium text-gray-700">Smooth Animations</span>
                  <p className="text-xs text-gray-500">Enable transitions and animations</p>
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
                  <span className="text-sm font-medium text-gray-700">Auto-save Layout</span>
                  <p className="text-xs text-gray-500">Remember window positions and sizes</p>
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
        </div>
      </div>

      {/* Accessibility Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Accessibility</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">High Contrast</span>
              <p className="text-xs text-gray-500">Increase color contrast</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Large Text</span>
              <p className="text-xs text-gray-500">Increase font sizes</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700">Reduce Motion</span>
              <p className="text-xs text-gray-500">Minimize animations</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Current Configuration</h4>
        <div className="text-sm text-blue-700 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="font-medium">Theme:</span>
            <div className="text-xs capitalize">{config.theme}</div>
          </div>
          <div>
            <span className="font-medium">Language:</span>
            <div className="text-xs">{languages.find(l => l.code === config.language)?.name}</div>
          </div>
          <div>
            <span className="font-medium">Chart Style:</span>
            <div className="text-xs capitalize">{config.chart_style}</div>
          </div>
          <div>
            <span className="font-medium">Refresh Rate:</span>
            <div className="text-xs">{refreshIntervals.find(r => r.value === config.refresh_interval)?.label}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomization;

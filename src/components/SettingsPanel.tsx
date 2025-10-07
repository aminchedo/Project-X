import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Eye, Save } from 'lucide-react';

interface SettingsPanelProps {
  onSave?: (settings: any) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSave }) => {
  const [settings, setSettings] = useState({
    notifications: {
      signals: true,
      trades: true,
      alerts: true,
      email: false
    },
    display: {
      theme: 'dark',
      animations: true,
      compactMode: false
    },
    trading: {
      confirmOrders: true,
      autoClose: false,
      defaultSize: 100
    }
  });

  const handleSave = () => {
    onSave?.(settings);
  };

  return (
    <motion.div
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Settings className="w-6 h-6 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-50">Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-slate-50">Notifications</h3>
          </div>

          <div className="space-y-3 ml-7">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, [key]: e.target.checked }
                  })}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Display */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-slate-50">Display</h3>
          </div>

          <div className="space-y-3 ml-7">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <label className="text-slate-300 mb-2 block">Theme</label>
              <select
                value={settings.display.theme}
                onChange={(e) => setSettings({
                  ...settings,
                  display: { ...settings.display, theme: e.target.value }
                })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            {Object.entries(settings.display).filter(([k]) => k !== 'theme').map(([key, value]) => (
              <label key={key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => setSettings({
                    ...settings,
                    display: { ...settings.display, [key]: e.target.checked }
                  })}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Trading */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-slate-50">Trading</h3>
          </div>

          <div className="space-y-3 ml-7">
            {Object.entries(settings.trading).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
                <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                {typeof value === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setSettings({
                      ...settings,
                      trading: { ...settings.trading, [key]: e.target.checked }
                    })}
                    className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                  />
                ) : (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setSettings({
                      ...settings,
                      trading: { ...settings.trading, [key]: parseInt(e.target.value) }
                    })}
                    className="w-24 px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:border-cyan-500 focus:outline-none"
                  />
                )}
              </label>
            ))}
          </div>
        </div>

        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </motion.button>
      </div>
    </motion.div>
  );
};

export default SettingsPanel;

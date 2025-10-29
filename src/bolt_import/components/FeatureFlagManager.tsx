import React, { useState } from 'react';
import { useFeatureFlag, FeatureFlag } from '../contexts/FeatureFlagContext';
import { Settings, Toggle, Eye, EyeOff, Filter, Search } from 'lucide-react';

export const FeatureFlagManager: React.FC = () => {
  const { 
    flags, 
    updateFlag, 
    getFlagsByCategory, 
    environment, 
    userGroups 
  } = useFeatureFlag();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FeatureFlag['category'] | 'all'>('all');
  const [showDisabled, setShowDisabled] = useState(true);

  const categories: FeatureFlag['category'][] = ['ui', 'functionality', 'ai', 'trading', 'analytics', 'experimental'];

  const filteredFlags = Object.values(flags).filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || flag.category === selectedCategory;
    const matchesVisibility = showDisabled || flag.enabled;
    
    return matchesSearch && matchesCategory && matchesVisibility;
  });

  const getCategoryColor = (category: FeatureFlag['category']) => {
    const colors = {
      ui: 'bg-blue-100 text-blue-800',
      functionality: 'bg-green-100 text-green-800',
      ai: 'bg-purple-100 text-purple-800',
      trading: 'bg-orange-100 text-orange-800',
      analytics: 'bg-cyan-100 text-cyan-800',
      experimental: 'bg-red-100 text-red-800',
    };
    return colors[category];
  };

  const getStatusColor = (flag: FeatureFlag) => {
    if (!flag.enabled) return 'text-gray-400';
    if (flag.rolloutPercentage && flag.rolloutPercentage < 100) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusText = (flag: FeatureFlag) => {
    if (!flag.enabled) return 'Disabled';
    if (flag.rolloutPercentage && flag.rolloutPercentage < 100) return `${flag.rolloutPercentage}% Rollout`;
    return 'Enabled';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Feature Flags"
      >
        <Settings size={20} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Settings className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">Feature Flags</h2>
            <div className="text-sm text-gray-400">
              Environment: {environment} | Groups: {userGroups.join(', ')}
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <EyeOff size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-800 space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as FeatureFlag['category'] | 'all')}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* Show Disabled Toggle */}
            <label className="flex items-center space-x-2 text-gray-300">
              <input
                type="checkbox"
                checked={showDisabled}
                onChange={(e) => setShowDisabled(e.target.checked)}
                className="rounded border-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Show Disabled</span>
            </label>
          </div>
        </div>

        {/* Flags List */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="space-y-4">
            {filteredFlags.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Filter size={48} className="mx-auto mb-4 opacity-50" />
                <p>No features match your filters</p>
              </div>
            ) : (
              filteredFlags.map(flag => (
                <div
                  key={flag.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{flag.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(flag.category)}`}>
                          {flag.category}
                        </span>
                        <span className={`text-sm font-medium ${getStatusColor(flag)}`}>
                          {getStatusText(flag)}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3">{flag.description}</p>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {flag.rolloutPercentage && (
                          <span>Rollout: {flag.rolloutPercentage}%</span>
                        )}
                        {flag.userGroups && flag.userGroups.length > 0 && (
                          <span>Groups: {flag.userGroups.join(', ')}</span>
                        )}
                        {flag.environment && (
                          <span>Environment: {flag.environment}</span>
                        )}
                        {flag.dependencies && flag.dependencies.length > 0 && (
                          <span>Dependencies: {flag.dependencies.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={flag.enabled}
                          onChange={(e) => updateFlag(flag.id, e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                            flag.enabled ? 'bg-blue-600' : 'bg-gray-600'
                          }`}
                          onClick={() => updateFlag(flag.id, !flag.enabled)}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              flag.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div>
              Showing {filteredFlags.length} of {Object.keys(flags).length} features
            </div>
            <div className="flex items-center space-x-4">
              <span>Changes are saved automatically</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
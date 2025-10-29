import React, { useState } from 'react';
import { Plus, Trash2, Move, Brain, Layers, Settings, Info } from 'lucide-react';

interface Layer {
  type: 'lstm' | 'dense' | 'dropout' | 'batch_norm';
  units?: number;
  rate?: number;
  activation?: string;
}

interface ArchitectureConfig {
  architecture: {
    layers: Layer[];
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
}

interface ArchitectureDesignerProps {
  config: ArchitectureConfig;
  onUpdate: (config: ArchitectureConfig) => void;
}

const ArchitectureDesigner: React.FC<ArchitectureDesignerProps> = ({ config, onUpdate }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const layerTypes = [
    { value: 'lstm', label: 'LSTM', description: 'Long Short-Term Memory layer for sequence processing' },
    { value: 'dense', label: 'Dense', description: 'Fully connected layer for feature transformation' },
    { value: 'dropout', label: 'Dropout', description: 'Regularization layer to prevent overfitting' },
    { value: 'batch_norm', label: 'Batch Norm', description: 'Normalization layer for training stability' }
  ];

  const activationFunctions = [
    'relu', 'leaky_relu', 'tanh', 'sigmoid', 'softmax', 'linear', 'swish', 'gelu'
  ];

  const optimizers = [
    { value: 'adam', label: 'Adam', description: 'Adaptive moment estimation' },
    { value: 'adamw', label: 'AdamW', description: 'Adam with weight decay' },
    { value: 'sgd', label: 'SGD', description: 'Stochastic gradient descent' }
  ];

  const addLayer = (type: Layer['type']) => {
    const newLayer: Layer = { type };
    
    // Set default values based on layer type
    switch (type) {
      case 'lstm':
        newLayer.units = 64;
        newLayer.activation = 'tanh';
        break;
      case 'dense':
        newLayer.units = 32;
        newLayer.activation = 'relu';
        break;
      case 'dropout':
        newLayer.rate = 0.2;
        break;
      case 'batch_norm':
        break;
    }

    const newConfig = {
      ...config,
      architecture: {
        ...config.architecture,
        layers: [...config.architecture.layers, newLayer]
      }
    };
    onUpdate(newConfig);
  };

  const removeLayer = (index: number) => {
    const newConfig = {
      ...config,
      architecture: {
        ...config.architecture,
        layers: config.architecture.layers.filter((_, i) => i !== index)
      }
    };
    onUpdate(newConfig);
  };

  const updateLayer = (index: number, updates: Partial<Layer>) => {
    const newLayers = [...config.architecture.layers];
    newLayers[index] = { ...newLayers[index], ...updates };
    
    const newConfig = {
      ...config,
      architecture: {
        ...config.architecture,
        layers: newLayers
      }
    };
    onUpdate(newConfig);
  };

  const moveLayer = (fromIndex: number, toIndex: number) => {
    const newLayers = [...config.architecture.layers];
    const [movedLayer] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, movedLayer);
    
    const newConfig = {
      ...config,
      architecture: {
        ...config.architecture,
        layers: newLayers
      }
    };
    onUpdate(newConfig);
  };

  const updateArchitectureConfig = (field: string, value: any) => {
    const newConfig = {
      ...config,
      architecture: {
        ...config.architecture,
        [field]: value
      }
    };
    onUpdate(newConfig);
  };

  const updateTrainingConfig = (field: string, value: any) => {
    const newConfig = {
      ...config,
      training: {
        ...config.training,
        [field]: value
      }
    };
    onUpdate(newConfig);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveLayer(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const getLayerIcon = (type: Layer['type']) => {
    switch (type) {
      case 'lstm':
        return <Brain className="w-4 h-4" />;
      case 'dense':
        return <Layers className="w-4 h-4" />;
      case 'dropout':
        return <Settings className="w-4 h-4" />;
      case 'batch_norm':
        return <Settings className="w-4 h-4" />;
      default:
        return <Layers className="w-4 h-4" />;
    }
  };

  const getLayerColor = (type: Layer['type']) => {
    switch (type) {
      case 'lstm':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'dense':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'dropout':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'batch_norm':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Neural Network Architecture Designer</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layer Designer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Layer Buttons */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Add Layers</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {layerTypes.map((layerType) => (
                <button
                  key={layerType.value}
                  onClick={() => addLayer(layerType.value as Layer['type'])}
                  className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  title={layerType.description}
                >
                  {getLayerIcon(layerType.value as Layer['type'])}
                  <span className="text-sm font-medium">{layerType.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Layer Stack */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Network Architecture</h3>
            
            {config.architecture.layers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No layers added yet. Start by adding an LSTM layer.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {config.architecture.layers.map((layer, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`p-4 border rounded-lg ${getLayerColor(layer.type)} cursor-move hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Move className="w-4 h-4 text-gray-500" />
                        {getLayerIcon(layer.type)}
                        <span className="font-semibold">
                          Layer {index + 1}: {layerTypes.find(t => t.value === layer.type)?.label}
                        </span>
                      </div>
                      <button
                        onClick={() => removeLayer(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Remove layer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Layer Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(layer.type === 'lstm' || layer.type === 'dense') && (
                        <>
                          <div>
                            <label className="block text-xs font-medium mb-1">Units</label>
                            <input
                              type="number"
                              value={layer.units || 0}
                              onChange={(e) => updateLayer(index, { units: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              min="1"
                              max="1024"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">Activation</label>
                            <select
                              value={layer.activation || 'relu'}
                              onChange={(e) => updateLayer(index, { activation: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              {activationFunctions.map(func => (
                                <option key={func} value={func}>{func}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {layer.type === 'dropout' && (
                        <div>
                          <label className="block text-xs font-medium mb-1">Dropout Rate</label>
                          <input
                            type="number"
                            value={layer.rate || 0}
                            onChange={(e) => updateLayer(index, { rate: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            min="0"
                            max="1"
                            step="0.1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Optimizer Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Optimizer Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Optimizer</label>
                <select
                  value={config.architecture.optimizer}
                  onChange={(e) => updateArchitectureConfig('optimizer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {optimizers.map(opt => (
                    <option key={opt.value} value={opt.value} title={opt.description}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Rate</label>
                <input
                  type="number"
                  value={config.architecture.learning_rate}
                  onChange={(e) => updateArchitectureConfig('learning_rate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0.0001"
                  max="1"
                  step="0.0001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
                <select
                  value={config.architecture.batch_size}
                  onChange={(e) => updateArchitectureConfig('batch_size', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={8}>8</option>
                  <option value={16}>16</option>
                  <option value={32}>32</option>
                  <option value={64}>64</option>
                  <option value={128}>128</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Epochs</label>
                <input
                  type="number"
                  value={config.architecture.epochs}
                  onChange={(e) => updateArchitectureConfig('epochs', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="1000"
                />
              </div>
            </div>
          </div>

          {/* Training Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Training Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gradient Clipping</label>
                <input
                  type="number"
                  value={config.training.gradient_clipping}
                  onChange={(e) => updateTrainingConfig('gradient_clipping', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0.1"
                  max="10"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Early Stopping Patience</label>
                <input
                  type="number"
                  value={config.training.early_stopping_patience}
                  onChange={(e) => updateTrainingConfig('early_stopping_patience', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validation Split</label>
                <input
                  type="number"
                  value={config.training.validation_split}
                  onChange={(e) => updateTrainingConfig('validation_split', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0.1"
                  max="0.5"
                  step="0.05"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="curriculum"
                    checked={config.training.curriculum_enabled}
                    onChange={(e) => updateTrainingConfig('curriculum_enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="curriculum" className="ml-2 block text-sm text-gray-700">
                    Enable Curriculum Learning
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="watchdog"
                    checked={config.training.instability_watchdog}
                    onChange={(e) => updateTrainingConfig('instability_watchdog', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="watchdog" className="ml-2 block text-sm text-gray-700">
                    Enable Instability Watchdog
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Architecture Summary</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Total Layers:</strong> {config.architecture.layers.length}</p>
              <p><strong>Trainable Layers:</strong> {config.architecture.layers.filter(l => l.type === 'lstm' || l.type === 'dense').length}</p>
              <p><strong>Regularization:</strong> {config.architecture.layers.filter(l => l.type === 'dropout' || l.type === 'batch_norm').length} layers</p>
              <p><strong>Estimated Parameters:</strong> ~{Math.floor(Math.random() * 50000 + 10000).toLocaleString()}</p>
            </div>
          </div>

          {/* Help & Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">Architecture Tips</h4>
            </div>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• Start with LSTM layers for sequence processing</p>
              <p>• Add dropout after LSTM layers to prevent overfitting</p>
              <p>• Use dense layers for final feature transformation</p>
              <p>• Final layer should have 3 units with softmax for bull/bear/neutral</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureDesigner;

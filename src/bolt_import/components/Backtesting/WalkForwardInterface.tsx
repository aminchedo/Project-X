import React, { useState } from 'react';
import { Play, Settings, Calendar, DollarSign, Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface WalkForwardConfig {
  start_date: string;
  end_date: string;
  initial_capital: number;
  symbols: string[];
  timeframe: string;
  walk_forward: {
    enabled: boolean;
    train_period: number;
    test_period: number;
    step_size: number;
  };
  strategy: {
    name: string;
    parameters: Record<string, any>;
  };
}

interface WalkForwardInterfaceProps {
  onStartBacktest: (config: WalkForwardConfig) => void;
  runningBacktest: string | null;
}

const WalkForwardInterface: React.FC<WalkForwardInterfaceProps> = ({ 
  onStartBacktest, 
  runningBacktest 
}) => {
  const [config, setConfig] = useState<WalkForwardConfig>({
    start_date: '2023-01-01',
    end_date: '2024-01-01',
    initial_capital: 100000,
    symbols: ['BTCUSDT', 'ETHUSDT'],
    timeframe: '1h',
    walk_forward: {
      enabled: true,
      train_period: 180, // days
      test_period: 30,   // days
      step_size: 7      // days
    },
    strategy: {
      name: 'AI Neural Strategy',
      parameters: {
        confidence_threshold: 0.7,
        risk_per_trade: 0.02,
        max_positions: 3,
        stop_loss: 0.05,
        take_profit: 0.15
      }
    }
  });

  const [advancedMode, setAdvancedMode] = useState(false);

  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' }
  ];

  const symbols = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
    'MATICUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'XRPUSDT'
  ];

  const strategies = [
    {
      name: 'AI Neural Strategy',
      description: 'Bull/Bear prediction with uncertainty quantification',
      parameters: {
        confidence_threshold: 0.7,
        risk_per_trade: 0.02,
        max_positions: 3,
        stop_loss: 0.05,
        take_profit: 0.15
      }
    },
    {
      name: 'Momentum Strategy',
      description: 'Price momentum with RSI confirmation',
      parameters: {
        rsi_period: 14,
        rsi_oversold: 30,
        rsi_overbought: 70,
        momentum_period: 10,
        risk_per_trade: 0.025
      }
    },
    {
      name: 'Mean Reversion',
      description: 'Bollinger Bands mean reversion strategy',
      parameters: {
        bb_period: 20,
        bb_std: 2,
        rsi_period: 14,
        risk_per_trade: 0.015
      }
    }
  ];

  const updateConfig = (field: string, value: any) => {
    const keys = field.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const updateStrategyParameter = (param: string, value: any) => {
    const newConfig = {
      ...config,
      strategy: {
        ...config.strategy,
        parameters: {
          ...config.strategy.parameters,
          [param]: value
        }
      }
    };
    setConfig(newConfig);
  };

  const calculateWalkForwardInfo = () => {
    const startDate = new Date(config.start_date);
    const endDate = new Date(config.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const trainPeriod = config.walk_forward.train_period;
    const testPeriod = config.walk_forward.test_period;
    const stepSize = config.walk_forward.step_size;
    
    const totalPeriod = trainPeriod + testPeriod;
    const numSteps = Math.floor((totalDays - totalPeriod) / stepSize) + 1;
    
    return {
      totalDays,
      numSteps,
      totalPeriod,
      trainPeriod,
      testPeriod,
      stepSize
    };
  };

  const handleStartBacktest = () => {
    if (!config.walk_forward.enabled) {
      // Regular backtest
      const regularConfig = {
        ...config,
        walk_forward: {
          enabled: false,
          train_period: 0,
          test_period: 0,
          step_size: 0
        }
      };
      onStartBacktest(regularConfig);
    } else {
      onStartBacktest(config);
    }
  };

  const walkForwardInfo = calculateWalkForwardInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Walk-Forward Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Configuration */}
        <div className="space-y-6">
          {/* Time Period */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Time Period
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={config.start_date}
                  onChange={(e) => updateConfig('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={config.end_date}
                  onChange={(e) => updateConfig('end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Total Period:</span>
                  <span className="font-medium">{walkForwardInfo.totalDays} days</span>
                </div>
                {config.walk_forward.enabled && (
                  <>
                    <div className="flex justify-between">
                      <span>Walk-Forward Steps:</span>
                      <span className="font-medium">{walkForwardInfo.numSteps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Period per Step:</span>
                      <span className="font-medium">{walkForwardInfo.totalPeriod} days</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Capital & Symbols */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Capital & Symbols
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Capital
                </label>
                <input
                  type="number"
                  value={config.initial_capital}
                  onChange={(e) => updateConfig('initial_capital', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1000"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbols
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {symbols.map((symbol) => (
                    <label key={symbol} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.symbols.includes(symbol)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateConfig('symbols', [...config.symbols, symbol]);
                          } else {
                            updateConfig('symbols', config.symbols.filter(s => s !== symbol));
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{symbol}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeframe
                </label>
                <select
                  value={config.timeframe}
                  onChange={(e) => updateConfig('timeframe', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {timeframes.map((tf) => (
                    <option key={tf.value} value={tf.value}>
                      {tf.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Walk-Forward Configuration */}
        <div className="space-y-6">
          {/* Walk-Forward Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Walk-Forward Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="walk_forward_enabled"
                  checked={config.walk_forward.enabled}
                  onChange={(e) => updateConfig('walk_forward.enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="walk_forward_enabled" className="ml-2 block text-sm text-gray-700">
                  Enable Walk-Forward Analysis
                </label>
              </div>

              {config.walk_forward.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Training Period (Days)
                    </label>
                    <input
                      type="number"
                      value={config.walk_forward.train_period}
                      onChange={(e) => updateConfig('walk_forward.train_period', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="30"
                      max="365"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Testing Period (Days)
                    </label>
                    <input
                      type="number"
                      value={config.walk_forward.test_period}
                      onChange={(e) => updateConfig('walk_forward.test_period', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="7"
                      max="90"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Size (Days)
                    </label>
                    <input
                      type="number"
                      value={config.walk_forward.step_size}
                      onChange={(e) => updateConfig('walk_forward.step_size', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="30"
                    />
                  </div>
                </>
              )}
            </div>

            {config.walk_forward.enabled && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700">
                  <div className="font-medium mb-1">Walk-Forward Analysis Preview:</div>
                  <div className="space-y-1">
                    <div>• {walkForwardInfo.numSteps} training/testing cycles</div>
                    <div>• {walkForwardInfo.trainPeriod} days training per cycle</div>
                    <div>• {walkForwardInfo.testPeriod} days testing per cycle</div>
                    <div>• {walkForwardInfo.stepSize} days step size between cycles</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Strategy Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Strategy Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy
                </label>
                <select
                  value={config.strategy.name}
                  onChange={(e) => {
                    const strategy = strategies.find(s => s.name === e.target.value);
                    if (strategy) {
                      updateConfig('strategy', {
                        name: strategy.name,
                        parameters: strategy.parameters
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {strategies.map((strategy) => (
                    <option key={strategy.name} value={strategy.name}>
                      {strategy.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {strategies.find(s => s.name === config.strategy.name)?.description}
                </p>
              </div>

              {/* Strategy Parameters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy Parameters
                </label>
                <div className="space-y-2">
                  {Object.entries(config.strategy.parameters).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600 w-32 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => updateStrategyParameter(key, parseFloat(e.target.value) || 0)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setAdvancedMode(!advancedMode)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>{advancedMode ? 'Hide' : 'Show'} Advanced Settings</span>
        </button>

        {/* Start Backtest Button */}
        <button
          onClick={handleStartBacktest}
          disabled={runningBacktest !== null || config.symbols.length === 0}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            runningBacktest !== null || config.symbols.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>
            {runningBacktest ? 'Backtest Running...' : 'Start Backtest'}
          </span>
        </button>
      </div>

      {/* Advanced Settings */}
      {advancedMode && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Advanced Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Rate (%)
              </label>
              <input
                type="number"
                defaultValue="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                max="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slippage (%)
              </label>
              <input
                type="number"
                defaultValue="0.05"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
                max="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Drawdown (%)
              </label>
              <input
                type="number"
                defaultValue="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                step="1"
                min="5"
                max="50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <h4 className="font-medium text-yellow-800">Important Notes</h4>
        </div>
        <div className="text-sm text-yellow-700 mt-2 space-y-1">
          <p>• Walk-forward analysis provides more realistic performance estimates than traditional backtesting</p>
          <p>• Training periods should be long enough to capture various market conditions</p>
          <p>• Testing periods should be representative of typical holding periods</p>
          <p>• Results may vary significantly from live trading due to market impact and execution delays</p>
        </div>
      </div>
    </div>
  );
};

export default WalkForwardInterface;

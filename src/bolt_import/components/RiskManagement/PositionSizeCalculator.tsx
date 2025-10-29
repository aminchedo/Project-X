import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Percent, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface PositionSizeResult {
  kelly_size: number;
  fixed_fraction_size: number;
  volatility_adjusted_size: number;
  recommended_size: number;
  max_loss: number;
  risk_reward_ratio: number;
  win_rate_required: number;
}

interface CalculatorInputs {
  account_balance: number;
  win_rate: number;
  avg_win: number;
  avg_loss: number;
  risk_per_trade: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  volatility: number;
}

const PositionSizeCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    account_balance: 10000,
    win_rate: 0.65,
    avg_win: 0.08,
    avg_loss: 0.04,
    risk_per_trade: 0.02,
    entry_price: 50000,
    stop_loss: 48000,
    take_profit: 54000,
    volatility: 0.25
  });

  const [results, setResults] = useState<PositionSizeResult | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<'kelly' | 'fixed' | 'volatility' | 'recommended'>('recommended');

  useEffect(() => {
    calculatePositionSize();
  }, [inputs]);

  const calculatePositionSize = () => {
    const {
      account_balance,
      win_rate,
      avg_win,
      avg_loss,
      risk_per_trade,
      entry_price,
      stop_loss,
      take_profit,
      volatility
    } = inputs;

    // Kelly Criterion: f = (bp - q) / b
    // where b = avg_win/avg_loss, p = win_rate, q = 1 - win_rate
    const b = avg_win / avg_loss;
    const p = win_rate;
    const q = 1 - win_rate;
    const kelly_fraction = (b * p - q) / b;
    const kelly_size = Math.max(0, Math.min(0.25, kelly_fraction)) * account_balance; // Cap at 25%

    // Fixed Fraction (Risk per trade)
    const risk_amount = account_balance * risk_per_trade;
    const price_risk = Math.abs(entry_price - stop_loss) / entry_price;
    const fixed_fraction_size = risk_amount / price_risk;

    // Volatility Adjusted
    const base_size = account_balance * 0.1; // 10% base allocation
    const volatility_multiplier = Math.max(0.5, Math.min(2.0, 1 / volatility)); // Inverse relationship
    const volatility_adjusted_size = base_size * volatility_multiplier;

    // Recommended (Hybrid approach)
    const sizes = [kelly_size, fixed_fraction_size, volatility_adjusted_size];
    const recommended_size = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;

    // Additional metrics
    const max_loss = (Math.abs(entry_price - stop_loss) / entry_price) * recommended_size;
    const potential_profit = (Math.abs(take_profit - entry_price) / entry_price) * recommended_size;
    const risk_reward_ratio = potential_profit / max_loss;
    
    // Required win rate for breakeven
    const win_rate_required = avg_loss / (avg_win + avg_loss);

    setResults({
      kelly_size,
      fixed_fraction_size,
      volatility_adjusted_size,
      recommended_size,
      max_loss,
      risk_reward_ratio,
      win_rate_required
    });
  };

  const handleInputChange = (field: keyof CalculatorInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number, decimals: number = 2) => {
    return `${(value * 100).toFixed(decimals)}%`;
  };

  const getSelectedSize = () => {
    if (!results) return 0;
    
    switch (calculationMethod) {
      case 'kelly':
        return results.kelly_size;
      case 'fixed':
        return results.fixed_fraction_size;
      case 'volatility':
        return results.volatility_adjusted_size;
      default:
        return results.recommended_size;
    }
  };

  const getRiskLevel = (riskRatio: number) => {
    if (riskRatio > inputs.account_balance * 0.05) return { level: 'High', color: 'text-red-600' };
    if (riskRatio > inputs.account_balance * 0.02) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Calculator className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Position Size Calculator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Input Parameters</h3>
          
          <div className="space-y-4">
            {/* Account Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Balance
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={inputs.account_balance}
                  onChange={(e) => handleInputChange('account_balance', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10000"
                />
              </div>
            </div>

            {/* Win Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Historical Win Rate
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={inputs.win_rate * 100}
                  onChange={(e) => handleInputChange('win_rate', (parseFloat(e.target.value) || 0) / 100)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="65"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            {/* Average Win/Loss */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avg Win %
                </label>
                <input
                  type="number"
                  value={inputs.avg_win * 100}
                  onChange={(e) => handleInputChange('avg_win', (parseFloat(e.target.value) || 0) / 100)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avg Loss %
                </label>
                <input
                  type="number"
                  value={inputs.avg_loss * 100}
                  onChange={(e) => handleInputChange('avg_loss', (parseFloat(e.target.value) || 0) / 100)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="4"
                  step="0.1"
                />
              </div>
            </div>

            {/* Risk Per Trade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Per Trade (% of Account)
              </label>
              <input
                type="number"
                value={inputs.risk_per_trade * 100}
                onChange={(e) => handleInputChange('risk_per_trade', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2"
                min="0.1"
                max="10"
                step="0.1"
              />
            </div>

            {/* Trade Parameters */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Price
                </label>
                <input
                  type="number"
                  value={inputs.entry_price}
                  onChange={(e) => handleInputChange('entry_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stop Loss
                </label>
                <input
                  type="number"
                  value={inputs.stop_loss}
                  onChange={(e) => handleInputChange('stop_loss', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="48000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Take Profit
                </label>
                <input
                  type="number"
                  value={inputs.take_profit}
                  onChange={(e) => handleInputChange('take_profit', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="54000"
                />
              </div>
            </div>

            {/* Volatility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Volatility (Annualized)
              </label>
              <input
                type="number"
                value={inputs.volatility * 100}
                onChange={(e) => handleInputChange('volatility', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="25"
                min="5"
                max="200"
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Position Size Results</h3>
          
          {results && (
            <div className="space-y-4">
              {/* Calculation Method Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculation Method
                </label>
                <select
                  value={calculationMethod}
                  onChange={(e) => setCalculationMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recommended">Recommended (Hybrid)</option>
                  <option value="kelly">Kelly Criterion</option>
                  <option value="fixed">Fixed Fraction</option>
                  <option value="volatility">Volatility Adjusted</option>
                </select>
              </div>

              {/* Selected Position Size */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Recommended Position Size</span>
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(getSelectedSize())}
                </div>
                <div className="text-sm text-blue-600">
                  {formatPercentage(getSelectedSize() / inputs.account_balance)} of account
                </div>
              </div>

              {/* All Methods Comparison */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Method Comparison</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Kelly Criterion</span>
                    <span className="font-semibold">{formatCurrency(results.kelly_size)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Fixed Fraction</span>
                    <span className="font-semibold">{formatCurrency(results.fixed_fraction_size)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Volatility Adjusted</span>
                    <span className="font-semibold">{formatCurrency(results.volatility_adjusted_size)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                    <span className="text-sm font-medium text-blue-700">Recommended</span>
                    <span className="font-bold text-blue-900">{formatCurrency(results.recommended_size)}</span>
                  </div>
                </div>
              </div>

              {/* Risk Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Risk Analysis</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <div className="text-xs text-red-600 mb-1">Maximum Loss</div>
                    <div className="font-bold text-red-700">
                      {formatCurrency(results.max_loss)}
                    </div>
                    <div className="text-xs text-red-600">
                      {formatPercentage(results.max_loss / inputs.account_balance)} of account
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="text-xs text-green-600 mb-1">Risk/Reward Ratio</div>
                    <div className="font-bold text-green-700">
                      1:{results.risk_reward_ratio.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-600">
                      {results.risk_reward_ratio >= 2 ? 'Excellent' : 
                       results.risk_reward_ratio >= 1.5 ? 'Good' : 'Poor'}
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="text-xs text-yellow-600 mb-1">Required Win Rate for Breakeven</div>
                  <div className="font-bold text-yellow-700">
                    {formatPercentage(results.win_rate_required)}
                  </div>
                  <div className="text-xs text-yellow-600">
                    Current: {formatPercentage(inputs.win_rate)} 
                    {inputs.win_rate > results.win_rate_required ? ' ✓' : ' ⚠️'}
                  </div>
                </div>
              </div>

              {/* Risk Level Warning */}
              <div className={`p-3 rounded-lg border ${
                getRiskLevel(results.max_loss).level === 'High' ? 'bg-red-50 border-red-200' :
                getRiskLevel(results.max_loss).level === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`w-4 h-4 ${getRiskLevel(results.max_loss).color}`} />
                  <span className={`font-medium ${getRiskLevel(results.max_loss).color}`}>
                    {getRiskLevel(results.max_loss).level} Risk Level
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {getRiskLevel(results.max_loss).level === 'High' && 
                    'Consider reducing position size to manage risk'}
                  {getRiskLevel(results.max_loss).level === 'Medium' && 
                    'Moderate risk - ensure proper risk management'}
                  {getRiskLevel(results.max_loss).level === 'Low' && 
                    'Conservative position size with manageable risk'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Educational Notes */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">Position Sizing Methods Explained</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Kelly Criterion:</strong> Optimal fraction based on win rate and average win/loss ratio</p>
          <p><strong>Fixed Fraction:</strong> Risk a fixed percentage of account balance per trade</p>
          <p><strong>Volatility Adjusted:</strong> Adjust position size based on asset volatility</p>
          <p><strong>Recommended:</strong> Hybrid approach combining all methods for balanced risk management</p>
        </div>
      </div>
    </div>
  );
};

export default PositionSizeCalculator;

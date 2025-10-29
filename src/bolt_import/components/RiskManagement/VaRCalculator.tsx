import React, { useState, useEffect } from 'react';
import { TrendingDown, BarChart3, AlertTriangle, Calendar, Percent } from 'lucide-react';

interface VaRResult {
  var_95: number;
  var_99: number;
  cvar_95: number;
  cvar_99: number;
  portfolio_value: number;
  var_dollar_95: number;
  var_dollar_99: number;
  cvar_dollar_95: number;
  cvar_dollar_99: number;
  confidence_interval: [number, number];
  method: string;
}

interface HistoricalData {
  date: string;
  return: number;
  portfolio_value: number;
}

const VaRCalculator: React.FC = () => {
  const [portfolioValue, setPortfolioValue] = useState<number>(100000);
  const [timeHorizon, setTimeHorizon] = useState<number>(1);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [method, setMethod] = useState<'historical' | 'parametric' | 'monte_carlo'>('historical');
  const [results, setResults] = useState<VaRResult | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  useEffect(() => {
    if (historicalData.length > 0) {
      calculateVaR();
    }
  }, [portfolioValue, timeHorizon, confidenceLevel, method, historicalData]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/risk/historical-returns');
      if (response.ok) {
        const data = await response.json();
        setHistoricalData(data);
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      // Generate mock data for demonstration
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    const mockData: HistoricalData[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 252); // 1 year of trading days

    for (let i = 0; i < 252; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Generate realistic crypto returns (higher volatility)
      const dailyReturn = (Math.random() - 0.5) * 0.08 + 0.0003; // ~3% annual drift, ~40% annual vol
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        return: dailyReturn,
        portfolio_value: portfolioValue * (1 + dailyReturn)
      });
    }
    
    setHistoricalData(mockData);
  };

  const calculateVaR = () => {
    if (historicalData.length === 0) return;

    const returns = historicalData.map(d => d.return);
    const scaledReturns = returns.map(r => r * Math.sqrt(timeHorizon)); // Scale for time horizon

    let var_95: number, var_99: number, cvar_95: number, cvar_99: number;

    switch (method) {
      case 'historical':
        ({ var_95, var_99, cvar_95, cvar_99 } = calculateHistoricalVaR(scaledReturns));
        break;
      case 'parametric':
        ({ var_95, var_99, cvar_95, cvar_99 } = calculateParametricVaR(scaledReturns));
        break;
      case 'monte_carlo':
        ({ var_95, var_99, cvar_95, cvar_99 } = calculateMonteCarloVaR(scaledReturns));
        break;
      default:
        ({ var_95, var_99, cvar_95, cvar_99 } = calculateHistoricalVaR(scaledReturns));
    }

    // Calculate confidence intervals (simplified)
    const std = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - returns.reduce((s, x) => s + x, 0) / returns.length, 2), 0) / returns.length);
    const confidence_interval: [number, number] = [var_95 - 1.96 * std, var_95 + 1.96 * std];

    setResults({
      var_95: Math.abs(var_95),
      var_99: Math.abs(var_99),
      cvar_95: Math.abs(cvar_95),
      cvar_99: Math.abs(cvar_99),
      portfolio_value: portfolioValue,
      var_dollar_95: Math.abs(var_95) * portfolioValue,
      var_dollar_99: Math.abs(var_99) * portfolioValue,
      cvar_dollar_95: Math.abs(cvar_95) * portfolioValue,
      cvar_dollar_99: Math.abs(cvar_99) * portfolioValue,
      confidence_interval,
      method
    });
  };

  const calculateHistoricalVaR = (returns: number[]) => {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    const var_95 = sortedReturns[Math.floor(sortedReturns.length * 0.05)];
    const var_99 = sortedReturns[Math.floor(sortedReturns.length * 0.01)];
    
    // CVaR (Expected Shortfall)
    const tailReturns_95 = sortedReturns.slice(0, Math.floor(sortedReturns.length * 0.05));
    const tailReturns_99 = sortedReturns.slice(0, Math.floor(sortedReturns.length * 0.01));
    
    const cvar_95 = tailReturns_95.reduce((sum, r) => sum + r, 0) / tailReturns_95.length;
    const cvar_99 = tailReturns_99.reduce((sum, r) => sum + r, 0) / tailReturns_99.length;
    
    return { var_95, var_99, cvar_95, cvar_99 };
  };

  const calculateParametricVaR = (returns: number[]) => {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const std = Math.sqrt(variance);
    
    // Assuming normal distribution
    const z_95 = 1.645; // 95th percentile
    const z_99 = 2.326; // 99th percentile
    
    const var_95 = mean - z_95 * std;
    const var_99 = mean - z_99 * std;
    
    // CVaR for normal distribution
    const phi_95 = Math.exp(-0.5 * z_95 * z_95) / Math.sqrt(2 * Math.PI);
    const phi_99 = Math.exp(-0.5 * z_99 * z_99) / Math.sqrt(2 * Math.PI);
    
    const cvar_95 = mean - std * phi_95 / 0.05;
    const cvar_99 = mean - std * phi_99 / 0.01;
    
    return { var_95, var_99, cvar_95, cvar_99 };
  };

  const calculateMonteCarloVaR = (returns: number[]) => {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const std = Math.sqrt(variance);
    
    // Generate 10,000 random scenarios
    const scenarios: number[] = [];
    for (let i = 0; i < 10000; i++) {
      // Box-Muller transformation for normal random numbers
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      scenarios.push(mean + std * z);
    }
    
    const sortedScenarios = scenarios.sort((a, b) => a - b);
    
    const var_95 = sortedScenarios[Math.floor(sortedScenarios.length * 0.05)];
    const var_99 = sortedScenarios[Math.floor(sortedScenarios.length * 0.01)];
    
    const tailScenarios_95 = sortedScenarios.slice(0, Math.floor(sortedScenarios.length * 0.05));
    const tailScenarios_99 = sortedScenarios.slice(0, Math.floor(sortedScenarios.length * 0.01));
    
    const cvar_95 = tailScenarios_95.reduce((sum, r) => sum + r, 0) / tailScenarios_95.length;
    const cvar_99 = tailScenarios_99.reduce((sum, r) => sum + r, 0) / tailScenarios_99.length;
    
    return { var_95, var_99, cvar_95, cvar_99 };
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

  const getRiskLevel = (varPercent: number) => {
    if (varPercent > 0.1) return { level: 'Extreme', color: 'text-red-600 bg-red-50' };
    if (varPercent > 0.05) return { level: 'High', color: 'text-red-600 bg-red-50' };
    if (varPercent > 0.02) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-50' };
    return { level: 'Low', color: 'text-green-600 bg-green-50' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingDown className="w-6 h-6 text-red-600" />
        <h2 className="text-2xl font-bold text-gray-900">Value at Risk (VaR) Analysis</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Parameters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Parameters</h3>
          
          <div className="space-y-4">
            {/* Portfolio Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio Value
              </label>
              <input
                type="number"
                value={portfolioValue}
                onChange={(e) => setPortfolioValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100000"
              />
            </div>

            {/* Time Horizon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Horizon (Days)
              </label>
              <select
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 Day</option>
                <option value={5}>1 Week (5 days)</option>
                <option value={10}>10 Days</option>
                <option value={22}>1 Month (22 days)</option>
                <option value={66}>3 Months (66 days)</option>
              </select>
            </div>

            {/* Confidence Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidence Level
              </label>
              <select
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={90}>90%</option>
                <option value={95}>95%</option>
                <option value={99}>99%</option>
              </select>
            </div>

            {/* Calculation Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calculation Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="historical">Historical Simulation</option>
                <option value="parametric">Parametric (Normal)</option>
                <option value="monte_carlo">Monte Carlo</option>
              </select>
            </div>

            {/* Data Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">
                <div className="flex items-center space-x-1 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>Historical Data: {historicalData.length} days</span>
                </div>
                <div>Method: {method.replace('_', ' ').toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* VaR Results */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">VaR Results</h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : results ? (
            <div className="space-y-6">
              {/* Main VaR Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">VaR (95%)</span>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {formatCurrency(results.var_dollar_95)}
                  </div>
                  <div className="text-sm text-red-600">
                    {formatPercentage(results.var_95)} of portfolio
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">CVaR (95%)</span>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {formatCurrency(results.cvar_dollar_95)}
                  </div>
                  <div className="text-sm text-red-600">
                    Expected loss if VaR exceeded
                  </div>
                </div>
              </div>

              {/* Detailed Results Table */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Detailed Results</h4>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Confidence Level
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VaR (%)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VaR ($)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CVaR (%)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CVaR ($)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">95%</td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {formatPercentage(results.var_95)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {formatCurrency(results.var_dollar_95)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {formatPercentage(results.cvar_95)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {formatCurrency(results.cvar_dollar_95)}
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">99%</td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {formatPercentage(results.var_99)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {formatCurrency(results.var_dollar_99)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {formatPercentage(results.cvar_99)}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                          {formatCurrency(results.cvar_dollar_99)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-lg p-4 border ${getRiskLevel(results.var_95).color}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">Risk Level</span>
                  </div>
                  <div className="text-lg font-bold">
                    {getRiskLevel(results.var_95).level}
                  </div>
                  <div className="text-xs opacity-75">
                    Based on 95% VaR
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-700">Time Horizon</span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {timeHorizon} Day{timeHorizon > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs text-blue-600">
                    {method.replace('_', ' ')} method
                  </div>
                </div>
              </div>

              {/* Interpretation */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">Interpretation</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>
                    • There is a 5% chance of losing more than <strong>{formatCurrency(results.var_dollar_95)}</strong> 
                    over the next {timeHorizon} day{timeHorizon > 1 ? 's' : ''}
                  </p>
                  <p>
                    • If losses exceed the VaR threshold, the expected loss is <strong>{formatCurrency(results.cvar_dollar_95)}</strong> (CVaR)
                  </p>
                  <p>
                    • This analysis is based on {historicalData.length} days of historical data using the {method.replace('_', ' ')} method
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <TrendingDown className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <div>No data available for VaR calculation</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Method Comparison */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-medium text-blue-800 mb-2">VaR Calculation Methods</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Historical Simulation:</strong> Uses actual historical returns to estimate potential losses</p>
          <p><strong>Parametric (Normal):</strong> Assumes returns follow a normal distribution</p>
          <p><strong>Monte Carlo:</strong> Generates thousands of random scenarios based on statistical properties</p>
        </div>
      </div>
    </div>
  );
};

export default VaRCalculator;

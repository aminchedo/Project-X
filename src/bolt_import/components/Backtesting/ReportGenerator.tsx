import React, { useState } from 'react';
import { Download, FileText, BarChart3, Calendar, DollarSign, Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface ReportGeneratorProps {
  backtest: {
    id: string;
    config: {
      start_date: string;
      end_date: string;
      initial_capital: number;
      symbols: string[];
      timeframe: string;
      strategy: {
        name: string;
        parameters: Record<string, any>;
      };
    };
    metrics: {
      total_return: number;
      annualized_return: number;
      sharpe_ratio: number;
      sortino_ratio: number;
      max_drawdown: number;
      calmar_ratio: number;
      win_rate: number;
      profit_factor: number;
      total_trades: number;
      avg_trade_return: number;
      var_95: number;
      cvar_95: number;
    };
    equity_curve: Array<{
      date: string;
      equity: number;
      drawdown: number;
    }>;
    trades: Array<{
      id: string;
      symbol: string;
      entry_date: string;
      exit_date: string;
      entry_price: number;
      exit_price: number;
      quantity: number;
      pnl: number;
      return_pct: number;
      duration_hours: number;
      signal_strength: number;
    }>;
    status: string;
    created_at: string;
    completed_at?: string;
  };
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ backtest }) => {
  const [reportFormat, setReportFormat] = useState<'pdf' | 'html' | 'excel'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTrades, setIncludeTrades] = useState(true);
  const [includeRiskAnalysis, setIncludeRiskAnalysis] = useState(true);
  const [generating, setGenerating] = useState(false);

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

  const generateReport = async () => {
    setGenerating(true);
    
    try {
      const response = await fetch('/api/backtesting/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backtest_id: backtest.id,
          format: reportFormat,
          options: {
            include_charts: includeCharts,
            include_trades: includeTrades,
            include_risk_analysis: includeRiskAnalysis
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backtest-report-${backtest.id}.${reportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const getRiskLevel = (maxDrawdown: number) => {
    if (maxDrawdown > 0.2) return { level: 'High', color: 'text-red-600' };
    if (maxDrawdown > 0.1) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const getPerformanceRating = (sharpeRatio: number) => {
    if (sharpeRatio > 2) return { rating: 'Excellent', color: 'text-green-600' };
    if (sharpeRatio > 1) return { rating: 'Good', color: 'text-blue-600' };
    if (sharpeRatio > 0.5) return { rating: 'Fair', color: 'text-yellow-600' };
    return { rating: 'Poor', color: 'text-red-600' };
  };

  const riskLevel = getRiskLevel(backtest.metrics.max_drawdown);
  const performanceRating = getPerformanceRating(backtest.metrics.sharpe_ratio);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Report Generator</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Options</h3>
            
            <div className="space-y-4">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Format
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'pdf', label: 'PDF Document', description: 'Professional formatted report' },
                    { value: 'html', label: 'HTML Report', description: 'Interactive web report' },
                    { value: 'excel', label: 'Excel Workbook', description: 'Data analysis spreadsheet' }
                  ].map((format) => (
                    <label key={format.value} className="flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={reportFormat === format.value}
                        onChange={(e) => setReportFormat(e.target.value as any)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{format.label}</div>
                        <div className="text-xs text-gray-500">{format.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Content Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Include Sections
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Charts & Visualizations</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeTrades}
                      onChange={(e) => setIncludeTrades(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Detailed Trade Analysis</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeRiskAnalysis}
                      onChange={(e) => setIncludeRiskAnalysis(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Risk Analysis</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateReport}
                disabled={generating}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  generating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{generating ? 'Generating...' : 'Generate Report'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Preview</h3>
            
            {/* Executive Summary */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Executive Summary
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Strategy:</span>
                    <span className="ml-2 font-medium">{backtest.config.strategy.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Period:</span>
                    <span className="ml-2 font-medium">
                      {new Date(backtest.config.start_date).toLocaleDateString()} - {new Date(backtest.config.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Initial Capital:</span>
                    <span className="ml-2 font-medium">{formatCurrency(backtest.config.initial_capital)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Final Equity:</span>
                    <span className="ml-2 font-medium">
                      {formatCurrency(backtest.config.initial_capital * (1 + backtest.metrics.total_return))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Performance Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {formatPercentage(backtest.metrics.total_return)}
                  </div>
                  <div className="text-xs text-gray-600">Total Return</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {backtest.metrics.sharpe_ratio.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Sharpe Ratio</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {formatPercentage(backtest.metrics.max_drawdown)}
                  </div>
                  <div className="text-xs text-gray-600">Max Drawdown</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {formatPercentage(backtest.metrics.win_rate)}
                  </div>
                  <div className="text-xs text-gray-600">Win Rate</div>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Risk Assessment
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Risk Level</span>
                    <span className={`text-sm font-medium ${riskLevel.color}`}>
                      {riskLevel.level}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Based on maximum drawdown of {formatPercentage(backtest.metrics.max_drawdown)}
                  </div>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Performance Rating</span>
                    <span className={`text-sm font-medium ${performanceRating.color}`}>
                      {performanceRating.rating}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Based on Sharpe ratio of {backtest.metrics.sharpe_ratio.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Trade Statistics */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Trade Statistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold text-gray-900">{backtest.metrics.total_trades}</div>
                  <div className="text-gray-600">Total Trades</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold text-gray-900">
                    {formatCurrency(backtest.metrics.avg_trade_return * backtest.config.initial_capital)}
                  </div>
                  <div className="text-gray-600">Avg Trade P&L</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold text-gray-900">{backtest.metrics.profit_factor.toFixed(2)}</div>
                  <div className="text-gray-600">Profit Factor</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-bold text-gray-900">{backtest.config.symbols.length}</div>
                  <div className="text-gray-600">Symbols Traded</div>
                </div>
              </div>
            </div>

            {/* Report Contents */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Report Contents</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  <span>Executive Summary & Key Metrics</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  <span>Strategy Configuration & Parameters</span>
                </div>
                {includeCharts && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    <span>Equity Curve & Performance Charts</span>
                  </div>
                )}
                {includeTrades && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    <span>Detailed Trade Analysis & Statistics</span>
                  </div>
                )}
                {includeRiskAnalysis && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    <span>Risk Analysis & VaR Calculations</span>
                  </div>
                )}
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  <span>Conclusions & Recommendations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                  <span>Disclaimers & Risk Warnings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Report Generation Tips</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p>• PDF reports are best for sharing and presentation purposes</p>
          <p>• HTML reports provide interactive charts and can be viewed in any web browser</p>
          <p>• Excel reports are ideal for further data analysis and customization</p>
          <p>• Large reports with many trades may take longer to generate</p>
          <p>• Reports include comprehensive disclaimers and risk warnings</p>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;

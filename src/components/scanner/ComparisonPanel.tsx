import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Plus, X, TrendingUp, TrendingDown, BarChart3, AlertCircle } from 'lucide-react';

interface ScanResult {
  symbol: string;
  score: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  signal_count: number;
  price: number;
  volume_24h: number;
  change_24h: number;
  indicators: {
    rsi: number;
    macd: number;
    volume_ratio: number;
  };
}

interface ComparisonPanelProps {
  availableResults: ScanResult[];
  onClose?: () => void;
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ availableResults, onClose }) => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddSymbol = (symbol: string) => {
    if (selectedSymbols.length < 4 && !selectedSymbols.includes(symbol)) {
      setSelectedSymbols([...selectedSymbols, symbol]);
      setSearchTerm('');
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
  };

  const filteredResults = availableResults.filter(r =>
    r.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const comparisonData = selectedSymbols.map(symbol =>
    availableResults.find(r => r.symbol === symbol)
  ).filter(Boolean) as ScanResult[];

  const getDirectionConfig = (direction: string) => {
    switch (direction) {
      case 'bullish':
        return { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
      case 'bearish':
        return { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
      default:
        return { icon: TrendingUp, color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' };
    }
  };

  const metrics = [
    { key: 'score', label: 'Score', format: (v: number) => v.toFixed(1) },
    { key: 'signal_count', label: 'Signals', format: (v: number) => v.toString() },
    { key: 'price', label: 'Price', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'change_24h', label: '24h Change', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
    { key: 'volume_24h', label: '24h Volume', format: (v: number) => `$${(v / 1000000).toFixed(2)}M` },
    { key: 'indicators.rsi', label: 'RSI', format: (v: number) => v.toFixed(0) },
    { key: 'indicators.macd', label: 'MACD', format: (v: number) => v.toFixed(2) },
    { key: 'indicators.volume_ratio', label: 'Vol Ratio', format: (v: number) => v.toFixed(2) },
  ];

  const getMetricValue = (result: ScanResult, key: string): number => {
    if (key.includes('.')) {
      const [obj, prop] = key.split('.');
      return (result as any)[obj]?.[prop] || 0;
    }
    return (result as any)[key] || 0;
  };

  const getMetricColor = (key: string, value: number) => {
    if (key === 'change_24h') {
      return value >= 0 ? 'text-green-400' : 'text-red-400';
    }
    if (key === 'score') {
      return value >= 75 ? 'text-green-400' : value >= 50 ? 'text-cyan-400' : 'text-yellow-400';
    }
    if (key === 'indicators.rsi') {
      return value >= 70 ? 'text-red-400' : value <= 30 ? 'text-green-400' : 'text-slate-400';
    }
    return 'text-slate-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
            <GitCompare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">Symbol Comparison</h2>
            <p className="text-sm text-slate-400">Compare up to 4 symbols side-by-side</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        )}
      </motion.div>

      {/* Add Symbol Section */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search symbols to add..."
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              disabled={selectedSymbols.length >= 4}
            />
            {selectedSymbols.length >= 4 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-yellow-400">
                Max 4 symbols
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchTerm && (
          <motion.div
            className="space-y-2 max-h-48 overflow-y-auto"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {filteredResults.slice(0, 5).map((result) => (
              <button
                key={result.symbol}
                onClick={() => handleAddSymbol(result.symbol)}
                disabled={selectedSymbols.includes(result.symbol) || selectedSymbols.length >= 4}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                  selectedSymbols.includes(result.symbol)
                    ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-50">{result.symbol}</span>
                  <span className={`text-sm ${getDirectionConfig(result.direction).color}`}>
                    {result.direction}
                  </span>
                </div>
                <Plus className="w-5 h-5 text-slate-400" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Selected Symbols Pills */}
        {selectedSymbols.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedSymbols.map((symbol) => (
              <motion.div
                key={symbol}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="font-semibold">{symbol}</span>
                <button
                  onClick={() => handleRemoveSymbol(symbol)}
                  className="hover:bg-purple-500/30 rounded p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Comparison Table */}
      {comparisonData.length > 0 ? (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="text-left py-4 px-6 text-slate-300 font-semibold">Metric</th>
                  {comparisonData.map((result) => {
                    const config = getDirectionConfig(result.direction);
                    const Icon = config.icon;
                    return (
                      <th key={result.symbol} className="text-center py-4 px-6">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-lg font-bold text-slate-50">{result.symbol}</span>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded ${config.bg} border ${config.border}`}>
                            <Icon className={`w-3 h-3 ${config.color}`} />
                            <span className={`text-xs font-semibold ${config.color}`}>
                              {result.direction}
                            </span>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => (
                  <motion.tr
                    key={metric.key}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.03 }}
                  >
                    <td className="py-4 px-6 text-slate-300 font-medium">{metric.label}</td>
                    {comparisonData.map((result) => {
                      const value = getMetricValue(result, metric.key);
                      const color = getMetricColor(metric.key, value);
                      
                      // Find best value for highlighting
                      const values = comparisonData.map(r => getMetricValue(r, metric.key));
                      const bestValue = metric.key.includes('change') || metric.key === 'score'
                        ? Math.max(...values)
                        : Math.min(...values);
                      const isBest = value === bestValue && comparisonData.length > 1;

                      return (
                        <td key={result.symbol} className="text-center py-4 px-6">
                          <div className={`inline-block px-3 py-1.5 rounded-lg ${
                            isBest ? 'bg-cyan-500/20 border border-cyan-500/30' : ''
                          }`}>
                            <span className={`font-semibold ${color}`}>
                              {metric.format(value)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GitCompare className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">No Symbols Selected</h3>
          <p className="text-slate-400">Search and add symbols to compare them side-by-side</p>
        </motion.div>
      )}

      {/* Winner Summary */}
      {comparisonData.length >= 2 && (
        <motion.div
          className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-slate-50">Analysis Summary</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">Highest Score</div>
              <div className="text-xl font-bold text-cyan-400">
                {comparisonData.reduce((best, r) => r.score > best.score ? r : best).symbol}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Most Signals</div>
              <div className="text-xl font-bold text-purple-400">
                {comparisonData.reduce((best, r) => r.signal_count > best.signal_count ? r : best).symbol}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Best 24h Change</div>
              <div className="text-xl font-bold text-green-400">
                {comparisonData.reduce((best, r) => r.change_24h > best.change_24h ? r : best).symbol}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ComparisonPanel;

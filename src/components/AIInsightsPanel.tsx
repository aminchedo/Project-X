import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertCircle,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Target,
  BarChart3,
  Copy,
  Check
} from 'lucide-react';

interface AIInsight {
  id: string;
  symbol: string;
  timestamp: string;
  category: 'technical' | 'fundamental' | 'sentiment' | 'onchain';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  insight: string;
  key_points: string[];
  recommendations?: string[];
}

interface AIInsightsPanelProps {
  symbol?: string;
}

const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ symbol = 'BTCUSDT' }) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [symbol, selectedCategory]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.trading.getTradingInsights(symbol);
      setInsights(response.insights || []);
    } catch (err) {
      setError('Failed to load AI insights');
      console.error('AI insights error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (insight: AIInsight) => {
    const text = `${insight.symbol} - ${insight.category.toUpperCase()}\n${insight.insight}\n\nKey Points:\n${insight.key_points.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(insight.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <BarChart3 className="w-4 h-4" />;
      case 'fundamental': return <Target className="w-4 h-4" />;
      case 'sentiment': return <MessageSquare className="w-4 h-4" />;
      case 'onchain': return <Activity className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'cyan';
      case 'fundamental': return 'purple';
      case 'sentiment': return 'pink';
      case 'onchain': return 'green';
      default: return 'slate';
    }
  };

  const getSentimentConfig = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return {
          icon: TrendingUp,
          color: 'text-green-400',
          bg: 'bg-green-500/20',
          border: 'border-green-500/30'
        };
      case 'bearish':
        return {
          icon: TrendingDown,
          color: 'text-red-400',
          bg: 'bg-red-500/20',
          border: 'border-red-500/30'
        };
      default:
        return {
          icon: Activity,
          color: 'text-slate-400',
          bg: 'bg-slate-500/20',
          border: 'border-slate-500/30'
        };
    }
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(i => i.category === selectedCategory);

  if (loading) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading AI insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchInsights}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

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
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">AI Insights</h2>
            <p className="text-sm text-slate-400">Powered by advanced ML models</p>
          </div>
        </div>
        
        <motion.button
          onClick={fetchInsights}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Category Filter */}
      <motion.div 
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-wrap gap-2">
          {['all', 'technical', 'fundamental', 'sentiment', 'onchain'].map((category) => {
            const color = getCategoryColor(category);
            const isActive = selectedCategory === category;
            
            return (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? `bg-${color}-500/20 text-${color}-400 border-2 border-${color}-500/50`
                    : 'bg-slate-800/50 text-slate-400 border-2 border-transparent hover:border-slate-600'
                }`}
              >
                {category !== 'all' && getCategoryIcon(category)}
                <span className="capitalize">{category}</span>
                {category !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-700 text-xs">
                    {insights.filter(i => i.category === category).length}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Insights List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredInsights.length === 0 ? (
            <motion.div
              key="empty"
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-12 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Brain className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-semibold text-slate-50 mb-2">No Insights Available</h3>
              <p className="text-slate-400">AI insights will appear here when available</p>
            </motion.div>
          ) : (
            filteredInsights.map((insight, index) => {
              const sentimentConfig = getSentimentConfig(insight.sentiment);
              const categoryColor = getCategoryColor(insight.category);
              const SentimentIcon = sentimentConfig.icon;

              return (
                <motion.div
                  key={insight.id}
                  className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg bg-${categoryColor}-500/20`}>
                        {getCategoryIcon(insight.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-slate-50">{insight.symbol}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold capitalize bg-${categoryColor}-500/20 text-${categoryColor}-400`}>
                            {insight.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(insight.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Sentiment Badge */}
                      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${sentimentConfig.bg} ${sentimentConfig.border} border`}>
                        <SentimentIcon className={`w-4 h-4 ${sentimentConfig.color}`} />
                        <span className={`text-sm font-semibold capitalize ${sentimentConfig.color}`}>
                          {insight.sentiment}
                        </span>
                      </div>

                      {/* Copy Button */}
                      <motion.button
                        onClick={() => handleCopy(insight)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                      >
                        {copiedId === insight.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Main Insight */}
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700/30">
                    <p className="text-slate-200 leading-relaxed">{insight.insight}</p>
                  </div>

                  {/* Key Points */}
                  {insight.key_points && insight.key_points.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        Key Points
                      </h4>
                      <ul className="space-y-2">
                        {insight.key_points.map((point, idx) => (
                          <motion.li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-slate-300"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + idx * 0.05 }}
                          >
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {insight.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-slate-300">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Confidence Indicator */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-400">AI Confidence</span>
                      <span className="text-sm font-bold text-cyan-400">{(insight.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${insight.confidence * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: index * 0.05 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIInsightsPanel;

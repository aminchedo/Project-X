import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { realtimeTradingWs } from '../services/websocket';
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentiment_score: number;
  symbols: string[];
  summary: string;
  impact_score: number;
}

interface SentimentStats {
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
  average_sentiment: number;
  total_articles: number;
}

const RealTimeNewsSentiment: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [stats, setStats] = useState<SentimentStats>({
    bullish_count: 0,
    bearish_count: 0,
    neutral_count: 0,
    average_sentiment: 0,
    total_articles: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');

  useEffect(() => {
    fetchNews();
    connectWebSocket();

    const interval = setInterval(fetchNews, 60000); // Refresh every minute
    return () => {
      clearInterval(interval);
      realtimeTradingWs.disconnect();
    };
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.ai.getNewsSentiment();
      setArticles(response.articles || []);
      setStats(response.stats || stats);
    } catch (err) {
      setError('Failed to load news sentiment');
      console.error('News sentiment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    realtimeTradingWs.connect();
    
    realtimeTradingWs.onStateChange((state) => {
      setIsConnected(state === 'connected');
    });

    realtimeTradingWs.onMessage((event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'news') {
          setArticles(prev => [message.data, ...prev].slice(0, 50));
          
          // Update stats
          setStats(prev => ({
            ...prev,
            total_articles: prev.total_articles + 1,
            bullish_count: message.data.sentiment === 'bullish' ? prev.bullish_count + 1 : prev.bullish_count,
            bearish_count: message.data.sentiment === 'bearish' ? prev.bearish_count + 1 : prev.bearish_count,
            neutral_count: message.data.sentiment === 'neutral' ? prev.neutral_count + 1 : prev.neutral_count,
          }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
  };

  const getSentimentConfig = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return {
          icon: ThumbsUp,
          bg: 'bg-green-500/20',
          text: 'text-green-400',
          border: 'border-green-500/30'
        };
      case 'bearish':
        return {
          icon: ThumbsDown,
          bg: 'bg-red-500/20',
          text: 'text-red-400',
          border: 'border-red-500/30'
        };
      default:
        return {
          icon: Minus,
          bg: 'bg-slate-500/20',
          text: 'text-slate-400',
          border: 'border-slate-500/30'
        };
    }
  };

  const getImpactColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-slate-400';
  };

  const filteredArticles = articles.filter(article =>
    filter === 'all' || article.sentiment === filter
  );

  if (loading && articles.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Loading news sentiment...</p>
      </div>
    );
  }

  if (error && articles.length === 0) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/50 rounded-xl p-8 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
        <p className="text-slate-50 mb-4">{error}</p>
        <button 
          onClick={fetchNews}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const overallSentiment = stats.bullish_count > stats.bearish_count ? 'bullish' : 
                           stats.bearish_count > stats.bullish_count ? 'bearish' : 'neutral';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between flex-wrap gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-50">News Sentiment</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <p className="text-sm text-slate-400">
                {isConnected ? 'Real-time news feed' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Filter */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['all', 'bullish', 'bearish', 'neutral'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <motion.button
            onClick={fetchNews}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-50 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Overall Sentiment Card */}
      <motion.div
        className={`bg-slate-900/80 backdrop-blur-xl border shadow-xl rounded-xl p-6 ${
          overallSentiment === 'bullish' ? 'border-green-500/50' :
          overallSentiment === 'bearish' ? 'border-red-500/50' :
          'border-slate-700/50'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-slate-50 mb-4">Market Sentiment Overview</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{stats.bullish_count}</div>
              <div className="text-xs text-slate-400">Bullish</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <ThumbsDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{stats.bearish_count}</div>
              <div className="text-xs text-slate-400">Bearish</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-500/20 rounded-lg">
              <Minus className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-400">{stats.neutral_count}</div>
              <div className="text-xs text-slate-400">Neutral</div>
            </div>
          </div>
        </div>

        {/* Sentiment Bar */}
        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(stats.bullish_count / stats.total_articles) * 100}%` }}
            transition={{ duration: 1 }}
          />
          <motion.div
            className="absolute right-0 top-0 h-full bg-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${(stats.bearish_count / stats.total_articles) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </motion.div>

      {/* News Articles */}
      <motion.div
        className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-xl rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-xl font-semibold text-slate-50">Recent News ({filteredArticles.length})</h3>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {filteredArticles.length === 0 ? (
              <div className="p-12 text-center">
                <Newspaper className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No news articles found</p>
              </div>
            ) : (
              filteredArticles.map((article, index) => {
                const config = getSentimentConfig(article.sentiment);
                const Icon = config.icon;

                return (
                  <motion.div
                    key={article.id}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-50 mb-2 hover:text-cyan-400 transition-colors">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2">
                              {article.title}
                              <ExternalLink size={14} className="flex-shrink-0 mt-1" />
                            </a>
                          </h4>
                          
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="font-medium">{article.source}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{new Date(article.published_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} border ${config.border}`}>
                          <Icon className={`w-4 h-4 ${config.text}`} />
                          <span className={`text-sm font-bold ${config.text} capitalize`}>
                            {article.sentiment}
                          </span>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-slate-300 text-sm mb-3 line-clamp-2">{article.summary}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {article.symbols.map((symbol, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded text-xs font-semibold"
                            >
                              {symbol}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Impact:</span>
                          <div className="flex items-center gap-1">
                            <div className="flex-1 w-16 bg-slate-800 rounded-full h-2">
                              <div
                                className={`h-full rounded-full ${
                                  article.impact_score >= 80 ? 'bg-red-500' :
                                  article.impact_score >= 60 ? 'bg-orange-500' :
                                  article.impact_score >= 40 ? 'bg-yellow-500' :
                                  'bg-slate-600'
                                }`}
                                style={{ width: `${article.impact_score}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${getImpactColor(article.impact_score)}`}>
                              {article.impact_score}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default RealTimeNewsSentiment;

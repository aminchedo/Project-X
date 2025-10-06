import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ExternalLink, 
  Clock,
  Filter,
  RefreshCw,
  Heart,
  MessageSquare,
  Share2,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { ProfessionalCard, ProfessionalButton } from './Layout/ProfessionalLayout';
import { dataManager, NewsItem, SentimentData } from '../services/DataManager';

interface RealTimeNewsSentimentProps {
  className?: string;
}

const RealTimeNewsSentiment: React.FC<RealTimeNewsSentimentProps> = ({ className = '' }) => {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    sentiment: 'all' as 'all' | 'positive' | 'negative' | 'neutral',
    timeRange: '24h' as '1h' | '6h' | '24h' | '7d',
    sources: [] as string[],
    keywords: ''
  });

  useEffect(() => {
    // Subscribe to news and sentiment updates
    const unsubscribeNews = dataManager.subscribe('news', (news: NewsItem[]) => {
      setNewsData(news);
    });

    const unsubscribeSentiment = dataManager.subscribe('sentiment', (sentiment: SentimentData) => {
      setSentimentData(sentiment);
    });

    // Load initial data
    loadData();

    return () => {
      unsubscribeNews();
      unsubscribeSentiment();
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [newsData, filters]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const news = dataManager.getNewsData();
      const sentiment = dataManager.getSentimentData();
      
      setNewsData(news);
      setSentimentData(sentiment);
    } catch (error) {
      console.error('Failed to load news and sentiment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = newsData.filter(news => {
      // Sentiment filter
      if (filters.sentiment !== 'all' && news.sentiment !== filters.sentiment) {
        return false;
      }

      // Time range filter
      const now = new Date();
      const newsTime = new Date(news.publishedAt);
      const timeDiff = now.getTime() - newsTime.getTime();
      
      switch (filters.timeRange) {
        case '1h':
          if (timeDiff > 60 * 60 * 1000) return false;
          break;
        case '6h':
          if (timeDiff > 6 * 60 * 60 * 1000) return false;
          break;
        case '24h':
          if (timeDiff > 24 * 60 * 60 * 1000) return false;
          break;
        case '7d':
          if (timeDiff > 7 * 24 * 60 * 60 * 1000) return false;
          break;
      }

      // Source filter
      if (filters.sources.length > 0 && !filters.sources.includes(news.source)) {
        return false;
      }

      // Keywords filter
      if (filters.keywords && !news.title.toLowerCase().includes(filters.keywords.toLowerCase()) && 
          !news.description.toLowerCase().includes(filters.keywords.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Sort by published date (newest first)
    filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    setFilteredNews(filtered);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'negative':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getFearGreedColor = (index: number) => {
    if (index >= 75) return 'text-green-400';
    if (index >= 50) return 'text-yellow-400';
    if (index >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getFearGreedLabel = (index: number) => {
    if (index >= 75) return 'Extreme Greed';
    if (index >= 55) return 'Greed';
    if (index >= 45) return 'Neutral';
    if (index >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  const getTimeAgo = (publishedAt: string): string => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diff = now.getTime() - published.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getUniqueSources = (): string[] => {
    return [...new Set(newsData.map(news => news.source))].sort();
  };

  const getSentimentStats = () => {
    const stats = newsData.reduce((acc, news) => {
      acc[news.sentiment || 'neutral']++;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    const total = stats.positive + stats.negative + stats.neutral;
    return {
      positive: total > 0 ? (stats.positive / total) * 100 : 0,
      negative: total > 0 ? (stats.negative / total) * 100 : 0,
      neutral: total > 0 ? (stats.neutral / total) * 100 : 0
    };
  };

  const sentimentStats = getSentimentStats();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Sentiment Overview */}
      <ProfessionalCard 
        title="Real-Time News & Sentiment" 
        subtitle="Live cryptocurrency news and market sentiment analysis"
        actions={
          <ProfessionalButton 
            onClick={loadData} 
            loading={isLoading}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </ProfessionalButton>
        }
      >
        {/* Sentiment Overview */}
        {sentimentData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Fear & Greed Index</span>
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              </div>
              <div className={`text-2xl font-bold ${getFearGreedColor(sentimentData.fearGreedIndex)}`}>
                {sentimentData.fearGreedIndex}
              </div>
              <div className="text-sm text-slate-400">
                {getFearGreedLabel(sentimentData.fearGreedIndex)}
              </div>
            </div>

            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Social Sentiment</span>
                <MessageSquare className="w-4 h-4 text-blue-400" />
              </div>
              <div className={`text-2xl font-bold ${sentimentData.socialSentiment > 50 ? 'text-green-400' : 'text-red-400'}`}>
                {sentimentData.socialSentiment.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400">
                {sentimentData.socialSentiment > 50 ? 'Bullish' : 'Bearish'}
              </div>
            </div>

            <div className="p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">News Sentiment</span>
                <Newspaper className="w-4 h-4 text-purple-400" />
              </div>
              <div className={`text-2xl font-bold ${sentimentData.newsSentiment > 50 ? 'text-green-400' : 'text-red-400'}`}>
                {sentimentData.newsSentiment.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400">
                {sentimentData.newsSentiment > 50 ? 'Positive' : 'Negative'}
              </div>
            </div>
          </div>
        )}

        {/* Sentiment Distribution */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">News Sentiment Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{sentimentStats.positive.toFixed(1)}%</div>
              <div className="text-sm text-slate-400">Positive</div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-green-400 h-2 rounded-full" 
                  style={{ width: `${sentimentStats.positive}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">{sentimentStats.neutral.toFixed(1)}%</div>
              <div className="text-sm text-slate-400">Neutral</div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-gray-400 h-2 rounded-full" 
                  style={{ width: `${sentimentStats.neutral}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{sentimentStats.negative.toFixed(1)}%</div>
              <div className="text-sm text-slate-400">Negative</div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-red-400 h-2 rounded-full" 
                  style={{ width: `${sentimentStats.negative}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </ProfessionalCard>

      {/* Filters */}
      <ProfessionalCard title="Filters" subtitle="Customize news and sentiment monitoring">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sentiment Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sentiment</label>
            <select
              value={filters.sentiment}
              onChange={(e) => setFilters(prev => ({ ...prev, sentiment: e.target.value as any }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>

          {/* Sources */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sources</label>
            <select
              multiple
              value={filters.sources}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters(prev => ({ ...prev, sources: selected }));
              }}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={4}
            >
              {getUniqueSources().map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Keywords</label>
            <input
              type="text"
              placeholder="Search keywords..."
              value={filters.keywords}
              onChange={(e) => setFilters(prev => ({ ...prev, keywords: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </ProfessionalCard>

      {/* News List */}
      <ProfessionalCard 
        title={`Latest News (${filteredNews.length})`}
        subtitle="Real-time cryptocurrency news with sentiment analysis"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No news articles found matching your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNews.map((news, index) => (
              <div key={`${news.id}-${index}`} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30 hover:border-slate-500/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {news.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-3 mb-3">
                      {news.description}
                    </p>
                  </div>
                  
                  <div className={`ml-4 p-2 rounded-lg border ${getSentimentColor(news.sentiment || 'neutral')}`}>
                    {getSentimentIcon(news.sentiment || 'neutral')}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{news.source}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeAgo(news.publishedAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => window.open(news.url, '_blank')}
                      className="p-2 hover:bg-slate-600/50 rounded transition-colors"
                      title="Read full article"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfessionalCard>
    </div>
  );
};

export default RealTimeNewsSentiment;

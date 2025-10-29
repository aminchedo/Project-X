import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';
import { useFeature } from '../contexts/FeatureFlagContext';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';

export const NewsFeed: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isNewsEnabled = useFeature('news-feed');
  const isSocialSentimentEnabled = useFeature('social-sentiment');

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const newsData = await marketDataService.getNews();
        setNews(newsData);
      } catch (err) {
        setError('Failed to load news');
        console.error('News loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
    
    // Refresh news every 5 minutes
    const interval = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = filter === 'all' ? news : news.filter(item => item.sentiment === filter);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp size={16} className="text-green-400" />;
      case 'negative': return <TrendingDown size={16} className="text-red-400" />;
      default: return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'border-green-500 bg-green-900/20';
      case 'negative': return 'border-red-500 bg-red-900/20';
      default: return 'border-gray-600 bg-gray-800';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-600 text-white',
      medium: 'bg-yellow-600 text-white',
      low: 'bg-green-600 text-white'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[impact as keyof typeof colors]}`}>
        {impact.toUpperCase()}
      </span>
    );
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  // Show disabled state if news feed is not enabled
  if (!isNewsEnabled) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Newspaper className="text-gray-500" size={28} />
            <h3 className="text-xl font-bold text-gray-400">Market News</h3>
            <Lock className="text-gray-500" size={16} />
          </div>
        </div>
        
        <div className="text-center text-gray-500 py-8">
          <Lock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">News Feed Disabled</p>
          <p className="text-sm">This feature is currently disabled. Enable it in the feature flags to access market news.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Newspaper className="text-blue-400" size={28} />
          <h3 className="text-xl font-bold text-white">Market News</h3>
          {isSocialSentimentEnabled && (
            <div className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full">
              Social Sentiment
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {['all', 'positive', 'negative', 'neutral'].map((sentiment) => (
            <button
              key={sentiment}
              onClick={() => setFilter(sentiment as any)}
              className={`px-3 py-1 text-sm rounded font-medium transition-colors capitalize ${
                filter === sentiment
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {sentiment}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center text-gray-400 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading latest news...</p>
        </div>
      )}

      {error && (
        <div className="text-center text-red-400 py-8">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 transition-colors hover:bg-gray-800/50 ${getSentimentColor(item.sentiment)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getSentimentIcon(item.sentiment)}
                <span className="text-gray-400 text-sm font-medium">{item.source}</span>
                {getImpactBadge(item.impact)}
              </div>
              <span className="text-gray-500 text-xs">
                {formatTimeAgo(item.publishedAt)}
              </span>
            </div>
            
            <h4 className="text-white font-semibold mb-2 leading-tight">
              {item.title}
            </h4>
            
            <p className="text-gray-300 text-sm mb-3 leading-relaxed">
              {item.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${
                  item.sentiment === 'positive' ? 'bg-green-400' :
                  item.sentiment === 'negative' ? 'bg-red-400' : 'bg-gray-400'
                }`}></span>
                <span className="text-gray-400 text-xs capitalize">
                  {item.sentiment} sentiment
                </span>
              </div>
              
              <button
                onClick={() => window.open(item.url, '_blank')}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                <span>Read more</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {!loading && !error && filteredNews.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
          <p>No news articles match the selected filter.</p>
        </div>
      )}
    </div>
  );
};
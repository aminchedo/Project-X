/**
 * NewsPanel Component
 * 
 * Displays:
 * - Cryptocurrency news articles
 * - Filtering and sorting options
 * - Article previews with links
 */

import React, { useState } from 'react';
import { useNews } from '../../hooks/useCryptoData';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

export const NewsPanel: React.FC = () => {
  const { data, loading, error, refetch } = useNews(20, 300000);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp size={16} className="text-green-400" />;
      case 'negative':
        return <TrendingDown size={16} className="text-red-400" />;
      default:
        return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment?: string): string => {
    switch (sentiment) {
      case 'positive':
        return 'border-green-500 bg-green-900/20';
      case 'negative':
        return 'border-red-500 bg-red-900/20';
      default:
        return 'border-gray-600 bg-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
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

  const filteredNews = filter === 'all'
    ? data
    : data?.filter(item => item.sentiment === filter);

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center text-gray-400 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading latest news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="text-center text-red-400 py-8">
          <p className="mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Newspaper className="text-blue-400" size={28} />
          <div>
            <h3 className="text-xl font-bold text-white">Crypto News</h3>
            <p className="text-gray-400 text-sm">
              {filteredNews?.length || 0} articles
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
        >
          <RefreshCw size={16} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        {['all', 'positive', 'negative', 'neutral'].map((sentiment) => (
          <button
            key={sentiment}
            onClick={() => setFilter(sentiment as any)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors capitalize ${filter === sentiment
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            {sentiment}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {!filteredNews || filteredNews.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
            <p>No news articles match the selected filter.</p>
          </div>
        ) : (
          filteredNews.map((article) => (
            <div
              key={article.id}
              className={`border rounded-lg p-4 transition-all hover:bg-gray-800/50 ${getSentimentColor(article.sentiment)}`}
            >
              {/* Article Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getSentimentIcon(article.sentiment)}
                  <span className="text-gray-400 text-sm font-medium">{article.source}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {formatTimeAgo(article.publishedAt)}
                </span>
              </div>

              {/* Article Content */}
              <div className="flex gap-4">
                {article.urlToImage && (
                  <div className="flex-shrink-0">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold mb-2 leading-tight line-clamp-2">
                    {article.title}
                  </h4>

                  {article.description && (
                    <p className="text-gray-300 text-sm mb-3 leading-relaxed line-clamp-2">
                      {article.description}
                    </p>
                  )}

                  {article.author && (
                    <div className="text-gray-500 text-xs mb-2">
                      By {article.author}
                    </div>
                  )}
                </div>
              </div>

              {/* Article Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${article.sentiment === 'positive' ? 'bg-green-400' :
                      article.sentiment === 'negative' ? 'bg-red-400' : 'bg-gray-400'
                    }`}></span>
                  <span className="text-gray-400 text-xs capitalize">
                    {article.sentiment || 'neutral'} sentiment
                  </span>
                </div>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  <span>Read more</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


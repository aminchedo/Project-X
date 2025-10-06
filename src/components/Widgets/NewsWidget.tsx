import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  url?: string;
}

interface NewsWidgetProps {
  selectedSymbol: string;
}

const MOCK_NEWS: Record<string, NewsItem[]> = {
  BTCUSDT: [
    {
      id: '1',
      title: 'Bitcoin ETF Approval Expected',
      summary: 'Major institutional adoption could drive prices higher in the coming weeks',
      source: 'CryptoNews',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sentiment: 'positive',
    },
    {
      id: '2',
      title: 'Bitcoin Network Hash Rate Reaches New High',
      summary: 'Mining activity continues to grow, showing strong network security',
      source: 'BlockchainDaily',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      sentiment: 'positive',
    },
  ],
  ETHUSDT: [
    {
      id: '1',
      title: 'Ethereum Upgrade Complete',
      summary: 'Network efficiency improvements implemented successfully',
      source: 'ETHNews',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      sentiment: 'positive',
    },
  ],
  DEFAULT: [
    {
      id: '1',
      title: 'Market Volatility Alert',
      summary: 'High volatility expected in next trading session',
      source: 'TradingView',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      sentiment: 'neutral',
    },
  ],
};

export const NewsWidget: React.FC<NewsWidgetProps> = ({ selectedSymbol }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Simulate fetching news for the selected symbol
    setIsLoading(true);
    const timeout = setTimeout(() => {
      const symbolNews = MOCK_NEWS[selectedSymbol] || MOCK_NEWS.DEFAULT;
      setNews(symbolNews);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [selectedSymbol]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'negative':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="badge-metal p-2 rounded-lg">
            <Newspaper className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Market News - {selectedSymbol.replace('USDT', '')}
            </h3>
            <p className="text-xs text-slate-400">
              Source: CryptoNews • Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="widget-loading flex-1">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
          </div>
        </div>
      ) : news.length > 0 ? (
        <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
          {news.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${getSentimentColor(
                item.sentiment
              )}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-300 mb-2">{item.summary}</p>
                  <div className="text-xs text-slate-400">
                    {new Date(item.timestamp).toLocaleTimeString()} • {item.source}
                  </div>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    aria-label="Read full article"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="widget-empty flex-1">
          <p>No news available for {selectedSymbol}</p>
        </div>
      )}
    </div>
  );
};

export default NewsWidget;


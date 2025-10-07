import React, { useState, useEffect, useCallback } from 'react';
import { cryptoService } from '../services/cryptoService';
import './CryptoDashboard.css';

interface PriceData {
  data: {
    price: number;
    change24h: number;
    volume24h?: number;
    marketCap?: number;
  };
  source: string;
  timestamp: string;
  isFallback?: boolean;
}

interface SentimentData {
  data: {
    value: number;
    classification: string;
    timestamp: string;
    history?: Array<{ value: number; timestamp: string }>;
  };
  source: string;
  timestamp: string;
  isFallback?: boolean;
}

interface NewsData {
  data: Array<{
    title: string;
    description?: string;
    url: string;
    source: string;
    publishedAt: string;
    author?: string;
  }>;
  source: string;
  timestamp: string;
  isFallback?: boolean;
}

interface ApiStatus {
  name: string;
  status: 'active' | 'error';
  usage: string;
}

export const CryptoDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [apiStatus, setApiStatus] = useState<ApiStatus[]>([]);

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString();
  };

  const testAllAPIs = useCallback(async () => {
    const testEndpoint = async (name: string, testFn: () => Promise<any>): Promise<ApiStatus> => {
      try {
        await testFn();
        return { name, status: 'active', usage: 'OK' };
      } catch (error) {
        return { name, status: 'error', usage: 'Failed' };
      }
    };

    const testPromises = [
      testEndpoint('CoinGecko', () => cryptoService.getPrice('BTC')),
      testEndpoint('CryptoCompare', () => cryptoService.getPrice('BTC')),
      testEndpoint('Alternative.me', () => cryptoService.getSentiment()),
      testEndpoint('Reddit/News', () => cryptoService.getNews())
    ];

    const results = await Promise.allSettled(testPromises);
    const statuses = results.map(result => 
      result.status === 'fulfilled' ? result.value : { name: 'Unknown', status: 'error' as const, usage: 'Failed' }
    );
    setApiStatus(statuses);
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const [price, sentiment, news] = await Promise.allSettled([
        cryptoService.getPrice(selectedSymbol),
        cryptoService.getSentiment(selectedSymbol),
        cryptoService.getNews()
      ]);

      // Process price data
      if (price.status === 'fulfilled') {
        setPriceData(price.value as PriceData);
      } else {
        setPriceData(cryptoService['getFallbackPrice'](selectedSymbol) as PriceData);
      }

      // Process sentiment data
      if (sentiment.status === 'fulfilled') {
        setSentimentData(sentiment.value as SentimentData);
      } else {
        setSentimentData(cryptoService['getFallbackSentiment']() as SentimentData);
      }

      // Process news data
      if (news.status === 'fulfilled') {
        setNewsData(news.value as NewsData);
      } else {
        setNewsData(cryptoService['getFallbackNews']() as NewsData);
      }
    } catch (error) {
      throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedSymbol]);

  const initializeDashboard = useCallback(async () => {
    setLoading(true);
    setGlobalError(null);
    
    try {
      await fetchAllData();
      await testAllAPIs();
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [fetchAllData, testAllAPIs]);

  useEffect(() => {
    initializeDashboard();
    
    // Auto-refresh every 2 minutes
    const autoRefresh = setInterval(initializeDashboard, 120000);
    
    return () => clearInterval(autoRefresh);
  }, [initializeDashboard]);

  const handleRefresh = () => {
    initializeDashboard();
  };

  const handleRetry = () => {
    setGlobalError(null);
    initializeDashboard();
  };

  const handleUseFallback = () => {
    setGlobalError(null);
    setPriceData(cryptoService['getFallbackPrice'](selectedSymbol) as PriceData);
    setSentimentData(cryptoService['getFallbackSentiment']() as SentimentData);
    setNewsData(cryptoService['getFallbackNews']() as NewsData);
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSymbol(e.target.value);
  };

  if (loading) {
    return (
      <div className="crypto-dashboard">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Loading crypto data from multiple sources...</p>
        </div>
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="crypto-dashboard">
        <div className="error-section">
          <div className="error-card">
            <h3>⚠️ Connection Issues</h3>
            <p>{globalError}</p>
            <div className="error-actions">
              <button onClick={handleRetry} className="retry-btn">Retry All</button>
              <button onClick={handleUseFallback} className="fallback-btn">Use Fallback Data</button>
            </div>
            <div className="api-status">
              <h4>API Status:</h4>
              <div className="status-list">
                {apiStatus.map(status => (
                  <div key={status.name} className={`status-item ${status.status}`}>
                    {status.name}: {status.status}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="crypto-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>📊 Crypto Intelligence Dashboard</h1>
        <div className="last-update">
          Last update: {lastUpdate}
          <button onClick={handleRefresh} disabled={loading} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Dashboard */}
      <div className="dashboard-grid">
        {/* Price Data */}
        <div className="card price-card">
          <h3>💰 {selectedSymbol} Price</h3>
          {priceData && (
            <div className="price-content">
              <div className="price-main">${formatNumber(priceData.data.price)}</div>
              <div className={`price-change ${priceData.data.change24h >= 0 ? 'positive' : 'negative'}`}>
                {priceData.data.change24h >= 0 ? '↗' : '↘'} 
                {Math.abs(priceData.data.change24h).toFixed(2)}%
              </div>
              {priceData.data.volume24h && (
                <div className="price-volume">
                  Vol: ${formatNumber(priceData.data.volume24h)}
                </div>
              )}
              <div className="price-source">Source: {priceData.source}</div>
              {priceData.isFallback && <div className="fallback-badge">Fallback Data</div>}
            </div>
          )}
        </div>

        {/* Sentiment */}
        <div className="card sentiment-card">
          <h3>😊 Market Sentiment</h3>
          {sentimentData && (
            <div className="sentiment-content">
              <div className="sentiment-value">{sentimentData.data.value}/100</div>
              <div className="sentiment-classification">{sentimentData.data.classification}</div>
              <div className="sentiment-bar">
                <div 
                  className="sentiment-fill" 
                  style={{ width: `${sentimentData.data.value}%` }}
                ></div>
              </div>
              <div className="sentiment-source">Source: {sentimentData.source}</div>
              {sentimentData.isFallback && <div className="fallback-badge">Fallback Data</div>}
            </div>
          )}
        </div>

        {/* News Feed */}
        <div className="card news-card">
          <h3>📰 Latest News</h3>
          {newsData && newsData.data.length > 0 ? (
            <div className="news-list">
              {newsData.data.slice(0, 5).map((article, index) => (
                <div key={index} className="news-item">
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="news-title">
                    {article.title}
                  </a>
                  <div className="news-meta">
                    <span className="news-source">{article.source}</span>
                    <span className="news-time">{formatTime(article.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">No recent news available</div>
          )}
          {newsData && <div className="news-source">Source: {newsData.source}</div>}
          {newsData?.isFallback && <div className="fallback-badge">Fallback Data</div>}
        </div>

        {/* API Status */}
        <div className="card status-card">
          <h3>🔧 Service Status</h3>
          <div className="status-grid">
            {apiStatus.map((endpoint) => (
              <div key={endpoint.name} className={`status-item ${endpoint.status}`}>
                <span className="status-dot"></span>
                {endpoint.name}
                <small> ({endpoint.usage})</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Symbol Selector */}
      <div className="symbol-selector">
        <label htmlFor="symbolSelect">Select Symbol: </label>
        <select id="symbolSelect" value={selectedSymbol} onChange={handleSymbolChange}>
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="USDT">Tether (USDT)</option>
          <option value="BNB">Binance Coin (BNB)</option>
          <option value="ADA">Cardano (ADA)</option>
          <option value="SOL">Solana (SOL)</option>
          <option value="XRP">Ripple (XRP)</option>
        </select>
      </div>
    </div>
  );
};

export default CryptoDashboard;


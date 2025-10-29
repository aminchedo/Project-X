import { MarketData, CandlestickData, TechnicalIndicators, NewsItem } from '../types';
import { realDataService } from './realDataService';
import CryptoDataOrchestrator from './crypto/CryptoDataOrchestrator';
import { FEATURE_FLAGS } from '../config/cryptoApiConfig';
import apiClient from './apiClient';
import { logError } from '../utils/errorHandler';

class MarketDataService {
  private ws: WebSocket | null = null;
  private subscribers: ((data: MarketData[]) => void)[] = [];
  private cache: Map<string, MarketData> = new Map();

  // Supported cryptocurrencies
  private readonly SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
    'MATICUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'XRPUSDT'
  ];

  async initialize(): Promise<void> {
    // Initialize with real data
    await this.loadRealData();
    this.startRealTimeUpdates();
  }

  private async loadRealData(): Promise<void> {
    try {
      if (FEATURE_FLAGS.USE_REAL_APIS) {
        // Use new secure API services
        const dashboardData = await CryptoDataOrchestrator.getDashboardData();
        const marketData = this.convertCryptoPricesToMarketData(dashboardData.prices);
        marketData.forEach(item => this.cache.set(item.symbol, item));
        this.notifySubscribers();
      } else {
        // Use legacy real data service
        const marketData = await realDataService.getCoinMarketCapData();
        marketData.forEach(item => this.cache.set(item.symbol, item));
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Primary data source failed, trying fallback:', error);
      try {
        if (FEATURE_FLAGS.USE_REAL_APIS) {
          // Fallback to legacy service
          const marketData = await realDataService.getCoinGeckoData();
          marketData.forEach(item => this.cache.set(item.symbol, item));
          this.notifySubscribers();
        } else {
          // Fallback to CoinGecko
          const marketData = await realDataService.getCoinGeckoData();
          marketData.forEach(item => this.cache.set(item.symbol, item));
          this.notifySubscribers();
        }
      } catch (fallbackError) {
        console.error('All market data sources failed:', fallbackError);
        // Load minimal mock data as last resort
        await this.loadFallbackData();
      }
    }
  }

  private async loadFallbackData(): Promise<void> {
    const fallbackData: MarketData[] = [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 43250.75,
        change24h: 1250.30,
        changePercent24h: 2.98,
        volume24h: 28500000000,
        marketCap: 850000000000,
        high24h: 43800.50,
        low24h: 41950.25,
        timestamp: Date.now()
      }
    ];

    fallbackData.forEach(item => this.cache.set(item.symbol, item));
    this.notifySubscribers();
  }

  private startRealTimeUpdates(): void {
    // Update market data every 30 seconds
    setInterval(() => {
      this.refreshMarketData();
    }, 30000); // 30 seconds
  }

  private async refreshMarketData(): Promise<void> {
    try {
      if (FEATURE_FLAGS.USE_REAL_APIS) {
        // Use new secure API services
        const dashboardData = await CryptoDataOrchestrator.getDashboardData();
        const marketData = this.convertCryptoPricesToMarketData(dashboardData.prices);
        marketData.forEach(item => this.cache.set(item.symbol, item));
        this.notifySubscribers();
      } else {
        // Use legacy service
        const marketData = await realDataService.getCoinMarketCapData();
        marketData.forEach(item => this.cache.set(item.symbol, item));
        this.notifySubscribers();
      }
    } catch (error) {
      console.error('Failed to refresh market data:', error);
      // Continue with cached data
    }
  }

  subscribe(callback: (data: MarketData[]) => void): () => void {
    this.subscribers.push(callback);

    // Send initial data
    callback(Array.from(this.cache.values()));

    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    const data = Array.from(this.cache.values());
    this.subscribers.forEach(callback => callback(data));
  }

  async getCandlestickData(symbol: string, interval: string = '1h'): Promise<CandlestickData[]> {
    try {
      // Try backend API first
      const response = await apiClient.get(`/market/${symbol}/history`, {
        params: { period: interval }
      });
      return response.data;
    } catch (error) {
      logError('getCandlestickData', error);
      try {
        // Fallback to external API
        return await realDataService.getCryptoCompareHistorical(symbol, 100);
      } catch (fallbackError) {
        logError('getCandlestickData fallback', fallbackError);
        // Return mock data as last resort
        return this.generateMockCandlestickData(symbol);
      }
    }
  }

  private generateMockCandlestickData(symbol: string): CandlestickData[] {
    const data: CandlestickData[] = [];
    const basePrice = this.cache.get(symbol)?.price || 40000;

    for (let i = 99; i >= 0; i--) {
      const time = Date.now() - (i * 60 * 60 * 1000);
      const open = basePrice * (0.98 + Math.random() * 0.04);
      const close = open * (0.995 + Math.random() * 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (0.99 + Math.random() * 0.005);
      const volume = Math.random() * 1000000;
      data.push({ time, open, high, low, close, volume });
    }
    return data;
  }

  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators> {
    try {
      const candlestickData = await this.getCandlestickData(symbol);
      return realDataService.calculateTechnicalIndicators(candlestickData);
    } catch (error) {
      console.error('Failed to calculate technical indicators:', error);
      // Return mock indicators as fallback
      return this.getMockTechnicalIndicators(symbol);
    }
  }

  private getMockTechnicalIndicators(symbol: string): TechnicalIndicators {
    const price = this.cache.get(symbol)?.price || 40000;
    return {
      rsi: 45 + Math.random() * 30,
      macd: {
        macd: Math.random() * 100 - 50,
        signal: Math.random() * 100 - 50,
        histogram: Math.random() * 20 - 10
      },
      sma20: price * (0.98 + Math.random() * 0.04),
      sma50: price * (0.96 + Math.random() * 0.08),
      ema12: price * (0.99 + Math.random() * 0.02),
      ema26: price * (0.97 + Math.random() * 0.06),
      bb: {
        upper: price * 1.02,
        middle: price,
        lower: price * 0.98
      }
    };
  }

  async getNews(): Promise<NewsItem[]> {
    try {
      // Try backend API first
      const response = await apiClient.get('/news/crypto');
      return response.data.articles || [];
    } catch (error) {
      logError('getNews', error);
      try {
        if (FEATURE_FLAGS.USE_REAL_APIS) {
          // Use new secure API services
          const newsData = await CryptoDataOrchestrator.getNewsAndSentiment();
          return this.convertNewsArticlesToNewsItems(newsData.news);
        } else {
          // Use legacy service
          return await realDataService.getCryptoNews();
        }
      } catch (fallbackError) {
        logError('getNews fallback', fallbackError);
        return [];
      }
    }
  }

  /**
   * Convert CryptoPrice array to MarketData array
   */
  private convertCryptoPricesToMarketData(cryptoPrices: any[]): MarketData[] {
    return cryptoPrices.map(crypto => ({
      id: crypto.id,
      symbol: crypto.symbol,
      name: crypto.name,
      price: crypto.current_price,
      change24h: crypto.price_change_24h,
      changePercent24h: crypto.price_change_percentage_24h,
      volume24h: crypto.total_volume,
      marketCap: crypto.market_cap,
      high24h: crypto.high_24h,
      low24h: crypto.low_24h,
      timestamp: Date.now()
    }));
  }

  /**
   * Convert NewsArticle array to NewsItem array
   */
  private convertNewsArticlesToNewsItems(newsArticles: any[]): NewsItem[] {
    return newsArticles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source?.name || 'Unknown',
      sentiment: article.sentiment || 'neutral'
    }));
  }
}

export const marketDataService = new MarketDataService();
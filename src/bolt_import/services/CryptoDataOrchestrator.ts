/**
 * CryptoDataOrchestrator - Unified interface to coordinate all crypto services
 * 
 * Coordinates:
 * - EnhancedMarketDataService
 * - NewsService
 * - SentimentService
 * - WhaleTrackingService
 */

import { enhancedMarketDataService, EnhancedMarketData, TopMover } from './EnhancedMarketDataService';
import { newsService, NewsArticle } from './NewsService';
import { sentimentService, SentimentData } from './SentimentService';
import { whaleTrackingService, WhaleTransaction } from './WhaleTrackingService';

export interface MarketOverview {
  prices: EnhancedMarketData[];
  sentiment: SentimentData;
  topMovers: {
    gainers: TopMover[];
    losers: TopMover[];
  };
  timestamp: number;
}

export interface CompleteAssetData {
  marketData: EnhancedMarketData;
  sentiment: SentimentData;
  news: NewsArticle[];
  historicalPrices: Array<{ time: number; price: number }>;
  timestamp: number;
}

export interface NewsAndSentiment {
  news: NewsArticle[];
  sentiment: SentimentData;
  timestamp: number;
}

export class CryptoDataOrchestrator {
  private whaleCallbacks: Array<(transaction: WhaleTransaction) => void> = [];
  private isMonitoring: boolean = false;

  /**
   * Get comprehensive market overview
   */
  async getMarketOverview(symbols: string[] = ['BTC', 'ETH', 'BNB']): Promise<MarketOverview> {
    try {
      // Fetch all data in parallel using Promise.allSettled for graceful degradation
      const [pricesResult, sentimentResult, topMoversResult] = await Promise.allSettled([
        enhancedMarketDataService.getCurrentPrices(symbols),
        sentimentService.getAggregatedSentiment(symbols[0]),
        enhancedMarketDataService.getTopMovers(5),
      ]);

      return {
        prices: pricesResult.status === 'fulfilled' ? pricesResult.value : [],
        sentiment: sentimentResult.status === 'fulfilled'
          ? sentimentResult.value
          : {
            overall: 50,
            fearGreed: { value: 50, classification: 'Neutral' },
            reddit: { score: 50, posts: 0 },
            timestamp: Date.now(),
          },
        topMovers: topMoversResult.status === 'fulfilled'
          ? topMoversResult.value
          : { gainers: [], losers: [] },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get market overview:', error);
      throw error;
    }
  }

  /**
   * Get complete data for a single asset
   */
  async getCompleteAssetData(symbol: string, historicalDays: number = 30): Promise<CompleteAssetData> {
    try {
      // Fetch all data in parallel
      const [marketDataResult, sentimentResult, newsResult, historicalResult] = await Promise.allSettled([
        enhancedMarketDataService.getCurrentPrices([symbol]),
        sentimentService.getAggregatedSentiment(symbol),
        newsService.getCoinNews(symbol, 10),
        enhancedMarketDataService.getHistoricalData(symbol, historicalDays),
      ]);

      return {
        marketData: marketDataResult.status === 'fulfilled' && marketDataResult.value.length > 0
          ? marketDataResult.value[0]
          : {
            symbol,
            name: symbol,
            price: 0,
            change24h: 0,
            changePercent24h: 0,
            volume24h: 0,
            marketCap: 0,
            lastUpdate: Date.now(),
          },
        sentiment: sentimentResult.status === 'fulfilled'
          ? sentimentResult.value
          : {
            overall: 50,
            fearGreed: { value: 50, classification: 'Neutral' },
            reddit: { score: 50, posts: 0 },
            timestamp: Date.now(),
          },
        news: newsResult.status === 'fulfilled' ? newsResult.value : [],
        historicalPrices: historicalResult.status === 'fulfilled' ? historicalResult.value : [],
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get complete asset data:', error);
      throw error;
    }
  }

  /**
   * Get whale activity
   */
  getWhaleActivity(limit: number = 20): WhaleTransaction[] {
    return whaleTrackingService.getRecentTransactions(limit);
  }

  /**
   * Get whale statistics
   */
  getWhaleStatistics() {
    return whaleTrackingService.getStatistics();
  }

  /**
   * Get news with sentiment context
   */
  async getNewsAndSentiment(limit: number = 20): Promise<NewsAndSentiment> {
    try {
      const [newsResult, sentimentResult] = await Promise.allSettled([
        newsService.getLatestNews(limit),
        sentimentService.getAggregatedSentiment('BTC'),
      ]);

      return {
        news: newsResult.status === 'fulfilled' ? newsResult.value : [],
        sentiment: sentimentResult.status === 'fulfilled'
          ? sentimentResult.value
          : {
            overall: 50,
            fearGreed: { value: 50, classification: 'Neutral' },
            reddit: { score: 50, posts: 0 },
            timestamp: Date.now(),
          },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get news and sentiment:', error);
      throw error;
    }
  }

  /**
   * Start real-time monitoring
   */
  startRealTimeMonitoring(callbacks: {
    onWhaleTransaction?: (transaction: WhaleTransaction) => void;
  }): void {
    if (this.isMonitoring) {
      console.warn('Real-time monitoring already started');
      return;
    }

    console.log('Starting real-time monitoring...');
    this.isMonitoring = true;

    // Start whale tracking with 30-second polling
    if (callbacks.onWhaleTransaction) {
      this.whaleCallbacks.push(callbacks.onWhaleTransaction);
      whaleTrackingService.startPolling(30000, callbacks.onWhaleTransaction);
    }
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('Real-time monitoring not started');
      return;
    }

    console.log('Stopping real-time monitoring...');
    this.isMonitoring = false;

    // Stop whale tracking
    whaleTrackingService.stopPolling();
    this.whaleCallbacks = [];
  }

  /**
   * Get services health status
   */
  getServicesStats() {
    return {
      marketData: enhancedMarketDataService.getStats(),
      news: newsService.getStats(),
      sentiment: sentimentService.getStats(),
      whale: whaleTrackingService.getStats(),
      isMonitoring: this.isMonitoring,
    };
  }

  /**
   * Get current prices for symbols
   */
  async getCurrentPrices(symbols: string[]): Promise<EnhancedMarketData[]> {
    return await enhancedMarketDataService.getCurrentPrices(symbols);
  }

  /**
   * Get historical data
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<Array<{ time: number; price: number }>> {
    return await enhancedMarketDataService.getHistoricalData(symbol, days);
  }

  /**
   * Get latest news
   */
  async getLatestNews(limit: number = 20): Promise<NewsArticle[]> {
    return await newsService.getLatestNews(limit);
  }

  /**
   * Get sentiment data
   */
  async getSentiment(symbol: string = 'BTC'): Promise<SentimentData> {
    return await sentimentService.getAggregatedSentiment(symbol);
  }

  /**
   * Search news
   */
  async searchNews(query: string, fromDate?: string, toDate?: string, limit: number = 20): Promise<NewsArticle[]> {
    return await newsService.searchNews(query, fromDate, toDate, limit);
  }

  /**
   * Get top movers
   */
  async getTopMovers(limit: number = 5): Promise<{ gainers: TopMover[]; losers: TopMover[] }> {
    return await enhancedMarketDataService.getTopMovers(limit);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    newsService.clearCache();
    enhancedMarketDataService.clearLogs();
    newsService.clearLogs();
    sentimentService.clearLogs();
    whaleTrackingService.clearLogs();
  }
}

// Export singleton instance
export const cryptoDataOrchestrator = new CryptoDataOrchestrator();


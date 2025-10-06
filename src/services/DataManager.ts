// DataManager.ts - Complete fix with proper abort handling
import { realApiService } from './RealApiService';
import { EnhancedWebSocket, tradingWebSocket } from './EnhancedWebSocket';
import { MarketData } from '../types';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface SentimentData {
  fearGreedIndex: number;
  socialSentiment: number;
  newsSentiment: number;
  timestamp: Date;
}

export interface WhaleTransaction {
  id: string;
  symbol: string;
  amount: number;
  value: number;
  from: string;
  to: string;
  timestamp: Date;
  blockchain: string;
}

export interface PortfolioData {
  [network: string]: {
    [address: string]: {
      balance: string;
      tokens: Array<{
        symbol: string;
        balance: string;
        value: number;
      }>;
    };
  };
}

class DataManager {
  private marketData: Map<string, MarketData> = new Map();
  private newsData: NewsItem[] = [];
  private sentimentData: SentimentData | null = null;
  private whaleTransactions: WhaleTransaction[] = [];
  private portfolioData: PortfolioData = {};
  private updateCallbacks: Map<string, Set<Function>> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  // Abort controllers for each update type
  private abortControllers: Map<string, AbortController> = new Map();
  private isDestroyed = false;

  constructor() {
    this.initializeDataStreams();
    this.setupWebSocketListeners();
  }

  /**
   * Get or create abort controller for a specific key
   */
  private getAbortController(key: string): AbortController {
    // Abort previous controller if exists
    const existing = this.abortControllers.get(key);
    if (existing) {
      existing.abort();
    }

    // Create new controller
    const controller = new AbortController();
    this.abortControllers.set(key, controller);
    return controller;
  }

  /**
   * Handle errors and ignore AbortErrors
   */
  private handleError(error: unknown, context: string): void {
    if (error instanceof Error && error.name === 'AbortError') {
      // Silently ignore - expected during cleanup
      return;
    }
    console.error(`Failed to ${context}:`, error);
  }

  // Initialize data streams
  private initializeDataStreams(): void {
    // Market data updates every 30 seconds
    this.startPeriodicUpdate('marketData', () => this.updateMarketData(), 30000);
    
    // News updates every 5 minutes
    this.startPeriodicUpdate('news', () => this.updateNews(), 300000);
    
    // Sentiment updates every 10 minutes
    this.startPeriodicUpdate('sentiment', () => this.updateSentiment(), 600000);
    
    // Whale transactions every 2 minutes
    this.startPeriodicUpdate('whaleTransactions', () => this.updateWhaleTransactions(), 120000);
    
    // Portfolio data every minute
    this.startPeriodicUpdate('portfolio', () => this.updatePortfolio(), 60000);
  }

  // Setup WebSocket listeners
  private setupWebSocketListeners(): void {
    tradingWebSocket.on('marketUpdate', (data: any) => {
      this.handleMarketUpdate(data);
    });

    tradingWebSocket.on('signalUpdate', (data: any) => {
      this.handleSignalUpdate(data);
    });

    tradingWebSocket.on('riskAlert', (data: any) => {
      this.handleRiskAlert(data);
    });

    tradingWebSocket.on('portfolioUpdate', (data: any) => {
      this.handlePortfolioUpdate(data);
    });
  }

  // Start periodic updates
  private startPeriodicUpdate(key: string, updateFn: () => Promise<void>, interval: number): void {
    // Initial update
    updateFn().catch((error) => this.handleError(error, `initial ${key} update`));
    
    // Set up interval
    const intervalId = setInterval(() => {
      if (!this.isDestroyed) {
        updateFn().catch((error) => this.handleError(error, `${key} update`));
      }
    }, interval);
    
    this.updateIntervals.set(key, intervalId);
  }

  // Update market data with abort handling
  private async updateMarketData(): Promise<void> {
    if (this.isDestroyed) return;

    const controller = this.getAbortController('marketData');

    try {
      const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'MATIC', 'AVAX', 'LINK'];
      const marketData = await realApiService.getMarketData(symbols, controller.signal);
      
      // Check if aborted before processing
      if (controller.signal.aborted) return;
      
      if (marketData?.data) {
        for (const [symbol, data] of Object.entries(marketData.data)) {
          const quote = (data as any).quote?.USD;
          if (quote) {
            const marketDataItem: MarketData = {
              symbol,
              price: quote.price,
              change_24h: quote.percent_change_24h,
              volume: quote.volume_24h,
              high_24h: quote.high_24h,
              low_24h: quote.low_24h,
              timestamp: new Date()
            };
            
            this.marketData.set(symbol, marketDataItem);
          }
        }
        
        this.notifySubscribers('marketData', Array.from(this.marketData.values()));
      }
    } catch (error) {
      this.handleError(error, 'update market data');
    } finally {
      // Clean up controller if it's still the current one
      if (this.abortControllers.get('marketData') === controller) {
        this.abortControllers.delete('marketData');
      }
    }
  }

  // Update news data with abort handling
  private async updateNews(): Promise<void> {
    if (this.isDestroyed) return;

    const controller = this.getAbortController('news');

    try {
      const newsResponse = await realApiService.getCryptoNews(50, controller.signal);
      
      if (controller.signal.aborted) return;
      
      if (newsResponse?.articles) {
        this.newsData = newsResponse.articles.map((article: any, index: number) => ({
          id: `news_${index}_${Date.now()}`,
          title: article.title,
          description: article.description,
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source?.name || 'Unknown',
          sentiment: this.analyzeSentiment(article.title + ' ' + article.description)
        }));
        
        this.notifySubscribers('news', this.newsData);
      }
    } catch (error) {
      this.handleError(error, 'update news');
    } finally {
      if (this.abortControllers.get('news') === controller) {
        this.abortControllers.delete('news');
      }
    }
  }

  // Update sentiment data with abort handling
  private async updateSentiment(): Promise<void> {
    if (this.isDestroyed) return;

    const controller = this.getAbortController('sentiment');

    try {
      const fearGreedResponse = await realApiService.getFearGreedIndex(controller.signal);
      const socialSentimentResponse = await realApiService.getSocialSentiment('BTC', controller.signal);
      
      if (controller.signal.aborted) return;
      
      this.sentimentData = {
        fearGreedIndex: fearGreedResponse?.data?.[0]?.value || 50,
        socialSentiment: this.extractSocialSentiment(socialSentimentResponse),
        newsSentiment: this.calculateNewsSentiment(),
        timestamp: new Date()
      };
      
      this.notifySubscribers('sentiment', this.sentimentData);
    } catch (error) {
      this.handleError(error, 'update sentiment');
    } finally {
      if (this.abortControllers.get('sentiment') === controller) {
        this.abortControllers.delete('sentiment');
      }
    }
  }

  // Update whale transactions with abort handling
  private async updateWhaleTransactions(): Promise<void> {
    if (this.isDestroyed) return;

    const controller = this.getAbortController('whaleTransactions');

    try {
      const whaleResponse = await realApiService.getWhaleTransactions(1000000, 20, controller.signal);
      
      if (controller.signal.aborted) return;
      
      if (whaleResponse?.transactions) {
        this.whaleTransactions = whaleResponse.transactions.map((tx: any) => ({
          id: tx.hash || `tx_${Date.now()}_${Math.random()}`,
          symbol: tx.symbol,
          amount: tx.amount,
          value: tx.amount_usd || tx.value,
          from: tx.from?.address || 'Unknown',
          to: tx.to?.address || 'Unknown',
          timestamp: new Date(tx.timestamp * 1000 || Date.now()),
          blockchain: tx.blockchain || 'Unknown'
        }));
        
        this.notifySubscribers('whaleTransactions', this.whaleTransactions);
      }
    } catch (error) {
      this.handleError(error, 'update whale transactions');
    } finally {
      if (this.abortControllers.get('whaleTransactions') === controller) {
        this.abortControllers.delete('whaleTransactions');
      }
    }
  }

  // Update portfolio data with abort handling
  private async updatePortfolio(): Promise<void> {
    if (this.isDestroyed) return;

    const controller = this.getAbortController('portfolio');

    try {
      const savedAddresses = this.loadPortfolioAddresses();
      
      if (Object.keys(savedAddresses).length > 0) {
        const portfolioData = await realApiService.getPortfolioData(savedAddresses, controller.signal);
        
        if (controller.signal.aborted) return;
        
        this.portfolioData = portfolioData;
        this.notifySubscribers('portfolio', this.portfolioData);
      }
    } catch (error) {
      this.handleError(error, 'update portfolio');
    } finally {
      if (this.abortControllers.get('portfolio') === controller) {
        this.abortControllers.delete('portfolio');
      }
    }
  }

  // WebSocket event handlers
  private handleMarketUpdate(data: any): void {
    if (data.symbol && data.price) {
      const marketDataItem: MarketData = {
        symbol: data.symbol,
        price: data.price,
        change_24h: data.change_24h || 0,
        volume: data.volume || data.volume_24h || 0,
        high_24h: data.high_24h || data.price,
        low_24h: data.low_24h || data.price,
        timestamp: new Date()
      };
      
      this.marketData.set(data.symbol, marketDataItem);
      this.notifySubscribers('marketData', Array.from(this.marketData.values()));
    }
  }

  private handleSignalUpdate(data: any): void {
    this.notifySubscribers('signals', data);
  }

  private handleRiskAlert(data: any): void {
    this.notifySubscribers('riskAlerts', data);
  }

  private handlePortfolioUpdate(data: any): void {
    this.portfolioData = { ...this.portfolioData, ...data };
    this.notifySubscribers('portfolio', this.portfolioData);
  }

  // Utility functions
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['bull', 'bullish', 'moon', 'pump', 'surge', 'rally', 'gain', 'profit', 'success'];
    const negativeWords = ['bear', 'bearish', 'crash', 'dump', 'fall', 'loss', 'decline', 'drop', 'fail'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractSocialSentiment(data: any): number {
    if (data?.sentiment_votes_up_percentage) {
      return data.sentiment_votes_up_percentage;
    }
    return 50;
  }

  private calculateNewsSentiment(): number {
    if (this.newsData.length === 0) return 50;
    
    const sentimentCounts = this.newsData.reduce((acc, news) => {
      acc[news.sentiment || 'neutral']++;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });
    
    const total = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral;
    if (total === 0) return 50;
    
    return ((sentimentCounts.positive / total) * 100);
  }

  private loadPortfolioAddresses(): { [network: string]: string[] } {
    try {
      const saved = localStorage.getItem('hts_portfolio_addresses');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn('Failed to load portfolio addresses:', error);
      return {};
    }
  }

  // Public API methods
  public subscribe(event: string, callback: Function): () => void {
    if (!this.updateCallbacks.has(event)) {
      this.updateCallbacks.set(event, new Set());
    }
    
    this.updateCallbacks.get(event)!.add(callback);
    
    return () => {
      this.updateCallbacks.get(event)?.delete(callback);
    };
  }

  private notifySubscribers(event: string, data: any): void {
    const callbacks = this.updateCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscription callback:', error);
        }
      });
    }
  }

  // Getters
  public getMarketData(): MarketData[] {
    return Array.from(this.marketData.values());
  }

  public getNewsData(): NewsItem[] {
    return this.newsData;
  }

  public getSentimentData(): SentimentData | null {
    return this.sentimentData;
  }

  public getWhaleTransactions(): WhaleTransaction[] {
    return this.whaleTransactions;
  }

  public getPortfolioData(): PortfolioData {
    return this.portfolioData;
  }

  // Portfolio management
  public addPortfolioAddress(network: string, address: string): void {
    const addresses = this.loadPortfolioAddresses();
    if (!addresses[network]) {
      addresses[network] = [];
    }
    if (!addresses[network].includes(address)) {
      addresses[network].push(address);
      localStorage.setItem('hts_portfolio_addresses', JSON.stringify(addresses));
      this.updatePortfolio();
    }
  }

  public removePortfolioAddress(network: string, address: string): void {
    const addresses = this.loadPortfolioAddresses();
    if (addresses[network]) {
      addresses[network] = addresses[network].filter(addr => addr !== address);
      if (addresses[network].length === 0) {
        delete addresses[network];
      }
      localStorage.setItem('hts_portfolio_addresses', JSON.stringify(addresses));
      this.updatePortfolio();
    }
  }

  // Cleanup
  public destroy(): void {
    this.isDestroyed = true;
    
    // Abort all ongoing requests
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    
    // Clear all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
    
    // Clear callbacks
    this.updateCallbacks.clear();
    
    // Disconnect WebSocket
    tradingWebSocket.destroy();
  }
}

export const dataManager = new DataManager();
export default dataManager;
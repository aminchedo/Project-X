import { MarketData, NewsItem, CandlestickData, TechnicalIndicators } from '../types';

// Proxy server configuration
const PROXY_SERVER_URL = import.meta.env.VITE_PROXY_SERVER_URL || 'http://localhost:3002';

// Missing constants that were causing ReferenceErrors
const USE_CORS_PROXY = false; // Set to false when using backend proxy

const API_URLS = {
  FEAR_GREED: 'https://api.alternative.me/fng/?limit=1&format=json',
  FEAR_GREED_FALLBACK: 'https://api.alternative.me/fng/'
};

const FALLBACK_VALUES = {
  FEAR_GREED_INDEX: 50, // Neutral
  DEFAULT_PRICE: 0,
  DEFAULT_CHANGE: 0,
  FEAR_GREED: { 
    data: [{ 
      value: '50', 
      value_classification: 'Neutral',
      timestamp: String(Math.floor(Date.now() / 1000)),
      time_until_update: '0'
    }]
  }
};

// Rate limiting configuration
const RATE_LIMITS = {
  coinmarketcap: { requests: 333, window: 86400000 }, // 333 requests per day
  cryptocompare: { requests: 100000, window: 2592000000 }, // 100k per month
  newsapi: { requests: 1000, window: 86400000 }, // 1000 per day
  coingecko: { requests: 50, window: 60000 }, // 50 per minute
  etherscan: { requests: 5, window: 1000 }, // 5 per second
  bscscan: { requests: 5, window: 1000 }, // 5 per second
  feargreed: { requests: 100, window: 60000 }, // 100 per minute
};

// Request configuration
const REQUEST_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 1000, // 1 second base delay for exponential backoff
};

interface APIMetrics {
  endpoint: string;
  success: boolean;
  duration: number;
  methodUsed: string;
  timestamp: number;
  error?: string;
}

class RealDataService {
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();
  private metrics: APIMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  /**
   * Track API performance metrics
   */
  private trackAPIMetrics(endpoint: string, success: boolean, duration: number, methodUsed: string, error?: string): void {
    const metric: APIMetrics = {
      endpoint,
      success,
      duration,
      methodUsed,
      timestamp: Date.now(),
      error
    };
    
    this.metrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
    
    console.log('📊 API Metrics:', {
      endpoint,
      success: success ? '✅' : '❌',
      duration: `${duration}ms`,
      methodUsed,
      timestamp: new Date().toISOString(),
      ...(error && { error })
    });
  }

  /**
   * Make request with timeout protection
   */
  private async makeRequestWithTimeout(url: string, options: RequestInit = {}, timeout: number = REQUEST_CONFIG.TIMEOUT): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Fetch with exponential backoff retry logic
   */
  private async fetchWithRetry(url: string, options: RequestInit = {}, maxRetries: number = REQUEST_CONFIG.MAX_RETRIES): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await this.makeRequestWithTimeout(url, options);
        if (response.ok) {
          return response;
        }
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on last attempt
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = REQUEST_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt);
          console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  private async makeRequest(url: string, options: RequestInit = {}, service: string = ''): Promise<any> {
    const startTime = Date.now();
    let methodUsed = 'proxy-server';
    
    try {
      // Check rate limits
      if (service && this.isRateLimited(service)) {
        const error = `Rate limit exceeded for ${service}`;
        this.trackAPIMetrics(service || url, false, Date.now() - startTime, methodUsed, error);
        throw new Error(error);
      }

      console.log(`🔄 Attempting ${service || 'API'} request via ${methodUsed}...`);

      const response = await this.fetchWithRetry(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update rate limiter
      if (service) {
        this.updateRateLimit(service);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${service || 'API'} request successful`);
      this.trackAPIMetrics(service || url, true, duration, methodUsed);
      
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ ${service || 'API'} request failed:`, {
        error: errorMsg,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`
      });
      
      this.trackAPIMetrics(service || url, false, duration, methodUsed, errorMsg);
      throw error;
    }
  }

  private isRateLimited(service: string): boolean {
    const limiter = this.rateLimiters.get(service);
    const config = RATE_LIMITS[service as keyof typeof RATE_LIMITS];
    
    if (!limiter || !config) return false;
    
    const now = Date.now();
    if (now > limiter.resetTime) {
      this.rateLimiters.set(service, { count: 0, resetTime: now + config.window });
      return false;
    }
    
    return limiter.count >= config.requests;
  }

  private updateRateLimit(service: string): void {
    const limiter = this.rateLimiters.get(service) || { count: 0, resetTime: Date.now() + (RATE_LIMITS[service as keyof typeof RATE_LIMITS]?.window || 60000) };
    limiter.count++;
    this.rateLimiters.set(service, limiter);
  }

  // CoinMarketCap API via proxy
  async getCoinMarketCapData(): Promise<MarketData[]> {
    const url = `${PROXY_SERVER_URL}/api/coinmarketcap/quotes?symbols=BTC,ETH,BNB,ADA,SOL,MATIC,DOT,LINK,LTC,XRP`;
    
    try {
      const data = await this.makeRequest(url, {}, 'coinmarketcap');
      return this.transformCMCData(data.data);
    } catch (error) {
      console.error('CoinMarketCap API failed:', error);
      throw error;
    }
  }

  // CoinGecko API via proxy (fallback for CoinMarketCap)
  async getCoinGeckoData(): Promise<MarketData[]> {
    const url = `${PROXY_SERVER_URL}/api/coingecko/price?ids=bitcoin,ethereum,binancecoin,cardano,solana,polygon,polkadot,chainlink,litecoin,ripple`;
    
    try {
      const data = await this.makeRequest(url, {}, 'coingecko');
      return this.transformCoinGeckoData(data);
    } catch (error) {
      console.error('CoinGecko API failed:', error);
      throw error;
    }
  }

  private transformCMCData(data: any): MarketData[] {
    return Object.values(data).map((coin: any) => ({
      id: coin.slug,
      symbol: coin.symbol,
      name: coin.name,
      price: coin.quote.USD.price,
      change24h: coin.quote.USD.price * (coin.quote.USD.percent_change_24h / 100),
      changePercent24h: coin.quote.USD.percent_change_24h,
      volume24h: coin.quote.USD.volume_24h,
      marketCap: coin.quote.USD.market_cap,
      high24h: coin.quote.USD.price * 1.05, // Approximate
      low24h: coin.quote.USD.price * 0.95, // Approximate
      timestamp: Date.now()
    }));
  }

  // CryptoCompare API for historical data via proxy
  async getCryptoCompareHistorical(symbol: string, limit: number = 100): Promise<CandlestickData[]> {
    const url = `${PROXY_SERVER_URL}/api/cryptocompare/price?fsyms=${symbol}`;
    
    try {
      const data = await this.makeRequest(url, {}, 'cryptocompare');
      
      // Transform CryptoCompare data format
      if (data.RAW && data.RAW[symbol] && data.RAW[symbol].USD) {
        const coinData = data.RAW[symbol].USD;
        return [{
          time: Date.now(),
          open: coinData.OPENDAY,
          high: coinData.HIGHDAY,
          low: coinData.LOWDAY,
          close: coinData.PRICE,
          volume: coinData.VOLUMEDAY
        }];
      }
      
      return [];
    } catch (error) {
      console.error('CryptoCompare API failed:', error);
      throw error;
    }
  }


  private transformCoinGeckoData(data: any): MarketData[] {
    const symbolMap: { [key: string]: string } = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'binancecoin': 'BNB',
      'cardano': 'ADA',
      'solana': 'SOL',
      'polygon': 'MATIC',
      'polkadot': 'DOT',
      'chainlink': 'LINK',
      'litecoin': 'LTC',
      'ripple': 'XRP'
    };

    return Object.entries(data).map(([id, coin]: [string, any]) => ({
      id,
      symbol: symbolMap[id] || id.toUpperCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      price: coin.usd,
      change24h: coin.usd * (coin.usd_24h_change / 100),
      changePercent24h: coin.usd_24h_change || 0,
      volume24h: coin.usd_24h_vol || 0,
      marketCap: coin.usd_market_cap || 0,
      high24h: coin.usd * 1.05,
      low24h: coin.usd * 0.95,
      timestamp: Date.now()
    }));
  }

  // News API via proxy
  async getCryptoNews(): Promise<NewsItem[]> {
    const url = `${PROXY_SERVER_URL}/api/news/crypto?q=cryptocurrency OR bitcoin OR ethereum&pageSize=20`;
    
    try {
      const data = await this.makeRequest(url, {}, 'newsapi');
      return this.transformNewsData(data.articles || []);
    } catch (error) {
      console.error('NewsAPI failed:', error);
      return [];
    }
  }

  private transformNewsData(articles: any[]): NewsItem[] {
    return articles.map((article, index) => ({
      id: `news-${index}`,
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
      impact: this.determineImpact(article.title)
    }));
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['bull', 'rise', 'gain', 'up', 'surge', 'rally', 'growth', 'adoption', 'breakthrough'];
    const negativeWords = ['bear', 'fall', 'drop', 'crash', 'decline', 'loss', 'hack', 'ban', 'regulation'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private determineImpact(title: string): 'high' | 'medium' | 'low' {
    const highImpactWords = ['etf', 'regulation', 'ban', 'hack', 'crash', 'surge', 'adoption', 'institutional'];
    const mediumImpactWords = ['price', 'market', 'trading', 'volume', 'analysis'];
    
    const lowerTitle = title.toLowerCase();
    
    if (highImpactWords.some(word => lowerTitle.includes(word))) return 'high';
    if (mediumImpactWords.some(word => lowerTitle.includes(word))) return 'medium';
    return 'low';
  }


  // Fear & Greed Index via proxy server
  async getFearGreedIndex(): Promise<{ value: number; classification: string }> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Attempting Fear & Greed API via proxy...');
      
      const url = `${PROXY_SERVER_URL}/api/feargreed`;
      const data = await this.makeRequest(url, {}, 'feargreed');
      
      console.log('✅ Fear & Greed API successful via proxy');
      this.trackAPIMetrics('feargreed-proxy', true, Date.now() - startTime, 'proxy-server');
      
      return {
        value: parseInt(data.data[0].value),
        classification: data.data[0].value_classification
      };
      
    } catch (error) {
      console.warn('⚠️ Fear & Greed API failed, using fallback values:', error);
      this.trackAPIMetrics('feargreed-fallback', false, Date.now() - startTime, 'fallback-values', 
        error instanceof Error ? error.message : 'Unknown error');
      
      return { value: 50, classification: 'Neutral' };
    }
  }

  // Technical Indicators (calculated from price data)
  calculateTechnicalIndicators(data: CandlestickData[]): TechnicalIndicators {
    if (data.length < 50) {
      throw new Error('Insufficient data for technical indicators');
    }

    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    return {
      rsi: this.calculateRSI(closes, 14),
      macd: this.calculateMACD(closes),
      sma20: this.calculateSMA(closes, 20),
      sma50: this.calculateSMA(closes, 50),
      ema12: this.calculateEMA(closes, 12),
      ema26: this.calculateEMA(closes, 26),
      bb: this.calculateBollingerBands(closes, 20, 2)
    };
  }

  private calculateRSI(prices: number[], period: number): number {
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // Simplified signal line (would need EMA of MACD in real implementation)
    const signal = macd * 0.9;
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  private calculateSMA(prices: number[], period: number): number {
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  }

  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number, stdDev: number): { upper: number; middle: number; lower: number } {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    const variance = slice.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }

  /**
   * Get API performance metrics (for debugging)
   */
  public getMetrics(): APIMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  public getMetricsSummary(): {
    total: number;
    successful: number;
    failed: number;
    successRate: string;
    avgDuration: string;
  } {
    const total = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? ((successful / total) * 100).toFixed(2) : '0.00';
    const avgDuration = total > 0 
      ? (this.metrics.reduce((sum, m) => sum + m.duration, 0) / total).toFixed(2)
      : '0.00';

    return {
      total,
      successful,
      failed,
      successRate: `${successRate}%`,
      avgDuration: `${avgDuration}ms`
    };
  }

  /**
   * Clear metrics (useful for testing)
   */
  public clearMetrics(): void {
    this.metrics = [];
    console.log('📊 Metrics cleared');
  }

  /**
   * Start live monitoring dashboard
   * Updates every 30 seconds with current metrics
   */
  public startLiveMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('⚠️ Live monitoring already running');
      return;
    }

    console.log('🚀 Starting live API monitoring...');
    console.log(`   Update interval: ${intervalMs / 1000}s`);
    
    this.isMonitoring = true;
    
    // Initial display
    this.displayLiveMetrics();
    
    // Set up recurring updates
    this.monitoringInterval = setInterval(() => {
      this.displayLiveMetrics();
    }, intervalMs);
  }

  /**
   * Stop live monitoring
   */
  public stopLiveMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('🛑 Live monitoring stopped');
    } else {
      console.log('⚠️ Live monitoring is not running');
    }
  }

  /**
   * Display current metrics in console
   */
  private displayLiveMetrics(): void {
    const summary = this.getMetricsSummary();
    
    if (summary.total === 0) {
      console.log('📊 Live Metrics: No API calls yet');
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    
    console.group(`📈 LIVE API METRICS (${timestamp})`);
    console.log(`🎯 Success Rate: ${summary.successRate}`);
    console.log(`📊 Total Requests: ${summary.total}`);
    console.log(`⚡ Avg Response: ${summary.avgDuration}`);
    console.log(`✅ Successful: ${summary.successful}`);
    console.log(`❌ Failed: ${summary.failed}`);
    
    // Show recent errors if any
    const recentErrors = this.metrics
      .filter(m => !m.success && m.error)
      .slice(-3);
    
    if (recentErrors.length > 0) {
      console.log('\n⚠️ Recent Errors:');
      recentErrors.forEach((m, i) => {
        console.log(`   ${i + 1}. ${m.endpoint}: ${m.error}`);
      });
    }
    
    console.groupEnd();
  }

  /**
   * Get monitoring status
   */
  public getMonitoringStatus(): { isActive: boolean; interval: number | null } {
    return {
      isActive: this.isMonitoring,
      interval: this.monitoringInterval ? 30000 : null
    };
  }
}

export const realDataService = new RealDataService();
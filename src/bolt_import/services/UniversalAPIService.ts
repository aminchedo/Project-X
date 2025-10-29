/**
 * Universal API Service
 * 
 * Comprehensive API integration with intelligent fallback strategies
 * Supports: Blockchain Explorers, Market Data, News, Sentiment, Whale Tracking
 */

import { API_CONFIG, REQUEST_CONFIG, CORS_PROXY, CORS_PROXY_FALLBACK } from '../config/apiConfig';

interface APIEndpoint {
  service: string;
  endpoint: string;
  parser?: (data: any) => any;
  headers?: Record<string, string>;
}

interface UniversalAPIMetrics {
  service: string;
  endpoint: string;
  success: boolean;
  duration: number;
  provider: string;
  timestamp: number;
  error?: string;
}

export class UniversalAPIService {
  private metrics: UniversalAPIMetrics[] = [];
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();

  // ========================================
  // CORE METHODS
  // ========================================

  /**
   * Fetch data with intelligent fallback across multiple providers
   */
  private async fetchWithFallbacks(
    category: 'blockchain' | 'marketData' | 'news' | 'sentiment' | 'whale',
    serviceName: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const startTime = Date.now();
    const config = (API_CONFIG as any)[category]?.[serviceName];

    if (!config) {
      throw new Error(`No configuration found for ${category}.${serviceName}`);
    }

    // Get all available providers sorted by priority
    const providers = this.getProvidersByPriority(config);

    let lastError: Error | null = null;

    // Try each provider
    for (const provider of providers) {
      try {
        console.log(`🔄 Trying ${provider.name} for ${serviceName}...`);

        const url = `${provider.baseUrl}${endpoint}`;
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        };

        // Add API key if available
        if (provider.key) {
          // Different APIs use different header names
          if (serviceName.includes('coinmarketcap')) {
            headers['X-CMC_PRO_API_KEY'] = provider.key;
          } else if (serviceName.includes('etherscan') || serviceName.includes('bscscan')) {
            // Etherscan/BscScan use query params, not headers
          } else {
            headers['Authorization'] = `Bearer ${provider.key}`;
          }
        }

        // Use CORS proxy in development if needed
        const useProxy = this.shouldUseProxy(url);
        const requestUrl = useProxy ? `${CORS_PROXY}${encodeURIComponent(url)}` : url;

        const response = await this.makeRequestWithTimeout(requestUrl, {
          ...options,
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const duration = Date.now() - startTime;

        console.log(`✅ ${provider.name} successful (${duration}ms)`);
        this.trackMetrics(serviceName, endpoint, true, duration, provider.name);

        return data;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ ${provider.name} failed:`, lastError.message);
        continue; // Try next provider
      }
    }

    // All providers failed
    const duration = Date.now() - startTime;
    const errorMsg = lastError?.message || 'All providers failed';
    
    this.trackMetrics(serviceName, endpoint, false, duration, 'none', errorMsg);
    throw new Error(`Failed to fetch from ${serviceName}: ${errorMsg}`);
  }

  /**
   * Get providers sorted by priority
   */
  private getProvidersByPriority(config: any): any[] {
    const providers = [];

    if (config.primary) {
      providers.push(config.primary);
    }
    if (config.fallback) {
      providers.push(config.fallback);
    }

    // Sort by priority if available
    providers.sort((a, b) => (a.priority || 999) - (b.priority || 999));

    return providers;
  }

  /**
   * Make request with timeout protection
   */
  private async makeRequestWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Determine if CORS proxy should be used
   */
  private shouldUseProxy(url: string): boolean {
    if (process.env.NODE_ENV !== 'development') return false;

    const proxiedDomains = [
      'coinmarketcap.com',
      'alternative.me',
      'newsapi.org',
      'cryptocontrol.io',
      'lunarcrush.com'
    ];

    return proxiedDomains.some(domain => url.includes(domain));
  }

  /**
   * Track API metrics
   */
  private trackMetrics(
    service: string,
    endpoint: string,
    success: boolean,
    duration: number,
    provider: string,
    error?: string
  ): void {
    const metric: UniversalAPIMetrics = {
      service,
      endpoint,
      success,
      duration,
      provider,
      timestamp: Date.now(),
      error,
    };

    this.metrics.push(metric);

    // Keep only last 200 metrics
    if (this.metrics.length > 200) {
      this.metrics.shift();
    }
  }

  // ========================================
  // 1. MARKET DATA METHODS
  // ========================================

  /**
   * Get cryptocurrency prices from multiple sources
   */
  async getCryptoPrices(symbols: string[] = ['BTC', 'ETH', 'BNB']): Promise<any> {
    const endpoints: APIEndpoint[] = [
      {
        service: 'coinmarketcap',
        endpoint: `/cryptocurrency/quotes/latest?symbol=${symbols.join(',')}&convert=USD`,
        parser: this.parseCoinMarketCapPrices.bind(this),
      },
      {
        service: 'coingecko',
        endpoint: `/simple/price?ids=${this.symbolsToIds(symbols)}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        parser: this.parseCoinGeckoPrices.bind(this),
      },
      {
        service: 'cryptocompare',
        endpoint: `/pricemultifull?fsyms=${symbols.join(',')}&tsyms=USD`,
        parser: this.parseCryptoComparePrices.bind(this),
      },
    ];

    return this.fetchFromMultipleSources('marketData', endpoints);
  }

  /**
   * Get historical price data
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<any> {
    const endpoints: APIEndpoint[] = [
      {
        service: 'cryptocompare',
        endpoint: `/v2/histoday?fsym=${symbol}&tsym=USD&limit=${days}`,
        parser: this.parseCryptoCompareHistorical.bind(this),
      },
      {
        service: 'coingecko',
        endpoint: `/coins/${this.symbolToId(symbol)}/market_chart?vs_currency=usd&days=${days}`,
        parser: this.parseCoinGeckoHistorical.bind(this),
      },
    ];

    return this.fetchFromMultipleSources('marketData', endpoints);
  }

  // ========================================
  // 2. SENTIMENT & SOCIAL METHODS
  // ========================================

  /**
   * Get Fear & Greed Index from multiple sources
   */
  async getFearGreedIndex(): Promise<{ value: number; classification: string }> {
    const endpoints: APIEndpoint[] = [
      {
        service: 'fearGreed',
        endpoint: '/?limit=1&format=json',
        parser: this.parseFearGreed.bind(this),
      },
      {
        service: 'coingecko',
        endpoint: '/coins/bitcoin?community_data=true&developer_data=false',
        parser: this.parseCoinGeckoSentiment.bind(this),
      },
    ];

    try {
      const result = await this.fetchFromMultipleSources('sentiment', endpoints);
      return result || { value: 50, classification: 'Neutral' };
    } catch (error) {
      console.warn('All sentiment APIs failed, using default');
      return { value: 50, classification: 'Neutral' };
    }
  }

  /**
   * Get social metrics
   */
  async getSocialMetrics(symbol: string = 'BTC'): Promise<any> {
    const endpoints: APIEndpoint[] = [
      {
        service: 'lunarcrush',
        endpoint: `?data=assets&symbol=${symbol}`,
        parser: this.parseLunarCrush.bind(this),
      },
      {
        service: 'coingecko',
        endpoint: `/coins/${this.symbolToId(symbol)}?community_data=true&developer_data=true`,
        parser: this.parseCoinGeckoSocial.bind(this),
      },
      {
        service: 'reddit',
        endpoint: `/r/CryptoCurrency/hot.json?limit=10`,
        parser: this.parseRedditMetrics.bind(this),
      },
    ];

    return this.fetchFromMultipleSources('sentiment', endpoints);
  }

  // ========================================
  // 3. NEWS METHODS
  // ========================================

  /**
   * Get crypto news from multiple sources
   */
  async getCryptoNews(limit: number = 20): Promise<any[]> {
    const endpoints: APIEndpoint[] = [
      {
        service: 'newsapi',
        endpoint: `/everything?q=cryptocurrency OR bitcoin OR ethereum&sortBy=publishedAt&pageSize=${limit}`,
        parser: this.parseNewsAPI.bind(this),
      },
      {
        service: 'cryptopanic',
        endpoint: `/posts/?auth_token=free&public=true&kind=news`,
        parser: this.parseCryptoPanic.bind(this),
      },
    ];

    try {
      return await this.fetchFromMultipleSources('news', endpoints);
    } catch (error) {
      console.warn('All news APIs failed, returning empty array');
      return [];
    }
  }

  // ========================================
  // 4. WHALE TRACKING METHODS
  // ========================================

  /**
   * Get whale transactions
   */
  async getWhaleTransactions(minValue: number = 1000000): Promise<any[]> {
    const endpoints: APIEndpoint[] = [
      {
        service: 'whaleAlert',
        endpoint: `/transactions?min_value=${minValue}`,
        parser: this.parseWhaleAlert.bind(this),
      },
      {
        service: 'etherscan',
        endpoint: `?module=account&action=txlist&address=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&sort=desc`,
        parser: this.parseEtherscanWhale.bind(this),
      },
    ];

    try {
      return await this.fetchFromMultipleSources('whale', endpoints);
    } catch (error) {
      console.warn('Whale tracking APIs failed, returning empty array');
      return [];
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Fetch from multiple sources and return first successful result
   */
  private async fetchFromMultipleSources(
    category: 'blockchain' | 'marketData' | 'news' | 'sentiment' | 'whale',
    endpoints: APIEndpoint[]
  ): Promise<any> {
    for (const ep of endpoints) {
      try {
        const data = await this.fetchWithFallbacks(category, ep.service, ep.endpoint, {
          headers: ep.headers,
        });

        // Parse data if parser provided
        return ep.parser ? ep.parser(data) : data;
      } catch (error) {
        console.warn(`Failed to fetch from ${ep.service}:`, error);
        continue;
      }
    }

    throw new Error('All sources failed');
  }

  // ========================================
  // DATA PARSERS
  // ========================================

  private parseCoinMarketCapPrices(data: any): any {
    const prices: any = {};
    Object.entries(data.data || {}).forEach(([symbol, coin]: [string, any]) => {
      prices[symbol] = {
        price: coin.quote.USD.price,
        change24h: coin.quote.USD.percent_change_24h,
        volume24h: coin.quote.USD.volume_24h,
        marketCap: coin.quote.USD.market_cap,
        source: 'CoinMarketCap',
      };
    });
    return prices;
  }

  private parseCoinGeckoPrices(data: any): any {
    const prices: any = {};
    Object.entries(data).forEach(([id, coin]: [string, any]) => {
      const symbol = this.idToSymbol(id);
      prices[symbol] = {
        price: coin.usd,
        change24h: coin.usd_24h_change,
        volume24h: coin.usd_24h_vol,
        marketCap: coin.usd_market_cap,
        source: 'CoinGecko',
      };
    });
    return prices;
  }

  private parseCryptoComparePrices(data: any): any {
    const prices: any = {};
    Object.entries(data.RAW || {}).forEach(([symbol, coinData]: [string, any]) => {
      prices[symbol] = {
        price: coinData.USD.PRICE,
        change24h: coinData.USD.CHANGEPCT24HOUR,
        volume24h: coinData.USD.VOLUME24HOUR,
        marketCap: coinData.USD.MKTCAP,
        source: 'CryptoCompare',
      };
    });
    return prices;
  }

  private parseCryptoCompareHistorical(data: any): any {
    return (data.Data?.Data || []).map((item: any) => ({
      time: item.time * 1000,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volumeto,
    }));
  }

  private parseCoinGeckoHistorical(data: any): any {
    return (data.prices || []).map((item: any) => ({
      time: item[0],
      price: item[1],
    }));
  }

  private parseFearGreed(data: any): { value: number; classification: string } {
    return {
      value: parseInt(data.data?.[0]?.value || '50'),
      classification: data.data?.[0]?.value_classification || 'Neutral',
    };
  }

  private parseCoinGeckoSentiment(data: any): { value: number; classification: string } {
    // Derive sentiment from community data
    const upVotes = data.sentiment_votes_up_percentage || 50;
    return {
      value: upVotes,
      classification: upVotes > 75 ? 'Extreme Greed' : upVotes > 55 ? 'Greed' : upVotes < 25 ? 'Extreme Fear' : upVotes < 45 ? 'Fear' : 'Neutral',
    };
  }

  private parseLunarCrush(data: any): any {
    return data.data?.[0] || {};
  }

  private parseCoinGeckoSocial(data: any): any {
    return {
      twitterFollowers: data.community_data?.twitter_followers,
      redditSubscribers: data.community_data?.reddit_subscribers,
      githubStars: data.developer_data?.stars,
      source: 'CoinGecko',
    };
  }

  private parseRedditMetrics(data: any): any {
    return {
      posts: data.data?.children?.length || 0,
      topPost: data.data?.children?.[0]?.data?.title,
      source: 'Reddit',
    };
  }

  private parseNewsAPI(data: any): any[] {
    return (data.articles || []).map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      provider: 'NewsAPI',
    }));
  }

  private parseCryptoPanic(data: any): any[] {
    return (data.results || []).map((item: any) => ({
      title: item.title,
      url: item.url,
      source: item.source?.title,
      publishedAt: item.published_at,
      provider: 'CryptoPanic',
    }));
  }

  private parseWhaleAlert(data: any): any[] {
    return (data.transactions || []).map((tx: any) => ({
      amount: tx.amount,
      symbol: tx.symbol,
      from: tx.from,
      to: tx.to,
      timestamp: tx.timestamp,
      provider: 'WhaleAlert',
    }));
  }

  private parseEtherscanWhale(data: any): any[] {
    return (data.result || []).slice(0, 10).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      timestamp: tx.timeStamp,
      provider: 'Etherscan',
    }));
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private symbolsToIds(symbols: string[]): string {
    const map: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      BNB: 'binancecoin',
      ADA: 'cardano',
      SOL: 'solana',
      XRP: 'ripple',
      DOT: 'polkadot',
      DOGE: 'dogecoin',
      MATIC: 'polygon',
      LTC: 'litecoin',
    };
    return symbols.map(s => map[s] || s.toLowerCase()).join(',');
  }

  private symbolToId(symbol: string): string {
    const map: Record<string, string> = {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      BNB: 'binancecoin',
      ADA: 'cardano',
      SOL: 'solana',
      XRP: 'ripple',
      DOT: 'polkadot',
      DOGE: 'dogecoin',
      MATIC: 'polygon',
      LTC: 'litecoin',
    };
    return map[symbol] || symbol.toLowerCase();
  }

  private idToSymbol(id: string): string {
    const map: Record<string, string> = {
      bitcoin: 'BTC',
      ethereum: 'ETH',
      binancecoin: 'BNB',
      cardano: 'ADA',
      solana: 'SOL',
      ripple: 'XRP',
      polkadot: 'DOT',
      dogecoin: 'DOGE',
      polygon: 'MATIC',
      litecoin: 'LTC',
    };
    return map[id] || id.toUpperCase();
  }

  // ========================================
  // METRICS & MONITORING
  // ========================================

  public getMetrics(): UniversalAPIMetrics[] {
    return [...this.metrics];
  }

  public getMetricsSummary(): {
    totalRequests: number;
    successRate: string;
    avgDuration: string;
    providerStats: Record<string, { success: number; failed: number }>;
  } {
    const total = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const avgDuration = total > 0
      ? (this.metrics.reduce((sum, m) => sum + m.duration, 0) / total).toFixed(2)
      : '0.00';

    // Provider statistics
    const providerStats: Record<string, { success: number; failed: number }> = {};
    this.metrics.forEach(m => {
      if (!providerStats[m.provider]) {
        providerStats[m.provider] = { success: 0, failed: 0 };
      }
      if (m.success) {
        providerStats[m.provider].success++;
      } else {
        providerStats[m.provider].failed++;
      }
    });

    return {
      totalRequests: total,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%',
      avgDuration: avgDuration + 'ms',
      providerStats,
    };
  }

  public clearMetrics(): void {
    this.metrics = [];
    console.log('📊 Universal API metrics cleared');
  }
}

// Export singleton instance
export const universalAPIService = new UniversalAPIService();

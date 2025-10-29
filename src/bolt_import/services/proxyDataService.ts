/**
 * Proxy Data Service
 * Uses local proxy server to avoid ALL CORS issues
 * This is the RECOMMENDED service for production use
 */

import { MarketData, NewsItem } from '../types';

class ProxyDataService {
  private readonly PROXY_URL = 'http://localhost:3002/api';
  private requestCache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_DURATION = 60000; // 1 minute

  /**
   * Generic fetch with caching
   */
  private async fetchWithCache(endpoint: string, cacheDuration = this.CACHE_DURATION): Promise<any> {
    // Check cache
    const cached = this.requestCache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      console.log(`📦 [Cache] Using cached data for ${endpoint}`);
      return cached.data;
    }

    // Fetch fresh data
    const response = await fetch(`${this.PROXY_URL}/${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the result
    this.requestCache.set(endpoint, { data, timestamp: Date.now() });

    return data;
  }

  // ========================================
  // MARKET DATA
  // ========================================

  /**
   * Get market data from CoinMarketCap (via proxy - NO CORS!)
   */
  async getCoinMarketCapData(symbols: string[] = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL']): Promise<MarketData[]> {
    try {
      console.log('📊 [Proxy] Fetching CoinMarketCap data...');
      
      const data = await this.fetchWithCache(
        `coinmarketcap/quotes?symbols=${symbols.join(',')}`
      );

      console.log(`✅ [Proxy] CoinMarketCap: ${Object.keys(data.data || {}).length} coins`);
      return this.transformCMCData(data.data);
    } catch (error) {
      console.error('❌ [Proxy] CoinMarketCap failed:', error);
      
      // Try CoinGecko fallback
      return this.getCoinGeckoFallback(symbols);
    }
  }

  /**
   * Get data from CoinGecko (via proxy - NO CORS!)
   */
  async getCoinGeckoData(symbols: string[] = ['BTC', 'ETH', 'BNB']): Promise<MarketData[]> {
    try {
      console.log('💎 [Proxy] Fetching CoinGecko data...');
      
      const ids = this.symbolsToIds(symbols);
      const data = await this.fetchWithCache(
        `coingecko/price?ids=${ids.join(',')}`
      );

      console.log(`✅ [Proxy] CoinGecko: ${Object.keys(data || {}).length} coins`);
      return this.transformCoinGeckoData(data);
    } catch (error) {
      console.error('❌ [Proxy] CoinGecko failed:', error);
      throw error;
    }
  }

  /**
   * CoinGecko fallback when CoinMarketCap fails
   */
  private async getCoinGeckoFallback(symbols: string[]): Promise<MarketData[]> {
    try {
      console.log('🔄 [Proxy] Trying CoinGecko fallback...');
      return await this.getCoinGeckoData(symbols);
    } catch (error) {
      console.error('❌ [Proxy] All market data sources failed');
      return [];
    }
  }

  // ========================================
  // SENTIMENT
  // ========================================

  /**
   * Get Fear & Greed Index (via proxy - NO CORS!)
   */
  async getFearGreedIndex(): Promise<{ value: number; classification: string }> {
    try {
      console.log('😨 [Proxy] Fetching Fear & Greed Index...');
      
      const data = await this.fetchWithCache('feargreed', 300000); // Cache for 5 minutes

      const value = parseInt(data.data[0].value);
      const classification = data.data[0].value_classification;

      console.log(`✅ [Proxy] Fear & Greed: ${value} (${classification})`);
      
      return { value, classification };
    } catch (error) {
      console.error('❌ [Proxy] Fear & Greed failed:', error);
      return { value: 50, classification: 'Neutral' };
    }
  }

  // ========================================
  // NEWS
  // ========================================

  /**
   * Get crypto news (via proxy - NO CORS!)
   */
  async getCryptoNews(query: string = 'cryptocurrency', pageSize: number = 20): Promise<NewsItem[]> {
    try {
      console.log('📰 [Proxy] Fetching crypto news...');
      
      const data = await this.fetchWithCache(
        `news/crypto?q=${encodeURIComponent(query)}&pageSize=${pageSize}`,
        300000 // Cache for 5 minutes
      );

      const articles = data.articles || [];
      console.log(`✅ [Proxy] News: ${articles.length} articles`);

      return this.transformNewsData(articles);
    } catch (error) {
      console.error('❌ [Proxy] News failed:', error);
      return [];
    }
  }

  // ========================================
  // WHALE TRACKING
  // ========================================

  /**
   * Get whale transactions (via proxy)
   */
  async getWhaleTransactions(minValue: number = 1000000): Promise<any[]> {
    try {
      console.log('🐋 [Proxy] Fetching whale transactions...');
      
      const end = Math.floor(Date.now() / 1000);
      const start = end - 3600;
      
      const data = await this.fetchWithCache(
        `whale-alert/transactions?min_value=${minValue}&start=${start}&end=${end}`,
        60000 // Cache for 1 minute
      );

      const transactions = data.transactions || [];
      console.log(`✅ [Proxy] Whales: ${transactions.length} transactions`);

      return transactions;
    } catch (error) {
      console.error('❌ [Proxy] Whale tracking failed:', error);
      return [];
    }
  }

  // ========================================
  // DATA TRANSFORMERS
  // ========================================

  private transformCMCData(data: any): MarketData[] {
    return Object.values(data || {}).map((coin: any) => ({
      id: coin.slug,
      symbol: coin.symbol,
      name: coin.name,
      price: coin.quote.USD.price,
      change24h: coin.quote.USD.price * (coin.quote.USD.percent_change_24h / 100),
      changePercent24h: coin.quote.USD.percent_change_24h,
      volume24h: coin.quote.USD.volume_24h,
      marketCap: coin.quote.USD.market_cap,
      high24h: coin.quote.USD.price * 1.05,
      low24h: coin.quote.USD.price * 0.95,
      timestamp: Date.now()
    }));
  }

  private transformCoinGeckoData(data: any): MarketData[] {
    const symbolMap: Record<string, string> = {
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

    return Object.entries(data || {}).map(([id, coin]: [string, any]) => ({
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

  private transformNewsData(articles: any[]): NewsItem[] {
    return articles.map((article, index) => ({
      id: `news-${index}`,
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source?.name || 'Unknown',
      publishedAt: article.publishedAt,
      sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
      impact: this.determineImpact(article.title)
    }));
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['bull', 'rise', 'gain', 'up', 'surge', 'rally', 'growth', 'adoption'];
    const negativeWords = ['bear', 'fall', 'drop', 'crash', 'decline', 'loss', 'hack', 'ban'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private determineImpact(title: string): 'high' | 'medium' | 'low' {
    const highImpactWords = ['etf', 'regulation', 'ban', 'hack', 'crash', 'surge', 'adoption'];
    const mediumImpactWords = ['price', 'market', 'trading', 'volume'];
    
    const lowerTitle = title.toLowerCase();
    
    if (highImpactWords.some(word => lowerTitle.includes(word))) return 'high';
    if (mediumImpactWords.some(word => lowerTitle.includes(word))) return 'medium';
    return 'low';
  }

  private symbolsToIds(symbols: string[]): string[] {
    const map: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'SOL': 'solana',
      'MATIC': 'polygon',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'LTC': 'litecoin',
      'XRP': 'ripple'
    };
    return symbols.map(s => map[s] || s.toLowerCase());
  }

  /**
   * Test proxy connection
   */
  async testProxyConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.PROXY_URL.replace('/api', '')}/health`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log('✅ Proxy server is running');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Proxy server not accessible');
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.requestCache.clear();
    console.log('📦 Cache cleared');
  }
}

export const proxyDataService = new ProxyDataService();

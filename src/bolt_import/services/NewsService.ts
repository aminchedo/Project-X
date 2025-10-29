/**
 * NewsService - Aggregate cryptocurrency news from multiple sources
 * 
 * Sources:
 * - NewsAPI (Primary)
 * - CryptoPanic (Fallback)
 * - Reddit (Additional)
 */

import { BaseApiService } from './BaseApiService';
import { API_CONFIG } from '../config/apiConfig';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: string;
  author?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export class NewsService extends BaseApiService {
  private cache: Map<string, { data: NewsArticle[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get latest cryptocurrency news
   */
  async getLatestNews(limit: number = 20): Promise<NewsArticle[]> {
    const cacheKey = `latest_${limit}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const news = await this.getNewsAPIArticles(limit);
      this.setCache(cacheKey, news);
      return news;
    } catch (error) {
      console.warn('NewsAPI failed, trying Reddit:', error);
      try {
        const news = await this.getRedditNews(limit);
        this.setCache(cacheKey, news);
        return news;
      } catch (fallbackError) {
        console.error('All news sources failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Search news with filters
   */
  async searchNews(
    query: string,
    fromDate?: string,
    toDate?: string,
    limit: number = 20
  ): Promise<NewsArticle[]> {
    const cacheKey = `search_${query}_${fromDate}_${toDate}_${limit}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const config = API_CONFIG.newsapi.primary;
      let endpoint = `/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}`;

      if (fromDate) {
        endpoint += `&from=${fromDate}`;
      }
      if (toDate) {
        endpoint += `&to=${toDate}`;
      }

      endpoint += `&apiKey=${config.key}`;

      const data = await this.request<any>(config, endpoint, {}, []);
      const news = this.transformNewsAPIData(data.articles);

      this.setCache(cacheKey, news);
      return news;
    } catch (error) {
      console.error('News search failed:', error);
      return [];
    }
  }

  /**
   * Get news for a specific coin
   */
  async getCoinNews(symbol: string, limit: number = 10): Promise<NewsArticle[]> {
    const cacheKey = `coin_${symbol}_${limit}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    const coinNames: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance',
      'ADA': 'Cardano',
      'SOL': 'Solana',
      'MATIC': 'Polygon',
      'DOT': 'Polkadot',
      'LINK': 'Chainlink',
      'LTC': 'Litecoin',
      'XRP': 'Ripple',
    };

    const coinName = coinNames[symbol] || symbol;
    const query = `${coinName} OR ${symbol}`;

    return await this.searchNews(query, undefined, undefined, limit);
  }

  /**
   * Get news from NewsAPI
   */
  private async getNewsAPIArticles(limit: number): Promise<NewsArticle[]> {
    const config = API_CONFIG.newsapi.primary;
    const query = 'cryptocurrency OR bitcoin OR ethereum OR crypto';
    const endpoint = `/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${limit}&apiKey=${config.key}`;

    const data = await this.request<any>(config, endpoint, {}, []);
    return this.transformNewsAPIData(data.articles);
  }

  /**
   * Transform NewsAPI data to standard format
   */
  private transformNewsAPIData(articles: any[]): NewsArticle[] {
    return articles.map((article, index) => ({
      id: `newsapi-${Date.now()}-${index}`,
      title: article.title,
      description: article.description || '',
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source?.name || 'Unknown',
      author: article.author,
      sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
    }));
  }

  /**
   * Get news from Reddit
   */
  private async getRedditNews(limit: number): Promise<NewsArticle[]> {
    const config = API_CONFIG.sentiment.reddit;
    const endpoint = `/r/CryptoCurrency/hot.json?limit=${limit}`;

    const data = await this.request<any>(config, endpoint, {}, []);
    return this.transformRedditData(data.data.children);
  }

  /**
   * Transform Reddit data to standard format
   */
  private transformRedditData(posts: any[]): NewsArticle[] {
    return posts.map((post: any) => ({
      id: `reddit-${post.data.id}`,
      title: post.data.title,
      description: post.data.selftext?.substring(0, 200) || '',
      url: `https://reddit.com${post.data.permalink}`,
      urlToImage: post.data.thumbnail && post.data.thumbnail.startsWith('http')
        ? post.data.thumbnail
        : undefined,
      publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
      source: 'Reddit',
      author: post.data.author,
      sentiment: this.analyzeSentiment(post.data.title),
    }));
  }

  /**
   * Analyze sentiment of text
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();

    const positiveWords = [
      'bull', 'bullish', 'rise', 'rising', 'gain', 'gains', 'up', 'surge',
      'surging', 'rally', 'rallying', 'growth', 'growing', 'adoption',
      'breakthrough', 'success', 'successful', 'profit', 'moon', 'pump',
      'green', 'high', 'higher', 'increase', 'increasing', 'positive'
    ];

    const negativeWords = [
      'bear', 'bearish', 'fall', 'falling', 'drop', 'dropping', 'crash',
      'crashing', 'decline', 'declining', 'loss', 'losses', 'hack', 'hacked',
      'ban', 'banned', 'regulation', 'scam', 'fraud', 'dump', 'red', 'low',
      'lower', 'decrease', 'decreasing', 'negative', 'risk', 'warning'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache(key: string): NewsArticle[] | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: NewsArticle[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const newsService = new NewsService();


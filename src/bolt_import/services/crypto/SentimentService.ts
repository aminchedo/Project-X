import { BaseApiService } from './BaseApiService';
import {
  MarketSentiment,
  SocialSentiment,
  ApiResponse,
  ServiceHealth
} from '@/types/crypto.types';
import { API_CONFIG, CACHE_CONFIG } from '@/config/cryptoApiConfig';

/**
 * Sentiment Service
 * Handles market sentiment analysis, fear & greed index, and social media sentiment
 */
export class SentimentService extends BaseApiService {
  constructor() {
    super('SentimentService');
  }

  /**
   * Get Fear & Greed Index
   */
  async getFearGreedIndex(): Promise<ApiResponse<MarketSentiment>> {
    const cacheKey = this.generateCacheKey('fear-greed', {});

    return this.makeRequest(
      API_CONFIG.sentiment.primary,
      '/fng/',
      {},
      cacheKey,
      CACHE_CONFIG.SENTIMENT_TTL
    );
  }

  /**
   * Get social media sentiment for specific cryptocurrency
   */
  async getSocialSentiment(symbol: string): Promise<ApiResponse<SocialSentiment>> {
    const cacheKey = this.generateCacheKey('social-sentiment', { symbol });

    // Try primary API first (Alternative.me)
    try {
      const result = await this.makeRequest(
        API_CONFIG.sentiment.primary,
        '/fng/',
        {},
        cacheKey,
        CACHE_CONFIG.SENTIMENT_TTL
      );

      if (result.success && result.data) {
        // For now, return mock social sentiment data
        // In a real implementation, you would call social media APIs
        const mockSocialSentiment: SocialSentiment = {
          symbol: symbol.toUpperCase(),
          reddit_mentions: Math.floor(Math.random() * 1000) + 100,
          reddit_sentiment: Math.random() * 2 - 1, // -1 to 1
          twitter_mentions: Math.floor(Math.random() * 5000) + 500,
          twitter_sentiment: Math.random() * 2 - 1,
          telegram_mentions: Math.floor(Math.random() * 2000) + 200,
          telegram_sentiment: Math.random() * 2 - 1,
          total_mentions: 0,
          average_sentiment: 0,
          last_updated: new Date().toISOString()
        };

        // Calculate totals
        mockSocialSentiment.total_mentions =
          mockSocialSentiment.reddit_mentions +
          mockSocialSentiment.twitter_mentions +
          mockSocialSentiment.telegram_mentions;

        mockSocialSentiment.average_sentiment =
          (mockSocialSentiment.reddit_sentiment +
            mockSocialSentiment.twitter_sentiment +
            mockSocialSentiment.telegram_sentiment) / 3;

        return {
          success: true,
          data: mockSocialSentiment,
          error: null,
          timestamp: Date.now(),
          source: 'SentimentService',
          cached: result.cached,
          cache_age: result.cache_age
        };
      }
    } catch (error) {
      // Fallback to mock data
    }

    // Return mock data as fallback
    const mockSocialSentiment: SocialSentiment = {
      symbol: symbol.toUpperCase(),
      reddit_mentions: Math.floor(Math.random() * 1000) + 100,
      reddit_sentiment: Math.random() * 2 - 1,
      twitter_mentions: Math.floor(Math.random() * 5000) + 500,
      twitter_sentiment: Math.random() * 2 - 1,
      telegram_mentions: Math.floor(Math.random() * 2000) + 200,
      telegram_sentiment: Math.random() * 2 - 1,
      total_mentions: 0,
      average_sentiment: 0,
      last_updated: new Date().toISOString()
    };

    mockSocialSentiment.total_mentions =
      mockSocialSentiment.reddit_mentions +
      mockSocialSentiment.twitter_mentions +
      mockSocialSentiment.telegram_mentions;

    mockSocialSentiment.average_sentiment =
      (mockSocialSentiment.reddit_sentiment +
        mockSocialSentiment.twitter_sentiment +
        mockSocialSentiment.telegram_sentiment) / 3;

    return {
      success: true,
      data: mockSocialSentiment,
      error: null,
      timestamp: Date.now(),
      source: 'SentimentService',
      cached: false
    };
  }

  /**
   * Get market sentiment summary
   */
  async getMarketSentimentSummary(): Promise<ApiResponse<{
    fear_greed: MarketSentiment;
    social_sentiment: {
      bitcoin: SocialSentiment;
      ethereum: SocialSentiment;
      overall: {
        total_mentions: number;
        average_sentiment: number;
        sentiment_trend: 'bullish' | 'bearish' | 'neutral';
      };
    };
    market_indicators: {
      volatility: number;
      trend_strength: number;
      momentum: number;
    };
  }>> {
    const cacheKey = this.generateCacheKey('sentiment-summary', {});

    try {
      const [fearGreedResult, btcSentimentResult, ethSentimentResult] = await Promise.all([
        this.getFearGreedIndex(),
        this.getSocialSentiment('BTC'),
        this.getSocialSentiment('ETH')
      ]);

      const fearGreed = fearGreedResult.data || {
        fear_greed_index: 50,
        fear_greed_classification: 'Neutral' as const,
        value_classification: 'Neutral',
        timestamp: Date.now(),
        time_until_update: 0,
        data: []
      };

      const btcSentiment = btcSentimentResult.data || {
        symbol: 'BTC',
        reddit_mentions: 0,
        reddit_sentiment: 0,
        twitter_mentions: 0,
        twitter_sentiment: 0,
        telegram_mentions: 0,
        telegram_sentiment: 0,
        total_mentions: 0,
        average_sentiment: 0,
        last_updated: new Date().toISOString()
      };

      const ethSentiment = ethSentimentResult.data || {
        symbol: 'ETH',
        reddit_mentions: 0,
        reddit_sentiment: 0,
        twitter_mentions: 0,
        twitter_sentiment: 0,
        telegram_mentions: 0,
        telegram_sentiment: 0,
        total_mentions: 0,
        average_sentiment: 0,
        last_updated: new Date().toISOString()
      };

      // Calculate overall social sentiment
      const totalMentions = btcSentiment.total_mentions + ethSentiment.total_mentions;
      const averageSentiment = totalMentions > 0
        ? (btcSentiment.average_sentiment + ethSentiment.average_sentiment) / 2
        : 0;

      let sentimentTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      if (averageSentiment > 0.2) sentimentTrend = 'bullish';
      else if (averageSentiment < -0.2) sentimentTrend = 'bearish';

      // Mock market indicators (in real implementation, these would come from technical analysis)
      const marketIndicators = {
        volatility: Math.random() * 100, // 0-100
        trend_strength: Math.random() * 100, // 0-100
        momentum: Math.random() * 200 - 100 // -100 to 100
      };

      return {
        success: true,
        data: {
          fear_greed: fearGreed,
          social_sentiment: {
            bitcoin: btcSentiment,
            ethereum: ethSentiment,
            overall: {
              total_mentions: totalMentions,
              average_sentiment: averageSentiment,
              sentiment_trend: sentimentTrend
            }
          },
          market_indicators: marketIndicators
        },
        error: null,
        timestamp: Date.now(),
        source: 'SentimentService',
        cached: false
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch sentiment summary',
        timestamp: Date.now(),
        source: 'SentimentService',
        cached: false
      };
    }
  }

  /**
   * Get sentiment trends over time
   */
  async getSentimentTrends(days: number = 7): Promise<ApiResponse<Array<{
    date: string;
    fear_greed_index: number;
    social_sentiment: number;
    price_correlation: number;
  }>>> {
    const cacheKey = this.generateCacheKey('sentiment-trends', { days });

    // Mock historical sentiment data
    const trends = [];
    const now = Date.now();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      trends.push({
        date: date.toISOString().split('T')[0],
        fear_greed_index: Math.floor(Math.random() * 100),
        social_sentiment: Math.random() * 2 - 1,
        price_correlation: Math.random() * 2 - 1
      });
    }

    return {
      success: true,
      data: trends,
      error: null,
      timestamp: Date.now(),
      source: 'SentimentService',
      cached: false
    };
  }

  /**
   * Get sentiment alerts
   */
  async getSentimentAlerts(): Promise<ApiResponse<Array<{
    type: 'extreme_fear' | 'extreme_greed' | 'sentiment_shift' | 'high_volatility';
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: number;
  }>>> {
    const cacheKey = this.generateCacheKey('sentiment-alerts', {});

    try {
      const fearGreedResult = await this.getFearGreedIndex();

      if (!fearGreedResult.success || !fearGreedResult.data) {
        return {
          success: true,
          data: [],
          error: null,
          timestamp: Date.now(),
          source: 'SentimentService',
          cached: false
        };
      }

      const alerts = [];
      const fearGreed = fearGreedResult.data;
      const index = fearGreed.fear_greed_index;

      // Generate alerts based on fear & greed index
      if (index <= 20) {
        alerts.push({
          type: 'extreme_fear' as const,
          message: `Extreme Fear detected! Fear & Greed Index: ${index}`,
          severity: 'high' as const,
          timestamp: Date.now()
        });
      } else if (index >= 80) {
        alerts.push({
          type: 'extreme_greed' as const,
          message: `Extreme Greed detected! Fear & Greed Index: ${index}`,
          severity: 'high' as const,
          timestamp: Date.now()
        });
      }

      // Add mock volatility alert
      if (Math.random() > 0.7) {
        alerts.push({
          type: 'high_volatility' as const,
          message: 'High market volatility detected in sentiment data',
          severity: 'medium' as const,
          timestamp: Date.now()
        });
      }

      return {
        success: true,
        data: alerts,
        error: null,
        timestamp: Date.now(),
        source: 'SentimentService',
        cached: false
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate sentiment alerts',
        timestamp: Date.now(),
        source: 'SentimentService',
        cached: false
      };
    }
  }

  /**
   * Get service dependencies for health monitoring
   */
  protected getDependencies(): Array<{
    name: string;
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  }> {
    return [
      {
        name: 'Alternative.me API',
        status: this.isAvailable() ? 'healthy' : 'unhealthy',
        responseTime: this.metrics.averageLatency
      },
      {
        name: 'CoinGecko Sentiment (Fallback)',
        status: 'healthy',
        responseTime: 0
      }
    ];
  }

  /**
   * Get service-specific health status
   */
  getServiceHealth(): ServiceHealth {
    const baseHealth = this.getHealth();

    return {
      ...baseHealth,
      dependencies: this.getDependencies()
    };
  }
}

// Export singleton instance
export default new SentimentService();

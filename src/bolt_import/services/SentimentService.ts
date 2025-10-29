/**
 * SentimentService - Analyze market sentiment from multiple sources
 * 
 * Sources:
 * - Alternative.me Fear & Greed Index
 * - Reddit sentiment analysis
 * - CoinGecko community data
 */

import { BaseApiService } from './BaseApiService';
import { API_CONFIG } from '../config/apiConfig';

export interface SentimentData {
  overall: number; // 0-100 scale
  fearGreed: {
    value: number;
    classification: string;
  };
  reddit: {
    score: number;
    posts: number;
  };
  coinGecko?: {
    score: number;
    metrics: any;
  };
  timestamp: number;
}

export class SentimentService extends BaseApiService {
  /**
   * Get Fear & Greed Index
   */
  async getFearGreedIndex(): Promise<{ value: number; classification: string }> {
    try {
      const config = API_CONFIG.sentiment.fearGreed;
      const endpoint = '/?limit=1&format=json';

      const data = await this.request<any>(config, endpoint, {}, []);

      return {
        value: parseInt(data.data[0].value),
        classification: data.data[0].value_classification,
      };
    } catch (error) {
      console.error('Fear & Greed Index failed:', error);
      return { value: 50, classification: 'Neutral' };
    }
  }

  /**
   * Get Reddit sentiment
   */
  async getRedditSentiment(subreddit: string = 'CryptoCurrency', limit: number = 25): Promise<{
    score: number;
    posts: number;
    topPosts: any[];
  }> {
    try {
      const config = API_CONFIG.sentiment.reddit;
      const endpoint = `/r/${subreddit}/hot.json?limit=${limit}`;

      const data = await this.request<any>(config, endpoint, {}, []);
      const posts = data.data.children;

      // Calculate average sentiment score from upvote ratios
      let totalScore = 0;
      posts.forEach((post: any) => {
        const upvoteRatio = post.data.upvote_ratio || 0.5;
        const score = post.data.score || 0;

        // Normalize to 0-100 scale
        const sentimentScore = (upvoteRatio * 50) + (Math.min(score / 100, 1) * 50);
        totalScore += sentimentScore;
      });

      const averageScore = posts.length > 0 ? totalScore / posts.length : 50;

      return {
        score: Math.round(averageScore),
        posts: posts.length,
        topPosts: posts.slice(0, 5).map((post: any) => ({
          title: post.data.title,
          score: post.data.score,
          upvoteRatio: post.data.upvote_ratio,
          url: `https://reddit.com${post.data.permalink}`,
        })),
      };
    } catch (error) {
      console.error('Reddit sentiment failed:', error);
      return { score: 50, posts: 0, topPosts: [] };
    }
  }

  /**
   * Get CoinGecko community sentiment
   */
  async getCoinGeckoSentiment(coinId: string = 'bitcoin'): Promise<{
    score: number;
    metrics: any;
  }> {
    try {
      const config = API_CONFIG.sentiment.coingecko;
      const endpoint = `/coins/${coinId}?community_data=true&developer_data=false&sparkline=false`;

      const data = await this.request<any>(config, endpoint, {}, []);

      const communityData = data.community_data || {};

      // Calculate sentiment score from community metrics
      const twitterFollowers = communityData.twitter_followers || 0;
      const redditSubscribers = communityData.reddit_subscribers || 0;
      const telegramUsers = communityData.telegram_channel_user_count || 0;

      // Normalize metrics (higher = better sentiment)
      const twitterScore = Math.min(twitterFollowers / 10000, 1) * 33;
      const redditScore = Math.min(redditSubscribers / 10000, 1) * 33;
      const telegramScore = Math.min(telegramUsers / 10000, 1) * 34;

      const score = Math.round(twitterScore + redditScore + telegramScore);

      return {
        score: Math.max(30, Math.min(score, 70)), // Keep between 30-70 for realism
        metrics: {
          twitterFollowers,
          redditSubscribers,
          telegramUsers,
        },
      };
    } catch (error) {
      console.error('CoinGecko sentiment failed:', error);
      return { score: 50, metrics: {} };
    }
  }

  /**
   * Get aggregated sentiment from all sources
   */
  async getAggregatedSentiment(symbol: string = 'BTC'): Promise<SentimentData> {
    try {
      // Fetch all sentiment sources in parallel
      const [fearGreed, reddit, coinGecko] = await Promise.allSettled([
        this.getFearGreedIndex(),
        this.getRedditSentiment('CryptoCurrency', 25),
        this.getCoinGeckoSentiment(this.symbolToCoinGeckoId(symbol)),
      ]);

      const fearGreedData = fearGreed.status === 'fulfilled'
        ? fearGreed.value
        : { value: 50, classification: 'Neutral' };

      const redditData = reddit.status === 'fulfilled'
        ? reddit.value
        : { score: 50, posts: 0, topPosts: [] };

      const coinGeckoData = coinGecko.status === 'fulfilled'
        ? coinGecko.value
        : { score: 50, metrics: {} };

      // Calculate weighted average
      // Fear & Greed: 40%, Reddit: 30%, CoinGecko: 30%
      const overall = Math.round(
        (fearGreedData.value * 0.4) +
        (redditData.score * 0.3) +
        (coinGeckoData.score * 0.3)
      );

      return {
        overall,
        fearGreed: fearGreedData,
        reddit: {
          score: redditData.score,
          posts: redditData.posts,
        },
        coinGecko: {
          score: coinGeckoData.score,
          metrics: coinGeckoData.metrics,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Aggregated sentiment failed:', error);

      // Return neutral sentiment on error
      return {
        overall: 50,
        fearGreed: { value: 50, classification: 'Neutral' },
        reddit: { score: 50, posts: 0 },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Convert symbol to CoinGecko ID
   */
  private symbolToCoinGeckoId(symbol: string): string {
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
      'XRP': 'ripple',
    };

    return map[symbol] || symbol.toLowerCase();
  }

  /**
   * Get sentiment classification from score
   */
  getSentimentClassification(score: number): string {
    if (score <= 20) return 'Extreme Fear';
    if (score <= 40) return 'Fear';
    if (score <= 60) return 'Neutral';
    if (score <= 80) return 'Greed';
    return 'Extreme Greed';
  }

  /**
   * Get sentiment color for UI
   */
  getSentimentColor(score: number): string {
    if (score <= 25) return '#ef4444'; // red
    if (score <= 45) return '#f97316'; // orange
    if (score <= 55) return '#eab308'; // yellow
    if (score <= 75) return '#22c55e'; // green
    return '#3b82f6'; // blue
  }
}

// Export singleton instance
export const sentimentService = new SentimentService();


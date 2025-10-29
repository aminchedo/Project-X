import { BaseApiService } from './BaseApiService';
import {
    NewsArticle,
    ApiResponse,
    ServiceHealth
} from '@/types/crypto.types';
import { API_CONFIG, CACHE_CONFIG } from '@/config/cryptoApiConfig';

/**
 * News Service
 * Handles cryptocurrency news, market sentiment, and social media data
 */
export class NewsService extends BaseApiService {
    constructor() {
        super('NewsService');
    }

    /**
     * Get latest cryptocurrency news
     */
    async getLatestNews(limit: number = 20): Promise<ApiResponse<NewsArticle[]>> {
        const cacheKey = this.generateCacheKey('latest-news', { limit });

        return this.makeRequest(
            API_CONFIG.news.primary,
            '/everything',
            {
                q: 'cryptocurrency OR bitcoin OR ethereum OR crypto',
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: limit,
                from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
            },
            cacheKey,
            CACHE_CONFIG.NEWS_TTL
        );
    }

    /**
     * Get news for specific cryptocurrency
     */
    async getNewsForCryptocurrency(
        symbol: string,
        limit: number = 10
    ): Promise<ApiResponse<NewsArticle[]>> {
        const cacheKey = this.generateCacheKey('crypto-news', { symbol, limit });

        return this.makeRequest(
            API_CONFIG.news.primary,
            '/everything',
            {
                q: `${symbol} cryptocurrency`,
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: limit,
                from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Last 3 days
            },
            cacheKey,
            CACHE_CONFIG.NEWS_TTL
        );
    }

    /**
     * Get market sentiment news
     */
    async getMarketSentimentNews(limit: number = 15): Promise<ApiResponse<NewsArticle[]>> {
        const cacheKey = this.generateCacheKey('sentiment-news', { limit });

        return this.makeRequest(
            API_CONFIG.news.primary,
            '/everything',
            {
                q: 'cryptocurrency market sentiment OR crypto market analysis OR bitcoin price prediction',
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: limit,
                from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
            },
            cacheKey,
            CACHE_CONFIG.NEWS_TTL
        );
    }

    /**
     * Get regulatory news
     */
    async getRegulatoryNews(limit: number = 10): Promise<ApiResponse<NewsArticle[]>> {
        const cacheKey = this.generateCacheKey('regulatory-news', { limit });

        return this.makeRequest(
            API_CONFIG.news.primary,
            '/everything',
            {
                q: 'cryptocurrency regulation OR crypto regulation OR bitcoin regulation OR SEC crypto',
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: limit,
                from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
            },
            cacheKey,
            CACHE_CONFIG.NEWS_TTL
        );
    }

    /**
     * Get technology news
     */
    async getTechnologyNews(limit: number = 10): Promise<ApiResponse<NewsArticle[]>> {
        const cacheKey = this.generateCacheKey('tech-news', { limit });

        return this.makeRequest(
            API_CONFIG.news.primary,
            '/everything',
            {
                q: 'blockchain technology OR DeFi OR NFT OR Web3 OR cryptocurrency technology',
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: limit,
                from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // Last 3 days
            },
            cacheKey,
            CACHE_CONFIG.NEWS_TTL
        );
    }

    /**
     * Search news by keyword
     */
    async searchNews(
        query: string,
        limit: number = 20
    ): Promise<ApiResponse<NewsArticle[]>> {
        const cacheKey = this.generateCacheKey('search-news', { query, limit });

        return this.makeRequest(
            API_CONFIG.news.primary,
            '/everything',
            {
                q: `${query} cryptocurrency OR ${query} crypto`,
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: limit,
                from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
            },
            cacheKey,
            CACHE_CONFIG.NEWS_TTL
        );
    }

    /**
     * Get news from specific sources
     */
    async getNewsFromSources(
        sources: string[],
        limit: number = 15
    ): Promise<ApiResponse<NewsArticle[]>> {
        const cacheKey = this.generateCacheKey('source-news', { sources: sources.join(','), limit });

        return this.makeRequest(
            API_CONFIG.news.primary,
            '/everything',
            {
                sources: sources.join(','),
                q: 'cryptocurrency OR bitcoin OR crypto',
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: limit,
                from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
            },
            cacheKey,
            CACHE_CONFIG.NEWS_TTL
        );
    }

    /**
     * Get trending news topics
     */
    async getTrendingTopics(): Promise<ApiResponse<Array<{
        topic: string;
        articleCount: number;
        latestArticle: NewsArticle;
    }>>> {
        const topics = [
            'bitcoin',
            'ethereum',
            'defi',
            'nft',
            'web3',
            'blockchain',
            'cryptocurrency regulation',
            'crypto market'
        ];

        const trendingData: Array<{
            topic: string;
            articleCount: number;
            latestArticle: NewsArticle;
        }> = [];

        for (const topic of topics) {
            try {
                const result = await this.searchNews(topic, 5);
                if (result.success && result.data && result.data.length > 0) {
                    trendingData.push({
                        topic,
                        articleCount: result.data.length,
                        latestArticle: result.data[0]
                    });
                }
            } catch (error) {
                // Skip failed topics
                continue;
            }
        }

        return {
            success: true,
            data: trendingData,
            error: null,
            timestamp: Date.now(),
            source: 'NewsService',
            cached: false
        };
    }

    /**
     * Get news summary for dashboard
     */
    async getNewsSummary(): Promise<ApiResponse<{
        latest: NewsArticle[];
        trending: Array<{
            topic: string;
            articleCount: number;
            latestArticle: NewsArticle;
        }>;
        regulatory: NewsArticle[];
        technology: NewsArticle[];
    }>> {
        try {
            const [latestResult, trendingResult, regulatoryResult, techResult] = await Promise.all([
                this.getLatestNews(10),
                this.getTrendingTopics(),
                this.getRegulatoryNews(5),
                this.getTechnologyNews(5)
            ]);

            return {
                success: true,
                data: {
                    latest: latestResult.data || [],
                    trending: trendingResult.data || [],
                    regulatory: regulatoryResult.data || [],
                    technology: techResult.data || []
                },
                error: null,
                timestamp: Date.now(),
                source: 'NewsService',
                cached: false
            };
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Failed to fetch news summary',
                timestamp: Date.now(),
                source: 'NewsService',
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
                name: 'NewsAPI',
                status: this.isAvailable() ? 'healthy' : 'unhealthy',
                responseTime: this.metrics.averageLatency
            },
            {
                name: 'CryptoPanic (Fallback)',
                status: 'healthy', // Assume healthy unless proven otherwise
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
export default new NewsService();

import { BaseApiService } from './BaseApiService';
import {
    CryptoPrice,
    MarketOverview,
    PriceChartData,
    TimeRange,
    ApiResponse,
    ServiceHealth
} from '@/types/crypto.types';
import { API_CONFIG, CACHE_CONFIG } from '@/config/cryptoApiConfig';

/**
 * Market Data Service
 * Handles cryptocurrency price data, market overview, and historical data
 */
export class MarketDataService extends BaseApiService {
    constructor() {
        super('MarketDataService');
    }

    /**
     * Get current prices for multiple cryptocurrencies
     */
    async getPrices(symbols: string[]): Promise<ApiResponse<CryptoPrice[]>> {
        const cacheKey = this.generateCacheKey('prices', { symbols: symbols.join(',') });

        return this.makeRequest(
            API_CONFIG.marketData.primary,
            '/cryptocurrency/quotes/latest',
            {
                symbol: symbols.join(','),
                convert: 'USD'
            },
            cacheKey,
            CACHE_CONFIG.PRICES_TTL
        );
    }

    /**
     * Get price for a single cryptocurrency
     */
    async getPrice(symbol: string): Promise<ApiResponse<CryptoPrice>> {
        const result = await this.getPrices([symbol]);

        if (result.success && result.data && result.data.length > 0) {
            return {
                ...result,
                data: result.data[0]
            };
        }

        return {
            success: false,
            data: null,
            error: 'Price data not found',
            timestamp: Date.now(),
            source: 'MarketDataService',
            cached: false
        };
    }

    /**
     * Get market overview data
     */
    async getMarketOverview(): Promise<ApiResponse<MarketOverview>> {
        const cacheKey = this.generateCacheKey('market-overview', {});

        return this.makeRequest(
            API_CONFIG.marketData.primary,
            '/global-metrics/quotes/latest',
            { convert: 'USD' },
            cacheKey,
            CACHE_CONFIG.PRICES_TTL
        );
    }

    /**
     * Get historical price data for charting
     */
    async getHistoricalData(
        symbol: string,
        timeRange: TimeRange
    ): Promise<ApiResponse<PriceChartData>> {
        const cacheKey = this.generateCacheKey('historical', { symbol, timeRange });

        // Map time range to API parameters
        const timeRangeMap: Record<TimeRange, { count: number; interval: string }> = {
            '1h': { count: 60, interval: '1m' },
            '4h': { count: 240, interval: '1m' },
            '1d': { count: 24, interval: '1h' },
            '7d': { count: 168, interval: '1h' },
            '30d': { count: 30, interval: '1d' },
            '90d': { count: 90, interval: '1d' },
            '1y': { count: 365, interval: '1d' }
        };

        const { count, interval } = timeRangeMap[timeRange];

        return this.makeRequest(
            API_CONFIG.marketData.primary,
            '/cryptocurrency/quotes/historical',
            {
                symbol,
                count,
                interval,
                convert: 'USD'
            },
            cacheKey,
            CACHE_CONFIG.HISTORICAL_TTL
        );
    }

    /**
     * Get top cryptocurrencies by market cap
     */
    async getTopCryptocurrencies(limit: number = 100): Promise<ApiResponse<CryptoPrice[]>> {
        const cacheKey = this.generateCacheKey('top-crypto', { limit });

        return this.makeRequest(
            API_CONFIG.marketData.primary,
            '/cryptocurrency/listings/latest',
            {
                start: 1,
                limit,
                convert: 'USD',
                sort: 'market_cap',
                sort_dir: 'desc'
            },
            cacheKey,
            CACHE_CONFIG.PRICES_TTL
        );
    }

    /**
     * Get trending cryptocurrencies
     */
    async getTrendingCryptocurrencies(): Promise<ApiResponse<CryptoPrice[]>> {
        const cacheKey = this.generateCacheKey('trending-crypto', {});

        return this.makeRequest(
            API_CONFIG.marketData.primary,
            '/cryptocurrency/trending/most-visited',
            { convert: 'USD' },
            cacheKey,
            CACHE_CONFIG.PRICES_TTL
        );
    }

    /**
     * Get cryptocurrency details by ID
     */
    async getCryptocurrencyDetails(id: string): Promise<ApiResponse<CryptoPrice>> {
        const cacheKey = this.generateCacheKey('crypto-details', { id });

        return this.makeRequest(
            API_CONFIG.marketData.primary,
            '/cryptocurrency/quotes/latest',
            {
                id,
                convert: 'USD'
            },
            cacheKey,
            CACHE_CONFIG.PRICES_TTL
        );
    }

    /**
     * Search cryptocurrencies by name or symbol
     */
    async searchCryptocurrencies(query: string): Promise<ApiResponse<CryptoPrice[]>> {
        const cacheKey = this.generateCacheKey('search-crypto', { query });

        return this.makeRequest(
            API_CONFIG.marketData.primary,
            '/cryptocurrency/quotes/latest',
            {
                symbol: query.toUpperCase(),
                convert: 'USD'
            },
            cacheKey,
            CACHE_CONFIG.PRICES_TTL
        );
    }

    /**
     * Get price change data for multiple cryptocurrencies
     */
    async getPriceChanges(symbols: string[]): Promise<ApiResponse<Record<string, {
        price: number;
        change_24h: number;
        change_percentage_24h: number;
    }>>> {
        const result = await this.getPrices(symbols);

        if (!result.success || !result.data) {
            return {
                success: false,
                data: null,
                error: result.error || 'Failed to fetch price changes',
                timestamp: Date.now(),
                source: 'MarketDataService',
                cached: false
            };
        }

        const priceChanges: Record<string, {
            price: number;
            change_24h: number;
            change_percentage_24h: number;
        }> = {};

        result.data.forEach(crypto => {
            priceChanges[crypto.symbol] = {
                price: crypto.current_price,
                change_24h: crypto.price_change_24h,
                change_percentage_24h: crypto.price_change_percentage_24h
            };
        });

        return {
            success: true,
            data: priceChanges,
            error: null,
            timestamp: Date.now(),
            source: 'MarketDataService',
            cached: result.cached,
            cache_age: result.cache_age
        };
    }

    /**
     * Get market cap rankings
     */
    async getMarketCapRankings(limit: number = 50): Promise<ApiResponse<Array<{
        rank: number;
        symbol: string;
        name: string;
        market_cap: number;
        price: number;
    }>>> {
        const result = await this.getTopCryptocurrencies(limit);

        if (!result.success || !result.data) {
            return {
                success: false,
                data: null,
                error: result.error || 'Failed to fetch market cap rankings',
                timestamp: Date.now(),
                source: 'MarketDataService',
                cached: false
            };
        }

        const rankings = result.data.map(crypto => ({
            rank: crypto.market_cap_rank,
            symbol: crypto.symbol,
            name: crypto.name,
            market_cap: crypto.market_cap,
            price: crypto.current_price
        }));

        return {
            success: true,
            data: rankings,
            error: null,
            timestamp: Date.now(),
            source: 'MarketDataService',
            cached: result.cached,
            cache_age: result.cache_age
        };
    }

    /**
     * Get service dependencies for health monitoring
     */
    protected getDependencies(): Array<{
        name: string;
        status: 'healthy' | 'unhealthy';
        responseTime: number;
    }> {
        const dependencies = [
            {
                name: 'CoinMarketCap API',
                status: this.isAvailable() ? 'healthy' : 'unhealthy',
                responseTime: this.metrics.averageLatency
            }
        ];

        // Add fallback dependencies
        API_CONFIG.marketData.fallbacks.forEach(fallback => {
            dependencies.push({
                name: fallback.name,
                status: 'healthy', // Assume healthy unless proven otherwise
                responseTime: 0
            });
        });

        return dependencies;
    }

    /**
     * Get service-specific health status
     */
    getServiceHealth(): ServiceHealth {
        const baseHealth = this.getHealth();

        // Add market data specific health checks
        const additionalChecks = {
            ...baseHealth,
            dependencies: this.getDependencies()
        };

        return additionalChecks;
    }
}

// Export singleton instance
export default new MarketDataService();

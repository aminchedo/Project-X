import { BaseApiService } from './BaseApiService';
import {
  WhaleTransaction,
  WhaleAlert,
  ApiResponse,
  ServiceHealth
} from '@/types/crypto.types';
import { API_CONFIG, CACHE_CONFIG } from '@/config/cryptoApiConfig';

/**
 * Whale Tracking Service
 * Monitors large cryptocurrency transactions and whale movements
 */
export class WhaleTrackingService extends BaseApiService {
  constructor() {
    super('WhaleTrackingService');
  }

  /**
   * Get recent whale transactions
   */
  async getRecentWhaleTransactions(
    limit: number = 50,
    minValue: number = 1000000 // $1M minimum
  ): Promise<ApiResponse<WhaleTransaction[]>> {
    const cacheKey = this.generateCacheKey('whale-transactions', { limit, minValue });

    return this.makeRequest(
      API_CONFIG.whaleTracking.primary,
      '/transactions',
      {
        min_value: minValue,
        limit,
        api_key: API_CONFIG.whaleTracking.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.PRICES_TTL // Use shorter TTL for whale data
    );
  }

  /**
   * Get whale transactions for specific cryptocurrency
   */
  async getWhaleTransactionsForCrypto(
    currency: string,
    limit: number = 20
  ): Promise<ApiResponse<WhaleTransaction[]>> {
    const cacheKey = this.generateCacheKey('whale-crypto', { currency, limit });

    return this.makeRequest(
      API_CONFIG.whaleTracking.primary,
      '/transactions',
      {
        currency,
        limit,
        api_key: API_CONFIG.whaleTracking.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.PRICES_TTL
    );
  }

  /**
   * Get whale alerts summary
   */
  async getWhaleAlertsSummary(): Promise<ApiResponse<{
    total_alerts: number;
    total_volume_usd: number;
    top_currencies: Array<{
      currency: string;
      count: number;
      volume_usd: number;
    }>;
    recent_alerts: WhaleAlert[];
  }>> {
    const cacheKey = this.generateCacheKey('whale-summary', {});

    try {
      const result = await this.makeRequest(
        API_CONFIG.whaleTracking.primary,
        '/transactions',
        {
          limit: 100,
          api_key: API_CONFIG.whaleTracking.primary.getKey()
        },
        cacheKey,
        CACHE_CONFIG.PRICES_TTL
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          data: null,
          error: result.error || 'Failed to fetch whale alerts',
          timestamp: Date.now(),
          source: 'WhaleTrackingService',
          cached: false
        };
      }

      const transactions = result.data as WhaleTransaction[];

      // Process data to create summary
      const currencyStats: Record<string, { count: number; volume: number }> = {};
      let totalVolume = 0;

      transactions.forEach(tx => {
        const currency = tx.currency;
        if (!currencyStats[currency]) {
          currencyStats[currency] = { count: 0, volume: 0 };
        }
        currencyStats[currency].count++;
        currencyStats[currency].volume += tx.amount_usd;
        totalVolume += tx.amount_usd;
      });

      const topCurrencies = Object.entries(currencyStats)
        .map(([currency, stats]) => ({
          currency,
          count: stats.count,
          volume_usd: stats.volume
        }))
        .sort((a, b) => b.volume_usd - a.volume_usd)
        .slice(0, 10);

      const recentAlerts: WhaleAlert[] = transactions.slice(0, 10).map(tx => ({
        id: tx.id,
        currency: tx.currency,
        amount: tx.amount,
        amount_usd: tx.amount_usd,
        transaction_type: tx.transaction_type,
        from_owner: tx.from.owner,
        to_owner: tx.to.owner,
        timestamp: tx.timestamp,
        hash: tx.hash,
        blockchain: 'unknown' // Would need additional API call to determine
      }));

      return {
        success: true,
        data: {
          total_alerts: transactions.length,
          total_volume_usd: totalVolume,
          top_currencies: topCurrencies,
          recent_alerts: recentAlerts
        },
        error: null,
        timestamp: Date.now(),
        source: 'WhaleTrackingService',
        cached: result.cached,
        cache_age: result.cache_age
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to process whale alerts',
        timestamp: Date.now(),
        source: 'WhaleTrackingService',
        cached: false
      };
    }
  }

  /**
   * Get whale transactions by blockchain
   */
  async getWhaleTransactionsByBlockchain(
    blockchain: string,
    limit: number = 30
  ): Promise<ApiResponse<WhaleTransaction[]>> {
    const cacheKey = this.generateCacheKey('whale-blockchain', { blockchain, limit });

    return this.makeRequest(
      API_CONFIG.whaleTracking.primary,
      '/transactions',
      {
        blockchain,
        limit,
        api_key: API_CONFIG.whaleTracking.primary.getKey()
      },
      cacheKey,
      CACHE_CONFIG.PRICES_TTL
    );
  }

  /**
   * Get exchange whale movements
   */
  async getExchangeWhaleMovements(
    limit: number = 25
  ): Promise<ApiResponse<WhaleTransaction[]>> {
    const cacheKey = this.generateCacheKey('exchange-whales', { limit });

    try {
      const result = await this.makeRequest(
        API_CONFIG.whaleTracking.primary,
        '/transactions',
        {
          limit: 100,
          api_key: API_CONFIG.whaleTracking.primary.getKey()
        },
        cacheKey,
        CACHE_CONFIG.PRICES_TTL
      );

      if (!result.success || !result.data) {
        return result;
      }

      const transactions = result.data as WhaleTransaction[];

      // Filter for exchange-related transactions
      const exchangeTransactions = transactions.filter(tx =>
        tx.from.owner_type === 'exchange' || tx.to.owner_type === 'exchange'
      ).slice(0, limit);

      return {
        success: true,
        data: exchangeTransactions,
        error: null,
        timestamp: Date.now(),
        source: 'WhaleTrackingService',
        cached: result.cached,
        cache_age: result.cache_age
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch exchange whale movements',
        timestamp: Date.now(),
        source: 'WhaleTrackingService',
        cached: false
      };
    }
  }

  /**
   * Get whale transaction statistics
   */
  async getWhaleStatistics(): Promise<ApiResponse<{
    total_transactions: number;
    total_volume_usd: number;
    average_transaction_size: number;
    largest_transaction: WhaleTransaction | null;
    top_exchanges: Array<{
      name: string;
      transaction_count: number;
      volume_usd: number;
    }>;
    hourly_distribution: Array<{
      hour: number;
      count: number;
      volume_usd: number;
    }>;
  }>> {
    const cacheKey = this.generateCacheKey('whale-stats', {});

    try {
      const result = await this.makeRequest(
        API_CONFIG.whaleTracking.primary,
        '/transactions',
        {
          limit: 1000,
          api_key: API_CONFIG.whaleTracking.primary.getKey()
        },
        cacheKey,
        CACHE_CONFIG.PRICES_TTL
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          data: null,
          error: result.error || 'Failed to fetch whale statistics',
          timestamp: Date.now(),
          source: 'WhaleTrackingService',
          cached: false
        };
      }

      const transactions = result.data as WhaleTransaction[];

      // Calculate statistics
      const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount_usd, 0);
      const averageSize = transactions.length > 0 ? totalVolume / transactions.length : 0;
      const largestTransaction = transactions.reduce((largest, tx) =>
        tx.amount_usd > largest.amount_usd ? tx : largest, transactions[0]
      );

      // Exchange statistics
      const exchangeStats: Record<string, { count: number; volume: number }> = {};
      transactions.forEach(tx => {
        if (tx.from.owner_type === 'exchange' && tx.from.owner) {
          const exchange = tx.from.owner;
          if (!exchangeStats[exchange]) {
            exchangeStats[exchange] = { count: 0, volume: 0 };
          }
          exchangeStats[exchange].count++;
          exchangeStats[exchange].volume += tx.amount_usd;
        }
        if (tx.to.owner_type === 'exchange' && tx.to.owner) {
          const exchange = tx.to.owner;
          if (!exchangeStats[exchange]) {
            exchangeStats[exchange] = { count: 0, volume: 0 };
          }
          exchangeStats[exchange].count++;
          exchangeStats[exchange].volume += tx.amount_usd;
        }
      });

      const topExchanges = Object.entries(exchangeStats)
        .map(([name, stats]) => ({
          name,
          transaction_count: stats.count,
          volume_usd: stats.volume
        }))
        .sort((a, b) => b.volume_usd - a.volume_usd)
        .slice(0, 10);

      // Hourly distribution
      const hourlyStats: Record<number, { count: number; volume: number }> = {};
      transactions.forEach(tx => {
        const hour = new Date(tx.timestamp * 1000).getHours();
        if (!hourlyStats[hour]) {
          hourlyStats[hour] = { count: 0, volume: 0 };
        }
        hourlyStats[hour].count++;
        hourlyStats[hour].volume += tx.amount_usd;
      });

      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: hourlyStats[hour]?.count || 0,
        volume_usd: hourlyStats[hour]?.volume || 0
      }));

      return {
        success: true,
        data: {
          total_transactions: transactions.length,
          total_volume_usd: totalVolume,
          average_transaction_size: averageSize,
          largest_transaction: largestTransaction,
          top_exchanges: topExchanges,
          hourly_distribution: hourlyDistribution
        },
        error: null,
        timestamp: Date.now(),
        source: 'WhaleTrackingService',
        cached: result.cached,
        cache_age: result.cache_age
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to calculate whale statistics',
        timestamp: Date.now(),
        source: 'WhaleTrackingService',
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
        name: 'WhaleAlert API',
        status: this.isAvailable() ? 'healthy' : 'unhealthy',
        responseTime: this.metrics.averageLatency
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
export default new WhaleTrackingService();

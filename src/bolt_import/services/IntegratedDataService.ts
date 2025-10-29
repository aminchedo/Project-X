/**
 * Integrated Data Service
 * 
 * Combines Universal API Service with existing services
 * Provides unified interface for all data needs
 */

import { universalAPIService } from './UniversalAPIService';
import { realDataService } from './realDataService';

class IntegratedDataService {
  // ========================================
  // MARKET DATA
  // ========================================

  /**
   * Get comprehensive market data from multiple sources
   */
  async getMarketData(symbols: string[] = ['BTC', 'ETH', 'BNB']): Promise<any> {
    console.log('📊 Fetching market data from multiple sources...');
    
    try {
      // Try Universal API Service first (multiple providers)
      const data = await universalAPIService.getCryptoPrices(symbols);
      console.log('✅ Market data from Universal API');
      return data;
    } catch (error) {
      console.warn('⚠️ Universal API failed, trying legacy service...');
      
      // Fallback to existing realDataService
      try {
        const legacyData = await realDataService.getCoinMarketCapData();
        console.log('✅ Market data from legacy service');
        return this.normalizeLegacyMarketData(legacyData);
      } catch (legacyError) {
        console.error('❌ All market data sources failed');
        throw new Error('Unable to fetch market data from any source');
      }
    }
  }

  /**
   * Get historical data
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<any> {
    console.log(`📈 Fetching ${days} days of historical data for ${symbol}...`);
    
    try {
      const data = await universalAPIService.getHistoricalData(symbol, days);
      console.log('✅ Historical data fetched');
      return data;
    } catch (error) {
      console.warn('⚠️ Historical data fetch failed, trying legacy...');
      
      // Fallback to CryptoCompare
      try {
        const legacyData = await realDataService.getCryptoCompareHistorical(symbol, days * 24); // hours
        console.log('✅ Historical data from legacy service');
        return legacyData;
      } catch (legacyError) {
        console.error('❌ All historical data sources failed');
        return [];
      }
    }
  }

  // ========================================
  // SENTIMENT & SOCIAL
  // ========================================

  /**
   * Get comprehensive sentiment data
   */
  async getSentimentData(): Promise<{
    fearGreed: { value: number; classification: string };
    social: any;
  }> {
    console.log('😊 Fetching sentiment data...');
    
    const [fearGreed, social] = await Promise.allSettled([
      universalAPIService.getFearGreedIndex(),
      universalAPIService.getSocialMetrics('BTC'),
    ]);

    return {
      fearGreed: fearGreed.status === 'fulfilled' 
        ? fearGreed.value 
        : { value: 50, classification: 'Neutral' },
      social: social.status === 'fulfilled' 
        ? social.value 
        : null,
    };
  }

  /**
   * Get Fear & Greed Index with fallback
   */
  async getFearGreedIndex(): Promise<{ value: number; classification: string }> {
    try {
      const result = await universalAPIService.getFearGreedIndex();
      console.log('✅ Fear & Greed from Universal API');
      return result;
    } catch (error) {
      console.warn('⚠️ Universal API failed, trying legacy...');
      
      try {
        const legacyResult = await realDataService.getFearGreedIndex();
        console.log('✅ Fear & Greed from legacy service');
        return legacyResult;
      } catch (legacyError) {
        console.error('❌ All Fear & Greed sources failed, using default');
        return { value: 50, classification: 'Neutral' };
      }
    }
  }

  // ========================================
  // NEWS
  // ========================================

  /**
   * Get crypto news from multiple sources
   */
  async getNews(limit: number = 20): Promise<any[]> {
    console.log('📰 Fetching crypto news...');
    
    try {
      const news = await universalAPIService.getCryptoNews(limit);
      console.log(`✅ Fetched ${news.length} news articles`);
      return news;
    } catch (error) {
      console.warn('⚠️ Universal news API failed, trying legacy...');
      
      try {
        const legacyNews = await realDataService.getCryptoNews();
        console.log('✅ News from legacy service');
        return legacyNews;
      } catch (legacyError) {
        console.error('❌ All news sources failed');
        return [];
      }
    }
  }

  // ========================================
  // WHALE TRACKING
  // ========================================

  /**
   * Get whale transactions
   */
  async getWhaleActivity(minValue: number = 1000000): Promise<any[]> {
    console.log('🐋 Fetching whale transactions...');
    
    try {
      const whales = await universalAPIService.getWhaleTransactions(minValue);
      console.log(`✅ Fetched ${whales.length} whale transactions`);
      return whales;
    } catch (error) {
      console.error('❌ Whale tracking failed');
      return [];
    }
  }

  // ========================================
  // COMPREHENSIVE DATA FETCH
  // ========================================

  /**
   * Get all data at once
   */
  async getAllData(): Promise<{
    market: any;
    sentiment: any;
    news: any[];
    whales: any[];
    timestamp: number;
  }> {
    console.log('🚀 Fetching ALL data from multiple sources...\n');
    
    const startTime = Date.now();

    const [market, sentiment, news, whales] = await Promise.allSettled([
      this.getMarketData(['BTC', 'ETH', 'BNB', 'ADA', 'SOL']),
      this.getSentimentData(),
      this.getNews(10),
      this.getWhaleActivity(1000000),
    ]);

    const duration = Date.now() - startTime;

    console.log(`\n✅ All data fetched in ${duration}ms`);

    return {
      market: market.status === 'fulfilled' ? market.value : null,
      sentiment: sentiment.status === 'fulfilled' ? sentiment.value : null,
      news: news.status === 'fulfilled' ? news.value : [],
      whales: whales.status === 'fulfilled' ? whales.value : [],
      timestamp: Date.now(),
    };
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private normalizeLegacyMarketData(legacyData: any[]): any {
    const normalized: any = {};
    
    legacyData.forEach(coin => {
      normalized[coin.symbol] = {
        price: coin.price,
        change24h: coin.changePercent24h,
        volume24h: coin.volume24h,
        marketCap: coin.marketCap,
        source: 'Legacy Service',
      };
    });

    return normalized;
  }

  // ========================================
  // METRICS
  // ========================================

  /**
   * Get comprehensive metrics from all services
   */
  getMetrics(): {
    universal: any;
    legacy: any;
  } {
    return {
      universal: universalAPIService.getMetricsSummary(),
      legacy: realDataService.getMetricsSummary(),
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    universalAPIService.clearMetrics();
    realDataService.clearMetrics();
    console.log('📊 All metrics cleared');
  }
}

// Export singleton instance
export const integratedDataService = new IntegratedDataService();

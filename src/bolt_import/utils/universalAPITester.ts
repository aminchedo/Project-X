/**
 * Universal API Tester
 * 
 * Comprehensive testing suite for all API integrations
 */

import { universalAPIService } from '../services/UniversalAPIService';
import { integratedDataService } from '../services/IntegratedDataService';

export const universalAPITester = {
  /**
   * Test all market data providers
   */
  async testMarketData() {
    console.log('📊 TESTING MARKET DATA PROVIDERS\n');
    console.log('='.repeat(60));

    const symbols = ['BTC', 'ETH', 'BNB'];
    
    try {
      console.log(`\n🔄 Fetching prices for: ${symbols.join(', ')}`);
      const prices = await universalAPIService.getCryptoPrices(symbols);
      
      console.log('\n✅ SUCCESS! Prices fetched:\n');
      Object.entries(prices).forEach(([symbol, data]: [string, any]) => {
        console.log(`  ${symbol}:`);
        console.log(`    Price: $${data.price.toFixed(2)}`);
        console.log(`    24h Change: ${data.change24h.toFixed(2)}%`);
        console.log(`    Volume: $${(data.volume24h / 1000000).toFixed(2)}M`);
        console.log(`    Source: ${data.source}`);
      });
    } catch (error) {
      console.error('❌ FAILED:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('\n' + '='.repeat(60));
  },

  /**
   * Test sentiment providers
   */
  async testSentiment(): Promise<void> {
    console.log('😊 TESTING SENTIMENT PROVIDERS\n');
    console.log('='.repeat(60));

    try {
      console.log('\n🔄 Fetching Fear & Greed Index...');
      const fearGreed = await universalAPIService.getFearGreedIndex();
      
      console.log('\n✅ SUCCESS! Fear & Greed Index:\n');
      console.log(`  Value: ${fearGreed.value}/100`);
      console.log(`  Classification: ${fearGreed.classification}`);
      console.log(`  Emoji: ${this.getEmoji(fearGreed.value)}`);
    } catch (error) {
      console.error('❌ FAILED:', error instanceof Error ? error.message : 'Unknown error');
    }

    try {
      console.log('\n🔄 Fetching Social Metrics for BTC...');
      const social = await universalAPIService.getSocialMetrics('BTC');
      
      console.log('\n✅ SUCCESS! Social Metrics:\n');
      console.log(`  Twitter Followers: ${social.twitterFollowers?.toLocaleString() || 'N/A'}`);
      console.log(`  Reddit Subscribers: ${social.redditSubscribers?.toLocaleString() || 'N/A'}`);
      console.log(`  Source: ${social.source || 'Unknown'}`);
    } catch (error) {
      console.error('❌ Social metrics failed:', error instanceof Error ? error.message : 'Unknown');
    }
    
    console.log('\n' + '='.repeat(60));
  },

  /**
   * Test news providers
   */
  async testNews(): Promise<void> {
    console.log('📰 TESTING NEWS PROVIDERS\n');
    console.log('='.repeat(60));

    try {
      console.log('\n🔄 Fetching latest crypto news...');
      const news = await universalAPIService.getCryptoNews(5);
      
      console.log(`\n✅ SUCCESS! Fetched ${news.length} articles:\n`);
      news.slice(0, 3).forEach((article, i) => {
        console.log(`  ${i + 1}. ${article.title}`);
        console.log(`     Source: ${article.source} (${article.provider})`);
        console.log(`     URL: ${article.url.substring(0, 50)}...`);
      });
    } catch (error) {
      console.error('❌ FAILED:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('\n' + '='.repeat(60));
  },

  /**
   * Test whale tracking
   */
  async testWhaleTracking(): Promise<void> {
    console.log('🐋 TESTING WHALE TRACKING\n');
    console.log('='.repeat(60));

    try {
      console.log('\n🔄 Fetching whale transactions (> $1M)...');
      const whales = await universalAPIService.getWhaleTransactions(1000000);
      
      console.log(`\n✅ SUCCESS! Found ${whales.length} whale transactions:\n`);
      whales.slice(0, 3).forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.amount?.toLocaleString() || 'Unknown'} ${tx.symbol || 'tokens'}`);
        console.log(`     From: ${tx.from?.substring(0, 10)}...`);
        console.log(`     To: ${tx.to?.substring(0, 10)}...`);
        console.log(`     Provider: ${tx.provider}`);
      });
    } catch (error) {
      console.error('❌ FAILED (Expected if no API key):', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('\n' + '='.repeat(60));
  },

  /**
   * Test integrated data service
   */
  async testIntegratedService() {
    console.log('🔗 TESTING INTEGRATED DATA SERVICE\n');
    console.log('='.repeat(60));

    try {
      console.log('\n🔄 Fetching ALL data from integrated service...');
      const data = await integratedDataService.getAllData();
      
      console.log('\n✅ SUCCESS! All data fetched:\n');
      
      // Market data
      if (data.market) {
        const symbols = Object.keys(data.market);
        console.log(`  📊 Market: ${symbols.length} symbols`);
        console.log(`     Symbols: ${symbols.join(', ')}`);
      }
      
      // Sentiment
      if (data.sentiment) {
        console.log(`  😊 Sentiment:`);
        console.log(`     Fear & Greed: ${data.sentiment.fearGreed.value} (${data.sentiment.fearGreed.classification})`);
        if (data.sentiment.social) {
          console.log(`     Social: Available`);
        }
      }
      
      // News
      console.log(`  📰 News: ${data.news.length} articles`);
      
      // Whales
      console.log(`  🐋 Whales: ${data.whales.length} transactions`);
      
      console.log(`\n  ⏱️ Total fetch time: ${Date.now() - data.timestamp}ms`);
      
    } catch (error) {
      console.error('❌ FAILED:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('\n' + '='.repeat(60));
  },

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 UNIVERSAL API SERVICE - COMPREHENSIVE TEST SUITE\n');
    console.log('='.repeat(60));
    console.log('Testing all API providers with intelligent fallback...\n');

    const tests = [
      { name: 'Market Data', fn: () => this.testMarketData() },
      { name: 'Sentiment', fn: () => this.testSentiment() },
      { name: 'News', fn: () => this.testNews() },
      { name: 'Whale Tracking', fn: () => this.testWhaleTracking() },
      { name: 'Integrated Service', fn: () => this.testIntegratedService() },
    ];

    for (const test of tests) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TEST: ${test.name}`);
      console.log('='.repeat(60));
      
      try {
        await test.fn();
      } catch (error) {
        console.error(`\n❌ Test "${test.name}" failed:`, error);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Show final metrics
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL METRICS');
    console.log('='.repeat(60));
    
    const metrics = universalAPIService.getMetricsSummary();
    console.log('\nUniversal API Service:');
    console.log(`  Total Requests: ${metrics.totalRequests}`);
    console.log(`  Success Rate: ${metrics.successRate}`);
    console.log(`  Avg Duration: ${metrics.avgDuration}`);
    
    if (Object.keys(metrics.providerStats).length > 0) {
      console.log('\n  Provider Statistics:');
      Object.entries(metrics.providerStats).forEach(([provider, stats]) => {
        console.log(`    ${provider}: ${stats.success} ✅ / ${stats.failed} ❌`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETE!');
    console.log('='.repeat(60));
  },

  /**
   * Quick test - tests only essentials
   */
  async quickTest() {
    console.log('⚡ QUICK TEST - Universal API Service\n');
    
    const startTime = Date.now();
    const results = {
      marketData: false,
      sentiment: false,
      news: false
    };

    // Test market data
    try {
      await universalAPIService.getCryptoPrices(['BTC']);
      results.marketData = true;
      console.log('✅ Market Data: Working');
    } catch (error) {
      console.log('❌ Market Data: Failed');
    }

    // Test sentiment
    try {
      await universalAPIService.getFearGreedIndex();
      results.sentiment = true;
      console.log('✅ Sentiment: Working');
    } catch (error) {
      console.log('❌ Sentiment: Failed');
    }

    // Test news
    try {
      await universalAPIService.getCryptoNews(5);
      results.news = true;
      console.log('✅ News: Working');
    } catch (error) {
      console.log('❌ News: Failed');
    }

    const passed = Object.values(results).filter(v => v).length;
    const total = Object.values(results).length;
    const duration = Date.now() - startTime;

    console.log(`\n🎯 Results: ${passed}/${total} tests passed (${duration}ms)`);
    
    if (passed === total) {
      console.log('🎉 All critical APIs working!');
    } else {
      console.log('⚠️ Some APIs failed (fallbacks may activate)');
    }
  },

  /**
   * View metrics
   */
  showMetrics() {
    console.log('📊 UNIVERSAL API METRICS\n');
    const metrics = universalAPIService.getMetricsSummary();
    console.table(metrics);
    
    if (Object.keys(metrics.providerStats).length > 0) {
      console.log('\nProvider Statistics:');
      console.table(metrics.providerStats);
    }
  },

  /**
   * Clear metrics
   */
  clearMetrics() {
    universalAPIService.clearMetrics();
  },

  /**
   * Helper: Get emoji for Fear & Greed value
   */
  getEmoji(value: number): string {
    if (value <= 25) return '😱 Extreme Fear';
    if (value <= 45) return '😰 Fear';
    if (value <= 55) return '😐 Neutral';
    if (value <= 75) return '😊 Greed';
    return '🤑 Extreme Greed';
  },
};

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).universalAPITester = universalAPITester;
  (window as any).integratedDataService = integratedDataService;
  
  console.log('💡 Universal API Tester loaded!');
  console.log('   Commands:');
  console.log('   - universalAPITester.runAllTests()');
  console.log('   - universalAPITester.quickTest()');
  console.log('   - universalAPITester.testMarketData()');
  console.log('   - universalAPITester.showMetrics()');
}

export default universalAPITester;

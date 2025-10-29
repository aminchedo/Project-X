import {
    CryptoPrice,
    NewsArticle,
    WhaleTransaction,
    MarketSentiment,
    MarketOverview,
    ApiResponse
} from '@/types/crypto.types';
import { FEATURE_FLAGS } from '@/config/cryptoApiConfig';
import MarketDataService from './MarketDataService';
import NewsService from './NewsService';
import WhaleTrackingService from './WhaleTrackingService';
import SentimentService from './SentimentService';
import BlockchainService from './BlockchainService';
import MetricsService from './MetricsService';

/**
 * Crypto Data Orchestrator
 * Coordinates all crypto services and provides unified data access
 */
export class CryptoDataOrchestrator {
    private services: {
        marketData: MarketDataService;
        news: NewsService;
        whaleTracking: WhaleTrackingService;
        sentiment: SentimentService;
        blockchain: BlockchainService;
    };

    constructor() {
        this.services = {
            marketData: MarketDataService,
            news: NewsService,
            whaleTracking: WhaleTrackingService,
            sentiment: SentimentService,
            blockchain: BlockchainService
        };

        // Register all services with metrics
        Object.values(this.services).forEach(service => {
            MetricsService.registerService(service);
        });
    }

    /**
     * Get comprehensive dashboard data
     */
    async getDashboardData(): Promise<{
        prices: CryptoPrice[];
        news: NewsArticle[];
        whaleAlerts: WhaleTransaction[];
        sentiment: MarketSentiment;
        marketOverview: MarketOverview;
        systemHealth: any;
    }> {
        if (!FEATURE_FLAGS.USE_REAL_APIS) {
            return this.getMockDashboardData();
        }

        try {
            const [
                pricesResult,
                newsResult,
                whaleResult,
                sentimentResult,
                marketOverviewResult
            ] = await Promise.allSettled([
                this.services.marketData.getTopCryptocurrencies(20),
                this.services.news.getLatestNews(10),
                this.services.whaleTracking.getRecentWhaleTransactions(10),
                this.services.sentiment.getFearGreedIndex(),
                this.services.marketData.getMarketOverview()
            ]);

            return {
                prices: this.extractData(pricesResult) || [],
                news: this.extractData(newsResult) || [],
                whaleAlerts: this.extractData(whaleResult) || [],
                sentiment: this.extractData(sentimentResult) || this.getMockSentiment(),
                marketOverview: this.extractData(marketOverviewResult) || this.getMockMarketOverview(),
                systemHealth: MetricsService.getSystemHealth()
            };
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            return this.getMockDashboardData();
        }
    }

    /**
     * Get market data for specific cryptocurrencies
     */
    async getMarketData(symbols: string[]): Promise<{
        prices: Record<string, CryptoPrice>;
        sentiment: Record<string, any>;
        news: NewsArticle[];
    }> {
        if (!FEATURE_FLAGS.USE_REAL_APIS) {
            return this.getMockMarketData(symbols);
        }

        try {
            const [pricesResult, newsResult] = await Promise.allSettled([
                this.services.marketData.getPrices(symbols),
                this.services.news.getLatestNews(15)
            ]);

            const prices = this.extractData(pricesResult) || [];
            const news = this.extractData(newsResult) || [];

            // Convert prices array to object keyed by symbol
            const pricesMap: Record<string, CryptoPrice> = {};
            prices.forEach(price => {
                pricesMap[price.symbol] = price;
            });

            // Get sentiment for each symbol
            const sentimentMap: Record<string, any> = {};
            for (const symbol of symbols) {
                try {
                    const sentimentResult = await this.services.sentiment.getSocialSentiment(symbol);
                    sentimentMap[symbol] = this.extractData(sentimentResult);
                } catch (error) {
                    console.warn(`Failed to get sentiment for ${symbol}:`, error);
                    sentimentMap[symbol] = null;
                }
            }

            return {
                prices: pricesMap,
                sentiment: sentimentMap,
                news
            };
        } catch (error) {
            console.error('Error fetching market data:', error);
            return this.getMockMarketData(symbols);
        }
    }

    /**
     * Get news and sentiment data
     */
    async getNewsAndSentiment(): Promise<{
        news: NewsArticle[];
        sentiment: MarketSentiment;
        socialSentiment: any;
    }> {
        if (!FEATURE_FLAGS.USE_REAL_APIS) {
            return this.getMockNewsAndSentiment();
        }

        try {
            const [newsResult, sentimentResult, socialSentimentResult] = await Promise.allSettled([
                this.services.news.getNewsSummary(),
                this.services.sentiment.getFearGreedIndex(),
                this.services.sentiment.getSocialSentiment('BTC')
            ]);

            const newsSummary = this.extractData(newsResult);
            const sentiment = this.extractData(sentimentResult) || this.getMockSentiment();
            const socialSentiment = this.extractData(socialSentimentResult);

            return {
                news: newsSummary?.latest || [],
                sentiment,
                socialSentiment
            };
        } catch (error) {
            console.error('Error fetching news and sentiment:', error);
            return this.getMockNewsAndSentiment();
        }
    }

    /**
     * Get whale tracking data
     */
    async getWhaleData(): Promise<{
        recentTransactions: WhaleTransaction[];
        summary: any;
        statistics: any;
    }> {
        if (!FEATURE_FLAGS.USE_REAL_APIS) {
            return this.getMockWhaleData();
        }

        try {
            const [transactionsResult, summaryResult, statisticsResult] = await Promise.allSettled([
                this.services.whaleTracking.getRecentWhaleTransactions(20),
                this.services.whaleTracking.getWhaleAlertsSummary(),
                this.services.whaleTracking.getWhaleStatistics()
            ]);

            return {
                recentTransactions: this.extractData(transactionsResult) || [],
                summary: this.extractData(summaryResult) || {},
                statistics: this.extractData(statisticsResult) || {}
            };
        } catch (error) {
            console.error('Error fetching whale data:', error);
            return this.getMockWhaleData();
        }
    }

    /**
     * Get blockchain data
     */
    async getBlockchainData(address: string, blockchain: 'ethereum' | 'bsc' | 'tron'): Promise<{
        balance: any;
        transactions: any[];
        tokenBalances: any[];
    }> {
        if (!FEATURE_FLAGS.USE_REAL_APIS) {
            return this.getMockBlockchainData();
        }

        try {
            const [balanceResult, transactionsResult, tokenBalancesResult] = await Promise.allSettled([
                this.services.blockchain.getAddressBalance(address, blockchain),
                this.services.blockchain.getAddressTransactions(address, blockchain, 10),
                this.services.blockchain.getTokenBalances(address, blockchain)
            ]);

            return {
                balance: this.extractData(balanceResult),
                transactions: this.extractData(transactionsResult) || [],
                tokenBalances: this.extractData(tokenBalancesResult) || []
            };
        } catch (error) {
            console.error('Error fetching blockchain data:', error);
            return this.getMockBlockchainData();
        }
    }

    /**
     * Get system health and metrics
     */
    getSystemHealth() {
        return {
            overall: MetricsService.getSystemHealth(),
            services: MetricsService.getDashboardData(),
            metrics: MetricsService.getGlobalMetrics()
        };
    }

    /**
     * Get service-specific health
     */
    getServiceHealth(serviceName: string) {
        return MetricsService.getServiceHealth(serviceName);
    }

    /**
     * Reset all metrics (for testing)
     */
    resetMetrics() {
        MetricsService.resetMetrics();
        Object.values(this.services).forEach(service => {
            if (service.resetMetrics) {
                service.resetMetrics();
            }
        });
    }

    /**
     * Extract data from Promise.allSettled result
     */
    private extractData<T>(result: PromiseSettledResult<ApiResponse<T>>): T | null {
        if (result.status === 'fulfilled' && result.value.success) {
            return result.value.data;
        }
        return null;
    }

    /**
     * Mock data for when real APIs are disabled
     */
    private getMockDashboardData() {
        return {
            prices: this.generateMockPrices(20),
            news: this.generateMockNews(10),
            whaleAlerts: this.generateMockWhaleTransactions(10),
            sentiment: this.getMockSentiment(),
            marketOverview: this.getMockMarketOverview(),
            systemHealth: { status: 'healthy', healthyServices: 5, totalServices: 5 }
        };
    }

    private getMockMarketData(symbols: string[]) {
        return {
            prices: symbols.reduce((acc, symbol) => {
                acc[symbol] = this.generateMockPrice(symbol);
                return acc;
            }, {} as Record<string, CryptoPrice>),
            sentiment: symbols.reduce((acc, symbol) => {
                acc[symbol] = this.generateMockSocialSentiment(symbol);
                return acc;
            }, {} as Record<string, any>),
            news: this.generateMockNews(15)
        };
    }

    private getMockNewsAndSentiment() {
        return {
            news: this.generateMockNews(10),
            sentiment: this.getMockSentiment(),
            socialSentiment: this.generateMockSocialSentiment('BTC')
        };
    }

    private getMockWhaleData() {
        return {
            recentTransactions: this.generateMockWhaleTransactions(20),
            summary: {
                total_alerts: 50,
                total_volume_usd: 1000000000,
                top_currencies: [
                    { currency: 'BTC', count: 25, volume_usd: 500000000 },
                    { currency: 'ETH', count: 15, volume_usd: 300000000 },
                    { currency: 'USDT', count: 10, volume_usd: 200000000 }
                ]
            },
            statistics: {
                total_transactions: 1000,
                total_volume_usd: 5000000000,
                average_transaction_size: 5000000
            }
        };
    }

    private getMockBlockchainData() {
        return {
            balance: { balance_eth: 1.5, balance_usd: 3000 },
            transactions: [],
            tokenBalances: []
        };
    }

    private getMockSentiment(): MarketSentiment {
        return {
            fear_greed_index: Math.floor(Math.random() * 100),
            fear_greed_classification: 'Neutral',
            value_classification: 'Neutral',
            timestamp: Date.now(),
            time_until_update: 3600,
            data: []
        };
    }

    private getMockMarketOverview(): MarketOverview {
        return {
            total_market_cap: 2000000000000,
            total_volume: 50000000000,
            active_cryptocurrencies: 10000,
            markets: 500,
            market_cap_percentage: { BTC: 40, ETH: 20, others: 40 },
            market_cap_change_percentage_24h_usd: 2.5
        };
    }

    private generateMockPrices(count: number): CryptoPrice[] {
        const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'DOGE', 'AVAX', 'LINK', 'LTC'];
        return Array.from({ length: count }, (_, i) => this.generateMockPrice(symbols[i % symbols.length]));
    }

    private generateMockPrice(symbol: string): CryptoPrice {
        const basePrice = Math.random() * 100000;
        const change24h = (Math.random() - 0.5) * basePrice * 0.1;

        return {
            id: symbol.toLowerCase(),
            symbol,
            name: `${symbol} Token`,
            current_price: basePrice,
            market_cap: basePrice * 1000000,
            market_cap_rank: Math.floor(Math.random() * 100) + 1,
            fully_diluted_valuation: basePrice * 1000000 * 1.1,
            total_volume: basePrice * 100000,
            high_24h: basePrice * 1.05,
            low_24h: basePrice * 0.95,
            price_change_24h: change24h,
            price_change_percentage_24h: (change24h / basePrice) * 100,
            market_cap_change_24h: change24h * 1000000,
            market_cap_change_percentage_24h: (change24h / basePrice) * 100,
            circulating_supply: 1000000,
            total_supply: 1000000,
            max_supply: null,
            ath: basePrice * 2,
            ath_change_percentage: -50,
            ath_date: new Date().toISOString(),
            atl: basePrice * 0.1,
            atl_change_percentage: 900,
            atl_date: new Date().toISOString(),
            roi: null,
            last_updated: new Date().toISOString()
        };
    }

    private generateMockNews(count: number): NewsArticle[] {
        const titles = [
            'Bitcoin Reaches New All-Time High',
            'Ethereum 2.0 Upgrade Complete',
            'Major Bank Adopts Cryptocurrency',
            'Regulatory Clarity Improves Market Sentiment',
            'DeFi Protocol Launches New Feature'
        ];

        return Array.from({ length: count }, (_, i) => ({
            id: `news-${i}`,
            title: titles[i % titles.length],
            description: 'This is a mock news article description.',
            content: 'This is the full content of the mock news article.',
            url: `https://example.com/news/${i}`,
            urlToImage: null,
            publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
            source: { id: 'mock', name: 'Mock News' },
            author: 'Mock Author',
            sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as any
        }));
    }

    private generateMockWhaleTransactions(count: number): WhaleTransaction[] {
        return Array.from({ length: count }, (_, i) => ({
            id: `whale-${i}`,
            hash: `0x${Math.random().toString(16).substr(2, 64)}`,
            from: {
                address: `0x${Math.random().toString(16).substr(2, 40)}`,
                owner: 'Unknown',
                owner_type: Math.random() > 0.5 ? 'exchange' : 'unknown'
            },
            to: {
                address: `0x${Math.random().toString(16).substr(2, 40)}`,
                owner: 'Unknown',
                owner_type: Math.random() > 0.5 ? 'exchange' : 'unknown'
            },
            amount: Math.random() * 1000,
            amount_usd: Math.random() * 10000000,
            currency: ['BTC', 'ETH', 'USDT'][Math.floor(Math.random() * 3)],
            timestamp: Math.floor(Date.now() / 1000) - i * 3600,
            transaction_type: 'transfer'
        }));
    }

    private generateMockSocialSentiment(symbol: string) {
        return {
            symbol,
            reddit_mentions: Math.floor(Math.random() * 1000),
            reddit_sentiment: Math.random() * 2 - 1,
            twitter_mentions: Math.floor(Math.random() * 5000),
            twitter_sentiment: Math.random() * 2 - 1,
            telegram_mentions: Math.floor(Math.random() * 2000),
            telegram_sentiment: Math.random() * 2 - 1,
            total_mentions: 0,
            average_sentiment: 0,
            last_updated: new Date().toISOString()
        };
    }
}

// Export singleton instance
export default new CryptoDataOrchestrator();

/**
 * Proxy API Service
 * Handles all external API calls through the proxy server to avoid CORS issues
 */

export interface FearGreedData {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  percent_change_24h: number;
  percent_change_7d?: number;
  market_cap: number;
  volume_24h: number;
}

export interface NewsArticle {
  source: { id: string | null; name: string };
  author: string;
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  content: string;
}

export interface WhaleTransaction {
  blockchain: string;
  symbol: string;
  amount: number;
  amount_usd: number;
  from_owner_type: string;
  to_owner_type: string;
  timestamp: number;
  transaction_type: string;
}

export interface HistoricalData {
  time: number;
  close: number;
  high: number;
  low: number;
  open: number;
  volumefrom: number;
  volumeto: number;
}

class ProxyApiService {
  // Use the standalone proxy server or FastAPI backend proxy
  private proxyUrl: string;
  private fastApiProxyUrl: string;

  constructor() {
    // Try standalone proxy first, fallback to FastAPI proxy
    this.proxyUrl = 'http://localhost:3002/api';
    this.fastApiProxyUrl = '/api/proxy';
  }

  /**
   * Generic fetch with error handling and fallback
   */
  private async fetch<T>(
    endpoint: string,
    useFastApiProxy: boolean = false
  ): Promise<T> {
    const baseUrl = useFastApiProxy ? this.fastApiProxyUrl : this.proxyUrl;
    const url = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // If standalone proxy fails, try FastAPI proxy
      if (!useFastApiProxy) {
        console.warn(`Standalone proxy failed, trying FastAPI proxy...`);
        try {
          return await this.fetch<T>(endpoint, true);
        } catch (fallbackError) {
          console.error(`Both proxies failed for ${endpoint}`);
          throw fallbackError;
        }
      }
      throw error;
    }
  }

  // ============================================================================
  // FEAR & GREED INDEX
  // ============================================================================

  async getFearGreedIndex(limit: number = 1): Promise<FearGreedData[]> {
    try {
      const response = await this.fetch<any>(`/feargreed?limit=${limit}`);
      return response.data || response;
    } catch (error) {
      console.error('Fear & Greed Index error:', error);
      // Return neutral fallback
      return [
        {
          value: '50',
          value_classification: 'Neutral',
          timestamp: Date.now().toString(),
          time_until_update: '0',
        },
      ];
    }
  }

  // ============================================================================
  // COINMARKETCAP
  // ============================================================================

  async getCMCListings(
    start: number = 1,
    limit: number = 20,
    convert: string = 'USD'
  ): Promise<any> {
    const response = await this.fetch<any>(
      `/coinmarketcap/listings?start=${start}&limit=${limit}&convert=${convert}`
    );
    return response.data || response;
  }

  async getCMCQuotes(symbols: string = 'BTC,ETH,BNB'): Promise<any> {
    const response = await this.fetch<any>(
      `/coinmarketcap/quotes?symbols=${symbols}`
    );
    return response.data || response;
  }

  async getCMCGlobalMetrics(): Promise<any> {
    const response = await this.fetch<any>(`/coinmarketcap/global`);
    return response.data || response;
  }

  // ============================================================================
  // CRYPTOCOMPARE
  // ============================================================================

  async getCryptoComparePrice(
    fsyms: string = 'BTC,ETH,BNB',
    tsyms: string = 'USD'
  ): Promise<any> {
    const response = await this.fetch<any>(
      `/cryptocompare/price?fsyms=${fsyms}&tsyms=${tsyms}`
    );
    return response;
  }

  async getCryptoCompareHistorical(
    fsym: string = 'BTC',
    tsym: string = 'USD',
    limit: number = 30
  ): Promise<HistoricalData[]> {
    try {
      const response = await this.fetch<any>(
        `/cryptocompare/histoday?fsym=${fsym}&tsym=${tsym}&limit=${limit}`
      );

      if (response.Response === 'Error') {
        throw new Error(response.Message);
      }

      return response.Data?.Data || response.Data || [];
    } catch (error) {
      console.error('Historical data error:', error);
      return [];
    }
  }

  // ============================================================================
  // COINGECKO (Alternative API)
  // ============================================================================

  async getCoinGeckoPrice(
    ids: string = 'bitcoin,ethereum',
    vs_currencies: string = 'usd'
  ): Promise<any> {
    const response = await this.fetch<any>(
      `/coingecko/price?ids=${ids}&vs_currencies=${vs_currencies}`
    );
    return response;
  }

  async getCoinGeckoMarkets(
    vs_currency: string = 'usd',
    per_page: number = 20,
    page: number = 1
  ): Promise<any[]> {
    const response = await this.fetch<any>(
      `/coingecko/markets?vs_currency=${vs_currency}&per_page=${per_page}&page=${page}`
    );
    return response;
  }

  // ============================================================================
  // NEWS
  // ============================================================================

  async getCryptoNews(
    query: string = 'cryptocurrency',
    pageSize: number = 20
  ): Promise<NewsArticle[]> {
    try {
      const response = await this.fetch<any>(
        `/news/crypto?q=${encodeURIComponent(query)}&pageSize=${pageSize}`
      );

      if (response.status === 'error') {
        throw new Error(response.message || 'News API error');
      }

      return response.articles || [];
    } catch (error) {
      console.error('News API error:', error);
      return [];
    }
  }

  // ============================================================================
  // WHALE ALERT
  // ============================================================================

  async getWhaleTransactions(
    minValue: number = 1000000,
    limit: number = 10
  ): Promise<WhaleTransaction[]> {
    try {
      const response = await this.fetch<any>(
        `/whalealert/transactions?min_value=${minValue}&limit=${limit}`
      );
      return response.transactions || [];
    } catch (error) {
      console.error('Whale Alert error:', error);
      return [];
    }
  }

  // ============================================================================
  // BLOCKCHAIN EXPLORERS
  // ============================================================================

  async getEtherscanBalance(address: string): Promise<any> {
    const response = await this.fetch<any>(
      `/etherscan/balance?address=${address}`
    );
    return response;
  }

  async getBscScanBalance(address: string): Promise<any> {
    const response = await this.fetch<any>(
      `/bscscan/balance?address=${address}`
    );
    return response;
  }

  async getTronScanAccount(address: string): Promise<any> {
    const response = await this.fetch<any>(
      `/tronscan/account?address=${address}`
    );
    return response;
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<any> {
    try {
      // Try standalone proxy first
      const response = await fetch('http://localhost:3002/health');
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Standalone proxy not available');
    } catch (error) {
      // Fallback to FastAPI proxy
      try {
        const response = await fetch('/api/proxy/health');
        return await response.json();
      } catch (fallbackError) {
        throw new Error('No proxy servers available');
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get comprehensive market data from multiple sources
   */
  async getMarketOverview(): Promise<{
    fearGreed: FearGreedData;
    topCoins: any[];
    news: NewsArticle[];
  }> {
    try {
      const [fearGreedData, topCoins, news] = await Promise.all([
        this.getFearGreedIndex(1),
        this.getCMCListings(1, 10),
        this.getCryptoNews('cryptocurrency', 10),
      ]);

      return {
        fearGreed: fearGreedData[0],
        topCoins: topCoins.data || topCoins,
        news: news,
      };
    } catch (error) {
      console.error('Market overview error:', error);
      throw error;
    }
  }

  /**
   * Get price data for multiple cryptocurrencies
   */
  async getMultiplePrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    try {
      const symbolsStr = symbols.join(',');
      const data = await this.getCMCQuotes(symbolsStr);

      const priceMap = new Map<string, CryptoPrice>();

      if (data.data) {
        Object.entries(data.data).forEach(([symbol, coinData]: [string, any]) => {
          priceMap.set(symbol, {
            symbol: coinData.symbol,
            name: coinData.name,
            price: coinData.quote.USD.price,
            percent_change_24h: coinData.quote.USD.percent_change_24h,
            percent_change_7d: coinData.quote.USD.percent_change_7d,
            market_cap: coinData.quote.USD.market_cap,
            volume_24h: coinData.quote.USD.volume_24h,
          });
        });
      }

      return priceMap;
    } catch (error) {
      console.error('Multiple prices error:', error);
      return new Map();
    }
  }

  /**
   * Get historical data with proper formatting for charts
   */
  async getChartData(
    symbol: string,
    days: number = 30
  ): Promise<{ labels: string[]; prices: number[] }> {
    try {
      const historicalData = await this.getCryptoCompareHistorical(
        symbol,
        'USD',
        days
      );

      const labels: string[] = [];
      const prices: number[] = [];

      historicalData.forEach((item) => {
        const date = new Date(item.time * 1000);
        labels.push(date.toLocaleDateString());
        prices.push(item.close);
      });

      return { labels, prices };
    } catch (error) {
      console.error('Chart data error:', error);
      return { labels: [], prices: [] };
    }
  }
}

// Export singleton instance
export const proxyApi = new ProxyApiService();
export default ProxyApiService;

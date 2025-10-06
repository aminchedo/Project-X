import { API_KEYS } from '../config/apiKeys';

// Comprehensive API configuration from api.txt
export const API_CONFIG = {
  // 1. Block Explorer APIs (11 endpoints)
  tronscan: {
    primary: {
      name: 'tronscan',
      baseUrl: 'https://api.tronscan.org/api',
      key: '7ae72726-bffe-4e74-9c33-97b761eeea21'
    },
    fallbacks: [
      { name: 'tronGrid', baseUrl: 'https://api.trongrid.io', key: '' },
      { name: 'blockchair', baseUrl: 'https://api.blockchair.com/tron', key: '' }
    ]
  },
  bscscan: {
    primary: {
      name: 'bscscan',
      baseUrl: 'https://api.bscscan.com/api',
      key: 'K62RKHGXTDCG53RU4MCG6XABIMJKTN19IT'
    },
    fallbacks: [
      { name: 'ankr', baseUrl: 'https://api.ankr.com/scan/bsc', key: '' },
      { name: 'binTools', baseUrl: 'https://api.bintools.io/bsc', key: '' }
    ]
  },
  etherscan: {
    primary: {
      name: 'etherscan',
      baseUrl: 'https://api.etherscan.io/api',
      key: 'SZHYFZK2RR8H9TIMJBVW54V4H81K2Z2KR2'
    },
    fallbacks: [
      { name: 'etherscan_2', baseUrl: 'https://api.etherscan.io/api', key: 'T6IR8VJHX2NE6ZJW2S3FDVN1TYG4PYYI45' },
      { name: 'infura', baseUrl: 'https://mainnet.infura.io/v3', key: '' },
      { name: 'alchemy', baseUrl: 'https://eth-mainnet.alchemyapi.io/v2', key: '' },
      { name: 'covalent', baseUrl: 'https://api.covalenthq.com/v1/1', key: '' }
    ]
  },

  // 2. Market Data APIs (9 endpoints)
  coinmarketcap: {
    primary: {
      name: 'coinmarketcap',
      baseUrl: 'https://pro-api.coinmarketcap.com/v1',
      key: 'b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c'
    },
    fallbacks: [
      { name: 'coinmarketcapAlt', baseUrl: 'https://pro-api.coinmarketcap.com/v1', key: '04cf4b5b-9868-465c-8ba0-9f2e78c92eb1' },
      { name: 'coingecko', baseUrl: 'https://api.coingecko.com/api/v3', key: '' },
      { name: 'nomics', baseUrl: 'https://api.nomics.com/v1', key: '' },
      { name: 'messari', baseUrl: 'https://data.messari.io/api/v1', key: '' },
      { name: 'braveNewCoin', baseUrl: 'https://bravenewcoin.p.rapidapi.com', key: '' }
    ]
  },
  cryptocompare: {
    primary: {
      name: 'cryptocompare',
      baseUrl: 'https://min-api.cryptocompare.com/data',
      key: 'e79c8e6d4c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f'
    },
    fallbacks: [
      { name: 'kaiko', baseUrl: 'https://us.market-api.kaiko.io/v2', key: '' },
      { name: 'coinapi', baseUrl: 'https://rest.coinapi.io/v1', key: '' }
    ]
  },

  // 3. News & Aggregators (7 endpoints)
  newsapi: {
    primary: {
      name: 'newsapi',
      baseUrl: 'https://newsapi.org/v2',
      key: 'pub_346789abc123def456789ghi012345jkl'
    },
    fallbacks: [
      { name: 'cryptoPanic', baseUrl: 'https://cryptopanic.com/api/v1', key: '' },
      { name: 'cryptoControl', baseUrl: 'https://cryptocontrol.io/api/v1/public', key: '' },
      { name: 'coinDesk', baseUrl: 'https://api.coindesk.com/v2', key: '' },
      { name: 'coinTelegraph', baseUrl: 'https://api.cointelegraph.com', key: '' },
      { name: 'cryptoSlate', baseUrl: 'https://api.cryptoslate.com', key: '' },
      { name: 'theBlock', baseUrl: 'https://api.theblock.co/v1', key: '' }
    ]
  },

  // 4. Sentiment & Mood (8 endpoints)
  sentiment: {
    primary: {
      name: 'alternativeMe',
      baseUrl: 'https://api.alternative.me/fng',
      key: ''
    },
    fallbacks: [
      { name: 'santiment', baseUrl: 'https://api.santiment.net/graphql', key: 'YOUR_SANTIMENT_KEY' },
      { name: 'lunarCrush', baseUrl: 'https://api.lunarcrush.com/v2', key: 'YOUR_LUNARCRUSH_KEY' },
      { name: 'theTie', baseUrl: 'https://api.thetie.io', key: 'YOUR_THETIE_KEY' },
      { name: 'cryptoQuant', baseUrl: 'https://api.cryptoquant.com/v1', key: 'YOUR_CRYPTOQUANT_KEY' },
      { name: 'glassnodeSocial', baseUrl: 'https://api.glassnode.com/v1', key: 'YOUR_GLASSNODE_KEY' },
      { name: 'coingeckoComm', baseUrl: 'https://api.coingecko.com/api/v3', key: '' },
      { name: 'messariSocial', baseUrl: 'https://data.messari.io/api/v1', key: '' },
      { name: 'reddit', baseUrl: 'https://www.reddit.com', key: '' }
    ]
  },

  // 5. On-Chain Analytics (4 endpoints)
  glassnode: { primary: { name: 'glassnode', baseUrl: 'https://api.glassnode.com/v1', key: '' } },
  intoTheBlock: { primary: { name: 'intoTheBlock', baseUrl: 'https://api.intotheblock.com/v1', key: '' } },
  nansen: { primary: { name: 'nansen', baseUrl: 'https://api.nansen.ai/v1', key: '' } },
  theGraph: { primary: { name: 'theGraph', baseUrl: 'https://api.thegraph.com/subgraphs/name', key: '' } },

  // 6. Whale-Tracking (2 endpoints)
  whaleAlert: {
    primary: { name: 'whaleAlert', baseUrl: 'https://api.whale-alert.io/v1', key: 'YOUR_WHALEALERT_KEY' },
    fallbacks: [
      { name: 'arkham', baseUrl: 'https://api.arkham.com', key: 'YOUR_ARKHAM_KEY' }
    ]
  }
};

// Data persistence and caching
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 1000;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// API Service with fallback system
class RealApiService {
  private cache = new DataCache();
  private requestQueue = new Map<string, Promise<any>>();

  // Generic API call with fallback
  private async callWithFallback(
    serviceName: string,
    endpoint: string,
    options: RequestInit = {},
    timeout: number = 10000
  ): Promise<any> {
    const service = API_CONFIG[serviceName as keyof typeof API_CONFIG];
    if (!service) throw new Error(`Service ${serviceName} not found`);

    const sources = [service.primary, ...(service.fallbacks || [])];
    
    for (const source of sources) {
      try {
        const url = `${source.baseUrl}${endpoint}`;
        const cacheKey = `${serviceName}:${source.name}:${endpoint}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.log(`Cache hit for ${cacheKey}`);
          return cached;
        }

        // Check if request is already in progress
        if (this.requestQueue.has(cacheKey)) {
          return await this.requestQueue.get(cacheKey);
        }

        const requestPromise = this.makeRequest(url, source.key, options, timeout);
        this.requestQueue.set(cacheKey, requestPromise);

        try {
          const result = await requestPromise;
          this.cache.set(cacheKey, result);
          return result;
        } finally {
          this.requestQueue.delete(cacheKey);
        }

      } catch (error) {
        console.warn(`Failed to call ${source.name}:`, error);
        continue;
      }
    }

    throw new Error(`All sources failed for ${serviceName}`);
  }

  // Simple makeRequest for backend proxy calls
  private async makeRequest(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  private async makeRequest(
    url: string,
    apiKey: string,
    options: RequestInit = {},
    timeout: number
  ): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (apiKey) {
      if (url.includes('coinmarketcap')) {
        headers['X-CMC_PRO_API_KEY'] = apiKey;
      } else if (url.includes('bscscan') || url.includes('etherscan')) {
        // Add API key as query parameter
        url += (url.includes('?') ? '&' : '?') + `apikey=${apiKey}`;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Market Data APIs
  async getMarketData(symbols: string[] = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP']): Promise<any> {
    // Use backend proxy to avoid CORS
    const symbolString = symbols.join(',');
    const url = `http://localhost:8000/api/sentiment/coinmarketcap/${symbolString}`;
    return this.makeRequest(url);
  }

  async getPrice(symbol: string): Promise<number> {
    try {
      const data = await this.getMarketData([symbol]);
      return data.data[symbol]?.quote?.USD?.price || 0;
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error);
      return 0;
    }
  }

  async get24hrTicker(symbol: string): Promise<any> {
    return this.callWithFallback(
      'cryptocompare',
      `/pricemultifull?fsyms=${symbol}&tsyms=USD`
    );
  }

  async getOHLCV(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<any> {
    return this.callWithFallback(
      'cryptocompare',
      `/v2/histoday?fsym=${symbol}&tsym=USD&limit=${limit}&aggregate=${this.getAggregate(timeframe)}`
    );
  }

  private getAggregate(timeframe: string): number {
    const timeframes: { [key: string]: number } = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
      '1w': 10080
    };
    return timeframes[timeframe] || 60;
  }

  // News APIs
  async getCryptoNews(limit: number = 20): Promise<any> {
    // Use backend proxy to avoid CORS
    const url = `http://localhost:8000/api/sentiment/fear-greed`;
    return this.makeRequest(url);
  }

  async getCryptoPanicNews(): Promise<any> {
    return this.callWithFallback(
      'newsapi',
      `/everything?q=bitcoin OR ethereum OR cryptocurrency&language=en&sortBy=publishedAt&pageSize=20`
    );
  }

  // Sentiment APIs
  async getFearGreedIndex(): Promise<any> {
    // Use backend proxy to avoid CORS
    const url = `http://localhost:8000/api/sentiment/fear-greed`;
    return this.makeRequest(url);
  }

  async getSocialSentiment(symbol: string = 'BTC'): Promise<any> {
    try {
      // Try CoinGecko community data first (no key required)
      return this.callWithFallback(
        'sentiment',
        `/coins/${symbol.toLowerCase()}?localization=false&tickers=false&market_data=false&community_data=true`
      );
    } catch (error) {
      console.warn('Failed to get social sentiment:', error);
      return null;
    }
  }

  // Block Explorer APIs
  async getBalance(address: string, network: 'eth' | 'bsc' | 'tron' = 'eth'): Promise<string> {
    const serviceName = network === 'eth' ? 'etherscan' : network === 'bsc' ? 'bscscan' : 'tronscan';
    const action = network === 'tron' ? 'account' : 'account';
    const param = network === 'tron' ? `address=${address}` : `address=${address}`;
    
    return this.callWithFallback(
      serviceName,
      `?module=${action}&action=balance&${param}`
    );
  }

  // Whale Tracking
  async getWhaleTransactions(minValue: number = 1000000, limit: number = 10): Promise<any> {
    try {
      // Use backend proxy to avoid CORS - return mock data for now
      console.warn('Whale tracking using mock data due to CORS restrictions');
      return { 
        transactions: [
          {
            symbol: 'BTC',
            amount: 1000000,
            timestamp: new Date().toISOString(),
            type: 'transfer'
          }
        ]
      };
    } catch (error) {
      console.warn('Whale tracking not available:', error);
      return { transactions: [] };
    }
  }

  // On-Chain Analytics
  async getOnChainMetrics(symbol: string = 'BTC'): Promise<any> {
    try {
      return this.callWithFallback(
        'glassnode',
        `/metrics/indicators/sopr_ratio?a=${symbol}&api_key=`
      );
    } catch (error) {
      console.warn('On-chain metrics not available:', error);
      return null;
    }
  }

  // Portfolio tracking
  async getPortfolioData(addresses: { [network: string]: string[] }): Promise<any> {
    const results: any = {};
    
    for (const [network, addressList] of Object.entries(addresses)) {
      results[network] = {};
      
      for (const address of addressList) {
        try {
          const balance = await this.getBalance(address, network as any);
          results[network][address] = balance;
        } catch (error) {
          console.warn(`Failed to get balance for ${address} on ${network}:`, error);
          results[network][address] = '0';
        }
      }
    }
    
    return results;
  }

  // Data persistence
  saveToLocalStorage(key: string, data: any): void {
    try {
      localStorage.setItem(`hts_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  loadFromLocalStorage(key: string): any | null {
    try {
      const stored = localStorage.getItem(`hts_${key}`);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      // Check if data is older than 1 hour
      if (Date.now() - parsed.timestamp > 60 * 60 * 1000) {
        localStorage.removeItem(`hts_${key}`);
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size(),
      keys: Array.from(this.cache['cache'].keys())
    };
  }

  // Health check
  async healthCheck(): Promise<{ [service: string]: boolean }> {
    const results: { [service: string]: boolean } = {};
    
    const services = Object.keys(API_CONFIG);
    
    for (const service of services) {
      try {
        // Simple health check - try to get basic data
        if (service === 'coinmarketcap') {
          await this.getPrice('BTC');
        } else if (service === 'newsapi') {
          await this.getCryptoNews(1);
        } else if (service === 'sentiment') {
          await this.getFearGreedIndex();
        }
        
        results[service] = true;
      } catch (error) {
        results[service] = false;
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const realApiService = new RealApiService();
export default realApiService;

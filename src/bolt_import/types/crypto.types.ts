/**
 * Comprehensive TypeScript types for Crypto API Integration
 * Includes all data types, security types, and monitoring types
 */

// ===========================================
// CORE CRYPTO DATA TYPES
// ===========================================

/**
 * Basic cryptocurrency price data
 */
export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

/**
 * Historical price data point
 */
export interface PriceDataPoint {
  timestamp: number;
  price: number;
  volume: number;
  market_cap: number;
}

/**
 * Price chart data
 */
export interface PriceChartData {
  symbol: string;
  prices: PriceDataPoint[];
  timeRange: '1h' | '4h' | '1d' | '7d' | '30d' | '90d' | '1y';
}

/**
 * Market overview data
 */
export interface MarketOverview {
  total_market_cap: number;
  total_volume: number;
  active_cryptocurrencies: number;
  markets: number;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
}

// ===========================================
// NEWS AND SENTIMENT TYPES
// ===========================================

/**
 * News article
 */
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevance_score?: number;
  tags?: string[];
}

/**
 * Market sentiment data
 */
export interface MarketSentiment {
  fear_greed_index: number;
  fear_greed_classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  value_classification: string;
  timestamp: number;
  time_until_update: number;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
  }>;
}

/**
 * Social sentiment data
 */
export interface SocialSentiment {
  symbol: string;
  reddit_mentions: number;
  reddit_sentiment: number;
  twitter_mentions: number;
  twitter_sentiment: number;
  telegram_mentions: number;
  telegram_sentiment: number;
  total_mentions: number;
  average_sentiment: number;
  last_updated: string;
}

// ===========================================
// WHALE TRACKING TYPES
// ===========================================

/**
 * Whale transaction data
 */
export interface WhaleTransaction {
  id: string;
  hash: string;
  from: {
    address: string;
    owner: string | null;
    owner_type: 'exchange' | 'unknown' | null;
  };
  to: {
    address: string;
    owner: string | null;
    owner_type: 'exchange' | 'unknown' | null;
  };
  amount: number;
  amount_usd: number;
  currency: string;
  timestamp: number;
  transaction_type: 'transfer' | 'unknown';
  from_owner_type: 'exchange' | 'unknown' | null;
  to_owner_type: 'exchange' | 'unknown' | null;
}

/**
 * Whale alert summary
 */
export interface WhaleAlert {
  id: string;
  currency: string;
  amount: number;
  amount_usd: number;
  transaction_type: 'transfer' | 'unknown';
  from_owner: string | null;
  to_owner: string | null;
  timestamp: number;
  hash: string;
  blockchain: string;
}

// ===========================================
// BLOCKCHAIN EXPLORER TYPES
// ===========================================

/**
 * Transaction data from blockchain explorer
 */
export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  timestamp: number;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  status: 'success' | 'failed';
  isError: boolean;
  methodId: string;
  functionName: string;
}

/**
 * Block data
 */
export interface BlockData {
  number: number;
  hash: string;
  parentHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  receiptsRoot: string;
  miner: string;
  difficulty: string;
  totalDifficulty: string;
  size: number;
  extraData: string;
  gasLimit: number;
  gasUsed: number;
  timestamp: number;
  transactions: string[];
  uncles: string[];
}

/**
 * Address balance
 */
export interface AddressBalance {
  address: string;
  balance: string;
  balance_eth: number;
  balance_usd: number;
  token_balances: Array<{
    contract_address: string;
    name: string;
    symbol: string;
    decimals: number;
    balance: string;
    balance_formatted: number;
    balance_usd: number;
  }>;
}

// ===========================================
// PORTFOLIO AND TRADING TYPES
// ===========================================

/**
 * Portfolio holding
 */
export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  average_buy_price: number;
  current_price: number;
  current_value: number;
  total_cost: number;
  profit_loss: number;
  profit_loss_percentage: number;
  last_updated: string;
}

/**
 * Portfolio summary
 */
export interface PortfolioSummary {
  total_value: number;
  total_cost: number;
  total_profit_loss: number;
  total_profit_loss_percentage: number;
  holdings: PortfolioHolding[];
  last_updated: string;
}

/**
 * Trading signal
 */
export interface TradingSignal {
  id: string;
  symbol: string;
  signal_type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-1
  price_target: number;
  stop_loss: number;
  reasoning: string;
  technical_indicators: {
    rsi: number;
    macd: number;
    bollinger_bands: {
      upper: number;
      middle: number;
      lower: number;
    };
    moving_averages: {
      sma_20: number;
      sma_50: number;
      sma_200: number;
    };
  };
  timestamp: number;
  expires_at: number;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  timestamp: number;
  source: string;
  cached: boolean;
  cache_age?: number;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  request_id?: string;
}

// ===========================================
// SECURITY AND INFRASTRUCTURE TYPES
// ===========================================

/**
 * Rate limiter state
 */
export interface RateLimiterState {
  requests: number;
  windowStart: number;
  limit: number;
}

/**
 * Circuit breaker state
 */
export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number | null;
  nextAttemptTime: number | null;
}

/**
 * Cache entry
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * API metrics
 */
export interface ApiMetrics {
  service: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  lastRequestTime: number;
  rateLimitHits: number;
  circuitBreakerTrips: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * Service health status
 */
export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
  dependencies: Array<{
    name: string;
    status: 'healthy' | 'unhealthy';
    responseTime: number;
  }>;
}

// ===========================================
// CONFIGURATION TYPES
// ===========================================

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  name: string;
  baseUrl: string;
  getKey: () => string;
  timeout: number;
  headerName?: string;
  rateLimit: number;
}

/**
 * API configuration
 */
export interface ApiConfig {
  primary: ApiEndpoint;
  fallbacks: ApiEndpoint[];
}

/**
 * Feature flags
 */
export interface FeatureFlags {
  USE_REAL_APIS: boolean;
  ENABLE_CACHE: boolean;
  DEBUG_LOGGING: boolean;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ENABLED: boolean;
  TTL: number;
  PRICES_TTL: number;
  NEWS_TTL: number;
  SENTIMENT_TTL: number;
  HISTORICAL_TTL: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimits {
  DEFAULT: number;
  COINMARKETCAP: number;
  COINGECKO: number;
  NEWSAPI: number;
  ETHERSCAN: number;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  THRESHOLD: number;
  TIMEOUT: number;
  RESET_TIMEOUT: number;
}

// ===========================================
// UTILITY TYPES
// ===========================================

/**
 * Time range for data queries
 */
export type TimeRange = '1h' | '4h' | '1d' | '7d' | '30d' | '90d' | '1y';

/**
 * Supported cryptocurrencies
 */
export type Cryptocurrency = 'bitcoin' | 'ethereum' | 'binancecoin' | 'cardano' | 'solana' | 'polkadot' | 'dogecoin' | 'avalanche-2' | 'chainlink' | 'litecoin';

/**
 * Supported blockchains
 */
export type Blockchain = 'ethereum' | 'binance-smart-chain' | 'tron' | 'polygon' | 'avalanche';

/**
 * API service names
 */
export type ApiService = 'coinmarketcap' | 'coingecko' | 'cryptocompare' | 'newsapi' | 'etherscan' | 'bscscan' | 'tronscan' | 'whalealert';

/**
 * Chart timeframes
 */
export type ChartTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

// ===========================================
// EVENT TYPES
// ===========================================

/**
 * WebSocket event types
 */
export type WebSocketEventType = 'price_update' | 'news_update' | 'whale_alert' | 'sentiment_update' | 'portfolio_update';

/**
 * WebSocket event payload
 */
export interface WebSocketEvent<T = any> {
  type: WebSocketEventType;
  data: T;
  timestamp: number;
  source: string;
}

/**
 * Price update event
 */
export interface PriceUpdateEvent {
  symbol: string;
  price: number;
  change_24h: number;
  change_percentage_24h: number;
  volume_24h: number;
  market_cap: number;
}

/**
 * News update event
 */
export interface NewsUpdateEvent {
  articles: NewsArticle[];
  sentiment: MarketSentiment;
}

/**
 * Whale alert event
 */
export interface WhaleAlertEvent {
  alerts: WhaleAlert[];
  summary: {
    total_alerts: number;
    total_volume_usd: number;
    top_currencies: Array<{
      currency: string;
      count: number;
      volume_usd: number;
    }>;
  };
}

// ===========================================
// EXPORT ALL TYPES
// ===========================================

export type {
  // Re-export commonly used types for convenience
  CryptoPrice as Price,
  NewsArticle as News,
  WhaleTransaction as Whale,
  TradingSignal as Signal,
  PortfolioHolding as Holding,
  MarketSentiment as Sentiment,
  ApiResponse as Response,
  ApiError as Error,
  WebSocketEvent as Event,
};

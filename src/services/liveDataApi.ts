/**
 * Live Data API Service
 *
 * Centralized service for fetching real data from backend routes.
 * All frontend components should use these functions instead of:
 * - Hardcoded mock data
 * - Math.random() simulations
 * - Fake metrics generation
 *
 * Error Handling: All functions return null/empty arrays on failure.
 * Components MUST render placeholders when data is null/empty.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================
// MARKET PRICE DATA
// ============================================

export interface MarketAsset {
  symbol: string;
  price: number | null;
  change24hPct: number | null;
  marketCap: number | null;
}

export interface MarketPricesResponse {
  assets: MarketAsset[];
}

/**
 * Fetch real-time market prices from backend
 * Source: CoinMarketCap / CryptoCompare / Coingecko (backend decides)
 */
export async function fetchMarketPrices(): Promise<MarketAsset[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/live/market/prices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch market prices:', response.status);
      return [];
    }

    const data: MarketPricesResponse = await response.json();
    return data.assets || [];
  } catch (error) {
    console.error('Error fetching market prices:', error);
    return [];
  }
}

// ============================================
// WALLET / PORTFOLIO BALANCE DATA
// ============================================

export interface WalletBalance {
  chain: string;
  balanceWei?: string;
  raw?: any;
}

export interface WalletDataResponse {
  balances: WalletBalance[];
}

/**
 * Fetch real wallet balances from blockchain explorers
 * Source: Etherscan, BscScan, TronScan (via backend)
 */
export async function fetchWalletData(address: string): Promise<WalletBalance[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/live/wallet/${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch wallet data:', response.status);
      return [];
    }

    const data: WalletDataResponse = await response.json();
    return data.balances || [];
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return [];
  }
}

// ============================================
// NEWS DATA
// ============================================

export interface NewsArticle {
  headline: string | null;
  source: string | null;
  publishedAt: string | null;
  url: string | null;
}

export interface NewsResponse {
  articles: NewsArticle[];
}

/**
 * Fetch real crypto news
 * Source: NewsAPI (via backend)
 */
export async function fetchCryptoNews(): Promise<NewsArticle[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/live/news`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch crypto news:', response.status);
      return [];
    }

    const data: NewsResponse = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    return [];
  }
}

// ============================================
// SENTIMENT DATA
// ============================================

export interface FearGreedData {
  indexValue: string | null;
  classification: string | null;
  timestamp: string | null;
}

/**
 * Fetch Fear & Greed Index
 * Source: alternative.me API (via backend)
 */
export async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/live/sentiment/fear-greed`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch fear & greed index:', response.status);
      return null;
    }

    const data: FearGreedData = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching fear & greed index:', error);
    return null;
  }
}

export interface SocialPost {
  title: string | null;
  upvotes: number | null;
  createdUtc: number | null;
}

export interface SocialBuzzResponse {
  posts: SocialPost[];
}

/**
 * Fetch social media buzz (Reddit)
 * Source: Reddit /r/CryptoCurrency (via backend)
 */
export async function fetchSocialBuzz(): Promise<SocialPost[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/live/sentiment/social`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch social buzz:', response.status);
      return [];
    }

    const data: SocialBuzzResponse = await response.json();
    return data.posts || [];
  } catch (error) {
    console.error('Error fetching social buzz:', error);
    return [];
  }
}

// ============================================
// TRADING POSITIONS & SIGNALS
// ============================================

export interface SignalPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  timestamp: number;
  confidence: number;
  status: 'active' | 'closed' | 'pending';
  stopLoss?: number;
  takeProfit?: number;
  riskScore: number;
}

export interface SignalAlert {
  id: string;
  symbol: string;
  type: 'entry' | 'exit' | 'stop_loss' | 'take_profit';
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high';
  price: number;
  side: 'long' | 'short';
}

export interface SignalPositionsResponse {
  positions: SignalPosition[];
  alerts: SignalAlert[];
  totalPnl: number;
  activeCount: number;
  winRate?: number;
  avgRiskScore?: number;
}

/**
 * Fetch real signal positions from backend
 * NOTE: This endpoint must be implemented in backend
 * If not available yet, this will return empty data (not fake data!)
 */
export async function fetchSignalPositions(): Promise<SignalPositionsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trading/signal-positions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch signal positions:', response.status);
      return {
        positions: [],
        alerts: [],
        totalPnl: 0,
        activeCount: 0,
      };
    }

    const data: SignalPositionsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching signal positions:', error);
    return {
      positions: [],
      alerts: [],
      totalPnl: 0,
      activeCount: 0,
    };
  }
}

// ============================================
// RISK MONITORING
// ============================================

export interface RiskMetric {
  name: string;
  value: number;
  threshold: number;
  status: 'safe' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

export interface PositionRisk {
  symbol: string;
  exposure: number;
  var: number;
  leverage: number;
  unrealizedPnl: number;
  riskScore: number;
}

export interface RiskAlert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  symbol?: string;
  metric: string;
  value: number;
  threshold: number;
}

export interface RiskSnapshotResponse {
  overallRiskScore: number;
  portfolioVar: number;
  maxDrawdown: number;
  sharpeRatio: number;
  riskMetrics: RiskMetric[];
  positionRisks: PositionRisk[];
  riskAlerts: RiskAlert[];
}

/**
 * Fetch real-time risk monitoring data
 * NOTE: This endpoint must be implemented in backend
 * If not available yet, this will return null (not fake data!)
 */
export async function fetchRiskSnapshot(): Promise<RiskSnapshotResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trading/risk-snapshot`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch risk snapshot:', response.status);
      return null;
    }

    const data: RiskSnapshotResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching risk snapshot:', error);
    return null;
  }
}

// ============================================
// MARKET DEPTH / ORDER BOOK
// ============================================

export interface OrderBookLevel {
  price: number;
  quantity: number;
}

export interface MarketDepthResponse {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

/**
 * Fetch real market depth / order book
 * NOTE: This should come from WebSocket or backend REST API
 */
export async function fetchMarketDepth(symbol: string): Promise<MarketDepthResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/market/depth?symbol=${symbol}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch market depth:', response.status);
      return null;
    }

    const data: MarketDepthResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching market depth:', error);
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Retry helper for important API calls
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error(`Failed after ${maxRetries} attempts:`, error);
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  return null;
}

// src/services/api.ts
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function normalizeBaseUrl(url: string) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getBaseUrl() {
  const env = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (env && env.trim()) return normalizeBaseUrl(env.trim());
  
  // In development, use backend URL directly
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  const origin = window.location.origin;
  return normalizeBaseUrl(origin);
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (network errors or 5xx server errors)
 */
function isRetryableError(error: any): boolean {
  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
    return true;
  }
  if (error.message?.includes('HTTP 5')) {
    return true;
  }
  return false;
}

/**
 * Core request function (single attempt)
 */
async function request<T = unknown>(path: string, options: RequestInit = {}) {
  const base = getBaseUrl();
  const url = path.startsWith('/') ? base + path : base + '/' + path;
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

/**
 * Request with retry logic (2 attempts, exponential backoff)
 */
async function requestWithRetry<T = unknown>(path: string, options: RequestInit = {}, maxRetries = 2): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await request<T>(path, options);
    } catch (error) {
      lastError = error as Error;
      
      // If it's not a retryable error, throw immediately
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 500ms, 1000ms
      const backoffMs = 500 * (attempt + 1);
      console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${backoffMs}ms...`, error);
      await sleep(backoffMs);
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

export const api = {
  get: <T = unknown>(path: string, init?: RequestInit) => 
    requestWithRetry<T>(path, { method: 'GET', ...(init || {}) }),
  post: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    requestWithRetry<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...(init || {}) }),
  put: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    requestWithRetry<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...(init || {}) }),
  patch: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    requestWithRetry<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, ...(init || {}) }),
  delete: <T = unknown>(path: string, init?: RequestInit) => 
    requestWithRetry<T>(path, { method: 'DELETE', ...(init || {}) }),
  baseUrl: getBaseUrl,

  // Extended methods for compatibility
  login: async (username: string, password: string) => {
    const response = await requestWithRetry<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (response.access_token) {
      localStorage.setItem('auth_token', response.access_token);
    }
    return response;
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    return Promise.resolve();
  },

  getCurrentUser: () => requestWithRetry<any>('/auth/me'),
  
  getSettings: () => requestWithRetry<any>('/api/settings'),

  // Enhanced Trading System API - All backend endpoints
  trading: {
    // Signal Generation
    generateSignal: (symbol: string, interval = '1h') =>
      requestWithRetry<any>('/api/signals/generate', { method: 'POST', body: JSON.stringify({ symbol, interval }) }),
    
    getLiveSignals: () => requestWithRetry<any>('/api/signals/live'),
    
    // Market Analysis
    getAnalysis: (symbol: string) => requestWithRetry<any>(`/api/analysis/${symbol}`),
    getMultiTimeframeAnalysis: (symbol: string) => requestWithRetry<any>(`/api/analysis/multi-timeframe/${symbol}`),
    
    // Scanner
    runScanner: (config: any) => requestWithRetry<any>('/api/scanner/run', { method: 'POST', body: JSON.stringify(config) }),
    scanSingleSymbol: (symbol: string, timeframes = "15m,1h,4h") => 
      requestWithRetry<any>(`/api/scanner/symbol/${symbol}?timeframes=${timeframes}`),
    
    // Backtesting
    runBacktest: (config: any) => requestWithRetry<any>('/api/backtest/run', { method: 'POST', body: JSON.stringify(config) }),
    getBacktestResults: (backtestId: string) => requestWithRetry<any>(`/api/backtest/results/${backtestId}`),
    exportBacktest: (backtestId: string) => requestWithRetry<any>(`/api/backtest/export/${backtestId}`),
    
    // Risk Management
    getRiskMetrics: () => requestWithRetry<any>('/api/risk/metrics'),
    calculatePositionSize: (config: any) => requestWithRetry<any>('/api/risk/calculate-position', { method: 'POST', body: JSON.stringify(config) }),
    getPortfolioRiskAssessment: () => requestWithRetry<any>('/api/risk/portfolio-assessment'),
    getRiskLimits: () => requestWithRetry<any>('/api/risk/limits'),
    updateRiskLimits: (limits: any) => requestWithRetry<any>('/api/risk/limits', { method: 'PUT', body: JSON.stringify(limits) }),
    
    // P&L and Portfolio
    getPortfolioSummary: () => requestWithRetry<any>('/api/pnl/portfolio-summary'),
    getEquityCurve: (timeframe = "1D", daysBack = 30) => 
      requestWithRetry<any>(`/api/pnl/equity-curve?timeframe=${timeframe}&days_back=${daysBack}`),
    getPerformanceByAsset: (timeframe = "30D") => requestWithRetry<any>(`/api/pnl/performance-by-asset?timeframe=${timeframe}`),
    getPortfolioMetrics: () => requestWithRetry<any>('/api/pnl/portfolio-metrics'),
    getTradeHistory: (limit = 50, symbol?: string) => 
      requestWithRetry<any>(`/api/pnl/trade-history?limit=${limit}${symbol ? `&symbol=${symbol}` : ''}`),
    getSignalHistory: (limit = 50, symbol?: string) => 
      requestWithRetry<any>(`/api/pnl/signal-history?limit=${limit}${symbol ? `&symbol=${symbol}` : ''}`),
    
    // AI and Analytics
    getPredictions: (symbol: string) => requestWithRetry<any>(`/api/analytics/predictions/${symbol}`),
    generateStrategy: (config: any) => requestWithRetry<any>('/api/analytics/generate-strategy', { method: 'POST', body: JSON.stringify(config) }),
    getMarketDepth: (symbol: string) => requestWithRetry<any>(`/api/analytics/market-depth/${symbol}`),
    getCorrelations: () => requestWithRetry<any>('/api/analytics/correlations'),
    getPerformanceMetrics: () => requestWithRetry<any>('/api/analytics/performance-metrics'),
    
    // AI Sentiment and Analysis
    analyzeSentiment: (symbol: string) => requestWithRetry<any>(`/api/ai/sentiment/${symbol}`),
    generateMarketAnalysis: (config: any) => requestWithRetry<any>('/api/ai/market-analysis', { method: 'POST', body: JSON.stringify(config) }),
    getTradingInsights: (symbol: string) => requestWithRetry<any>(`/api/ai/insights/${symbol}`),
    summarizeNews: (newsTexts: string[]) => requestWithRetry<any>('/api/ai/summarize-news', { method: 'POST', body: JSON.stringify({ news_texts: newsTexts }) }),
    askQuestion: (question: string, context: any) => requestWithRetry<any>('/api/ai/ask-question', { method: 'POST', body: JSON.stringify({ question, context }) }),
    
    // Phase 3 Advanced Analysis
    getPhase3ComprehensiveAnalysis: (symbol: string, interval = "1h", limit = 200) => 
      requestWithRetry<any>(`/api/analytics/phase3/comprehensive/${symbol}?interval=${interval}&limit=${limit}`),
    getHarmonicAnalysis: (symbol: string, interval = "1h", limit = 200) => 
      requestWithRetry<any>(`/api/analytics/phase3/harmonic/${symbol}?interval=${interval}&limit=${limit}`),
    getElliottAnalysis: (symbol: string, interval = "1h", limit = 200) => 
      requestWithRetry<any>(`/api/analytics/phase3/elliott/${symbol}?interval=${interval}&limit=${limit}`),
    getSMCAnalysis: (symbol: string, interval = "1h", limit = 200) => 
      requestWithRetry<any>(`/api/analytics/phase3/smc/${symbol}?interval=${interval}&limit=${limit}`),
    getPhase3Status: () => requestWithRetry<any>('/api/analytics/phase3/status'),
    
    // Database and System
    getTradingSessions: () => requestWithRetry<any>('/api/database/trading-sessions'),
    getSignalRecords: (limit = 100) => requestWithRetry<any>(`/api/database/signals?limit=${limit}`),
    getTradeRecords: (limit = 100) => requestWithRetry<any>(`/api/database/trades?limit=${limit}`),
    createTradingSession: (initialBalance = 10000) => 
      requestWithRetry<any>('/api/database/create-session', { method: 'POST', body: JSON.stringify({ initial_balance: initialBalance }) }),
    getSystemMetrics: () => requestWithRetry<any>('/api/database/system-metrics'),
    getDatabaseRiskLimits: () => requestWithRetry<any>('/api/database/risk-limits'),
    
    // Configuration
    getWeights: () => requestWithRetry<any>('/api/config/weights'),
    updateWeights: (weights: any) => requestWithRetry<any>('/api/config/weights', { method: 'POST', body: JSON.stringify(weights) }),
    
    // System Status
    getSystemStatus: () => requestWithRetry<any>('/api/system/status'),
    broadcastMessage: (message: any) => requestWithRetry<any>('/api/system/broadcast', { method: 'POST', body: JSON.stringify(message) }),
    
    // Notifications
    testTelegram: () => requestWithRetry<any>('/api/notifications/test', { method: 'POST' }),
    getNotificationSettings: () => requestWithRetry<any>('/api/notifications/settings'),
    updateNotificationSettings: (settings: any) => requestWithRetry<any>('/api/notifications/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  },

  // Crypto Data Aggregation API - All free/demo providers
  crypto: {
    // Summary endpoint - aggregates all data
    summary: (ids = "bitcoin,ethereum,binancecoin", newsLimit = 20, whaleMinUsd = 500000) =>
      requestWithRetry<any>(`/api/summary?ids=${encodeURIComponent(ids)}&news_limit=${newsLimit}&whale_min_usd=${whaleMinUsd}`),

    // Market endpoints
    marketGlobal: () => requestWithRetry<any>('/api/market/global'),
    prices: (ids: string) => requestWithRetry<any>(`/api/market/prices?ids=${encodeURIComponent(ids)}`),
    paprikaTickers: (limit = 15) => requestWithRetry<any>(`/api/market/paprika/tickers?limit=${limit}`),
    coinbaseStats: () => requestWithRetry<any>('/api/exchange/coinbase/stats'),

    // Sentiment endpoint
    fng: () => requestWithRetry<any>('/api/sentiment/fng'),

    // News endpoints
    newsCryptoPanic: () => requestWithRetry<any>('/api/news/cryptopanic'),
    newsCryptoCompare: () => requestWithRetry<any>('/api/news/cryptocompare'),
    newsCryptoNews: () => requestWithRetry<any>('/api/news/cryptonews'),
    newsRss: () => requestWithRetry<any>('/api/news/rss'),

    // Whales & On-chain endpoints
    whalesBtc: () => requestWithRetry<any>('/api/whales/btc'),
    whalesAlert: (minValueUsd = 500000) => requestWithRetry<any>(`/api/whales/alert?min_value_usd=${minValueUsd}`),
    btcTx: (txHash: string) => requestWithRetry<any>(`/api/onchain/btc/tx/${encodeURIComponent(txHash)}`),

    // DeFi endpoints
    defiLlamaProtocols: () => requestWithRetry<any>('/api/defi/llama/protocols'),
    defiLlamaOverview: () => requestWithRetry<any>('/api/defi/llama/overview'),
    defipulseDemo: () => requestWithRetry<any>('/api/defi/defipulse/demo'),
  },
};

// Export as apiService for backwards compatibility with existing components
export const apiService = api;

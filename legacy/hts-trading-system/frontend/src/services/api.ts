/**
 * HTS Trading System - API Service
 * Centralized API communication layer with error handling and caching
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// Types
export interface TradingSignal {
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  price: number;
  rsi?: number;
  macd?: number;
  volume_ratio?: number;
  components?: {
    rsi_macd: number;
    smc: number;
    pattern: number;
    sentiment: number;
    ml: number;
  };
  timestamp: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  change_24h: number;
  volume?: number;
  high_24h?: number;
  low_24h?: number;
  timestamp: string;
}

export interface PortfolioSummary {
  total_value: number;
  cash_balance: number;
  invested_value: number;
  total_pnl: number;
  unrealized_pnl: number;
  realized_pnl: number;
  daily_pnl: number;
  pnl_pct: number;
  daily_pnl_pct: number;
  position_count: number;
  winning_positions: number;
  losing_positions: number;
  win_rate: number;
  largest_winner: number;
  largest_loser: number;
  last_update: string;
}

export interface Position {
  id: number;
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  market_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  total_pnl: number;
  pnl_pct: number;
  weight: number;
  entry_time: string;
  last_update: string;
  stop_loss?: number;
  take_profit?: number;
}

export interface APIHealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  response_time: number;
  last_check: string;
  error_count: number;
  success_count: number;
  consecutive_failures: number;
  success_rate: number;
}

export interface BacktestResult {
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_return: number;
  total_return_pct: number;
  max_drawdown: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  avg_win: number;
  avg_loss: number;
  largest_win: number;
  largest_loss: number;
  avg_trade_duration: number;
  trades: any[];
  equity_curve: any[];
}

export interface Trade {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  trade_value: number;
  pnl: number;
  fees: number;
  executed_at: string;
}

// API Client Class
class APIClient {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        console.error('API Response Error:', error);
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data || error.message;
      
      switch (status) {
        case 400:
          toast.error('Bad request - please check your input');
          break;
        case 401:
          toast.error('Unauthorized - please check your credentials');
          break;
        case 403:
          toast.error('Forbidden - insufficient permissions');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 429:
          toast.error('Rate limit exceeded - please wait');
          break;
        case 500:
          toast.error('Server error - please try again later');
          break;
        default:
          toast.error(`API Error: ${message}`);
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error - please check your connection');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}${params ? JSON.stringify(params) : ''}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    useCache: boolean = false
  ): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, data);
    
    if (useCache && method === 'GET') {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        data,
      });

      if (useCache && method === 'GET') {
        this.setCache(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Health Check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string; services: any }>('GET', '/api/health');
  }

  // API Health
  async getAllAPIsHealth() {
    return this.request<Record<string, APIHealthStatus>>('GET', '/api/health/all-apis', undefined, true);
  }

  // Trading Signals
  async getSignal(symbol: string) {
    return this.request<TradingSignal>('GET', `/api/signals/${symbol}`, undefined, true);
  }

  async getAllSignals() {
    return this.request<Record<string, TradingSignal>>('GET', '/api/signals', undefined, true);
  }

  // Price Data
  async getPrice(symbol: string) {
    return this.request<PriceData>('GET', `/api/prices/${symbol}`, undefined, true);
  }

  async getAllPrices() {
    return this.request<Record<string, PriceData>>('GET', '/api/prices', undefined, true);
  }

  async getKuCoinPrice(symbol: string) {
    return this.request<any>('GET', `/api/kucoin/price/${symbol}`);
  }

  // Portfolio
  async getPortfolioStatus() {
    return this.request<PortfolioSummary>('GET', '/api/portfolio/status', undefined, true);
  }

  // Backtesting
  async runBacktest(symbol: string, days: number = 30) {
    return this.request<BacktestResult>('GET', `/api/backtest/${symbol}?days=${days}`);
  }

  // Trading
  async logTrade(tradeData: any) {
    return this.request<{ success: boolean; trade_id: number }>('POST', '/api/trades/log', tradeData);
  }

  async getTradeHistory(limit: number = 100) {
    return this.request<Trade[]>('GET', `/api/trades/history?limit=${limit}`);
  }

  // WebSocket Connection
  createWebSocket(onMessage: (data: any) => void, onError?: (error: Event) => void): WebSocket {
    const ws = new WebSocket(WS_BASE_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      toast.success('Connected to real-time data');
      
      // Subscribe to all channels
      ws.send(JSON.stringify({
        action: 'subscribe',
        channels: ['prices', 'signals', 'portfolio', 'api_health']
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      toast.error('Disconnected from real-time data');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) {
        onError(error);
      }
    };

    return ws;
  }

  // Utility Methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Utility functions
export const formatPrice = (price: number, decimals: number = 2): string => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  } else if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}K`;
  } else {
    return `$${price.toFixed(decimals)}`;
  }
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

export const formatVolume = (volume: number): string => {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  } else {
    return volume.toFixed(0);
  }
};

export const getSignalColor = (signal: string): string => {
  switch (signal) {
    case 'STRONG_BUY':
      return 'text-bull-400 bg-bull-500/20 border-bull-500/30';
    case 'BUY':
      return 'text-bull-300 bg-bull-500/10 border-bull-500/20';
    case 'HOLD':
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'SELL':
      return 'text-bear-300 bg-bear-500/10 border-bear-500/20';
    case 'STRONG_SELL':
      return 'text-bear-400 bg-bear-500/20 border-bear-500/30';
    default:
      return 'text-dark-400 bg-dark-500/20 border-dark-500/30';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy':
      return 'text-bull-400 bg-bull-500/20';
    case 'degraded':
      return 'text-yellow-400 bg-yellow-500/20';
    case 'down':
      return 'text-bear-400 bg-bear-500/20';
    default:
      return 'text-dark-400 bg-dark-500/20';
  }
};

export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

export const formatDuration = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  } else if (hours < 24) {
    return `${Math.round(hours)}h`;
  } else {
    return `${Math.round(hours / 24)}d`;
  }
};

// Export default
export default apiClient;
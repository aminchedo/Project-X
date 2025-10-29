/**
 * Centralized API Client
 * 
 * All backend REST calls go through this file.
 * No component should use fetch() or axios directly.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE } from '../config/runtime';
import type {
  PortfolioSummary,
  PnLSummary,
  RiskSnapshot,
  TradingSignal,
  ScanResult,
  ScannerFilters,
} from '../stores/useAppStore';

// ==================== Axios Instance ====================

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token if exists)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handle errors globally)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token
      localStorage.removeItem('auth_token');
      // Don't redirect - just log
      console.warn('Unauthorized request, token cleared');
    }
    return Promise.reject(error);
  }
);

// ==================== API Functions ====================

// ---------- Portfolio Endpoints ----------

export const getPortfolioStatus = async (): Promise<PortfolioSummary> => {
  const response = await axiosInstance.get('/api/portfolio/status');
  return response.data;
};

export const getPnL = async (): Promise<PnLSummary> => {
  const response = await axiosInstance.get('/api/portfolio/pnl');
  return response.data;
};

// ---------- Risk Endpoints ----------

export const getRiskLive = async (): Promise<RiskSnapshot> => {
  const response = await axiosInstance.get('/api/risk/live');
  return response.data;
};

// ---------- Signal Endpoints ----------

export const getSignals = async (): Promise<TradingSignal> => {
  const response = await axiosInstance.get('/api/signals');
  return response.data;
};

export interface ScanRequest {
  symbols: string[];
  timeframes: string[];
  minScore: number;
  signalTypes: string[];
}

export const scanSignals = async (filters: ScanRequest): Promise<ScanResult[]> => {
  const response = await axiosInstance.post('/api/signals/scan', filters);
  return response.data;
};

// ---------- Market Data Endpoints ----------

export interface Candle {
  t: number;  // timestamp
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}

export const getCandles = async (
  symbol: string,
  timeframe: string,
  limit: number = 100
): Promise<Candle[]> => {
  const response = await axiosInstance.get('/market/candles', {
    params: { symbol, timeframe, limit },
  });
  return response.data;
};

// ==================== Error Handling ====================

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      return error.response.data?.message || error.response.data?.detail || 'Server error';
    } else if (error.request) {
      // No response received
      return 'No response from server. Check if backend is running on ' + API_BASE;
    }
  }
  return error instanceof Error ? error.message : 'Unknown error';
};

// ==================== Health Check ==========

export const healthCheck = async (): Promise<boolean> => {
  try {
    await axiosInstance.get('/health');
    return true;
  } catch {
    return false;
  }
};

// ==================== Legacy API Object (for backward compatibility) ==========

export const api = {
  get: async (url: string) => {
    const response = await axiosInstance.get(url);
    return response.data;
  },
  post: async (url: string, data?: any) => {
    const response = await axiosInstance.post(url, data);
    return response.data;
  },
  crypto: {
    getCandlesticks: async (symbol: string, timeframe: string) => {
      return await getCandles(symbol, timeframe, 100);
    },
  },
};

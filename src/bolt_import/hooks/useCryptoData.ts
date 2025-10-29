/**
 * Custom React Hooks for Cryptocurrency Data
 * 
 * Hooks:
 * - useMarketData - Real-time price updates
 * - useMarketOverview - Combined market data
 * - useWhaleFeed - Real-time whale transactions
 * - useSentiment - Market sentiment analysis
 * - useNews - Cryptocurrency news
 * - useHistoricalData - Price history
 * - useCompleteAssetData - Comprehensive asset data
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  cryptoDataOrchestrator,
  MarketOverview,
  CompleteAssetData,
  NewsAndSentiment
} from '../services/CryptoDataOrchestrator';
import { EnhancedMarketData } from '../services/EnhancedMarketDataService';
import { NewsArticle } from '../services/NewsService';
import { SentimentData } from '../services/SentimentService';
import { WhaleTransaction } from '../services/WhaleTrackingService';

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for real-time market data with auto-refresh
 */
export function useMarketData(
  symbols: string[],
  refreshInterval: number = 60000 // 1 minute default
): UseDataResult<EnhancedMarketData[]> {
  const [data, setData] = useState<EnhancedMarketData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const prices = await cryptoDataOrchestrator.getCurrentPrices(symbols);
      setData(prices);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up auto-refresh
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for comprehensive market overview
 */
export function useMarketOverview(
  symbols: string[] = ['BTC', 'ETH', 'BNB'],
  refreshInterval: number = 120000 // 2 minutes default
): UseDataResult<MarketOverview> {
  const [data, setData] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const overview = await cryptoDataOrchestrator.getMarketOverview(symbols);
      setData(overview);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market overview';
      setError(errorMessage);
      console.error('Market overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for whale transaction feed
 */
export function useWhaleFeed(
  pollingInterval: number = 30000 // eslint-disable-line @typescript-eslint/no-unused-vars
): UseDataResult<WhaleTransaction[]> & { statistics: any } {
  const [data, setData] = useState<WhaleTransaction[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const isMonitoringRef = useRef<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const transactions = cryptoDataOrchestrator.getWhaleActivity(50);
      const stats = cryptoDataOrchestrator.getWhaleStatistics();
      setData(transactions);
      setStatistics(stats);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch whale data';
      setError(errorMessage);
      console.error('Whale feed fetch error:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Start monitoring if not already started
    if (!isMonitoringRef.current) {
      cryptoDataOrchestrator.startRealTimeMonitoring({
        onWhaleTransaction: (transaction) => {
          setData(prev => {
            const updated = [transaction, ...(prev || [])];
            return updated.slice(0, 50); // Keep last 50
          });

          // Update statistics
          const stats = cryptoDataOrchestrator.getWhaleStatistics();
          setStatistics(stats);
        },
      });
      isMonitoringRef.current = true;
    }

    // Initial fetch
    fetchData();

    // Cleanup
    return () => {
      if (isMonitoringRef.current) {
        cryptoDataOrchestrator.stopRealTimeMonitoring();
        isMonitoringRef.current = false;
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, statistics };
}

/**
 * Hook for market sentiment
 */
export function useSentiment(
  symbol: string = 'BTC',
  refreshInterval: number = 300000 // 5 minutes default
): UseDataResult<SentimentData> {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const sentiment = await cryptoDataOrchestrator.getSentiment(symbol);
      setData(sentiment);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sentiment';
      setError(errorMessage);
      console.error('Sentiment fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for cryptocurrency news
 */
export function useNews(
  limit: number = 20,
  refreshInterval: number = 300000 // 5 minutes default
): UseDataResult<NewsArticle[]> {
  const [data, setData] = useState<NewsArticle[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const news = await cryptoDataOrchestrator.getLatestNews(limit);
      setData(news);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news';
      setError(errorMessage);
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for historical price data
 */
export function useHistoricalData(
  symbol: string,
  days: number = 30
): UseDataResult<Array<{ time: number; price: number }>> {
  const [data, setData] = useState<Array<{ time: number; price: number }> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const historical = await cryptoDataOrchestrator.getHistoricalData(symbol, days);
      setData(historical);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch historical data';
      setError(errorMessage);
      console.error('Historical data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for complete asset data
 */
export function useCompleteAssetData(
  symbol: string,
  historicalDays: number = 30
): UseDataResult<CompleteAssetData> {
  const [data, setData] = useState<CompleteAssetData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const assetData = await cryptoDataOrchestrator.getCompleteAssetData(symbol, historicalDays);
      setData(assetData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch asset data';
      setError(errorMessage);
      console.error('Asset data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, historicalDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for news with sentiment context
 */
export function useNewsAndSentiment(
  limit: number = 20,
  refreshInterval: number = 300000 // 5 minutes default
): UseDataResult<NewsAndSentiment> {
  const [data, setData] = useState<NewsAndSentiment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const newsAndSentiment = await cryptoDataOrchestrator.getNewsAndSentiment(limit);
      setData(newsAndSentiment);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch news and sentiment';
      setError(errorMessage);
      console.error('News and sentiment fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData();

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
}


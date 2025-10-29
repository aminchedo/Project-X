/**
 * Live Data Context - WebSocket Manager
 * 
 * Responsibilities:
 * - Open WebSocket connection to /ws/market
 * - Listen for ticker, orderBook, and signal updates
 * - Push live data into global store
 * - Auto-reconnect on disconnect
 * - Report connection status and errors via toasts
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { WS_URL } from '../config/runtime';
import type { Ticker, OrderBook, TradingSignal } from '../stores/useAppStore';

// ==================== Types ====================

interface LiveDataContextValue {
  isConnected: boolean;
  lastMessage: any;
  reconnect: () => void;
}

interface WebSocketMessage {
  type: 'ticker' | 'orderbook' | 'signal' | 'error';
  symbol?: string;
  bid?: number;
  ask?: number;
  last?: number;
  bids?: [string, string][];  // Backend sends as strings
  asks?: [string, string][];
  timeframe?: string;
  direction?: 'LONG' | 'SHORT';
  confidence?: number;
  data?: any;
  message?: string;
}

// ==================== Context ====================

const LiveDataContext = createContext<LiveDataContextValue | null>(null);

export const useLiveData = () => {
  const context = useContext(LiveDataContext);
  if (!context) {
    throw new Error('useLiveData must be used within LiveDataProvider');
  }
  return context;
};

// ==================== Provider ====================

interface LiveDataProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

export const LiveDataProvider: React.FC<LiveDataProviderProps> = ({
  children,
  autoConnect = true,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY = 3000; // 3 seconds

  const {
    setConnectionStatus,
    setTicker,
    setOrderBook,
    setLastSignal,
    setLastError,
  } = useAppStore();

  // ========== WebSocket Message Handler ==========
  
  const handleMessage = (event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      setLastMessage(message);

      switch (message.type) {
        case 'ticker':
          if (message.bid && message.ask && message.last) {
            const ticker: Ticker = {
              bid: message.bid,
              ask: message.ask,
              last: message.last,
            };
            setTicker(ticker);
          }
          break;

        case 'orderbook':
          if (message.bids && message.asks) {
            // Convert string arrays to number arrays
            const orderBook: OrderBook = {
              bids: message.bids.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
              asks: message.asks.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
            };
            setOrderBook(orderBook);
          }
          break;

        case 'signal':
          if (message.symbol && message.timeframe && message.direction && message.confidence !== undefined) {
            const signal: TradingSignal = {
              symbol: message.symbol,
              timeframe: message.timeframe,
              direction: message.direction,
              confidence: message.confidence,
            };
            setLastSignal(signal);
          }
          break;

        case 'error':
          console.error('WebSocket error message:', message.message);
          setLastError(message.message || 'WebSocket error');
          showToast('WebSocket error: ' + (message.message || 'Unknown'), 'error');
          break;

        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      setLastError('Failed to parse WebSocket frame');
      showToast('Failed to parse WebSocket data', 'error');
    }
  };

  // ========== Connection Management ==========

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      console.log('Connecting to WebSocket:', WS_URL);
      
      setConnectionStatus('connecting');
      showToast('Connecting to market data...', 'info');

      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setConnectionStatus('connected');
        setLastError(null);
        reconnectAttemptsRef.current = 0;
        showToast('Connected to live market data', 'success');
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setLastError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          setConnectionStatus('reconnecting');
          showToast(`Reconnecting... (attempt ${reconnectAttemptsRef.current + 1})`, 'warning');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          console.error('Max reconnect attempts reached');
          setConnectionStatus('error');
          setLastError('Failed to reconnect after multiple attempts');
          showToast('Failed to connect to market data. Check backend server.', 'error');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error');
      setLastError('Failed to create WebSocket connection');
      showToast('Failed to initialize WebSocket', 'error');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const reconnect = () => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  };

  // ========== Effects ==========

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // ========== Context Value ==========

  const value: LiveDataContextValue = {
    isConnected,
    lastMessage,
    reconnect,
  };

  return (
    <LiveDataContext.Provider value={value}>
      {children}
    </LiveDataContext.Provider>
  );
};

// ==================== Toast Helper ==========

// Simple toast function - replace with your actual toast system
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // If you have a toast system, use it here:
  // import { toast } from 'react-hot-toast';
  // toast[type](message);
};

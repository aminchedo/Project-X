// src/services/websocket.ts

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
type MessageListener = (event: MessageEvent) => void;
type StateListener = (state: ConnectionState) => void;

function normalizeBase(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function resolveWsBase() {
  const env = (import.meta as any).env?.VITE_WS_URL as string | undefined;
  if (env && env.trim()) return normalizeBase(env.trim());
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Use backend port 8000 for WebSocket connections
  return `${proto}//localhost:8000`;
}

/**
 * WebSocket Manager with state tracking
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private messageListeners: Set<MessageListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1500;

  constructor(
    private endpoint: string,
    private autoReconnect: boolean = true
  ) {}

  /**
   * Connect to WebSocket endpoint
   */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    this.setState('connecting');
    const base = resolveWsBase();
    // Fix URL construction to prevent duplicate /ws/
    const url = this.endpoint.startsWith('/') ? base + this.endpoint : base + '/' + this.endpoint;

    try {
      this.ws = new WebSocket(url);

      this.ws.addEventListener('open', () => {
        console.log('WebSocket connected:', url);
        this.setState('connected');
        this.reconnectAttempts = 0;
      });

      this.ws.addEventListener('message', (event) => {
        this.messageListeners.forEach(listener => listener(event));
      });

      this.ws.addEventListener('close', () => {
        console.log('WebSocket closed');
        this.setState('disconnected');
        this.handleReconnect();
      });

      this.ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        this.setState('error');
      });

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.setState('error');
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.autoReconnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState('disconnected');
  }

  /**
   * Send message to WebSocket
   */
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Subscribe to messages
   */
  onMessage(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    // Immediately notify with current state
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Set connection state and notify listeners
   */
  private setState(newState: ConnectionState): void {
    if (this.state === newState) return;
    this.state = newState;
    this.stateListeners.forEach(listener => listener(newState));
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (!this.autoReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached or auto-reconnect disabled');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.setState('reconnecting');

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

/**
 * Enhanced WebSocket service for real-time trading data
 */
export class TradingWebSocketService extends WebSocketManager {
  private subscriptions: Set<string> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(endpoint: string = '/ws/realtime', autoReconnect: boolean = true) {
    super(endpoint, autoReconnect);
  }

  /**
   * Enhanced connect with trading-specific setup
   */
  connect(): void {
    super.connect();
    
    // Start heartbeat when connected
    this.onStateChange((state) => {
      if (state === 'connected') {
        this.startHeartbeat();
        this.resubscribe();
      } else {
        this.stopHeartbeat();
      }
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.getState() === 'connected') {
        this.send({ action: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Re-subscribe to all previous subscriptions
   */
  private resubscribe(): void {
    this.subscriptions.forEach(symbol => {
      this.subscribeToSymbol(symbol);
    });
  }

  /**
   * Subscribe to symbol updates
   */
  subscribeToSymbol(symbol: string): void {
    this.subscriptions.add(symbol);
    this.send({
      action: 'subscribe',
      symbol: symbol
    });
  }

  /**
   * Unsubscribe from symbol updates
   */
  unsubscribeFromSymbol(symbol: string): void {
    this.subscriptions.delete(symbol);
    this.send({
      action: 'unsubscribe',
      symbol: symbol
    });
  }

  /**
   * Subscribe to multiple symbols
   */
  subscribeToMultipleSymbols(symbols: string[]): void {
    symbols.forEach(symbol => this.subscribeToSymbol(symbol));
  }

  /**
   * Request prediction for a symbol
   */
  requestPrediction(symbol: string): void {
    this.send({
      action: 'get_prediction',
      symbol: symbol
    });
  }

  /**
   * Generate strategy for a symbol
   */
  generateStrategy(symbol: string, marketConditions: any): void {
    this.send({
      action: 'generate_strategy',
      symbol: symbol,
      market_conditions: marketConditions
    });
  }

  /**
   * Get system status
   */
  getStatus(): void {
    this.send({
      action: 'get_status'
    });
  }

  /**
   * Get current subscriptions
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  /**
   * Enhanced disconnect
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.subscriptions.clear();
    super.disconnect();
  }
}

// Create global instances for different WebSocket endpoints
export const realtimeWs = new TradingWebSocketService('/ws/realtime');
export const signalsWs = new WebSocketManager('/ws/signals');
export const pricesWs = new WebSocketManager('/ws/prices');

/**
 * Legacy function for backwards compatibility
 */
export function connectWs(path: string, onMessage?: MessageListener, opts: { autoReconnect?: boolean; delayMs?: number } = {}) {
  const base = resolveWsBase();
  // Fix URL construction to prevent duplicate /ws/
  const url = path.startsWith('/') ? base + path : base + '/' + path;
  const ws = new WebSocket(url);

  const auto = opts.autoReconnect ?? true;
  const delay = opts.delayMs ?? 1500;

  if (onMessage) ws.addEventListener('message', onMessage);

  if (auto) {
    ws.addEventListener('close', () => {
      setTimeout(() => connectWs(path, onMessage, opts), delay);
    });
  }
  return ws;
}

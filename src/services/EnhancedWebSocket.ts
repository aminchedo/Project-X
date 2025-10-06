// Browser-compatible EventEmitter implementation
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
  compression?: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  reconnecting: boolean;
  reconnectAttempts: number;
  lastConnected?: Date;
  lastError?: string;
  latency?: number;
}

export class EnhancedWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private status: ConnectionStatus;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private subscriptions: Set<string> = new Set();
  private isDestroyed = false;

  constructor(config: WebSocketConfig) {
    super();
    
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageQueueSize: config.messageQueueSize || 100,
      compression: config.compression || false
    };

    this.status = {
      connected: false,
      reconnecting: false,
      reconnectAttempts: 0
    };

    this.connect();
  }

  private connect(): void {
    if (this.isDestroyed) return;

    try {
      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Set binary type for compression if enabled
      if (this.config.compression) {
        this.ws.binaryType = 'arraybuffer';
      }
    } catch (error) {
      this.handleError(error as Event);
    }
  }

  private handleOpen(event: Event): void {
    console.log('WebSocket connected:', this.config.url);
    
    this.status = {
      connected: true,
      reconnecting: false,
      reconnectAttempts: 0,
      lastConnected: new Date()
    };

    this.emit('connected', this.status);
    this.startHeartbeat();
    this.resubscribe();
    this.processMessageQueue();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      let data: any;
      
      if (this.config.compression && event.data instanceof ArrayBuffer) {
        // Handle compressed data (would need decompression library)
        data = JSON.parse(new TextDecoder().decode(event.data));
      } else {
        data = JSON.parse(event.data);
      }

      const message: WebSocketMessage = {
        type: data.type || 'message',
        data: data.data || data,
        timestamp: Date.now(),
        id: data.id
      };

      // Update latency if this is a heartbeat response
      if (message.type === 'pong') {
        this.status.latency = Date.now() - (data.timestamp || 0);
      }

      this.emit('message', message);
      this.emit(message.type, message.data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.emit('error', { type: 'parse_error', error });
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    
    this.status.connected = false;
    this.status.lastError = `Connection closed: ${event.code} - ${event.reason}`;
    
    this.emit('disconnected', this.status);
    this.stopHeartbeat();

    if (!this.isDestroyed && this.status.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else if (this.status.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('max_reconnect_attempts_reached');
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    
    this.status.lastError = 'Connection error';
    this.emit('error', { type: 'connection_error', event });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.status.reconnecting = true;
    this.status.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.status.reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.status.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);

    this.emit('reconnecting', this.status);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          timestamp: Date.now()
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private resubscribe(): void {
    // Resubscribe to all previous subscriptions
    this.subscriptions.forEach(topic => {
      this.send({
        type: 'subscribe',
        topic
      });
    });
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.status.connected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  public send(data: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue message for later if not connected
      if (this.messageQueue.length < this.config.messageQueueSize) {
        this.messageQueue.push({
          type: 'queued',
          data,
          timestamp: Date.now()
        });
      }
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.emit('error', { type: 'send_error', error });
      return false;
    }
  }

  public subscribe(topic: string): void {
    this.subscriptions.add(topic);
    
    if (this.status.connected) {
      this.send({
        type: 'subscribe',
        topic
      });
    }
  }

  public unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);
    
    if (this.status.connected) {
      this.send({
        type: 'unsubscribe',
        topic
      });
    }
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  public getLatency(): number | undefined {
    return this.status.latency;
  }

  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  public reconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.status.reconnectAttempts = 0;
    this.connect();
  }

  public destroy(): void {
    this.isDestroyed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.removeAllListeners();
    this.messageQueue = [];
    this.subscriptions.clear();
  }
}

// Trading-specific WebSocket service
export class TradingWebSocket extends EnhancedWebSocket {
  constructor(url: string = 'ws://localhost:8000/ws') {
    super({
      url,
      reconnectInterval: 3000,
      maxReconnectAttempts: 15,
      heartbeatInterval: 20000,
      messageQueueSize: 200,
      compression: true
    });

    // Set up trading-specific event handlers
    this.setupTradingHandlers();
  }

  private setupTradingHandlers(): void {
    this.on('connected', () => {
      console.log('Trading WebSocket connected');
      // Subscribe to default trading channels
      this.subscribe('market_data');
      this.subscribe('signals');
      this.subscribe('risk_alerts');
      this.subscribe('portfolio_updates');
    });

    this.on('market_data', (data) => {
      this.emit('marketUpdate', data);
    });

    this.on('signals', (data) => {
      this.emit('signalUpdate', data);
    });

    this.on('risk_alerts', (data) => {
      this.emit('riskAlert', data);
    });

    this.on('portfolio_updates', (data) => {
      this.emit('portfolioUpdate', data);
    });
  }

  public subscribeToSymbol(symbol: string): void {
    this.subscribe(`market_data:${symbol}`);
    this.subscribe(`signals:${symbol}`);
  }

  public unsubscribeFromSymbol(symbol: string): void {
    this.unsubscribe(`market_data:${symbol}`);
    this.unsubscribe(`signals:${symbol}`);
  }

  public requestHistoricalData(symbol: string, timeframe: string, limit: number): void {
    this.send({
      type: 'request_historical',
      symbol,
      timeframe,
      limit
    });
  }

  public requestSignalAnalysis(symbol: string): void {
    this.send({
      type: 'request_signal_analysis',
      symbol
    });
  }
}

// Singleton instance
export const tradingWebSocket = new TradingWebSocket();

export default EnhancedWebSocket;

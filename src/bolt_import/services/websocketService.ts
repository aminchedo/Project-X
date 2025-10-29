import { MarketData } from '../types';

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: ((data: MarketData[]) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isConnected = false;

  // Binance WebSocket endpoints for real-time data
  private readonly BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/';
  private readonly SYMBOLS = ['btcusdt', 'ethusdt', 'bnbusdt', 'adausdt', 'solusdt'];

  async initialize(): Promise<void> {
    try {
      await this.connect();
      console.log('WebSocket service initialized');
    } catch (error) {
      console.error('Failed to initialize WebSocket service:', error);
      // Fallback to polling
      this.startPollingFallback();
    }
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create stream names for multiple symbols
        const streams = this.SYMBOLS.map(symbol => `${symbol}@ticker`).join('/');
        const wsUrl = `${this.BINANCE_WS_URL}${streams}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: any): void {
    if (data.stream && data.data) {
      const symbol = data.data.s.toUpperCase().replace('USDT', '');
      const marketData: MarketData = {
        id: symbol.toLowerCase(),
        symbol: symbol,
        name: this.getCoinName(symbol),
        price: parseFloat(data.data.c),
        change24h: parseFloat(data.data.P),
        changePercent24h: parseFloat(data.data.P),
        volume24h: parseFloat(data.data.v),
        marketCap: 0, // Not available in ticker stream
        high24h: parseFloat(data.data.h),
        low24h: parseFloat(data.data.l),
        timestamp: Date.now()
      };

      // Notify subscribers with single coin update
      this.subscribers.forEach(callback => {
        // In a real implementation, you'd maintain a cache and update it
        // For now, we'll just pass the single coin data
        callback([marketData]);
      });
    }
  }

  private getCoinName(symbol: string): string {
    const names: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'BNB',
      'ADA': 'Cardano',
      'SOL': 'Solana'
    };
    return names[symbol] || symbol;
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(() => {
          // If reconnection fails, continue trying
        });
      }, this.reconnectInterval);
    } else {
      console.log('Max reconnection attempts reached. Falling back to polling.');
      this.startPollingFallback();
    }
  }

  private startPollingFallback(): void {
    // Fallback to polling every 30 seconds
    setInterval(() => {
      if (!this.isConnected) {
        // Try to reconnect
        this.connect().catch(() => {
          // Continue polling if connection fails
        });
      }
    }, 30000);
  }

  subscribe(callback: (data: MarketData[]) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();

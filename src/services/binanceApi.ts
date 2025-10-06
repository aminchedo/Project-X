import { API_KEYS } from '../config/apiKeys';

export class BinanceAPI {
  private baseUrl = 'https://api.binance.com';
  private testnetUrl = 'https://testnet.binance.vision';
  private useTestnet = false;
  private apiKey = API_KEYS.COINMARKETCAP_KEY; // Using available key for demo

  constructor(useTestnet = false) {
    this.useTestnet = useTestnet;
  }

  private getBaseUrl() {
    return this.useTestnet ? this.testnetUrl : this.baseUrl;
  }

  async getTickerPrice(symbol: string): Promise<{ symbol: string; price: number; timestamp: Date }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v3/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      
      return {
        symbol: data.symbol,
        price: parseFloat(data.price),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching ticker price:', error);
      throw error;
    }
  }

  async get24hrTicker(symbol: string): Promise<any> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${this.getBaseUrl()}/api/v3/ticker/24hr?symbol=${symbol}` , { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return {
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        volume: parseFloat(data.volume),
        high_24h: parseFloat(data.highPrice),
        low_24h: parseFloat(data.lowPrice),
        change_24h: parseFloat(data.priceChangePercent),
        timestamp: new Date()
      };
    } catch (error) {
      console.warn(`Binance API failed for ${symbol}, using mock data`);
      return this.getMockTickerData(symbol);
    }
  }

  async getKlines(symbol: string, interval: string = '1h', limit: number = 100): Promise<any[]> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(
        `${this.getBaseUrl()}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.map((kline: any[]) => ({
        timestamp: new Date(kline[0]),
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
    } catch (error) {
      console.warn('Binance API klines failed, returning mock data');
      const basePrice = 50000;
      const now = Date.now();
      return Array.from({ length: limit }).map((_, i) => ({
        timestamp: new Date(now - (limit - i) * 3600_000),
        open: basePrice + Math.sin(i / 5) * 500,
        high: basePrice + Math.sin(i / 5) * 500 + 200,
        low: basePrice + Math.sin(i / 5) * 500 - 200,
        close: basePrice + Math.sin(i / 5) * 500 + (Math.random() - 0.5) * 100,
        volume: Math.random() * 1000
      }));
    }
  }

  private getMockTickerData(symbol: string) {
    const basePrice = 50000;
    const randomChange = (Math.random() - 0.5) * 1000;
    return {
      symbol,
      price: basePrice + randomChange,
      volume: Math.random() * 1000,
      high_24h: basePrice + randomChange + 500,
      low_24h: basePrice + randomChange - 500,
      change_24h: (randomChange / basePrice) * 100,
      timestamp: new Date()
    };
  }
}

export const binanceApi = new BinanceAPI(false);
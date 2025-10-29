/**
 * EnhancedMarketDataService - Handle all cryptocurrency price and market data
 * 
 * Integrates multiple APIs:
 * - CoinMarketCap (Primary)
 * - CoinGecko (Fallback)
 * - CryptoCompare (Fallback)
 */

import { BaseApiService } from './BaseApiService';
import { API_CONFIG } from '../config/apiConfig';

export interface EnhancedMarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  high24h?: number;
  low24h?: number;
  lastUpdate: number;
}

export interface TopMover {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  type: 'gainer' | 'loser';
}

export class EnhancedMarketDataService extends BaseApiService {
  /**
   * Get current prices for multiple symbols
   */
  async getCurrentPrices(symbols: string[]): Promise<EnhancedMarketData[]> {
    try {
      return await this.getCoinMarketCapPrices(symbols);
    } catch (error) {
      console.warn('CoinMarketCap failed, trying CoinGecko:', error);
      try {
        return await this.getCoinGeckoPrices(symbols);
      } catch (fallbackError) {
        console.error('All market data sources failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Get prices from CoinMarketCap
   */
  private async getCoinMarketCapPrices(symbols: string[]): Promise<EnhancedMarketData[]> {
    const config = API_CONFIG.coinmarketcap.primary;
    const fallback = API_CONFIG.coinmarketcap.fallback;
    const symbolsParam = symbols.join(',');

    const endpoint = `/cryptocurrency/quotes/latest?symbol=${symbolsParam}&convert=USD`;

    const data = await this.request<any>(config, endpoint, {}, [fallback]);

    return this.transformCMCData(data.data);
  }

  /**
   * Transform CoinMarketCap data to standard format
   */
  private transformCMCData(data: any): EnhancedMarketData[] {
    return Object.values(data).map((coin: any) => ({
      symbol: coin.symbol,
      name: coin.name,
      price: coin.quote.USD.price,
      change24h: coin.quote.USD.price * (coin.quote.USD.percent_change_24h / 100),
      changePercent24h: coin.quote.USD.percent_change_24h,
      volume24h: coin.quote.USD.volume_24h,
      marketCap: coin.quote.USD.market_cap,
      high24h: coin.quote.USD.price * 1.05,
      low24h: coin.quote.USD.price * 0.95,
      lastUpdate: Date.now(),
    }));
  }

  /**
   * Get prices from CoinGecko (fallback)
   */
  private async getCoinGeckoPrices(symbols: string[]): Promise<EnhancedMarketData[]> {
    const config = API_CONFIG.sentiment.coingecko;

    // Map symbols to CoinGecko IDs
    const idMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'SOL': 'solana',
      'MATIC': 'polygon',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'LTC': 'litecoin',
      'XRP': 'ripple',
    };

    const ids = symbols.map(s => idMap[s] || s.toLowerCase()).join(',');
    const endpoint = `/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;

    const data = await this.request<any>(config, endpoint, {}, []);

    return this.transformCoinGeckoData(data);
  }

  /**
   * Transform CoinGecko data to standard format
   */
  private transformCoinGeckoData(data: any): EnhancedMarketData[] {
    const idMap: Record<string, string> = {
      'bitcoin': 'BTC',
      'ethereum': 'ETH',
      'binancecoin': 'BNB',
      'cardano': 'ADA',
      'solana': 'SOL',
      'polygon': 'MATIC',
      'polkadot': 'DOT',
      'chainlink': 'LINK',
      'litecoin': 'LTC',
      'ripple': 'XRP',
    };

    return Object.entries(data).map(([id, coin]: [string, any]) => ({
      symbol: idMap[id] || id.toUpperCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      price: coin.usd,
      change24h: coin.usd * (coin.usd_24h_change / 100),
      changePercent24h: coin.usd_24h_change || 0,
      volume24h: coin.usd_24h_vol || 0,
      marketCap: coin.usd_market_cap || 0,
      high24h: coin.usd * 1.05,
      low24h: coin.usd * 0.95,
      lastUpdate: Date.now(),
    }));
  }

  /**
   * Get historical data for a symbol
   */
  async getHistoricalData(symbol: string, days: number = 30): Promise<Array<{ time: number; price: number }>> {
    try {
      return await this.getCryptoCompareHistorical(symbol, days);
    } catch (error) {
      console.warn('CryptoCompare failed, trying CoinGecko:', error);
      return await this.getCoinGeckoHistorical(symbol, days);
    }
  }

  /**
   * Get historical data from CryptoCompare
   */
  private async getCryptoCompareHistorical(symbol: string, days: number): Promise<Array<{ time: number; price: number }>> {
    const config = API_CONFIG.cryptocompare.primary;
    const limit = Math.min(days, 2000);
    const endpoint = `/v2/histoday?fsym=${symbol}&tsym=USD&limit=${limit}`;

    const data = await this.request<any>(config, endpoint, {}, []);

    if (data.Response === 'Error') {
      throw new Error(data.Message);
    }

    return data.Data.Data.map((item: any) => ({
      time: item.time * 1000,
      price: item.close,
    }));
  }

  /**
   * Get historical data from CoinGecko
   */
  private async getCoinGeckoHistorical(symbol: string, days: number): Promise<Array<{ time: number; price: number }>> {
    const config = API_CONFIG.sentiment.coingecko;

    const idMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'SOL': 'solana',
      'MATIC': 'polygon',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'LTC': 'litecoin',
      'XRP': 'ripple',
    };

    const coinId = idMap[symbol] || symbol.toLowerCase();
    const endpoint = `/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;

    const data = await this.request<any>(config, endpoint, {}, []);

    return data.prices.map((item: [number, number]) => ({
      time: item[0],
      price: item[1],
    }));
  }

  /**
   * Get detailed information about a coin
   */
  async getCoinDetails(symbol: string): Promise<any> {
    const config = API_CONFIG.sentiment.coingecko;

    const idMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'SOL': 'solana',
      'MATIC': 'polygon',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'LTC': 'litecoin',
      'XRP': 'ripple',
    };

    const coinId = idMap[symbol] || symbol.toLowerCase();
    const endpoint = `/coins/${coinId}`;

    return await this.request<any>(config, endpoint, {}, []);
  }

  /**
   * Get top movers (gainers and losers)
   */
  async getTopMovers(limit: number = 5): Promise<{ gainers: TopMover[]; losers: TopMover[] }> {
    try {
      const config = API_CONFIG.coinmarketcap.primary;
      const fallback = API_CONFIG.coinmarketcap.fallback;
      const endpoint = `/cryptocurrency/listings/latest?limit=100&convert=USD&sort=percent_change_24h`;

      const data = await this.request<any>(config, endpoint, {}, [fallback]);

      const sorted = data.data.sort((a: any, b: any) =>
        b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h
      );

      const gainers = sorted.slice(0, limit).map((coin: any) => ({
        symbol: coin.symbol,
        name: coin.name,
        price: coin.quote.USD.price,
        changePercent24h: coin.quote.USD.percent_change_24h,
        type: 'gainer' as const,
      }));

      const losers = sorted.slice(-limit).reverse().map((coin: any) => ({
        symbol: coin.symbol,
        name: coin.name,
        price: coin.quote.USD.price,
        changePercent24h: coin.quote.USD.percent_change_24h,
        type: 'loser' as const,
      }));

      return { gainers, losers };
    } catch (error) {
      console.error('Failed to get top movers:', error);
      return { gainers: [], losers: [] };
    }
  }

  /**
   * Get market cap for a symbol
   */
  async getMarketCap(symbol: string): Promise<number> {
    const data = await this.getCurrentPrices([symbol]);
    return data[0]?.marketCap || 0;
  }

  /**
   * Get 24h volume for a symbol
   */
  async get24hVolume(symbol: string): Promise<number> {
    const data = await this.getCurrentPrices([symbol]);
    return data[0]?.volume24h || 0;
  }
}

// Export singleton instance
export const enhancedMarketDataService = new EnhancedMarketDataService();


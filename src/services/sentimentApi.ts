export class SentimentAPI {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  
  private apis = {
    fearGreed: `${this.baseUrl}/api/sentiment/fear-greed`,
    coinMarketCap: `${this.baseUrl}/api/sentiment/coinmarketcap`,
    cryptoCompare: `${this.baseUrl}/api/sentiment/cryptocompare`
  };

  async getFearGreedIndex(): Promise<any> {
    try {
      const response = await fetch(this.apis.fearGreed);
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const latest = data.data[0];
        return {
          value: parseInt(latest.value),
          classification: latest.value_classification,
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Error fetching Fear & Greed Index:', error);
    }
    
    return {
      value: 50,
      classification: 'Neutral',
      timestamp: new Date()
    };
  }

  async getCoinMarketCapSentiment(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.apis.coinMarketCap}/${symbol}`);
      const data = await response.json();
      
      if (data.data && data.data[symbol]) {
        const coinData = data.data[symbol];
        return {
          market_cap_rank: coinData.cmc_rank,
          volume_24h: coinData.quote.USD.volume_24h,
          percent_change_24h: coinData.quote.USD.percent_change_24h,
          market_cap: coinData.quote.USD.market_cap
        };
      }
    } catch (error) {
      console.error('Error fetching CoinMarketCap data:', error);
    }
    
    return null;
  }

  async getCryptoCompareSentiment(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.apis.cryptoCompare}/${symbol}`);
      const data = await response.json();
      
      return {
        reddit_posts_per_hour: data.Data?.Reddit?.posts_per_hour || 0,
        twitter_statuses: data.Data?.Twitter?.statuses || 0,
        general_info: data.Data?.General || {}
      };
    } catch (error) {
      console.error('Error fetching CryptoCompare sentiment:', error);
    }
    
    return null;
  }

  async getComprehensiveSentiment(symbol: string): Promise<any> {
    const [fearGreed, cmcData, ccData] = await Promise.all([
      this.getFearGreedIndex(),
      this.getCoinMarketCapSentiment(symbol),
      this.getCryptoCompareSentiment(symbol)
    ]);

    const fearGreedScore = this.calculateFearGreedScore(fearGreed.value);
    const volumeScore = this.calculateVolumeScore(cmcData);
    const socialScore = this.calculateSocialScore(ccData);

    const overallScore = (fearGreedScore * 0.5 + volumeScore * 0.3 + socialScore * 0.2);

    return {
      score: Math.max(0, Math.min(1, overallScore)),
      fear_greed: fearGreed,
      market_data: cmcData,
      social_data: ccData,
      signal: this.getSentimentSignal(overallScore),
      timestamp: new Date()
    };
  }

  private calculateFearGreedScore(value: number): number {
    // Extreme fear (0-25) = opportunity (high score)
    if (value <= 25) return 0.8;
    // Fear (26-45) = somewhat bullish
    if (value <= 45) return 0.65;
    // Neutral (46-55)
    if (value <= 55) return 0.5;
    // Greed (56-75) = caution
    if (value <= 75) return 0.35;
    // Extreme greed (76-100) = sell signal
    return 0.2;
  }

  private calculateVolumeScore(marketData: any): number {
    if (!marketData) return 0.5;
    
    const changeAbs = Math.abs(marketData.percent_change_24h || 0);
    const volumeScore = Math.min(changeAbs / 10, 1); // Normalize to 0-1
    
    return volumeScore;
  }

  private calculateSocialScore(socialData: any): number {
    if (!socialData) return 0.5;
    
    const redditActivity = Math.min((socialData.reddit_posts_per_hour || 0) / 10, 1);
    const twitterActivity = Math.min((socialData.twitter_statuses || 0) / 100, 1);
    
    return (redditActivity + twitterActivity) / 2;
  }

  private getSentimentSignal(score: number): string {
    if (score > 0.6) return 'BUY';
    if (score < 0.4) return 'SELL';
    return 'HOLD';
  }
}

export const sentimentApi = new SentimentAPI();
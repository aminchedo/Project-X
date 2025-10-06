export class TechnicalIndicators {
  
  calculateRSI(prices: number[], period: number = 14): number[] {
    if (prices.length < period + 1) return prices.map(() => 50);
    
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate initial averages
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    // Fill initial values
    for (let i = 0; i < period; i++) {
      rsi.push(50);
    }
    
    // Calculate RSI values
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      rsi.push(rsiValue);
    }
    
    return rsi;
  }

  calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): any {
    const emaFast = this.calculateEMA(prices, fast);
    const emaSlow = this.calculateEMA(prices, slow);
    
    const macdLine: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      macdLine.push(emaFast[i] - emaSlow[i]);
    }
    
    const signalLine = this.calculateEMA(macdLine, signal);
    const histogram: number[] = [];
    
    for (let i = 0; i < macdLine.length; i++) {
      histogram.push(macdLine[i] - signalLine[i]);
    }
    
    return {
      macd_line: macdLine,
      signal_line: signalLine,
      histogram: histogram
    };
  }

  calculateEMA(prices: number[], period: number): number[] {
    if (prices.length === 0) return [];
    
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA value is the SMA
    let sum = 0;
    for (let i = 0; i < Math.min(period, prices.length); i++) {
      sum += prices[i];
      ema.push(i === 0 ? prices[i] : sum / (i + 1));
    }
    
    // Calculate EMA for remaining values
    for (let i = period; i < prices.length; i++) {
      const emaValue = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
      ema.push(emaValue);
    }
    
    return ema;
  }

  calculateATR(high: number[], low: number[], close: number[], period: number = 14): number[] {
    if (high.length < 2) return high.map(() => 0);
    
    const trueRanges: number[] = [];
    
    for (let i = 1; i < high.length; i++) {
      const highLow = high[i] - low[i];
      const highClose = Math.abs(high[i] - close[i - 1]);
      const lowClose = Math.abs(low[i] - close[i - 1]);
      
      trueRanges.push(Math.max(highLow, highClose, lowClose));
    }
    
    const atr: number[] = [0]; // First value is 0
    
    // Calculate initial ATR (SMA of true ranges)
    if (trueRanges.length >= period) {
      const initialATR = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
      
      for (let i = 1; i <= period; i++) {
        atr.push(i === period ? initialATR : 0);
      }
      
      // Calculate remaining ATR values (smoothed)
      for (let i = period; i < trueRanges.length; i++) {
        const smoothedATR = (atr[atr.length - 1] * (period - 1) + trueRanges[i]) / period;
        atr.push(smoothedATR);
      }
    }
    
    return atr;
  }

  calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): any {
    const sma = this.calculateSMA(prices, period);
    const upperBand: number[] = [];
    const lowerBand: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upperBand.push(prices[i]);
        lowerBand.push(prices[i]);
        continue;
      }
      
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / slice.length;
      const standardDeviation = Math.sqrt(variance);
      
      upperBand.push(sma[i] + (standardDeviation * stdDev));
      lowerBand.push(sma[i] - (standardDeviation * stdDev));
    }
    
    return {
      upper: upperBand,
      middle: sma,
      lower: lowerBand
    };
  }

  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(prices[i]);
        continue;
      }
      
      const slice = prices.slice(i - period + 1, i + 1);
      const average = slice.reduce((a, b) => a + b, 0) / slice.length;
      sma.push(average);
    }
    
    return sma;
  }
}

export const technicalIndicators = new TechnicalIndicators();
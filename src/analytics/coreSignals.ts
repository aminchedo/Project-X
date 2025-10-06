import { technicalIndicators } from './indicators';
import { OHLCVData } from '../types';

export class CoreSignalAnalyzer {
  
  generateRSIMACDSignal(ohlcvData: OHLCVData[]): any {
    if (ohlcvData.length < 50) {
      return {
        action: 'HOLD',
        confidence: 0.3,
        score: 0.5,
        rsi_value: 50,
        macd_histogram: 0,
        strength: 0
      };
    }

    const prices = ohlcvData.map(d => d.close);
    const rsi = technicalIndicators.calculateRSI(prices);
    const macd = technicalIndicators.calculateMACD(prices);
    
    const currentRSI = rsi[rsi.length - 1];
    const currentMACDHist = macd.histogram[macd.histogram.length - 1];
    
    let action = 'HOLD';
    let confidence = 0.3;
    let strength = 0;
    
    // Core trading logic (40% weight in final algorithm)
    if (currentRSI < 30 && currentMACDHist > 0) {
      action = 'BUY';
      confidence = 0.8;
      strength = Math.abs(currentMACDHist);
    } else if (currentRSI > 70 && currentMACDHist < 0) {
      action = 'SELL';
      confidence = 0.8;
      strength = Math.abs(currentMACDHist);
    } else if (currentRSI < 40 && currentMACDHist > 0) {
      action = 'BUY';
      confidence = 0.6;
      strength = Math.abs(currentMACDHist) * 0.7;
    } else if (currentRSI > 60 && currentMACDHist < 0) {
      action = 'SELL';
      confidence = 0.6;
      strength = Math.abs(currentMACDHist) * 0.7;
    }
    
    // Calculate normalized score (0-1)
    const rsiScore = action === 'BUY' || action === 'SELL' ? confidence : 0.5;
    
    return {
      action,
      confidence,
      score: rsiScore,
      rsi_value: currentRSI,
      macd_histogram: currentMACDHist,
      strength,
      details: {
        rsi: currentRSI,
        macd_line: macd.macd_line[macd.macd_line.length - 1],
        signal_line: macd.signal_line[macd.signal_line.length - 1],
        histogram: currentMACDHist
      }
    };
  }

  calculateTrendStrength(ohlcvData: OHLCVData[]): number {
    if (ohlcvData.length < 50) return 0.5;
    
    const prices = ohlcvData.map(d => d.close);
    const ema20 = technicalIndicators.calculateEMA(prices, 20);
    const ema50 = technicalIndicators.calculateEMA(prices, 50);
    
    const currentPrice = prices[prices.length - 1];
    const currentEMA20 = ema20[ema20.length - 1];
    const currentEMA50 = ema50[ema50.length - 1];
    
    if (currentPrice > currentEMA20 && currentEMA20 > currentEMA50) {
      return 0.8; // Strong uptrend
    } else if (currentPrice < currentEMA20 && currentEMA20 < currentEMA50) {
      return 0.8; // Strong downtrend
    } else {
      return 0.4; // Sideways/weak trend
    }
  }
}

export const coreSignalAnalyzer = new CoreSignalAnalyzer();
import { OHLCVData, PatternAnalysis, PatternResult } from '../types';

export class PatternDetector {
  
  detectCandlestickPatterns(ohlcvData: OHLCVData[]): PatternAnalysis {
    if (ohlcvData.length < 2) {
      return {
        score: 0.5,
        patterns: {
          doji: { detected: false, strength: 0, direction: 'NEUTRAL' },
          hammer: { detected: false, strength: 0, direction: 'NEUTRAL' },
          engulfing: { detected: false, strength: 0, direction: 'NEUTRAL' },
          pin_bar: { detected: false, strength: 0, direction: 'NEUTRAL' }
        },
        signal: 'NEUTRAL',
        strength: 0
      };
    }

    const patterns = {
      doji: this.detectDoji(ohlcvData),
      hammer: this.detectHammer(ohlcvData),
      engulfing: this.detectEngulfing(ohlcvData),
      pin_bar: this.detectPinBar(ohlcvData)
    };
    
    // Calculate pattern score (20% weight in final algorithm)
    let patternStrength = 0;
    let signalDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    let bullishCount = 0;
    let bearishCount = 0;
    
    Object.values(patterns).forEach(pattern => {
      if (pattern.detected) {
        patternStrength += pattern.strength;
        if (pattern.direction === 'BULLISH') bullishCount++;
        if (pattern.direction === 'BEARISH') bearishCount++;
      }
    });
    
    if (bullishCount > bearishCount) signalDirection = 'BULLISH';
    else if (bearishCount > bullishCount) signalDirection = 'BEARISH';
    
    const patternScore = Math.min(patternStrength / Object.keys(patterns).length, 1.0);
    
    return {
      score: patternScore,
      patterns,
      signal: signalDirection,
      strength: patternStrength
    };
  }

  private detectDoji(ohlcvData: OHLCVData[]): PatternResult {
    const latest = ohlcvData[ohlcvData.length - 1];
    const bodySize = Math.abs(latest.close - latest.open);
    const totalRange = latest.high - latest.low;
    
    if (totalRange === 0) {
      return { detected: false, strength: 0, direction: 'NEUTRAL' };
    }
    
    const bodyRatio = bodySize / totalRange;
    const isDoji = bodyRatio < 0.1;
    
    return {
      detected: isDoji,
      strength: isDoji ? 0.6 : 0,
      direction: 'NEUTRAL'
    };
  }

  private detectHammer(ohlcvData: OHLCVData[]): PatternResult {
    const latest = ohlcvData[ohlcvData.length - 1];
    const bodySize = Math.abs(latest.close - latest.open);
    const lowerShadow = Math.min(latest.open, latest.close) - latest.low;
    const upperShadow = latest.high - Math.max(latest.open, latest.close);
    
    const isHammer = (lowerShadow > 2 * bodySize && upperShadow < bodySize && bodySize > 0);
    
    return {
      detected: isHammer,
      strength: isHammer ? 0.7 : 0,
      direction: isHammer ? 'BULLISH' : 'NEUTRAL'
    };
  }

  private detectEngulfing(ohlcvData: OHLCVData[]): PatternResult {
    if (ohlcvData.length < 2) {
      return { detected: false, strength: 0, direction: 'NEUTRAL' };
    }
    
    const current = ohlcvData[ohlcvData.length - 1];
    const previous = ohlcvData[ohlcvData.length - 2];
    
    const currBody = Math.abs(current.close - current.open);
    const prevBody = Math.abs(previous.close - previous.open);
    
    // Bullish engulfing
    const bullishEngulfing = (
      previous.close < previous.open && // Previous red
      current.close > current.open &&  // Current green
      current.open < previous.close && // Opens below prev close
      current.close > previous.open && // Closes above prev open
      currBody > prevBody               // Larger body
    );
    
    // Bearish engulfing
    const bearishEngulfing = (
      previous.close > previous.open && // Previous green
      current.close < current.open &&  // Current red
      current.open > previous.close && // Opens above prev close
      current.close < previous.open && // Closes below prev open
      currBody > prevBody               // Larger body
    );
    
    if (bullishEngulfing) {
      return { detected: true, strength: 0.8, direction: 'BULLISH' };
    } else if (bearishEngulfing) {
      return { detected: true, strength: 0.8, direction: 'BEARISH' };
    }
    
    return { detected: false, strength: 0, direction: 'NEUTRAL' };
  }

  private detectPinBar(ohlcvData: OHLCVData[]): PatternResult {
    const latest = ohlcvData[ohlcvData.length - 1];
    const bodySize = Math.abs(latest.close - latest.open);
    const totalRange = latest.high - latest.low;
    
    if (totalRange === 0) {
      return { detected: false, strength: 0, direction: 'NEUTRAL' };
    }
    
    const upperShadow = latest.high - Math.max(latest.open, latest.close);
    const lowerShadow = Math.min(latest.open, latest.close) - latest.low;
    
    // Bullish pin bar (long lower shadow)
    const bullishPin = lowerShadow > 2 * bodySize && upperShadow < bodySize;
    
    // Bearish pin bar (long upper shadow)
    const bearishPin = upperShadow > 2 * bodySize && lowerShadow < bodySize;
    
    if (bullishPin) {
      return { detected: true, strength: 0.7, direction: 'BULLISH' };
    } else if (bearishPin) {
      return { detected: true, strength: 0.7, direction: 'BEARISH' };
    }
    
    return { detected: false, strength: 0, direction: 'NEUTRAL' };
  }
}

export const patternDetector = new PatternDetector();
import { OHLCVData, SMCAnalysis } from '../types';

export class SMCAnalyzer {
  
  analyzeSmartMoneyConcepts(ohlcvData: OHLCVData[]): SMCAnalysis {
    const orderBlocks = this.detectOrderBlocks(ohlcvData);
    const liquidityZones = this.findLiquidityZones(ohlcvData);
    const fairValueGaps = this.detectFairValueGaps(ohlcvData);
    
    // Calculate SMC score (25% weight in final algorithm)
    const obScore = orderBlocks.strength > 0.6 ? 0.8 : 0.3;
    const lqScore = liquidityZones.proximity < 0.02 ? 0.7 : 0.2;
    const fvgScore = fairValueGaps.present ? 0.6 : 0.1;
    
    const smcScore = (0.4 * obScore + 0.35 * lqScore + 0.25 * fvgScore);
    
    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (smcScore > 0.6) signal = 'BULLISH';
    else if (smcScore < 0.4) signal = 'BEARISH';
    
    return {
      score: smcScore,
      order_blocks: orderBlocks,
      liquidity_zones: liquidityZones,
      fair_value_gaps: fairValueGaps,
      signal
    };
  }

  private detectOrderBlocks(ohlcvData: OHLCVData[]): any {
    if (ohlcvData.length < 20) {
      return {
        strength: 0,
        level: ohlcvData[ohlcvData.length - 1]?.close || 0,
        type: 'neutral' as const
      };
    }

    // Detect strong price rejection candles
    const volumes = ohlcvData.map(d => d.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    const latest = ohlcvData[ohlcvData.length - 1];
    const highLowRatio = (latest.high - latest.low) / latest.close;
    const volumeSpike = latest.volume > avgVolume * 1.5;
    
    const strongRejection = highLowRatio > 0.02;
    let orderBlockStrength = 0.0;
    
    if (strongRejection && volumeSpike) {
      orderBlockStrength = Math.min(highLowRatio * 10, 1.0);
    }
    
    return {
      strength: orderBlockStrength,
      level: latest.close,
      type: latest.close > latest.open ? 'bullish' : 'bearish'
    };
  }

  private findLiquidityZones(ohlcvData: OHLCVData[]): any {
    if (ohlcvData.length < 20) {
      return {
        proximity: 0.5,
        level: ohlcvData[ohlcvData.length - 1]?.close || 0,
        strength: 0.5
      };
    }

    // Find areas of high volume concentration
    const volumes = ohlcvData.map(d => d.volume);
    const recentVolumes = volumes.slice(-20);
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    
    const proximityToHighVolume = Math.abs(currentVolume - avgVolume) / avgVolume;
    
    return {
      proximity: proximityToHighVolume,
      level: ohlcvData[ohlcvData.length - 1].close,
      strength: Math.min(currentVolume / avgVolume, 2.0) / 2.0
    };
  }

  private detectFairValueGaps(ohlcvData: OHLCVData[]): any {
    if (ohlcvData.length < 3) {
      return {
        present: false,
        count: 0,
        latest: null
      };
    }

    const gaps: any[] = [];
    
    for (let i = 2; i < ohlcvData.length; i++) {
      const prev = ohlcvData[i - 1];
      const curr = ohlcvData[i];
      
      // Bullish FVG - gap up
      if (curr.low > prev.high) {
        gaps.push({
          type: 'bullish',
          size: curr.low - prev.high,
          timestamp: curr.timestamp
        });
      }
      
      // Bearish FVG - gap down
      if (curr.high < prev.low) {
        gaps.push({
          type: 'bearish',
          size: prev.low - curr.high,
          timestamp: curr.timestamp
        });
      }
    }
    
    return {
      present: gaps.length > 0,
      count: gaps.length,
      latest: gaps.length > 0 ? gaps[gaps.length - 1] : null
    };
  }
}

export const smcAnalyzer = new SMCAnalyzer();
import { TradingSignal, OHLCVData, SentimentData, MLPrediction, SMCAnalysis, PatternAnalysis } from '../types';
import { binanceApi } from './binanceApi';
import { sentimentApi } from './sentimentApi';
import { coreSignalAnalyzer } from '../analytics/coreSignals';
import { smcAnalyzer } from '../analytics/smcAnalysis';
import { patternDetector } from '../analytics/patternDetection';
import { mlPredictor } from '../analytics/mlPredictor';
import { riskManager } from '../analytics/riskManager';

export class TradingEngine {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 60000; // 1 minute

  async generateSignal(symbol: string, interval: string = '1h'): Promise<TradingSignal> {
    try {
      // Get OHLCV data
      const ohlcvData = await this.getOHLCVData(symbol, interval, 100);
      
      if (ohlcvData.length < 50) {
        throw new Error('Insufficient market data for analysis');
      }
      
      // Get current market data
      const marketData = await binanceApi.get24hrTicker(symbol);
      
      // Generate signals from all components (parallel execution)
      const [
        coreSignal,
        smcAnalysis,
        patternAnalysis,
        sentimentData,
        mlPrediction
      ] = await Promise.all([
        this.getCoreSignal(ohlcvData),
        this.getSMCAnalysis(ohlcvData),
        this.getPatternAnalysis(ohlcvData),
        this.getSentimentAnalysis(symbol),
        this.getMLPrediction(ohlcvData)
      ]);

      // Apply IMMUTABLE scoring formula
      const finalScore = (
        0.40 * coreSignal.score +
        0.25 * smcAnalysis.score +
        0.20 * patternAnalysis.score +
        0.10 * sentimentData.score +
        0.05 * mlPrediction.score
      );

      // Determine action based on final score
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      let confidence = 0.5;

      if (finalScore > 0.7) {
        action = 'BUY';
        confidence = finalScore;
      } else if (finalScore < 0.3) {
        action = 'SELL';
        confidence = 1.0 - finalScore;
      } else {
        action = 'HOLD';
        confidence = 0.5;
      }

      // Calculate risk metrics
      const atr = riskManager.calculateATRFromOHLCV(ohlcvData);
      const entryPrice = marketData.price;
      const stopLoss = riskManager.calculateStopLoss(entryPrice, atr, action);
      const takeProfit = riskManager.calculateTakeProfit(entryPrice, stopLoss, action);
      const positionSize = riskManager.calculatePositionSize(
        10000, // Default equity
        atr,
        marketData.volume,
        marketData.volume,
        confidence
      );

      return {
        symbol,
        action,
        confidence,
        final_score: finalScore,
        rsi_macd_score: coreSignal.score,
        smc_score: smcAnalysis.score,
        pattern_score: patternAnalysis.score,
        sentiment_score: sentimentData.score,
        ml_score: mlPrediction.score,
        timestamp: new Date(),
        price: marketData.price,
        entry_price: entryPrice,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        position_size: positionSize
      };

    } catch (error) {
      console.error('Error generating signal:', error);
      throw error;
    }
  }

  private async getCoreSignal(ohlcvData: OHLCVData[]): Promise<any> {
    return coreSignalAnalyzer.generateRSIMACDSignal(ohlcvData);
  }

  private async getSMCAnalysis(ohlcvData: OHLCVData[]): Promise<SMCAnalysis> {
    return smcAnalyzer.analyzeSmartMoneyConcepts(ohlcvData);
  }

  private async getPatternAnalysis(ohlcvData: OHLCVData[]): Promise<PatternAnalysis> {
    return patternDetector.detectCandlestickPatterns(ohlcvData);
  }

  private async getSentimentAnalysis(symbol: string): Promise<SentimentData> {
    const cacheKey = `sentiment_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const sentimentData = await sentimentApi.getComprehensiveSentiment(symbol);
    this.setCache(cacheKey, sentimentData);
    return sentimentData;
  }

  private async getMLPrediction(ohlcvData: OHLCVData[]): Promise<MLPrediction> {
    return mlPredictor.predict(ohlcvData);
  }

  private async getOHLCVData(symbol: string, interval: string, limit: number): Promise<OHLCVData[]> {
    const cacheKey = `ohlcv_${symbol}_${interval}_${limit}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const data = await binanceApi.getKlines(symbol, interval, limit);
    this.setCache(cacheKey, data);
    return data;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getDetailedAnalysis(symbol: string): Promise<any> {
    const ohlcvData = await this.getOHLCVData(symbol, '1h', 100);
    const marketData = await binanceApi.get24hrTicker(symbol);
    
    const [coreSignal, smcAnalysis, patternAnalysis, sentimentData, mlPrediction] = await Promise.all([
      this.getCoreSignal(ohlcvData),
      this.getSMCAnalysis(ohlcvData),
      this.getPatternAnalysis(ohlcvData),
      this.getSentimentAnalysis(symbol),
      this.getMLPrediction(ohlcvData)
    ]);

    const atr = riskManager.calculateATRFromOHLCV(ohlcvData);

    return {
      symbol,
      market_data: marketData,
      ohlcv_data: ohlcvData.slice(-50), // Last 50 candles for chart
      analysis: {
        core_signal: coreSignal,
        smc_analysis: smcAnalysis,
        pattern_analysis: patternAnalysis,
        sentiment_data: sentimentData,
        ml_prediction: mlPrediction,
        atr
      },
      risk_metrics: riskManager.getRiskStatus(),
      timestamp: new Date()
    };
  }
}

export const tradingEngine = new TradingEngine();
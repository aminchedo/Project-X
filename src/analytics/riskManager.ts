import { OHLCVData, RiskMetrics } from '../types';
import { technicalIndicators } from './indicators';

export class RiskManager {
  private maxRiskPerTrade = 0.02; // 2%
  private maxDailyLoss = 0.05; // 5%
  private positionSizeMultiplier = 1.0;
  private stopLossATRMultiple = 1.5;
  private dailyStartEquity = 10000.0;
  private currentEquity = 10000.0;
  private consecutiveLosses = 0;
  private maxConsecutiveLosses = 5;

  calculatePositionSize(
    equity: number,
    atr: number,
    marketVol: number,
    vol24h: number,
    confidence: number
  ): number {
    if (atr <= 0 || vol24h <= 0) return 0;
    
    const baseSizeRisk = (this.maxRiskPerTrade * equity) / atr;
    const baseSizeVolume = (0.1 * marketVol) / vol24h;
    
    const baseSize = Math.min(baseSizeRisk, baseSizeVolume);
    
    // Apply confidence multiplier (sigmoid function)
    const confidenceFactor = 1 / (1 + Math.exp(-2 * (confidence - 0.5)));
    
    // Apply position size multiplier
    const finalSize = baseSize * confidenceFactor * this.positionSizeMultiplier;
    
    return Math.max(finalSize, 0);
  }

  calculateStopLoss(entryPrice: number, atr: number, direction: 'BUY' | 'SELL'): number {
    if (atr <= 0) {
      return entryPrice * (direction === 'BUY' ? 0.98 : 1.02);
    }
    
    if (direction === 'BUY') {
      return entryPrice - (atr * this.stopLossATRMultiple);
    } else {
      return entryPrice + (atr * this.stopLossATRMultiple);
    }
  }

  calculateTakeProfit(
    entryPrice: number,
    stopLoss: number,
    direction: 'BUY' | 'SELL',
    riskRewardRatio: number = 2.0
  ): number {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = risk * riskRewardRatio;
    
    if (direction === 'BUY') {
      return entryPrice + reward;
    } else {
      return entryPrice - reward;
    }
  }

  calculateATRFromOHLCV(ohlcvData: OHLCVData[]): number {
    if (ohlcvData.length < 14) return 0;
    
    const highs = ohlcvData.map(d => d.high);
    const lows = ohlcvData.map(d => d.low);
    const closes = ohlcvData.map(d => d.close);
    
    const atr = technicalIndicators.calculateATR(highs, lows, closes);
    return atr[atr.length - 1] || 0;
  }

  checkDailyLossLimit(): boolean {
    const dailyLoss = (this.currentEquity - this.dailyStartEquity) / this.dailyStartEquity;
    return dailyLoss <= -this.maxDailyLoss;
  }

  checkConsecutiveLosses(): boolean {
    return this.consecutiveLosses >= this.maxConsecutiveLosses;
  }

  updateTradeResult(profitLoss: number, isWin: boolean): void {
    this.currentEquity += profitLoss;
    
    if (isWin) {
      this.consecutiveLosses = 0;
    } else {
      this.consecutiveLosses++;
    }
  }

  resetDailyStats(): void {
    this.dailyStartEquity = this.currentEquity;
    this.consecutiveLosses = 0;
  }

  getRiskStatus(): RiskMetrics {
    const dailyLoss = (this.currentEquity - this.dailyStartEquity) / this.dailyStartEquity;
    
    return {
      current_equity: this.currentEquity,
      daily_loss_pct: dailyLoss * 100,
      consecutive_losses: this.consecutiveLosses,
      daily_loss_limit_hit: this.checkDailyLossLimit(),
      consecutive_loss_limit_hit: this.checkConsecutiveLosses(),
      position_size_multiplier: this.positionSizeMultiplier,
      max_risk_per_trade: this.maxRiskPerTrade * 100
    };
  }

  updateRiskSettings(settings: Partial<RiskMetrics>): void {
    if (settings.position_size_multiplier !== undefined) {
      this.positionSizeMultiplier = settings.position_size_multiplier;
    }
    if (settings.max_risk_per_trade !== undefined) {
      this.maxRiskPerTrade = settings.max_risk_per_trade / 100;
    }
  }
}

export const riskManager = new RiskManager();
import { OHLCVData, MLPrediction } from '../types';
import { technicalIndicators } from './indicators';

export class MLPredictor {
  private features: number[][] = [];
  private targets: number[] = [];
  private isTrained = false;
  private weights: number[] = [];
  private bias = 0;

  predict(ohlcvData: OHLCVData[]): MLPrediction {
    if (!this.isTrained) {
      this.quickTrain(ohlcvData);
    }
    
    if (!this.isTrained || ohlcvData.length < 20) {
      return {
        score: 0.5,
        prediction: 'HOLD',
        confidence: 0.0
      };
    }
    
    const features = this.extractFeatures(ohlcvData);
    if (features.length === 0) {
      return {
        score: 0.5,
        prediction: 'HOLD', 
        confidence: 0.0
      };
    }
    
    const currentFeatures = features[features.length - 1];
    const prediction = this.simpleLinearPredict(currentFeatures);
    
    const bullishProb = Math.max(0, Math.min(1, prediction));
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (bullishProb > 0.6) action = 'BUY';
    else if (bullishProb < 0.4) action = 'SELL';
    
    return {
      score: bullishProb,
      prediction: action,
      confidence: Math.abs(bullishProb - 0.5) * 2
    };
  }

  private extractFeatures(ohlcvData: OHLCVData[]): number[][] {
    if (ohlcvData.length < 20) return [];
    
    const prices = ohlcvData.map(d => d.close);
    const volumes = ohlcvData.map(d => d.volume);
    const highs = ohlcvData.map(d => d.high);
    const lows = ohlcvData.map(d => d.low);
    
    const rsi = technicalIndicators.calculateRSI(prices);
    const ema5 = technicalIndicators.calculateEMA(prices, 5);
    const ema20 = technicalIndicators.calculateEMA(prices, 20);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    const features: number[][] = [];
    
    for (let i = 20; i < ohlcvData.length; i++) {
      const priceChange = (prices[i] - prices[i - 1]) / prices[i - 1];
      const highLowRatio = (highs[i] - lows[i]) / prices[i];
      const volumeRatio = volumes[i] / avgVolume;
      const rsiValue = rsi[i] / 100; // Normalize to 0-1
      const emaRatio = ema5[i] / ema20[i];
      
      if (!isNaN(priceChange) && !isNaN(highLowRatio) && !isNaN(volumeRatio) && 
          !isNaN(rsiValue) && !isNaN(emaRatio)) {
        features.push([
          priceChange,
          highLowRatio,
          Math.min(volumeRatio, 5), // Cap at 5x
          rsiValue,
          emaRatio
        ]);
      }
    }
    
    return features;
  }

  private quickTrain(ohlcvData: OHLCVData[]): void {
    if (ohlcvData.length < 50) return;
    
    const features = this.extractFeatures(ohlcvData);
    const prices = ohlcvData.map(d => d.close);
    
    // Create targets (future price direction)
    const targets: number[] = [];
    for (let i = 20; i < prices.length - 1; i++) {
      const futureReturn = (prices[i + 1] - prices[i]) / prices[i];
      targets.push(futureReturn > 0 ? 1 : 0);
    }
    
    if (features.length !== targets.length || features.length < 10) return;
    
    // Simple linear regression for quick training
    this.weights = new Array(5).fill(0);
    this.bias = 0;
    
    const learningRate = 0.01;
    const epochs = 100;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (let i = 0; i < features.length; i++) {
        const prediction = this.simpleLinearPredict(features[i]);
        const error = targets[i] - prediction;
        
        // Update weights
        for (let j = 0; j < this.weights.length; j++) {
          this.weights[j] += learningRate * error * features[i][j];
        }
        this.bias += learningRate * error;
      }
    }
    
    this.isTrained = true;
  }

  private simpleLinearPredict(features: number[]): number {
    let prediction = this.bias;
    for (let i = 0; i < features.length && i < this.weights.length; i++) {
      prediction += this.weights[i] * features[i];
    }
    
    // Sigmoid activation
    return 1 / (1 + Math.exp(-prediction));
  }
}

export const mlPredictor = new MLPredictor();
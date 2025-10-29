import { PredictionData, TrainingMetrics } from '../types';

class AIPredictionService {
  private isTraining = false;
  private currentEpoch = 0;
  private trainingHistory: TrainingMetrics[] = [];
  private subscribers: ((prediction: PredictionData) => void)[] = [];
  private trainingSubscribers: ((metrics: TrainingMetrics) => void)[] = [];

  async initialize(): Promise<void> {
    // Initialize AI prediction service
    this.startPredictionLoop();
  }

  private startPredictionLoop(): void {
    setInterval(() => {
      if (!this.isTraining) {
        this.generatePredictions();
      }
    }, 5000); // Generate predictions every 5 seconds
  }

  private generatePredictions(): void {
    const symbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL'];
    
    symbols.forEach(symbol => {
      const prediction = this.generatePrediction(symbol);
      this.subscribers.forEach(callback => callback(prediction));
    });
  }

  private generatePrediction(symbol: string): PredictionData {
    // Simulate neural network prediction
    const random = Math.random();
    
    let bullishProb: number;
    let bearishProb: number;
    let neutralProb: number;
    
    if (random < 0.4) {
      // Bullish scenario
      bullishProb = 0.5 + Math.random() * 0.4; // 0.5-0.9
      bearishProb = Math.random() * 0.3; // 0-0.3
      neutralProb = 1 - bullishProb - bearishProb;
    } else if (random < 0.7) {
      // Bearish scenario
      bearishProb = 0.5 + Math.random() * 0.4; // 0.5-0.9
      bullishProb = Math.random() * 0.3; // 0-0.3
      neutralProb = 1 - bullishProb - bearishProb;
    } else {
      // Neutral scenario
      neutralProb = 0.4 + Math.random() * 0.4; // 0.4-0.8
      bullishProb = (1 - neutralProb) * Math.random();
      bearishProb = 1 - neutralProb - bullishProb;
    }

    const maxProb = Math.max(bullishProb, bearishProb, neutralProb);
    const prediction = maxProb === bullishProb ? 'BULL' : maxProb === bearishProb ? 'BEAR' : 'NEUTRAL';
    
    return {
      symbol,
      bullishProbability: bullishProb,
      bearishProbability: bearishProb,
      neutralProbability: neutralProb,
      confidence: maxProb,
      prediction,
      riskScore: Math.random() * 0.3 + 0.1, // 0.1-0.4
      timestamp: Date.now()
    };
  }

  async startTraining(): Promise<void> {
    if (this.isTraining) return;
    
    this.isTraining = true;
    this.currentEpoch = 0;
    
    const trainingLoop = async () => {
      while (this.isTraining && this.currentEpoch < 1000) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms per epoch
        
        this.currentEpoch++;
        
        // Simulate training metrics with stability features
        const resetEvent = Math.random() < 0.02; // 2% chance of reset
        const metrics: TrainingMetrics = {
          epoch: this.currentEpoch,
          mse: this.calculateMSE(),
          mae: this.calculateMAE(),
          r2: this.calculateR2(),
          learningRate: this.calculateLearningRate(resetEvent),
          gradientNorm: this.calculateGradientNorm(resetEvent),
          resetEvents: resetEvent ? this.getResetCount() + 1 : this.getResetCount(),
          timestamp: Date.now()
        };

        this.trainingHistory.push(metrics);
        this.trainingSubscribers.forEach(callback => callback(metrics));

        // Early stopping condition
        if (metrics.r2 > 0.85) {
          this.isTraining = false;
          break;
        }
      }
      
      this.isTraining = false;
    };

    trainingLoop();
  }

  stopTraining(): void {
    this.isTraining = false;
  }

  private calculateMSE(): number {
    const baseMSE = 0.1;
    const improvement = Math.min(this.currentEpoch / 100, 1);
    return baseMSE * (1 - improvement * 0.8) + Math.random() * 0.02;
  }

  private calculateMAE(): number {
    const baseMAE = 0.08;
    const improvement = Math.min(this.currentEpoch / 100, 1);
    return baseMAE * (1 - improvement * 0.7) + Math.random() * 0.015;
  }

  private calculateR2(): number {
    const baseR2 = 0.3;
    const improvement = Math.min(this.currentEpoch / 200, 1);
    return Math.min(baseR2 + improvement * 0.6 + Math.random() * 0.1, 0.95);
  }

  private calculateLearningRate(resetEvent: boolean): number {
    const baseLR = 0.001;
    if (resetEvent) return baseLR * 0.5;
    return baseLR * Math.pow(0.95, this.currentEpoch / 50);
  }

  private calculateGradientNorm(resetEvent: boolean): number {
    if (resetEvent) return 5.0 + Math.random() * 3.0; // Spike indicating instability
    return 0.5 + Math.random() * 1.0;
  }

  private getResetCount(): number {
    return this.trainingHistory.filter(m => m.resetEvents > 0).length;
  }

  subscribeToPredictions(callback: (prediction: PredictionData) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  subscribeToTraining(callback: (metrics: TrainingMetrics) => void): () => void {
    this.trainingSubscribers.push(callback);
    return () => {
      this.trainingSubscribers = this.trainingSubscribers.filter(sub => sub !== callback);
    };
  }

  getTrainingHistory(): TrainingMetrics[] {
    return this.trainingHistory;
  }

  getIsTraining(): boolean {
    return this.isTraining;
  }
}

export const aiPredictionService = new AIPredictionService();
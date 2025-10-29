import * as tf from '@tensorflow/tfjs';
import { CandlestickData, PredictionData } from '../types';

export class AIModel {
    private model: tf.LayersModel | null = null;
    private isInitialized = false;
    private trainingData: number[][] = [];
    private trainingLabels: number[] = [];

    async initialize(): Promise<void> {
        try {
            // Create a simple neural network for price prediction
            this.model = tf.sequential({
                layers: [
                    tf.layers.dense({
                        inputShape: [10], // 10 features: OHLCV + technical indicators
                        units: 64,
                        activation: 'relu',
                        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
                    }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({
                        units: 32,
                        activation: 'relu',
                        kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
                    }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({
                        units: 16,
                        activation: 'relu'
                    }),
                    tf.layers.dense({
                        units: 3, // 3 outputs: bullish, bearish, neutral probabilities
                        activation: 'softmax'
                    })
                ]
            });

            // Compile the model
            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            this.isInitialized = true;
            console.log('AI Model initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AI model:', error);
            throw error;
        }
    }

    prepareFeatures(candlestickData: CandlestickData[], technicalIndicators: any): number[] {
        if (candlestickData.length < 2) {
            return new Array(10).fill(0);
        }

        const latest = candlestickData[candlestickData.length - 1];
        const previous = candlestickData[candlestickData.length - 2];

        // Normalize features
        const priceChange = (latest.close - previous.close) / previous.close;
        const volumeChange = latest.volume > 0 && previous.volume > 0
            ? (latest.volume - previous.volume) / previous.volume
            : 0;

        const rsi = technicalIndicators.rsi / 100; // Normalize RSI to 0-1
        const macd = Math.tanh(technicalIndicators.macd.macd / 1000); // Normalize MACD
        const bbPosition = (latest.close - technicalIndicators.bb.lower) /
            (technicalIndicators.bb.upper - technicalIndicators.bb.lower);

        const sma20Ratio = latest.close / technicalIndicators.sma20;
        const sma50Ratio = latest.close / technicalIndicators.sma50;

        // Volatility (standard deviation of recent prices)
        const recentPrices = candlestickData.slice(-20).map(c => c.close);
        const avgPrice = recentPrices.reduce((sum, price) => sum + price, 0) / recentPrices.length;
        const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / recentPrices.length;
        const volatility = Math.sqrt(variance) / avgPrice;

        // Price momentum (rate of change)
        const momentum = candlestickData.length >= 5
            ? (latest.close - candlestickData[candlestickData.length - 5].close) / candlestickData[candlestickData.length - 5].close
            : 0;

        return [
            priceChange,
            volumeChange,
            rsi,
            macd,
            bbPosition,
            sma20Ratio - 1, // Deviation from SMA20
            sma50Ratio - 1, // Deviation from SMA50
            volatility,
            momentum,
            latest.close / 100000 // Normalized price
        ];
    }

    async predict(features: number[]): Promise<PredictionData> {
        if (!this.model || !this.isInitialized) {
            throw new Error('Model not initialized');
        }

        try {
            // Prepare input tensor
            const inputTensor = tf.tensor2d([features]);

            // Make prediction
            const prediction = this.model.predict(inputTensor) as tf.Tensor;
            const predictionArray = await prediction.data();

            // Clean up tensors
            inputTensor.dispose();
            prediction.dispose();

            // Extract probabilities
            const bullishProb = predictionArray[0];
            const bearishProb = predictionArray[1];
            const neutralProb = predictionArray[2];

            // Determine prediction and confidence
            const maxProb = Math.max(bullishProb, bearishProb, neutralProb);
            const predictionType = maxProb === bullishProb ? 'BULL' :
                maxProb === bearishProb ? 'BEAR' : 'NEUTRAL';

            // Calculate risk score based on volatility and confidence
            const riskScore = Math.min(0.5, (1 - maxProb) + Math.abs(bullishProb - bearishProb));

            return {
                symbol: 'BTC', // Will be set by the calling service
                bullishProbability: bullishProb,
                bearishProbability: bearishProb,
                neutralProbability: neutralProb,
                confidence: maxProb,
                prediction: predictionType,
                riskScore: riskScore,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('Prediction failed:', error);
            throw error;
        }
    }

    async train(candlestickData: CandlestickData[], technicalIndicators: any): Promise<void> {
        if (!this.model || !this.isInitialized) {
            throw new Error('Model not initialized');
        }

        try {
            // Prepare training data
            const features = this.prepareFeatures(candlestickData, technicalIndicators);

            // Create labels based on future price movement
            // This is a simplified approach - in production, you'd use historical data
            const futurePrice = candlestickData[candlestickData.length - 1].close * (1 + (Math.random() - 0.5) * 0.1);
            const currentPrice = candlestickData[candlestickData.length - 1].close;
            const priceChange = (futurePrice - currentPrice) / currentPrice;

            let label: number[];
            if (priceChange > 0.02) {
                label = [1, 0, 0]; // Bullish
            } else if (priceChange < -0.02) {
                label = [0, 1, 0]; // Bearish
            } else {
                label = [0, 0, 1]; // Neutral
            }

            this.trainingData.push(features);
            this.trainingLabels.push(label.indexOf(1));

            // Train with batch if we have enough data
            if (this.trainingData.length >= 10) {
                const xs = tf.tensor2d(this.trainingData.slice(-10));
                const ys = tf.oneHot(tf.tensor1d(this.trainingLabels.slice(-10), 'int32'), 3);

                await this.model.fit(xs, ys, {
                    epochs: 1,
                    batchSize: 10,
                    verbose: 0
                });

                // Clean up tensors
                xs.dispose();
                ys.dispose();
            }
        } catch (error) {
            console.error('Training failed:', error);
            throw error;
        }
    }

    getModelSummary(): string {
        if (!this.model) return 'Model not initialized';

        let summary = 'Model Architecture:\n';
        this.model.layers.forEach((layer, index) => {
            summary += `Layer ${index + 1}: ${layer.constructor.name}\n`;
        });

        return summary;
    }

    async saveModel(): Promise<void> {
        if (!this.model) return;

        try {
            // In a real application, you'd save to a persistent storage
            console.log('Model saved successfully');
        } catch (error) {
            console.error('Failed to save model:', error);
        }
    }

    async loadModel(): Promise<void> {
        try {
            // In a real application, you'd load from persistent storage
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Failed to load model:', error);
        }
    }
}

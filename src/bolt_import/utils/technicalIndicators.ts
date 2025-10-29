import { CandlestickData, TechnicalIndicators } from '../types';

export class TechnicalIndicatorCalculator {
    static calculateRSI(prices: number[], period: number = 14): number {
        if (prices.length < period + 1) return 50;

        const gains: number[] = [];
        const losses: number[] = [];

        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }

        const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
        const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

        if (avgLoss === 0) return 100;

        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    static calculateSMA(prices: number[], period: number): number {
        if (prices.length < period) return prices[prices.length - 1] || 0;

        const recentPrices = prices.slice(-period);
        return recentPrices.reduce((sum, price) => sum + price, 0) / period;
    }

    static calculateEMA(prices: number[], period: number): number {
        if (prices.length === 0) return 0;
        if (prices.length === 1) return prices[0];

        const multiplier = 2 / (period + 1);
        let ema = prices[0];

        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }

        return ema;
    }

    static calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);
        const macd = ema12 - ema26;

        // For signal line, we'd need more data points, so we'll approximate
        const signal = macd * 0.9; // Simplified signal line
        const histogram = macd - signal;

        return { macd, signal, histogram };
    }

    static calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
        upper: number;
        middle: number;
        lower: number;
    } {
        if (prices.length < period) {
            const currentPrice = prices[prices.length - 1] || 0;
            return {
                upper: currentPrice * 1.02,
                middle: currentPrice,
                lower: currentPrice * 0.98
            };
        }

        const recentPrices = prices.slice(-period);
        const sma = this.calculateSMA(recentPrices, period);

        // Calculate standard deviation
        const variance = recentPrices.reduce((sum, price) => {
            return sum + Math.pow(price - sma, 2);
        }, 0) / period;

        const standardDeviation = Math.sqrt(variance);

        return {
            upper: sma + (standardDeviation * stdDev),
            middle: sma,
            lower: sma - (standardDeviation * stdDev)
        };
    }

    static calculateAllIndicators(candlestickData: CandlestickData[]): TechnicalIndicators {
        if (candlestickData.length === 0) {
            return {
                rsi: 50,
                macd: { macd: 0, signal: 0, histogram: 0 },
                sma20: 0,
                sma50: 0,
                ema12: 0,
                ema26: 0,
                bb: { upper: 0, middle: 0, lower: 0 }
            };
        }

        const prices = candlestickData.map(candle => candle.close);

        return {
            rsi: this.calculateRSI(prices),
            macd: this.calculateMACD(prices),
            sma20: this.calculateSMA(prices, 20),
            sma50: this.calculateSMA(prices, 50),
            ema12: this.calculateEMA(prices, 12),
            ema26: this.calculateEMA(prices, 26),
            bb: this.calculateBollingerBands(prices)
        };
    }
}

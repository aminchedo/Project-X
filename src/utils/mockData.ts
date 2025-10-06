/**
 * Mock Data Generator for Testing Scanner
 * Use this for development and testing without hitting the real API
 */

import { ScanResult } from '../types';

const SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT',
  'DOGEUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT', 'AVAXUSDT', 'LINKUSDT',
  'UNIUSDT', 'ATOMUSDT', 'ETCUSDT', 'XLMUSDT', 'NEARUSDT', 'ALGOUSDT',
];

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '1w'];

const DIRECTIONS: ('BULLISH' | 'BEARISH' | 'NEUTRAL')[] = ['BULLISH', 'BEARISH', 'NEUTRAL'];

const DETECTORS = [
  'harmonic',
  'elliott',
  'fibonacci',
  'price_action',
  'smc',
  'sar',
  'sentiment',
  'news',
  'whales',
];

/**
 * Generate a random score between 0 and 1
 */
const randomScore = (min: number = 0, max: number = 1): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generate a random direction based on score
 */
const getDirectionFromScore = (score: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
  if (score > 0.7) return 'BULLISH';
  if (score < 0.3) return 'BEARISH';
  return 'NEUTRAL';
};

/**
 * Generate mock sample components
 */
const generateSampleComponents = () => {
  const components: any = {};
  
  DETECTORS.forEach(detector => {
    const raw = randomScore();
    const weight = 1 / DETECTORS.length;
    
    components[detector] = {
      raw,
      score: raw,
      weight,
      meta: {
        confidence: randomScore(0.5, 1),
        strength: randomScore(),
      },
    };
  });
  
  return components;
};

/**
 * Generate a single mock scan result
 */
export const generateMockScanResult = (
  symbol?: string,
  scoreRange?: [number, number]
): ScanResult => {
  const finalSymbol = symbol || SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  const score = scoreRange 
    ? randomScore(scoreRange[0], scoreRange[1]) 
    : randomScore();
  const direction = getDirectionFromScore(score);
  
  const selectedTimeframes = TIMEFRAMES
    .slice(0, Math.floor(Math.random() * 5) + 1)
    .sort();
  
  return {
    symbol: finalSymbol,
    score,
    final_score: score,
    overall_score: score,
    direction,
    overall_direction: direction,
    confidence: randomScore(0.5, 1),
    tf_count: selectedTimeframes.length,
    timeframes: selectedTimeframes,
    sample_components: generateSampleComponents(),
    recommended_action: direction === 'BULLISH' ? 'BUY' : direction === 'BEARISH' ? 'SELL' : 'HOLD',
    risk_level: score > 0.7 ? 'LOW' : score < 0.3 ? 'HIGH' : 'MEDIUM',
    consensus_strength: randomScore(0.6, 1),
    timeframe_scores: {},
  };
};

/**
 * Generate multiple mock scan results
 */
export const generateMockScanResults = (
  count: number = 10,
  symbols?: string[],
  scoreRange?: [number, number]
): ScanResult[] => {
  const results: ScanResult[] = [];
  const useSymbols = symbols || SYMBOLS.slice(0, count);
  
  for (let i = 0; i < Math.min(count, useSymbols.length); i++) {
    results.push(generateMockScanResult(useSymbols[i], scoreRange));
  }
  
  // Sort by score descending
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
};

/**
 * Generate mock scan results with specific distribution
 */
export const generateMockScanResultsWithDistribution = (
  bullishCount: number = 3,
  bearishCount: number = 3,
  neutralCount: number = 4
): ScanResult[] => {
  const results: ScanResult[] = [];
  
  // Generate bullish results (score 0.7-1.0)
  for (let i = 0; i < bullishCount; i++) {
    results.push(generateMockScanResult(undefined, [0.7, 1.0]));
  }
  
  // Generate bearish results (score 0.0-0.3)
  for (let i = 0; i < bearishCount; i++) {
    results.push(generateMockScanResult(undefined, [0.0, 0.3]));
  }
  
  // Generate neutral results (score 0.3-0.7)
  for (let i = 0; i < neutralCount; i++) {
    results.push(generateMockScanResult(undefined, [0.3, 0.7]));
  }
  
  // Sort by score descending
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
};

/**
 * Simulate API delay
 */
export const simulateApiDelay = (ms: number = 1500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock scan API response
 */
export const mockScanApiResponse = async (
  symbols: string[],
  timeframes: string[],
  delay: number = 1500
): Promise<{ results: ScanResult[] }> => {
  await simulateApiDelay(delay);
  
  const results = generateMockScanResults(symbols.length, symbols);
  
  return {
    results,
  };
};

/**
 * Generate mock historical data for performance tracking
 */
export const generateMockHistoricalData = (days: number = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString(),
      accuracy: randomScore(0.6, 0.85),
      totalSignals: Math.floor(Math.random() * 50) + 10,
      profitableSignals: Math.floor(Math.random() * 35) + 5,
      averageReturn: randomScore(-5, 15),
    });
  }
  
  return data;
};

/**
 * Enable mock mode for development
 */
export const enableMockMode = () => {
  console.log('🧪 Mock mode enabled for scanner');
  
  // Override API client post method
  const originalPost = (window as any).__originalApiPost;
  if (!originalPost) {
    (window as any).__originalApiPost = fetch;
  }
  
  // Mock fetch for scanner endpoint
  (window as any).fetch = async (url: string, options?: any) => {
    if (url.includes('/api/scanner/run')) {
      console.log('🎭 Intercepted scanner API call, returning mock data');
      const body = options?.body ? JSON.parse(options.body) : {};
      const mockResponse = await mockScanApiResponse(
        body.symbols || ['BTCUSDT', 'ETHUSDT'],
        body.timeframes || ['15m', '1h', '4h']
      );
      
      return {
        ok: true,
        json: async () => mockResponse,
      } as Response;
    }
    
    // Pass through other requests
    return (window as any).__originalApiPost(url, options);
  };
};

/**
 * Disable mock mode
 */
export const disableMockMode = () => {
  console.log('✅ Mock mode disabled');
  if ((window as any).__originalApiPost) {
    (window as any).fetch = (window as any).__originalApiPost;
  }
};

// Export for easy access in console
if (typeof window !== 'undefined') {
  (window as any).mockData = {
    enable: enableMockMode,
    disable: disableMockMode,
    generate: generateMockScanResults,
    generateWithDistribution: generateMockScanResultsWithDistribution,
  };
  
  console.log('💡 Mock data utilities available: window.mockData');
}

export default {
  generateMockScanResult,
  generateMockScanResults,
  generateMockScanResultsWithDistribution,
  mockScanApiResponse,
  generateMockHistoricalData,
  enableMockMode,
  disableMockMode,
};

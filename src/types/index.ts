export interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  final_score: number;
  rsi_macd_score: number;
  smc_score: number;
  pattern_score: number;
  sentiment_score: number;
  ml_score: number;
  timestamp: Date;
  price: number;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  position_size?: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  high_24h: number;
  low_24h: number;
  change_24h: number;
  timestamp: Date;
}

export interface OHLCVData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RiskMetrics {
  current_equity: number;
  daily_loss_pct: number;
  consecutive_losses: number;
  daily_loss_limit_hit: boolean;
  consecutive_loss_limit_hit: boolean;
  position_size_multiplier: number;
  max_risk_per_trade: number;
}

export interface IndicatorData {
  rsi: number[];
  macd: {
    macd_line: number[];
    signal_line: number[];
    histogram: number[];
  };
  atr: number[];
  ema_20: number[];
  ema_50: number[];
}

export interface SMCAnalysis {
  score: number;
  order_blocks: {
    strength: number;
    level: number;
    type: 'bullish' | 'bearish';
  };
  liquidity_zones: {
    proximity: number;
    level: number;
    strength: number;
  };
  fair_value_gaps: {
    present: boolean;
    count: number;
    latest: any;
  };
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface PatternAnalysis {
  score: number;
  patterns: {
    doji: PatternResult;
    hammer: PatternResult;
    engulfing: PatternResult;
    pin_bar: PatternResult;
  };
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
}

export interface PatternResult {
  detected: boolean;
  strength: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface SentimentData {
  score: number;
  fear_greed: {
    value: number;
    classification: string;
    signal: string;
  };
  signal: string;
  timestamp: Date;
}

export interface MLPrediction {
  score: number;
  prediction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
}

// ==================== Scanner Types ====================

export interface ComponentScore {
  detector: string;
  score: number; // 0-1
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number; // 0-1
  meta: Record<string, any>;
}

export interface CombinedScore {
  final_score: number; // 0-1
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  advice: string;
  confidence: number; // 0-1
  bull_mass?: number;
  bear_mass?: number;
  disagreement?: number;
  components: ComponentScore[];
}

export interface ScanResult {
  symbol: string;
  overall_score?: number; // Backend may use this
  final_score?: number;   // Or this (be tolerant)
  score?: number;         // Or this
  overall_direction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  direction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  recommended_action?: string;
  risk_level?: string;
  consensus_strength?: number;
  tf_count?: number;
  timeframes?: string[];
  timeframe_scores?: Record<string, CombinedScore>;
  sample_components?: Record<string, {
    raw: any;
    score: number;
    weight: number;
    meta: any;
  }>;
}

export interface ScanRequest {
  symbols: string[];
  timeframes: string[];
  weights?: Record<string, number>;
  rules?: {
    any_tf?: number;
    majority_tf?: number;
    mode?: 'aggressive' | 'conservative';
    min_score?: number;
    min_confidence?: number;
    max_risk_level?: string;
  };
}

export interface ScanResponse {
  scan_time: string;
  symbols_scanned: number;
  opportunities_found: number;
  results?: ScanResult[];  // Backend may use this
  result?: ScanResult[];   // Or this (be tolerant)
}

// ==================== Analytics Types ====================

export interface PredictionData {
  symbol: string;
  timeframe?: string;
  combined_score: CombinedScore;
  component_scores?: ComponentScore[];
  confidence?: number;
  timestamp?: string;
}

export interface CorrelationData {
  assets: string[];
  matrix: number[][];
}

export interface OrderBookLevel {
  price: number;
  size: number;
}

export interface MarketDepthData {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp?: string;
}

export interface SentimentScore {
  value: number; // 0-1
  label: string;
  sources?: string[];
}

export interface NewsItem {
  title: string;
  source: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  timestamp: string;
  url?: string;
}

export interface WhaleTransaction {
  symbol: string;
  amount: number;
  usd_value: number;
  type: 'buy' | 'sell';
  timestamp: string;
}
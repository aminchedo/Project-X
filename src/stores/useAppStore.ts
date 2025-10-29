/**
 * Central Application Store (Zustand)
 * 
 * SINGLE SOURCE OF TRUTH for the entire trading application.
 * All components read from this store. No component owns its own data.
 * 
 * Data flows: Backend → (WebSocket/Polling) → Store → Components
 */

import { create } from 'zustand';

// ==================== Type Definitions ====================

export type RiskProfile = 'low' | 'medium' | 'high';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error';
export type SignalDirection = 'LONG' | 'SHORT';

export interface Ticker {
  bid: number;
  ask: number;
  last: number;
}

export interface OrderBook {
  bids: [number, number][];  // [price, size]
  asks: [number, number][];
}

export interface TradingSignal {
  symbol: string;
  timeframe: string;
  direction: SignalDirection;
  confidence: number;
}

export interface ScannerFilters {
  symbols: string[];
  timeframes: string[];
  minScore: number;
  signalTypes: string[];
}

export interface ScanResult {
  symbol: string;
  timeframe: string;
  type: string;   // "LONG" / "SHORT"
  score: number;
}

export interface Position {
  symbol: string;
  size: number;
  entry: number;
  pnl: number;
  leverage: number;
}

export interface PortfolioSummary {
  positions: Position[];
  exposureUsd: number;
}

export interface PnLSummary {
  realized: number;
  unrealized: number;
  total: number;
}

export interface RiskSnapshot {
  liquidationRisk: number;
  marginUsage: number;
  notes?: string;
}

// ==================== Store Interface ====================

export interface AppState {
  // ========== Trading Context ==========
  currentSymbol: string;
  timeframe: string;
  leverage: number;
  riskProfile: RiskProfile;

  // ========== Live Connection + Market Data ==========
  connectionStatus: ConnectionStatus;
  ticker: Ticker | null;
  orderBook: OrderBook | null;

  // ========== Latest Trading Signal ==========
  lastSignal: TradingSignal | null;

  // ========== Scanner State ==========
  scannerFilters: ScannerFilters;
  scanResults: ScanResult[];

  // ========== Watchlist ==========
  watchlist: string[];

  // ========== Portfolio / PnL / Risk ==========
  portfolioSummary: PortfolioSummary | null;
  pnlSummary: PnLSummary | null;
  riskSnapshot: RiskSnapshot | null;

  // ========== Error Tracking ==========
  lastError: string | null;

  // ========== Actions / Setters ==========
  setSymbol: (s: string) => void;
  setTimeframe: (tf: string) => void;
  setLeverage: (lv: number) => void;
  setRiskProfile: (rp: RiskProfile) => void;

  setScannerFilters: (patch: Partial<ScannerFilters>) => void;
  setScanResults: (rows: ScanResult[]) => void;

  addWatchSymbol: (sym: string) => void;
  removeWatchSymbol: (sym: string) => void;

  setPortfolioSummary: (p: PortfolioSummary | null) => void;
  setPnlSummary: (p: PnLSummary | null) => void;
  setRiskSnapshot: (r: RiskSnapshot | null) => void;

  setLastSignal: (sig: TradingSignal | null) => void;

  setConnectionStatus: (v: ConnectionStatus) => void;
  setTicker: (t: Ticker | null) => void;
  setOrderBook: (ob: OrderBook | null) => void;
  setLastError: (err: string | null) => void;
}

// ==================== Initial State ====================

const initialState: Omit<AppState, keyof ReturnType<typeof createActions>> = {
  // Trading context
  currentSymbol: 'BTCUSDT',
  timeframe: '15m',
  leverage: 5,
  riskProfile: 'medium',

  // Live connection
  connectionStatus: 'connecting',
  ticker: null,
  orderBook: null,

  // Signal
  lastSignal: null,

  // Scanner
  scannerFilters: {
    symbols: ['BTCUSDT'],
    timeframes: ['15m'],
    minScore: 60,
    signalTypes: ['LONG', 'SHORT'],
  },
  scanResults: [],

  // Watchlist
  watchlist: [],

  // Portfolio
  portfolioSummary: null,
  pnlSummary: null,
  riskSnapshot: null,

  // Error
  lastError: null,
};

// ==================== Actions Factory ====================

const createActions = (set: any, get: any) => ({
  // ========== Trading Context Actions ==========
  
  setSymbol: (s: string) => {
    set({ currentSymbol: s });
    // CRITICAL: Auto-sync scanner filters when symbol changes
    const { scannerFilters } = get();
    const newSymbols = [s, ...scannerFilters.symbols.filter((sym: string) => sym !== s)];
    set({
      scannerFilters: {
        ...scannerFilters,
        symbols: newSymbols,
      },
    });
  },

  setTimeframe: (tf: string) => {
    set({ timeframe: tf });
    // CRITICAL: Auto-sync scanner filters when timeframe changes
    const { scannerFilters } = get();
    const newTimeframes = [tf, ...scannerFilters.timeframes.filter((t: string) => t !== tf)];
    set({
      scannerFilters: {
        ...scannerFilters,
        timeframes: newTimeframes,
      },
    });
  },

  setLeverage: (lv: number) => set({ leverage: lv }),
  setRiskProfile: (rp: RiskProfile) => set({ riskProfile: rp }),

  // ========== Scanner Actions ==========
  
  setScannerFilters: (patch: Partial<ScannerFilters>) => {
    const { scannerFilters } = get();
    set({ scannerFilters: { ...scannerFilters, ...patch } });
  },

  setScanResults: (rows: ScanResult[]) => set({ scanResults: rows }),

  // ========== Watchlist Actions ==========
  
  addWatchSymbol: (sym: string) => {
    const { watchlist } = get();
    if (!watchlist.includes(sym)) {
      set({ watchlist: [...watchlist, sym] });
    }
  },

  removeWatchSymbol: (sym: string) => {
    const { watchlist } = get();
    set({ watchlist: watchlist.filter((s: string) => s !== sym) });
  },

  // ========== Portfolio Actions ==========
  
  setPortfolioSummary: (p: PortfolioSummary | null) => set({ portfolioSummary: p }),
  setPnlSummary: (p: PnLSummary | null) => set({ pnlSummary: p }),
  setRiskSnapshot: (r: RiskSnapshot | null) => set({ riskSnapshot: r }),

  // ========== Signal Actions ==========
  
  setLastSignal: (sig: TradingSignal | null) => set({ lastSignal: sig }),

  // ========== WebSocket Actions ==========
  
  setConnectionStatus: (v: ConnectionStatus) => set({ connectionStatus: v }),
  setTicker: (t: Ticker | null) => set({ ticker: t }),
  setOrderBook: (ob: OrderBook | null) => set({ orderBook: ob }),
  setLastError: (err: string | null) => set({ lastError: err }),
});

// ==================== Store Implementation ====================

export const useAppStore = create<AppState>((set, get) => ({
  ...initialState,
  ...createActions(set, get),
}));

// ==================== Export Aliases for API Compatibility ====================

/**
 * wsStatus is an alias for connectionStatus
 * Use: const wsStatus = useAppStore(state => state.connectionStatus)
 */

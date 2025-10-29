# STATE_MAP.md

## Overview

This document maps ALL state sources in the Project-X codebase and identifies any duplication or legacy stores that may conflict with the single source of truth (useAppStore).

---

## useAppStore State Fields

Located at: `src/stores/useAppStore.ts`

### 1. currentSymbol
- **Type**: `string`
- **Writer**: User action via `setSymbol()` (called from AppLayout header dropdown, Dashboard)
- **Reader**: AppLayout header, Dashboard
- **Status**: `[Only useAppStore]`

### 2. timeframe
- **Type**: `string`
- **Writer**: User action via `setTimeframe()` (auto-synced with scannerFilters when symbol changes)
- **Reader**: AppLayout header
- **Status**: `[Only useAppStore]`

### 3. leverage
- **Type**: `number`
- **Writer**: User action via `setLeverage()`
- **Reader**: AppLayout header
- **Status**: `[Only useAppStore]`

### 4. riskProfile
- **Type**: `RiskProfile` ('low' | 'medium' | 'high')
- **Writer**: User action via `setRiskProfile()`
- **Reader**: Not directly read by routed pages (may be used by RiskPanel component)
- **Status**: `[Only useAppStore]`

### 5. connectionStatus
- **Type**: `ConnectionStatus` ('connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error')
- **Writer**: LiveDataProvider via WebSocket events (`setConnectionStatus()`)
  - `onopen` → 'connected'
  - `onclose` → 'disconnected' or 'reconnecting'
  - `onerror` → 'error'
- **Reader**: Dashboard (displays in table), WSBadge component (in AppLayout header)
- **Status**: `[Only useAppStore]`

### 6. ticker
- **Type**: `Ticker | null` ({ bid, ask, last })
- **Writer**: LiveDataProvider via WebSocket 'ticker' message (`setTicker()`)
- **Reader**: Dashboard (displays bid/ask/last in market overview table)
- **Status**: `[Only useAppStore]`

### 7. orderBook
- **Type**: `OrderBook | null` ({ bids: [price, size][], asks: [price, size][] })
- **Writer**: LiveDataProvider via WebSocket 'orderbook' message (`setOrderBook()`)
- **Reader**: Not directly read by current routed pages (may be used by future components)
- **Status**: `[Only useAppStore]`

### 8. lastSignal
- **Type**: `TradingSignal | null` ({ symbol, timeframe, direction, confidence })
- **Writer**:
  - LiveDataProvider via WebSocket 'signal' message (`setLastSignal()`)
  - useOverviewSync polling hook (fetches from `/api/signals` and calls `setLastSignal()`)
- **Reader**: Dashboard (displays signal direction and confidence), AppLayout header (may display signal indicator)
- **Status**: `[Only useAppStore]`

### 9. scannerFilters
- **Type**: `ScannerFilters` ({ symbols, timeframes, minScore, signalTypes })
- **Writer**: User action via `setScannerFilters()` (called from ScannerEntry page)
- **Auto-sync**: When `currentSymbol` or `timeframe` changes, `setSymbol()` and `setTimeframe()` automatically update scannerFilters
- **Reader**: ScannerEntry page
- **Status**: `[Only useAppStore]`

### 10. scanResults
- **Type**: `ScanResult[]` ({ symbol, timeframe, type, score })
- **Writer**: ScannerEntry page after calling `scanSignals()` API → `setScanResults()`
- **Reader**: ScannerEntry page (displays results table)
- **Status**: `[Only useAppStore]`

### 11. watchlist
- **Type**: `string[]`
- **Writer**: User action via `addWatchSymbol()` / `removeWatchSymbol()` (called from ScannerEntry)
- **Reader**: ScannerEntry page (displays watchlist sidebar)
- **Status**: `[Only useAppStore]`

### 12. portfolioSummary
- **Type**: `PortfolioSummary | null` ({ positions: Position[], exposureUsd })
- **Writer**: Polling hooks (usePortfolioSync, useOverviewSync) → fetches from `/api/portfolio/status` → `setPortfolioSummary()`
- **Reader**: PortfolioEntry page, Dashboard, AppLayout header
- **Status**: `[Only useAppStore]`

### 13. pnlSummary
- **Type**: `PnLSummary | null` ({ realized, unrealized, total })
- **Writer**: Polling hooks (usePortfolioSync, useOverviewSync) → fetches from `/api/pnl` → `setPnlSummary()`
- **Reader**: PortfolioEntry page, Dashboard, AppLayout header
- **Status**: `[Only useAppStore]`

### 14. riskSnapshot
- **Type**: `RiskSnapshot | null` ({ liquidationRisk, marginUsage, notes? })
- **Writer**: Polling hooks (usePortfolioSync, useOverviewSync) → fetches from `/api/risk/live` → `setRiskSnapshot()`
- **Reader**: PortfolioEntry page, Dashboard, AppLayout header
- **Status**: `[Only useAppStore]`

### 15. lastError
- **Type**: `string | null`
- **Writer**: LiveDataProvider via WebSocket error messages (`setLastError()`)
- **Reader**: Not currently read by any routed page
- **Status**: `[Only useAppStore]`

---

## Legacy Stores

### Legacy Store: src/state/store.ts

**Location**: `src/state/store.ts`

**State Fields**:
- `symbols: string[]` - List of symbols to scan (default: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT'])
- `timeframes: string[]` - List of timeframes (default: ['15m', '1h', '4h'])
- `weights: WeightConfig` - Detector weights for scanner (harmonic: 0.15, elliott: 0.15, smc: 0.20, fibonacci: 0.10, price_action: 0.15, sar: 0.10, sentiment: 0.10, news: 0.05, whales: 0.05)
- `rules: ScanRules` - Scan rules ({ any_tf: 0.6, majority_tf: 0.7, mode: 'conservative' })

**Data Persistence**: Uses localStorage (`hts_scanner_state`)

**Implementation Pattern**: Observable pattern with manual subscribe/notify (NOT Zustand)

**Accessed via**:
- `src/state/hooks.ts` - Exports React hooks that read from this legacy store:
  - `useStore()` - Subscribes to entire legacy store
  - `useSymbols()` - Returns symbols + setters
  - `useTimeframes()` - Returns timeframes + setters
  - `useWeights()` - Returns weights + setters
  - `useRules()` - Returns rules + setters
  - `useScannerConfig()` - Returns complete scanner config (symbols, timeframes, weights, rules)

**Is this legacy store imported anywhere in routed pages or their children?**

**YES** - BLOCKER: multiple state sources in runtime

Evidence:
1. `src/pages/Scanner/index.tsx` (comprehensive scanner) imports `useScannerConfig` from `src/state/hooks.ts` [Observed in code]
2. `src/state/hooks.ts` imports `store` from `src/state/store.ts` (the legacy store) [Observed in code]
3. `src/components/Dashboard.tsx` renders `<Scanner />` component when `activeTab === 'scanner2'` [Observed in code]
4. Dashboard is the component for route `/` (imported in `src/App.tsx` as `<Route path="/" element={<Dashboard />} />`) [Observed in code]

**Chain of imports**:
```
Route "/"
  → Dashboard component (src/components/Dashboard.tsx)
  → Scanner component (src/pages/Scanner/index.tsx) [when activeTab='scanner2']
  → useScannerConfig hook (src/state/hooks.ts)
  → legacy store (src/state/store.ts)
```

**BLOCKER**: The legacy store is NOT dead. It is actively used by the Scanner component which is rendered on the `/` route.

**Conflict with useAppStore**:

The legacy store holds `symbols` and `timeframes` which OVERLAP with:
- `useAppStore.scannerFilters.symbols`
- `useAppStore.scannerFilters.timeframes`

When Scanner component uses `useScannerConfig()`, it reads symbols/timeframes from the **legacy store**, NOT from useAppStore.

When ScannerEntry page uses `useAppStore`, it reads symbols/timeframes from **useAppStore.scannerFilters**.

This creates TWO sources of truth for scanner configuration:
1. Legacy store (used by Scanner component in Dashboard)
2. useAppStore (used by ScannerEntry page)

**Assessment**: This is a state management conflict. The legacy store MUST be deprecated and Scanner component must be refactored to use useAppStore instead.

**Safe to deprecate after merge?**: NO - not safe to deprecate until Scanner component is refactored to use useAppStore.

---

## Conclusion

**Single Source of Truth Status**: VIOLATED

The codebase has TWO state management systems active in runtime:
1. `useAppStore` (Zustand) - used by most pages
2. Legacy `store` (Observable pattern) - used by Scanner component on `/` route

**Recommended Action**: Refactor `src/pages/Scanner/index.tsx` to use `useAppStore.scannerFilters` instead of `useScannerConfig()` from the legacy store. After refactoring, the legacy store can be safely deprecated.

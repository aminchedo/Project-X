# Project-X State Management Map

**Purpose:** Lock down single-source-of-truth expectations for Project-X state management.

**Generated:** 2025-10-29  
**Branch:** cursor/self-assess-project-x-architecture-and-state-55a5

---

## Primary Store: useAppStore (Zustand)

The following keys exist in `src/stores/useAppStore.ts` as the intended single source of truth:

### Trading Context State

**`currentSymbol: string`**
- **Who writes it:** User interaction via symbol selector dropdown in AppLayout header, Dashboard symbol changes [Implemented in code]
- **Which pages read it:** AppLayout header, Dashboard, TradingChart, ScannerEntry (auto-syncs to scanner filters) [Implemented in code]
- **Legacy store conflict:** `useAssetStore` also has `selectedSymbol` - **[Legacy store also present]**

**`timeframe: string`**
- **Who writes it:** User interaction via setTimeframe action [Implemented in code]
- **Which pages read it:** AppLayout header display [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

**`leverage: number`**
- **Who writes it:** User interaction via setLeverage action [Implemented in code]
- **Which pages read it:** AppLayout header display [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

**`riskProfile: RiskProfile`**
- **Who writes it:** User interaction via setRiskProfile action [Implemented in code]
- **Which pages read it:** Not observed in current routes [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

### Live Market Data State

**`connectionStatus: ConnectionStatus`**
- **Who writes it:** LiveDataProvider WebSocket lifecycle events [Implemented in code]
- **Which pages read it:** AppLayout header (WSBadge), Dashboard market overview table, TradingChart [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

**`ticker: Ticker | null`**
- **Who writes it:** LiveDataProvider via WebSocket 'ticker' messages [Implemented in code]
- **Which pages read it:** AppLayout header (for PnL calculations), Dashboard market overview, TradingChart [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

**`orderBook: OrderBook | null`**
- **Who writes it:** LiveDataProvider via WebSocket 'orderbook' messages [Implemented in code]
- **Which pages read it:** Not observed in current routes [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

**`lastSignal: TradingSignal | null`**
- **Who writes it:** LiveDataProvider via WebSocket 'signal' messages [Implemented in code]
- **Which pages read it:** AppLayout header, Dashboard market overview table [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

### Portfolio & Risk State

**`portfolioSummary: PortfolioSummary | null`**
- **Who writes it:** usePortfolioSync hook (polling mechanism) [Implemented in code]
- **Which pages read it:** AppLayout header, PortfolioEntry, Dashboard PnL summary [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

**`pnlSummary: PnLSummary | null`**
- **Who writes it:** useOverviewSync hook for Dashboard, usePortfolioSync hook for PortfolioEntry [Implemented in code]
- **Which pages read it:** AppLayout header, PortfolioEntry, Dashboard PnL cards [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

**`riskSnapshot: RiskSnapshot | null`**
- **Who writes it:** useOverviewSync hook for Dashboard, usePortfolioSync hook for PortfolioEntry [Implemented in code]
- **Which pages read it:** AppLayout header, PortfolioEntry, Dashboard risk cards [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

### Scanner State

**`scannerFilters: ScannerFilters`**
- **Who writes it:** User interaction in ScannerEntry, auto-sync from currentSymbol/timeframe changes [Implemented in code]
- **Which pages read it:** ScannerEntry, GlobalTradeControls [Implemented in code]
- **Legacy store conflict:** `src/state/store.ts` has overlapping scanner configuration - **[Legacy store also present]**

**`scanResults: ScanResult[]`**
- **Who writes it:** ScannerEntry via scanSignals API call [Implemented in code]
- **Which pages read it:** ScannerEntry results table [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

**`watchlist: string[]`**
- **Who writes it:** User interaction via addWatchSymbol/removeWatchSymbol in ScannerEntry [Implemented in code]
- **Which pages read it:** ScannerEntry watchlist sidebar [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

**`lastError: string | null`**
- **Who writes it:** LiveDataProvider WebSocket error handling [Implemented in code]
- **Which pages read it:** Not observed in current routes [Implemented in code]
- **Legacy store conflict:** None identified [Only useAppStore]

---

## Legacy Stores Identified

### 1. `src/stores/assetStore.ts` (useAssetStore)
**State:** `selectedSymbol`, `setSymbol`, `clearSymbol`
**Purpose:** Symbol selection for legacy components
**Conflict:** Overlaps with `useAppStore.currentSymbol`
**Status:** **[Legacy store also present]**

### 2. `src/state/store.ts` (Scanner Configuration Store)
**State:** `symbols`, `timeframes`, `weights`, `rules` for scanner configuration
**Purpose:** Scanner weight and rule configuration
**Conflict:** Overlaps with `useAppStore.scannerFilters`
**Status:** **[Legacy store also present]**

---

## Route Page Store Import Analysis

**Pages importing useAppStore:**
- `/` (Dashboard) - ✅ Uses useAppStore
- `/scanner` (ScannerEntry) - ✅ Uses useAppStore  
- `/portfolio` (PortfolioEntry) - ✅ Uses useAppStore
- `/training` (TrainingPage) - ❌ No direct store imports (wraps Bolt component)
- `/backtest` (BacktestPage) - ❌ No direct store imports (wraps Bolt component)
- `/intel` (IntelPage) - ❌ No direct store imports (placeholder UI)
- `/settings` (SettingsPage) - ❌ No direct store imports (wraps Bolt component)

**Components importing legacy stores:**
- `src/components/Layout/AssetSelect.tsx` - imports `useAssetStore`
- `src/components/Overview/OverviewPage.tsx` - imports `useAssetStore`
- `src/components/Widgets/DynamicWidgets.tsx` - imports `useAssetStore`
- `src/components/showcase/WeightSliders.tsx` - imports types from `state/store`
- `src/components/showcase/RulesConfig.tsx` - imports types from `state/store`

---

## Is any routed page still importing the legacy scanner store?

**Answer:** NO - No routed page directly imports the legacy scanner store (`src/state/store.ts`).

However, two components import **types only** from the legacy store:
- `src/components/showcase/WeightSliders.tsx` (imports `WeightConfig` type)
- `src/components/showcase/RulesConfig.tsx` (imports `ScanRules` type)

These appear to be showcase/demo components and only import TypeScript types, not the actual store instance.

**Legacy assetStore status:** Three components still import `useAssetStore`, but none of the main routed pages use it directly. This creates a secondary symbol selection system that could conflict with `useAppStore.currentSymbol`.

**Conclusion:** The legacy scanner store is **inert** for routing purposes, but the legacy `assetStore` is **still active** in some components and represents a potential source-of-truth conflict.
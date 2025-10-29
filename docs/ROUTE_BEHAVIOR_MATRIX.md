# ROUTE_BEHAVIOR_MATRIX.md

## Overview

This document describes the behavior of all 7 routes in Project-X, including data sources, background activity, gating, and layout integration.

---

## Route: `/`

**Component**: `Dashboard` (`src/components/Dashboard.tsx`)

### 1. Purpose

Main trading dashboard interface with live signals, price charts, portfolio summary, PnL display, risk metrics, and market scanner tabs. [Observed in code]

### 2. Data Sources

**Zustand (useAppStore)**: [Observed in code]
- `currentSymbol`, `timeframe`, `leverage` - trading context
- `connectionStatus` - WebSocket status
- `ticker`, `orderBook`, `lastSignal` - live market data from WebSocket
- `pnlSummary`, `portfolioSummary`, `riskSnapshot` - from useOverviewSync polling

**WebSocket via LiveDataProvider**: [Observed in code]
- Ticker updates (`bid`, `ask`, `last`)
- Order book updates
- Trading signals

**Polling hook**: [Observed in code]
- `useOverviewSync(true)` - Polls every 5000ms (5 seconds) from `src/hooks/useOverviewSync.ts:18`
- Fetches: portfolio status, PnL, risk snapshot, last signal

**Local component state** (legacy APIs): [Observed in code]
- `signals` array - from `tradingEngine.generateSignal()` calls
- `marketData` array - from `binanceApi.get24hrTicker()` calls
- `chartData` array - from `binanceApi.getKlines()` calls
- `apiHealthData` - from `fetch('http://localhost:8000/health')`

**Bolt components**: [Observed in code]
- Scanner component (`src/pages/Scanner/index.tsx`) rendered when `activeTab === 'scanner2'`
  - BLOCKER: Uses legacy store via `useScannerConfig()` hook (see STATE_MAP.md)

### 3. Background Activity

**setInterval timers** (from `src/components/Dashboard.tsx` useEffect line 61-76): [Observed in code]
- `updateMarketData()` every 10000ms (10 seconds) - calls Binance API for multiple symbols
- `refreshSignals()` every 60000ms (60 seconds) - generates signals for 3 symbols
- `checkSystemHealth()` every 30000ms (30 seconds) - pings Binance API
- `loadApiHealth()` every 120000ms (120 seconds / 2 minutes) - fetches backend health endpoint

**Polling hooks**: [Observed in code]
- `useOverviewSync(true)` runs every 5000ms (5 seconds)

**Scanner component intervals** (when activeTab='scanner2'): [Not runtime-verified]
- Scanner may have auto-refresh enabled (user-configurable interval)
- Default auto-refresh interval: 300 seconds (5 minutes) from `src/pages/Scanner/index.tsx:93`

### 4. Gating / Compliance Requirements

**Gates**: None - public route [Observed in code]

**Feature IDs**: N/A [Observed in code]

### 5. Layout / Policy Integration

**Renders under AppLayout**: Yes [Observed in code]

**Inherits dir="rtl" automatically**: Yes (AppLayout sets dir="rtl" at line 25) [Observed in code]

**Displays global header**: Yes [Observed in code]

### 6. Verification Status

- Dashboard component reads from useAppStore: [Observed in code]
- Dashboard uses useOverviewSync polling hook: [Observed in code]
- Dashboard runs 4 setInterval timers: [Observed in code]
- Scanner component uses legacy store: [Observed in code]
- Polling frequency of useOverviewSync is 5000ms: [Observed in code]
- Runtime header persistence across navigation: [Not runtime-verified]
- Whether timers stop when navigating away: [Not runtime-verified]

---

## Route: `/scanner`

**Component**: `ScannerEntry` (`src/pages/ScannerEntry.tsx`)

### 1. Purpose

Simple market scanner interface for running scans with configurable filters and managing a watchlist. [Observed in code]

### 2. Data Sources

**Zustand (useAppStore)**: [Observed in code]
- `scannerFilters` - user-configured filters (symbols, timeframes, minScore, signalTypes)
- `scanResults` - scan results from API
- `watchlist` - user-managed symbol list

**API call**: [Observed in code]
- `scanSignals(scannerFilters)` from `src/services/api.ts`
- Called when user clicks "Run Scan" button
- Updates `useAppStore.setScanResults()` with response

**GlobalTradeControls component**: [Observed in code]
- Imported from `src/components/Trading/GlobalTradeControls`
- Reads symbol/leverage/timeframe from useAppStore

### 3. Background Activity

None. All scanning is user-triggered via button click. [Observed in code]

### 4. Gating / Compliance Requirements

**Gates**: None - public route [Observed in code]

**Feature IDs**: N/A [Observed in code]

### 5. Layout / Policy Integration

**Renders under AppLayout**: Yes [Observed in code]

**Inherits dir="rtl" automatically**: Yes (also sets own dir="rtl" at line 40) [Observed in code]

**Displays global header**: Yes [Observed in code]

### 6. Verification Status

- ScannerEntry reads from useAppStore: [Observed in code]
- ScannerEntry has no background timers: [Observed in code]
- Scan is user-triggered only: [Observed in code]
- RTL rendering in browser: [Not runtime-verified]

---

## Route: `/portfolio`

**Component**: `PortfolioEntry` (`src/pages/PortfolioEntry.tsx`)

### 1. Purpose

Portfolio management page showing open positions, P&L breakdown (realized/unrealized/total), and risk metrics (liquidation risk, margin usage). [Observed in code]

### 2. Data Sources

**Zustand (useAppStore)**: [Observed in code]
- `portfolioSummary` - positions array, total exposure USD
- `pnlSummary` - realized, unrealized, total PnL
- `riskSnapshot` - liquidation risk %, margin usage %, optional notes

**Polling hook**: [Observed in code]
- `usePortfolioSync(true)` - Polls every 3000ms (3 seconds) from `src/hooks/usePortfolioSync.ts:17`
- Fetches: portfolio status, PnL, risk snapshot

### 3. Background Activity

**Polling hooks**: [Observed in code]
- `usePortfolioSync(true)` runs every 3000ms (3 seconds)

### 4. Gating / Compliance Requirements

**Gates**: None - public route [Observed in code]

**Feature IDs**: N/A [Observed in code]

### 5. Layout / Policy Integration

**Renders under AppLayout**: Yes [Observed in code]

**Inherits dir="rtl" automatically**: Yes (also sets own dir="rtl" at line 23) [Observed in code]

**Displays global header**: Yes [Observed in code]

### 6. Verification Status

- PortfolioEntry reads from useAppStore: [Observed in code]
- PortfolioEntry uses usePortfolioSync polling: [Observed in code]
- Polling frequency is 3000ms: [Observed in code]
- Whether polling stops on unmount: [Observed in code] (cleanup function clears interval)
- Runtime polling behavior: [Not runtime-verified]

---

## Route: `/training`

**Component**: `TrainingPage` (`src/pages/TrainingPage.tsx`)

### 1. Purpose

AI model training dashboard for developing trading strategies. Allows training AI models for trading predictions. [Observed in code]

### 2. Data Sources

**Bolt component**: [Observed in code]
- Wraps `TrainingDashboard` from `src/bolt_import/components/TrainingDashboard/TrainingDashboard`

BLOCKER: cannot prove data sources from static code inspection. TrainingDashboard component behavior is unknown. It may:
- Use internal state
- Call external APIs
- Read from Bolt-specific contexts
- Run background intervals

[Not runtime-verified]

### 3. Background Activity

BLOCKER: cannot prove background activity from static code inspection.

The TrainingDashboard Bolt component may run:
- setInterval for simulating training metrics
- setInterval for model update polling
- WebSocket connections to training backend
- Long-running training jobs

[Not runtime-verified]

### 4. Gating / Compliance Requirements

**Gates**: [Observed in code]
- `FeatureGate` with `featureId="training-dashboard"` (line 24)
- `ConsentGate` with:
  - `feature="AI Training Dashboard"`
  - `riskLevel="high"`
  - `description="This feature allows you to train AI models for trading predictions. Training involves computational resources and may produce predictions that should not be used as sole basis for trading decisions. Always validate AI predictions with other analysis methods."`
  - Required reading time: 15 seconds (riskLevel='high' → 15s from ConsentGate.tsx:24)

**Consent persistence**: 30 days in localStorage as `consent_AI Training Dashboard` [Observed in code from ConsentGate.tsx:36]

### 5. Layout / Policy Integration

**Renders under AppLayout**: Yes [Observed in code]

**Inherits dir="rtl" automatically**: Yes (also sets own dir="rtl" at line 32) [Observed in code]

**Displays global header**: Yes [Observed in code]

### 6. Verification Status

- TrainingPage wrapped in FeatureGate: [Observed in code]
- TrainingPage wrapped in ConsentGate: [Observed in code]
- ConsentGate enforces 15-second reading time: [Observed in code]
- TrainingDashboard internal behavior: [Not runtime-verified]
- Whether FeatureGate blocks access if disabled: [Not runtime-verified]
- Whether ConsentGate prevents component mount until consent: [Not runtime-verified]
- Whether TrainingDashboard runs background jobs: [Not runtime-verified]

---

## Route: `/backtest`

**Component**: `BacktestPage` (`src/pages/BacktestPage.tsx`)

### 1. Purpose

Strategy backtesting interface for testing trading strategies against historical data. [Observed in code]

### 2. Data Sources

**Bolt component**: [Observed in code]
- Wraps `BacktestingModule` from `src/bolt_import/components/Backtesting/BacktestingModule`

BLOCKER: cannot prove data sources from static code inspection. BacktestingModule component behavior is unknown. It may:
- Fetch historical price data
- Run backtest simulations
- Store results in local state or localStorage
- Use Bolt-specific data providers

[Not runtime-verified]

### 3. Background Activity

BLOCKER: cannot prove background activity from static code inspection.

The BacktestingModule Bolt component may run:
- setInterval for backtest progress updates
- Long-running backtest calculations
- Historical data fetching loops
- Result caching operations

[Not runtime-verified]

### 4. Gating / Compliance Requirements

**Gates**: [Observed in code]
- `FeatureGate` with `featureId="backtesting"` (line 24)
- `ConsentGate` with:
  - `feature="Strategy Backtesting"`
  - `riskLevel="high"`
  - `description="This feature allows you to backtest trading strategies using historical data. Backtesting results are based on past performance and do not guarantee future results. Always consider multiple factors when evaluating strategies."`
  - Required reading time: 15 seconds (riskLevel='high' → 15s)

**Consent persistence**: 30 days in localStorage as `consent_Strategy Backtesting` [Observed in code]

### 5. Layout / Policy Integration

**Renders under AppLayout**: Yes [Observed in code]

**Inherits dir="rtl" automatically**: Yes (also sets own dir="rtl" at line 32) [Observed in code]

**Displays global header**: Yes [Observed in code]

### 6. Verification Status

- BacktestPage wrapped in FeatureGate: [Observed in code]
- BacktestPage wrapped in ConsentGate: [Observed in code]
- ConsentGate enforces 15-second reading time: [Observed in code]
- BacktestingModule internal behavior: [Not runtime-verified]
- Whether gates actually block access at runtime: [Not runtime-verified]
- Whether BacktestingModule runs CPU-intensive backtests: [Not runtime-verified]

---

## Route: `/intel`

**Component**: `IntelPage` (`src/pages/IntelPage.tsx`)

### 1. Purpose

Market intelligence page for sentiment analysis, news feeds, and whale tracking. Currently placeholder only. [Observed in code]

### 2. Data Sources

**Static placeholder UI only**: [Observed in code]

The page displays hardcoded Arabic text:
- "صفحه اطلاعات بازار در حال توسعه است" (Market intelligence page is under development)
- Note about Bolt components being disabled due to missing dependencies (apiConfig)

Commented-out Bolt components:
- MarketTicker
- SentimentDashboard
- NewsPanel
- WhaleFeed
- CryptoDashboard

[Observed in code]

### 3. Background Activity

None. Static content only. [Observed in code]

### 4. Gating / Compliance Requirements

**Gates**: [Observed in code]
- `FeatureGate` with `featureId="market-sentiment"` (line 19)
- No ConsentGate (feature-gated only)

### 5. Layout / Policy Integration

**Renders under AppLayout**: Yes [Observed in code]

**Inherits dir="rtl" automatically**: Yes (also sets own dir="rtl" at line 20) [Observed in code]

**Displays global header**: Yes [Observed in code]

### 6. Verification Status

- IntelPage wrapped in FeatureGate: [Observed in code]
- IntelPage shows placeholder content: [Observed in code]
- No background activity: [Observed in code]
- Whether FeatureGate blocks access if disabled: [Not runtime-verified]

---

## Route: `/settings`

**Component**: `SettingsPage` (`src/pages/SettingsPage.tsx`)

### 1. Purpose

Application settings and configuration panel. [Observed in code]

### 2. Data Sources

**Bolt component**: [Observed in code]
- Wraps `SettingsPanel` from `src/bolt_import/components/Settings/SettingsPanel`

BLOCKER: cannot prove data sources from static code inspection. SettingsPanel component behavior is unknown. It may:
- Read/write to localStorage for user preferences
- Fetch user settings from backend API
- Manage API keys or authentication tokens
- Configure notification preferences

[Not runtime-verified]

### 3. Background Activity

BLOCKER: cannot prove background activity from static code inspection.

The SettingsPanel Bolt component may:
- Poll for settings updates
- Validate API keys periodically
- Sync settings with backend
- Monitor notification channels

[Not runtime-verified]

### 4. Gating / Compliance Requirements

**Gates**: [Observed in code]
- `FeatureGate` with `featureId="alerts-system"` (line 11)
- No ConsentGate (feature-gated only)

BLOCKER: Feature ID inconsistency detected. Page is gated by `"alerts-system"` but purpose suggests general settings panel. This may be incorrect feature ID. [Observed in code]

### 5. Layout / Policy Integration

**Renders under AppLayout**: Yes [Observed in code]

**Inherits dir="rtl" automatically**: Yes (also sets own dir="rtl" at line 12) [Observed in code]

**Displays global header**: Yes [Observed in code]

### 6. Verification Status

- SettingsPage wrapped in FeatureGate: [Observed in code]
- FeatureGate uses "alerts-system" ID: [Observed in code]
- SettingsPanel internal behavior: [Not runtime-verified]
- Whether "alerts-system" is correct feature ID: [Not runtime-verified]
- Whether SettingsPanel manages alerts or general settings: [Not runtime-verified]

---

## Summary Table

| Route | Purpose | Background Activity | Gates | Verification |
|-------|---------|-------------------|-------|--------------|
| `/` | Dashboard | 4 setInterval (10s, 60s, 30s, 120s) + useOverviewSync (5s) | None | [Observed in code] |
| `/scanner` | Scanner | None (user-triggered only) | None | [Observed in code] |
| `/portfolio` | Portfolio | usePortfolioSync (3s) | None | [Observed in code] |
| `/training` | AI Training | Unknown (Bolt component) | FeatureGate + ConsentGate (high, 15s) | [Not runtime-verified] |
| `/backtest` | Backtesting | Unknown (Bolt component) | FeatureGate + ConsentGate (high, 15s) | [Not runtime-verified] |
| `/intel` | Market Intel | None (placeholder) | FeatureGate | [Observed in code] |
| `/settings` | Settings | Unknown (Bolt component) | FeatureGate (alerts-system) | [Not runtime-verified] |

---

## BLOCKERS

1. **Scanner component on "/" route uses legacy store** (see STATE_MAP.md)
   - Multiple state sources active in runtime
   - Must refactor Scanner to use useAppStore before merge

2. **Bolt component behavior unknown for /training, /backtest, /settings**
   - Cannot confirm from static code whether they run background jobs
   - Cannot confirm resource consumption
   - Cannot confirm whether FeatureGate prevents background activity

3. **Feature ID inconsistency for /settings**
   - Gated by "alerts-system" but appears to be general settings panel
   - Needs human verification of correct feature ID

---

## Runtime Unknowns Requiring Human QA

All routes must be tested with the navigation path:
`/` → `/scanner` → `/portfolio` → `/training` → `/backtest` → `/settings` → `/intel` → `/`

At each step, verify:
- Global header remains visible without flicker/remount
- WSBadge does not show "connecting" or "reconnecting"
- Selected symbol/leverage/timeframe persists in header
- RTL layout looks correct
- Browser console shows no red errors
- Gated pages (/training, /backtest, /intel, /settings) show gate UI or content as expected
- ConsentGate shows 15-second timer for /training and /backtest

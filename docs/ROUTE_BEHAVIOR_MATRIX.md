# Project-X Route Behavior Matrix

**Purpose:** Risk and load profile documentation for each route in Project-X.

**Generated:** 2025-10-29  
**Branch:** cursor/self-assess-project-x-architecture-and-state-55a5

---

## Route: `/` (Dashboard)

**Purpose:** Main trading interface with live signals, charts, market overview, and portfolio summary [Implemented in code]

**Data Sources:**
- Zustand store for trading context (symbol, timeframe, leverage), PnL summary, portfolio summary, risk snapshot [Implemented in code]
- Legacy APIs via `tradingEngine.generateSignal()` and `binanceApi` for chart data and market data [Implemented in code]
- WebSocket data via LiveDataProvider for ticker, connection status, last signal [Implemented in code]

**Background Intervals/Polling:**
- Price updates: `setInterval(updateMarketData, 10000)` - every 10 seconds [Implemented in code]
- Signal refresh: `setInterval(refreshSignals, 60000)` - every 60 seconds [Implemented in code]  
- Health checks: `setInterval(checkSystemHealth, 30000)` - every 30 seconds [Implemented in code]
- API health: `setInterval(loadApiHealth, 120000)` - every 2 minutes [Implemented in code]
- Overview sync: `useOverviewSync(true)` - polling frequency unknown [Implemented in code]

**Gates:** None - this is the main entry point [Implemented in code]

**AppLayout:** Yes, inherits global header and RTL [Implemented in code]

**Load Profile:** HIGH - Multiple concurrent intervals running continuously [Implemented in code]

---

## Route: `/scanner` (ScannerEntry)

**Purpose:** Market scanning with configurable filters for finding trading opportunities [Implemented in code]

**Data Sources:**
- Zustand store for scanner filters, scan results, watchlist [Implemented in code]
- API call to `scanSignals(scannerFilters)` when user clicks "Run Scan" [Implemented in code]
- No automatic data fetching [Implemented in code]

**Background Intervals/Polling:**
- None - all scanning is user-triggered [Implemented in code]

**Gates:** None [Implemented in code]

**AppLayout:** Yes, inherits global header and RTL [Implemented in code]

**Load Profile:** LOW - Only user-triggered API calls [Implemented in code]

---

## Route: `/portfolio` (PortfolioEntry)

**Purpose:** Portfolio management showing open positions, P&L breakdown, and risk metrics [Implemented in code]

**Data Sources:**
- Zustand store for portfolio summary, PnL summary, risk snapshot [Implemented in code]
- `usePortfolioSync(true)` hook for polling portfolio updates [Implemented in code]

**Background Intervals/Polling:**
- Portfolio sync polling via `usePortfolioSync(true)` - polling frequency unknown [Assumed/Not verified]

**Gates:** None [Implemented in code]

**AppLayout:** Yes, inherits global header and RTL [Implemented in code]

**Load Profile:** MEDIUM - Single polling hook running [Implemented in code]

---

## Route: `/training` (TrainingPage)

**Purpose:** AI model training dashboard for strategy development [Assumed/Not verified]

**Data Sources:**
- Wraps `TrainingDashboard` component from `../bolt_import/components/TrainingDashboard/TrainingDashboard` [Implemented in code]
- Actual data source depends on Bolt component implementation [Assumed/Not verified]

**Background Intervals/Polling:**
- Unknown - depends on what `TrainingDashboard` component does internally [Assumed/Not verified]
- **RISK:** Bolt component could be running `setInterval` for mock training metrics or AI model updates [Assumed/Not verified]
- **RISK:** FeatureGate may not prevent background processes if they start before gate evaluation [Assumed/Not verified]

**Gates:** 
- `FeatureGate` with `featureId="training-dashboard"` [Implemented in code]
- `ConsentGate` with `riskLevel="high"` and time-delayed consent (15 seconds) [Implemented in code]

**AppLayout:** Yes, inherits global header and RTL [Implemented in code]

**Load Profile:** UNKNOWN - Could be HIGH if Bolt component runs training simulations [Assumed/Not verified]

---

## Route: `/backtest` (BacktestPage)

**Purpose:** Strategy backtesting and performance analysis [Assumed/Not verified]

**Data Sources:**
- Wraps `BacktestingModule` component from `../bolt_import/components/Backtesting/BacktestingModule` [Implemented in code]
- Actual data source depends on Bolt component implementation [Assumed/Not verified]

**Background Intervals/Polling:**
- Unknown - depends on what `BacktestingModule` component does internally [Assumed/Not verified]
- **RISK:** Bolt component could be running `setInterval` for backtest progress updates or historical data processing [Assumed/Not verified]
- **RISK:** FeatureGate may not prevent background processes if they start before gate evaluation [Assumed/Not verified]

**Gates:**
- `FeatureGate` with `featureId="backtesting"` [Implemented in code]
- `ConsentGate` with `riskLevel="high"` and time-delayed consent (15 seconds) [Implemented in code]

**AppLayout:** Yes, inherits global header and RTL [Implemented in code]

**Load Profile:** UNKNOWN - Could be HIGH if Bolt component processes historical data [Assumed/Not verified]

---

## Route: `/intel` (IntelPage)

**Purpose:** Market intelligence with sentiment analysis, news feeds, and whale tracking [Assumed/Not verified]

**Data Sources:**
- Currently displays placeholder UI only [Implemented in code]
- Bolt components are commented out due to missing dependencies (apiConfig) [Implemented in code]
- No live data integration implemented yet [Implemented in code]

**Background Intervals/Polling:**
- None - static placeholder content [Implemented in code]

**Gates:**
- `FeatureGate` with `featureId="market-sentiment"` [Implemented in code]
- No ConsentGate (only feature gated) [Implemented in code]

**AppLayout:** Yes, inherits global header and RTL [Implemented in code]

**Load Profile:** NONE - Static placeholder [Implemented in code]

---

## Route: `/settings` (SettingsPage)

**Purpose:** Application settings and configuration [Assumed/Not verified]

**Data Sources:**
- Wraps `SettingsPanel` component from `../bolt_import/components/Settings/SettingsPanel` [Implemented in code]
- Actual functionality depends on Bolt component implementation [Assumed/Not verified]

**Background Intervals/Polling:**
- Unknown - depends on what `SettingsPanel` component does internally [Assumed/Not verified]
- **RISK:** Settings panel could be polling for configuration updates or API key validation [Assumed/Not verified]

**Gates:**
- `FeatureGate` with `featureId="alerts-system"` [Implemented in code]
- No ConsentGate (only feature gated) [Implemented in code]

**AppLayout:** Yes, inherits global header and RTL [Implemented in code]

**Load Profile:** UNKNOWN - Likely LOW but depends on Bolt component [Assumed/Not verified]

---

## Summary Matrix

| Route | Load Profile | Background Activity | Gates | Bolt Component Risk |
|-------|-------------|-------------------|-------|-------------------|
| `/` | HIGH | 4 intervals + polling | None | N/A |
| `/scanner` | LOW | User-triggered only | None | N/A |
| `/portfolio` | MEDIUM | 1 polling hook | None | N/A |
| `/training` | UNKNOWN | **Unknown Bolt behavior** | Feature + Consent | **HIGH RISK** |
| `/backtest` | UNKNOWN | **Unknown Bolt behavior** | Feature + Consent | **HIGH RISK** |
| `/intel` | NONE | Static placeholder | Feature only | N/A |
| `/settings` | UNKNOWN | **Unknown Bolt behavior** | Feature only | **MEDIUM RISK** |

---

## Critical Unknowns Requiring Investigation

### Bolt Component Background Activity
**Issue:** Three routes (`/training`, `/backtest`, `/settings`) wrap Bolt components with unknown internal behavior [Assumed/Not verified].

**Risks:**
1. **Resource consumption:** Bolt components could run expensive background processes [Assumed/Not verified]
2. **Gate bypass:** Background processes might start before FeatureGate evaluation completes [Assumed/Not verified]
3. **Memory leaks:** Unknown cleanup behavior when components unmount [Assumed/Not verified]

### FeatureGate Process Control
**Issue:** FeatureGate controls component rendering but may not prevent background processes that start during component initialization [Assumed/Not verified].

**Investigation needed:** Whether FeatureGate can actually stop `setInterval` or other background processes from Bolt components when feature is disabled [Assumed/Not verified].

### Polling Hook Frequencies
**Issue:** `useOverviewSync` and `usePortfolioSync` polling frequencies are not documented [Assumed/Not verified].

**Impact:** Cannot assess actual load profile or resource consumption [Assumed/Not verified].
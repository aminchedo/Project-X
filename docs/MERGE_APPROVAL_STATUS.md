# MERGE_APPROVAL_STATUS.md

## Architecture Status

All 7 routes (`/`, `/scanner`, `/portfolio`, `/training`, `/backtest`, `/intel`, `/settings`) are rendered under a single `<Route element={<AppLayout />}>` wrapper in `src/App.tsx`. [Observed in code]

AppLayout (located at `src/layout/AppLayout.tsx`) enforces RTL direction via `dir="rtl"` attribute on its root div (line 25) and renders a persistent global header. [Observed in code]

The global header displays:
- Logo and application title ("کنسول معاملاتی")
- Navigation links to `/`, `/portfolio`, `/scanner` (public routes only)
- WSBadge showing WebSocket connection status
- Symbol selector dropdown (reads from `useAppStore.currentSymbol`, calls `setSymbol` on change)
- Timeframe display (reads from `useAppStore.timeframe`)
- Leverage display (reads from `useAppStore.leverage`)
- PnL summary (reads from `useAppStore.pnlSummary`)
- Risk snapshot (liquidation risk % and margin usage % from `useAppStore.riskSnapshot`)

All data in the header is read from `useAppStore` (Zustand) via hooks imported at line 10-18 of `src/layout/AppLayout.tsx`. [Observed in code]

LiveDataProvider wraps the `<Routes>` component in `src/App.tsx` (line 19-33). It opens a WebSocket connection to the backend at `WS_URL` (default: `ws://localhost:8000/ws/market`) and writes live market data into `useAppStore` via setters (`setConnectionStatus`, `setTicker`, `setOrderBook`, `setLastSignal`, `setLastError`). [Observed in code]

FeatureFlagProviderWrapper wraps LiveDataProvider and Routes in `src/App.tsx` (line 18-34). It provides feature flag context to all child components via the `useFeatureFlag` hook. [Observed in code]

Four routes are gated:
- `/training` - FeatureGate with `featureId="training-dashboard"` + ConsentGate with `riskLevel="high"` (15-second timer)
- `/backtest` - FeatureGate with `featureId="backtesting"` + ConsentGate with `riskLevel="high"` (15-second timer)
- `/intel` - FeatureGate with `featureId="market-sentiment"` (no ConsentGate)
- `/settings` - FeatureGate with `featureId="alerts-system"` (no ConsentGate)

[Observed in code from src/pages/TrainingPage.tsx, src/pages/BacktestPage.tsx, src/pages/IntelPage.tsx, src/pages/SettingsPage.tsx]

---

## Known Unknowns (Runtime)

The following behaviors are NOT yet runtime-confirmed and require human QA in a browser before merge:

### Header flicker / remount between route changes

**What we observe in code**: AppLayout is rendered as a parent wrapper around all routes via `<Route element={<AppLayout />}>`. React Router documentation states that parent route elements should NOT remount when navigating between child routes. [Observed in code]

**What we cannot confirm without runtime testing**: Whether the browser actually preserves the AppLayout component instance across navigation, or whether React re-renders it in a way that causes visual flicker or re-fetching of header data.

**Why this is a blocker**: If AppLayout remounts, all header data (symbol, PnL, risk) would reset or flicker, degrading user experience.

### WebSocket reconnect / WSBadge flicker on route change

**What we observe in code**: LiveDataProvider is mounted above the `<Routes>` component (line 19 of App.tsx), so navigation should NOT cause it to remount or disconnect the WebSocket. [Observed in code]

**What we cannot confirm without runtime testing**: Whether the browser WebSocket connection remains stable during React route transitions, or whether WSBadge shows intermediate states like "connecting" or "reconnecting" during navigation.

**Why this is a blocker**: If the WebSocket disconnects on route change, live market data would be interrupted, and users would see connection status flicker in the header.

### RTL visual correctness in browser

**What we observe in code**: AppLayout sets `dir="rtl"` on its root div. Individual pages also set `dir="rtl"` on their root divs (redundant but safe). All text content is in Persian/Arabic. [Observed in code]

**What we cannot confirm without runtime testing**: Whether the RTL layout renders correctly in actual browsers (Chrome, Firefox, Safari), including text alignment, icon positioning, and flex/grid layouts.

**Why this is a blocker**: RTL layout bugs can make the UI unusable for Persian/Arabic users.

### Whether gated pages crash or silently spin mock intervals in the background

**What we observe in code**:
- `/training`, `/backtest`, and `/settings` wrap Bolt components (TrainingDashboard, BacktestingModule, SettingsPanel).
- These Bolt components are external imports from `src/bolt_import/components/`.
- We cannot inspect their internal implementation from static code review.

[Observed in code]

**What we cannot confirm without runtime testing**:
- Whether these Bolt components run background `setInterval` loops
- Whether they crash when mounted
- Whether FeatureGate actually prevents them from mounting when the feature is disabled
- Whether ConsentGate prevents them from mounting until user consents
- What happens if the feature flag is turned OFF while the component is already mounted

**Why this is a blocker**: If Bolt components run expensive background jobs or crash, they could degrade performance or break the app.

### Whether feature flags actually block access at runtime

**What we observe in code**: FeatureGate component (src/bolt_import/components/FeatureGate.tsx) checks `isEnabled(featureId)` and renders children only if enabled. Otherwise, it renders a disabled state UI with a lock icon and message. [Observed in code]

**What we cannot confirm without runtime testing**:
- Whether the FeatureFlagProvider actually loads feature flags correctly from its source (environment variables, config file, API, etc.)
- Whether `isEnabled()` returns the correct boolean for each feature ID
- Whether the disabled state UI appears when expected
- Whether users can bypass the gate via browser DevTools or URL manipulation

**Why this is a blocker**: If feature flags don't work, users could access gated features without proper consent or authorization.

### Whether console logs any red errors on navigation

**What we cannot confirm without runtime testing**: The actual browser console output during navigation. There may be React warnings, missing dependencies, API errors, or component lifecycle issues that only appear at runtime.

**Why this is a blocker**: Console errors indicate bugs that must be fixed before merge.

---

## Human QA Procedure Before Merge

### Setup

1. Start the backend server (if required by LiveDataProvider WebSocket)
2. Start the dev server: `npm run dev` or `vite`
3. Open `http://localhost:5173` in a browser

### Navigation Test

Navigate in this exact order (same browser tab, no full page reloads):

`/` → `/scanner` → `/portfolio` → `/training` → `/backtest` → `/settings` → `/intel` → `/`

### Checklist at Each Step

At each route, confirm and record:

- [ ] **Global header is visible** (logo, nav links, WSBadge, symbol dropdown, timeframe, leverage, PnL, risk)
- [ ] **Header did NOT flicker or disappear** during transition from previous route
- [ ] **WSBadge shows "connected"** (green badge) - does NOT show "connecting", "reconnecting", or "disconnected"
- [ ] **Selected symbol persists** (if you changed symbol on `/`, it should still show that symbol on other routes)
- [ ] **Leverage value persists** in header
- [ ] **Timeframe value persists** in header
- [ ] **RTL layout looks correct** (text aligns right, icons on left, proper spacing)
- [ ] **Browser console shows NO red errors** (warnings are acceptable, but NO errors)

### Special Checks for Gated Pages

#### `/training` page

- [ ] FeatureGate displays "Feature Disabled" UI if `training-dashboard` flag is OFF
- [ ] ConsentGate displays consent modal if flag is ON and user has not consented
- [ ] ConsentGate shows 15-second countdown timer
- [ ] "I Understand & Proceed" button is disabled until timer reaches 15 seconds
- [ ] After clicking "I Understand & Proceed", TrainingDashboard component loads
- [ ] No console errors when TrainingDashboard mounts
- [ ] If you navigate away and come back within 30 days, ConsentGate does NOT reappear (consent persists in localStorage)

#### `/backtest` page

- [ ] FeatureGate displays "Feature Disabled" UI if `backtesting` flag is OFF
- [ ] ConsentGate displays consent modal if flag is ON and user has not consented
- [ ] ConsentGate shows 15-second countdown timer
- [ ] "I Understand & Proceed" button is disabled until timer reaches 15 seconds
- [ ] After clicking "I Understand & Proceed", BacktestingModule component loads
- [ ] No console errors when BacktestingModule mounts

#### `/intel` page

- [ ] FeatureGate displays "Feature Disabled" UI if `market-sentiment` flag is OFF
- [ ] If flag is ON, placeholder content appears (Arabic text about page being under development)
- [ ] No console errors

#### `/settings` page

- [ ] FeatureGate displays "Feature Disabled" UI if `alerts-system` flag is OFF
- [ ] If flag is ON, SettingsPanel component loads
- [ ] No console errors when SettingsPanel mounts

### WebSocket Stability Test

1. On the `/` (Dashboard) page, observe the WSBadge in the header
2. Wait for it to show "connected" (green)
3. Navigate to `/scanner`, then `/portfolio`, then back to `/`
4. Confirm WSBadge remained "connected" throughout (did NOT disconnect or reconnect)
5. If backend sends live ticker updates, confirm the header PnL updates in real-time

### Final Validation

After completing the full navigation loop:
- [ ] Return to `/` and confirm all header values are still correct
- [ ] Check browser console - confirm NO red errors (only warnings acceptable)
- [ ] If any errors appeared, document them as blockers

---

## Policy Reminder

**Do NOT add navigation links to `/training`, `/backtest`, `/intel`, or `/settings` in the header** until runtime QA passes without console errors.

Reason: These pages are gated and may not be accessible to all users. Adding links would create confusion and broken navigation.

**Do NOT remove FeatureGate or ConsentGate from any gated page.**

Reason: These gates enforce compliance and risk management. Removing them violates the product requirements.

**Do NOT rename feature IDs or standardize them until after QA**, unless doing so would unblock QA.

Reason: Renaming feature IDs could break feature flag lookups and cause gates to malfunction.

**Do NOT delete the legacy store** (`src/state/store.ts`) until we prove via STATE_MAP.md that no active routed page imports it.

Reason: The Scanner component on `/` route currently imports the legacy store via `useScannerConfig()` hook. Deleting it would break the app.

**BLOCKER**: The Scanner component must be refactored to use `useAppStore.scannerFilters` instead of `useScannerConfig()` before the legacy store can be safely removed.

**After QA passes**, we can merge this branch into main.

---

## Merge Readiness Summary

**Architecture**: ✅ Implemented
- Single AppLayout wrapper for all routes
- Persistent global header
- LiveDataProvider above routing level
- FeatureFlagProvider wrapping entire app

**Gating**: ✅ Implemented
- FeatureGate on `/training`, `/backtest`, `/intel`, `/settings`
- ConsentGate on `/training`, `/backtest` (high-risk pages)

**RTL Support**: ✅ Implemented in code
- AppLayout sets dir="rtl"
- Pages set dir="rtl" (redundant but safe)
- All UI text is in Persian/Arabic

**State Management**: ⚠️ BLOCKER
- useAppStore (Zustand) is primary store
- Legacy store (src/state/store.ts) is still active via Scanner component on `/` route
- Multiple sources of truth detected (see STATE_MAP.md)
- Refactoring required before merge

**Runtime Verification**: ⏳ Pending Human QA
- All "Known Unknowns" listed above require browser testing
- QA procedure documented above
- No merge until QA passes

---

## Next Steps

1. **Human QA Team**: Execute the QA procedure above and document results
2. **If QA finds bugs**: File issues, fix, and re-test
3. **If QA passes**: Proceed to Scanner refactoring (remove legacy store dependency)
4. **After refactoring**: Re-run QA to confirm no regressions
5. **Merge to main** only after both QA passes and legacy store is removed

**DO NOT MERGE** until all BLOCKER items are resolved and Human QA confirms all checkboxes pass.

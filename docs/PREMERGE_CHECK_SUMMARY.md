# PREMERGE_CHECK_SUMMARY.md

## Critical Questions

This document provides binary yes/no answers to critical questions that determine merge readiness.

---

## Question 1: Legacy Store Usage

**Does ANY routed page OR any component used directly by those routed pages still import from any legacy store (e.g., `src/state/store.ts` or any scanner store that is NOT `useAppStore`)?**

**Answer: YES**

**BLOCKER: multiple state sources in runtime**

**Evidence**:

1. `src/pages/Scanner/index.tsx` imports `useScannerConfig` from `src/state/hooks.ts` (line 2) [Observed in code]

2. `src/state/hooks.ts` imports `store` from `src/state/store.ts` (line 6) [Observed in code]
   ```typescript
   import { store, AppState, WeightConfig, ScanRules } from './store';
   ```

3. `src/components/Dashboard.tsx` renders `<Scanner />` component when `activeTab === 'scanner2'` (line 278) [Observed in code]

4. `Dashboard` is the component for route `/` (defined in `src/App.tsx` line 22) [Observed in code]

**Chain of imports**:
```
Route "/"
  → Dashboard component (src/components/Dashboard.tsx)
  → Scanner component (src/pages/Scanner/index.tsx) [when activeTab='scanner2']
  → useScannerConfig hook (src/state/hooks.ts)
  → legacy store (src/state/store.ts)
```

**Conflict description**:

The legacy store holds `symbols` and `timeframes` which OVERLAP with `useAppStore.scannerFilters.symbols` and `useAppStore.scannerFilters.timeframes`.

When Scanner component (in Dashboard) uses `useScannerConfig()`, it reads from the **legacy store**.

When ScannerEntry page uses `useAppStore`, it reads from **useAppStore.scannerFilters**.

This creates TWO sources of truth for scanner configuration:
1. Legacy store (`src/state/store.ts`) - used by Scanner component on `/` route
2. useAppStore (`src/stores/useAppStore.ts`) - used by ScannerEntry page on `/scanner` route

**Assessment**:

All routed pages and their children do **NOT** read exclusively from useAppStore.

Legacy store is **NOT** dead. It is actively used in runtime.

**Action required**:

Legacy store **CANNOT** be scheduled for removal post-merge until Scanner component is refactored to use `useAppStore.scannerFilters` instead of `useScannerConfig()`.

---

## Question 2: Exponential Backoff Implementation

**Does `LiveDataProvider` actually implement any exponential backoff logic for reconnect in code?**

**Answer: YES**

**Evidence**:

From `src/context/LiveDataContext.tsx` line 179 [Observed in code]:

```javascript
const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current);
```

Constants from line 69-70 [Observed in code]:
```javascript
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000; // 3 seconds
```

**Backoff formula**: `delay = 3000 * (1.5 ^ attemptNumber)`

**Backoff sequence**:
- Attempt 0: 3000ms (3.0s)
- Attempt 1: 4500ms (4.5s)
- Attempt 2: 6750ms (6.75s)
- Attempt 3: 10125ms (10.1s)
- Attempt 4: 15187ms (15.2s)
- Attempt 5: 22781ms (22.8s)
- Attempt 6: 34171ms (34.2s)
- Attempt 7: 51257ms (51.3s)
- Attempt 8: 76885ms (76.9s)
- Attempt 9: 115328ms (115.3s)

**Max attempts**: 10 [Observed in code]

**Assessment**:

Exponential backoff IS implemented in code. This is NOT an assumption.

The formula uses `Math.pow(1.5, attemptNumber)` which produces true exponential growth.

Previous claims of exponential backoff are **SUPPORTED BY CODE**.

---

## Final Status

**NEXT GATE: Waiting on human runtime QA per MERGE_APPROVAL_STATUS.md**

**BLOCKER STATUS**: Cannot merge until legacy store dependency is removed from Scanner component.

**QA STATUS**: All runtime unknowns documented in MERGE_APPROVAL_STATUS.md require human browser testing before merge can proceed.

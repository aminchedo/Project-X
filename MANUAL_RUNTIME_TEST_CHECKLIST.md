# Manual Runtime Test Checklist - Pre-Merge Validation

**Branch:** cursor/validate-routing-and-feature-gate-compliance-0261  
**Date:** 2025-10-29  
**Status:** ⏳ PENDING EXECUTION  
**Architectural Approval:** ✅ APPROVED  
**Blocker Status:** Manual runtime validation required before merge

---

## Executive Summary

All code-level validation has passed. The routing architecture, provider structure, feature gates, RTL implementation, and Zustand integration are all compliant with the Project-X Routing Quality Control Protocol.

**What remains:** A single smoke-test navigation sequence to prove runtime stability before merge.

---

## Test Environment Setup

### Prerequisites:
1. Development server running on `localhost:5173`
2. Backend API running on `localhost:8000` (optional but recommended)
3. Browser console open to monitor errors
4. Clean browser state (no cached data that could interfere)

### Start Command:
```bash
npm run dev
# or
npm run frontend:dev
```

**Expected Output:**
- Frontend server starts on port 5173
- No startup errors in terminal
- Browser opens to `http://localhost:5173`

---

## Navigation Test Sequence

Execute the following route transitions **in a single browser session** (same tab, no page reloads):

### Route Order:
1. `/` (Dashboard)
2. `/scanner` (Scanner Entry)
3. `/portfolio` (Portfolio Entry)
4. `/training` (Training Page - may require feature flag ON)
5. `/backtest` (Backtest Page - may require feature flag ON)
6. `/settings` (Settings Page - may require feature flag ON)
7. `/` (return to Dashboard)

**Optional:** Test `/intel` between routes 4-5 if the `market-sentiment` feature flag is currently enabled.

---

## Pass/Fail Criteria for Each Transition

At **EVERY** route change, verify all four criteria below. If ANY criterion fails at ANY transition, **STOP and mark as FAIL**.

---

### ✅ Criterion 1: Header Persistence

**What to watch:**
- The global header from `AppLayout` must stay mounted and visible
- It should contain: WSBadge, Symbol Selector, Timeframe, Leverage, PnL Summary, Risk Snapshot

**PASS conditions:**
- ✅ Header stays visible throughout navigation
- ✅ Header does NOT flicker or disappear momentarily
- ✅ Header does NOT remount (causing content to briefly blank out)

**FAIL conditions:**
- ❌ Header disappears on any route change
- ❌ Header flickers/blinks during navigation
- ❌ Header content resets to loading state on each route

**If FAIL:** Provider structure issue. `AppLayout` is being remounted. Do not merge.

---

### ✅ Criterion 2: WebSocket Stability

**What to watch:**
- `WSBadge` component in the header (shows connection status)

**PASS conditions:**
- ✅ Badge stays `"connected"` (or equivalent healthy state) throughout navigation
- ✅ No reconnection attempts triggered by route changes
- ✅ Connection status does not bounce `"connecting" → "connected"` on every navigation

**FAIL conditions:**
- ❌ Badge shows `"connecting"` on every route change
- ❌ WebSocket reconnects on navigation (even if brief)
- ❌ Badge resets to initial state on each route

**If FAIL:** `LiveDataProvider` is remounting on navigation. This means WebSocket tears down and reconnects unnecessarily. Do not merge.

---

### ✅ Criterion 3: Shared State Continuity

**What to test:**
1. On the `/` (Dashboard) route:
   - Change the **symbol** in the global header (e.g., from "BTC/USDT" to "ETH/USDT")
   - Change the **leverage** slider
   - Change the **timeframe** selector

2. Navigate through all routes in sequence

3. At each route, confirm:
   - The selected symbol is displayed correctly
   - The leverage value is preserved
   - The timeframe value is preserved

4. Return to `/` and verify values are still the same

**PASS conditions:**
- ✅ All values persist across all routes
- ✅ No route "resets" to default values
- ✅ Values are synchronized everywhere

**FAIL conditions:**
- ❌ Any route shows a different symbol than what was set
- ❌ Any route keeps "its own" local state (e.g., Scanner always shows BTC even after changing to ETH)
- ❌ Values reset when navigating back to `/`

**If FAIL:** Local mock state is leaking. A component is not using Zustand. Do not merge.

---

### ✅ Criterion 4: RTL Rendering

**What to watch:**
- All pages should render in **right-to-left (RTL)** layout
- Persian/Arabic text should align to the right
- UI elements should flow from right to left

**PASS conditions:**
- ✅ All pages render in RTL direction
- ✅ No page silently falls back to LTR
- ✅ Headers/columns do not flip weirdly
- ✅ Visual consistency across all routes

**FAIL conditions:**
- ❌ Any page ignores RTL and renders LTR
- ❌ One page has different text direction than others
- ❌ Header elements flip position unexpectedly on certain routes

**If FAIL:** RTL implementation incomplete. Breaks product consistency. Do not merge.

---

## Console Error Monitoring

Throughout the entire test sequence, monitor the browser console for **red errors** (warnings are acceptable).

### ❌ Blocking Errors (if any appear, do NOT merge):

1. **Provider Errors:**
   ```
   useFeatureFlags must be used within FeatureFlagProvider
   ```
   **Cause:** Component using feature flags outside provider scope

2. **Store Errors:**
   ```
   useAppStore(...) is undefined
   Cannot read properties of undefined (reading 'setSymbol')
   ```
   **Cause:** Component trying to access Zustand store before it's initialized

3. **API Errors (repeated):**
   ```
   Failed to fetch: http://localhost:8000/api/...
   ```
   **Cause (if repeated on every route):** Component making unnecessary API calls on mount

4. **Component Mount Errors:**
   ```
   React: Cannot update component while rendering another component
   Warning: Cannot update during an existing state transition
   ```
   **Cause:** State update logic issue in component lifecycle

### ✅ Acceptable Warnings (non-blocking):

- Feature flag warnings about disabled features
- API warnings if backend is not running (as long as UI still works)
- Console logs from development tools
- TypeScript warnings (if not causing runtime errors)

---

## Test Execution Record

### Navigation Log:

| Route | Header Persists? | WSBadge Stable? | State Synced? | RTL Correct? | Console Clean? | Overall |
|-------|------------------|-----------------|---------------|--------------|----------------|---------|
| `/` (initial load) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/scanner` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/portfolio` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/training` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/backtest` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/settings` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| `/` (return) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

**Mark each box:**
- ✅ = PASS
- ❌ = FAIL (include details below)
- ⚠️ = WARNING (note issue but not blocking)

---

## Final Test Result

### Option A: PASS ✅
```
RESULT: PASS
- No reconnects observed
- Header stayed mounted throughout navigation
- No console errors (red stack traces)
- RTL rendering consistent across all pages
- State synchronized correctly across routes

RECOMMENDATION: ✅ APPROVED FOR MERGE
```

### Option B: FAIL ❌
```
RESULT: FAIL
First blocking error encountered at: [route name]
Error type: [header remount / WS reconnect / state leak / console error]
Error details:
[paste console error or describe visual issue]

RECOMMENDATION: ❌ DO NOT MERGE
Required fix: [describe what needs to be fixed]
```

---

## After Test Completion

### If PASS ✅:
1. ✅ Update this document with test results and timestamp
2. ✅ Proceed with merge to `main`
3. ✅ Include both validation documents in merge:
   - `ROUTING_QC_VALIDATION_REPORT.md`
   - `ROUTING_QC_FIXES_APPLIED.md`
   - This checklist with PASS status
4. ✅ Move to post-merge tasks:
   - Add header navigation links to new routes
   - Wire `/backtest` and `/intel` to FastAPI
   - Standardize feature flag IDs

### If FAIL ❌:
1. ❌ Document the failure in this checklist
2. ❌ Copy console error output (if applicable)
3. ❌ Identify which component/provider is causing the issue
4. ❌ Fix the issue and re-run this test from the beginning
5. ❌ Do NOT merge until all criteria pass

---

## Quick Reference: What We're Testing

This manual test validates the **runtime behavior** that cannot be verified through static code analysis:

1. **Provider Stability:** Ensure `LiveDataProvider` and `FeatureFlagProviderWrapper` stay mounted during navigation (not recreated on route changes)

2. **WebSocket Lifecycle:** Confirm WebSocket connection persists across navigation (no unnecessary disconnects/reconnects)

3. **State Persistence:** Verify Zustand store maintains state across routes (no local state overrides)

4. **Layout Consistency:** Ensure `AppLayout` header never unmounts during navigation

5. **RTL Visual Rendering:** Confirm RTL text direction works correctly in browser (not just in code)

6. **Runtime Errors:** Catch any race conditions, mounting issues, or provider access errors that only appear at runtime

---

## Technical Notes

### Why Manual Testing is Required:

Even though code review shows:
- ✅ Correct provider order in `App.tsx`
- ✅ All routes under `<Route element={<AppLayout />}>`
- ✅ All RTL wrappers present (`dir="rtl"` on root divs)
- ✅ Zustand used correctly in all components

**Runtime can still fail due to:**
- React rendering lifecycle issues
- Provider context re-creation bugs
- WebSocket connection timing issues
- CSS/layout rendering problems
- State initialization race conditions

None of these are detectable through static code analysis alone.

---

## Test Performed By:

**Tester Name:** ___________________________  
**Date:** ___________________________  
**Test Duration:** ___________________________  
**Environment:** ___________________________  
**Browser:** ___________________________  

**Final Result:** ☐ PASS ✅ | ☐ FAIL ❌

**Signature:** ___________________________

---

## Appendix: Feature Flag Configuration

If any gated routes are inaccessible during testing, verify feature flags are enabled:

### Feature Flags Required:
- `training-dashboard` → enables `/training` route
- `backtesting` → enables `/backtest` route
- `market-sentiment` → enables `/intel` route
- `alerts-system` → enables `/settings` route

### How to Enable (if needed):
Check `src/providers/FeatureFlagProviderWrapper.tsx` for flag configuration.

---

**Document Status:** ⏳ AWAITING MANUAL EXECUTION  
**Next Action:** Human tester must execute this checklist in browser  
**Merge Blocked Until:** All tests PASS with no console errors

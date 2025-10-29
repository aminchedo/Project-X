# Bolt Integration Documentation

## Overview

This document describes the integration of Bolt project components into Project-X. The integration was completed in 6 phases to ensure safety, maintainability, and proper data flow.

## Architecture

### Provider Stack

The application uses a layered provider architecture in `App.tsx`:

```
<BrowserRouter>
  <FeatureFlagProviderWrapper>      ← Feature flag system (from Bolt)
    <LiveDataProvider>               ← WebSocket + Zustand updates (Project-X)
      <Routes>
        <AppLayout>                  ← Global header with status (Project-X)
          <Outlet />                 ← Page content
        </AppLayout>
      </Routes>
    </LiveDataProvider>
  </FeatureFlagProviderWrapper>
</BrowserRouter>
```

### Data Flow

```
FastAPI Backend (port 8000)
  ↓ (WebSocket ws://localhost:8000/ws/market)
LiveDataProvider
  ↓ (updates)
Zustand Store (useAppStore)
  ↓ (reads)
AppLayout + Pages
```

**Critical Rule**: Zustand is the single source of truth for shared application state. All Bolt components are treated as presentational components that either:
- Read from Zustand via `useAppStore()`, or
- Accept data as props, or
- Show graceful fallbacks (`"-"`) when data is unavailable

### Bolt Import Structure

All Bolt code is isolated in `src/bolt_import/`:

```
src/bolt_import/
├── components/
│   ├── TrainingDashboard/
│   ├── Backtesting/
│   ├── crypto/
│   ├── Legal/
│   ├── Settings/
│   └── ...
├── contexts/
│   └── FeatureFlagContext.tsx
├── hooks/
├── services/
├── types/
└── utils/
```

**Important**: No Project-X files import directly from `bolt_import` except through wrapper pages in `src/pages/`.

## Routes

### Existing Routes (Project-X)
- `/` - Dashboard (real-time trading data)
- `/portfolio` - Portfolio management (Zustand + FastAPI)
- `/scanner` - Market scanner (Zustand + FastAPI)

### New Routes (Bolt-integrated)
- `/training` - AI Training Dashboard (feature-gated + consent-gated)
- `/backtest` - Strategy Backtesting (feature-gated + consent-gated)
- `/intel` - Market Intelligence (feature-gated)
- `/settings` - Settings Panel (feature-gated)

## Feature Flags

Feature flags control which Bolt features are enabled. Configuration is in `src/bolt_import/contexts/FeatureFlagContext.tsx`.

### Default Enabled Flags
- `training-dashboard` - AI model training interface
- `market-sentiment` - Market intelligence and sentiment
- `portfolio-management` - Portfolio tracking (used by existing pages)
- `ai-predictions` - AI predictions (not actively used yet)
- `real-time-charts` - Real-time charts

### Default Disabled Flags
- `backtesting` - Strategy backtesting (can be enabled via localStorage)
- `risk-management` - Advanced risk tools
- `whale-tracking` - Large transaction monitoring
- `alerts-system` - Price alerts

### How to Enable/Disable Features

Feature flags are stored in localStorage as JSON. To toggle a feature:

```javascript
// In browser console:
const flags = JSON.parse(localStorage.getItem('feature-flags'));
flags['backtesting'].enabled = true;
localStorage.setItem('feature-flags', JSON.stringify(flags));
// Reload page
```

Or use the `FeatureFlagManager` component (not exposed in routes yet).

## Consent Gating

High-risk features (training, backtesting) require explicit user consent before access:

### Consent Flow
1. User navigates to `/training` or `/backtest`
2. `FeatureGate` checks if feature flag is enabled
3. `ConsentGate` checks if user has consented in last 30 days
4. If no consent: show consent modal with 15-second read requirement
5. If declined: redirect to home page
6. If accepted: store consent in localStorage, show feature

### Risk Levels
- **High**: Training, Backtesting (15s read time)
- **Medium**: Not currently used (10s read time)
- **Low**: Not currently used (5s read time)

### Consent Storage
Consent is stored per-feature in localStorage:
```javascript
{
  "consent_AI Training Dashboard": {
    "timestamp": "2025-10-29T...",
    "version": "1.0",
    "feature": "AI Training Dashboard",
    "riskLevel": "high"
  }
}
```

Consent expires after 30 days and must be renewed.

## Global Header (AppLayout)

The shared header (`src/layout/AppLayout.tsx`) displays:

- **WebSocket Status**: Live connection badge (green/yellow/red)
- **Current Symbol**: Dropdown selector (BTCUSDT, ETHUSDT, etc.)
- **Timeframe & Leverage**: Display current settings
- **PnL Summary**: Real-time profit/loss from Zustand
- **Risk Snapshot**: Liquidation risk and margin usage from Zustand
- **Navigation**: Links to Dashboard, Portfolio, Scanner

All data comes from Zustand (`useAppStore`). If data is unavailable, shows `"-"` placeholders.

## RTL Support

All pages maintain RTL (right-to-left) layout for Persian/Arabic support:

```tsx
<div dir="rtl" className="...">
  {/* Content */}
</div>
```

Bolt components may be LTR internally - full RTL refactoring is a future task.

## Testing Checklist

### Manual Verification

1. **Basic Functionality**
   - [ ] App builds without TypeScript errors: `npm run build`
   - [ ] Dev server runs: `npm run frontend:dev`
   - [ ] No console errors on page load

2. **Existing Routes (Should Not Break)**
   - [ ] `/` - Dashboard renders with WebSocket badge
   - [ ] `/portfolio` - Shows real PnL and positions
   - [ ] `/scanner` - Market scanner works

3. **New Routes (Feature-Gated)**
   - [ ] `/training` - Shows consent gate, then training dashboard
   - [ ] `/backtest` - Shows consent gate, then backtesting module
   - [ ] `/intel` - Shows market intelligence (if `market-sentiment` enabled)
   - [ ] `/settings` - Shows settings panel (if `alerts-system` enabled)

4. **Feature Flags**
   - [ ] Disabling a flag hides corresponding route content
   - [ ] Shows "feature disabled" message instead of crashing

5. **Consent Gates**
   - [ ] Cannot proceed until 15 seconds elapsed
   - [ ] "Decline" redirects to home
   - [ ] "Accept" shows feature and stores consent
   - [ ] Consent persists across page reloads for 30 days

6. **WebSocket & Zustand**
   - [ ] WebSocket connects to `ws://localhost:8000/ws/market`
   - [ ] Live data updates in global header
   - [ ] Switching symbols updates data

## Safety Rules

### Non-Negotiables

1. **Backend**: Do NOT modify FastAPI backend. Only frontend changes.

2. **Zustand**: Do NOT create competing state systems. Zustand is the single source of truth.

3. **Mock Data**: Bolt components must NOT create mock data loops or fake state. They must:
   - Fetch from real APIs (gracefully fail if unavailable), or
   - Read from Zustand, or
   - Show `"-"` placeholders

4. **RTL**: Do NOT break RTL layout. All new pages need `dir="rtl"`.

5. **Feature Flags**: New features must be:
   - Wrapped in `<FeatureGate featureId="...">`
   - High-risk features also wrapped in `<ConsentGate>`

6. **No Unsafe Exposure**: Do NOT expose training/backtesting/AI features without:
   - Feature flag protection
   - Consent gate (for high-risk)
   - Clear disclaimers

## Future Work

### Short Term
- Add navigation links to new routes in AppLayout
- Create a dedicated FeatureFlag management page
- Wire backtesting to real FastAPI endpoints
- Add loading states for API calls

### Medium Term
- Full RTL refactoring of Bolt components
- Replace Bolt's Portfolio with Project-X's PortfolioEntry
- Add user authentication and role-based feature access
- Implement real AI training pipeline via FastAPI

### Long Term
- Migrate from localStorage to database for consent tracking
- Add telemetry for feature usage
- A/B testing framework for rollout percentages
- Multi-language support beyond RTL

## Troubleshooting

### Issue: Feature shows as disabled even when enabled
**Solution**: Check localStorage. Feature flags are cached. Clear `feature-flags` key and reload.

### Issue: Consent modal appears every time
**Solution**: Check localStorage for `consent_<feature>` keys. May be expired or missing.

### Issue: WebSocket shows disconnected
**Solution**: Ensure FastAPI backend is running on port 8000. Check `VITE_WS_URL` env var.

### Issue: Build fails with module not found
**Solution**: Run `npm install --legacy-peer-deps` due to React 19 peer dependency conflicts.

### Issue: Page shows blank after feature gate
**Solution**: Enable the feature flag or check browser console for errors.

## Contributing

When adding new Bolt features:

1. Place new components in `src/bolt_import/components/`
2. Create wrapper page in `src/pages/` that:
   - Imports from `bolt_import`
   - Wraps in `<FeatureGate>`
   - Adds `<ConsentGate>` if high-risk
   - Uses `dir="rtl"`
3. Add route to `App.tsx`
4. Update this documentation
5. Add manual test cases

## References

- Main integration plan: `/PROJECT_X_INTEGRATION_COMPLETE.md` (if exists)
- Bolt README: `src/bolt_import/README_selection.txt`
- Feature flags: `src/bolt_import/contexts/FeatureFlagContext.tsx`
- Legal components: `src/bolt_import/components/Legal/`

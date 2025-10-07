# SMC + AI Controls Frontend Integration

## Overview
این اسناد راهنمای استفاده از کامپوننت‌های جدید SMC و کنترل‌های هوش مصنوعی در فرانت‌اند است.

This document provides guidance on using the new SMC and AI control components in the frontend.

## Files Created

### State Management
1. **`src/state/observable.ts`** - Observable store pattern (lightweight, no dependencies)
2. **`src/state/strategyStore.ts`** - Strategy state management with RTL, SMC flags, scores, gates, risk, and regime data
3. **`src/state/useStrategy.ts`** - React hook for consuming strategy state

### Services
4. **`src/services/aiApi.ts`** - API client for AI endpoints (GA calibration, RL training, config loading)

### Components
5. **`src/components/NewsBanner.tsx`** - Alert banner for regime changes (news, high volatility, wide spread)
6. **`src/components/SMCOverlayToggles.tsx`** - Toggle controls for SMC overlays (FVG, Zones, Liquidity)
7. **`src/components/StrategyHUD.tsx`** - Heads-up display showing scores, gates, and risk metrics

### Pages
8. **`src/pages/AIControls.tsx`** - AI control panel for GA/RL training

### Tests
9. **`src/__tests__/state/strategyStore.test.ts`** - Vitest unit tests for strategy store

## Usage

### Basic Integration

The App.tsx has been updated with a tab-based navigation system:
- **Dashboard** - Original overview page
- **Strategy & SMC** - SMC controls, strategy HUD, and news banner
- **AI Controls** - GA/RL training controls

### Using the Strategy Store

```typescript
import { useStrategy } from './state/useStrategy'
import { setFlags, patchRuntime } from './state/strategyStore'

function MyComponent() {
  const [state, store] = useStrategy()
  
  // Toggle SMC
  setFlags({ smcEnabled: !state.smcEnabled })
  
  // Update scores
  patchRuntime({ 
    scores: { entry: 0.85, conf: 0.72, SMC_ZQS: 0.65, FVG_ATR: 0.44, LIQ: 0.91 }
  })
  
  // Access current state
  console.log(state.rtl) // RTL direction
  console.log(state.gates.smc) // SMC gate status
}
```

### Connecting to Chart Overlays

To connect SMC overlays to your chart (e.g., Lightweight Charts):

```typescript
import { strategy$ } from './state/strategyStore'

// Subscribe to changes
const unsub = strategy$.subscribe(state => {
  chartOverlays.fvg.setVisible(state.showFVG)
  chartOverlays.zones.setVisible(state.showZones)
  chartOverlays.liquidity.setVisible(state.showLiquidity)
})

// Update overlay data when new bar arrives
function onNewBar(bar, smcData) {
  if (strategy$.get().showFVG) {
    chartOverlays.fvg.updateFrom(smcData.fvgs)
  }
  if (strategy$.get().showZones) {
    chartOverlays.zones.updateFrom(smcData.zones)
  }
}

// Cleanup
return () => unsub()
```

### AI API Integration

The AI API client provides methods to interact with backend endpoints:

```typescript
import { getAIConfig, gaCalibrate, rlTrain } from './services/aiApi'

// Load AI configuration
const config = await getAIConfig()
console.log(config.thresholds)

// Run GA calibration with historical bars
const bars = [
  { signals: { RSI: 0.3, MACD: 0.7, SMC_ZQS: 0.8, ... }, ret: 0.01 },
  // ... more bars
]
const result = await gaCalibrate(bars)

// Train RL model with weekly P&L
const weeklyPnL = [0.01, -0.02, 0.03, 0.00, 0.04, -0.01]
const rlResult = await rlTrain(weeklyPnL)
```

## RTL Support

All components respect the `rtl` flag in the strategy store:

```typescript
setFlags({ rtl: true })  // Enable Persian/Arabic RTL layout
setFlags({ rtl: false }) // Disable RTL (LTR)
```

Components automatically apply `dir="rtl"` or `dir="ltr"` based on this flag.

## Backend Endpoints Expected

The frontend expects these backend endpoints:

- `GET /ai/config` - Returns AI configuration including thresholds
- `POST /ai/ga/calibrate` - Accepts bar data, returns GA calibration results
- `POST /ai/rl/train` - Accepts weekly P&L array, returns RL training results

## Testing

Run tests with:

```bash
npm run test
# or
vitest
```

The strategy store tests verify:
- Flag updates
- Runtime data patching
- Subscriber notifications
- Unsubscribe behavior
- State preservation

## Next Steps

1. **Connect to Real Data** - Replace sample data in AIControls with actual backtest/market data
2. **Integrate Chart Overlays** - Hook up FVG/Zone/Liquidity overlays to your charting library
3. **Add More Metrics** - Extend StrategyHUD with additional metrics as needed
4. **Persist Settings** - Save user preferences (RTL, overlay visibility) to localStorage
5. **WebSocket Updates** - Subscribe to real-time updates for scores/gates/regime changes

## Architecture Notes

- **Observable Pattern** - Lightweight pub/sub without external dependencies
- **Type Safety** - Full TypeScript support for state and API responses
- **Minimal Dependencies** - No additional npm packages required
- **RTL First** - Designed with RTL support from the ground up
- **Testable** - All state logic is pure and easily testable

## Support

For questions or issues, refer to:
- `SMC_INTEGRATION_GUIDE.md` - SMC pattern detection guide
- `PROJECT_LOGIC_ANALYSIS.md` - Overall project architecture
- Backend API documentation for endpoint specifications
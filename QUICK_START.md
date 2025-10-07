# 🚀 Quick Start Guide - SMC + AI Controls

## راهنمای سریع - کنترل‌های SMC و هوش مصنوعی

---

## ✅ What's Been Implemented

### 🎛️ 3 Navigation Tabs
1. **Dashboard** - Overview page (existing)
2. **Strategy & SMC** - SMC controls + HUD + News banner
3. **AI Controls** - GA/RL training interface

### 📦 Core Features
- ✅ RTL Support (Persian/Arabic)
- ✅ SMC Overlay Toggles (FVG, Zones, Liquidity)
- ✅ Real-time Strategy HUD (Scores, Gates, Risk)
- ✅ News/Regime Alert Banner
- ✅ AI Training Controls (GA/RL)
- ✅ Live Demo Mode (auto-updates every 3s)

---

## 🏃 Getting Started

### 1. Install Dependencies (already done ✅)
```bash
npm install --legacy-peer-deps
```

### 2. Start Development Server
```bash
npm run dev
# or
npm run frontend:dev
```

Open: `http://localhost:5173`

### 3. Run Tests
```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ui       # UI mode
```

---

## 🔧 Usage Examples

### Toggle SMC Features
```typescript
import { setFlags } from './state/strategyStore'

// Enable/disable overlays
setFlags({ 
  smcEnabled: true,
  showFVG: true,
  showZones: true,
  showLiquidity: false
})

// Enable RTL
setFlags({ rtl: true })
```

### Update Live Data
```typescript
import { patchRuntime } from './state/strategyStore'

// Update scores
patchRuntime({ 
  scores: { 
    entry: 0.85, 
    conf: 0.72, 
    SMC_ZQS: 0.65, 
    FVG_ATR: 0.44, 
    LIQ: 0.91 
  }
})

// Update gates
patchRuntime({
  gates: {
    rsi_macd: true,    // PASS
    smc: true,         // PASS
    sentiment: false,  // BLOCK
    countertrend: true
  }
})

// Update regime
patchRuntime({
  regime: {
    news: true,      // High-impact news
    highVol: true,   // High volatility
    wideSpread: false,
    trend: true
  }
})
```

### Use in React Components
```typescript
import { useStrategy } from './state/useStrategy'

function MyComponent() {
  const [state] = useStrategy()
  
  return (
    <div dir={state.rtl ? 'rtl' : 'ltr'}>
      <p>Entry Score: {state.scores.entry.toFixed(2)}</p>
      <p>SMC Gate: {state.gates.smc ? 'PASS' : 'BLOCK'}</p>
      {state.regime.news && <Alert>High-Impact News!</Alert>}
    </div>
  )
}
```

---

## 📁 File Locations

```
src/
├── state/
│   ├── observable.ts          # Core Observable pattern
│   ├── strategyStore.ts       # Strategy state
│   └── useStrategy.ts         # React hook
├── services/
│   └── aiApi.ts               # AI API client
├── components/
│   ├── NewsBanner.tsx         # News/regime alerts
│   ├── SMCOverlayToggles.tsx  # SMC controls
│   ├── StrategyHUD.tsx        # Strategy display
│   └── SMCDemoPanel.tsx       # Live demo
└── pages/
    └── AIControls.tsx         # AI controls
```

---

## 🧪 Test Status

```
✓ src/__tests__/state/strategyStore.test.ts (6 tests)
  ✓ updates flags safely
  ✓ updates runtime data safely
  ✓ notifies subscribers on update
  ✓ allows multiple subscribers
  ✓ unsubscribes correctly
  ✓ preserves other state when patching

✅ All tests passing
✅ TypeScript clean
```

---

## 🎯 Next Steps

### 1. Connect Backend Data
Replace demo updates with real data:

```typescript
// In your data fetching service
import { patchRuntime } from './state/strategyStore'

async function fetchStrategyUpdate() {
  const data = await api.get('/strategy/live')
  patchRuntime({
    scores: data.scores,
    gates: data.gates,
    risk: data.risk,
    regime: data.regime
  })
}
```

### 2. Integrate with Chart
Connect overlay toggles to your chart:

```typescript
import { strategy$ } from './state/strategyStore'

strategy$.subscribe(state => {
  chart.fvgLayer.setVisible(state.showFVG)
  chart.zonesLayer.setVisible(state.showZones)
  chart.liquidityLayer.setVisible(state.showLiquidity)
})
```

### 3. WebSocket Updates
For real-time updates:

```typescript
websocket.on('strategy_update', data => {
  patchRuntime(data)
})
```

---

## 🌐 Backend API Required

### GET `/ai/config`
Returns AI configuration

### POST `/ai/ga/calibrate`
```json
{
  "bars": [
    { "signals": {...}, "ret": 0.01 }
  ]
}
```

### POST `/ai/rl/train`
```json
{
  "weekly_pnl": [0.01, -0.02, 0.03]
}
```

---

## 📚 Documentation

- **Integration Guide**: `src/docs/SMC_AI_FRONTEND_INTEGRATION.md`
- **Implementation Details**: `SMC_AI_FRONTEND_IMPLEMENTATION.md`
- **Complete Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Test Examples**: `src/__tests__/state/strategyStore.test.ts`

---

## ✅ Checklist

- [x] Observable store created
- [x] Strategy state management
- [x] React hook for state
- [x] AI API client
- [x] News banner component
- [x] SMC overlay toggles
- [x] Strategy HUD
- [x] AI controls page
- [x] Demo panel
- [x] Tab navigation
- [x] RTL support
- [x] All tests passing
- [x] TypeScript clean
- [x] Documentation complete

---

## 🆘 Troubleshooting

### Tests not running?
```bash
npm install --save-dev vitest @vitest/ui jsdom --legacy-peer-deps
```

### TypeScript errors?
```bash
npx tsc --noEmit
```

### Build fails?
```bash
npm run build
```

---

**🎉 Ready to Use!**

All features are implemented and tested. Start the dev server and navigate to the "Strategy & SMC" or "AI Controls" tabs to see the new UI in action!

**تمام! بفرمایید استفاده کنید! 🚀**
# Implementation Checklist - Complete Project-X Locally

## ✅ Core Infrastructure (DONE)

- [x] **useAppStore.ts** - Central state management with Zustand
- [x] **api.ts** - Centralized API client
- [x] **LiveDataContext.tsx** - WebSocket connection manager
- [x] **useOverviewSync.ts** - Dashboard polling hook
- [x] **usePortfolioSync.ts** - Portfolio polling hook
- [x] **LOCAL_DEVELOPMENT_GUIDE.md** - Setup instructions

## 🔨 Required Components (TO BUILD)

### 1. App Integration (High Priority)
- [ ] Update **src/App.tsx** to wrap with LiveDataProvider
- [ ] Update **src/main.tsx** to ensure providers are loaded
- [ ] Create **src/pages/OverviewEntry.tsx** (dashboard page)
- [ ] Create **src/pages/PortfolioEntry.tsx** (portfolio page)
- [ ] Create **src/pages/ScannerEntry.tsx** (scanner page)

### 2. Trading Controls (High Priority)
- [ ] Create **src/components/Trading/GlobalTradeControls.tsx**
  - Symbol selector
  - Timeframe selector  
  - Leverage control
  - Auto-sync with scanner filters
  - Quick scan button

### 3. Dashboard Components (Medium Priority)
- [ ] Update/create **src/components/Dashboard/ProfessionalTradingDashboardEntry.tsx**
  - WebSocket connection status indicator
  - Last signal display
  - PnL summary
  - Exposure summary
  - Order book top-of-book widget
- [ ] Update/create **src/components/Trading/RealTimeChart.tsx**
  - Fetch candles from API
  - Draw SVG chart
  - Show live price line
  - Display bid/ask from WebSocket

### 4. Portfolio Components (Medium Priority)
- [ ] Create/update **src/components/Portfolio/PnLDashboard.tsx**
  - Realized/unrealized PnL
  - Profitability metrics
  - Daily performance
- [ ] Create/update **src/components/Portfolio/PortfolioPanel.tsx**
  - Current positions
  - Exposure breakdown
  - Account leverage
- [ ] Create/update **src/components/Portfolio/TradingHistory.tsx**
  - Historical trades
  - Fill details
- [ ] Create/update **src/components/Portfolio/PositionManager.tsx**
  - Active positions management
  - Close/adjust UI

### 5. Scanner Components (Medium Priority)
- [ ] Create/update **src/components/Scanner/ScanButtons.tsx**
  - "Run Scan" button
  - Call scanSignals() from API
  - Update store with results
  - Toast feedback
- [ ] Create/update **src/components/Scanner/ResultsTable.tsx**
  - Display scanResults from store
  - Add/remove symbols to watchlist
  - Show symbol, timeframe, score, signal
- [ ] Create/update **src/components/Watchlist/WatchlistPanel.tsx**
  - Display watchlist from store
  - Remove symbol button
  - Clear all button
- [ ] Create/update **src/components/Scanner/ScannerHeatmap.tsx**
  - Visual representation of scan results
  - Signal intensity heatmap

### 6. Backend Endpoints Verification (High Priority)
Verify these endpoints exist and return correct data:
- [ ] `GET /api/portfolio/status`
- [ ] `GET /api/portfolio/pnl`
- [ ] `GET /api/risk/live`
- [ ] `GET /api/signals`
- [ ] `GET /api/signals/last`
- [ ] `POST /api/signals/scan`
- [ ] `GET /market/candles?symbol={symbol}&timeframe={timeframe}&limit={limit}`
- [ ] `WS /ws/market` (ticker, orderBook, signal messages)

### 7. Mock Data (Low Priority - for testing)
If backend endpoints aren't ready:
- [ ] Create mock data generators in `src/utils/mockData.ts`
- [ ] Mock portfolio status
- [ ] Mock PnL summary
- [ ] Mock risk snapshot
- [ ] Mock signals
- [ ] Mock candles
- [ ] Mock WebSocket messages

## 🎨 UI/UX Polish (Low Priority)
- [ ] Toast notifications system (react-hot-toast or similar)
- [ ] Loading spinners during API calls
- [ ] Error boundaries for crash recovery
- [ ] Skeleton loaders for empty states
- [ ] Responsive design for mobile
- [ ] Dark mode theme consistency

## 🧪 Testing Workflow

### Step 1: Backend Health
```bash
# Start backend
cd backend
uvicorn main:app --reload --port 8000

# Test REST endpoints
curl http://localhost:8000/api/signals
curl http://localhost:8000/api/portfolio/status

# Test WebSocket
# Use browser console:
const ws = new WebSocket('ws://localhost:8000/ws/market');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Step 2: Frontend State Flow
```bash
# Start frontend
npm run dev

# Open http://localhost:5173
# Open browser DevTools → Console
# Check for:
# - "WebSocket connected successfully"
# - "Overview sync completed"
# - No CORS errors
```

### Step 3: Verify Data Flow
1. **WebSocket**: Check if ticker/orderBook are updating in store
2. **Polling**: Check if portfolio/PnL are syncing every few seconds
3. **Scanner**: Try running a scan and check if results appear
4. **Trading Controls**: Change symbol/timeframe and verify scanner filters sync

### Step 4: End-to-End User Flow
1. Login (if auth enabled)
2. See dashboard with live data
3. Navigate to Portfolio → see PnL
4. Navigate to Scanner → run scan → add to watchlist
5. Change symbol in GlobalTradeControls → verify all views update

## 🚨 Critical Architecture Rules

**DO NOT VIOLATE THESE:**

1. ❌ **Never bypass useAppStore** - All data must flow through the store
2. ❌ **Never fetch in leaf components** - Use services/api.ts only
3. ❌ **Never break the data flow** - Backend → Store → Components
4. ❌ **Never introduce external state management** - Stick to Zustand
5. ❌ **Never remove LiveDataContext** - It's the WebSocket backbone
6. ❌ **Never remove polling hooks** - They keep data fresh

**CORRECT PATTERN:**
```
Backend REST/WS → api.ts → useAppStore → Component reads store
```

**WRONG PATTERN:**
```
Component → fetch() → local useState → render ❌
```

## 📋 File Manifest (What You Have Now)

```
✅ src/stores/useAppStore.ts          # Central state (313 lines)
✅ src/services/api.ts                 # API client (170 lines)
✅ src/context/LiveDataContext.tsx     # WebSocket (259 lines)
✅ src/hooks/useOverviewSync.ts        # Dashboard sync (90 lines)
✅ src/hooks/usePortfolioSync.ts       # Portfolio sync (83 lines)
✅ LOCAL_DEVELOPMENT_GUIDE.md          # Setup guide (328 lines)
```

## 🎯 Next Immediate Actions

### Priority 1: Make it Run
1. Update **App.tsx** to wrap everything in LiveDataProvider
2. Create basic **OverviewEntry** page that uses useOverviewSync
3. Test if WebSocket connects
4. Test if polling updates the store

### Priority 2: Build Core UI
1. Create **GlobalTradeControls** component
2. Create basic dashboard widgets (signal, PnL, connection status)
3. Create **ScanButtons** and **ResultsTable**
4. Create **WatchlistPanel**

### Priority 3: Complete Features
1. Build **RealTimeChart** component
2. Build **PortfolioEntry** page
3. Build remaining scanner components
4. Add polish (toasts, loading states, errors)

## 💡 Quick Implementation Tips

**App.tsx Example:**
```tsx
import { LiveDataProvider } from './context/LiveDataContext';

function App() {
  return (
    <LiveDataProvider autoConnect={true}>
      {/* Your routes here */}
    </LiveDataProvider>
  );
}
```

**Component Example:**
```tsx
import { useAppStore } from '../stores/useAppStore';

function MyComponent() {
  const { symbol, timeframe, lastSignal } = useAppStore();
  
  return (
    <div>
      <h2>{symbol} - {timeframe}</h2>
      <p>Last Signal: {lastSignal?.signal}</p>
    </div>
  );
}
```

**Scanner Button Example:**
```tsx
import { useAppStore } from '../stores/useAppStore';
import { scanSignals } from '../services/api';

function ScanButton() {
  const { scannerFilters, setScanResults, setIsScanning } = useAppStore();
  
  const handleScan = async () => {
    setIsScanning(true);
    try {
      const results = await scanSignals(scannerFilters);
      setScanResults(results);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };
  
  return <button onClick={handleScan}>Run Scan</button>;
}
```

## 🚀 Estimated Timeline

- **Phase 1 (Day 1)**: Core integration + basic pages (6-8 hours)
- **Phase 2 (Day 2)**: Dashboard components + scanner (6-8 hours)
- **Phase 3 (Day 3)**: Portfolio page + chart (6-8 hours)
- **Phase 4 (Day 4)**: Polish + testing + bug fixes (4-6 hours)

**Total**: 3-4 days of focused development

## ✨ Success Criteria

You'll know it's complete when:
- ✅ Backend starts without errors
- ✅ Frontend connects to WebSocket successfully
- ✅ Dashboard shows live ticker data
- ✅ Portfolio page shows current PnL
- ✅ Scanner returns results and builds watchlist
- ✅ Changing symbol/timeframe updates everything
- ✅ No console errors
- ✅ All three main pages work end-to-end

---

**Remember**: Keep the architecture intact. Don't refactor the state management. Just build the missing UI components and wire them to the existing store/API layer.

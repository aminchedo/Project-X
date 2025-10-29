# LiveDataProvider WebSocket Behavior Documentation

**Purpose:** Document actual WebSocket lifecycle behavior vs assumptions.

**Generated:** 2025-10-29  
**Branch:** cursor/self-assess-project-x-architecture-and-state-55a5

---

## WebSocket Configuration

**WebSocket URL:** `WS_URL` from `../config/runtime` [Implemented in code]
**Connection Target:** `/ws/market` endpoint [Implemented in code]

---

## Provider Mounting & Lifecycle

### Mount Timing
LiveDataProvider is mounted at the app root level in `App.tsx` structure:
```
<BrowserRouter>
  <FeatureFlagProviderWrapper>
    <LiveDataProvider>  ← Mounted here, above routing
      <Routes>
        <Route element={<AppLayout />}>
          {/* All routes nested here */}
        </Route>
      </Routes>
    </LiveDataProvider>
  </FeatureFlagProviderWrapper>
</BrowserRouter>
```
[Implemented in code]

**Navigation Impact:** Since LiveDataProvider sits ABOVE `<Routes>`, navigation between routes should NOT cause the provider to remount [Implemented in code]. Whether this actually prevents WebSocket reconnection at runtime is [Assumed/Not verified].

### Auto-Connect Behavior
- **Default:** `autoConnect = true` [Implemented in code]
- **Connection initiation:** Calls `connect()` in useEffect on mount [Implemented in code]
- **Cleanup:** Calls `disconnect()` on unmount [Implemented in code]

---

## WebSocket Event Handling

### onopen Event
```javascript
ws.onopen = () => {
  setIsConnected(true);
  setConnectionStatus('connected');
  setLastError(null);
  reconnectAttemptsRef.current = 0;
  showToast('Connected to live market data', 'success');
};
```
[Implemented in code]

### onmessage Event
Parses JSON messages and routes by `message.type`:
- **'ticker':** Updates `useAppStore.setTicker()` with bid/ask/last prices [Implemented in code]
- **'orderbook':** Updates `useAppStore.setOrderBook()` with converted number arrays [Implemented in code]  
- **'signal':** Updates `useAppStore.setLastSignal()` with trading signal [Implemented in code]
- **'error':** Updates `useAppStore.setLastError()` and shows toast [Implemented in code]
[Implemented in code]

### onclose Event
```javascript
ws.onclose = (event) => {
  setIsConnected(false);
  setConnectionStatus('disconnected');
  wsRef.current = null;
  
  // Auto-reconnect with exponential backoff
  if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
    const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current);
    // ... reconnect logic
  }
};
```
[Implemented in code]

### onerror Event
```javascript
ws.onerror = (error) => {
  setConnectionStatus('error');
  setLastError('WebSocket connection error');
};
```
[Implemented in code]

---

## Reconnection Logic

### Exponential Backoff Implementation
**YES - Actual exponential backoff is implemented in code:**

```javascript
const RECONNECT_DELAY = 3000; // 3 seconds base delay
const MAX_RECONNECT_ATTEMPTS = 10;

// In onclose handler:
const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current);
```
[Implemented in code]

**Backoff sequence:** 3s, 4.5s, 6.75s, 10.125s, 15.1875s, etc.
**Max attempts:** 10 attempts before giving up [Implemented in code]

### Reconnection State Management
- Sets `connectionStatus` to 'reconnecting' during attempts [Implemented in code]
- Shows toast notifications for each attempt [Implemented in code]
- Resets attempt counter to 0 on successful connection [Implemented in code]
- Sets status to 'error' if max attempts exceeded [Implemented in code]

---

## Zustand Store Integration

### Store Setters Used
LiveDataProvider directly calls these useAppStore actions:
- `setConnectionStatus(ConnectionStatus)` - WebSocket state changes
- `setTicker(Ticker | null)` - Live price updates  
- `setOrderBook(OrderBook | null)` - Order book updates
- `setLastSignal(TradingSignal | null)` - Trading signal updates
- `setLastError(string | null)` - Error state updates
[Implemented in code]

### Data Flow Direction
**WebSocket → LiveDataProvider → useAppStore → UI Components**
[Implemented in code]

No components write directly to WebSocket-managed state - it's unidirectional [Implemented in code].

---

## Runtime Behavior Assumptions

### Connection Persistence During Navigation
**Assumption:** WebSocket connection should remain open when navigating between routes because LiveDataProvider is mounted above routing level [Assumed/Not verified].

**What could go wrong:** 
- React could still remount providers due to routing edge cases
- Browser WebSocket behavior might differ from code expectations  
- Provider context recreation could trigger disconnect/reconnect cycle

### No Connection Flicker
**Assumption:** WSBadge in header should show stable connection status without flickering during navigation [Assumed/Not verified].

**What could go wrong:**
- Connection status updates could cause visual flicker
- Component re-renders during navigation could show intermediate states
- WebSocket onclose/onopen events could fire during route transitions

### Toast Notification Behavior
**Implementation:** Uses console.log fallback with comment about integrating real toast system [Implemented in code].

**Current behavior:** All WebSocket status changes only log to console [Implemented in code].

---

## Configuration Constants

```javascript
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000; // 3 seconds
```
[Implemented in code]

**Timeout management:** Uses `reconnectTimeoutRef` to track and cancel pending reconnection attempts [Implemented in code].

---

## Summary

**Confirmed in Code:**
- ✅ LiveDataProvider sits above routing level
- ✅ Actual exponential backoff is implemented (not just assumed)
- ✅ WebSocket events update Zustand store directly
- ✅ Auto-reconnect with attempt limits and proper cleanup

**Runtime Verification Needed:**
- ⏳ Whether navigation actually preserves WebSocket connection
- ⏳ Whether connection status remains stable during route changes  
- ⏳ Whether WebSocket reconnection behavior works as expected in browser
- ⏳ Whether provider context stays intact across navigation
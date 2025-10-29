# LIVEDATAPROVIDER_BEHAVIOR.md

## Overview

This document describes the WebSocket behavior implemented in LiveDataProvider, including connection lifecycle, message handling, and reconnection logic. All statements are verified from code at `src/context/LiveDataContext.tsx`.

---

## WebSocket Configuration

**WebSocket URL**: `WS_URL` from `src/config/runtime.ts` [Observed in code]

From `src/config/runtime.ts`:
```typescript
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/market';
```

Default URL: `ws://localhost:8000/ws/market` [Observed in code]

---

## LiveDataProvider Mounting

LiveDataProvider is mounted in `src/App.tsx` with the following structure [Observed in code]:

```jsx
<BrowserRouter>
  <FeatureFlagProviderWrapper>
    <LiveDataProvider>
      <Routes>
        <Route element={<AppLayout />}>
          {/* All 7 routes */}
        </Route>
      </Routes>
    </LiveDataProvider>
  </FeatureFlagProviderWrapper>
</BrowserRouter>
```

**Position in tree**: LiveDataProvider wraps `<Routes>` [Observed in code]

**Implication**: Navigation between routes should NOT trigger LiveDataProvider remount [Observed in code]

---

## WebSocket Event Handlers

### onopen

Code from `src/context/LiveDataContext.tsx` line 154-161 [Observed in code]:

```javascript
ws.onopen = () => {
  console.log('WebSocket connected successfully');
  setIsConnected(true);
  setConnectionStatus('connected');
  setLastError(null);
  reconnectAttemptsRef.current = 0;
  showToast('Connected to live market data', 'success');
};
```

**Actions**:
- Sets local state `isConnected` to `true`
- Calls `useAppStore.setConnectionStatus('connected')`
- Calls `useAppStore.setLastError(null)`
- Resets reconnect attempts counter to `0`
- Shows toast notification (currently console.log only)

---

### onmessage

Code from `src/context/LiveDataContext.tsx` line 82-136 [Observed in code]:

Parses JSON from `event.data` and dispatches based on `message.type`:

#### type: 'ticker'
- Updates `useAppStore.setTicker({ bid, ask, last })`
- Expects message fields: `bid`, `ask`, `last` (all numbers)

#### type: 'orderbook'
- Updates `useAppStore.setOrderBook({ bids: [...], asks: [...] })`
- Converts string arrays from backend to number arrays:
  ```javascript
  const orderBook: OrderBook = {
    bids: message.bids.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
    asks: message.asks.map(([p, s]) => [parseFloat(p), parseFloat(s)]),
  };
  ```

#### type: 'signal'
- Updates `useAppStore.setLastSignal({ symbol, timeframe, direction, confidence })`
- Expects message fields: `symbol`, `timeframe`, `direction` ('LONG' | 'SHORT'), `confidence` (number)

#### type: 'error'
- Calls `useAppStore.setLastError(message.message || 'WebSocket error')`
- Shows error toast

#### Unknown type
- Logs warning: `'Unknown WebSocket message type:'`

#### Parse errors
- Catches JSON parse errors
- Calls `useAppStore.setLastError('Failed to parse WebSocket frame')`
- Shows error toast

---

### onerror

Code from `src/context/LiveDataContext.tsx` line 165-169 [Observed in code]:

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  setConnectionStatus('error');
  setLastError('WebSocket connection error');
};
```

**Actions**:
- Logs error to console
- Calls `useAppStore.setConnectionStatus('error')`
- Calls `useAppStore.setLastError('WebSocket connection error')`

---

### onclose

Code from `src/context/LiveDataContext.tsx` line 171-195 [Observed in code]:

```javascript
ws.onclose = (event) => {
  console.log('WebSocket closed:', event.code, event.reason);
  setIsConnected(false);
  setConnectionStatus('disconnected');
  wsRef.current = null;

  // Auto-reconnect with exponential backoff
  if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
    const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current);
    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);

    setConnectionStatus('reconnecting');
    showToast(`Reconnecting... (attempt ${reconnectAttemptsRef.current + 1})`, 'warning');

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  } else {
    console.error('Max reconnect attempts reached');
    setConnectionStatus('error');
    setLastError('Failed to reconnect after multiple attempts');
    showToast('Failed to connect to market data. Check backend server.', 'error');
  }
};
```

**Actions**:
- Sets local state `isConnected` to `false`
- Calls `useAppStore.setConnectionStatus('disconnected')`
- Clears WebSocket ref
- Checks reconnect attempts counter
- If under max attempts:
  - Calculates exponential backoff delay
  - Calls `useAppStore.setConnectionStatus('reconnecting')`
  - Shows toast with attempt number
  - Schedules reconnect after delay
  - Increments attempt counter
- If max attempts reached:
  - Calls `useAppStore.setConnectionStatus('error')`
  - Calls `useAppStore.setLastError('Failed to reconnect after multiple attempts')`
  - Shows error toast

---

## Reconnection Logic

### Exponential Backoff Implementation

**Constants** from `src/context/LiveDataContext.tsx` line 69-70 [Observed in code]:
```javascript
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000; // 3 seconds
```

**Formula** from line 179 [Observed in code]:
```javascript
const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current);
```

**Backoff sequence**:
- Attempt 0: 3000ms (3s)
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

**Answer to prompt question**: YES, exponential backoff logic EXISTS in code. This is NOT an assumption. The formula `RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current)` is implemented at `src/context/LiveDataContext.tsx:179` [Observed in code].

---

## Zustand Integration

LiveDataProvider calls the following `useAppStore` setters [Observed in code]:

1. `setConnectionStatus(ConnectionStatus)` - WebSocket lifecycle events (open, close, error, reconnecting)
2. `setTicker(Ticker | null)` - 'ticker' messages
3. `setOrderBook(OrderBook | null)` - 'orderbook' messages
4. `setLastSignal(TradingSignal | null)` - 'signal' messages
5. `setLastError(string | null)` - Error events and parse failures

**Data flow**: WebSocket → LiveDataProvider → `useAppStore` → UI components [Observed in code]

---

## Runtime Unknowns

The following behaviors are NOT yet runtime-confirmed. They require human QA in a browser:

1. **It is NOT yet runtime-confirmed whether the WebSocket reconnects when navigating between pages.**
   - Code structure suggests it should NOT reconnect (provider is above Routes), but browser behavior may differ.

2. **It is NOT yet runtime-confirmed whether WSBadge flickers or shows "reconnecting" on route changes.**
   - Code does NOT indicate this should happen, but re-renders or context updates could cause visual flicker.

3. **It is NOT yet runtime-confirmed whether AppLayout prevents LiveDataProvider from remounting.**
   - React Router documentation suggests nested Routes should NOT remount parent providers, but this must be verified in runtime.

4. **It is NOT yet runtime-confirmed whether the exponential backoff delay sequence works correctly in a real browser WebSocket disconnect scenario.**
   - The code implements the logic, but actual browser behavior (network errors, server restarts, etc.) must be tested.

5. **It is NOT yet runtime-confirmed whether toast notifications appear (they currently only console.log).**
   - Code at line 258-263 shows `showToast` is a placeholder that only calls `console.log`.

---

## Toast Notification Status

Code from `src/context/LiveDataContext.tsx` line 258-264 [Observed in code]:

```javascript
const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  console.log(`[${type.toUpperCase()}] ${message}`);

  // If you have a toast system, use it here:
  // import { toast } from 'react-hot-toast';
  // toast[type](message);
};
```

**Current behavior**: All WebSocket status changes are logged to console only. No visual toast UI exists [Observed in code].

---

## Cleanup Behavior

Code from `src/context/LiveDataContext.tsx` line 229-238 [Observed in code]:

```javascript
useEffect(() => {
  if (autoConnect) {
    connect();
  }

  // Cleanup on unmount
  return () => {
    disconnect();
  };
}, [autoConnect]);
```

**On unmount**:
- Calls `disconnect()` which:
  - Clears reconnect timeout if pending
  - Closes WebSocket if open
  - Sets `isConnected` to `false`
  - Calls `useAppStore.setConnectionStatus('disconnected')`

[Observed in code]

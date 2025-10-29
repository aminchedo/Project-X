# Local Development Setup Guide for Project-X

## Quick Start (5 Minutes to Running)

### Prerequisites
```bash
# Required software
- Python 3.10+ 
- Node.js 18+
- Git
```

### Step 1: Backend Setup

```bash
# Navigate to project
cd C:\project\Project-X-main

# Create Python virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables
copy .env.example .env

# Edit .env with your settings (use Notepad or VS Code)
# Minimal required:
DATABASE_URL=sqlite:///./hts_trading.db
JWT_SECRET=your-secret-key-change-this
KUCOIN_API_KEY=your-kucoin-key (or leave empty for demo mode)
```

### Step 2: Initialize Database

```bash
# Still in backend folder
python -c "from database.connection import init_db; init_db()"
```

### Step 3: Start Backend Server

```bash
# From backend folder
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

### Step 4: Frontend Setup (New Terminal)

```bash
# Open NEW terminal window
cd C:\project\Project-X-main

# Install frontend dependencies
npm install

# Start development server
npm run dev

# You should see:
# VITE v5.x.x  ready in XXX ms
# ➜  Local:   http://localhost:5173/
```

### Step 5: Access the App

Open browser to: **http://localhost:5173**

Default login (if auth enabled):
- Username: `admin`
- Password: `admin` (change in production!)

---

## Architecture Verification Checklist

After starting both servers, verify these endpoints:

### Backend Health Check
```bash
# Test REST API
curl http://localhost:8000/api/signals

# Test WebSocket (using browser console)
const ws = new WebSocket('ws://localhost:8000/ws/market');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Frontend State Flow
1. Open browser DevTools → Console
2. You should see WebSocket connection logs
3. Check if polling hooks are running (look for periodic API calls in Network tab)

---

## Common Issues & Fixes

### Issue 1: Backend won't start
**Error**: `ModuleNotFoundError: No module named 'xxx'`
**Fix**: 
```bash
pip install -r requirements.txt
# If still failing, try:
pip install --upgrade -r requirements.txt
```

### Issue 2: Database errors
**Error**: `sqlite3.OperationalError: no such table`
**Fix**:
```bash
python -c "from database.connection import init_db; init_db()"
```

### Issue 3: CORS errors in browser
**Error**: `Access-Control-Allow-Origin`
**Fix**: Check `backend/main.py` CORS settings include your frontend port (5173, 5174, etc.)

### Issue 4: WebSocket won't connect
**Error**: `WebSocket connection failed`
**Fix**:
```bash
# 1. Ensure backend is running on port 8000
# 2. Check frontend WebSocket URL in LiveDataContext
# 3. Verify no firewall blocking port 8000
```

### Issue 5: Frontend shows blank page
**Error**: Blank screen, no console errors
**Fix**:
```bash
# Clear cache and rebuild
rm -rf node_modules
rm package-lock.json
npm install
npm run dev
```

---

## Project Structure Overview

```
Project-X-main/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main application entry
│   ├── requirements.txt       # Python dependencies
│   ├── models.py              # Data models
│   ├── database/              # Database layer
│   ├── analytics/             # Trading analytics
│   ├── api/                   # API routes
│   ├── risk/                  # Risk management
│   └── data/                  # Data providers
│
├── src/                       # React frontend
│   ├── main.tsx              # Frontend entry
│   ├── App.tsx               # Root component
│   ├── state/                # State management
│   ├── pages/                # Main pages
│   ├── components/           # UI components
│   ├── services/             # API clients
│   └── hooks/                # Custom hooks
│
├── package.json              # Node dependencies
├── vite.config.ts            # Vite bundler config
└── tsconfig.json             # TypeScript config
```

---

## Development Workflow

### Making Changes

**Backend Changes**:
1. Edit Python files in `backend/`
2. Server auto-reloads (if using `--reload`)
3. Test endpoint: `curl http://localhost:8000/api/...`

**Frontend Changes**:
1. Edit React files in `src/`
2. Vite hot-reloads automatically
3. See changes instantly in browser

### Adding New Features

**New REST Endpoint**:
```python
# backend/main.py or backend/api/routes.py
@app.get("/api/my-new-endpoint")
async def my_new_endpoint():
    return {"data": "value"}
```

**New Frontend API Call**:
```typescript
// src/services/api.ts
export const getMyNewData = async () => {
  const response = await axiosInstance.get('/api/my-new-endpoint');
  return response.data;
};
```

**New State in Store**:
```typescript
// src/stores/useAppStore.ts (to be created)
export const useAppStore = create<AppState>((set) => ({
  myNewData: null,
  setMyNewData: (data) => set({ myNewData: data }),
}));
```

---

## Testing the Live Data Flow

### Test 1: WebSocket Streaming
```javascript
// Browser console
const ws = new WebSocket('ws://localhost:8000/ws/market');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Live data:', data);
};
```

### Test 2: REST Polling
```javascript
// Browser console - run this to test portfolio sync
fetch('http://localhost:8000/api/portfolio/status')
  .then(r => r.json())
  .then(d => console.log('Portfolio:', d));
```

### Test 3: Scanner
```javascript
// Browser console - test signal scanning
fetch('http://localhost:8000/api/signals/scan', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    symbols: ['BTCUSDT'],
    timeframes: ['15m', '1h'],
    minScore: 0.6
  })
})
.then(r => r.json())
.then(d => console.log('Scan results:', d));
```

---

## Next Steps for Full Implementation

Based on the spec document, you need to create:

1. **src/stores/useAppStore.ts** - Comprehensive state management (Zustand)
2. **src/context/LiveDataContext.tsx** - WebSocket manager
3. **src/hooks/useOverviewSync.ts** - Dashboard polling
4. **src/hooks/usePortfolioSync.ts** - Portfolio polling
5. **src/services/api.ts** - Centralized API client
6. **src/components/Trading/GlobalTradeControls.tsx** - Trading context controls

Would you like me to generate these core files according to the specification?

---

## Debugging Tips

### View Backend Logs
```bash
# Backend terminal shows all logs
# Look for:
# - Startup messages
# - WebSocket connections
# - API call logs
# - Error traces
```

### View Frontend Logs
```javascript
// Browser DevTools → Console
// Look for:
# - WebSocket connection status
# - API call responses
# - State updates
# - Component render logs
```

### Database Inspection
```bash
# View SQLite database
sqlite3 backend/hts_trading.db
.tables          # List all tables
SELECT * FROM trading_sessions LIMIT 10;
```

---

## Performance Tips for Local Development

1. **Keep browser DevTools open** - Monitor Network and Console tabs
2. **Use React DevTools** - Install extension to inspect component state
3. **Enable source maps** - Already configured in vite.config.ts
4. **Hot Module Replacement** - Changes appear without full reload

---

## Ready to Build?

You now have:
- ✅ Backend running on http://localhost:8000
- ✅ Frontend running on http://localhost:5173
- ✅ WebSocket endpoint: ws://localhost:8000/ws/market
- ✅ REST API accessible
- ✅ Database initialized

**Next**: Implement the core state management according to spec!

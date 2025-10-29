# 🚀 LOCAL SETUP GUIDE - Project-X Trading Console

## Overview

Project-X is a **fully functional local trading console** that runs on your machine without any cloud dependencies. This guide will help you get it running in minutes.

## System Requirements

- **Operating System:** Windows, macOS, or Linux
- **Node.js:** v16 or higher
- **Python:** 3.8+ (for backend)
- **RAM:** Minimum 4GB
- **Disk Space:** ~500MB

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

#### Frontend
```bash
cd C:\project\Project-X-main
npm install
```

#### Backend
```bash
cd C:\project\Project-X-main\backend
pip install -r requirements.txt
```

### Step 2: Configure Environment

Create `.env.local` in the project root:
```bash
# Frontend Configuration
VITE_API_BASE=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/market
```

No backend .env is needed - it runs with sensible defaults!

### Step 3: Start the Backend

```bash
cd backend
python main.py
```

You should see:
```
Starting HTS Trading System Backend on port 8000...
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Start the Frontend

In a new terminal:
```bash
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Step 5: Open the App

Visit **http://localhost:5173** in your browser!

## 🎯 What You'll See

### Dashboard Features
- **Live Portfolio Summary:** Positions, exposure, PnL
- **Real-time Market Data:** Ticker prices, order book depth
- **Trading Signals:** AI-generated LONG/SHORT signals with confidence scores
- **Risk Monitor:** Liquidation risk, margin usage
- **Market Scanner:** Multi-symbol, multi-timeframe signal scanning

### Demo Data
The application uses **realistic mock data** for demonstration. All numbers and signals change dynamically to simulate a real trading environment.

## Architecture

```
Project-X/
├── src/                    # Frontend (React + TypeScript)
│   ├── stores/            # Zustand global store (SINGLE SOURCE OF TRUTH)
│   ├── hooks/             # Polling hooks (sync backend → store)
│   ├── services/          # API client (REST calls)
│   ├── components/        # UI components
│   └── config/            # Runtime config (API_BASE, WS_URL)
│
└── backend/               # Backend (FastAPI + Python)
    ├── main.py           # Main server with all endpoints
    ├── api/              # API routes
    │   └── portfolio_routes.py  # Portfolio/PnL/Risk/Signals
    └── requirements.txt  # Python dependencies
```

## Data Flow

```
Backend (Python)
    ↓
REST API + WebSocket
    ↓
Frontend Hooks (polling every 3-5s)
    ↓
Zustand Store (global state)
    ↓
React Components (display)
```

**Key Principle:** Components NEVER fetch data directly. They only read from the store.

## API Endpoints

### Portfolio & Risk
- `GET /api/portfolio/status` - Current positions and exposure
- `GET /api/portfolio/pnl` - Realized/unrealized PnL
- `GET /api/risk/live` - Liquidation risk & margin usage

### Signals & Scanning
- `GET /api/signals` - Latest trading signal
- `POST /api/signals/scan` - Run multi-symbol scanner

### Market Data
- `GET /market/candles` - OHLCV candles for charting

### WebSocket
- `WS /ws/market` - Real-time ticker, orderbook, signal updates

### Health
- `GET /health` - Backend health check

## Troubleshooting

### Backend won't start
**Error:** `Address already in use`
**Solution:** Another process is using port 8000. Kill it or change the port:
```bash
# Find process on port 8000
netstat -ano | findstr :8000

# Kill it (Windows)
taskkill /PID <PID> /F

# Or change port
python main.py --port 8001
```

### Frontend won't connect
**Error:** `Failed to fetch` or `Network error`
**Solution:** 
1. Verify backend is running: `http://localhost:8000/health`
2. Check `.env.local` has correct `VITE_API_BASE`
3. Restart frontend: `npm run dev`

### WebSocket disconnects
**Error:** `WebSocket connection failed`
**Solution:**
1. Check CORS is allowing `localhost:5173`
2. Verify `VITE_WS_URL` in `.env.local`
3. Check browser console for specific error

### Missing dependencies
**Error:** `ModuleNotFoundError` or `Cannot find module`
**Solution:**
```bash
# Backend
cd backend
pip install -r requirements.txt --force-reinstall

# Frontend
npm install --force
```

## Customization

### Change Polling Intervals
Edit `src/hooks/usePortfolioSync.ts`:
```typescript
const POLL_INTERVAL = 3000; // Change to your preference (ms)
```

### Change Mock Data
Edit `backend/api/portfolio_routes.py` to customize demo values.

### Add Real Data Sources
Replace mock data functions with actual API calls:
- Binance API
- KuCoin API  
- Your trading backend

## Production Deployment

### VPS Setup
1. Copy `.env.local` to VPS
2. Update `VITE_API_BASE` to your VPS IP: `http://your-vps-ip:8000`
3. Update `VITE_WS_URL` to `ws://your-vps-ip:8000/ws/market`
4. Build frontend: `npm run build`
5. Serve with nginx or directly from FastAPI

### Environment Variables
```bash
# .env.local (Frontend)
VITE_API_BASE=http://your-domain.com
VITE_WS_URL=ws://your-domain.com/ws/market
```

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- Frontend: Vite auto-reloads on file changes
- Backend: FastAPI reloads when files change (if `reload=True`)

### Debugging
**Frontend:**
```bash
npm run dev
# Open browser DevTools → Console
```

**Backend:**
```python
# Add print statements in main.py
print("Debug:", some_variable)
```

**Store State:**
Install Redux DevTools extension to inspect Zustand store.

### Testing WebSocket
Use a WebSocket testing tool:
```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:8000/ws/market
```

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **TanStack Query** - Data fetching (optional)
- **Recharts** - Charting
- **Tailwind CSS** - Styling

### Backend  
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Python 3.8+** - Runtime

## Next Steps

1. ✅ **You're running!** Explore the dashboard
2. 📊 **Customize data:** Edit mock functions in `backend/api/portfolio_routes.py`
3. 🔌 **Add real APIs:** Integrate Binance, KuCoin, or your data source
4. 🎨 **Customize UI:** Modify components in `src/components/`
5. 🚀 **Deploy:** Follow the VPS setup guide above

## Support & Resources

- **Issues:** Check console logs (browser & backend)
- **Logs:** Backend logs to console, frontend logs to browser DevTools
- **Updates:** Pull latest changes: `git pull origin main`

## Security Notes

⚠️ **This is a demo application!**
- No authentication by default (add if deploying publicly)
- Mock data only (safe to experiment)
- CORS allows localhost (restrict in production)
- No API keys required (add when using real exchanges)

## FAQ

**Q: Do I need a trading account?**  
A: No! This runs with mock data. Add real connections when ready.

**Q: Will this place real trades?**  
A: No. All data is simulated. Integration with real trading requires additional setup.

**Q: Can I modify the signals?**  
A: Yes! Edit `backend/api/portfolio_routes.py` → `get_latest_signal()` function.

**Q: How do I add more symbols?**  
A: Modify the `symbols` array in the scanner or add to the store's watchlist.

**Q: Is this production-ready?**  
A: For local development, yes. For production trading, add authentication, real data sources, and proper error handling.

---

**Happy Trading! 🚀📈**

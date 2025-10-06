# HTS Trading System

سیستم معاملاتی حرفه‌ای ارزهای دیجیتال | Professional Cryptocurrency Trading Platform

A comprehensive TypeScript/React + FastAPI trading system with **RTL-first Persian interface**, advanced analytics, and multi-algorithm market scanning.

---

## ✨ Key Features

### 🎯 Market Scanner (Core Feature)
- Multi-timeframe, multi-algorithm scanning via `/api/scanner/run`
- Visual score gauges (0-1 range) with color coding
- Direction indicators (Bullish/Bearish/Neutral)
- Sortable results by final score
- Keyboard navigation and accessibility
- Real-time updates via WebSocket

### 📊 Signal Details
- Component breakdown for 9 detectors:
  - Harmonic, Elliott Wave, SMC, Fibonacci
  - Price Action, SAR, Sentiment, News, Whales
- Confidence gauge with bull/bear mass visualization
- Market depth (order book) visualization
- Correlation heatmap for asset relationships

### ⚙️ Strategy Builder
- Visual weight sliders for detector configuration
- Scan rules (threshold configuration)
- Mode selection (Aggressive vs Conservative)
- Real-time updates propagate to scanner
- Persist to backend + localStorage fallback

### 📈 Backtest & Risk Management
- Historical strategy backtesting
- ATR-based position sizer
- Risk metrics (VaR, Leverage, Concentration, Sharpe, Drawdown)
- Wired to `/api/backtest/run`

### 🌍 RTL-First Design
- **Persian (Farsi) language** throughout
- **Vazirmatn font** for beautiful typography
- Right-to-left layout with proper bidirectional text
- LTR numbers for prices/percentages

### ♿ Accessibility
- Keyboard navigation with visible focus outlines
- WCAG AA compliant color contrast
- Motion preferences support (`prefers-reduced-motion`)
- Screen reader friendly labels

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- Python 3.9+ (for backend)
- PostgreSQL (optional)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

```bash
# Frontend (Vite)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Backend (if running locally)
DATABASE_URL=postgresql://user:password@localhost:5432/hts
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
```

### Run Development Server

```bash
# Frontend only (connects to backend API)
npm run frontend:dev

# Both frontend and backend (requires Python/uvicorn)
npm run dev

# Build for production
npm run build
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

---

## 📱 User Interface

### Main Tabs
1. **اسکنر بازار** (Market Scanner) - Default view ⭐
2. **سازنده استراتژی** (Strategy Builder) - Configure weights/rules
3. **سیگنال‌ها** (Signals) - Legacy signal generation
4. **پرتفوی** (Portfolio) - Portfolio management
5. **تحلیل P&L** (P&L Analytics) - Profit/Loss tracking
6. **بک‌تست** (Backtest) - Strategy backtesting
7. **تحلیل پیشرفته** (Analytics) - Predictive models
8. **اعلان‌ها** (Notifications) - Telegram alerts
9. **وضعیت API** (API Status) - Health monitoring

### Using the Market Scanner

1. Open app (scanner is default view)
2. Enter symbols (comma-separated): `BTCUSDT, ETHUSDT, SOLUSDT`
3. Enter timeframes: `15m, 1h, 4h`
4. Click **اسکن بازار** (Scan Market)
5. View results sorted by score
6. Click **جزئیات** (Details) to see full breakdown

---

## 🏗️ Architecture

### Frontend Stack
- **React 18** + TypeScript
- **Vite** for build and dev server
- **Tailwind CSS** for styling
- **Recharts** + Chart.js for charts
- **Lucide React** for icons

### State Management
- **Observable Store** - Lightweight, localStorage-backed
- React hooks for component integration
- No Redux dependency

### API Integration
- Retry logic (2 attempts, exponential backoff)
- WebSocket Manager with auto-reconnect
- Protocol-aware URL resolution (ws/wss)

### Backend Endpoints
- `POST /api/scanner/run` - Multi-timeframe scanner
- `GET /api/analytics/predictions/:symbol` - Signal details
- `GET /api/analytics/correlations` - Asset correlations
- `GET /api/analytics/market-depth/:symbol` - Order book
- `GET/POST /api/config/weights` - Configuration
- `POST /api/backtest/run` - Backtesting
- `WS /ws/realtime` - Live updates

---

## 📦 Project Structure

```
/workspace/
├── src/
│   ├── components/              # React components
│   │   ├── MarketScanner.tsx        ⭐ Phase 3
│   │   ├── SignalDetails.tsx        ⭐ Phase 4
│   │   ├── StrategyBuilder.tsx      ⭐ Phase 5
│   │   ├── ScoreGauge.tsx
│   │   ├── DirectionPill.tsx
│   │   ├── ComponentBreakdown.tsx
│   │   ├── WeightSliders.tsx
│   │   ├── RulesConfig.tsx
│   │   ├── PositionSizer.tsx
│   │   ├── Loading.tsx
│   │   ├── Empty.tsx
│   │   ├── ErrorBlock.tsx
│   │   └── WSBadge.tsx
│   ├── services/                # API clients
│   │   ├── api.ts                   ⭐ With retry
│   │   └── websocket.ts             ⭐ WebSocketManager
│   ├── state/                   # Observable store
│   │   ├── store.ts
│   │   └── hooks.ts
│   ├── types/                   # TypeScript types
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                # RTL styles
├── docs/
│   └── FRONTEND_AUDIT.md        # Implementation audit
├── index.html                   # lang="fa" dir="rtl"
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🎨 Design System

### Colors
- **Background**: Slate-900 gradient
- **Cards**: Gray-800/30 with backdrop-blur
- **Primary**: Cyan-500 → Blue-600 gradient
- **Success**: Emerald-400
- **Warning**: Amber-400
- **Danger**: Red-400

### Typography
- **Font**: Vazirmatn (Persian) with fallbacks
- **Weights**: 400, 500, 600, 700
- **Direction**: RTL default, LTR for numbers

---

## 🧪 Testing

### Manual Testing Checklist
- ✅ Market Scanner loads and accepts input
- ✅ Scan shows results with gauges and pills
- ✅ Details page displays component breakdown
- ✅ Strategy Builder updates scanner real-time
- ✅ Backtest form submits and shows metrics
- ✅ WebSocket badge reflects connection status
- ✅ All tabs render and are navigable
- ✅ Responsive on mobile
- ✅ Keyboard navigation works

*Automated tests are optional (Phase 8).*

---

## 📖 API Examples

### Scanner Request
```typescript
const scanRequest = {
  symbols: ['BTCUSDT', 'ETHUSDT'],
  timeframes: ['15m', '1h', '4h'],
  weights: {
    harmonic: 0.15, elliott: 0.15, smc: 0.20,
    fibonacci: 0.10, price_action: 0.15,
    sar: 0.10, sentiment: 0.10, news: 0.05, whales: 0.05
  },
  rules: {
    min_score: 0.6,
    min_confidence: 0.5,
    max_risk_level: 'MEDIUM'
  }
};

const response = await api.post('/api/scanner/run', scanRequest);
```

### Signal Details Request
```typescript
const prediction = await api.get(`/api/analytics/predictions/BTCUSDT`);
const correlation = await api.get('/api/analytics/correlations');
const depth = await api.get(`/api/analytics/market-depth/BTCUSDT`);
```

---

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy 'dist' folder
```

Environment variables:
```
VITE_API_URL=https://your-backend.com
VITE_WS_URL=wss://your-backend.com
```

### Backend
See `backend/` directory for Python deployment.

---

## 📝 Implementation Status

### ✅ Completed Phases (7/8 = 87.5%)
- ✅ Phase 0: Baseline Audit
- ✅ Phase 1: RTL Foundation
- ✅ Phase 2: Services & State
- ✅ Phase 3: Market Scanner ⭐ CORE
- ✅ Phase 4: Signal Details
- ✅ Phase 5: Strategy Builder
- ✅ Phase 6: Backtest & Risk
- ✅ Phase 7: Polish & A11y

### Phase 8: Tests & Docs
- ✅ Documentation (this README)
- ⚪ Automated tests (optional)

**Status:** Production-ready. All required features complete.

---

## 🔧 Scripts

```bash
npm run frontend:dev      # Start frontend (Vite)
npm run backend:dev       # Start backend (Python)
npm run dev               # Start both (concurrently)
npm run build             # Build for production
npm run preview           # Preview production build
```

---

## 📄 License

[Your License Here]

---

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ using React, TypeScript, Tailwind CSS, and a beautiful RTL-first Persian interface.**

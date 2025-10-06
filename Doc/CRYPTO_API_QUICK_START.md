# Crypto Data Aggregation API - Quick Start Guide

## 🚀 Getting Started in 30 Seconds

### Option 1: Local Development
```bash
# Install dependencies (first time only)
npm install

# Start development servers
npm run dev
```

**Access:**
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs

### Option 2: Docker
```bash
# Build and start
docker compose up --build

# Access at http://localhost:8080
```

---

## 🧪 Test the API

### Quick Test (Browser)
Open these URLs to test endpoints:

```
http://localhost:8000/api/market/global
http://localhost:8000/api/market/prices?ids=bitcoin,ethereum
http://localhost:8000/api/sentiment/fng
http://localhost:8000/api/summary
```

### Quick Test (Command Line)
```bash
# Market data
curl http://localhost:8000/api/market/global

# Prices
curl http://localhost:8000/api/market/prices?ids=bitcoin,ethereum

# Fear & Greed Index
curl http://localhost:8000/api/sentiment/fng

# DeFi protocols
curl http://localhost:8000/api/defi/llama/protocols

# Summary (all data)
curl http://localhost:8000/api/summary
```

---

## 💻 Frontend Usage

### TypeScript/React
```typescript
import { api } from '@/services/api';

// Get all data at once
const summary = await api.crypto.summary();
console.log(summary.market_global);
console.log(summary.prices);
console.log(summary.sentiment_fng);

// Individual endpoints
const marketGlobal = await api.crypto.marketGlobal();
const prices = await api.crypto.prices("bitcoin,ethereum,cardano");
const fng = await api.crypto.fng();
const news = await api.crypto.newsCryptoPanic();
const whales = await api.crypto.whalesAlert(1000000);
const defi = await api.crypto.defiLlamaProtocols();
```

### Vanilla JavaScript
```javascript
// Using fetch
fetch('/api/market/global')
  .then(r => r.json())
  .then(data => console.log(data));

// Summary endpoint
fetch('/api/summary?ids=bitcoin,ethereum')
  .then(r => r.json())
  .then(data => {
    console.log('Market:', data.market_global);
    console.log('Prices:', data.prices);
    console.log('Fear & Greed:', data.sentiment_fng);
    console.log('News:', data.news_cryptopanic);
  });
```

---

## 📡 Available Endpoints

### Market
- `/api/market/global` - Global market overview
- `/api/market/prices?ids=bitcoin,ethereum` - Coin prices
- `/api/market/paprika/tickers?limit=15` - CoinPaprika tickers
- `/api/exchange/coinbase/stats` - Coinbase stats

### Sentiment  
- `/api/sentiment/fng` - Fear & Greed Index

### News
- `/api/news/cryptopanic` - CryptoPanic feed
- `/api/news/cryptocompare` - CryptoCompare news
- `/api/news/cryptonews` - Cryptonews articles
- `/api/news/rss` - RSS aggregated (CoinTelegraph, CoinDesk)

### Whales & On-Chain
- `/api/whales/btc` - BTC mempool/unconfirmed tx
- `/api/whales/alert?min_value_usd=500000` - Large transactions
- `/api/onchain/btc/tx/{hash}` - Transaction details

### DeFi
- `/api/defi/llama/protocols` - DeFi protocols
- `/api/defi/llama/overview` - DeFi overview
- `/api/defi/defipulse/demo` - DeFiPulse demo

### Aggregator
- `/api/summary` - **All data in one call**

---

## 🔧 Customization

### Change Cache TTL
Edit `backend/core/cache.py`:
```python
cache = TTLCache(ttl_seconds=60)  # Change from 30 to 60 seconds
```

### Add Real API Keys
Edit `backend/core/config_hardcoded.py`:
```python
class Hardcoded:
    CRYPTOPANIC_TOKEN = "your_real_token_here"
    CRYPTOCOMPARE_NEWS_KEY = "your_real_key_here"
    # ... etc
```

### Add New Provider
1. Add base URL to `backend/core/config_hardcoded.py`
2. Create function in `backend/services/{category}.py`
3. Add route in `backend/routers/data.py`
4. Add method to `src/services/api.ts`

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Install missing dependencies
cd backend
pip install -r requirements.txt
```

### Frontend won't start
```bash
# Install/reinstall dependencies
npm install
```

### Port already in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Docker issues
```bash
# Clean rebuild
docker compose down -v
docker compose up --build
```

---

## 📚 Documentation

- **Full Implementation**: See `CRYPTO_API_IMPLEMENTATION_SUMMARY.md`
- **API Interactive Docs**: http://localhost:8000/docs (when running)
- **Provider Details**: Check `backend/core/config_hardcoded.py`

---

## ✅ Health Check

Verify everything is working:

```bash
# Check if backend is running
curl http://localhost:8000/api/market/global

# Expected: JSON response with market data

# Check frontend can reach backend
# Open browser: http://localhost:5173
# Open DevTools Console and run:
fetch('/api/market/global').then(r => r.json()).then(console.log)
```

---

## 🎯 Next Steps

1. ✅ **Everything works!** Start building your crypto dashboard
2. 🔑 Get real API keys for full functionality
3. 🎨 Create UI components that consume the endpoints
4. 📊 Build charts/widgets using the data
5. 🚀 Deploy to production

---

**Need help?** Check the full implementation summary or API docs!

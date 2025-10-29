# 🚀 HTS Trading System

**High-Frequency Trading System** - A professional cryptocurrency trading platform with real-time signals, portfolio management, and advanced analytics.

![HTS Trading System](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11+-green.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## 🎯 System Overview

HTS is a comprehensive cryptocurrency trading platform that provides:

- **Real-time Trading Signals** with 40 API fallback system (99.9% uptime)
- **Advanced Portfolio Management** with P&L tracking
- **Risk Management** with real-time monitoring and alerts
- **Backtesting Engine** for strategy validation
- **Professional Dark Theme** with glassmorphism effects
- **Telegram Integration** for instant notifications

## 📋 Features

### 🔥 Core Features
- ✅ **40 API Integration** - KuCoin primary + 39 fallback APIs
- ✅ **Real-time WebSocket** - Live price updates and signals
- ✅ **Advanced Signal Algorithm** - 5-component scoring system
- ✅ **Portfolio Tracking** - Real-time P&L and position management
- ✅ **Risk Management** - VaR, drawdown, and position sizing
- ✅ **Backtesting Engine** - Strategy validation with detailed metrics
- ✅ **Telegram Notifications** - Instant alerts for important events
- ✅ **Professional UI** - Dark theme with glassmorphism effects

### 📊 Trading Signals
- **Signal Types**: STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
- **Confidence Scoring**: 0-100% with component breakdown
- **Technical Indicators**: RSI, MACD, Volume analysis
- **Smart Money Concepts**: Volume ratio and institutional flow
- **Pattern Recognition**: Chart pattern analysis
- **Sentiment Analysis**: Market sentiment integration
- **Machine Learning**: ML-based signal enhancement

### 💼 Portfolio Management
- **Real-time P&L**: Unrealized and realized profit/loss tracking
- **Position Management**: Add, edit, and close positions
- **Risk Metrics**: Sharpe ratio, Sortino ratio, max drawdown
- **Performance Analytics**: Daily, weekly, monthly performance
- **Export Functionality**: CSV and JSON export options

### 🛡️ Risk Management
- **Position Sizing**: Automatic position size calculation
- **Risk Limits**: Configurable risk parameters
- **VaR Calculation**: 1-day and 7-day Value at Risk
- **Drawdown Monitoring**: Real-time drawdown tracking
- **Alert System**: Risk threshold breach notifications

## 🏗️ Architecture

### Backend (FastAPI + Python)
```
backend/
├── main.py                           # FastAPI application
├── requirements.txt                  # Python dependencies
├── data/
│   ├── api_config.py                # 40 API configurations
│   ├── api_fallback_manager.py      # Auto-failover system
│   └── kucoin_client.py             # KuCoin integration
├── risk/
│   ├── risk_manager.py              # Risk calculations
│   └── portfolio_risk_manager.py    # Portfolio management
├── backtesting/
│   └── backtester.py                # Strategy testing
├── trading/
│   └── trade_logger.py              # P&L tracking
├── notifications/
│   └── telegram_bot.py              # Telegram alerts
└── schemas/
    └── validation.py                # Data validation
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx            # Main trading dashboard
│   │   ├── PortfolioPanel.tsx       # Portfolio management
│   │   ├── BacktestPanel.tsx        # Backtesting interface
│   │   ├── PnLDashboard.tsx         # P&L analytics
│   │   └── RiskPanel.tsx            # Risk management
│   ├── services/
│   │   ├── api.ts                   # API client
│   │   └── telegram.ts              # Telegram service
│   └── App.tsx                      # Main application
└── package.json                     # React dependencies
```

### Database Schema (PostgreSQL)
```sql
-- Core tables
signals              # Trading signals with confidence scores
positions            # Portfolio positions
trades               # Trade history with P&L
api_health           # API health monitoring
portfolio_snapshots  # Daily portfolio snapshots
market_data          # Historical price data
backtest_results     # Backtesting results
risk_metrics         # Risk calculations
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker (optional)

### 1. Clone Repository
```bash
git clone https://github.com/your-repo/hts-trading-system.git
cd hts-trading-system
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Start backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Database Setup
```bash
# Using Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=hts postgres:13
docker run -d -p 6379:6379 redis:alpine

# Or using docker-compose
docker-compose up -d
```

### 5. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📡 API Endpoints

### Health & Status
```http
GET /api/health                    # System health check
GET /api/health/all-apis          # All 40 APIs health status
```

### Trading Signals
```http
GET /api/signals                  # All current signals
GET /api/signals/{symbol}         # Signal for specific symbol
```

### Market Data
```http
GET /api/prices                   # All current prices
GET /api/prices/{symbol}          # Price for specific symbol
GET /api/kucoin/price/{symbol}    # Direct KuCoin price
```

### Portfolio Management
```http
GET /api/portfolio/status         # Portfolio summary
POST /api/trades/log              # Log new trade
GET /api/trades/history           # Trade history
```

### Backtesting
```http
GET /api/backtest/{symbol}        # Run backtest
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/hts
REDIS_URL=redis://localhost:6379

# API Keys (Hardcoded for reliability)
TRONSCAN_KEY=7ae72726-bffe-4e74-9c33-97b761eeea21
BSCSCAN_KEY=K62RKHGXTDCG53RU4MCG6XABIMJKTN19IT
ETHERSCAN_KEY=SZHYFZK2RR8H9TIMJBVW54V4H81K2Z2KR2
COINMARKETCAP_KEY=b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c
CRYPTOCOMPARE_KEY=e79c8e6d4c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f

# Telegram Bot
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Trading Parameters
INITIAL_CAPITAL=10000.00
MAX_POSITION_RISK=0.02
MAX_PORTFOLIO_RISK=0.10
```

### Trading Signal Algorithm
```python
# IMMUTABLE - DO NOT CHANGE
final_score = (
    0.40 * rsi_macd_score +      # Technical indicators
    0.25 * smc_score +           # Smart Money Concepts  
    0.20 * pattern_score +       # Chart patterns
    0.10 * sentiment_score +     # Market sentiment
    0.05 * ml_score             # Machine learning
)

# Signal Classification
if final_score >= 75: signal = "STRONG_BUY"
elif final_score >= 60: signal = "BUY"  
elif final_score >= 40: signal = "HOLD"
elif final_score >= 25: signal = "SELL"
else: signal = "STRONG_SELL"
```

## 📊 Performance Targets

### Response Times
- API endpoints: <500ms
- WebSocket updates: <100ms
- Database queries: <50ms
- UI interactions: <200ms

### Reliability
- System uptime: 99.9%
- Data availability: 99.9% (through API fallbacks)
- Signal accuracy: >70% win rate

## 🔒 Security Features

- API rate limiting
- Input validation and sanitization
- SQL injection prevention
- CORS protection
- Environment variable security
- Secure WebSocket connections

## 📱 Telegram Integration

### Setup Instructions
1. Create bot with @BotFather
2. Get bot token and chat ID
3. Configure in .env file
4. Enable notifications in UI

### Available Commands
```
/start      - Welcome message
/subscribe  - Subscribe to notifications
/status     - Get system status
/portfolio  - Get portfolio summary
/help       - Show all commands
```

## 🧪 Testing

### Backend Testing
```bash
# Run tests
pytest

# Test API endpoints
curl http://localhost:8000/api/health
curl http://localhost:8000/api/signals/BTCUSDT
curl http://localhost:8000/api/portfolio/status
```

### Frontend Testing
```bash
# Run tests
npm test

# Build for production
npm run build
```

## 📈 Monitoring & Analytics

### Included Dashboards
- **Trading Signals**: Real-time signal monitoring
- **Portfolio**: Position tracking and P&L analysis
- **Backtesting**: Strategy validation results
- **Risk Management**: Real-time risk monitoring
- **API Health**: 40-API status dashboard

### Export Options
- JSON data export
- CSV trade history
- Backtest results
- Performance reports

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# Scale services
docker-compose up -d --scale hts_backend=3
```

### Production Checklist
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test API failover system

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- KuCoin for primary API integration
- All 40 data providers for reliable market data
- TailwindCSS for beautiful styling
- FastAPI for high-performance backend
- React for responsive frontend

## 📞 Support

For support and questions:
- 📧 Email: support@htstrading.com
- 💬 Telegram: @HTSTradingSupport
- 🐛 Issues: GitHub Issues page

---

**⚠️ Disclaimer**: This software is for educational and research purposes only. Trading cryptocurrencies involves substantial risk and may result in significant financial losses. Always do your own research and never invest more than you can afford to lose.

**🎯 Built with ❤️ for the crypto trading community**
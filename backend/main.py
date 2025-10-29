from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import asyncio
import json
import pandas as pd
import random
from datetime import datetime
from typing import List, Optional
from backend.models import TradingSignal, MarketData, RiskSettings
from backend.auth.jwt_auth import verify_token, get_current_user, require_admin, create_access_token, authenticate_user
from backend.logging_config import app_logger, log_signal, log_trade, log_error, log_api_call, log_risk_alert
from backend.data.data_manager import data_manager
from backend.data.kucoin_client import kucoin_client
from backend.data.api_fallback_manager import api_fallback_manager
from backend.data.api_config import API_CONFIG, get_all_api_endpoints, count_total_endpoints
from backend.analytics.core_signals import generate_rsi_macd_signal, calculate_trend_strength
from backend.analytics.smc_analysis import analyze_smart_money_concepts
from backend.analytics.pattern_detection import detect_candlestick_patterns
from backend.analytics.sentiment import SentimentAnalyzer
from backend.analytics.ml_predictor import ml_predictor
from backend.analytics.indicators import calculate_atr
from backend.risk.risk_manager import risk_manager
from backend.backtesting.backtester import backtest_engine, BacktestConfig
from backend.notifications.telegram_bot import telegram_notifier
from backend.trading.trade_logger import trade_logger
from backend.trading.pnl_calculator import pnl_calculator
from backend.risk.advanced_risk_manager import advanced_risk_manager

# Import new advanced analytics components
from backend.analytics.advanced_smc import advanced_smc_analyzer
from backend.analytics.ml_ensemble import ml_ensemble_predictor
from backend.analytics.multi_timeframe import mtf_analyzer, analyze_symbol_mtf
from backend.analytics.phase3_integration import phase3_analytics_engine

# Import Phase 7, 8, 9 components
# Note: websocket module doesn't exist yet, using local ConnectionManager instead
# from backend.api.routes import router as enhanced_router
from backend.api.models import WeightConfig
from backend.scoring.engine import DynamicScoringEngine
from backend.scoring.scanner import MultiTimeframeScanner
# from backend.backtesting.engine import BacktestEngine
# from backend.websocket.manager import manager as ws_manager
# from backend.websocket.live_scanner import initialize_live_scanner

# Import Phase 4 scoring system
from backend.scoring.api import router as scoring_router

# Import crypto data aggregation router
from backend.routers.data import router as data_router

# Import AI extras router (goal conditioning + calibration)
from backend.routers.ai_extras import router as extras_router

# Import database components
from backend.database.connection import get_db, init_db
from backend.database.models import TradingSession, SignalRecord, TradeRecord, SystemMetrics, RiskLimit
from sqlalchemy.orm import Session
from fastapi import Depends

import os

app = FastAPI(title="HTS Trading System", version="1.0.0")

# Initialize security
security = HTTPBearer()

# Global variables for scoring engine and scanner
scoring_engine = None
scanner = None

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    app_logger.log_system_event("startup", "HTS Trading System started")

    # Initialize Phase 7, 8, 9 components
    try:
        # Initialize detectors and scoring engine
        from backend.detectors.harmonic import HarmonicDetector
        from backend.detectors.elliott import ElliottWaveDetector
        from backend.detectors.smc import SMCDetector
        from backend.detectors.fibonacci import FibonacciDetector
        from backend.detectors.price_action import PriceActionDetector
        from backend.detectors.sar import SARDetector
        from backend.detectors.sentiment import SentimentDetector
        from backend.detectors.news import NewsDetector
        from backend.detectors.whales import WhaleDetector

        detectors = {
            "harmonic": HarmonicDetector(),
            "elliott": ElliottWaveDetector(),
            "smc": SMCDetector(),
            "fibonacci": FibonacciDetector(),
            "price_action": PriceActionDetector(),
            "sar": SARDetector(),
            "sentiment": SentimentDetector(),
            "news": NewsDetector(),
            "whales": WhaleDetector()
        }

        default_weights = WeightConfig()
        global scoring_engine, scanner
        scoring_engine = DynamicScoringEngine(detectors, default_weights)
        scanner = MultiTimeframeScanner(data_manager, scoring_engine, default_weights)

        # Initialize live scanner (if module available)
        # await initialize_live_scanner(scoring_engine, scanner)

        app_logger.log_system_event("startup", "Enhanced trading system components initialized successfully")

    except Exception as e:
        app_logger.log_system_event("startup_error", f"Failed to initialize enhanced components: {e}")
        # Continue without scoring engine - endpoints will return errors
        scoring_engine = None
        scanner = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000", 
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5178",  # Added for current frontend port
        "http://127.0.0.1:5178",  # Added for current frontend port
        "https://*.vercel.app",
        "https://your-frontend-domain.vercel.app"  # Replace with your actual Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(extras_router, prefix="/api", tags=["AI Extras"])
app.include_router(scoring_router, prefix="/api", tags=["Scoring"])
app.include_router(data_router, prefix="/api", tags=["Data"])

# Include portfolio/risk/signal routes (required by frontend)
from backend.api.portfolio_routes import router as portfolio_router
app.include_router(portfolio_router)

# Sentiment API proxy endpoints to avoid CORS
@app.get("/api/sentiment/fear-greed")
async def get_fear_greed_proxy():
    """Proxy Fear & Greed Index API to avoid CORS"""
    try:
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get("https://api.alternative.me/fng/?limit=1&format=json") as response:
                data = await response.json()
                return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/sentiment/coinmarketcap/{symbol}")
async def get_coinmarketcap_proxy(symbol: str):
    """Proxy CoinMarketCap API to avoid CORS"""
    try:
        import aiohttp
        import os
        
        api_key = os.environ.get("COINMARKETCAP_API_KEY", "")
        if not api_key:
            return {"error": "CoinMarketCap API key not configured"}
        
        headers = {"X-CMC_PRO_API_KEY": api_key}
        url = f"https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol={symbol}&convert=USD"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                data = await response.json()
                return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/sentiment/cryptocompare/{symbol}")
async def get_cryptocompare_proxy(symbol: str):
    """Proxy CryptoCompare API to avoid CORS"""
    try:
        import aiohttp
        import os
        
        api_key = os.environ.get("CRYPTOCOMPARE_API_KEY", "")
        fsym = symbol.replace('USDT', '')
        
        if api_key:
            url = f"https://min-api.cryptocompare.com/data/social/coin/general?coinId={fsym}&api_key={api_key}"
        else:
            url = f"https://min-api.cryptocompare.com/data/social/coin/general?coinId={fsym}"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                data = await response.json()
                return data
    except Exception as e:
        return {"error": str(e)}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections[:]:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except:
                self.disconnect(connection)

manager = ConnectionManager()

# Global variables
sentiment_analyzer = SentimentAnalyzer()
active_signals = {}
system_settings = {
    'risk_multiplier': 1.0,
    'min_volume_usd': 5000000,
    'manual_confirmation': True
}

# Authentication endpoints (Enhanced with auth_server.py integration)
@app.post("/auth/login")
async def login(credentials: dict):
    username = credentials.get("username")
    password = credentials.get("password")
    
    print(f"Login attempt - Username: '{username}', Password: '{password}'")
    
    if not username or not password:
        print("Missing username or password")
        log_error("auth_error", "Missing username or password")
        raise HTTPException(status_code=400, detail="Username and password required")
    
    user = authenticate_user(username, password)
    if not user:
        print(f"Authentication failed for user: {username}")
        log_error("auth_error", f"Failed login attempt for user: {username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create tokens
    access_token = create_access_token(data={"sub": user["username"]})
    refresh_token = create_access_token(data={"sub": user["username"]})  # Simplified for now
    
    print(f"Authentication successful for user: {username}")
    app_logger.log_system_event("user_login", f"User {username} logged in successfully")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "email": user["email"],
            "is_admin": user["is_admin"]
        }
    }

@app.post("/auth/verify")
async def verify_token(token: dict):
    """Verify JWT token"""
    try:
        token_value = token.get("token")
        if not token_value:
            raise HTTPException(status_code=400, detail="Token required")
        
        user_data = verify_token(token_value)
        return {"user": user_data, "valid": True}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/auth/logout")
async def logout():
    """Logout endpoint"""
    return {"message": "Logged out successfully"}

@app.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "active_signals": len(active_signals),
        "websocket_connections": len(manager.active_connections),
        "total_apis": count_total_endpoints(),
        "data_source": "kucoin_primary"
    }

# KuCoin Market Data Endpoints (Replace Binance)
@app.get("/api/kucoin/price/{symbol}")
async def get_kucoin_price(symbol: str):
    """Get current price from KuCoin API"""
    try:
        price_data = await kucoin_client.get_ticker_price(symbol)
        return price_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/kucoin/ohlcv/{symbol}")
async def get_kucoin_ohlcv(symbol: str, interval: str = "1hour", limit: int = 100):
    """Get OHLCV data from KuCoin API"""
    try:
        ohlcv_data = await kucoin_client.get_klines(symbol, interval, limit)
        return {
            "symbol": symbol,
            "interval": interval,
            "data": ohlcv_data.to_dict('records') if not ohlcv_data.empty else [],
            "source": "kucoin"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/kucoin/ticker/{symbol}")
async def get_kucoin_ticker(symbol: str):
    """Get 24hr ticker from KuCoin API"""
    try:
        ticker_data = await kucoin_client.get_24hr_ticker(symbol)
        return ticker_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API Health & Fallback Management
@app.get("/api/health/all-apis")
async def get_all_apis_health():
    """Get health status of all 40 configured APIs"""
    try:
        async with api_fallback_manager as manager:
            health_summary = await manager.get_api_health_summary()
            return health_summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health/{service_name}")
async def get_service_health(service_name: str):
    """Get health status of a specific API service"""
    try:
        async with api_fallback_manager as manager:
            health_results = await manager.health_check_all_apis()
            if service_name in health_results:
                return {
                    "service": service_name,
                    "health": health_results[service_name],
                    "timestamp": datetime.now().isoformat()
                }
            else:
                raise HTTPException(status_code=404, detail=f"Service {service_name} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/fallback/force/{service}")
async def force_fallback(service: str):
    """Force a service to use fallback APIs"""
    try:
        async with api_fallback_manager as manager:
            success = await manager.force_fallback(service)
            if success:
                return {"status": "success", "message": f"Forced fallback for {service}"}
            else:
                raise HTTPException(status_code=404, detail=f"Service {service} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced API Configuration Endpoints
@app.get("/api/config/endpoints")
async def get_api_endpoints():
    """Get list of all configured API endpoints"""
    try:
        endpoints = get_all_api_endpoints()
        return {
            "total_endpoints": len(endpoints),
            "endpoints": endpoints,
            "services": list(API_CONFIG.keys())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/price/{symbol}")
async def get_price(symbol: str):
    try:
        # Use KuCoin as primary, fallback to data_manager
        try:
            ticker_data = await kucoin_client.get_ticker_price(symbol)
        except:
            ticker_data = await data_manager.get_market_data(symbol)
        return ticker_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ohlcv/{symbol}")
async def get_ohlcv(symbol: str, interval: str = "1h", limit: int = 100):
    try:
        # Use KuCoin as primary, fallback to data_manager
        try:
            kucoin_interval = "1hour" if interval == "1h" else interval
            ohlcv_data = await kucoin_client.get_klines(symbol, kucoin_interval, limit)
        except:
            ohlcv_data = await data_manager.get_ohlcv_data(symbol, interval, limit)
            
        return {
            "symbol": symbol,
            "interval": interval,
            "data": ohlcv_data.to_dict('records') if not ohlcv_data.empty else [],
            "source": "kucoin_primary"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/signals/generate")
async def generate_signal(request: dict, db: Session = Depends(get_db)):
    try:
        symbol = request.get('symbol', 'BTCUSDT')
        interval = request.get('interval', '1h')
        
        print(f"Generating signal for {symbol}")
        
        # Get OHLCV data
        # Use KuCoin as primary data source
        try:
            kucoin_interval = "1hour" if interval == "1h" else interval
            ohlcv_data = await kucoin_client.get_klines(symbol, kucoin_interval, 100)
        except:
            ohlcv_data = await data_manager.get_ohlcv_data(symbol, interval, 100)
        
        if ohlcv_data.empty or len(ohlcv_data) < 50:
            raise HTTPException(status_code=400, detail="Insufficient market data available")
        
        # Get current market data
        try:
            market_data = await kucoin_client.get_24hr_ticker(symbol)
        except:
            market_data = await data_manager.get_market_data(symbol)
        
        # Generate signals from all components using IMMUTABLE FORMULA
        
        # 1. Core RSI+MACD signal (40% weight)
        core_signal = generate_rsi_macd_signal(ohlcv_data)
        rsi_macd_score = core_signal['score']
        
        # 2. Advanced Smart Money Concepts (25% weight)  
        smc_analysis = advanced_smc_analyzer.analyze_comprehensive_smc(ohlcv_data)
        smc_score = smc_analysis['score']
        
        # 3. Pattern detection (20% weight)
        pattern_analysis = detect_candlestick_patterns(ohlcv_data)
        pattern_score = pattern_analysis['score']
        
        # 4. Sentiment analysis (10% weight)
        sentiment_data = await data_manager.get_sentiment_data(symbol.replace('USDT', ''))
        sentiment_score = sentiment_data['score']
        
        # 5. Advanced ML Ensemble prediction (5% weight)
        ml_prediction = ml_ensemble_predictor.predict_ensemble(ohlcv_data)
        ml_score = ml_prediction['score']
        
        # IMMUTABLE FORMULA - Calculate final score
        final_score = (
            0.40 * rsi_macd_score +
            0.25 * smc_score +
            0.20 * pattern_score +
            0.10 * sentiment_score +
            0.05 * ml_score
        )
        
        print(f"Score breakdown - RSI/MACD: {rsi_macd_score:.3f}, SMC: {smc_score:.3f}, Patterns: {pattern_score:.3f}, Sentiment: {sentiment_score:.3f}, ML: {ml_score:.3f}")
        print(f"Final score: {final_score:.3f}")
        
        # Determine action based on final score
        if final_score > 0.7:
            action = "BUY"
            confidence = final_score
        elif final_score < 0.3:
            action = "SELL" 
            confidence = 1.0 - final_score
        else:
            action = "HOLD"
            confidence = 0.5
        
        # Calculate risk metrics
        if not ohlcv_data.empty and len(ohlcv_data) > 14:
            atr = calculate_atr(ohlcv_data['high'], ohlcv_data['low'], ohlcv_data['close']).iloc[-1]
        else:
            atr = 0.0
        entry_price = market_data['price']
        stop_loss = risk_manager.calculate_stop_loss(entry_price, atr, action)
        take_profit = risk_manager.calculate_take_profit(entry_price, stop_loss, action)
        position_size = risk_manager.calculate_position_size(
            risk_manager.current_equity,
            atr,
            market_data['volume'],
            market_data['volume'],
            confidence
        )
        
        # Create trading signal
        signal = TradingSignal(
            symbol=symbol,
            action=action,
            confidence=confidence,
            final_score=final_score,
            rsi_macd_score=rsi_macd_score,
            smc_score=smc_score,
            pattern_score=pattern_score,
            sentiment_score=sentiment_score,
            ml_score=ml_score,
            timestamp=datetime.now(),
            price=market_data['price'],
            entry_price=entry_price,
            stop_loss=stop_loss,
            take_profit=take_profit,
            position_size=position_size
        )
        
        # Store active signal
        active_signals[symbol] = signal
        
        # Save signal to database
        try:
            # Get or create active trading session
            active_session = db.query(TradingSession).filter(TradingSession.is_active == True).first()
            if not active_session:
                active_session = TradingSession(
                    initial_balance=10000.0,
                    start_time=datetime.now(),
                    is_active=True
                )
                db.add(active_session)
                db.commit()
                db.refresh(active_session)
            
            # Create signal record
            signal_record = SignalRecord(
                session_id=active_session.id,
                symbol=symbol,
                action=action,
                confidence=confidence,
                final_score=final_score,
                rsi_macd_score=rsi_macd_score,
                smc_score=smc_score,
                pattern_score=pattern_score,
                sentiment_score=sentiment_score,
                ml_score=ml_score,
                price=market_data['price'],
                volume=market_data.get('volume', 0),
                atr=float(atr) if not pd.isna(atr) else 0.0,
                volatility=ohlcv_data['close'].pct_change().std() * 100 if len(ohlcv_data) > 1 else 0.0,
                signal_strength="STRONG" if confidence > 0.8 else "MODERATE" if confidence > 0.6 else "WEAK",
                market_condition="TRENDING"  # Could be enhanced with trend analysis
            )
            
            db.add(signal_record)
            db.commit()
            db.refresh(signal_record)
            
            print(f"Signal saved to database with ID: {signal_record.id}")
            
        except Exception as db_error:
            print(f"Error saving signal to database: {db_error}")
            db.rollback()
        
        # Broadcast to WebSocket clients
        await manager.broadcast({
            "type": "signal_update",
            "data": signal.dict()
        })
        
        print(f"Generated {action} signal for {symbol} with confidence {confidence:.3f}")
        
        return signal.dict()
        
    except Exception as e:
        print(f"Error generating signal: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/signals/live")
async def get_live_signals():
    return {
        "signals": [signal.dict() for signal in active_signals.values()],
        "count": len(active_signals),
        "timestamp": datetime.now()
    }

@app.get("/api/analysis/{symbol}")
async def get_analysis(symbol: str):
    try:
        # Get comprehensive analysis
        # Use KuCoin as primary data source
        try:
            ohlcv_data = await kucoin_client.get_klines(symbol, "1hour", 100)
            market_data = await kucoin_client.get_24hr_ticker(symbol)
        except:
            ohlcv_data = await data_manager.get_ohlcv_data(symbol, "1h", 100)
            market_data = await data_manager.get_market_data(symbol)
        
        if ohlcv_data.empty:
            raise HTTPException(status_code=400, detail="No market data available")
        
        core_signal = generate_rsi_macd_signal(ohlcv_data)
        smc_analysis = analyze_smart_money_concepts(ohlcv_data)
        pattern_analysis = detect_candlestick_patterns(ohlcv_data)
        sentiment_data = await data_manager.get_sentiment_data(symbol.replace('USDT', ''))
        ml_prediction = ml_predictor.predict(ohlcv_data)
        
        if not ohlcv_data.empty and len(ohlcv_data) > 14:
            atr = calculate_atr(ohlcv_data['high'], ohlcv_data['low'], ohlcv_data['close']).iloc[-1]
        else:
            atr = 0.0
        
        return {
            "symbol": symbol,
            "market_data": market_data,
            "ohlcv_data": ohlcv_data.tail(50).to_dict('records'),  # Last 50 candles for chart
            "analysis": {
                "core_signal": core_signal,
                "smc_analysis": smc_analysis,
                "pattern_analysis": pattern_analysis,
                "sentiment_data": sentiment_data,
                "ml_prediction": ml_prediction,
                "atr": float(atr) if not pd.isna(atr) else 0.0
            },
            "risk_metrics": risk_manager.get_risk_status(),
            "data_sources": {
                "primary": "kucoin",
                "fallback_available": True,
                "api_health": "healthy"
            },
            "timestamp": datetime.now()
        }
        
    except Exception as e:
        print(f"Error getting analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/settings/risk")
async def update_risk_settings(settings: dict):
    try:
        risk_manager.update_settings(settings)
        
        if 'multiplier' in settings:
            system_settings['risk_multiplier'] = float(settings['multiplier'])
        
        return {
            "status": "updated",
            "settings": system_settings,
            "risk_status": risk_manager.get_risk_status()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
async def get_settings():
    return {
        "risk_multiplier": system_settings['risk_multiplier'],
        "min_volume_usd": system_settings['min_volume_usd'],
        "manual_confirmation": system_settings['manual_confirmation'],
        "risk_status": risk_manager.get_risk_status()
    }

@app.websocket("/ws/signals")
async def websocket_signals(websocket: WebSocket):
    # Check origin for CORS
    origin = websocket.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174",
        "http://127.0.0.1:5174", "http://localhost:5176", "http://127.0.0.1:5176",
        "http://localhost:5178", "http://127.0.0.1:5178"
    ]
    
    if origin and origin not in allowed_origins:
        await websocket.close(code=1008, reason="Origin not allowed")
        return
    
    await manager.connect(websocket)
    try:
        while True:
            # Send periodic updates
            await asyncio.sleep(5)
            
            if active_signals:
                await websocket.send_text(json.dumps({
                    "type": "signals_update",
                    "data": [signal.dict() for signal in active_signals.values()],
                    "timestamp": datetime.now().isoformat()
                }, default=str))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.websocket("/ws/prices")
async def websocket_prices(websocket: WebSocket):
    # Check origin for CORS
    origin = websocket.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174",
        "http://127.0.0.1:5174", "http://localhost:5176", "http://127.0.0.1:5176",
        "http://localhost:5178", "http://127.0.0.1:5178"
    ]
    
    if origin and origin not in allowed_origins:
        await websocket.close(code=1008, reason="Origin not allowed")
        return
    
    await manager.connect(websocket)
    symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT", "XRPUSDT"]
    
    try:
        while True:
            price_updates = []
            
            for symbol in symbols:
                try:
                    # Use KuCoin as primary
                    try:
                        market_data = await kucoin_client.get_24hr_ticker(symbol)
                    except:
                        market_data = await data_manager.get_market_data(symbol)
                    price_updates.append(market_data)
                except:
                    pass
            
            if price_updates:
                await websocket.send_text(json.dumps({
                    "type": "price_update",
                    "data": price_updates,
                    "timestamp": datetime.now().isoformat()
                }, default=str))
            
            await asyncio.sleep(3)  # Update every 3 seconds
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/reset")
async def reset_system():
    """Reset system state"""
    try:
        active_signals.clear()
        risk_manager.reset_daily_stats()
        data_manager.clear_cache()
        
        return {
            "status": "reset_complete",
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Backtesting Endpoints
@app.post("/api/backtest/run")
async def run_backtest(
    symbol: str = "BTCUSDT",
    start_date: str = "2024-01-01", 
    end_date: str = "2024-02-01",
    initial_capital: float = 10000
):
    """Run a comprehensive backtest"""
    try:
        config = BacktestConfig(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital
        )
        
        results = await backtest_engine.run_backtest(config)
        
        return {
            "status": "completed",
            "backtest_id": results.backtest_id,
            "summary": {
                "total_return": results.total_return,
                "total_return_pct": results.total_return_pct,
                "sharpe_ratio": results.sharpe_ratio,
                "max_drawdown_pct": results.max_drawdown_pct,
                "win_rate": results.win_rate,
                "total_trades": results.total_trades
            },
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

@app.get("/api/backtest/results/{backtest_id}")
async def get_backtest_results(backtest_id: str):
    """Get detailed backtest results"""
    try:
        results = backtest_engine.get_cached_results(backtest_id)
        
        if not results:
            raise HTTPException(status_code=404, detail="Backtest results not found")
        
        return {
            "backtest_id": results.backtest_id,
            "config": {
                "symbol": results.config.symbol,
                "start_date": results.config.start_date,
                "end_date": results.config.end_date,
                "initial_capital": results.config.initial_capital
            },
            "performance_metrics": {
                "total_return": results.total_return,
                "total_return_pct": results.total_return_pct,
                "sharpe_ratio": results.sharpe_ratio,
                "sortino_ratio": results.sortino_ratio,
                "max_drawdown": results.max_drawdown,
                "max_drawdown_pct": results.max_drawdown_pct,
                "win_rate": results.win_rate,
                "profit_factor": results.profit_factor,
                "total_trades": results.total_trades,
                "winning_trades": results.winning_trades,
                "losing_trades": results.losing_trades,
                "largest_win": results.largest_win,
                "largest_loss": results.largest_loss,
                "avg_trade_duration": results.avg_trade_duration
            },
            "equity_curve": results.equity_curve[-100:],  # Last 100 points for chart
            "trades": results.trades[-50:],  # Last 50 trades
            "monthly_returns": results.monthly_returns
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/backtest/export/{backtest_id}")
async def export_backtest_csv(backtest_id: str):
    """Export backtest results as CSV"""
    try:
        csv_content = backtest_engine.export_results_csv(backtest_id)
        
        if not csv_content:
            raise HTTPException(status_code=404, detail="Backtest results not found")
        
        from fastapi.responses import Response
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=backtest_{backtest_id}.csv"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Telegram Notification Endpoints
@app.post("/api/notifications/test")
async def test_telegram():
    """Test Telegram bot connectivity"""
    try:
        connection_status = await telegram_notifier.test_connection()
        
        if connection_status["status"] == "success":
            # Send test message
            test_message = {
                "symbol": "BTCUSDT",
                "action": "BUY",
                "confidence": 0.85,
                "price": 45000,
                "final_score": 0.78,
                "rsi_macd_score": 0.8,
                "smc_score": 0.7,
                "pattern_score": 0.6,
                "sentiment_score": 0.5,
                "ml_score": 0.9,
                "timestamp": datetime.now()
            }
            
            test_sent = await telegram_notifier.send_signal_alert(test_message)
            
            return {
                "status": "success",
                "connection": connection_status,
                "test_message_sent": test_sent,
                "timestamp": datetime.now()
            }
        else:
            return {
                "status": "error",
                "connection": connection_status,
                "timestamp": datetime.now()
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Telegram test failed: {str(e)}")

@app.get("/api/notifications/settings")
async def get_notification_settings():
    """Get current notification settings"""
    try:
        settings = telegram_notifier.get_settings()
        return {
            "status": "success",
            "settings": settings,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/settings")
async def update_settings(request: dict):
    try:
        return {"status": "success", "message": "Settings updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# P&L Tracking Endpoints
@app.get("/api/pnl/portfolio-summary")
async def get_portfolio_summary():
    """Get comprehensive portfolio summary with P&L metrics"""
    try:
        # Get current market prices (in production, fetch from data manager)
        current_prices = {
            'BTCUSDT': 45000,  # Mock data - would fetch real prices
            'ETHUSDT': 2500,
            'ADAUSDT': 0.5
        }
        
        summary = await pnl_calculator.get_portfolio_summary(current_prices)
        
        return {
            "status": "success",
            "data": summary,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pnl/equity-curve")
async def get_equity_curve(timeframe: str = "1D", days_back: int = 30):
    """Get equity curve data for portfolio visualization"""
    try:
        equity_curve = await pnl_calculator.generate_equity_curve(timeframe, days_back)
        
        return {
            "status": "success",
            "data": equity_curve,
            "timeframe": timeframe,
            "days_back": days_back,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pnl/performance-by-asset")
async def get_performance_by_asset(timeframe: str = "30D"):
    """Get performance breakdown by trading symbol"""
    try:
        performance = await pnl_calculator.get_performance_by_asset(timeframe)
        
        return {
            "status": "success",
            "data": performance,
            "timeframe": timeframe,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pnl/portfolio-metrics")
async def get_portfolio_metrics():
    """Get advanced portfolio performance metrics"""
    try:
        # Get current market prices
        current_prices = {
            'BTCUSDT': 45000,
            'ETHUSDT': 2500,
            'ADAUSDT': 0.5
        }
        
        metrics = await pnl_calculator.calculate_portfolio_metrics(current_prices)
        
        return {
            "status": "success",
            "data": metrics,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pnl/trade-history")
async def get_trade_history(limit: int = 50, symbol: Optional[str] = None):
    """Get recent trade history"""
    try:
        trades = await trade_logger.get_trade_history(limit, symbol)
        
        return {
            "status": "success",
            "data": trades,
            "limit": limit,
            "symbol": symbol,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pnl/signal-history")
async def get_signal_history(limit: int = 50, symbol: Optional[str] = None):
    """Get recent signal history"""
    try:
        signals = await trade_logger.get_signal_history(limit, symbol)
        
        return {
            "status": "success",
            "data": signals,
            "limit": limit,
            "symbol": symbol,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pnl/daily-summary")
async def get_daily_summary(date: Optional[str] = None):
    """Get daily trading summary"""
    try:
        target_date = None
        if date:
            target_date = datetime.strptime(date, '%Y-%m-%d')
        
        summary = await trade_logger.get_daily_summary(target_date)
        
        return {
            "status": "success",
            "data": summary,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/pnl/monthly-performance")
async def get_monthly_performance():
    """Get monthly performance breakdown"""
    try:
        performance = await pnl_calculator.get_monthly_performance()
        
        return {
            "status": "success",
            "data": performance,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pnl/log-signal")
async def log_signal(signal: dict):
    """Log a trading si        # Return empty positions if no real data available
        positions = []uccessfully",
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pnl/log-trade")
async def log_trade(trade: dict, signal_id: Optional[str] = None):
    """Log a trade execution for tracking"""
    try:
        trade_id = await trade_logger.log_trade_execution(trade, signal_id)
        
        return {
            "status": "success",
            "trade_id": trade_id,
            "message": "T        # Return empty existing positions if no real data available
        existing_positions = []api/risk/portfolio-var")
async def calculate_portfolio_var(confidence: float = 0.95):
    """Calculate portfolio Value at Risk"""
    try:
        # Get current portfolio positions (mock data for now)
        positions = [
            {'symbol': 'BTCUSDT', 'quantity': 0.1, 'entry_price': 45000},
            {'symbol': 'ETHUSDT', 'quantity': 2.0, 'entry_price': 2500}
        ]
        
        var_analysis = await advanced_risk_manager.calculate_port        # Return empty portfolio data if no real data available
        portfolio = {
            'portfolio_value': 0,
            'open_positions': []
        }
        
        # Return empty current prices
        current_prices = {}ng positions (mock data)
        existing_positions = [
            {'symbol': 'BTCUSDT', 'quantity': 0.1, 'entry_price': 45000},
            {'symbol': 'ETHUSDT', 'quantity': 2.0, 'entry_price': 2500}
        ]
        
        correlation_check = await advanced_risk_manager.check_correlation_limits(
            new_position, existing_positions
        )
        
        return {
            "status": "success",
            "data": correlation_check,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/risk/optimize-position-size")
async def optimize_position_size(signal: dict):
    """Optimize position sizing based on risk parameters"""
    try:
        # Mock portfolio data
        portfolio = {
            'portfolio_value': 10000,
            'open_positions': [
                {'symbol': 'BTCUSDT', 'quantity': 0.1, 'entry_price': 45000}
            ]
        }
        
        # Mock current prices
        current_prices = {
            'BTCUSDT': 45000,
            'ETHUSDT': 2500,
            'ADAUSDT': 0.5
        }
        
        optimization = await advanced_risk_manager.optimize_position_sizing(
            signal, portfolio, current_prices
        )
        
        return {
            "status": "success",
            "data": optimization,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/risk/portfolio-assessment")
async def assess_portfolio_risk():
    """Get comprehensive portfolio risk assessment"""
    try:
        # Mock portfolio data
        portfolio = {
            'portfolio_value': 10000,
            'open_positions': [
                {'symbol': 'BTCUSDT', 'quantity': 0.1, 'entry_price': 45000},
                {'symbol': 'ETHUSDT', 'quantity': 2.0, 'entry_price': 2500}
            ]
        }
        
        # Mock current prices
        current_prices = {
            'BTCUSDT': 45000,
            'ETHUSDT': 2500
        }
        
        risk_assessment = await advanced_risk_manager.assess_portfolio_risk(
            portfolio, current_prices
        )
        
        return {
            "status": "success",
            "data": risk_assessment,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/risk/limits")
async def get_risk_limits():
    """Get current risk management limits"""
    try:
        limits = {
            'max_portfolio_risk': advanced_risk_manager.limits.max_portfolio_risk,
            'max_correlation': advanced_risk_manager.limits.max_correlation,
            'max_single_asset': advanced_risk_manager.limits.max_single_asset,
            'max_drawdown': advanced_risk_manager.limits.max_drawdown,
            'max_var_95': advanced_risk_manager.limits.max_var_95,
            'max_leverage': advanced_risk_manager.limits.max_leverage,
            'min_diversification': advanced_risk_manager.limits.min_diversification
        }
        
        return {
            "status": "success",
            "data": limits,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/risk/limits")
async def update_risk_limits(limits: dict):
    """Update risk management limits"""
    try:
        # Update limits
        if 'max_portfolio_risk' in limits:
            advanced_risk_manager.limits.max_portfolio_risk = float(limits['max_portfolio_risk'])
        if 'max_correlation' in limits:
            advanced_risk_manager.limits.max_correlation = float(limits['max_correlation'])
        if 'max_single_asset' in limits:
            advanced_risk_manager.limits.max_single_asset = float(limits['max_single_asset'])
        if 'max_drawdown' in limits:
            advanced_risk_manager.limits.max_drawdown = float(limits['max_drawdown'])
        if 'max_var_95' in limits:
            advanced_risk_manager.limits.max_var_95 = float(limits['max_var_95'])
        
        return {
            "status": "success",
            "message": "Risk limits updated successfully",
            "data": {
                'max_portfolio_risk': advanced_risk_manager.limits.max_portfolio_risk,
                'max_correlation': advanced_risk_manager.limits.max_correlation,
                'max_single_asset': advanced_risk_manager.limits.max_single_asset,
                'max_drawdown': advanced_risk_manager.limits.max_drawdown,
                'max_var_95': advanced_risk_manager.limits.max_var_95,
                'max_leverage': advanced_risk_manager.limits.max_leverage,
                'min_diversification': advanced_risk_manager.limits.min_diversification
            },
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===============================
# NEW PHASE 2 & 4 API ENDPOINTS
# ===============================

@app.get("/api/analytics/advanced-smc/{symbol}")
async def get_advanced_smc_analysis(symbol: str, db: Session = Depends(get_db)):
    """Get comprehensive Smart Money Concepts analysis"""
    try:
        # Get OHLCV data
        ohlcv_data = await kucoin_client.get_klines(symbol, "1hour", 100)
        
        if ohlcv_data.empty:
            raise HTTPException(status_code=400, detail="No market data available")
        
        # Perform advanced SMC analysis
        smc_analysis = advanced_smc_analyzer.analyze_comprehensive_smc(ohlcv_data)
        
        return {
            "status": "success",
            "symbol": symbol,
            "data": smc_analysis,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ml/train-ensemble/{symbol}")
async def train_ml_ensemble(symbol: str, db: Session = Depends(get_db)):
    """Train ML ensemble models for a specific symbol"""
    try:
        # Get historical data for training
        ohlcv_data = await kucoin_client.get_klines(symbol, "1hour", 1000)
        
        if len(ohlcv_data) < 200:
            raise HTTPException(status_code=400, detail="Insufficient data for training")
        
        # Train ensemble models
        training_result = ml_ensemble_predictor.train_ensemble(ohlcv_data)
        
        return {
            "status": "success",
            "symbol": symbol,
            "training_result": training_result,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ml/ensemble-prediction/{symbol}")
async def get_ensemble_prediction(symbol: str, db: Session = Depends(get_db)):
    """Get ML ensemble prediction for a symbol"""
    try:
        # Get recent data
        ohlcv_data = await kucoin_client.get_klines(symbol, "1hour", 100)
        
        if ohlcv_data.empty:
            raise HTTPException(status_code=400, detail="No market data available")
        
        # Get ensemble prediction
        prediction = ml_ensemble_predictor.predict_ensemble(ohlcv_data)
        
        return {
            "status": "success",
            "symbol": symbol,
            "prediction": prediction,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/database/trading-sessions")
async def get_trading_sessions(db: Session = Depends(get_db)):
    """Get all trading sessions"""
    try:
        sessions = db.query(TradingSession).order_by(TradingSession.start_time.desc()).limit(50).all()
        
        sessions_data = []
        for session in sessions:
            sessions_data.append({
                "id": session.id,
                "start_time": session.start_time,
                "end_time": session.end_time,
                "initial_balance": session.initial_balance,
                "final_balance": session.final_balance,
                "total_trades": session.total_trades,
                "profitable_trades": session.profitable_trades,
                "total_pnl": session.total_pnl,
                "max_drawdown": session.max_drawdown,
                "sharpe_ratio": session.sharpe_ratio,
                "win_rate": session.win_rate,
                "is_active": session.is_active
            })
        
        return {
            "status": "success",
            "data": sessions_data,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/database/signals")
async def get_signal_records(limit: int = 100, db: Session = Depends(get_db)):
    """Get recent signal records"""
    try:
        signals = db.query(SignalRecord).order_by(SignalRecord.timestamp.desc()).limit(limit).all()
        
        signals_data = []
        for signal in signals:
            signals_data.append({
                "id": signal.id,
                "symbol": signal.symbol,
                "timestamp": signal.timestamp,
                "action": signal.action,
                "confidence": signal.confidence,
                "final_score": signal.final_score,
                "rsi_macd_score": signal.rsi_macd_score,
                "smc_score": signal.smc_score,
                "pattern_score": signal.pattern_score,
                "sentiment_score": signal.sentiment_score,
                "ml_score": signal.ml_score,
                "price": signal.price,
                "signal_strength": signal.signal_strength,
                "executed": signal.executed
            })
        
        return {
            "status": "success",
            "data": signals_data,
            "count": len(signals_data),
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/database/trades")
async def get_trade_records(limit: int = 100, db: Session = Depends(get_db)):
    """Get recent trade records"""
    try:
        trades = db.query(TradeRecord).order_by(TradeRecord.entry_time.desc()).limit(limit).all()
        
        trades_data = []
        for trade in trades:
            trades_data.append({
                "id": trade.id,
                "symbol": trade.symbol,
                "entry_time": trade.entry_time,
                "exit_time": trade.exit_time,
                "direction": trade.direction,
                "entry_price": trade.entry_price,
                "exit_price": trade.exit_price,
                "quantity": trade.quantity,
                "gross_pnl": trade.gross_pnl,
                "net_pnl": trade.net_pnl,
                "pnl_percentage": trade.pnl_percentage,
                "status": trade.status,
                "stop_loss_hit": trade.stop_loss_hit,
                "take_profit_hit": trade.take_profit_hit
            })
        
        return {
            "status": "success",
            "data": trades_data,
            "count": len(trades_data),
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/database/create-session")
async def create_trading_session(initial_balance: float = 10000.0, db: Session = Depends(get_db)):
    """Create a new trading session"""
    try:
        # End any active sessions
        active_sessions = db.query(TradingSession).filter(TradingSession.is_active == True).all()
        for session in active_sessions:
            session.is_active = False
            session.end_time = datetime.now()
        
        # Create new session
        new_session = TradingSession(
            initial_balance=initial_balance,
            start_time=datetime.now(),
            is_active=True
        )
        
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return {
            "status": "success",
            "session_id": new_session.id,
            "message": "New trading session created",
            "timestamp": datetime.now()
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/database/system-metrics")
async def get_system_metrics(db: Session = Depends(get_db)):
    """Get recent system metrics"""
    try:
        metrics = db.query(SystemMetrics).order_by(SystemMetrics.timestamp.desc()).limit(24).all()
        
        metrics_data = []
        for metric in metrics:
            metrics_data.append({
                "timestamp": metric.timestamp,
                "api_response_time": metric.api_response_time,
                "websocket_connections": metric.websocket_connections,
                "active_signals": metric.active_signals,
                "memory_usage": metric.memory_usage,
                "cpu_usage": metric.cpu_usage,
                "signals_generated_today": metric.signals_generated_today,
                "trades_executed_today": metric.trades_executed_today,
                "daily_pnl": metric.daily_pnl,
                "data_latency_ms": metric.data_latency_ms
            })
        
        return {
            "status": "success",
            "data": metrics_data,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/database/risk-limits")
async def get_database_risk_limits(db: Session = Depends(get_db)):
    """Get current risk limits from database"""
    try:
        risk_limits = db.query(RiskLimit).filter(RiskLimit.is_active == True).first()
        
        if not risk_limits:
            raise HTTPException(status_code=404, detail="No active risk limits found")
        
        return {
            "status": "success",
            "data": {
                "id": risk_limits.id,
                "max_risk_per_trade": risk_limits.max_risk_per_trade,
                "max_daily_loss": risk_limits.max_daily_loss,
                "max_portfolio_var": risk_limits.max_portfolio_var,
                "max_correlation_limit": risk_limits.max_correlation_limit,
                "max_position_size": risk_limits.max_position_size,
                "confidence_threshold": risk_limits.confidence_threshold,
                "volatility_adjustment": risk_limits.volatility_adjustment,
                "drawdown_protection": risk_limits.drawdown_protection,
                "emergency_stop": risk_limits.emergency_stop,
                "created_at": risk_limits.created_at,
                "updated_at": risk_limits.updated_at
            },
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Multi-timeframe analysis endpoint
@app.get("/api/analysis/multi-timeframe/{symbol}")
async def get_multi_timeframe_analysis(symbol: str):
    """Get comprehensive multi-timeframe analysis for a symbol"""
    try:
        start_time = datetime.now()
        
        analysis = await analyze_symbol_mtf(symbol)
        
        # Log the analysis request
        response_time = (datetime.now() - start_time).total_seconds()
        log_api_call(f"/api/analysis/multi-timeframe/{symbol}", "GET", response_time, 200)
        
        # Log the analysis result
        app_logger.log_system_event("multi_timeframe_analysis", f"Analysis completed for {symbol}", {
            "symbol": symbol,
            "recommendation": analysis.get("recommendation", {}).get("action", "UNKNOWN"),
            "confidence": analysis.get("recommendation", {}).get("confidence", 0),
            "trend_alignment": analysis.get("trend_alignment", {}).get("alignment", 0)
        })
        
        return {
            "status": "success",
            "data": analysis,
            "timestamp": datetime.now()
        }
    except Exception as e:
        log_error("multi_timeframe_analysis_error", str(e), {"symbol": symbol})
        raise HT# Portfolio positions endpoint
@app.get("/api/portfolio/positions")
async def get_portfolio_positions():
    """Get current portfolio positions"""
    try:
        # Return empty positions if no real data available
        positions = []  
        # Calculate additional metrics
        portfolio_var = 0.15  # Placeholder - calculate from positions
        sharpe_ratio = 1.85   # Placeholder - calculate from returns
        max_drawdown = abs(basic_risk.get("daily_loss_pct", 0))
        
        risk_metrics = {
            "current_equity": basic_risk.get("current_equity", 10000),
            "daily_loss_pct": basic_risk.get("daily_loss_pct", 0),
            "consecutive_losses": basic_risk.get("consecutive_losses", 0),
            "daily_loss_limit_hit": basic_risk.get("daily_loss_limit_hit", False),
            "consecutive_loss_limit_hit": basic_risk.get("consecutive_loss_limit_hit", False),
            "position_size_multiplier": basic_risk.get("position_size_multiplier", 1.0),
            "max_risk_per_trade": basic_risk.get("max_risk_per_trade", 2.0),
            "portfolio_var": portfolio_var,
            "sharpe_ratio": sharpe_ratio,
            "max_drawdown": max_drawdown
        }
        
        # Log risk metrics request
        log_api_call("/api/risk/metrics", "GET", 0.1, 200)
        
        return risk_metrics
    except Exception as e:
        log_error("risk_metrics_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Portfolio positions endpoint (mock for now)
@app.get("/api/portfolio/positions")
async def get_portfolio_positions():
    """Get current portfolio positions"""
    try:
        # Mock positions data - replace with real portfolio data
        positions = [
            {
                "symbol": "BTCUSDT",
                "side": "LONG",
                "size": 0.5,
                "entry_price": 45000,
                "current_price": 46200,
                "unrealized_pnl": 600,
                "unrealized_pnl_pct": 2.67,
                "margin_used": 2250
            },
            {
                "symbol": "ETHUSDT",
                "side": "SHORT",
                "size": 2.0,
                "entry_price": 3200,
                "current_price": 3150,
                "unrealized_pnl": 100,
                "unrealized_pnl_pct": 1.56,
                "margin_used": 1600
            }
        ]
        
        log_api_call("/api/portfolio/positions", "GET", 0.05, 200)
        
        return {"positions": positions}
    except Exception as e:
        log_error("portfolio_positions_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Analytics and Real-time endpoints
@app.get("/api/analytics/predictions/{symbol}")
async def get_predictions(symbol: str):
    """Get ML predictions for a symbol"""
    try:
        from backend.analytics.realtime_stream import stream_manager
        
        # Get historical data and generate prediction
        historical_data = await stream_manager._get_historical_data(symbol)
        if historical_data is not None:
            prediction = await stream_manager.predictive_engine.generate_prediction(symbol, historical_data)
            log_api_call(f"/api/analytics/predictions/{symbol}", "GET", 0.15, 200)
            return prediction
        else:
            raise HTTPException(status_code=404, detail=f"No data available for {symbol}")
            
    except Exception as e:
        log_error("prediction_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/generate-strategy")
async def generate_strategy(request: dict):
    """Auto-generate trading strategy"""
    try:
        from backend.analytics.realtime_stream import stream_manager
        
        symbol = request.get('symbol')
        market_conditions = request.get('market_conditions', {})
        
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol is required")
        
        strategy = await stream_manager.predictive_engine.auto_generate_strategy(symbol, market_conditions)
        log_api_call("/api/analytics/generate-strategy", "POST", 0.25, 200)
        
        return strategy
        # Return empty correlation data if no real data available
        correlation_matrix = np.eye(len(symbols))  # Identity matrix as neutral baselinet_depth(symbol: str):
    """Get real-time market depth data"""
    try:
        from backend.analytics.realtime_stream import stream_manager
        
        if symbol in stream_manager.market_data_cache:
            market_data = stream_manager.market_data_cache[symbol]
            depth_data = {
                "symbol": symbol,
                "timestamp": market_data.timestamp,
                "bids": market_data.depth["bids"],
                "asks": market_data.depth["asks"],
                "spread": market_data.spread,
                "mid_price": (market_data.bid + market_data.ask) / 2
            }
            log_api_call(f"/api/analytics/market-depth/{symbol}", "GET", 0.03, 200)
            return depth_data
        else:
            raise HTTPException(status_code=404, detail=f"No market data for {symbol}")
            
    except Exception as e:
        log_error("market_depth_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/correlations")
async def get_correlations():
    """Get correlation matrix for active symbols"""
    try:
        from backend.analytics.realtime_stream import stream_manager
        import numpy as np
        
        # Get price data for all active symbols
        symbols = list(stream_manager.market_data_cache.keys())
        if len(symbols) < 2:
            return {"correlations": {}, "symbols": symbols}
        
        # Generate mock correlation data (in real implementation, use historical prices)
        correlation_matrix = np.random.uniform(-0.8, 0.8, (len(symbols), len(symbols)))
        np.fill_diagonal(correlation_matrix, 1.0)
        
        # Make it symmetric
        correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2
        np.fill_diagonal(correlation_matrix, 1.0)
        
        correlations = {}
        for i, symbol1 in enumerate(symbols):
            correlations[symbol1] = {}
            for j, symbol2 in enumerate(symbols):
                correlations[symbol1][symbol2] = float(correlation_matrix[i, j])
        
        log_api_call("/api/analytics/correlations", "GET", 0.08, 200)
        
        return {
            "correlations": correlations,
            "symbols": symbols,
            "timestamp": time.time()
        }
        
    except Exception as e:
        log_error("correlations_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/performance-metrics")
async def get_performance_metrics():
    """Get real-time performance metrics"""
    try:
        from backend.analytics.realtime_stream import stream_manager
        
        metrics = {
            "active_connections": len(stream_manager.connections),
            "active_subscriptions": sum(len(subs) for subs in stream_manager.subscriptions.values()),
            "cached_symbols": len(stream_manager.market_data_cache),
            "message_rate": stream_manager.message_count,
            "uptime": time.time() - stream_manager.last_performance_check,
            "latency_avg": np.mean(stream_manager.latency_measurements) if stream_manager.latency_measurements else 0,
            "timestamp": time.time()
        }
        
        log_api_call("/api/analytics/performance-metrics", "GET", 0.02, 200)
        return metrics
        
    except Exception as e:
        log_error("performance_metrics_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time data
@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data streaming"""
    # Check origin for CORS
    origin = websocket.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174",
        "http://127.0.0.1:5174", "http://localhost:5176", "http://127.0.0.1:5176",
        "http://localhost:5178", "http://127.0.0.1:5178"
    ]
    
    if origin and origin not in allowed_origins:
        await websocket.close(code=1008, reason="Origin not allowed")
        return
    
    await websocket.accept()
    
    try:
        from backend.analytics.realtime_stream import stream_manager
        
        # Add to connections
        stream_manager.connections.add(websocket)
        app_logger.log_system_event("websocket_connect", f"WebSocket client connected via FastAPI. Total: {len(stream_manager.connections)}")
        
        # Send initial data
        await stream_manager._send_initial_data(websocket)
        
        while True:
            # Handle incoming messages
            try:
                data = await websocket.receive_text()
                await stream_manager._handle_client_message(websocket, data)
            except Exception as e:
                app_logger.log_system_event("websocket_error", f"WebSocket message error: {e}")
                break

    except Exception as e:
        app_logger.log_system_event("websocket_error", f"WebSocket connection error: {e}")
    finally:
        # Clean up
        if hasattr(stream_manager, 'connections'):
            stream_manager.connections.discard(websocket)
        for symbol_subs in getattr(stream_manager, 'subscriptions', {}).values():
            symbol_subs.discard(websocket)
        app_logger.log_system_event("websocket_disconnect", "WebSocket client disconnected")


# WebSocket endpoint for market data (ticker + orderbook + signals)
@app.websocket("/ws/market")
async def websocket_market(websocket: WebSocket):
    """
    WebSocket endpoint for real-time market data.
    Sends: ticker, orderBook, and signal updates
    """
    # Check origin for CORS
    origin = websocket.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174",
        "http://127.0.0.1:5174", "http://localhost:5176", "http://127.0.0.1:5176",
        "http://localhost:5178", "http://127.0.0.1:5178"
    ]
    
    if origin and origin not in allowed_origins:
        await websocket.close(code=1008, reason="Origin not allowed")
        return
    
    await manager.connect(websocket)
    app_logger.log_system_event("websocket_connect", "Client connected to /ws/market")

    try:
        symbol = "BTCUSDT"
        signal_counter = 0

        while True:
            try:
                # Get REAL ticker data from Binance via data_manager
                market_data = await data_manager.get_market_data(symbol)

                if market_data:
                    # Send ticker frame with REAL data
                    ticker_data = {
                        "type": "ticker",
                        "symbol": symbol,
                        "bid": float(market_data.get("bidPrice", 0)),
                        "ask": float(market_data.get("askPrice", 0)),
                        "last": float(market_data.get("lastPrice", 0))
                    }
                    await websocket.send_json(ticker_data)

                await asyncio.sleep(1)

                # Get REAL orderbook from Binance
                try:
                    orderbook = await binance_client.get_orderbook(symbol, limit=10)
                    if orderbook and 'bids' in orderbook and 'asks' in orderbook:
                        # Send orderbook frame with REAL data
                        orderbook_data = {
                            "type": "orderbook",
                            "bids": [[str(price), str(qty)] for price, qty in orderbook['bids']],
                            "asks": [[str(price), str(qty)] for price, qty in orderbook['asks']]
                        }
                        await websocket.send_json(orderbook_data)
                except Exception as ob_error:
                    app_logger.log_system_event("ws_orderbook_error", f"Orderbook fetch failed: {ob_error}")

                await asyncio.sleep(1)

                # Send REAL signal from scoring engine every 10 iterations (~20 seconds)
                signal_counter += 1
                if signal_counter >= 10 and scoring_engine is not None:
                    try:        # Get real news data from external sources
        news_texts = []
        try:
            # This would fetch real news from external APIs
            # For now, return empty to avoid fake data
            pass         result = await scoring_engine.analyze(symbol, ohlcv_data)
                            if result and 'signal' in result:
                                signal_data = {
                                    "type": "signal",
                                    "symbol": symbol,
                                    "timeframe": result.get("timeframe", "15m"),
                                    "direction": result['signal'],
                                    "confidence": int(result.get("confidence", 0) * 100)
                                }
                                await websocket.send_json(signal_data)
                                signal_counter = 0
                    except Exception as sig_error:
                        app_logger.log_system_event("ws_signal_error", f"Signal generation failed: {sig_error}")
                        signal_counter = 0

            except Exception as loop_error:
                app_logger.log_system_event("ws_loop_error", f"WebSocket loop error: {loop_error}")
                await asyncio.sleep(2)  # Wait before retry
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        app_logger.log_system_event("websocket_disconnect", "Client disconnected from /ws/market")
    except Exception as e:
        manager.disconnect(websocket)
        log_error("websocket_market_error", str(e))


# Hugging Face AI endpoints
@app.get("/api/ai/sentiment/{symbol}")
async def analyze_sentiment(symbol: str):
    """Analyze market sentiment for a symbol"""
    try:
        from backend.analytics.huggingface_ai import huggingface_ai
        
        # Get recent news (mock data for demo)
        news_texts = [
            f"{symbol} shows strong performance amid market volatility",
            f"Analysts upgrade {symbol} price target following earnings",
            f"Market uncertainty affects                'change_24h': None,  # No real data available
                'volatility': None   # No real data available  log_api_call(f"/a        else:
            # Return null data if not available
            market_data = {
                'symbol': symbol,
                'price': None,sentiment_analysis_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/market-analysis")
async def generate_market_analysis(request: dict):
    """Generate AI-powered market analysis"""
    try:
        from backend.analytics.huggingface_ai import huggingface_ai
        
        symbol = request.get('symbol')
        market_data = request.get('market_data', {})
        
        if not symbol:
            raise HTTPException(status_code=400, detail="Symbol is required")
        
        analysis = await huggingface_ai.generate_market_analysis(market_data)
        log_api_call("/api/ai/market-analysis", "POST", 0.35, 200)
        
        return {
            "symbol": symbol,
            "analysis": analysis,
            "timestamp": time.time()
        }
        
    except Exception as e:
        log_error("market_analysis_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/insights/{symbol}")
async def get_trading_insights(symbol: str):
    """Get comprehensive AI-powered trading insights"""
    try:
        from backend.analytics.huggingface_ai import huggingface_ai
        from backend.analytics.realtime_stream import stream_manager
        
        # Get current market data
        market_data = {}
        if symbol in stream_manager.market_data_cache:
            cached_data = stream_manager.market_data_cache[symbol]
            market_data = {
                'symbol': symbol,
                'price': cached_data.price,
                'volume': cached_data.volume,
                'change_24h': (cached_data.price - 100) / 100 * 100,  # Mock calculation
                'volatility': 0.03  # Mock volatility
            }
        else:
            # Mock data if not available
            market_data = {
                'symbol': symbol,
                'price': 100.0,
                'volume': 1000000,
                'change_24h': 2.5,
                'volatility': 0.03
            }
        
        insights = await huggingface_ai.generate_trading_insights(symbol, market_data)
        log_api_call(f"/api/ai/insights/{symbol}", "GET", 0.45, 200)
        
        return insights
        
    except Exception as e:
        log_error("trading_insights_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/summarize-news")
async def summarize_news(request: dict):
    """Summarize financial news articles"""
    try:
        from backend.analytics.huggingface_ai import huggingface_ai
        
        news_texts = request.get('news_texts', [])
        if not news_texts:
            raise HTTPException(status_code=400, detail="news_texts is required")
        
        summaries = await huggingface_ai.summarize_news(news_texts)
        log_api_call("/api/ai/summarize-news", "POST", 0.30, 200)
        
        return {
            "summaries": summaries,
            "count": len(summaries),
            "timestamp": time.time()
        }
        
    except Exception as e:
        log_error("news_summarization_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/ask-question")
async def ask_market_question(request: dict):
    """Ask questions about market data using AI"""
    try:
        from backend.analytics.huggingface_ai import huggingface_ai
        
        question = request.get('question')
        context = request.get('context')
        
        if not question or not context:
            raise HTTPException(status_code=400, detail="Both question and context are required")
        
        answer = await huggingface_ai.answer_market_question(question, context)
        log_api_call("/api/ai/ask-question", "POST", 0.25, 200)
        
        return {
            "question": question,
            "answer": answer,
            "timestamp": time.time()
        }
        
    except Exception as e:
        log_error("question_answering_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Phase 3 Advanced Pattern Detectors API Endpoints

@app.get("/api/analytics/phase3/comprehensive/{symbol}")
async def get_phase3_comprehensive_analysis(symbol: str, interval: str = "1h", limit: int = 200):
    """Get comprehensive Phase 3 analysis with all advanced pattern detectors"""
    try:
        # Get OHLCV data
        ohlcv_data = await data_manager.get_ohlcv_data(symbol, interval, limit)
        
        if ohlcv_data is None or len(ohlcv_data) < 50:
            raise HTTPException(status_code=400, detail="Insufficient data for analysis")
        
        # Convert to DataFrame
        df = pd.DataFrame(ohlcv_data)
        df.set_index('timestamp', inplace=True)
        
        # Run comprehensive Phase 3 analysis
        analysis_result = await phase3_analytics_engine.analyze_comprehensive(df)
        
        log_api_call(f"/api/analytics/phase3/comprehensive/{symbol}", "GET", 0.45, 200)
        
        return {
            "symbol": symbol,
            "analysis": analysis_result,
            "data_points": len(ohlcv_data),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        log_error("phase3_comprehensive_analysis_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/phase3/harmonic/{symbol}")
async def get_harmonic_analysis(symbol: str, interval: str = "1h", limit: int = 200):
    """Get harmonic pattern analysis for a symbol"""
    try:
        # Get OHLCV data
        ohlcv_data = await data_manager.get_ohlcv_data(symbol, interval, limit)
        
        if ohlcv_data is None or len(ohlcv_data) < 100:
            raise HTTPException(status_code=400, detail="Insufficient data for harmonic analysis")
        
        # Convert to list format
        ohlcv_list = []
        for bar in ohlcv_data:
            ohlcv_list.append({
                'open': float(bar['open']),
                'high': float(bar['high']),
                'low': float(bar['low']),
                'close': float(bar['close']),
                'volume': float(bar['volume'])
            })
        
        # Run harmonic analysis
        result = await phase3_analytics_engine.harmonic_detector.detect(ohlcv_list)
        
        log_api_call(f"/api/analytics/phase3/harmonic/{symbol}", "GET", 0.35, 200)
        
        return {
            "symbol": symbol,
            "harmonic_analysis": {
                "score": result.score,
                "confidence": result.confidence,
                "direction": result.direction,
                "pattern": result.meta.get('pattern'),
                "completion": result.meta.get('completion', 0),
                "targets": result.meta.get('targets', []),
                "points": result.meta.get('points', {})
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        log_error("harmonic_analysis_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/phase3/elliott/{symbol}")
async def get_elliott_analysis(symbol: str, interval: str = "1h", limit: int = 200):
    """Get Elliott Wave analysis for a symbol"""
    try:
        # Get OHLCV data
        ohlcv_data = await data_manager.get_ohlcv_data(symbol, interval, limit)
        
        if ohlcv_data is None or len(ohlcv_data) < 150:
            raise HTTPException(status_code=400, detail="Insufficient data for Elliott Wave analysis")
        
        # Convert to list format
        ohlcv_list = []
        for bar in ohlcv_data:
            ohlcv_list.append({
                'open': float(bar['open']),
                'high': float(bar['high']),
                'low': float(bar['low']),
                'close': float(bar['close']),
                'volume': float(bar['volume'])
            })
        
        # Run Elliott Wave analysis
        result = await phase3_analytics_engine.elliott_detector.detect(ohlcv_list)
        
        log_api_call(f"/api/analytics/phase3/elliott/{symbol}", "GET", 0.40, 200)
        
        return {
            "symbol": symbol,
            "elliott_analysis": {
                "score": result.score,
                "confidence": result.confidence,
                "direction": result.direction,
                "current_wave": result.meta.get('current_wave'),
                "wave_count": result.meta.get('wave_count', []),
                "forecast": result.meta.get('forecast', {}),
                "degree": result.meta.get('degree')
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        log_error("elliott_analysis_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/phase3/smc/{symbol}")
async def get_smc_analysis(symbol: str, interval: str = "1h", limit: int = 200):
    """Get Smart Money Concepts analysis for a symbol"""
    try:
        # Get OHLCV data
        ohlcv_data = await data_manager.get_ohlcv_data(symbol, interval, limit)
        
        if ohlcv_data is None or len(ohlcv_data) < 50:
            raise HTTPException(status_code=400, detail="Insufficient data for SMC analysis")
        
        # Convert to list format
        ohlcv_list = []
        for bar in ohlcv_data:
            ohlcv_list.append({
                'open': float(bar['open']),
                'high': float(bar['high']),
                'low': float(bar['low']),
                'close': float(bar['close']),
                'volume': float(bar['volume'])
            })
        
        # Run SMC analysis
        result = await phase3_analytics_engine.smc_detector.detect(ohlcv_list)
        
        log_api_call(f"/api/analytics/phase3/smc/{symbol}", "GET", 0.30, 200)
        
        return {
            "symbol": symbol,
            "smc_analysis": {
                "score": result.score,
                "confidence": result.confidence,
                "direction": result.direction,
                "bos": result.meta.get('bos', False),
                "choch": result.meta.get('choch', False),
                "order_blocks_count": result.meta.get('order_blocks_count', 0),
                "fvg_count": result.meta.get('fvg_count', 0),
                "nearest_ob": result.meta.get('nearest_ob'),
                "bos_details": result.meta.get('bos_details'),
                "choch_details": result.meta.get('choch_details')
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        log_error("smc_analysis_error", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/phase3/status")
async def get_phase3_status():
    """Get status of all Phase 3 detectors"""
    try:
        return {
            "phase3_detectors": {
                "harmonic_detector": "active",
                "elliott_detector": "active", 
                "smc_detector": "active"
            },
            "integration_status": "complete",
            "api_endpoints": [
                "/api/analytics/phase3/comprehensive/{symbol}",
                "/api/analytics/phas    # Use real data aggregator and scoring engine
    from backend.scoring.engine import DynamicScoringEngine
    from backend.scoring.scanner import MultiTimeframeScanner
    
    # Initialize real services - will be available when real data sources are configured
    mtf_scanner = Noneground
#         import asyncio
#         asyncio.create_task(stream_manager.start_server('localhost', 8765))
#         
#         app_logger.log_system_event("startup", "Real-time analytics and AI services started")
#         
#     except Exception as e:
#         app_logger.log_system_event("startup_error", f"Failed to start analytics services: {e}")
#
# @app.on_event("shutdown")
# async def shutdown_event():
#     """Clean up on shutdown"""
#     try:
#         from backend.analytics.realtime_stream import stream_manager
#         await stream_manager.stop()
#         app_logger.log_system_event("shutdown", "Analytics services stopped")
#     except Exception as e:
#         app_logger.log_system_event("shutdown_error", f"Error stopping analytics services: {e}")

# ===============================
# PHASE 5 & 6 API ENDPOINTS
# ===============================

# DISABLED - Phase 5 & 6 modules not available
# Import Phase 5 & 6 modules
MultiTimeframeScanner = None
ScanRule = None
ScanResult = None
EnhancedRiskManager = None
PositionSize = None
RiskLimits = None

# Initialize Phase 5 & 6 services
try:
    # Create mock data aggregator and scoring engine for scanner
    class MockDataAggregator:
        async def get_ohlcv_data(self, symbol, timeframe, limit):
            # Use existing data manager
            return await data_manager.get_ohlcv_data(symbol, timeframe, limit)
    
    class MockScoringEngine:
        async def score(self, ohlcv, context=None):
            # Use existing scoring logic
            core_signal = generate_rsi_macd_signal(ohlcv)
            return {
                'final_score': core_signal.get('score', 0.5),
                'direction': 'BULLISH' if core_signal.get('score', 0.5) > 0.6 else 'BEARISH' if core_signal.get('score', 0.5) < 0.4 else 'NEUTRAL',
                'confidence': abs(core_signal.get('score', 0.5) - 0.5) * 2
            }
    
    class MockWeights:
        pass
    
    # Initialize services
    mock_data_aggregator = MockDataAggregator()
    mock_scoring_engine = MockScoringEngine()
    mock_weights = MockWeights()
    
    mtf_scanner = MultiTimeframeScanner(mock_data_aggregator, mock_scoring_engine, mock_weights)
    enhanced_risk_manager = EnhancedRiskManager(10000.0)
    
    print("Phase 5 & 6 services initialized successfully")
except Exception as e:
    print(f"Warning: Could not initialize Phase 5/6 services: {e}")
    mtf_scanner = None
    enhanced_risk_manager = None

# Phase 5: Multi-Timeframe Scanner Endpoints
@app.post("/api/scanner/run")
async def run_mtf_scanner(request: dict):
    """Run multi-timeframe scanner across multiple symbols"""
    try:
        if not mtf_scanner:
            raise HTTPException(status_code=500, detail="Scanner not available")
        
        symbols = request.get('symbols', ['BTCUSDT', 'ETHUSDT', 'ADAUSDT'])
        timeframes = request.get('timeframes', ['15m', '1h', '4h'])
        
        # Create scan rules
        rules = ScanRule(
            mode=request.get('mode', 'conservative'),
            any_tf_threshold=request.get('any_tf_threshold', 0.65),
            majority_tf_threshold=request.get('majority_tf_threshold', 0.60),
            min_confidence=request.get('min_confidence', 0.5),
            exclude_neutral=request.get('exclude_neutral', True)
        )
        
        # Run scanner
        results = await mtf_scanner.scan(symbols, timeframes, rules)
        
        # Convert results to dict format
        scan_results = []
        for result in results:
            scan_results.append({
                "symbol": result.symbol,
                "overall_score": result.overall_score,
                "overall_direction": result.overall_direction,
                "consensus_strength": result.consensus_strength,
                "recommended_action": result.recommended_action,
                "risk_level": result.risk_level,
                "timeframe_breakdown": {
                    tf: {
                        "final_score": score.final_score,
                        "direction": score.direction,
                        "confidence": score.confidence,
                        "components": score.components
                    }
                    for tf, score in result.timeframe_scores.items()
                }
            })
        
        return {
            "status": "success",
            "scan_time": datetime.now().isoformat(),
            "symbols_scanned": len(symbols),
            "opportunities_found": len(scan_results),
            "results": scan_results
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"Scanner endpoint failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scanner/symbol/{symbol}")
async def scan_single_symbol(symbol: str, timeframes: str = "15m,1h,4h"):
    """Scan a single symbol across multiple timeframes"""
    try:
        if not mtf_scanner:
            raise HTTPException(status_code=500, detail="Scanner not available")
        
        tf_list = timeframes.split(',')
        results = await mtf_scanner.scan([symbol], tf_list)
        
        if not results:
            return {"status": "no_data", "message": f"No scan results for {symbol}"}
        
        result = results[0]
        return {
            "status": "success",
            "symbol": symbol,
            "overall_score": result.overall_score,
            "overall_direction": result.overall_direction,
            "consensus_strength": result.consensus_strength,
            "recommended_action": result.recommended_action,
            "risk_level": result.risk_level,
            "timeframe_breakdown": {
                tf: {
                    "final_score": score.final_score,
                    "direction": score.direction,
                    "confidence": score.confidence,
                    "components": score.components
                }
                for tf, score in result.timeframe_scores.items()
            }
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"Single symbol scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Phase 6: Enhanced Risk Management Endpoints
@app.post("/api/risk/calculate-position")
async def calculate_position_size(request: dict):
    """Calculate position size using enhanced risk management"""
    try:
        if not enhanced_risk_manager:
            raise HTTPException(status_code=500, detail="Risk manager not available")
        
        symbol = request.get('symbol')
        entry_price = request.get('entry_price')
        stop_loss = request.get('stop_loss')
        score = request.get('score', {})
        atr = request.get('atr', 0.01)
        structure_levels = request.get('structure_levels')
        
        if not all([symbol, entry_price, stop_loss]):
            raise HTTPException(status_code=400, detail="Missing required parameters")
        
        position = enhanced_risk_manager.calculate_position_size(
            symbol, entry_price, stop_loss, score, atr, structure_levels
        )
        
        if not position:
            return {
                "status": "rejected",
                "reason": "Risk limits exceeded",
                "risk_status": enhanced_risk_manager.get_risk_status()
            }
        
        return {
            "status": "success",
            "position": {
                "symbol": position.symbol,
                "quantity": position.quantity,
                "entry_price": position.entry_price,
                "stop_loss": position.stop_loss,
                "take_profit": position.take_profit,
                "risk_amount": position.risk_amount,
                "risk_pct": position.risk_pct,
                "r_multiple": position.r_multiple,
                "max_leverage": position.max_leverage
            },
            "risk_status": enhanced_risk_manager.get_risk_status()
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"Position calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/risk/calculate-stop-loss")
async def calculate_stop_loss(request: dict):
        # Return empty portfolio data if no real data available
        portfolio = {
            'portfolio_value': 0,
            'open_positions': []
        }
        
        # Return empty current prices
        current_prices = {}1)
        structure_levels = request.get('structure_levels')
        
        if not all([entry_price, direction]):
            raise HTTPException(status_code=400, detail="Missing required parameters")
        
        stop_loss = enhanced_risk_manager.calculate_stop_loss(
            entry_price, direction, atr, structure_levels
        )
        
        return {
            "status": "success",
            "stop_loss": stop_loss,
            "entry_price": entry_price,
            "direction": direction,
            "atr": atr
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"Stop loss calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/risk/check-correlation")
async def check_correlation_limits(request: dict):
    """Check correlation limits for new position"""
    try:
        if not enhanced_risk_manager:
            raise HTTPException(status_code=500, detail="Risk manager not available")
        
        new_position = request.get('new_position', {})
        existing_positions = request.get('existing_positions', [])
        
        correlation_check = enhanced_risk_manager.check_correlation_limits(
            new_position, existing_positions
        )
        
        return {
            "status": "success",
            "correlation_check": correlation_check,
            "risk_limits": {
                "max_correlation": enhanced_risk_manager.limits.max_correlation,
                "max_positions": enhanced_risk_manager.limits.max_positions
            }
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"Correlation check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/risk/portfolio-assessment")
async def get_portfolio_risk_assessment():
    """Get comprehensive portfolio risk assessment"""
    try:
        if not enhanced_risk_manager:
            raise HTTPException(status_code=500, detail="Risk manager not available")
        
        # Mock portfolio data
        portfolio = {
            'portfolio_value': enhanced_risk_manager.portfolio_value,
            'open_positions': list(enhanced_risk_manager.active_positions.values())
        }
        
        # Mock current prices
        current_prices = {
            'BTCUSDT': 45000,
            'ETHUSDT': 3000,
            'ADAUSDT': 0.5
        }
        
        risk_assessment = enhanced_risk_manager.assess_portfolio_risk(
            portfolio, current_prices
        )
        
        return {
            "status": "success",
            "risk_assessment": risk_assessment,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"Portfolio assessment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/risk/var")
async def calculate_portfolio_var(confidence: float = 0.95):
    """Calculate portfolio Value at Risk"""
    try:
        if not enhanced_risk_manager:
            raise HTTPException(status_code=500, detail="Risk manager not available")
        
        # Get current positions
        positions = list(enhanced_risk_manager.active_positions.values())
        
        var_result = enhanced_risk_manager.calculate_portfolio_var(positions, confidence)
        
        return {
            "status": "success",
            "var_analysis": var_result,
            "confidence": confidence,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"VaR calculation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/risk/status")
async def get_enhanced_risk_status():
    """Get enhanced risk management status"""
    try:
        if not enhanced_risk_manager:
            raise HTTPException(status_code=500, detail="Risk manager not available")
        
        risk_status = enhanced_risk_manager.get_risk_status()
        
        return {
            "status": "success",
            "risk_status": risk_status,
            "limits": {
                "max_risk_per_trade": enhanced_risk_manager.limits.max_risk_per_trade,
                "max_risk_per_day": enhanced_risk_manager.limits.max_risk_per_day,
                "max_positions": enhanced_risk_manager.limits.max_positions,
                "max_correlation": enhanced_risk_manager.limits.max_correlation,
                "max_single_asset": enhanced_risk_manager.limits.max_single_asset,
                "max_drawdown": enhanced_risk_manager.limits.max_drawdown,
                "max_var_95": enhanced_risk_manager.limits.max_var_95,
                "max_leverage": enhanced_risk_manager.limits.max_leverage
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"Risk status failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/risk/limits")
async def update_risk_limits(request: dict):
    """Update risk management limits"""
    try:
        if not enhanced_risk_manager:
            raise HTTPException(status_code=500, detail="Risk manager not available")
        
        # Update limits
        if 'max_risk_per_trade' in request:
            enhanced_risk_manager.limits.max_risk_per_trade = float(request['max_risk_per_trade'])
        if 'max_risk_per_day' in request:
            enhanced_risk_manager.limits.max_risk_per_day = float(request['max_risk_per_day'])
        if 'max_positions' in request:
            enhanced_risk_manager.limits.max_positions = int(request['max_positions'])
        if 'max_correlation' in request:
            enhanced_risk_manager.limits.max_correlation = float(request['max_correlation'])
        if 'max_single_asset' in request:
            enhanced_risk_manager.limits.max_single_asset = float(request['max_single_asset'])
        if 'max_drawdown' in request:
            enhanced_risk_manager.limits.max_drawdown = float(request['max_drawdown'])
        if 'max_var_95' in request:
            enhanced_risk_manager.limits.max_var_95 = float(request['max_var_95'])
        if 'max_leverage' in request:
            enhanced_risk_manager.limits.max_leverage = float(request['max_leverage'])
        
        return {
            "status": "success",
            "message": "Risk limits updated successfully",
            "updated_limits": {
                "max_risk_per_trade": enhanced_risk_manager.limits.max_risk_per_trade,
                "max_risk_per_day": enhanced_risk_manager.limits.max_risk_per_day,
                "max_positions": enhanced_risk_manager.limits.max_positions,
                "max_correlation": enhanced_risk_manager.limits.max_correlation,
                "max_single_asset": enhanced_risk_manager.limits.max_single_asset,
                "max_drawdown": enhanced_risk_manager.limits.max_drawdown,
                "max_var_95": enhanced_risk_manager.limits.max_var_95,
                "max_leverage": enhanced_risk_manager.limits.max_leverage
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"Risk limits update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/risk/reset-daily")
async def reset_daily_risk_metrics():
    """Reset daily risk metrics"""
    try:
        if not enhanced_risk_manager:
            raise HTTPException(status_code=500, detail="Risk manager not available")
        
        enhanced_risk_manager.reset_daily_metrics()
        
        return {
            "status": "success",
            "message": "Daily risk metrics reset",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        app_logger.log_system_event("error", f"Daily reset failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# Demo System Integration (from demo_phase4.py)
@app.get("/api/demo/phase4")
async def demo_phase4():
    """Run Phase 4 demo system"""
    try:
        from backend.demo_phase4 import run_demo
        result = await run_demo()
        return {
            "status": "success",
            "demo_result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo failed: {str(e)}")

@app.get("/api/demo/phase4/status")
async def demo_status():
    """Get demo system status"""
    return {
        "status": "ready",
        "endpoints": ["/api/demo/phase4"],
        "description": "Phase 4 Demo System - Complete demonstration of scoring system",
        "features": [
            "Realistic data generation for multiple symbols",
            "Individual detector analysis with 9 signal types",
            "Context-aware scoring with market regime detection",
            "Multi-timeframe aggregation and consensus building",
            "Weight optimization and configuration testing"
        ]
    }

# Testing Framework Integration
@app.get("/api/test/phase4")
async def test_phase4():
    """Run Phase 4 comprehensive tests"""
    try:
        from backend.test_phase4_final import run_tests
        result = await run_tests()
        return {
            "status": "success",
            "test_result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tests failed: {str(e)}")

@app.get("/api/test/simple")
async def test_simple():
    """Run simple Phase 4 tests"""
    try:
        from backend.test_phase4_simple import run_simple_tests
        result = await run_simple_tests()
        return {
            "status": "success",
            "test_result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simple tests failed: {str(e)}")

@app.get("/api/test/phases")
async def test_phases():
    """Run Phase 5 & 6 tests"""
    try:
        from backend.test_phases import run_phase_tests
        result = await run_phase_tests()
        return {
            "status": "success",
            "test_result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Phase tests failed: {str(e)}")

# Verification System Integration
@app.get("/api/verify/implementation")
async def verify_implementation():
    """Verify implementation completeness"""
    try:
        from verify_implementation import verify_all
        result = await verify_all()
        return {
            "status": "success",
            "verification_result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.get("/api/verify/health")
async def verify_health():
    """Health check with verification"""
    try:
        from verify_implementation import health_check
        result = await health_check()
        return {
            "status": "success",
            "health_result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

# WebSocket Test Integration
@app.websocket("/ws/test")
async def websocket_test(websocket: WebSocket):
    """WebSocket test endpoint"""
    await websocket.accept()
    try:
        await websocket.send_text("WebSocket connection successful")
        await asyncio.sleep(1)
        await websocket.send_text("Test message 1")
        await asyncio.sleep(1)
        await websocket.send_text("Test message 2")
        await asyncio.sleep(1)
        await websocket.send_text("WebSocket test completed")
    except Exception as e:
        print(f"WebSocket test error: {e}")
    finally:
        await websocket.close()

@app.get("/api/test/websocket")
async def test_websocket():
    """Test WebSocket connection"""
    try:
        from scripts.test_ws import test_connection
        result = await test_connection()
        return {
            "status": "success",
            "test_result": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WebSocket test failed: {str(e)}")

# Include enhanced API routes (Phases 7, 8, 9)
# app.include_router(enhanced_router)


# Mount frontend static files (for production deployment, e.g., HF Spaces)
# This serves the built frontend from the dist/ directory
# Note: API routes take precedence, so this should be last
from pathlib import Path
dist_path = Path(__file__).parent.parent / "dist"
if dist_path.exists():
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

# Missing endpoints that frontend expects
@app.get("/api/trading/signal-positions")
async def get_signal_positions():
    return {"positions": [], "alerts": [], "message": "No real signal positions available"}

@app.get("/api/trading/risk-snapshot")
async def get_risk_snapshot():
    return {"metrics": [], "positionRisks": [], "alerts": [], "overallRiskScore": None, "portfolioVar": None, "maxDrawdown": None, "sharpeRatio": None, "message": "No real risk data available"}

@app.get("/api/market/whale-activity/{symbol}")
async def get_whale_activity(symbol: str):
    return {"score": None, "activity": None, "largeBuys": 0, "largeSells": 0, "message": "No real whale activity data available"}

@app.get("/api/market/sentiment/{symbol}")
async def get_market_sentiment(symbol: str):
    return {"score": None, "mood": None, "socialVolume": 0, "newsSentiment": None, "message": "No real sentiment data available"}

@app.get("/api/analytics/market-depth/{symbol}")
async def get_market_depth(symbol: str):
    return {"bids": [], "asks": [], "symbol": symbol, "message": "No real market depth data available"}


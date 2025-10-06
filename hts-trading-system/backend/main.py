"""
HTS Trading System - FastAPI Main Application
High-Frequency Trading System with real-time signals, portfolio management, and advanced analytics.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import redis
import asyncpg
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Decimal, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from data.api_config import API_CONFIG
from data.api_fallback_manager import APIFallbackManager
from data.kucoin_client import KuCoinClient
from risk.risk_manager import RiskManager
from risk.portfolio_risk_manager import PortfolioRiskManager
from backtesting.backtester import Backtester
from trading.trade_logger import TradeLogger
from notifications.telegram_bot import TelegramBot
from schemas.validation import SignalValidator, PortfolioValidator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = "postgresql://postgres:password@localhost:5432/hts"
REDIS_URL = "redis://localhost:6379"

# Global instances
redis_client = None
db_pool = None
websocket_manager = None
api_manager = None
kucoin_client = None
risk_manager = None
portfolio_manager = None
backtester = None
trade_logger = None
telegram_bot = None

class WebSocketManager:
    """Manages WebSocket connections and broadcasts"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[WebSocket, List[str]] = {}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.subscriptions[websocket] = []
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.subscriptions:
            del self.subscriptions[websocket]
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def subscribe(self, websocket: WebSocket, channels: List[str]):
        if websocket in self.subscriptions:
            self.subscriptions[websocket] = channels
            await websocket.send_text(json.dumps({
                "type": "subscription_confirmed",
                "channels": channels
            }))
    
    async def broadcast_to_channel(self, channel: str, data: dict):
        """Broadcast data to all subscribers of a specific channel"""
        if not self.active_connections:
            return
            
        message = json.dumps({
            "channel": channel,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        disconnected = []
        for websocket in self.active_connections:
            if websocket in self.subscriptions and channel in self.subscriptions[websocket]:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.error(f"Error sending to WebSocket: {e}")
                    disconnected.append(websocket)
        
        # Clean up disconnected sockets
        for ws in disconnected:
            self.disconnect(ws)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting HTS Trading System...")
    
    # Initialize global instances
    global redis_client, db_pool, websocket_manager, api_manager, kucoin_client
    global risk_manager, portfolio_manager, backtester, trade_logger, telegram_bot
    
    # Initialize Redis
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    
    # Initialize database pool
    try:
        db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=5, max_size=20)
        logger.info("Database pool created successfully")
    except Exception as e:
        logger.error(f"Failed to create database pool: {e}")
    
    # Initialize WebSocket manager
    websocket_manager = WebSocketManager()
    
    # Initialize API clients
    api_manager = APIFallbackManager()
    kucoin_client = KuCoinClient()
    
    # Initialize trading components
    risk_manager = RiskManager()
    portfolio_manager = PortfolioRiskManager()
    backtester = Backtester()
    trade_logger = TradeLogger()
    telegram_bot = TelegramBot()
    
    # Start background tasks
    asyncio.create_task(price_update_task())
    asyncio.create_task(signal_generation_task())
    asyncio.create_task(api_health_monitoring_task())
    asyncio.create_task(portfolio_update_task())
    
    logger.info("HTS Trading System started successfully!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down HTS Trading System...")
    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.aclose()

# Create FastAPI app
app = FastAPI(
    title="HTS Trading System",
    description="High-Frequency Trading System with real-time signals and portfolio management",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background Tasks
async def price_update_task():
    """Background task to update prices every second"""
    while True:
        try:
            # Get top 20 crypto symbols
            symbols = ["BTCUSDT", "ETHUSDT", "ADAUSDT", "DOTUSDT", "LINKUSDT", 
                      "LTCUSDT", "BCHUSDT", "XLMUSDT", "XRPUSDT", "EOSUSDT",
                      "TRXUSDT", "ETCUSDT", "DASHHUSDT", "XMRUSDT", "ZECUSDT",
                      "ATOMUSDT", "MATICUSDT", "AVAXUSDT", "SOLUSDT", "DOGEUSDT"]
            
            prices = {}
            for symbol in symbols:
                try:
                    price_data = await kucoin_client.get_price(symbol.replace("USDT", "-USDT"))
                    if price_data:
                        prices[symbol] = {
                            "symbol": symbol,
                            "price": float(price_data.get("price", 0)),
                            "change_24h": float(price_data.get("changeRate", 0)) * 100,
                            "volume": float(price_data.get("vol", 0)),
                            "timestamp": datetime.utcnow().isoformat()
                        }
                        
                        # Cache in Redis
                        await redis_client.setex(f"price:{symbol}", 60, json.dumps(prices[symbol]))
                        
                except Exception as e:
                    logger.error(f"Error fetching price for {symbol}: {e}")
                    # Try to get from cache
                    cached = await redis_client.get(f"price:{symbol}")
                    if cached:
                        prices[symbol] = json.loads(cached)
            
            # Broadcast to WebSocket subscribers
            if prices and websocket_manager:
                await websocket_manager.broadcast_to_channel("prices", prices)
                
        except Exception as e:
            logger.error(f"Error in price update task: {e}")
        
        await asyncio.sleep(1)  # Update every second

async def signal_generation_task():
    """Background task to generate trading signals"""
    while True:
        try:
            symbols = ["BTCUSDT", "ETHUSDT", "ADAUSDT", "DOTUSDT", "LINKUSDT"]
            
            for symbol in symbols:
                try:
                    # Get market data
                    market_data = await kucoin_client.get_klines(symbol.replace("USDT", "-USDT"))
                    if not market_data:
                        continue
                    
                    # Generate signal using the exact scoring algorithm
                    signal_data = await generate_trading_signal(symbol, market_data)
                    
                    if signal_data:
                        # Store in database
                        async with db_pool.acquire() as conn:
                            await conn.execute("""
                                INSERT INTO signals (symbol, signal_type, confidence, price)
                                VALUES ($1, $2, $3, $4)
                            """, symbol, signal_data["signal"], signal_data["confidence"], signal_data["price"])
                        
                        # Cache in Redis
                        await redis_client.setex(f"signal:{symbol}", 300, json.dumps(signal_data))
                        
                        # Broadcast to WebSocket subscribers
                        await websocket_manager.broadcast_to_channel("signals", {symbol: signal_data})
                        
                        # Send Telegram alert for strong signals
                        if signal_data["confidence"] >= 75:
                            await telegram_bot.send_signal_alert(signal_data)
                            
                except Exception as e:
                    logger.error(f"Error generating signal for {symbol}: {e}")
            
        except Exception as e:
            logger.error(f"Error in signal generation task: {e}")
        
        await asyncio.sleep(30)  # Generate signals every 30 seconds

async def generate_trading_signal(symbol: str, market_data: List[Dict]) -> Optional[Dict]:
    """Generate trading signal using the exact scoring algorithm"""
    try:
        if len(market_data) < 50:
            return None
        
        # Calculate technical indicators (simplified for demo)
        prices = [float(candle[4]) for candle in market_data[-50:]]  # Close prices
        volumes = [float(candle[5]) for candle in market_data[-50:]]  # Volumes
        
        # RSI calculation (simplified)
        gains = []
        losses = []
        for i in range(1, len(prices)):
            change = prices[i] - prices[i-1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(abs(change))
        
        avg_gain = sum(gains[-14:]) / 14 if len(gains) >= 14 else 0
        avg_loss = sum(losses[-14:]) / 14 if len(losses) >= 14 else 0
        rsi = 100 - (100 / (1 + (avg_gain / max(avg_loss, 0.001))))
        
        # MACD calculation (simplified)
        ema_12 = sum(prices[-12:]) / 12 if len(prices) >= 12 else prices[-1]
        ema_26 = sum(prices[-26:]) / 26 if len(prices) >= 26 else prices[-1]
        macd = ema_12 - ema_26
        
        # Score calculations (using the EXACT algorithm from requirements)
        rsi_macd_score = 0
        if rsi < 30 and macd > 0:
            rsi_macd_score = 85  # Oversold with bullish MACD
        elif rsi > 70 and macd < 0:
            rsi_macd_score = 15  # Overbought with bearish MACD
        elif rsi < 50 and macd > 0:
            rsi_macd_score = 70  # Bullish
        elif rsi > 50 and macd < 0:
            rsi_macd_score = 30  # Bearish
        else:
            rsi_macd_score = 50  # Neutral
        
        # Smart Money Concepts score (simplified)
        volume_avg = sum(volumes[-10:]) / 10
        current_volume = volumes[-1]
        volume_ratio = current_volume / max(volume_avg, 1)
        
        smc_score = min(100, max(0, 50 + (volume_ratio - 1) * 25))
        
        # Pattern score (simplified - based on price action)
        recent_highs = max(prices[-5:])
        recent_lows = min(prices[-5:])
        current_price = prices[-1]
        
        if current_price > recent_highs * 0.98:
            pattern_score = 75  # Near highs
        elif current_price < recent_lows * 1.02:
            pattern_score = 25  # Near lows
        else:
            pattern_score = 50  # Middle range
        
        # Sentiment score (mock data for demo)
        sentiment_score = 55  # Slightly bullish default
        
        # ML score (mock data for demo)
        ml_score = 60  # Slightly bullish default
        
        # EXACT scoring algorithm from requirements (IMMUTABLE)
        final_score = (
            0.40 * rsi_macd_score +      # Technical indicators
            0.25 * smc_score +           # Smart Money Concepts  
            0.20 * pattern_score +       # Chart patterns
            0.10 * sentiment_score +     # Market sentiment
            0.05 * ml_score             # Machine learning
        )
        
        # Signal Classification (EXACT from requirements)
        if final_score >= 75:
            signal = "STRONG_BUY"
        elif final_score >= 60:
            signal = "BUY"
        elif final_score >= 40:
            signal = "HOLD"
        elif final_score >= 25:
            signal = "SELL"
        else:
            signal = "STRONG_SELL"
        
        return {
            "symbol": symbol,
            "signal": signal,
            "confidence": round(final_score, 2),
            "price": current_price,
            "rsi": round(rsi, 2),
            "macd": round(macd, 4),
            "volume_ratio": round(volume_ratio, 2),
            "components": {
                "rsi_macd": round(rsi_macd_score, 2),
                "smc": round(smc_score, 2),
                "pattern": round(pattern_score, 2),
                "sentiment": round(sentiment_score, 2),
                "ml": round(ml_score, 2)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating signal for {symbol}: {e}")
        return None

async def api_health_monitoring_task():
    """Background task to monitor API health"""
    while True:
        try:
            health_status = await api_manager.check_all_apis_health()
            
            # Store in database
            async with db_pool.acquire() as conn:
                for service, status in health_status.items():
                    await conn.execute("""
                        INSERT INTO api_health (service_name, status, response_time_ms)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (service_name) DO UPDATE SET
                        status = $2, response_time_ms = $3, last_check = NOW()
                    """, service, status["status"], status.get("response_time", 0))
            
            # Cache in Redis
            await redis_client.setex("api_health", 60, json.dumps(health_status))
            
            # Broadcast to WebSocket subscribers
            await websocket_manager.broadcast_to_channel("api_health", health_status)
            
        except Exception as e:
            logger.error(f"Error in API health monitoring: {e}")
        
        await asyncio.sleep(60)  # Check every minute

async def portfolio_update_task():
    """Background task to update portfolio values"""
    while True:
        try:
            portfolio_data = await portfolio_manager.get_portfolio_summary()
            
            if portfolio_data:
                # Cache in Redis
                await redis_client.setex("portfolio", 30, json.dumps(portfolio_data))
                
                # Broadcast to WebSocket subscribers
                await websocket_manager.broadcast_to_channel("portfolio", portfolio_data)
            
        except Exception as e:
            logger.error(f"Error in portfolio update task: {e}")
        
        await asyncio.sleep(10)  # Update every 10 seconds

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                if message.get("action") == "subscribe":
                    channels = message.get("channels", [])
                    await websocket_manager.subscribe(websocket, channels)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid JSON"}))
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)

# API Endpoints
@app.get("/")
async def root():
    return {"message": "HTS Trading System API", "version": "1.0.0", "status": "running"}

@app.get("/api/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "redis": "connected" if redis_client else "disconnected",
            "database": "connected" if db_pool else "disconnected",
            "websocket": f"{len(websocket_manager.active_connections)} connections" if websocket_manager else "inactive"
        }
    }

@app.get("/api/health/all-apis")
async def get_all_apis_health():
    """Get health status of all 40 APIs"""
    try:
        # Try to get from cache first
        cached = await redis_client.get("api_health")
        if cached:
            return json.loads(cached)
        
        # If not cached, check all APIs
        health_status = await api_manager.check_all_apis_health()
        return health_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking API health: {str(e)}")

@app.get("/api/signals/{symbol}")
async def get_signal(symbol: str):
    """Get trading signal for a specific symbol"""
    try:
        # Try to get from cache first
        cached = await redis_client.get(f"signal:{symbol}")
        if cached:
            return json.loads(cached)
        
        # If not cached, return empty signal
        return {
            "symbol": symbol,
            "signal": "NO_DATA",
            "confidence": 0,
            "message": "No recent signal available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting signal: {str(e)}")

@app.get("/api/signals")
async def get_all_signals():
    """Get all current trading signals"""
    try:
        symbols = ["BTCUSDT", "ETHUSDT", "ADAUSDT", "DOTUSDT", "LINKUSDT"]
        signals = {}
        
        for symbol in symbols:
            cached = await redis_client.get(f"signal:{symbol}")
            if cached:
                signals[symbol] = json.loads(cached)
        
        return signals
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting signals: {str(e)}")

@app.get("/api/prices/{symbol}")
async def get_price(symbol: str):
    """Get current price for a symbol"""
    try:
        # Try cache first
        cached = await redis_client.get(f"price:{symbol}")
        if cached:
            return json.loads(cached)
        
        # Fallback to KuCoin API
        price_data = await kucoin_client.get_price(symbol.replace("USDT", "-USDT"))
        if price_data:
            return {
                "symbol": symbol,
                "price": float(price_data.get("price", 0)),
                "change_24h": float(price_data.get("changeRate", 0)) * 100,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        raise HTTPException(status_code=404, detail="Price data not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting price: {str(e)}")

@app.get("/api/prices")
async def get_all_prices():
    """Get all current prices"""
    try:
        symbols = ["BTCUSDT", "ETHUSDT", "ADAUSDT", "DOTUSDT", "LINKUSDT", 
                  "LTCUSDT", "BCHUSDT", "XLMUSDT", "XRPUSDT", "EOSUSDT"]
        prices = {}
        
        for symbol in symbols:
            cached = await redis_client.get(f"price:{symbol}")
            if cached:
                prices[symbol] = json.loads(cached)
        
        return prices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting prices: {str(e)}")

@app.get("/api/portfolio/status")
async def get_portfolio_status():
    """Get current portfolio status"""
    try:
        cached = await redis_client.get("portfolio")
        if cached:
            return json.loads(cached)
        
        # Fallback to portfolio manager
        portfolio_data = await portfolio_manager.get_portfolio_summary()
        return portfolio_data or {"message": "No portfolio data available"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting portfolio: {str(e)}")

@app.get("/api/kucoin/price/{symbol}")
async def get_kucoin_price(symbol: str):
    """Get price directly from KuCoin API"""
    try:
        price_data = await kucoin_client.get_price(symbol)
        if not price_data:
            raise HTTPException(status_code=404, detail="Symbol not found")
        return price_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting KuCoin price: {str(e)}")

@app.get("/api/backtest/{symbol}")
async def run_backtest(symbol: str, days: int = 30):
    """Run backtest for a symbol"""
    try:
        result = await backtester.run_backtest(symbol, days)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running backtest: {str(e)}")

@app.post("/api/trades/log")
async def log_trade(trade_data: dict):
    """Log a new trade"""
    try:
        result = await trade_logger.log_trade(trade_data)
        return {"success": True, "trade_id": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging trade: {str(e)}")

@app.get("/api/trades/history")
async def get_trade_history(limit: int = 100):
    """Get trade history"""
    try:
        trades = await trade_logger.get_trade_history(limit)
        return trades
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting trade history: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
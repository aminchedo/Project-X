from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import aiohttp
import os
from datetime import datetime
from typing import List

app = FastAPI(title="HTS Trading System", version="1.0.0")

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
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "websocket_connections": len(manager.active_connections)
    }

@app.get("/api/health/all-apis")
async def health_all_apis():
    """Health check for all APIs"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "websocket_connections": len(manager.active_connections),
        "endpoints": {
            "pnl": "active",
            "sentiment": "active", 
            "analytics": "active",
            "websocket": "active"
        }
    }

# Sentiment API proxy endpoints to avoid CORS
@app.get("/api/sentiment/fear-greed")
async def get_fear_greed_proxy():
    """Proxy Fear & Greed Index API to avoid CORS"""
    try:
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

# Simple price endpoint using a free API
@app.get("/api/price/{symbol}")
async def get_price(symbol: str):
    """Get price data using CoinGecko API (free, no auth required)"""
    try:
        # Convert symbol to CoinGecko format
        symbol_map = {
            'BTCUSDT': 'bitcoin',
            'ETHUSDT': 'ethereum',
            'BNBUSDT': 'binancecoin',
            'ADAUSDT': 'cardano',
            'SOLUSDT': 'solana',
            'XRPUSDT': 'ripple'
        }
        
        coin_id = symbol_map.get(symbol, symbol.replace('USDT', '').lower())
        
        async with aiohttp.ClientSession() as session:
            url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true"
            async with session.get(url) as response:
                data = await response.json()
                
                if coin_id in data:
                    coin_data = data[coin_id]
                    return {
                        "symbol": symbol,
                        "price": coin_data["usd"],
                        "change_24h": coin_data.get("usd_24h_change", 0),
                        "volume_24h": coin_data.get("usd_24h_vol", 0),
                        "timestamp": datetime.now()
                    }
                else:
                    return {"error": f"No data found for {symbol}"}
    except Exception as e:
        return {"error": str(e)}

# Analytics endpoints for the dashboard
@app.get("/api/analytics/correlations")
async def get_correlations():
    """Get correlation matrix for active symbols"""
    try:
        # Mock correlation data
        symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT']
        correlations = {}
        
        for i, symbol1 in enumerate(symbols):
            correlations[symbol1] = {}
            for j, symbol2 in enumerate(symbols):
                if symbol1 == symbol2:
                    correlations[symbol1][symbol2] = 1.0
                else:
                    # Generate realistic correlations
                    base_correlation = 0.3 + (abs(i - j) * 0.1)
                    correlations[symbol1][symbol2] = min(0.9, base_correlation + (hash(symbol1 + symbol2) % 20) / 100)
        
        return {
            "correlations": correlations,
            "symbols": symbols,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/market-depth/{symbol}")
async def get_market_depth(symbol: str):
    """Get market depth data for a symbol"""
    try:
        # Mock market depth data
        bids = []
        asks = []
        
        base_price = 50000 if 'BTC' in symbol else 3000 if 'ETH' in symbol else 400
        
        for i in range(10):
            bid_price = base_price - (i + 1) * 10
            ask_price = base_price + (i + 1) * 10
            volume = 1000 - (i * 100)
            
            bids.append([bid_price, volume])
            asks.append([ask_price, volume])
        
        return {
            "symbol": symbol,
            "timestamp": datetime.now().isoformat(),
            "bids": bids,
            "asks": asks,
            "spread": asks[0][0] - bids[0][0],
            "mid_price": (asks[0][0] + bids[0][0]) / 2
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/performance-metrics")
async def get_performance_metrics():
    """Get system performance metrics"""
    try:
        return {
            "active_connections": len(manager.active_connections),
            "active_subscriptions": 0,
            "cached_symbols": 8,
            "message_rate": 150,
            "uptime": 3600,
            "latency_avg": 45.2,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/ai/insights/{symbol}")
async def get_ai_insights(symbol: str):
    """Get AI-powered trading insights"""
    try:
        return {
            "symbol": symbol,
            "timestamp": datetime.now().isoformat(),
            "technical_analysis": f"Technical analysis for {symbol} shows strong momentum indicators with RSI at 65.2 and MACD showing bullish crossover. Support levels identified at $45,000 and $42,000.",
            "sentiment_analysis": {
                "average_sentiment": 0.15,
                "sentiment_distribution": {
                    "positive": 45,
                    "negative": 25,
                    "neutral": 30
                },
                "confidence": 0.78,
                "timestamp": datetime.now().isoformat()
            },
            "recommendation": "MODERATE BUY",
            "confidence_score": 0.72,
            "risk_assessment": "Medium"
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/ai/sentiment/{symbol}")
async def get_ai_sentiment(symbol: str):
    """Get AI sentiment analysis"""
    try:
        return {
            "average_sentiment": 0.12,
            "sentiment_distribution": {
                "positive": 42,
                "negative": 28,
                "neutral": 30
            },
            "confidence": 0.75,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/ai/market-analysis")
async def generate_market_analysis(request: dict):
    """Generate AI market analysis"""
    try:
        symbol = request.get('symbol', 'BTCUSDT')
        return {
            "symbol": symbol,
            "analysis": f"Current market conditions for {symbol} indicate a consolidation phase with potential for upward breakout. Key technical levels to watch include resistance at $46,500 and support at $44,200. Volume analysis suggests institutional interest remains strong.",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/ai/ask-question")
async def ask_ai_question(request: dict):
    """Ask AI assistant a question"""
    try:
        question = request.get('question', '')
        context = request.get('context', '')
        
        # Mock AI response based on question
        if 'outlook' in question.lower():
            answer = "Based on current technical indicators and market sentiment, the outlook appears cautiously optimistic with potential for moderate gains in the near term."
        elif 'buy' in question.lower() or 'sell' in question.lower():
            answer = "Consider current risk tolerance and market conditions. The technical analysis suggests a moderate buy opportunity, but always implement proper risk management."
        elif 'risk' in question.lower():
            answer = "Key risk factors include market volatility, regulatory changes, and macroeconomic conditions. Implement stop-loss orders and position sizing based on your risk tolerance."
        else:
            answer = "Based on the available market data and technical analysis, I recommend monitoring key support and resistance levels while maintaining a balanced risk approach."
        
        return {
            "question": question,
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}

# WebSocket endpoint for real-time data
@app.websocket("/ws/realtime")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data streaming"""
    await manager.connect(websocket)
    
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection",
            "status": "connected",
            "timestamp": datetime.now().isoformat()
        }))
        
        while True:
            try:
                # Listen for incoming messages
                data = await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                message = json.loads(data)
                
                # Handle different message types
                if message.get('action') == 'subscribe':
                    # Send mock market data
                    symbols = message.get('symbols', ['BTCUSDT'])
                    for symbol in symbols:
                        price = 50000 if 'BTC' in symbol else 3000 if 'ETH' in symbol else 400
                        price += (hash(symbol) % 1000) - 500  # Add some variation
                        
                        await websocket.send_text(json.dumps({
                            "type": "market_data",
                            "data": {
                                "symbol": symbol,
                                "price": price,
                                "volume": 1000000 + (hash(symbol) % 500000),
                                "timestamp": datetime.now().isoformat()
                            }
                        }))
                
                elif message.get('action') == 'get_prediction':
                    symbol = message.get('symbol', 'BTCUSDT')
                    await websocket.send_text(json.dumps({
                        "type": "prediction_response",
                        "symbol": symbol,
                        "data": {
                            "prediction": 0.65,
                            "confidence": 0.78,
                            "signal_direction": "BUY",
                            "signal_strength": 7.2,
                            "individual_predictions": {
                                "random_forest": 0.72,
                                "gradient_boosting": 0.68,
                                "neural_network": 0.55
                            },
                            "timestamp": datetime.now().isoformat()
                        }
                    }))
                
                elif message.get('action') == 'generate_strategy':
                    symbol = message.get('symbol', 'BTCUSDT')
                    await websocket.send_text(json.dumps({
                        "type": "strategy_generated",
                        "data": {
                            "id": f"strategy_{int(datetime.now().timestamp())}",
                            "name": f"AI Strategy for {symbol}",
                            "symbol": symbol,
                            "type": "momentum",
                            "created_at": datetime.now().isoformat(),
                            "parameters": {
                                "entry_threshold": 0.7,
                                "exit_threshold": 0.3,
                                "stop_loss": 0.02,
                                "take_profit": 0.05
                            },
                            "expected_performance": {
                                "win_rate": 0.68,
                                "avg_return": 0.025,
                                "max_drawdown": 0.08
                            }
                        }
                    }))
                    
            except asyncio.TimeoutError:
                # Send periodic heartbeat
                await websocket.send_text(json.dumps({
                    "type": "heartbeat",
                    "timestamp": datetime.now().isoformat(),
                    "connections": len(manager.active_connections)
                }))
                
                # Send mock signals periodically
                import random
                if random.random() < 0.3:  # 30% chance
                    symbol = random.choice(['BTCUSDT', 'ETHUSDT', 'BNBUSDT'])
                    await websocket.send_text(json.dumps({
                        "type": "signal",
                        "data": {
                            "symbol": symbol,
                            "timestamp": int(datetime.now().timestamp()),
                            "signal_type": "momentum",
                            "strength": random.uniform(0.6, 0.9),
                            "confidence": random.uniform(0.7, 0.95),
                            "direction": random.choice(["BUY", "SELL"]),
                            "metadata": {"source": "ai_analysis"}
                        }
                    }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# P&L Dashboard endpoints
@app.get("/api/pnl/portfolio-summary")
async def get_portfolio_summary():
    """Get portfolio summary for P&L dashboard"""
    return {
        "timestamp": datetime.now().isoformat(),
        "portfolio_value": 125750.50,
        "initial_capital": 100000.00,
        "total_return": 25750.50,
        "total_return_pct": 25.75,
        "realized_pnl": 18450.25,
        "unrealized_pnl": 7300.25,
        "open_positions_count": 3,
        "total_trades": 45,
        "win_rate": 68.9,
        "profit_factor": 2.34,
        "daily_pnl": 2847.25,
        "daily_trades": 3,
        "daily_signals": 8,
        "open_positions": [
            {
                "trade_id": "T001",
                "symbol": "BTCUSDT",
                "action": "LONG",
                "quantity": 0.5,
                "entry_price": 43250.00,
                "current_price": 44180.50,
                "unrealized_pnl": 465.25,
                "unrealized_pnl_pct": 2.15,
                "entry_time": "2024-10-05T10:30:00Z",
                "days_held": 1
            },
            {
                "trade_id": "T002",
                "symbol": "ETHUSDT",
                "action": "LONG",
                "quantity": 5.2,
                "entry_price": 2650.00,
                "current_price": 2734.80,
                "unrealized_pnl": 440.96,
                "unrealized_pnl_pct": 3.20,
                "entry_time": "2024-10-05T14:15:00Z",
                "days_held": 1
            },
            {
                "trade_id": "T003",
                "symbol": "ADAUSDT",
                "action": "SHORT",
                "quantity": 1000,
                "entry_price": 0.485,
                "current_price": 0.472,
                "unrealized_pnl": 13.00,
                "unrealized_pnl_pct": 2.68,
                "entry_time": "2024-10-05T16:45:00Z",
                "days_held": 1
            }
        ],
        "symbol_breakdown": {
            "BTCUSDT": 35.2,
            "ETHUSDT": 28.7,
            "ADAUSDT": 12.1,
            "SOLUSDT": 8.9,
            "Others": 15.1
        }
    }

@app.get("/api/pnl/equity-curve")
async def get_equity_curve(timeframe: str = "1D", days_back: int = 30):
    """Get equity curve data for P&L dashboard"""
    import random
    from datetime import timedelta
    
    data = []
    base_value = 100000
    current_value = base_value
    
    for i in range(days_back):
        date = datetime.now() - timedelta(days=days_back - i - 1)
        
        # Simulate realistic P&L movements
        daily_change = random.uniform(-0.05, 0.05)  # ±5% daily change
        current_value *= (1 + daily_change)
        
        daily_pnl = current_value - (current_value / (1 + daily_change))
        total_pnl = current_value - base_value
        
        data.append({
            "timestamp": date.isoformat(),
            "portfolio_value": round(current_value, 2),
            "total_pnl": round(total_pnl, 2),
            "daily_pnl": round(daily_pnl, 2),
            "total_return_pct": round((total_pnl / base_value) * 100, 2),
            "trade_count": random.randint(0, 5)
        })
    
    return data

@app.get("/api/pnl/performance-by-asset")
async def get_performance_by_asset(timeframe: str = "30D"):
    """Get performance breakdown by asset"""
    return [
        {
            "symbol": "BTCUSDT",
            "total_pnl": 8450.25,
            "total_trades": 15,
            "win_rate": 73.3,
            "avg_return": 2.8,
            "max_drawdown": -5.2,
            "sharpe_ratio": 1.85,
            "profit_factor": 2.1
        },
        {
            "symbol": "ETHUSDT",
            "total_pnl": 6230.50,
            "total_trades": 12,
            "win_rate": 66.7,
            "avg_return": 2.1,
            "max_drawdown": -7.8,
            "sharpe_ratio": 1.42,
            "profit_factor": 1.8
        },
        {
            "symbol": "ADAUSDT",
            "total_pnl": 2150.75,
            "total_trades": 8,
            "win_rate": 62.5,
            "avg_return": 1.9,
            "max_drawdown": -4.5,
            "sharpe_ratio": 1.28,
            "profit_factor": 1.6
        },
        {
            "symbol": "SOLUSDT",
            "total_pnl": 1890.00,
            "total_trades": 6,
            "win_rate": 83.3,
            "avg_return": 3.2,
            "max_drawdown": -3.1,
            "sharpe_ratio": 2.15,
            "profit_factor": 2.8
        },
        {
            "symbol": "Others",
            "total_pnl": 5029.00,
            "total_trades": 4,
            "win_rate": 75.0,
            "avg_return": 2.5,
            "max_drawdown": -6.2,
            "sharpe_ratio": 1.65,
            "profit_factor": 2.0
        }
    ]

@app.get("/api/pnl/trade-history")
async def get_trade_history(limit: int = 20):
    """Get recent trade history"""
    import random
    from datetime import timedelta
    
    trades = []
    symbols = ["BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT", "BNBUSDT"]
    actions = ["LONG", "SHORT"]
    
    for i in range(limit):
        trade_date = datetime.now() - timedelta(hours=random.randint(1, 72))
        symbol = random.choice(symbols)
        action = random.choice(actions)
        entry_price = random.uniform(100, 50000)
        exit_price = entry_price * random.uniform(0.95, 1.05)
        quantity = random.uniform(0.1, 10)
        
        pnl = (exit_price - entry_price) * quantity if action == "LONG" else (entry_price - exit_price) * quantity
        
        trades.append({
            "trade_id": f"T{1000 + i}",
            "symbol": symbol,
            "action": action,
            "quantity": round(quantity, 4),
            "entry_price": round(entry_price, 2),
            "exit_price": round(exit_price, 2),
            "pnl": round(pnl, 2),
            "pnl_pct": round((pnl / (entry_price * quantity)) * 100, 2),
            "entry_time": trade_date.isoformat(),
            "exit_time": (trade_date + timedelta(hours=random.randint(1, 24))).isoformat(),
            "duration_hours": random.randint(1, 48),
            "fees": round(quantity * entry_price * 0.001, 2)
        })
    
    return sorted(trades, key=lambda x: x["exit_time"], reverse=True)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Simple HTS Trading System Backend on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)

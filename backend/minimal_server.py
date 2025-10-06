from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import asyncio

app = FastAPI(title="HTS Trading System - Minimal", version="1.0.0")

# CORS middleware
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

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "message": "Minimal server running"
    }

@app.get("/api/sentiment/fear-greed")
async def get_fear_greed_proxy():
    """Mock Fear & Greed Index API"""
    return {
        "data": [{
            "value": "45",
            "value_classification": "Fear",
            "timestamp": datetime.now().isoformat()
        }]
    }

@app.get("/api/sentiment/coinmarketcap/{symbol}")
async def get_coinmarketcap_proxy(symbol: str):
    """Mock CoinMarketCap API"""
    return {
        "data": {
            symbol: {
                "quote": {
                    "USD": {
                        "price": 50000.0,
                        "percent_change_24h": 2.5
                    }
                }
            }
        }
    }

@app.get("/api/sentiment/cryptocompare/{symbol}")
async def get_cryptocompare_proxy(symbol: str):
    """Mock CryptoCompare API"""
    return {
        "data": {
            symbol: {
                "quote": {
                    "USD": {
                        "price": 50000.0,
                        "percent_change_24h": 2.5
                    }
                }
            }
        }
    }

@app.get("/api/health/all-apis")
async def get_all_apis_health():
    """Mock API health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "apis": {
            "binance": {"status": "healthy", "latency": 50},
            "kucoin": {"status": "healthy", "latency": 45},
            "coinmarketcap": {"status": "healthy", "latency": 30},
            "fear_greed": {"status": "healthy", "latency": 25}
        }
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time data"""
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.now().isoformat(),
                "status": "connected"
            })
            await asyncio.sleep(30)  # Send heartbeat every 30 seconds
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

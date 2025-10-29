# Portfolio, Risk, and Signal API endpoints
# These are the core endpoints required by the frontend

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
import random

router = APIRouter()

# ==================== Request/Response Models ====================

class Position(BaseModel):
    symbol: str
    size: float
    entry: float
    pnl: float
    leverage: int

class PortfolioStatus(BaseModel):
    positions: List[Position]
    exposureUsd: float

class PnLSummary(BaseModel):
    realized: float
    unrealized: float
    total: float

class RiskSnapshot(BaseModel):
    liquidationRisk: float
    marginUsage: float
    notes: str = ""

class TradingSignal(BaseModel):
    symbol: str
    timeframe: str
    direction: str  # "LONG" or "SHORT"
    confidence: int

class ScanRequest(BaseModel):
    symbols: List[str]
    timeframes: List[str]
    minScore: int
    signalTypes: List[str]

class ScanResult(BaseModel):
    symbol: str
    timeframe: str
    type: str  # "LONG" or "SHORT"
    score: int

# ==================== Portfolio Endpoints ====================

@router.get("/api/portfolio/status", response_model=PortfolioStatus)
async def get_portfolio_status():
    """
    Get current portfolio status including positions and exposure.
    
    Returns realistic demo data for now.
    Replace with actual database queries in production.
    """
    return PortfolioStatus(
        positions=[
            Position(
                symbol="BTCUSDT",
                size=0.5,
                entry=68000.0,
                pnl=120.5 + random.uniform(-50, 50),
                leverage=5
            ),
            Position(
                symbol="ETHUSDT",
                size=2.0,
                entry=3500.0,
                pnl=45.2 + random.uniform(-20, 20),
                leverage=3
            ),
        ],
        exposureUsd=17000.0 + random.uniform(-1000, 1000)
    )

@router.get("/api/portfolio/pnl", response_model=PnLSummary)
async def get_portfolio_pnl():
    """
    Get PnL summary: realized, unrealized, and total.
    
    Returns realistic demo data for now.
    Replace with actual calculations in production.
    """
    realized = 2500.0 + random.uniform(-100, 100)
    unrealized = 165.7 + random.uniform(-50, 50)
    
    return PnLSummary(
        realized=round(realized, 2),
        unrealized=round(unrealized, 2),
        total=round(realized + unrealized, 2)
    )

# ==================== Risk Endpoints ====================

@router.get("/api/risk/live", response_model=RiskSnapshot)
async def get_risk_live():
    """
    Get live risk snapshot including liquidation risk and margin usage.
    
    Returns realistic demo data for now.
    Replace with actual risk calculations in production.
    """
    return RiskSnapshot(
        liquidationRisk=round(12.3 + random.uniform(-2, 2), 1),
        marginUsage=round(45.8 + random.uniform(-5, 5), 1),
        notes="within acceptable risk parameters"
    )

# ==================== Signal Endpoints ====================

@router.get("/api/signals", response_model=TradingSignal)
async def get_latest_signal():
    """
    Get the latest trading signal.
    
    Returns realistic demo data for now.
    Replace with actual signal generation in production.
    """
    symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "ADAUSDT"]
    timeframes = ["15m", "1h", "4h"]
    directions = ["LONG", "SHORT"]
    
    return TradingSignal(
        symbol=random.choice(symbols),
        timeframe=random.choice(timeframes),
        direction=random.choice(directions),
        confidence=random.randint(65, 95)
    )

@router.post("/api/signals/scan", response_model=List[ScanResult])
async def scan_signals(request: ScanRequest):
    """
    Run a market scan and return matching signals.
    
    Request body:
    {
        "symbols": ["BTCUSDT", "ETHUSDT"],
        "timeframes": ["15m", "1h"],
        "minScore": 60,
        "signalTypes": ["LONG", "SHORT"]
    }
    
    Returns realistic demo data for now.
    Replace with actual scanner in production.
    """
    results = []
    
    for symbol in request.symbols[:5]:  # Limit to 5 symbols
        for timeframe in request.timeframes[:3]:  # Limit to 3 timeframes
            score = random.randint(request.minScore, 95)
            signal_type = random.choice(request.signalTypes)
            
            # Only return signals above minScore
            if score >= request.minScore:
                results.append(ScanResult(
                    symbol=symbol,
                    timeframe=timeframe,
                    type=signal_type,
                    score=score
                ))
    
    return results

# ==================== Market Data Endpoints ====================

class Candle(BaseModel):
    t: int      # timestamp
    o: float    # open
    h: float    # high
    l: float    # low
    c: float    # close
    v: float    # volume

@router.get("/market/candles", response_model=List[Candle])
async def get_candles(symbol: str, timeframe: str, limit: int = 100):
    """
    Get OHLCV candles for charting.
    
    Query params:
    - symbol: e.g. BTCUSDT
    - timeframe: e.g. 15m, 1h, 4h
    - limit: number of candles (default 100)
    
    Returns realistic demo data for now.
    Replace with actual market data API in production.
    """
    candles = []
    base_price = 68000.0 if symbol == "BTCUSDT" else 3500.0
    
    # Generate realistic-looking candles
    current_time = int(datetime.now().timestamp() * 1000)
    interval_ms = 900000  # 15 minutes in milliseconds
    
    for i in range(limit):
        timestamp = current_time - (limit - i) * interval_ms
        
        # Random walk for realistic price movement
        price = base_price + random.uniform(-200, 200)
        open_price = price
        high_price = open_price + random.uniform(0, 100)
        low_price = open_price - random.uniform(0, 100)
        close_price = open_price + random.uniform(-50, 50)
        volume = random.uniform(80, 150)
        
        candles.append(Candle(
            t=timestamp,
            o=round(open_price, 2),
            h=round(high_price, 2),
            l=round(low_price, 2),
            c=round(close_price, 2),
            v=round(volume, 2)
        ))
        
        base_price = close_price  # Next candle starts where this one ends
    
    return candles

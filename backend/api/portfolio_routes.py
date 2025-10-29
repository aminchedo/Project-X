# Portfolio, Risk, and Signal API endpoints
# These are the core endpoints required by the frontend

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime

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

    Returns empty portfolio when no real trades exist.
    Frontend should handle null/empty gracefully.
    """
    # TODO: Query from database when trade execution is implemented
    # For now, return empty portfolio (honest state)
    return PortfolioStatus(
        positions=[],
        exposureUsd=0.0
    )

@router.get("/api/portfolio/pnl", response_model=PnLSummary)
async def get_portfolio_pnl():
    """
    Get PnL summary: realized, unrealized, and total.

    Returns zero PnL when no real trades exist.
    Frontend should handle zero values gracefully.
    """
    # TODO: Calculate from real trade history in database
    # For now, return zero (honest state)
    return PnLSummary(
        realized=0.0,
        unrealized=0.0,
        total=0.0
    )

# ==================== Risk Endpoints ====================

@router.get("/api/risk/live", response_model=RiskSnapshot)
async def get_risk_live():
    """
    Get live risk snapshot including liquidation risk and margin usage.

    Returns zero risk when no positions exist.
    Frontend should handle zero/null values gracefully.
    """
    # TODO: Calculate from actual position data when available
    # For now, return zero risk (honest state - no positions = no risk)
    return RiskSnapshot(
        liquidationRisk=0.0,
        marginUsage=0.0,
        notes="No active positions"
    )

# ==================== Signal Endpoints ====================

@router.get("/api/signals", response_model=TradingSignal)
async def get_latest_signal():
    """
    Get the latest trading signal from scoring engine.

    Returns signal from scoring engine if available, else returns None/error.
    Frontend receives signals via WebSocket primarily.
    """
    # TODO: Integrate with scoring engine or return last stored signal from DB
    # For now, clients should rely on WebSocket /ws/market for signals
    raise HTTPException(
        status_code=501,
        detail="Use WebSocket /ws/market for real-time signals. REST endpoint not yet implemented."
    )

@router.post("/api/signals/scan", response_model=List[ScanResult])
async def scan_signals(request: ScanRequest):
    """
    Run a market scan and return matching signals using scoring engine.

    Request body:
    {
        "symbols": ["BTCUSDT", "ETHUSDT"],
        "timeframes": ["15m", "1h"],
        "minScore": 60,
        "signalTypes": ["LONG", "SHORT"]
    }

    Returns real signals from scoring engine or empty list if not available.
    """
    # TODO: Use scanner.scan() when fully integrated
    # For now, return empty results (honest state)
    # Client should use WebSocket /ws/market for real-time signals
    return []

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
    Get REAL OHLCV candles from Binance for charting.

    Query params:
    - symbol: e.g. BTCUSDT
    - timeframe: e.g. 15m, 1h, 4h
    - limit: number of candles (default 100)

    Returns real market data from Binance.
    """
    try:
        # Get real data from data_manager
        from backend.data.data_manager import data_manager

        ohlcv_data = await data_manager.get_ohlcv_data(symbol, timeframe, limit)

        if not ohlcv_data:
            return []

        # Convert Binance format to API format
        candles = []
        for bar in ohlcv_data:
            candles.append(Candle(
                t=int(bar[0]),  # timestamp
                o=float(bar[1]),  # open
                h=float(bar[2]),  # high
                l=float(bar[3]),  # low
                c=float(bar[4]),  # close
                v=float(bar[5])   # volume
            ))

        return candles

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch candles: {str(e)}"
        )

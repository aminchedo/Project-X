from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TradingSignal(BaseModel):
    symbol: str
    action: str  # BUY, SELL, HOLD
    confidence: float
    final_score: float
    rsi_macd_score: float
    smc_score: float
    pattern_score: float
    sentiment_score: float
    ml_score: float
    timestamp: datetime
    price: float
    entry_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    position_size: Optional[float] = None

class MarketData(BaseModel):
    symbol: str
    price: float
    volume: float
    high_24h: float
    low_24h: float
    change_24h: float
    timestamp: datetime

class RiskSettings(BaseModel):
    max_risk_per_trade: float = 0.02
    max_daily_loss: float = 0.05
    position_size_multiplier: float = 1.0
    stop_loss_atr_multiple: float = 1.5

class OHLCVData(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
"""
HTS Trading System - Data Validation Schemas
Pydantic models for data validation and serialization.
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, validator, root_validator

class SignalType(str, Enum):
    """Trading signal types"""
    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    HOLD = "HOLD"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"

class TradeSide(str, Enum):
    """Trade side types"""
    BUY = "BUY"
    SELL = "SELL"

class APIStatus(str, Enum):
    """API status types"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"
    UNKNOWN = "unknown"

class SignalComponents(BaseModel):
    """Signal component scores"""
    rsi_macd: float = Field(..., ge=0, le=100, description="RSI/MACD score (0-100)")
    smc: float = Field(..., ge=0, le=100, description="Smart Money Concepts score (0-100)")
    pattern: float = Field(..., ge=0, le=100, description="Pattern recognition score (0-100)")
    sentiment: float = Field(..., ge=0, le=100, description="Market sentiment score (0-100)")
    ml: float = Field(..., ge=0, le=100, description="Machine learning score (0-100)")

class TradingSignal(BaseModel):
    """Trading signal data model"""
    symbol: str = Field(..., min_length=3, max_length=20, description="Trading symbol")
    signal: SignalType = Field(..., description="Signal type")
    confidence: float = Field(..., ge=0, le=100, description="Signal confidence (0-100)")
    price: float = Field(..., gt=0, description="Current price")
    rsi: Optional[float] = Field(None, ge=0, le=100, description="RSI value")
    macd: Optional[float] = Field(None, description="MACD value")
    volume_ratio: Optional[float] = Field(None, gt=0, description="Volume ratio")
    components: Optional[SignalComponents] = Field(None, description="Signal components")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Signal timestamp")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @validator('confidence')
    def validate_confidence(cls, v):
        return round(v, 2)

class SignalValidator:
    """Signal validation utilities"""
    
    @staticmethod
    def validate_signal_data(data: Dict[str, Any]) -> TradingSignal:
        """Validate and parse signal data"""
        return TradingSignal(**data)
    
    @staticmethod
    def is_valid_symbol(symbol: str) -> bool:
        """Check if symbol is valid format"""
        if not symbol or len(symbol) < 3 or len(symbol) > 20:
            return False
        return symbol.replace("-", "").replace("/", "").isalnum()
    
    @staticmethod
    def calculate_final_score(components: SignalComponents) -> float:
        """Calculate final signal score using exact algorithm"""
        return (
            0.40 * components.rsi_macd +
            0.25 * components.smc +
            0.20 * components.pattern +
            0.10 * components.sentiment +
            0.05 * components.ml
        )

class PriceData(BaseModel):
    """Price data model"""
    symbol: str = Field(..., min_length=3, max_length=20)
    price: float = Field(..., gt=0)
    change_24h: Optional[float] = Field(None, description="24h price change %")
    volume: Optional[float] = Field(None, ge=0, description="24h volume")
    high_24h: Optional[float] = Field(None, gt=0, description="24h high")
    low_24h: Optional[float] = Field(None, gt=0, description="24h low")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()

class Position(BaseModel):
    """Portfolio position model"""
    id: Optional[int] = Field(None, description="Position ID")
    symbol: str = Field(..., min_length=3, max_length=20)
    quantity: Decimal = Field(..., description="Position quantity")
    avg_price: Decimal = Field(..., gt=0, description="Average entry price")
    current_price: Decimal = Field(..., gt=0, description="Current market price")
    market_value: Decimal = Field(..., description="Current market value")
    unrealized_pnl: Decimal = Field(..., description="Unrealized P&L")
    realized_pnl: Decimal = Field(default=Decimal('0'), description="Realized P&L")
    total_pnl: Decimal = Field(..., description="Total P&L")
    pnl_pct: float = Field(..., description="P&L percentage")
    weight: float = Field(..., ge=0, le=100, description="Portfolio weight %")
    entry_time: datetime = Field(..., description="Position entry time")
    last_update: datetime = Field(default_factory=datetime.utcnow)
    stop_loss: Optional[Decimal] = Field(None, gt=0, description="Stop loss price")
    take_profit: Optional[Decimal] = Field(None, gt=0, description="Take profit price")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @validator('quantity', 'avg_price', 'current_price', 'market_value', 
              'unrealized_pnl', 'realized_pnl', 'total_pnl')
    def round_decimals(cls, v):
        return v.quantize(Decimal('0.00000001'))

class Trade(BaseModel):
    """Trade execution model"""
    id: Optional[int] = Field(None, description="Trade ID")
    symbol: str = Field(..., min_length=3, max_length=20)
    side: TradeSide = Field(..., description="Trade side (BUY/SELL)")
    quantity: Decimal = Field(..., gt=0, description="Trade quantity")
    price: Decimal = Field(..., gt=0, description="Execution price")
    trade_value: Decimal = Field(..., gt=0, description="Total trade value")
    pnl: Decimal = Field(default=Decimal('0'), description="Realized P&L")
    fees: Decimal = Field(default=Decimal('0'), ge=0, description="Trading fees")
    executed_at: datetime = Field(default_factory=datetime.utcnow, description="Execution time")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()
    
    @root_validator
    def validate_trade_value(cls, values):
        quantity = values.get('quantity')
        price = values.get('price')
        if quantity and price:
            values['trade_value'] = quantity * price
        return values

class PortfolioSummary(BaseModel):
    """Portfolio summary model"""
    total_value: Decimal = Field(..., description="Total portfolio value")
    cash_balance: Decimal = Field(..., description="Available cash")
    invested_value: Decimal = Field(..., description="Invested capital")
    total_pnl: Decimal = Field(..., description="Total P&L")
    unrealized_pnl: Decimal = Field(..., description="Unrealized P&L")
    realized_pnl: Decimal = Field(..., description="Realized P&L")
    daily_pnl: Decimal = Field(..., description="Daily P&L")
    pnl_pct: float = Field(..., description="Total P&L percentage")
    daily_pnl_pct: float = Field(..., description="Daily P&L percentage")
    position_count: int = Field(..., ge=0, description="Number of positions")
    winning_positions: int = Field(..., ge=0, description="Winning positions count")
    losing_positions: int = Field(..., ge=0, description="Losing positions count")
    win_rate: float = Field(..., ge=0, le=100, description="Win rate percentage")
    largest_winner: Decimal = Field(..., description="Largest winning position")
    largest_loser: Decimal = Field(..., description="Largest losing position")
    last_update: datetime = Field(default_factory=datetime.utcnow)

class APIHealthStatus(BaseModel):
    """API health status model"""
    name: str = Field(..., min_length=1, description="API service name")
    status: APIStatus = Field(..., description="Current status")
    response_time: float = Field(..., ge=0, description="Response time in ms")
    last_check: datetime = Field(..., description="Last health check time")
    error_count: int = Field(..., ge=0, description="Total error count")
    success_count: int = Field(..., ge=0, description="Total success count")
    consecutive_failures: int = Field(..., ge=0, description="Consecutive failure count")
    success_rate: float = Field(..., ge=0, le=100, description="Success rate percentage")

class BacktestRequest(BaseModel):
    """Backtest request model"""
    symbol: str = Field(..., min_length=3, max_length=20)
    days: int = Field(default=30, ge=1, le=365, description="Backtest period in days")
    initial_capital: float = Field(default=10000.0, gt=0, description="Starting capital")
    risk_per_trade: float = Field(default=0.02, gt=0, le=0.1, description="Risk per trade (0-10%)")
    commission: float = Field(default=0.001, ge=0, le=0.01, description="Commission rate")
    
    @validator('symbol')
    def validate_symbol(cls, v):
        return v.upper().strip()

class BacktestResult(BaseModel):
    """Backtest result model"""
    symbol: str = Field(..., description="Tested symbol")
    start_date: datetime = Field(..., description="Backtest start date")
    end_date: datetime = Field(..., description="Backtest end date")
    initial_capital: float = Field(..., gt=0, description="Starting capital")
    final_capital: float = Field(..., ge=0, description="Final capital")
    total_return: float = Field(..., description="Total return amount")
    total_return_pct: float = Field(..., description="Total return percentage")
    max_drawdown: float = Field(..., ge=0, description="Maximum drawdown percentage")
    sharpe_ratio: float = Field(..., description="Sharpe ratio")
    sortino_ratio: float = Field(..., description="Sortino ratio")
    win_rate: float = Field(..., ge=0, le=100, description="Win rate percentage")
    profit_factor: float = Field(..., ge=0, description="Profit factor")
    total_trades: int = Field(..., ge=0, description="Total number of trades")
    winning_trades: int = Field(..., ge=0, description="Number of winning trades")
    losing_trades: int = Field(..., ge=0, description="Number of losing trades")
    avg_win: float = Field(..., description="Average winning trade")
    avg_loss: float = Field(..., description="Average losing trade")
    largest_win: float = Field(..., description="Largest winning trade")
    largest_loss: float = Field(..., description="Largest losing trade")
    avg_trade_duration: float = Field(..., ge=0, description="Average trade duration in hours")

class RiskMetrics(BaseModel):
    """Risk metrics model"""
    var_1d: float = Field(..., ge=0, description="1-day Value at Risk")
    var_7d: float = Field(..., ge=0, description="7-day Value at Risk")
    expected_shortfall: float = Field(..., ge=0, description="Expected Shortfall")
    max_drawdown: float = Field(..., ge=0, description="Maximum Drawdown")
    sharpe_ratio: float = Field(..., description="Sharpe Ratio")
    sortino_ratio: float = Field(..., description="Sortino Ratio")
    volatility: float = Field(..., ge=0, description="Annualized Volatility")
    beta: float = Field(..., description="Market Beta")
    risk_level: str = Field(..., description="Overall Risk Level")

class NotificationSettings(BaseModel):
    """Notification settings model"""
    strong_signals: bool = Field(default=True, description="Strong signal alerts")
    portfolio_updates: bool = Field(default=True, description="Portfolio update alerts")
    risk_alerts: bool = Field(default=True, description="Risk alerts")
    api_status: bool = Field(default=False, description="API status alerts")
    trade_confirmations: bool = Field(default=True, description="Trade confirmation alerts")

class TelegramAlert(BaseModel):
    """Telegram alert model"""
    type: str = Field(..., description="Alert type")
    message: str = Field(..., min_length=1, description="Alert message")
    severity: str = Field(default="medium", description="Alert severity")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional alert data")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PortfolioValidator:
    """Portfolio validation utilities"""
    
    @staticmethod
    def validate_position_data(data: Dict[str, Any]) -> Position:
        """Validate and parse position data"""
        return Position(**data)
    
    @staticmethod
    def validate_trade_data(data: Dict[str, Any]) -> Trade:
        """Validate and parse trade data"""
        return Trade(**data)
    
    @staticmethod
    def validate_portfolio_summary(data: Dict[str, Any]) -> PortfolioSummary:
        """Validate and parse portfolio summary data"""
        return PortfolioSummary(**data)
    
    @staticmethod
    def calculate_position_metrics(position: Position) -> Dict[str, float]:
        """Calculate additional position metrics"""
        return {
            "unrealized_pnl_pct": float(position.unrealized_pnl / (position.avg_price * position.quantity) * 100),
            "total_pnl_pct": float(position.total_pnl / (position.avg_price * position.quantity) * 100),
            "price_change_pct": float((position.current_price - position.avg_price) / position.avg_price * 100)
        }

class SystemStatus(BaseModel):
    """System status model"""
    status: str = Field(..., description="Overall system status")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    services: Dict[str, str] = Field(..., description="Service status map")
    api_health: Dict[str, APIHealthStatus] = Field(..., description="API health status")
    uptime_seconds: int = Field(..., ge=0, description="System uptime in seconds")
    active_connections: int = Field(..., ge=0, description="Active WebSocket connections")

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    code: Optional[str] = Field(None, description="Error code")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SuccessResponse(BaseModel):
    """Success response model"""
    success: bool = Field(default=True, description="Success flag")
    message: Optional[str] = Field(None, description="Success message")
    data: Optional[Any] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Utility functions for validation
def validate_decimal_precision(value: Union[str, int, float, Decimal], precision: int = 8) -> Decimal:
    """Validate and format decimal with specified precision"""
    decimal_value = Decimal(str(value))
    return decimal_value.quantize(Decimal('0.' + '0' * precision))

def validate_percentage(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Validate percentage value within range"""
    if value < min_val or value > max_val:
        raise ValueError(f"Percentage must be between {min_val} and {max_val}")
    return round(value, 2)

def validate_symbol_format(symbol: str) -> str:
    """Validate and normalize symbol format"""
    if not symbol or not isinstance(symbol, str):
        raise ValueError("Symbol must be a non-empty string")
    
    normalized = symbol.upper().strip()
    
    if len(normalized) < 3 or len(normalized) > 20:
        raise ValueError("Symbol must be between 3 and 20 characters")
    
    # Allow alphanumeric characters, hyphens, and forward slashes
    allowed_chars = set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/')
    if not set(normalized).issubset(allowed_chars):
        raise ValueError("Symbol contains invalid characters")
    
    return normalized

def validate_timestamp(timestamp: Union[str, datetime]) -> datetime:
    """Validate and parse timestamp"""
    if isinstance(timestamp, str):
        try:
            return datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError("Invalid timestamp format")
    elif isinstance(timestamp, datetime):
        return timestamp
    else:
        raise ValueError("Timestamp must be string or datetime object")
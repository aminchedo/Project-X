from pydantic import BaseModel, validator, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum
import re


# Enums for validation
class ActionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


class TradeStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class TimeframeType(str, Enum):
    ONE_MINUTE = "1m"
    FIVE_MINUTES = "5m"
    FIFTEEN_MINUTES = "15m"
    THIRTY_MINUTES = "30m"
    ONE_HOUR = "1h"
    FOUR_HOURS = "4h"
    ONE_DAY = "1d"
    ONE_WEEK = "1w"


class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# Base Schemas
class TimestampMixin(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# Market Data Schemas
class KuCoinOHLCVSchema(BaseModel):
    timestamp: Union[int, datetime]
    open: float = Field(gt=0, description="Opening price must be positive")
    high: float = Field(gt=0, description="High price must be positive")
    low: float = Field(gt=0, description="Low price must be positive")
    close: float = Field(gt=0, description="Closing price must be positive")
    volume: float = Field(ge=0, description="Volume must be non-negative")
    
    @validator('high', 'low', 'open', 'close')
    def price_validation(cls, v):
        if v <= 0:
            raise ValueError('Price must be positive')
        if v > 1000000:  # Reasonable upper bound
            raise ValueError('Price seems unreasonably high')
        return v
    
    @validator('high')
    def high_validation(cls, v, values):
        if 'low' in values and v < values['low']:
            raise ValueError('High price cannot be lower than low price')
        if 'open' in values and 'close' in values:
            min_price = min(values['open'], values['close'])
            max_price = max(values['open'], values['close'])
            if v < max_price * 0.9:  # High should be reasonable
                raise ValueError('High price seems inconsistent with open/close')
        return v
    
    @validator('low')
    def low_validation(cls, v, values):
        if 'high' in values and v > values['high']:
            raise ValueError('Low price cannot be higher than high price')
        return v
    
    @validator('volume')
    def volume_validation(cls, v):
        if v < 0:
            raise ValueError('Volume cannot be negative')
        return v


class MarketDataSchema(BaseModel):
    symbol: str = Field(pattern=r'^[A-Z]{2,10}USDT?$', description="Symbol must be valid trading pair")
    price: float = Field(gt=0, description="Price must be positive")
    volume: float = Field(ge=0, description="Volume must be non-negative")
    change_24h: float = Field(ge=-100, le=100, description="24h change must be between -100% and 100%")
    high_24h: Optional[float] = Field(gt=0, description="24h high must be positive")
    low_24h: Optional[float] = Field(gt=0, description="24h low must be positive")
    
    @validator('symbol')
    def symbol_validation(cls, v):
        if not re.match(r'^[A-Z]{2,10}USDT?$', v):
            raise ValueError('Invalid symbol format')
        return v.upper()
    
    @validator('high_24h')
    def high_24h_validation(cls, v, values):
        if v is not None and 'price' in values and v < values['price'] * 0.5:
            raise ValueError('24h high seems too low compared to current price')
        return v
    
    @validator('low_24h')
    def low_24h_validation(cls, v, values):
        if v is not None and 'price' in values and v > values['price'] * 2:
            raise ValueError('24h low seems too high compared to current price')
        return v


class SentimentDataSchema(BaseModel):
    value: int = Field(ge=0, le=100, description="Sentiment value must be between 0-100")
    classification: str = Field(pattern=r'^(BEARISH|NEUTRAL|BULLISH)$')
    timestamp: datetime
    source: Optional[str] = Field(max_length=50)
    confidence: Optional[float] = Field(ge=0, le=1)
    
    @validator('value')
    def sentiment_range(cls, v):
        if not 0 <= v <= 100:
            raise ValueError('Sentiment must be 0-100')
        return v
    
    @validator('classification')
    def classification_validation(cls, v):
        valid_classifications = ['BEARISH', 'NEUTRAL', 'BULLISH']
        if v.upper() not in valid_classifications:
            raise ValueError(f'Classification must be one of: {valid_classifications}')
        return v.upper()


# Trading Signal Schemas
class TradingSignalSchema(TimestampMixin):
    symbol: str = Field(pattern=r'^[A-Z]{2,10}USDT?$')
    action: ActionType
    confidence: float = Field(ge=0, le=1, description="Confidence must be between 0-1")
    final_score: float = Field(ge=-1, le=1, description="Final score must be between -1 and 1")
    price: float = Field(gt=0)
    
    # Component scores
    rsi_macd_score: Optional[float] = Field(ge=-1, le=1)
    smc_score: Optional[float] = Field(ge=-1, le=1)
    pattern_score: Optional[float] = Field(ge=-1, le=1)
    sentiment_score: Optional[float] = Field(ge=-1, le=1)
    ml_score: Optional[float] = Field(ge=-1, le=1)
    
    # Trade parameters
    entry_price: Optional[float] = Field(gt=0)
    stop_loss: Optional[float] = Field(gt=0)
    take_profit: Optional[float] = Field(gt=0)
    position_size: Optional[float] = Field(gt=0)
    
    @validator('symbol')
    def symbol_validation(cls, v):
        return v.upper()
    
    @validator('stop_loss')
    def stop_loss_validation(cls, v, values):
        if v is not None and 'entry_price' in values and values['entry_price']:
            if values.get('action') == ActionType.BUY and v >= values['entry_price']:
                raise ValueError('Stop loss for BUY order must be below entry price')
            elif values.get('action') == ActionType.SELL and v <= values['entry_price']:
                raise ValueError('Stop loss for SELL order must be above entry price')
        return v
    
    @validator('take_profit')
    def take_profit_validation(cls, v, values):
        if v is not None and 'entry_price' in values and values['entry_price']:
            if values.get('action') == ActionType.BUY and v <= values['entry_price']:
                raise ValueError('Take profit for BUY order must be above entry price')
            elif values.get('action') == ActionType.SELL and v >= values['entry_price']:
                raise ValueError('Take profit for SELL order must be below entry price')
        return v


class TradeExecutionSchema(TimestampMixin):
    symbol: str = Field(pattern=r'^[A-Z]{2,10}USDT?$')
    action: ActionType
    quantity: float = Field(gt=0, description="Quantity must be positive")
    entry_price: float = Field(gt=0, description="Entry price must be positive")
    exit_price: Optional[float] = Field(gt=0)
    entry_time: datetime
    exit_time: Optional[datetime]
    pnl: Optional[float]
    commission: float = Field(ge=0, description="Commission must be non-negative")
    status: TradeStatus = TradeStatus.OPEN
    stop_loss: Optional[float] = Field(gt=0)
    take_profit: Optional[float] = Field(gt=0)
    signal_confidence: Optional[float] = Field(ge=0, le=1)
    strategy_source: str = Field(default="HTS", max_length=20)
    
    @validator('symbol')
    def symbol_validation(cls, v):
        return v.upper()
    
    @validator('exit_time')
    def exit_time_validation(cls, v, values):
        if v is not None and 'entry_time' in values and v <= values['entry_time']:
            raise ValueError('Exit time must be after entry time')
        return v
    
    @validator('pnl')
    def pnl_validation(cls, v, values):
        if v is not None and 'status' in values and values['status'] == TradeStatus.OPEN:
            raise ValueError('PnL should not be set for open trades')
        return v


# Backtesting Schemas
class BacktestConfigSchema(BaseModel):
    symbol: str = Field(pattern=r'^[A-Z]{2,10}USDT?$')
    start_date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    end_date: str = Field(pattern=r'^\d{4}-\d{2}-\d{2}$')
    initial_capital: float = Field(gt=0, le=1000000, description="Initial capital must be positive and reasonable")
    commission: Optional[float] = Field(ge=0, le=0.01, description="Commission must be between 0-1%")
    slippage: Optional[float] = Field(ge=0, le=0.01, description="Slippage must be between 0-1%")
    
    @validator('symbol')
    def symbol_validation(cls, v):
        return v.upper()
    
    @validator('end_date')
    def date_validation(cls, v, values):
        if 'start_date' in values:
            from datetime import datetime
            start = datetime.strptime(values['start_date'], '%Y-%m-%d')
            end = datetime.strptime(v, '%Y-%m-%d')
            if end <= start:
                raise ValueError('End date must be after start date')
            if (end - start).days > 365:
                raise ValueError('Backtest period cannot exceed 1 year')
        return v


class BacktestResultsSchema(BaseModel):
    backtest_id: str
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float
    total_return: float
    total_return_pct: float
    sharpe_ratio: float
    sortino_ratio: Optional[float]
    max_drawdown: float
    max_drawdown_pct: float
    win_rate: float = Field(ge=0, le=100)
    profit_factor: float = Field(ge=0)
    total_trades: int = Field(ge=0)
    winning_trades: int = Field(ge=0)
    losing_trades: int = Field(ge=0)
    
    @validator('win_rate')
    def win_rate_validation(cls, v):
        if not 0 <= v <= 100:
            raise ValueError('Win rate must be between 0-100%')
        return v
    
    @validator('winning_trades', 'losing_trades')
    def trades_validation(cls, v, values):
        if v < 0:
            raise ValueError('Trade count cannot be negative')
        return v


# Risk Management Schemas
class RiskSettingsSchema(BaseModel):
    max_risk_per_trade: float = Field(ge=0.001, le=0.1, description="Max risk per trade: 0.1%-10%")
    max_daily_loss: float = Field(ge=0.01, le=0.5, description="Max daily loss: 1%-50%")
    max_portfolio_risk: float = Field(ge=0.01, le=0.5, description="Max portfolio risk: 1%-50%")
    position_size_multiplier: float = Field(ge=0.1, le=5.0, description="Position size multiplier: 0.1x-5.0x")
    stop_loss_atr_multiple: float = Field(ge=0.5, le=5.0, description="Stop loss ATR multiple: 0.5x-5.0x")
    max_correlation: Optional[float] = Field(ge=0, le=1, description="Max correlation: 0-1")
    max_single_asset: Optional[float] = Field(ge=0.01, le=1, description="Max single asset exposure: 1%-100%")
    
    @validator('max_risk_per_trade', 'max_daily_loss', 'max_portfolio_risk')
    def risk_percentage_validation(cls, v):
        if not 0 < v <= 1:
            raise ValueError('Risk percentage must be between 0-100%')
        return v


class RiskAlertSchema(TimestampMixin):
    alert_type: str = Field(max_length=50)
    severity: SeverityLevel
    risk_level: float = Field(ge=0, le=1)
    description: str = Field(max_length=500)
    recommendation: str = Field(max_length=500)
    affected_symbols: Optional[List[str]]
    
    @validator('alert_type')
    def alert_type_validation(cls, v):
        valid_types = [
            'DAILY_LOSS_LIMIT', 'PORTFOLIO_RISK_LIMIT', 'CORRELATION_LIMIT',
            'POSITION_SIZE_LIMIT', 'DRAWDOWN_WARNING', 'VOLATILITY_SPIKE'
        ]
        if v not in valid_types:
            raise ValueError(f'Alert type must be one of: {valid_types}')
        return v


# Notification Schemas
class NotificationSettingsSchema(BaseModel):
    signal_alerts: bool = True
    portfolio_alerts: bool = True
    risk_alerts: bool = True
    api_health_alerts: bool = True
    daily_summary: bool = True
    min_confidence_threshold: float = Field(ge=0, le=1, default=0.7)
    chat_id: Optional[str] = Field(pattern=r'^-?\d+$')
    
    @validator('chat_id')
    def chat_id_validation(cls, v):
        if v is not None and not re.match(r'^-?\d+$', v):
            raise ValueError('Chat ID must be a valid Telegram chat ID (numeric)')
        return v


# Portfolio Schemas
class PortfolioSummarySchema(BaseModel):
    portfolio_value: float = Field(ge=0)
    initial_capital: float = Field(gt=0)
    total_return: float
    total_return_pct: float
    realized_pnl: float
    unrealized_pnl: float
    open_positions_count: int = Field(ge=0)
    total_trades: int = Field(ge=0)
    win_rate: float = Field(ge=0, le=100)
    profit_factor: float = Field(ge=0)
    sharpe_ratio: Optional[float]
    max_drawdown_pct: Optional[float] = Field(ge=0, le=100)
    
    @validator('win_rate')
    def win_rate_validation(cls, v):
        if not 0 <= v <= 100:
            raise ValueError('Win rate must be between 0-100%')
        return v


class EquityCurvePointSchema(TimestampMixin):
    portfolio_value: float = Field(ge=0)
    total_pnl: float
    daily_pnl: float
    total_return_pct: float
    trade_count: int = Field(ge=0)


# API Response Validation
class APIResponseValidator:
    """Centralized API response validation"""
    
    @staticmethod
    def validate_kucoin_response(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate KuCoin API response format"""
        try:
            if not isinstance(data, dict):
                raise ValueError("Response must be a dictionary")
            
            # Check for standard KuCoin response structure
            if 'code' in data and data['code'] != '200000':
                raise ValueError(f"KuCoin API error: {data.get('msg', 'Unknown error')}")
            
            # Validate OHLCV data if present
            if 'data' in data and isinstance(data['data'], list):
                validated_data = []
                for item in data['data']:
                    if isinstance(item, list) and len(item) >= 6:
                        try:
                            validated_item = KuCoinOHLCVSchema(
                                timestamp=float(item[0]),
                                open=float(item[1]),
                                high=float(item[2]),
                                low=float(item[3]),
                                close=float(item[4]),
                                volume=float(item[5])
                            )
                            validated_data.append(validated_item.dict())
                        except (ValueError, TypeError) as e:
                            print(f"Skipping invalid OHLCV data: {e}")
                            continue
                
                data['data'] = validated_data
            
            return data
            
        except Exception as e:
            print(f"KuCoin response validation error: {e}")
            return {"error": str(e), "original_data": data}
    
    @staticmethod
    def validate_sentiment_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate sentiment API responses"""
        try:
            # Handle different sentiment API formats
            if 'sentiment' in data:
                sentiment_value = data['sentiment']
                
                # Convert text sentiment to numeric
                if isinstance(sentiment_value, str):
                    sentiment_map = {
                        'very_bearish': 10, 'bearish': 25, 'neutral': 50,
                        'bullish': 75, 'very_bullish': 90,
                        'negative': 25, 'positive': 75
                    }
                    sentiment_value = sentiment_map.get(sentiment_value.lower(), 50)
                
                # Validate numeric sentiment
                validated_sentiment = SentimentDataSchema(
                    value=int(sentiment_value),
                    classification=APIResponseValidator._classify_sentiment(sentiment_value),
                    timestamp=datetime.now(),
                    source=data.get('source', 'unknown'),
                    confidence=data.get('confidence', 0.5)
                )
                
                return validated_sentiment.dict()
            
            return data
            
        except Exception as e:
            print(f"Sentiment data validation error: {e}")
            return {
                "value": 50,
                "classification": "NEUTRAL",
                "timestamp": datetime.now(),
                "source": "error",
                "confidence": 0.0,
                "error": str(e)
            }
    
    @staticmethod
    def _classify_sentiment(value: float) -> str:
        """Classify numeric sentiment value"""
        if value < 30:
            return "BEARISH"
        elif value > 70:
            return "BULLISH"
        else:
            return "NEUTRAL"
    
    @staticmethod
    def validate_trading_signal(signal: Dict[str, Any]) -> Dict[str, Any]:
        """Validate trading signal data"""
        try:
            validated_signal = TradingSignalSchema(**signal)
            return validated_signal.dict()
        except Exception as e:
            print(f"Trading signal validation error: {e}")
            # Return sanitized version with errors
            return {
                "symbol": signal.get('symbol', 'UNKNOWN'),
                "action": "HOLD",
                "confidence": 0.0,
                "final_score": 0.0,
                "price": signal.get('price', 0),
                "timestamp": datetime.now(),
                "validation_error": str(e)
            }
    
    @staticmethod
    def validate_market_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate market data"""
        try:
            validated_data = MarketDataSchema(**data)
            return validated_data.dict()
        except Exception as e:
            print(f"Market data validation error: {e}")
            return {
                "symbol": data.get('symbol', 'UNKNOWN'),
                "price": 0,
                "volume": 0,
                "change_24h": 0,
                "validation_error": str(e)
            }


# Data Sanitization Functions
def sanitize_float(value: Any, default: float = 0.0, min_val: Optional[float] = None, max_val: Optional[float] = None) -> float:
    """Safely convert value to float with bounds checking"""
    try:
        result = float(value)
        if min_val is not None and result < min_val:
            return min_val
        if max_val is not None and result > max_val:
            return max_val
        return result
    except (ValueError, TypeError):
        return default


def sanitize_int(value: Any, default: int = 0, min_val: Optional[int] = None, max_val: Optional[int] = None) -> int:
    """Safely convert value to int with bounds checking"""
    try:
        result = int(value)
        if min_val is not None and result < min_val:
            return min_val
        if max_val is not None and result > max_val:
            return max_val
        return result
    except (ValueError, TypeError):
        return default


def sanitize_symbol(symbol: str) -> str:
    """Sanitize trading symbol"""
    if not isinstance(symbol, str):
        return "BTCUSDT"
    
    symbol = symbol.upper().strip()
    if not re.match(r'^[A-Z]{2,10}USDT?$', symbol):
        return "BTCUSDT"
    
    return symbol


def validate_timeframe(timeframe: str) -> str:
    """Validate and sanitize timeframe"""
    valid_timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w']
    
    if timeframe not in valid_timeframes:
        return '1h'  # Default
    
    return timeframe
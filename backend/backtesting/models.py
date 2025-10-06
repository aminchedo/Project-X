"""
Backtesting data models and structures
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Literal
from datetime import datetime, timedelta
import pandas as pd

@dataclass
class Trade:
    """Executed trade record"""
    symbol: str
    entry_time: datetime
    entry_price: float
    exit_time: datetime
    exit_price: float
    quantity: float
    direction: Literal["LONG", "SHORT"]
    pnl: float
    pnl_pct: float
    exit_reason: str  # "TP", "SL", "TIME", "SIGNAL"
    r_multiple: float
    fees: float = 0.0
    slippage: float = 0.0

@dataclass
class BacktestMetrics:
    """Comprehensive performance metrics"""
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    
    total_pnl: float
    avg_win: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    
    profit_factor: float
    expectancy: float
    
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    
    max_drawdown: float
    max_drawdown_pct: float
    recovery_factor: float
    
    cagr: float
    total_return_pct: float
    
    avg_trade_duration: timedelta
    avg_bars_in_trade: int
    
    # Additional metrics
    var_95: float
    var_99: float
    max_consecutive_wins: int
    max_consecutive_losses: int
    avg_r_multiple: float
    kelly_criterion: float

@dataclass
class BacktestConfig:
    """Configuration for backtest run"""
    symbol: str
    timeframe: str
    start_date: datetime
    end_date: datetime
    initial_capital: float = 10000.0
    fee_bps: float = 10.0  # 0.1% per side
    slippage_bps: float = 5.0  # 0.05%
    max_position_size: float = 0.1  # 10% of capital
    stop_loss_atr_multiplier: float = 2.0
    take_profit_atr_multiplier: float = 3.0
    max_trades_per_day: int = 5
    min_confidence_threshold: float = 0.6
    min_score_threshold: float = 0.65

@dataclass
class BacktestResult:
    """Complete backtest result"""
    config: BacktestConfig
    metrics: BacktestMetrics
    trades: List[Trade]
    equity_curve: List[float]
    drawdown_curve: List[float]
    monthly_returns: Dict[str, float]
    daily_returns: List[float]
    backtest_id: str
    start_time: datetime
    end_time: datetime
    duration: timedelta
    success: bool
    error_message: Optional[str] = None

class OHLCVBar:
    """OHLCV bar structure for backtesting"""
    def __init__(self, ts: int, open: float, high: float, low: float, close: float, volume: float):
        self.ts = ts
        self.open = open
        self.high = high
        self.low = low
        self.close = close
        self.volume = volume
    
    def to_dict(self) -> Dict:
        return {
            'ts': self.ts,
            'open': self.open,
            'high': self.high,
            'low': self.low,
            'close': self.close,
            'volume': self.volume
        }
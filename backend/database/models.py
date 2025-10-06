from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()

class TradingSession(Base):
    __tablename__ = "trading_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    start_time = Column(DateTime, default=func.now())
    end_time = Column(DateTime)
    initial_balance = Column(Float, default=10000.0)
    final_balance = Column(Float)
    total_trades = Column(Integer, default=0)
    profitable_trades = Column(Integer, default=0)
    total_pnl = Column(Float, default=0.0)
    max_drawdown = Column(Float, default=0.0)
    sharpe_ratio = Column(Float)
    win_rate = Column(Float)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    signals = relationship("SignalRecord", back_populates="session")
    trades = relationship("TradeRecord", back_populates="session")

class SignalRecord(Base):
    __tablename__ = "signal_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("trading_sessions.id"))
    
    symbol = Column(String, nullable=False)
    timestamp = Column(DateTime, default=func.now())
    action = Column(String, nullable=False)  # BUY, SELL, HOLD
    confidence = Column(Float, nullable=False)
    
    # Signal components (core algorithm scores)
    final_score = Column(Float, nullable=False)
    rsi_macd_score = Column(Float, nullable=False)
    smc_score = Column(Float, nullable=False)
    pattern_score = Column(Float, nullable=False)
    sentiment_score = Column(Float, nullable=False)
    ml_score = Column(Float, nullable=False)
    
    # Market data at signal time
    price = Column(Float, nullable=False)
    volume = Column(Float)
    market_cap = Column(Float)
    
    # Risk metrics
    atr = Column(Float)
    volatility = Column(Float)
    
    # Signal metadata
    signal_strength = Column(String)  # WEAK, MODERATE, STRONG
    market_condition = Column(String)  # TRENDING, RANGING, VOLATILE
    
    # Execution status
    executed = Column(Boolean, default=False)
    execution_time = Column(DateTime)
    execution_price = Column(Float)
    
    # Relationships
    session = relationship("TradingSession", back_populates="signals")
    trade = relationship("TradeRecord", back_populates="signal", uselist=False)

class TradeRecord(Base):
    __tablename__ = "trade_records"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("trading_sessions.id"))
    signal_id = Column(String, ForeignKey("signal_records.id"))
    
    symbol = Column(String, nullable=False)
    entry_time = Column(DateTime, default=func.now())
    exit_time = Column(DateTime)
    
    # Trade details
    direction = Column(String, nullable=False)  # LONG, SHORT
    entry_price = Column(Float, nullable=False)
    exit_price = Column(Float)
    quantity = Column(Float, nullable=False)
    
    # Risk management
    stop_loss = Column(Float)
    take_profit = Column(Float)
    stop_loss_hit = Column(Boolean, default=False)
    take_profit_hit = Column(Boolean, default=False)
    
    # P&L calculation
    gross_pnl = Column(Float)
    commission = Column(Float, default=0.0)
    net_pnl = Column(Float)
    pnl_percentage = Column(Float)
    
    # Trade metadata
    trade_duration_minutes = Column(Integer)
    max_favorable_excursion = Column(Float)  # MFE
    max_adverse_excursion = Column(Float)    # MAE
    
    # Status
    status = Column(String, default="OPEN")  # OPEN, CLOSED, STOPPED
    
    # Relationships
    session = relationship("TradingSession", back_populates="trades")
    signal = relationship("SignalRecord", back_populates="trade")

class BacktestResult(Base):
    __tablename__ = "backtest_results"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=func.now())
    
    # Backtest parameters
    symbol = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    initial_capital = Column(Float, nullable=False)
    timeframe = Column(String, nullable=False)
    
    # Performance metrics
    final_capital = Column(Float)
    total_return = Column(Float)
    total_trades = Column(Integer)
    profitable_trades = Column(Integer)
    win_rate = Column(Float)
    
    # Risk metrics
    max_drawdown = Column(Float)
    sharpe_ratio = Column(Float)
    sortino_ratio = Column(Float)
    calmar_ratio = Column(Float)
    var_95 = Column(Float)
    cvar_95 = Column(Float)
    
    # Trade statistics
    avg_win = Column(Float)
    avg_loss = Column(Float)
    profit_factor = Column(Float)
    largest_win = Column(Float)
    largest_loss = Column(Float)
    
    # Additional metrics
    equity_curve = Column(Text)  # JSON string
    monthly_returns = Column(Text)  # JSON string
    trade_distribution = Column(Text)  # JSON string
    
    # Backtest configuration
    strategy_params = Column(Text)  # JSON string

class SystemMetrics(Base):
    __tablename__ = "system_metrics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=func.now())
    
    # System health
    api_response_time = Column(Float)
    websocket_connections = Column(Integer)
    active_signals = Column(Integer)
    memory_usage = Column(Float)
    cpu_usage = Column(Float)
    
    # Trading metrics
    signals_generated_today = Column(Integer, default=0)
    trades_executed_today = Column(Integer, default=0)
    daily_pnl = Column(Float, default=0.0)
    system_uptime = Column(Float)
    
    # Data quality
    data_latency_ms = Column(Float)
    api_errors_count = Column(Integer, default=0)
    websocket_reconnects = Column(Integer, default=0)

class RiskLimit(Base):
    __tablename__ = "risk_limits"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Risk parameters
    max_risk_per_trade = Column(Float, default=0.02)
    max_daily_loss = Column(Float, default=0.05)
    max_portfolio_var = Column(Float, default=0.1)
    max_correlation_limit = Column(Float, default=0.7)
    max_position_size = Column(Float, default=0.25)
    
    # Dynamic adjustments
    confidence_threshold = Column(Float, default=0.6)
    volatility_adjustment = Column(Boolean, default=True)
    drawdown_protection = Column(Boolean, default=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    emergency_stop = Column(Boolean, default=False)
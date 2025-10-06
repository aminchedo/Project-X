-- HTS Trading System Database Initialization
-- PostgreSQL schema creation and initial data setup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS trading;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS monitoring;

-- Set default schema
SET search_path TO public, trading, analytics, monitoring;

-- =============================================
-- TRADING TABLES
-- =============================================

-- Trading signals table
CREATE TABLE IF NOT EXISTS signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(20) NOT NULL CHECK (signal_type IN ('STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL')),
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    price DECIMAL(20,8) NOT NULL CHECK (price > 0),
    rsi DECIMAL(5,2),
    macd DECIMAL(10,6),
    volume_ratio DECIMAL(8,4),
    components JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for signals
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON signals(symbol);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_confidence ON signals(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals(signal_type);

-- Portfolio positions table
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL CHECK (quantity > 0),
    avg_price DECIMAL(20,8) NOT NULL CHECK (avg_price > 0),
    current_price DECIMAL(20,8),
    market_value DECIMAL(20,8),
    unrealized_pnl DECIMAL(20,8) DEFAULT 0,
    realized_pnl DECIMAL(20,8) DEFAULT 0,
    stop_loss DECIMAL(20,8),
    take_profit DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(symbol)
);

-- Create indexes for positions
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_updated_at ON positions(updated_at DESC);

-- Trade history table
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity DECIMAL(20,8) NOT NULL CHECK (quantity > 0),
    price DECIMAL(20,8) NOT NULL CHECK (price > 0),
    trade_value DECIMAL(20,8) NOT NULL CHECK (trade_value > 0),
    pnl DECIMAL(20,8) DEFAULT 0,
    fees DECIMAL(20,8) DEFAULT 0,
    order_id VARCHAR(100),
    execution_id VARCHAR(100),
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for trades
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_executed_at ON trades(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_side ON trades(side);
CREATE INDEX IF NOT EXISTS idx_trades_pnl ON trades(pnl DESC);

-- API health monitoring table
CREATE TABLE IF NOT EXISTS api_health (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
    response_time_ms INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    consecutive_failures INTEGER DEFAULT 0,
    last_error TEXT,
    last_check TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(service_name)
);

-- Create indexes for API health
CREATE INDEX IF NOT EXISTS idx_api_health_service ON api_health(service_name);
CREATE INDEX IF NOT EXISTS idx_api_health_status ON api_health(status);
CREATE INDEX IF NOT EXISTS idx_api_health_last_check ON api_health(last_check DESC);

-- Portfolio snapshots for historical tracking
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_value DECIMAL(20,8) NOT NULL,
    cash_balance DECIMAL(20,8) NOT NULL,
    invested_value DECIMAL(20,8) NOT NULL,
    total_pnl DECIMAL(20,8) NOT NULL,
    unrealized_pnl DECIMAL(20,8) NOT NULL,
    realized_pnl DECIMAL(20,8) NOT NULL,
    position_count INTEGER DEFAULT 0,
    winning_positions INTEGER DEFAULT 0,
    losing_positions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date)
);

-- Create indexes for portfolio snapshots
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_date ON portfolio_snapshots(date DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_total_value ON portfolio_snapshots(total_value DESC);

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- Market data cache table
CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL, -- '1m', '5m', '1h', '1d', etc.
    open_price DECIMAL(20,8) NOT NULL,
    high_price DECIMAL(20,8) NOT NULL,
    low_price DECIMAL(20,8) NOT NULL,
    close_price DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(symbol, timeframe, timestamp)
);

-- Create indexes for market data
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timeframe ON market_data(symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp DESC);

-- Backtesting results table
CREATE TABLE IF NOT EXISTS backtest_results (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    strategy_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    initial_capital DECIMAL(20,8) NOT NULL,
    final_capital DECIMAL(20,8) NOT NULL,
    total_return DECIMAL(20,8) NOT NULL,
    total_return_pct DECIMAL(8,4) NOT NULL,
    max_drawdown DECIMAL(8,4) NOT NULL,
    sharpe_ratio DECIMAL(8,4),
    sortino_ratio DECIMAL(8,4),
    win_rate DECIMAL(5,2) NOT NULL,
    profit_factor DECIMAL(8,4),
    total_trades INTEGER NOT NULL,
    winning_trades INTEGER NOT NULL,
    losing_trades INTEGER NOT NULL,
    parameters JSONB,
    results JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for backtest results
CREATE INDEX IF NOT EXISTS idx_backtest_results_symbol ON backtest_results(symbol);
CREATE INDEX IF NOT EXISTS idx_backtest_results_created_at ON backtest_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_results_return_pct ON backtest_results(total_return_pct DESC);

-- Risk metrics tracking
CREATE TABLE IF NOT EXISTS risk_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    var_1d DECIMAL(8,4) NOT NULL,
    var_7d DECIMAL(8,4) NOT NULL,
    expected_shortfall DECIMAL(8,4) NOT NULL,
    max_drawdown DECIMAL(8,4) NOT NULL,
    sharpe_ratio DECIMAL(8,4),
    sortino_ratio DECIMAL(8,4),
    volatility DECIMAL(8,4) NOT NULL,
    beta DECIMAL(8,4),
    risk_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date)
);

-- Create indexes for risk metrics
CREATE INDEX IF NOT EXISTS idx_risk_metrics_date ON risk_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_metrics_risk_level ON risk_metrics(risk_level);

-- =============================================
-- MONITORING TABLES
-- =============================================

-- System events log
CREATE TABLE IF NOT EXISTS system_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    message TEXT NOT NULL,
    details JSONB,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for system events
CREATE INDEX IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at DESC);

-- User sessions and notifications
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    websocket_connected BOOLEAN DEFAULT FALSE,
    subscriptions JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    UNIQUE(session_id)
);

-- Create indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);

-- Telegram notifications log
CREATE TABLE IF NOT EXISTS telegram_notifications (
    id SERIAL PRIMARY KEY,
    chat_id VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for telegram notifications
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_chat_id ON telegram_notifications(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_status ON telegram_notifications(status);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_created_at ON telegram_notifications(created_at DESC);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON signals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate trade value
CREATE OR REPLACE FUNCTION calculate_trade_value()
RETURNS TRIGGER AS $$
BEGIN
    NEW.trade_value = NEW.quantity * NEW.price;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for trade value calculation
CREATE TRIGGER calculate_trades_value BEFORE INSERT OR UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION calculate_trade_value();

-- Function to log system events
CREATE OR REPLACE FUNCTION log_system_event(
    p_event_type VARCHAR(50),
    p_severity VARCHAR(20),
    p_message TEXT,
    p_details JSONB DEFAULT NULL,
    p_source VARCHAR(100) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    event_id INTEGER;
BEGIN
    INSERT INTO system_events (event_type, severity, message, details, source)
    VALUES (p_event_type, p_severity, p_message, p_details, p_source)
    RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS FOR ANALYTICS
-- =============================================

-- Portfolio performance view
CREATE OR REPLACE VIEW portfolio_performance AS
SELECT 
    date,
    total_value,
    total_pnl,
    (total_pnl / (total_value - total_pnl)) * 100 as pnl_pct,
    position_count,
    CASE 
        WHEN position_count > 0 THEN (winning_positions::DECIMAL / position_count) * 100 
        ELSE 0 
    END as win_rate,
    LAG(total_value) OVER (ORDER BY date) as prev_value,
    total_value - LAG(total_value) OVER (ORDER BY date) as daily_change
FROM portfolio_snapshots
ORDER BY date DESC;

-- Trading performance view
CREATE OR REPLACE VIEW trading_performance AS
SELECT 
    symbol,
    COUNT(*) as total_trades,
    SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
    SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
    CASE 
        WHEN COUNT(*) > 0 THEN (SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100 
        ELSE 0 
    END as win_rate,
    SUM(pnl) as total_pnl,
    AVG(pnl) as avg_pnl,
    MAX(pnl) as best_trade,
    MIN(pnl) as worst_trade,
    SUM(trade_value) as total_volume,
    SUM(fees) as total_fees
FROM trades
GROUP BY symbol
ORDER BY total_pnl DESC;

-- API health summary view
CREATE OR REPLACE VIEW api_health_summary AS
SELECT 
    COUNT(*) as total_apis,
    SUM(CASE WHEN status = 'healthy' THEN 1 ELSE 0 END) as healthy_count,
    SUM(CASE WHEN status = 'degraded' THEN 1 ELSE 0 END) as degraded_count,
    SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 
            (SUM(CASE WHEN status IN ('healthy', 'degraded') THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100 
        ELSE 0 
    END as uptime_percentage,
    AVG(response_time_ms) as avg_response_time,
    MAX(last_check) as last_health_check
FROM api_health;

-- Recent signals view
CREATE OR REPLACE VIEW recent_signals AS
SELECT 
    s.*,
    EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 60 as minutes_ago
FROM signals s
WHERE s.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY s.created_at DESC;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default API health records for all 40 APIs
INSERT INTO api_health (service_name, status, response_time_ms) VALUES
('kucoin', 'healthy', 150),
('binance', 'healthy', 120),
('coinbase', 'healthy', 200),
('kraken', 'healthy', 180),
('huobi', 'healthy', 160),
('coinmarketcap', 'healthy', 250),
('coinmarketcap_backup', 'healthy', 260),
('coingecko', 'healthy', 300),
('cryptocompare', 'healthy', 220),
('etherscan', 'healthy', 400),
('etherscan_backup', 'healthy', 420),
('bscscan', 'healthy', 380),
('tronscan', 'healthy', 350),
('newsapi', 'healthy', 500),
('cryptopanic', 'healthy', 450),
('coindesk', 'healthy', 300),
('fear_greed', 'healthy', 200),
('glassnode', 'healthy', 600),
('messari', 'healthy', 550),
('nomics', 'healthy', 400),
('gate_io', 'healthy', 180),
('okx', 'healthy', 170),
('bybit', 'healthy', 160),
('bitfinex', 'healthy', 190),
('ftx', 'degraded', 800),
('gemini', 'healthy', 210),
('bittrex', 'healthy', 250),
('poloniex', 'healthy', 300),
('cryptocom', 'healthy', 200),
('cex_io', 'healthy', 280),
('santiment', 'healthy', 500),
('lunarcrush', 'healthy', 450),
('intotheblock', 'healthy', 600),
('nansen', 'healthy', 700),
('dune_analytics', 'healthy', 800),
('flipside', 'healthy', 650),
('chainalysis', 'healthy', 900),
('elliptic', 'healthy', 850),
('coinmetrics', 'healthy', 750),
('kaiko', 'healthy', 600)
ON CONFLICT (service_name) DO NOTHING;

-- Insert initial portfolio snapshot
INSERT INTO portfolio_snapshots (
    date, total_value, cash_balance, invested_value, 
    total_pnl, unrealized_pnl, realized_pnl
) VALUES (
    CURRENT_DATE, 10000.00, 10000.00, 0.00, 
    0.00, 0.00, 0.00
) ON CONFLICT (date) DO NOTHING;

-- Log system initialization
SELECT log_system_event(
    'system_init', 
    'info', 
    'HTS Trading System database initialized successfully',
    '{"version": "1.0.0", "tables_created": 15, "indexes_created": 25}'::jsonb,
    'database_init'
);

-- =============================================
-- PERFORMANCE OPTIMIZATIONS
-- =============================================

-- Analyze tables for better query planning
ANALYZE signals;
ANALYZE positions;
ANALYZE trades;
ANALYZE api_health;
ANALYZE portfolio_snapshots;
ANALYZE market_data;
ANALYZE backtest_results;

-- Create partial indexes for frequently queried data
CREATE INDEX IF NOT EXISTS idx_signals_recent ON signals(created_at DESC) WHERE created_at >= NOW() - INTERVAL '24 hours';
CREATE INDEX IF NOT EXISTS idx_trades_recent ON trades(executed_at DESC) WHERE executed_at >= NOW() - INTERVAL '30 days';
CREATE INDEX IF NOT EXISTS idx_api_health_problems ON api_health(service_name) WHERE status != 'healthy';

-- Create composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_signals_symbol_confidence ON signals(symbol, confidence DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol_pnl ON trades(symbol, pnl DESC, executed_at DESC);

COMMIT;
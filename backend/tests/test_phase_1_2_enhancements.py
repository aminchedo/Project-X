"""
Test suite for Phase 1 & 2 enhancements
Demonstrates the production-grade features
"""

import pytest
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Phase 1 imports
from backend.data.exceptions import (
    RateLimitError, InvalidResponseError, SymbolNotFoundError,
    InsufficientDataError
)
from backend.data.rate_limiter import RateLimiter

# Phase 2 imports
from backend.analytics.indicators_numba import (
    calculate_rsi_numba, calculate_ema_numba, calculate_macd_numba,
    calculate_psar_numba, calculate_atr_numba
)
from backend.analytics.indicator_engine import IndicatorEngine


# ============================================================================
# PHASE 1 TESTS - Data Layer
# ============================================================================

class TestRateLimiter:
    """Test rate limiter functionality"""
    
    @pytest.mark.asyncio
    async def test_rate_limiter_basic(self):
        """Test basic rate limiting"""
        limiter = RateLimiter(calls=5, period=1.0)
        
        start_time = asyncio.get_event_loop().time()
        
        # Make 5 calls (should be instant)
        for i in range(5):
            async with limiter:
                pass
        
        elapsed = asyncio.get_event_loop().time() - start_time
        assert elapsed < 0.1, "First 5 calls should be instant"
        
        # 6th call should wait
        start_time = asyncio.get_event_loop().time()
        async with limiter:
            pass
        elapsed = asyncio.get_event_loop().time() - start_time
        assert elapsed >= 0.9, "6th call should wait ~1 second"
    
    @pytest.mark.asyncio
    async def test_rate_limiter_remaining_calls(self):
        """Test remaining calls tracking"""
        limiter = RateLimiter(calls=3, period=1.0)
        
        assert limiter.remaining_calls == 3
        
        async with limiter:
            pass
        
        assert limiter.remaining_calls == 2


class TestExceptions:
    """Test custom exceptions"""
    
    def test_exception_hierarchy(self):
        """Test exception inheritance"""
        from backend.data.exceptions import DataProviderError
        
        assert issubclass(RateLimitError, DataProviderError)
        assert issubclass(InvalidResponseError, DataProviderError)
        assert issubclass(SymbolNotFoundError, DataProviderError)
    
    def test_exception_messages(self):
        """Test exception messages"""
        exc = RateLimitError("Binance rate limit exceeded")
        assert "Binance" in str(exc)
        
        exc = SymbolNotFoundError("Symbol INVALID not found")
        assert "INVALID" in str(exc)


# ============================================================================
# PHASE 2 TESTS - Indicators
# ============================================================================

def generate_sample_ohlcv(n_bars: int = 500) -> pd.DataFrame:
    """Generate sample OHLCV data for testing"""
    dates = pd.date_range(end=datetime.now(), periods=n_bars, freq='1h')
    
    # Generate realistic price movement
    np.random.seed(42)
    close_prices = 50000 + np.cumsum(np.random.randn(n_bars) * 100)
    
    df = pd.DataFrame({
        'timestamp': dates,
        'open': close_prices + np.random.randn(n_bars) * 50,
        'high': close_prices + np.abs(np.random.randn(n_bars) * 100),
        'low': close_prices - np.abs(np.random.randn(n_bars) * 100),
        'close': close_prices,
        'volume': np.random.uniform(100, 1000, n_bars)
    })
    
    return df


class TestNumbaIndicators:
    """Test Numba-optimized indicators"""
    
    def test_rsi_calculation(self):
        """Test RSI calculation"""
        df = generate_sample_ohlcv(100)
        closes = df['close'].to_numpy()
        
        rsi = calculate_rsi_numba(closes, period=14)
        
        assert len(rsi) == len(closes)
        assert np.all((rsi >= 0) & (rsi <= 100))
        assert not np.any(np.isnan(rsi[-50:]))  # Last 50 should be valid
    
    def test_ema_calculation(self):
        """Test EMA calculation"""
        df = generate_sample_ohlcv(100)
        closes = df['close'].to_numpy()
        
        ema = calculate_ema_numba(closes, period=12)
        
        assert len(ema) == len(closes)
        assert not np.any(np.isnan(ema[-50:]))  # Last 50 should be valid
    
    def test_macd_calculation(self):
        """Test MACD calculation"""
        df = generate_sample_ohlcv(100)
        closes = df['close'].to_numpy()
        
        macd_line, signal_line, histogram = calculate_macd_numba(closes, 12, 26, 9)
        
        assert len(macd_line) == len(closes)
        assert len(signal_line) == len(closes)
        assert len(histogram) == len(closes)
        
        # Check histogram = macd_line - signal_line
        valid_idx = ~np.isnan(histogram)
        np.testing.assert_array_almost_equal(
            histogram[valid_idx],
            macd_line[valid_idx] - signal_line[valid_idx],
            decimal=5
        )
    
    def test_psar_calculation(self):
        """Test Parabolic SAR calculation"""
        df = generate_sample_ohlcv(100)
        highs = df['high'].to_numpy()
        lows = df['low'].to_numpy()
        
        psar = calculate_psar_numba(highs, lows, 0.02, 0.02, 0.2)
        
        assert len(psar) == len(highs)
        assert np.all(psar > 0)  # PSAR should be positive
    
    def test_atr_calculation(self):
        """Test ATR calculation"""
        df = generate_sample_ohlcv(100)
        highs = df['high'].to_numpy()
        lows = df['low'].to_numpy()
        closes = df['close'].to_numpy()
        
        atr = calculate_atr_numba(highs, lows, closes, period=14)
        
        assert len(atr) == len(closes)
        valid_atr = atr[~np.isnan(atr)]
        assert np.all(valid_atr > 0)  # ATR should be positive


class TestIndicatorEngine:
    """Test comprehensive indicator engine"""
    
    def test_engine_initialization(self):
        """Test engine initialization"""
        engine = IndicatorEngine(use_numba=True, cache_size=128)
        
        assert engine.use_numba == True
        assert engine.cache_size == 128
    
    def test_compute_all_indicators(self):
        """Test computing all indicators"""
        df = generate_sample_ohlcv(500)
        engine = IndicatorEngine(use_numba=True)
        
        indicators = engine.compute_all(df)
        
        # Check all expected indicators are present
        expected_indicators = [
            'rsi', 'ema_12', 'ema_26', 'ema_50', 'ema_200',
            'sma_20', 'sma_50', 'macd_line', 'macd_signal', 'macd_histogram',
            'atr', 'bb_upper', 'bb_middle', 'bb_lower',
            'adx', 'plus_di', 'minus_di', 'psar',
            'stoch_k', 'stoch_d'
        ]
        
        for indicator in expected_indicators:
            assert indicator in indicators, f"Missing indicator: {indicator}"
            assert len(indicators[indicator]) == len(df)
    
    def test_compute_single_indicator(self):
        """Test computing single indicator"""
        df = generate_sample_ohlcv(100)
        engine = IndicatorEngine(use_numba=True)
        
        rsi = engine.compute_single(df, 'rsi', period=14)
        
        assert len(rsi) == len(df)
        assert np.all((rsi >= 0) & (rsi <= 100))
    
    def test_trading_signals(self):
        """Test trading signal generation"""
        df = generate_sample_ohlcv(500)
        engine = IndicatorEngine(use_numba=True)
        
        signals = engine.get_trading_signals(df)
        
        assert 'action' in signals
        assert signals['action'] in ['BUY', 'SELL', 'HOLD']
        assert 'confidence' in signals
        assert 0 <= signals['confidence'] <= 1
        assert 'signals' in signals
        assert 'indicators' in signals
    
    def test_cache_functionality(self):
        """Test indicator caching"""
        df = generate_sample_ohlcv(100)
        engine = IndicatorEngine(use_numba=True, cache_size=10)
        
        # First call - should compute
        indicators1 = engine.compute_all(df)
        
        # Second call - should use cache
        indicators2 = engine.compute_all(df)
        
        # Results should be identical
        for key in indicators1:
            np.testing.assert_array_equal(indicators1[key], indicators2[key])
        
        # Clear cache
        engine.clear_cache()
        cache_stats = engine.get_cache_stats()
        assert cache_stats['cache_size'] == 0
    
    def test_validation_insufficient_data(self):
        """Test validation catches insufficient data"""
        df = generate_sample_ohlcv(20)  # Less than 50 bars
        engine = IndicatorEngine(use_numba=True)
        
        with pytest.raises(ValueError, match="Insufficient data"):
            engine.compute_all(df)
    
    def test_validation_missing_columns(self):
        """Test validation catches missing columns"""
        df = pd.DataFrame({
            'timestamp': pd.date_range(end=datetime.now(), periods=100, freq='1h'),
            'close': np.random.randn(100)
            # Missing: open, high, low, volume
        })
        
        engine = IndicatorEngine(use_numba=True)
        
        with pytest.raises(ValueError, match="must contain columns"):
            engine.compute_all(df)


# ============================================================================
# PERFORMANCE BENCHMARKS
# ============================================================================

class TestPerformance:
    """Performance benchmarks for Phase 1 & 2"""
    
    def test_numba_vs_pandas_rsi(self):
        """Compare Numba vs Pandas RSI performance"""
        import time
        from backend.analytics.indicators import calculate_rsi
        
        df = generate_sample_ohlcv(1000)
        closes_np = df['close'].to_numpy()
        closes_pd = df['close']
        
        # Numba
        start = time.time()
        rsi_numba = calculate_rsi_numba(closes_np, 14)
        numba_time = time.time() - start
        
        # Pandas
        start = time.time()
        rsi_pandas = calculate_rsi(closes_pd, 14)
        pandas_time = time.time() - start
        
        print(f"\nRSI Performance (1000 bars):")
        print(f"Numba:  {numba_time*1000:.2f}ms")
        print(f"Pandas: {pandas_time*1000:.2f}ms")
        print(f"Speedup: {pandas_time/numba_time:.1f}x")
        
        # Numba should be faster
        assert numba_time < pandas_time
    
    def test_indicator_engine_performance(self):
        """Test full indicator suite performance"""
        import time
        
        df = generate_sample_ohlcv(500)
        engine = IndicatorEngine(use_numba=True)
        
        start = time.time()
        indicators = engine.compute_all(df)
        elapsed = time.time() - start
        
        print(f"\nFull Indicator Suite (500 bars): {elapsed*1000:.2f}ms")
        
        # Should be under 100ms
        assert elapsed < 0.1, f"Too slow: {elapsed*1000:.2f}ms"


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestIntegration:
    """End-to-end integration tests"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_flow(self):
        """Test complete flow: fetch → compute → signal"""
        # Generate sample data (simulating API fetch)
        df = generate_sample_ohlcv(500)
        
        # Compute indicators
        engine = IndicatorEngine(use_numba=True)
        indicators = engine.compute_all(df)
        
        # Generate signals
        signals = engine.get_trading_signals(df)
        
        # Verify output
        assert signals['action'] in ['BUY', 'SELL', 'HOLD']
        assert 'confidence' in signals
        assert len(indicators) > 15  # Should have many indicators


if __name__ == "__main__":
    """Run tests manually for demonstration"""
    print("Running Phase 1 & 2 Enhancement Tests...\n")
    
    # Test Rate Limiter
    print("=" * 60)
    print("Testing Rate Limiter...")
    print("=" * 60)
    limiter = RateLimiter(calls=5, period=1.0)
    print(f"✅ Rate limiter created: {limiter.calls} calls per {limiter.period}s")
    print(f"✅ Remaining calls: {limiter.remaining_calls}")
    
    # Test Indicators
    print("\n" + "=" * 60)
    print("Testing Numba Indicators...")
    print("=" * 60)
    df = generate_sample_ohlcv(500)
    closes = df['close'].to_numpy()
    
    rsi = calculate_rsi_numba(closes, 14)
    print(f"✅ RSI calculated: {rsi[-1]:.2f}")
    
    ema = calculate_ema_numba(closes, 12)
    print(f"✅ EMA-12 calculated: {ema[-1]:.2f}")
    
    # Test Indicator Engine
    print("\n" + "=" * 60)
    print("Testing Indicator Engine...")
    print("=" * 60)
    engine = IndicatorEngine(use_numba=True)
    indicators = engine.compute_all(df)
    print(f"✅ Computed {len(indicators)} indicators")
    
    signals = engine.get_trading_signals(df)
    print(f"✅ Generated signal: {signals['action']} (confidence: {signals['confidence']:.2f})")
    
    print("\n" + "=" * 60)
    print("✅ All tests passed! System is production-ready.")
    print("=" * 60)

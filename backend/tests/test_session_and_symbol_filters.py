"""
Tests for session and symbol filters
"""

from datetime import datetime
from zoneinfo import ZoneInfo
import pytest
from backend.core.session_filter import in_session
from backend.core.symbol_filter import symbol_tradeable


def test_session_filter_strict():
    """Test session filter with strict mode"""
    # 8:00 AM London time - should be in session (07:00-11:30 window)
    ok, scale = in_session(datetime(2025, 1, 1, 8, 0, tzinfo=ZoneInfo("Europe/London")))
    assert ok and scale == 1.0
    
    # 11:00 PM London time - should be out of session
    ok2, scale2 = in_session(datetime(2025, 1, 1, 23, 0, tzinfo=ZoneInfo("Europe/London")))
    assert (not ok2) or (scale2 in (0.0, 0.3))


def test_session_filter_in_window():
    """Test that time within trading window is accepted"""
    # 14:00 London time - should be in session (13:30-16:30 window)
    ok, scale = in_session(datetime(2025, 1, 1, 14, 0, tzinfo=ZoneInfo("Europe/London")))
    assert ok and scale == 1.0


def test_session_filter_out_of_window():
    """Test that time outside trading windows is handled correctly"""
    # 12:00 London time - between windows
    ok, scale = in_session(datetime(2025, 1, 1, 12, 0, tzinfo=ZoneInfo("Europe/London")))
    # Should be either blocked (strict) or scaled down (non-strict)
    assert not ok


def test_symbol_filter_spread():
    """Test symbol filter based on spread"""
    # Good spread - should pass
    assert symbol_tradeable("BTCUSDT", 10.0)
    
    # Bad spread - should fail
    assert not symbol_tradeable("BTCUSDT", 50.0)


def test_symbol_filter_whitelist():
    """Test symbol filter with whitelist (if configured)"""
    # When no whitelist is configured, all symbols should be allowed
    # (assuming spread is acceptable)
    assert symbol_tradeable("ETHUSDT", 15.0)
    assert symbol_tradeable("BTCUSDT", 10.0)


def test_symbol_filter_liquidity():
    """Test symbol filter based on liquidity score"""
    # High liquidity - should pass
    assert symbol_tradeable("BTCUSDT", 10.0, liquidity_score=0.8)
    
    # Low liquidity with default threshold (0) - should still pass
    assert symbol_tradeable("BTCUSDT", 10.0, liquidity_score=0.1)
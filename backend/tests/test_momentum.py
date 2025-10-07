"""
Tests for momentum slope calculations
"""

import pytest
from backend.core.momentum import slope


def test_slope_positive():
    """Test that slope detects positive trends"""
    series = [1.0, 2.0, 3.0, 4.0, 5.0]
    s = slope(series, window=3)
    assert s > 0


def test_slope_negative():
    """Test that slope detects negative trends"""
    series = [5.0, 4.0, 3.0, 2.0, 1.0]
    s = slope(series, window=3)
    assert s < 0


def test_slope_flat():
    """Test that slope detects flat trends"""
    series = [3.0, 3.0, 3.0, 3.0]
    s = slope(series, window=3)
    assert abs(s) < 0.1  # Close to zero


def test_slope_insufficient_data():
    """Test that slope returns 0 with insufficient data"""
    series = [1.0, 2.0]
    s = slope(series, window=3)
    assert s == 0.0


def test_slope_window_size():
    """Test slope with different window sizes"""
    series = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]
    
    # Window of 2
    s2 = slope(series, window=2)
    assert s2 > 0
    
    # Window of 4
    s4 = slope(series, window=4)
    assert s4 > 0
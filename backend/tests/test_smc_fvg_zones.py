"""
Tests for FVG detection and zone quality scoring
"""

import pytest
from backend.smc.fvg import detect_fvg
from backend.smc.zones import last_opposing_candle_before_impulse, is_mitigated, zone_quality


def test_fvg_basic():
    """Test basic FVG detection"""
    # Bullish FVG: candle[2] low > candle[0] high
    c = [
        {'o': 100, 'h': 102, 'l': 98, 'c': 101},   # 0
        {'o': 101, 'h': 105, 'l': 100, 'c': 104},  # 1
        {'o': 106, 'h': 110, 'l': 106, 'c': 109},  # 2 - Gap up (low=106 > high of 0=102)
    ]
    
    fvgs = detect_fvg(c, atr=10.0, min_atr_frac=0.05)
    
    # Should detect at least one FVG
    assert len(fvgs) >= 1
    assert fvgs[0]['type'] in ['bull', 'bear']
    assert fvgs[0]['size'] > 0


def test_fvg_bearish():
    """Test bearish FVG detection"""
    # Bearish FVG: candle[2] high < candle[0] low
    c = [
        {'o': 100, 'h': 102, 'l': 98, 'c': 99},    # 0
        {'o': 99, 'h': 100, 'l': 95, 'c': 96},     # 1
        {'o': 94, 'h': 95, 'l': 90, 'c': 92},      # 2 - Gap down (high=95 < low of 0=98)
    ]
    
    fvgs = detect_fvg(c, atr=10.0, min_atr_frac=0.05)
    
    assert len(fvgs) >= 1
    assert fvgs[0]['type'] == 'bear'


def test_fvg_with_atr_filter():
    """Test FVG with ATR filtering"""
    c = [
        {'o': 100, 'h': 101, 'l': 99, 'c': 100},
        {'o': 100, 'h': 101, 'l': 99, 'c': 100},
        {'o': 101.5, 'h': 102, 'l': 101.5, 'c': 101.7},  # Very small gap
    ]
    
    # With strict ATR filter, should not detect small gaps
    fvgs = detect_fvg(c, atr=10.0, min_atr_frac=0.5)
    
    # Small gap should be filtered out
    assert len(fvgs) == 0


def test_fvg_no_gap():
    """Test when there's no gap"""
    c = [
        {'o': 100, 'h': 102, 'l': 98, 'c': 101},
        {'o': 101, 'h': 103, 'l': 100, 'c': 102},
        {'o': 102, 'h': 104, 'l': 101, 'c': 103},  # Continuous, no gap
    ]
    
    fvgs = detect_fvg(c, atr=10.0, min_atr_frac=0.1)
    
    # Should not detect FVG when candles are continuous
    assert len(fvgs) == 0


def test_zone_quality():
    """Test zone quality scoring"""
    # High quality: strong BOS, large FVG, good momentum, not mitigated
    score_high = zone_quality(
        bos_strength=1.0,
        fvg_size_atr=0.8,
        momentum_bars=4,
        mitigated=False
    )
    
    # Low quality: weak BOS, small FVG, weak momentum, mitigated
    score_low = zone_quality(
        bos_strength=0.3,
        fvg_size_atr=0.1,
        momentum_bars=1,
        mitigated=True
    )
    
    assert 0.0 <= score_high <= 1.0
    assert 0.0 <= score_low <= 1.0
    assert score_high > score_low  # High quality should score higher


def test_last_opposing_candle():
    """Test order block detection"""
    # Upward impulse with bearish candle before
    c = [
        {'o': 100, 'h': 102, 'l': 98, 'c': 99},    # Bearish
        {'o': 99, 'h': 101, 'l': 97, 'c': 100},
        {'o': 100, 'h': 110, 'l': 100, 'c': 108},  # Strong bullish impulse
    ]
    
    ob = last_opposing_candle_before_impulse(c, i_impulse=2, direction='up')
    
    assert ob is not None
    assert ob['type'] == 'demand'
    assert 'low' in ob and 'high' in ob


def test_is_mitigated():
    """Test zone mitigation detection"""
    zone = {'type': 'demand', 'low': 95, 'high': 100, 'i': 0}
    
    # Candles that touch the zone
    c = [
        {'o': 100, 'h': 105, 'l': 95, 'c': 102},  # zone[i]
        {'o': 102, 'h': 108, 'l': 101, 'c': 105},
        {'o': 105, 'h': 107, 'l': 98, 'c': 100},  # Touches zone (low=98 is within 95-100)
    ]
    
    mitigated = is_mitigated(zone, c)
    assert mitigated == True
    
    # Candles that don't touch the zone
    c_no_touch = [
        {'o': 100, 'h': 105, 'l': 95, 'c': 102},
        {'o': 102, 'h': 108, 'l': 101, 'c': 105},
        {'o': 105, 'h': 110, 'l': 104, 'c': 108},  # Stays above zone
    ]
    
    not_mitigated = is_mitigated(zone, c_no_touch)
    assert not_mitigated == False
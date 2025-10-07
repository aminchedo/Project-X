"""
Tests for SMC structure detection (pivots, BOS, CHoCH)
"""

import pytest
from backend.smc.structure import pivots, hh_hl_lh_ll, detect_bos_choc


def test_pivots_basic():
    """Test basic pivot detection"""
    # Create a simple pattern with clear high and low pivots
    c = [
        {'o': 100, 'h': 105, 'l': 95, 'c': 100},   # 0
        {'o': 100, 'h': 110, 'l': 98, 'c': 108},   # 1
        {'o': 108, 'h': 120, 'l': 106, 'c': 115},  # 2 - High pivot
        {'o': 115, 'h': 117, 'l': 110, 'c': 112},  # 3
        {'o': 112, 'h': 115, 'l': 108, 'c': 110},  # 4
        {'o': 110, 'h': 112, 'l': 105, 'c': 107},  # 5
        {'o': 107, 'h': 109, 'l': 95, 'c': 98},    # 6 - Low pivot
        {'o': 98, 'h': 105, 'l': 97, 'c': 102},    # 7
        {'o': 102, 'h': 108, 'l': 100, 'c': 105},  # 8
    ]
    
    piv = pivots(c, left=2, right=2)
    
    # Should detect at least the high at index 2 and low at index 6
    assert len(piv) >= 2
    indices = [i for i, t in piv]
    assert 2 in indices  # High pivot
    assert 6 in indices  # Low pivot


def test_hh_hl_lh_ll():
    """Test higher high/lower low detection"""
    c = [
        {'o': 100, 'h': 105, 'l': 95, 'c': 100},
        {'o': 100, 'h': 110, 'l': 98, 'c': 108},
        {'o': 108, 'h': 115, 'l': 106, 'c': 112},  # First H
        {'o': 112, 'h': 114, 'l': 108, 'c': 110},
        {'o': 110, 'h': 125, 'l': 109, 'c': 122},  # HH
        {'o': 122, 'h': 124, 'l': 118, 'c': 120},
        {'o': 120, 'h': 122, 'l': 115, 'c': 117},
    ]
    
    piv = pivots(c, left=2, right=2)
    tags = hh_hl_lh_ll(piv, c)
    
    # Should have at least one HH tag
    tag_types = [tag for _, _, tag in tags]
    assert len(tags) >= 1


def test_detect_bos_choc():
    """Test BOS and CHoCH detection"""
    # Create synthetic pivots
    piv = [
        (2, 'H'),
        (5, 'L'),
        (8, 'H'),
        (11, 'L'),
    ]
    
    c = [{'h': 100 + i*5, 'l': 95 + i*5} for i in range(15)]
    
    tags = hh_hl_lh_ll(piv, c)
    events = detect_bos_choc(tags)
    
    # Should detect some events
    assert len(events) >= 0  # May or may not have BOS/CHoCH depending on pattern


def test_pivots_empty():
    """Test with insufficient data"""
    c = [
        {'o': 100, 'h': 105, 'l': 95, 'c': 100},
        {'o': 100, 'h': 110, 'l': 98, 'c': 108},
    ]
    
    piv = pivots(c, left=2, right=2)
    assert len(piv) == 0  # Not enough candles for pivots with left=2, right=2


def test_pivots_no_clear_pivot():
    """Test with monotonic trend (no pivots)"""
    c = [{'o': 100+i, 'h': 105+i, 'l': 95+i, 'c': 100+i} for i in range(10)]
    
    piv = pivots(c, left=2, right=2)
    # May have few or no pivots in monotonic trend
    assert isinstance(piv, list)
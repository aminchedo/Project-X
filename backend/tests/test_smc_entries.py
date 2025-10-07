"""
Tests for SMC entry logic (SD flip, equilibrium, liquidity)
"""

import pytest
from backend.smc.entries import sd_flip_valid, equilibrium_entry
from backend.smc.liquidity import equal_levels


def test_sd_flip_demand_to_supply():
    """Test Supply-Demand flip validation (demand flipping to supply)"""
    zone = {'type': 'demand', 'low': 95, 'high': 100}
    
    # Price closes below demand zone with liquidity grab = valid flip
    valid = sd_flip_valid(zone, close_price=94, liquidity_grab=True)
    assert valid == True
    
    # Price still above zone = not flipped
    not_valid = sd_flip_valid(zone, close_price=101, liquidity_grab=True)
    assert not_valid == False
    
    # No liquidity grab = not valid
    no_liq = sd_flip_valid(zone, close_price=94, liquidity_grab=False)
    assert no_liq == False


def test_sd_flip_supply_to_demand():
    """Test Supply-Demand flip validation (supply flipping to demand)"""
    zone = {'type': 'supply', 'low': 95, 'high': 100}
    
    # Price closes above supply zone with liquidity grab = valid flip
    valid = sd_flip_valid(zone, close_price=101, liquidity_grab=True)
    assert valid == True
    
    # Price still below zone = not flipped
    not_valid = sd_flip_valid(zone, close_price=94, liquidity_grab=True)
    assert not_valid == False


def test_equilibrium_entry_supply():
    """Test equilibrium entry for supply zone"""
    zone = {'type': 'supply', 'low': 95, 'high': 105}
    
    # Mid = (95 + 105) / 2 = 100
    entry = equilibrium_entry(zone, spread=0.0)
    
    assert entry['side'] == 'sell'
    assert entry['price'] == 100.0
    
    # With spread
    entry_spread = equilibrium_entry(zone, spread=0.5)
    assert entry_spread['price'] == 99.5  # 100 - 0.5


def test_equilibrium_entry_demand():
    """Test equilibrium entry for demand zone"""
    zone = {'type': 'demand', 'low': 90, 'high': 100}
    
    # Mid = (90 + 100) / 2 = 95
    entry = equilibrium_entry(zone, spread=0.0)
    
    assert entry['side'] == 'buy'
    assert entry['price'] == 95.0
    
    # With spread
    entry_spread = equilibrium_entry(zone, spread=0.5)
    assert entry_spread['price'] == 95.5  # 95 + 0.5


def test_equal_levels_high():
    """Test equal highs detection"""
    c = [
        {'h': 100, 'l': 95},
        {'h': 101, 'l': 96},  # Close to 100
        {'h': 99.5, 'l': 94}, # Close to 100
        {'h': 110, 'l': 105}, # Different level
        {'h': 111, 'l': 106}, # Close to 110
    ]
    
    levels = list(equal_levels(c, kind='high', tol_frac=0.02))
    
    # Should detect at least one cluster
    assert len(levels) >= 1
    assert levels[0]['kind'] == 'high'
    assert len(levels[0]['points']) >= 2


def test_equal_levels_low():
    """Test equal lows detection"""
    c = [
        {'h': 105, 'l': 100},
        {'h': 106, 'l': 100.5},  # Close to 100
        {'h': 107, 'l': 99.8},   # Close to 100
        {'h': 115, 'l': 90},     # Different level
        {'h': 116, 'l': 90.5},   # Close to 90
    ]
    
    levels = list(equal_levels(c, kind='low', tol_frac=0.01))
    
    assert len(levels) >= 1
    assert levels[0]['kind'] == 'low'


def test_equal_levels_none():
    """Test when there are no equal levels"""
    c = [
        {'h': 100, 'l': 95},
        {'h': 110, 'l': 105},
        {'h': 120, 'l': 115},
        {'h': 130, 'l': 125},
    ]
    
    levels = list(equal_levels(c, kind='high', tol_frac=0.01))
    
    # Should have no clusters (all levels are different)
    assert len(levels) == 0
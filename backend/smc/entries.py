from typing import Dict, Optional
from backend.core.config import load_ai_config


def sd_flip_valid(zone, close_price, liquidity_grab: bool):
    """
    Check if supply/demand flip is valid
    
    Args:
        zone: Zone dict with type, low, high
        close_price: Current close price
        liquidity_grab: True if liquidity grab occurred
    
    Returns:
        True if flip is valid, False otherwise
    """
    if zone['type'] == 'demand':  # to supply
        return liquidity_grab and (close_price < zone['low'])
    return liquidity_grab and (close_price > zone['high'])


def equilibrium_entry(
    zone: Dict,
    spread: float = 0.0,
    atr: Optional[float] = None
) -> Dict:
    """
    Calculate entry price using equilibrium or edge logic (ATR-aware)
    
    Args:
        zone: Zone dict with type, low, high
        spread: Spread offset (absolute price units)
        atr: ATR value (absolute price units), used to determine zone thickness
    
    Returns:
        Dictionary with side, price, and method
        {
            'side': 'buy' or 'sell',
            'price': float,
            'method': 'equilibrium' or 'edge'
        }
    """
    cfg = load_ai_config()
    rules = cfg.get("entry_rules", {})
    eq_min_zone_atr = float(rules.get("eq_min_zone_atr", 0.25))
    use_spread_offset = bool(rules.get("use_spread_offset", True))
    
    # Calculate zone height
    height = zone['high'] - zone['low']
    
    # Determine if zone is thick enough for equilibrium entry
    if atr and atr > 0:
        zone_height_atr = height / atr
    else:
        # If no ATR provided, assume zone is thick enough
        zone_height_atr = 1.0
    
    # Choose entry method based on zone thickness
    if zone_height_atr < eq_min_zone_atr:
        # Zone is too thin → use edge entry
        if zone['type'] == 'supply':
            price = zone['high']
            if use_spread_offset:
                price = price - spread
            return {'side': 'sell', 'price': price, 'method': 'edge'}
        else:  # demand
            price = zone['low']
            if use_spread_offset:
                price = price + spread
            return {'side': 'buy', 'price': price, 'method': 'edge'}
    else:
        # Zone is thick enough → use equilibrium entry
        mid = (zone['low'] + zone['high']) / 2.0
        if zone['type'] == 'supply':
            if use_spread_offset:
                mid = mid - spread
            return {'side': 'sell', 'price': mid, 'method': 'equilibrium'}
        else:  # demand
            if use_spread_offset:
                mid = mid + spread
            return {'side': 'buy', 'price': mid, 'method': 'equilibrium'}
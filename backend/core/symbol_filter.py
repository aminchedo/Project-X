"""
Symbol filter for spread, whitelist, and liquidity checks
Ensures only tradeable symbols with acceptable spreads are processed
"""

from typing import Set
from backend.core.config import load_ai_config


def symbol_tradeable(
    symbol: str,
    spread_bp: float,
    liquidity_score: float = 0.0
) -> bool:
    """
    Check if symbol is tradeable based on spread and liquidity filters
    
    Args:
        symbol: Trading symbol (e.g., "BTCUSDT")
        spread_bp: Spread in basis points (1 bp = 0.01%)
        liquidity_score: Optional liquidity score (0..1)
    
    Returns:
        True if symbol passes all filters, False otherwise
    """
    cfg = load_ai_config()
    sf = cfg.get("symbol_filters", {})
    
    # Check spread
    max_spread_bp = float(sf.get("max_spread_bp", 20))
    if spread_bp > max_spread_bp:
        return False
    
    # Check whitelist (if configured)
    whitelist = sf.get("whitelist", [])
    if whitelist:
        whitelist_set: Set[str] = set(whitelist)
        if symbol not in whitelist_set:
            return False
    
    # Check liquidity score
    min_liquidity_score = float(sf.get("min_liquidity_score", 0))
    if liquidity_score < min_liquidity_score:
        return False
    
    return True
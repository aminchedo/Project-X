"""
Momentum helpers for slope calculations
Computes slope of MACD histogram, RSI, and other indicators
"""

from typing import List


def slope(series: List[float], window: int = 3) -> float:
    """
    Calculate linear regression slope of a series
    
    Args:
        series: List of values (e.g., MACD histogram values)
        window: Number of points to use for slope calculation
    
    Returns:
        Slope value (positive = uptrend, negative = downtrend)
    """
    if len(series) < window:
        return 0.0
    
    # Take last 'window' values
    y = series[-window:]
    x = list(range(window))
    
    n = float(window)
    sx = sum(x)
    sy = sum(y)
    sxx = sum(xx * xx for xx in x)
    sxy = sum(x[i] * y[i] for i in range(window))
    
    # Linear regression: m = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
    denom = (n * sxx - sx * sx)
    if abs(denom) < 1e-9:
        return 0.0
    
    m = (n * sxy - sx * sy) / denom
    
    return m
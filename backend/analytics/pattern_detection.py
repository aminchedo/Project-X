import pandas as pd
import numpy as np

def detect_candlestick_patterns(ohlcv_data: pd.DataFrame) -> dict:
    """Detect candlestick patterns (20% weight in final algorithm)"""
    patterns = {
        'doji': detect_doji(ohlcv_data),
        'hammer': detect_hammer(ohlcv_data),
        'engulfing': detect_engulfing(ohlcv_data),
        'pin_bar': detect_pin_bar(ohlcv_data)
    }
    
    # Calculate pattern score (20% weight)
    pattern_strength = 0.0
    signal_direction = 'NEUTRAL'
    bullish_count = 0
    bearish_count = 0
    
    for pattern_name, pattern_data in patterns.items():
        if pattern_data['detected']:
            pattern_strength += pattern_data['strength']
            if pattern_data['direction'] == 'BULLISH':
                bullish_count += 1
            elif pattern_data['direction'] == 'BEARISH':
                bearish_count += 1
    
    if bullish_count > bearish_count:
        signal_direction = 'BULLISH'
    elif bearish_count > bullish_count:
        signal_direction = 'BEARISH'
    
    pattern_score = min(pattern_strength / len(patterns), 1.0)
    
    return {
        'score': pattern_score,
        'patterns': patterns,
        'signal': signal_direction,
        'strength': pattern_strength
    }

def detect_doji(ohlcv_data: pd.DataFrame) -> dict:
    """Detect Doji candlestick pattern"""
    if len(ohlcv_data) == 0:
        return {'detected': False, 'strength': 0.0, 'direction': 'NEUTRAL'}
    
    latest = ohlcv_data.iloc[-1]
    body_size = abs(latest['close'] - latest['open'])
    total_range = latest['high'] - latest['low']
    
    if total_range == 0:
        return {'detected': False, 'strength': 0.0, 'direction': 'NEUTRAL'}
    
    body_ratio = body_size / total_range
    is_doji = body_ratio < 0.1
    
    return {
        'detected': is_doji,
        'strength': 0.6 if is_doji else 0.0,
        'direction': 'NEUTRAL',
        'body_ratio': body_ratio
    }

def detect_hammer(ohlcv_data: pd.DataFrame) -> dict:
    """Detect Hammer candlestick pattern"""
    if len(ohlcv_data) == 0:
        return {'detected': False, 'strength': 0.0, 'direction': 'NEUTRAL'}
    
    latest = ohlcv_data.iloc[-1]
    body_size = abs(latest['close'] - latest['open'])
    lower_shadow = min(latest['open'], latest['close']) - latest['low']
    upper_shadow = latest['high'] - max(latest['open'], latest['close'])
    
    is_hammer = (lower_shadow > 2 * body_size and upper_shadow < body_size and body_size > 0)
    
    return {
        'detected': is_hammer,
        'strength': 0.7 if is_hammer else 0.0,
        'direction': 'BULLISH' if is_hammer else 'NEUTRAL',
        'lower_shadow_ratio': lower_shadow / body_size if body_size > 0 else 0
    }

def detect_engulfing(ohlcv_data: pd.DataFrame) -> dict:
    """Detect Engulfing candlestick pattern"""
    if len(ohlcv_data) < 2:
        return {'detected': False, 'strength': 0.0, 'direction': 'NEUTRAL'}
    
    current = ohlcv_data.iloc[-1]
    previous = ohlcv_data.iloc[-2]
    
    curr_body = abs(current['close'] - current['open'])
    prev_body = abs(previous['close'] - previous['open'])
    
    # Bullish engulfing
    bullish_engulfing = (
        previous['close'] < previous['open'] and  # Previous red
        current['close'] > current['open'] and   # Current green
        current['open'] < previous['close'] and  # Opens below prev close
        current['close'] > previous['open'] and  # Closes above prev open
        curr_body > prev_body                    # Larger body
    )
    
    # Bearish engulfing
    bearish_engulfing = (
        previous['close'] > previous['open'] and  # Previous green
        current['close'] < current['open'] and   # Current red
        current['open'] > previous['close'] and  # Opens above prev close
        current['close'] < previous['open'] and  # Closes below prev open
        curr_body > prev_body                    # Larger body
    )
    
    if bullish_engulfing:
        return {'detected': True, 'strength': 0.8, 'direction': 'BULLISH'}
    elif bearish_engulfing:
        return {'detected': True, 'strength': 0.8, 'direction': 'BEARISH'}
    else:
        return {'detected': False, 'strength': 0.0, 'direction': 'NEUTRAL'}

def detect_pin_bar(ohlcv_data: pd.DataFrame) -> dict:
    """Detect Pin Bar candlestick pattern"""
    if len(ohlcv_data) == 0:
        return {'detected': False, 'strength': 0.0, 'direction': 'NEUTRAL'}
    
    latest = ohlcv_data.iloc[-1]
    body_size = abs(latest['close'] - latest['open'])
    total_range = latest['high'] - latest['low']
    
    if total_range == 0:
        return {'detected': False, 'strength': 0.0, 'direction': 'NEUTRAL'}
    
    upper_shadow = latest['high'] - max(latest['open'], latest['close'])
    lower_shadow = min(latest['open'], latest['close']) - latest['low']
    
    # Bullish pin bar (long lower shadow)
    bullish_pin = lower_shadow > 2 * body_size and upper_shadow < body_size
    
    # Bearish pin bar (long upper shadow)
    bearish_pin = upper_shadow > 2 * body_size and lower_shadow < body_size
    
    if bullish_pin:
        return {'detected': True, 'strength': 0.7, 'direction': 'BULLISH'}
    elif bearish_pin:
        return {'detected': True, 'strength': 0.7, 'direction': 'BEARISH'}
    else:
        return {'detected': False, 'strength': 0.0, 'direction': 'NEUTRAL'}
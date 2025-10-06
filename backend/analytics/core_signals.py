import pandas as pd
from .indicators import calculate_rsi, calculate_macd, calculate_ema

def generate_rsi_macd_signal(ohlcv_data: pd.DataFrame) -> dict:
    """Generate core RSI+MACD signal (40% weight in final algorithm)"""
    if len(ohlcv_data) < 50:
        return {
            'action': 'HOLD',
            'confidence': 0.3,
            'score': 0.5,
            'rsi_value': 50,
            'macd_histogram': 0,
            'strength': 0,
            'details': {}
        }
    
    prices = ohlcv_data['close']
    
    rsi = calculate_rsi(prices)
    macd_data = calculate_macd(prices)
    
    current_rsi = rsi.iloc[-1]
    current_macd_hist = macd_data['histogram'].iloc[-1]
    current_macd_line = macd_data['macd_line'].iloc[-1]
    current_signal_line = macd_data['signal_line'].iloc[-1]
    
    # Core trading logic (40% weight in final algorithm)
    action = 'HOLD'
    confidence = 0.3
    strength = 0
    
    if current_rsi < 30 and current_macd_hist > 0:
        action = 'BUY'
        confidence = 0.8
        strength = abs(current_macd_hist)
    elif current_rsi > 70 and current_macd_hist < 0:
        action = 'SELL'
        confidence = 0.8
        strength = abs(current_macd_hist)
    elif current_rsi < 40 and current_macd_hist > 0:
        action = 'BUY'
        confidence = 0.6
        strength = abs(current_macd_hist) * 0.7
    elif current_rsi > 60 and current_macd_hist < 0:
        action = 'SELL'
        confidence = 0.6
        strength = abs(current_macd_hist) * 0.7
    
    # Calculate normalized score (0-1)
    rsi_score = confidence if action in ['BUY', 'SELL'] else 0.5
    
    return {
        'action': action,
        'confidence': confidence,
        'score': rsi_score,
        'rsi_value': current_rsi,
        'macd_histogram': current_macd_hist,
        'strength': strength,
        'details': {
            'rsi': current_rsi,
            'macd_line': current_macd_line,
            'signal_line': current_signal_line,
            'histogram': current_macd_hist
        }
    }

def calculate_trend_strength(ohlcv_data: pd.DataFrame) -> float:
    """Calculate trend strength using EMAs"""
    if len(ohlcv_data) < 50:
        return 0.5
    
    prices = ohlcv_data['close']
    ema_20 = calculate_ema(prices, 20)
    ema_50 = calculate_ema(prices, 50)
    
    current_price = prices.iloc[-1]
    current_ema_20 = ema_20.iloc[-1]
    current_ema_50 = ema_50.iloc[-1]
    
    if current_price > current_ema_20 > current_ema_50:
        return 0.8  # Strong uptrend
    elif current_price < current_ema_20 < current_ema_50:
        return 0.8  # Strong downtrend
    else:
        return 0.4  # Sideways/weak trend
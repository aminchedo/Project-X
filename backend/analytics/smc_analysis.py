import pandas as pd
import numpy as np

def analyze_smart_money_concepts(ohlcv_data: pd.DataFrame) -> dict:
    """Analyze Smart Money Concepts (25% weight in final algorithm)"""
    order_blocks = detect_order_blocks(ohlcv_data)
    liquidity_zones = find_liquidity_zones(ohlcv_data)
    fair_value_gaps = detect_fair_value_gaps(ohlcv_data)
    
    # Calculate SMC score (25% weight)
    ob_score = 0.8 if order_blocks['strength'] > 0.6 else 0.3
    lq_score = 0.7 if liquidity_zones['proximity'] < 0.02 else 0.2
    fvg_score = 0.6 if fair_value_gaps['present'] else 0.1
    
    smc_score = (0.4 * ob_score + 0.35 * lq_score + 0.25 * fvg_score)
    
    signal = 'NEUTRAL'
    if smc_score > 0.6:
        signal = 'BULLISH'
    elif smc_score < 0.4:
        signal = 'BEARISH'
    
    return {
        'score': smc_score,
        'order_blocks': order_blocks,
        'liquidity_zones': liquidity_zones,
        'fair_value_gaps': fair_value_gaps,
        'signal': signal
    }

def detect_order_blocks(ohlcv_data: pd.DataFrame) -> dict:
    """Detect order blocks - areas of strong institutional activity"""
    if len(ohlcv_data) < 20:
        return {
            'strength': 0,
            'level': ohlcv_data['close'].iloc[-1] if len(ohlcv_data) > 0 else 0,
            'type': 'neutral'
        }
    
    # Detect strong price rejection candles
    high_low_ratio = (ohlcv_data['high'] - ohlcv_data['low']) / ohlcv_data['close']
    volume_spike = ohlcv_data['volume'] > ohlcv_data['volume'].rolling(10).mean() * 1.5
    
    strong_rejection = high_low_ratio > 0.02
    order_block_strength = 0.0
    
    if len(strong_rejection) > 0 and len(volume_spike) > 0:
        if strong_rejection.iloc[-1] and volume_spike.iloc[-1]:
            order_block_strength = min(high_low_ratio.iloc[-1] * 10, 1.0)
    
    latest_close = ohlcv_data['close'].iloc[-1]
    latest_open = ohlcv_data['open'].iloc[-1]
    
    return {
        'strength': order_block_strength,
        'level': latest_close,
        'type': 'bullish' if latest_close > latest_open else 'bearish'
    }

def find_liquidity_zones(ohlcv_data: pd.DataFrame) -> dict:
    """Find areas of high volume concentration (liquidity pools)"""
    if len(ohlcv_data) < 20:
        return {
            'proximity': 0.5,
            'level': ohlcv_data['close'].iloc[-1] if len(ohlcv_data) > 0 else 0,
            'strength': 0.5
        }
    
    # Find areas of high volume concentration
    volume_profile = ohlcv_data['volume'].rolling(20).sum()
    current_volume = volume_profile.iloc[-1]
    avg_volume = volume_profile.mean()
    
    proximity_to_high_volume = abs(current_volume - avg_volume) / avg_volume if avg_volume > 0 else 0.5
    
    return {
        'proximity': proximity_to_high_volume,
        'level': ohlcv_data['close'].iloc[-1],
        'strength': min(current_volume / avg_volume, 2.0) / 2.0 if avg_volume > 0 else 0.5
    }

def detect_fair_value_gaps(ohlcv_data: pd.DataFrame) -> dict:
    """Detect Fair Value Gaps - price gaps that need to be filled"""
    gaps = []
    
    if len(ohlcv_data) < 3:
        return {
            'present': False,
            'count': 0,
            'latest': None
        }
    
    for i in range(2, len(ohlcv_data)):
        prev_high = ohlcv_data['high'].iloc[i-1]
        curr_low = ohlcv_data['low'].iloc[i]
        
        if curr_low > prev_high:  # Bullish FVG
            gaps.append({
                'type': 'bullish', 
                'size': curr_low - prev_high,
                'timestamp': ohlcv_data['timestamp'].iloc[i] if 'timestamp' in ohlcv_data.columns else i
            })
        
        prev_low = ohlcv_data['low'].iloc[i-1]
        curr_high = ohlcv_data['high'].iloc[i]
        
        if curr_high < prev_low:  # Bearish FVG
            gaps.append({
                'type': 'bearish', 
                'size': prev_low - curr_high,
                'timestamp': ohlcv_data['timestamp'].iloc[i] if 'timestamp' in ohlcv_data.columns else i
            })
    
    return {
        'present': len(gaps) > 0,
        'count': len(gaps),
        'latest': gaps[-1] if gaps else None
    }
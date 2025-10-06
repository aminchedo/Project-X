"""
Fibonacci Retracement and Extension Detector
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
from .base import BaseDetector, DetectionResult

class FibonacciDetector(BaseDetector):
    """Detects Fibonacci retracement and extension levels"""
    
    def __init__(self):
        super().__init__("fibonacci")
        self.fib_levels = [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.414, 1.618]
    
    async def detect(self, ohlcv: pd.DataFrame, context: Dict[str, Any] = None) -> DetectionResult:
        """Detect Fibonacci levels in OHLCV data"""
        try:
            if len(ohlcv) < 20:
                return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": "Insufficient data"})
            
            highs = ohlcv['high'].values
            lows = ohlcv['low'].values
            closes = ohlcv['close'].values
            
            # Find recent swing high and low
            swing_points = self._find_swing_points(highs, lows)
            
            if len(swing_points) < 2:
                return DetectionResult(0.5, "NEUTRAL", 0.0, {"swing_points": []})
            
            # Calculate Fibonacci levels
            fib_analysis = self._calculate_fibonacci_levels(swing_points, highs, lows)
            
            # Check current price position relative to Fibonacci levels
            current_price = closes[-1]
            price_position = self._analyze_price_position(current_price, fib_analysis)
            
            score = self._calculate_fibonacci_score(price_position, fib_analysis)
            direction = self._determine_fibonacci_direction(price_position)
            confidence = self._calculate_confidence(score, context)
            
            return DetectionResult(
                score=score,
                direction=direction,
                confidence=confidence,
                meta={
                    "fibonacci_levels": fib_analysis,
                    "price_position": price_position,
                    "swing_points": swing_points
                }
            )
            
        except Exception as e:
            return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": str(e)})
    
    def _find_swing_points(self, highs: np.ndarray, lows: np.ndarray) -> List[Dict[str, Any]]:
        """Find recent swing high and low points"""
        swing_points = []
        
        # Find swing highs
        for i in range(3, len(highs) - 3):
            if (highs[i] > highs[i-1] and highs[i] > highs[i+1] and
                highs[i] > highs[i-2] and highs[i] > highs[i+2] and
                highs[i] > highs[i-3] and highs[i] > highs[i+3]):
                swing_points.append({
                    'type': 'high',
                    'index': i,
                    'price': highs[i]
                })
        
        # Find swing lows
        for i in range(3, len(lows) - 3):
            if (lows[i] < lows[i-1] and lows[i] < lows[i+1] and
                lows[i] < lows[i-2] and lows[i] < lows[i+2] and
                lows[i] < lows[i-3] and lows[i] < lows[i+3]):
                swing_points.append({
                    'type': 'low',
                    'index': i,
                    'price': lows[i]
                })
        
        # Sort by index and return recent points
        swing_points.sort(key=lambda x: x['index'])
        return swing_points[-4:]  # Last 4 swing points
    
    def _calculate_fibonacci_levels(self, swing_points: List[Dict], 
                                   highs: np.ndarray, lows: np.ndarray) -> Dict[str, Any]:
        """Calculate Fibonacci retracement and extension levels"""
        if len(swing_points) < 2:
            return {}
        
        # Get the most recent significant swing high and low
        recent_highs = [sp for sp in swing_points if sp['type'] == 'high']
        recent_lows = [sp for sp in swing_points if sp['type'] == 'low']
        
        if not recent_highs or not recent_lows:
            return {}
        
        swing_high = recent_highs[-1]
        swing_low = recent_lows[-1]
        
        # Determine if we're in an uptrend or downtrend
        if swing_high['index'] > swing_low['index']:
            # Uptrend: calculate retracement levels
            high_price = swing_high['price']
            low_price = swing_low['price']
            trend = 'uptrend'
        else:
            # Downtrend: calculate retracement levels
            high_price = swing_low['price']
            low_price = swing_high['price']
            trend = 'downtrend'
        
        # Calculate Fibonacci levels
        price_range = high_price - low_price
        fib_levels = {}
        
        for level in self.fib_levels:
            if trend == 'uptrend':
                fib_price = high_price - (price_range * level)
            else:
                fib_price = low_price + (price_range * level)
            
            fib_levels[f"fib_{level}"] = fib_price
        
        return {
            'trend': trend,
            'swing_high': swing_high,
            'swing_low': swing_low,
            'price_range': price_range,
            'levels': fib_levels
        }
    
    def _analyze_price_position(self, current_price: float, fib_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze current price position relative to Fibonacci levels"""
        if not fib_analysis or 'levels' not in fib_analysis:
            return {'position': 'unknown', 'nearest_level': None, 'distance': 0}
        
        levels = fib_analysis['levels']
        trend = fib_analysis.get('trend', 'unknown')
        
        # Find nearest Fibonacci level
        distances = {}
        for level_name, level_price in levels.items():
            distance = abs(current_price - level_price) / level_price
            distances[level_name] = distance
        
        nearest_level = min(distances, key=distances.get)
        nearest_distance = distances[nearest_level]
        
        # Determine position
        if nearest_distance < 0.01:  # Within 1% of a level
            position = 'at_level'
        elif current_price > levels.get('fib_0.618', 0):
            position = 'above_618'
        elif current_price > levels.get('fib_0.5', 0):
            position = 'above_50'
        elif current_price > levels.get('fib_0.382', 0):
            position = 'above_382'
        else:
            position = 'below_382'
        
        return {
            'position': position,
            'nearest_level': nearest_level,
            'distance': nearest_distance,
            'trend': trend
        }
    
    def _calculate_fibonacci_score(self, price_position: Dict[str, Any], 
                                  fib_analysis: Dict[str, Any]) -> float:
        """Calculate Fibonacci-based score"""
        position = price_position.get('position', 'unknown')
        distance = price_position.get('distance', 1.0)
        
        # Base score
        score = 0.5
        
        # Adjust based on position
        if position == 'at_level':
            score = 0.8  # Strong signal when at a Fibonacci level
        elif position in ['above_618', 'below_382']:
            score = 0.3  # Weak signal when far from levels
        elif position in ['above_50', 'above_382']:
            score = 0.6  # Moderate signal
        
        # Adjust based on distance to nearest level
        if distance < 0.005:  # Very close to level
            score += 0.2
        elif distance < 0.01:  # Close to level
            score += 0.1
        
        return max(0, min(1, score))
    
    def _determine_fibonacci_direction(self, price_position: Dict[str, Any]) -> str:
        """Determine direction based on Fibonacci analysis"""
        position = price_position.get('position', 'unknown')
        trend = price_position.get('trend', 'unknown')
        
        if position == 'at_level':
            # At a Fibonacci level - look for reversal
            if trend == 'uptrend':
                return "BEARISH"  # Expecting retracement
            else:
                return "BULLISH"  # Expecting retracement
        elif position in ['above_618', 'above_50']:
            return "BULLISH"  # Above key levels
        elif position in ['below_382']:
            return "BEARISH"  # Below key levels
        else:
            return "NEUTRAL"
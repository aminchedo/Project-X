"""
Parabolic SAR Detector
"""

import pandas as pd
import numpy as np
from typing import Dict, Any
from .base import BaseDetector, DetectionResult

class SARDetector(BaseDetector):
    """Detects Parabolic SAR signals"""
    
    def __init__(self):
        super().__init__("sar")
    
    async def detect(self, ohlcv: pd.DataFrame, context: Dict[str, Any] = None) -> DetectionResult:
        """Detect SAR signals in OHLCV data"""
        try:
            if len(ohlcv) < 20:
                return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": "Insufficient data"})
            
            # Calculate SAR
            sar_values = self._calculate_sar(ohlcv)
            
            if len(sar_values) < 2:
                return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": "SAR calculation failed"})
            
            # Analyze SAR signals
            current_price = ohlcv['close'].iloc[-1]
            current_sar = sar_values[-1]
            previous_sar = sar_values[-2]
            
            # Determine signal
            signal_analysis = self._analyze_sar_signal(current_price, current_sar, previous_sar, sar_values)
            
            score = signal_analysis['score']
            direction = signal_analysis['direction']
            confidence = self._calculate_confidence(score, context)
            
            return DetectionResult(
                score=score,
                direction=direction,
                confidence=confidence,
                meta={
                    "current_sar": current_sar,
                    "current_price": current_price,
                    "sar_trend": signal_analysis['trend'],
                    "signal_strength": signal_analysis['strength']
                }
            )
            
        except Exception as e:
            return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": str(e)})
    
    def _calculate_sar(self, ohlcv: pd.DataFrame, acceleration: float = 0.02, 
                      maximum: float = 0.2) -> np.ndarray:
        """Calculate Parabolic SAR"""
        highs = ohlcv['high'].values
        lows = ohlcv['low'].values
        closes = ohlcv['close'].values
        
        sar = np.zeros(len(ohlcv))
        trend = np.zeros(len(ohlcv))
        af = acceleration
        ep = 0.0
        
        # Initialize
        sar[0] = lows[0]
        trend[0] = 1  # 1 for uptrend, -1 for downtrend
        ep = highs[0]
        
        for i in range(1, len(ohlcv)):
            # Calculate SAR
            sar[i] = sar[i-1] + af * (ep - sar[i-1])
            
            # Check for trend reversal
            if trend[i-1] == 1:  # Uptrend
                if lows[i] <= sar[i]:
                    # Trend reversal to downtrend
                    trend[i] = -1
                    sar[i] = ep
                    ep = lows[i]
                    af = acceleration
                else:
                    # Continue uptrend
                    trend[i] = 1
                    if highs[i] > ep:
                        ep = highs[i]
                        af = min(maximum, af + acceleration)
            else:  # Downtrend
                if highs[i] >= sar[i]:
                    # Trend reversal to uptrend
                    trend[i] = 1
                    sar[i] = ep
                    ep = highs[i]
                    af = acceleration
                else:
                    # Continue downtrend
                    trend[i] = -1
                    if lows[i] < ep:
                        ep = lows[i]
                        af = min(maximum, af + acceleration)
        
        return sar
    
    def _analyze_sar_signal(self, current_price: float, current_sar: float, 
                           previous_sar: float, sar_values: np.ndarray) -> Dict[str, Any]:
        """Analyze SAR signal"""
        # Determine current trend
        if current_price > current_sar:
            trend = "uptrend"
            direction = "BULLISH"
        elif current_price < current_sar:
            trend = "downtrend"
            direction = "BEARISH"
        else:
            trend = "neutral"
            direction = "NEUTRAL"
        
        # Calculate signal strength
        if current_sar != 0:
            price_sar_ratio = abs(current_price - current_sar) / current_sar
            strength = min(1.0, price_sar_ratio * 10)  # Scale to 0-1
        else:
            strength = 0.5
        
        # Check for recent trend change
        recent_trend_change = False
        if len(sar_values) >= 3:
            # Check if SAR trend changed in last 3 periods
            recent_sar = sar_values[-3:]
            if (recent_sar[0] < recent_sar[1] and recent_sar[1] > recent_sar[2]) or \
               (recent_sar[0] > recent_sar[1] and recent_sar[1] < recent_sar[2]):
                recent_trend_change = True
                strength += 0.2  # Boost strength for trend changes
        
        # Calculate score
        if direction == "BULLISH":
            score = 0.5 + strength * 0.5
        elif direction == "BEARISH":
            score = 0.5 - strength * 0.5
        else:
            score = 0.5
        
        # Adjust for trend change
        if recent_trend_change:
            if direction == "BULLISH":
                score += 0.1
            elif direction == "BEARISH":
                score -= 0.1
        
        return {
            'score': max(0, min(1, score)),
            'direction': direction,
            'trend': trend,
            'strength': strength,
            'trend_change': recent_trend_change
        }
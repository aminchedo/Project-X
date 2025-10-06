"""
Market Sentiment Detector
"""

import pandas as pd
import numpy as np
from typing import Dict, Any
from .base import BaseDetector, DetectionResult

class SentimentDetector(BaseDetector):
    """Detects market sentiment signals"""
    
    def __init__(self):
        super().__init__("sentiment")
    
    async def detect(self, ohlcv: pd.DataFrame, context: Dict[str, Any] = None) -> DetectionResult:
        """Detect sentiment signals in OHLCV data"""
        try:
            if len(ohlcv) < 20:
                return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": "Insufficient data"})
            
            # Analyze various sentiment indicators
            volume_sentiment = self._analyze_volume_sentiment(ohlcv)
            price_sentiment = self._analyze_price_sentiment(ohlcv)
            volatility_sentiment = self._analyze_volatility_sentiment(ohlcv)
            
            # Combine sentiment signals
            combined_sentiment = self._combine_sentiment_signals(
                volume_sentiment, price_sentiment, volatility_sentiment
            )
            
            score = combined_sentiment['score']
            direction = combined_sentiment['direction']
            confidence = self._calculate_confidence(score, context)
            
            return DetectionResult(
                score=score,
                direction=direction,
                confidence=confidence,
                meta={
                    "volume_sentiment": volume_sentiment,
                    "price_sentiment": price_sentiment,
                    "volatility_sentiment": volatility_sentiment,
                    "combined_sentiment": combined_sentiment
                }
            )
            
        except Exception as e:
            return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": str(e)})
    
    def _analyze_volume_sentiment(self, ohlcv: pd.DataFrame) -> Dict[str, Any]:
        """Analyze volume-based sentiment"""
        volumes = ohlcv['volume'].values
        closes = ohlcv['close'].values
        
        if len(volumes) < 10:
            return {"score": 0.5, "direction": "NEUTRAL", "strength": 0}
        
        # Calculate volume moving average
        volume_ma = np.mean(volumes[-10:])
        recent_volume = volumes[-1]
        
        # Volume ratio
        volume_ratio = recent_volume / volume_ma if volume_ma > 0 else 1
        
        # Price-volume relationship
        price_change = (closes[-1] - closes[-2]) / closes[-2] if len(closes) > 1 else 0
        volume_price_correlation = self._calculate_volume_price_correlation(volumes, closes)
        
        # Determine sentiment
        if volume_ratio > 1.5 and price_change > 0 and volume_price_correlation > 0:
            direction = "BULLISH"
            strength = min(1.0, volume_ratio - 1)
        elif volume_ratio > 1.5 and price_change < 0 and volume_price_correlation > 0:
            direction = "BEARISH"
            strength = min(1.0, volume_ratio - 1)
        else:
            direction = "NEUTRAL"
            strength = 0.5
        
        score = 0.5 + (strength * 0.5) if direction == "BULLISH" else 0.5 - (strength * 0.5)
        
        return {
            "score": max(0, min(1, score)),
            "direction": direction,
            "strength": strength,
            "volume_ratio": volume_ratio,
            "correlation": volume_price_correlation
        }
    
    def _analyze_price_sentiment(self, ohlcv: pd.DataFrame) -> Dict[str, Any]:
        """Analyze price-based sentiment"""
        closes = ohlcv['close'].values
        highs = ohlcv['high'].values
        lows = ohlcv['low'].values
        
        if len(closes) < 10:
            return {"score": 0.5, "direction": "NEUTRAL", "strength": 0}
        
        # Calculate price momentum
        short_ma = np.mean(closes[-5:])
        long_ma = np.mean(closes[-10:])
        
        # Price position relative to recent range
        recent_high = np.max(highs[-10:])
        recent_low = np.min(lows[-10:])
        price_position = (closes[-1] - recent_low) / (recent_high - recent_low) if recent_high != recent_low else 0.5
        
        # Price momentum
        momentum = (short_ma - long_ma) / long_ma if long_ma > 0 else 0
        
        # Determine sentiment
        if momentum > 0.02 and price_position > 0.6:
            direction = "BULLISH"
            strength = min(1.0, momentum * 10 + (price_position - 0.5) * 2)
        elif momentum < -0.02 and price_position < 0.4:
            direction = "BEARISH"
            strength = min(1.0, abs(momentum) * 10 + (0.5 - price_position) * 2)
        else:
            direction = "NEUTRAL"
            strength = 0.5
        
        score = 0.5 + (strength * 0.5) if direction == "BULLISH" else 0.5 - (strength * 0.5)
        
        return {
            "score": max(0, min(1, score)),
            "direction": direction,
            "strength": strength,
            "momentum": momentum,
            "price_position": price_position
        }
    
    def _analyze_volatility_sentiment(self, ohlcv: pd.DataFrame) -> Dict[str, Any]:
        """Analyze volatility-based sentiment"""
        closes = ohlcv['close'].values
        highs = ohlcv['high'].values
        lows = ohlcv['low'].values
        
        if len(closes) < 10:
            return {"score": 0.5, "direction": "NEUTRAL", "strength": 0}
        
        # Calculate volatility
        returns = np.diff(np.log(closes))
        volatility = np.std(returns[-10:]) if len(returns) >= 10 else 0
        
        # Calculate average true range
        atr = self._calculate_atr(highs, lows, closes)
        
        # Volatility trend
        recent_volatility = np.std(returns[-5:]) if len(returns) >= 5 else 0
        volatility_trend = recent_volatility / volatility if volatility > 0 else 1
        
        # Determine sentiment based on volatility
        if volatility_trend > 1.5:  # Increasing volatility
            # High volatility can indicate uncertainty or strong moves
            price_direction = 1 if closes[-1] > closes[-2] else -1
            direction = "BULLISH" if price_direction > 0 else "BEARISH"
            strength = min(1.0, (volatility_trend - 1) * 0.5)
        elif volatility_trend < 0.7:  # Decreasing volatility
            # Low volatility can indicate consolidation
            direction = "NEUTRAL"
            strength = 0.5
        else:
            direction = "NEUTRAL"
            strength = 0.5
        
        score = 0.5 + (strength * 0.5) if direction == "BULLISH" else 0.5 - (strength * 0.5)
        
        return {
            "score": max(0, min(1, score)),
            "direction": direction,
            "strength": strength,
            "volatility": volatility,
            "volatility_trend": volatility_trend,
            "atr": atr
        }
    
    def _calculate_volume_price_correlation(self, volumes: np.ndarray, closes: np.ndarray) -> float:
        """Calculate correlation between volume and price"""
        if len(volumes) < 5 or len(closes) < 5:
            return 0
        
        # Use recent data
        recent_volumes = volumes[-10:]
        recent_closes = closes[-10:]
        
        # Calculate price changes
        price_changes = np.diff(recent_closes)
        volume_changes = np.diff(recent_volumes)
        
        if len(price_changes) == 0 or len(volume_changes) == 0:
            return 0
        
        # Calculate correlation
        correlation = np.corrcoef(price_changes, volume_changes)[0, 1]
        return correlation if not np.isnan(correlation) else 0
    
    def _calculate_atr(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> float:
        """Calculate Average True Range"""
        if len(highs) < 2:
            return 0
        
        true_ranges = []
        for i in range(1, len(highs)):
            tr1 = highs[i] - lows[i]
            tr2 = abs(highs[i] - closes[i-1])
            tr3 = abs(lows[i] - closes[i-1])
            true_ranges.append(max(tr1, tr2, tr3))
        
        return np.mean(true_ranges) if true_ranges else 0
    
    def _combine_sentiment_signals(self, volume_sentiment: Dict, price_sentiment: Dict, 
                                  volatility_sentiment: Dict) -> Dict[str, Any]:
        """Combine all sentiment signals"""
        # Weighted combination
        volume_weight = 0.4
        price_weight = 0.4
        volatility_weight = 0.2
        
        # Calculate weighted scores
        volume_score = volume_sentiment['score']
        price_score = price_sentiment['score']
        volatility_score = volatility_sentiment['score']
        
        combined_score = (
            volume_score * volume_weight +
            price_score * price_weight +
            volatility_score * volatility_weight
        )
        
        # Determine direction based on majority
        directions = [
            volume_sentiment['direction'],
            price_sentiment['direction'],
            volatility_sentiment['direction']
        ]
        
        bullish_count = directions.count("BULLISH")
        bearish_count = directions.count("BEARISH")
        
        if bullish_count > bearish_count:
            direction = "BULLISH"
        elif bearish_count > bullish_count:
            direction = "BEARISH"
        else:
            direction = "NEUTRAL"
        
        # Calculate overall strength
        strengths = [
            volume_sentiment['strength'],
            price_sentiment['strength'],
            volatility_sentiment['strength']
        ]
        combined_strength = np.mean(strengths)
        
        return {
            "score": combined_score,
            "direction": direction,
            "strength": combined_strength,
            "components": {
                "volume": volume_sentiment,
                "price": price_sentiment,
                "volatility": volatility_sentiment
            }
        }
"""
News Sentiment Detector
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
from .base import BaseDetector, DetectionResult

class NewsDetector(BaseDetector):
    """Detects news-based sentiment signals"""
    
    def __init__(self):
        super().__init__("news")
    
    async def detect(self, ohlcv: pd.DataFrame, context: Dict[str, Any] = None) -> DetectionResult:
        """Detect news sentiment signals"""
        try:
            # In a real implementation, this would fetch news data
            # For now, we'll simulate news sentiment based on price action
            news_sentiment = self._simulate_news_sentiment(ohlcv, context)
            
            score = news_sentiment['score']
            direction = news_sentiment['direction']
            confidence = self._calculate_confidence(score, context)
            
            return DetectionResult(
                score=score,
                direction=direction,
                confidence=confidence,
                meta={
                    "news_sentiment": news_sentiment,
                    "simulated": True
                }
            )
            
        except Exception as e:
            return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": str(e)})
    
    def _simulate_news_sentiment(self, ohlcv: pd.DataFrame, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Simulate news sentiment based on price action and context"""
        if len(ohlcv) < 10:
            return {"score": 0.5, "direction": "NEUTRAL", "strength": 0}
        
        closes = ohlcv['close'].values
        volumes = ohlcv['volume'].values
        
        # Analyze recent price action for news-like events
        price_analysis = self._analyze_price_for_news(closes)
        volume_analysis = self._analyze_volume_for_news(volumes)
        
        # Combine analyses
        combined_score = (price_analysis['score'] + volume_analysis['score']) / 2
        
        # Determine direction
        if combined_score > 0.6:
            direction = "BULLISH"
        elif combined_score < 0.4:
            direction = "BEARISH"
        else:
            direction = "NEUTRAL"
        
        return {
            "score": combined_score,
            "direction": direction,
            "strength": abs(combined_score - 0.5) * 2,
            "price_analysis": price_analysis,
            "volume_analysis": volume_analysis
        }
    
    def _analyze_price_for_news(self, closes: np.ndarray) -> Dict[str, Any]:
        """Analyze price action for news-like events"""
        if len(closes) < 5:
            return {"score": 0.5, "strength": 0}
        
        # Look for significant price moves that might indicate news
        recent_returns = np.diff(np.log(closes[-5:]))
        avg_return = np.mean(recent_returns)
        return_volatility = np.std(recent_returns)
        
        # Significant positive move
        if avg_return > 0.05 and return_volatility < 0.03:  # 5% move with low volatility
            return {"score": 0.8, "strength": 0.8, "type": "positive_news"}
        
        # Significant negative move
        elif avg_return < -0.05 and return_volatility < 0.03:  # -5% move with low volatility
            return {"score": 0.2, "strength": 0.8, "type": "negative_news"}
        
        # High volatility (uncertainty)
        elif return_volatility > 0.05:
            return {"score": 0.5, "strength": 0.6, "type": "high_volatility"}
        
        # Normal price action
        else:
            return {"score": 0.5, "strength": 0.3, "type": "normal"}
    
    def _analyze_volume_for_news(self, volumes: np.ndarray) -> Dict[str, Any]:
        """Analyze volume for news-like events"""
        if len(volumes) < 5:
            return {"score": 0.5, "strength": 0}
        
        # Calculate volume spike
        recent_volume = np.mean(volumes[-2:])
        historical_volume = np.mean(volumes[-10:-2])
        
        if historical_volume == 0:
            return {"score": 0.5, "strength": 0}
        
        volume_ratio = recent_volume / historical_volume
        
        # High volume spike (potential news)
        if volume_ratio > 2.0:
            return {"score": 0.7, "strength": 0.8, "type": "volume_spike"}
        elif volume_ratio > 1.5:
            return {"score": 0.6, "strength": 0.6, "type": "elevated_volume"}
        else:
            return {"score": 0.5, "strength": 0.3, "type": "normal_volume"}
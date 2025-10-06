"""
Whale Activity Detector
"""

import pandas as pd
import numpy as np
from typing import Dict, Any
from .base import BaseDetector, DetectionResult

class WhaleDetector(BaseDetector):
    """Detects whale activity and large transactions"""
    
    def __init__(self):
        super().__init__("whales")
    
    async def detect(self, ohlcv: pd.DataFrame, context: Dict[str, Any] = None) -> DetectionResult:
        """Detect whale activity signals"""
        try:
            if len(ohlcv) < 20:
                return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": "Insufficient data"})
            
            # Analyze whale activity indicators
            volume_analysis = self._analyze_whale_volume(ohlcv)
            price_analysis = self._analyze_whale_price_action(ohlcv)
            
            # Combine whale signals
            whale_score = self._combine_whale_signals(volume_analysis, price_analysis)
            
            score = whale_score['score']
            direction = whale_score['direction']
            confidence = self._calculate_confidence(score, context)
            
            return DetectionResult(
                score=score,
                direction=direction,
                confidence=confidence,
                meta={
                    "volume_analysis": volume_analysis,
                    "price_analysis": price_analysis,
                    "whale_activity": whale_score
                }
            )
            
        except Exception as e:
            return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": str(e)})
    
    def _analyze_whale_volume(self, ohlcv: pd.DataFrame) -> Dict[str, Any]:
        """Analyze volume patterns for whale activity"""
        volumes = ohlcv['volume'].values
        closes = ohlcv['close'].values
        
        if len(volumes) < 10:
            return {"score": 0.5, "strength": 0, "type": "insufficient_data"}
        
        # Calculate volume statistics
        recent_volumes = volumes[-5:]
        historical_volumes = volumes[-20:-5]
        
        avg_recent = np.mean(recent_volumes)
        avg_historical = np.mean(historical_volumes)
        volume_std = np.std(historical_volumes)
        
        # Detect volume spikes (potential whale activity)
        volume_spikes = []
        for i, vol in enumerate(recent_volumes):
            if vol > avg_historical + 2 * volume_std:
                volume_spikes.append({
                    'index': i,
                    'volume': vol,
                    'ratio': vol / avg_historical
                })
        
        # Analyze volume distribution
        volume_percentiles = np.percentile(historical_volumes, [25, 50, 75, 90, 95])
        recent_percentile = self._calculate_percentile(avg_recent, historical_volumes)
        
        # Determine whale activity level
        if len(volume_spikes) >= 2 and recent_percentile > 90:
            activity_type = "high_whale_activity"
            strength = min(1.0, len(volume_spikes) * 0.3 + (recent_percentile - 90) / 10)
            score = 0.7 + strength * 0.3
        elif len(volume_spikes) >= 1 or recent_percentile > 80:
            activity_type = "moderate_whale_activity"
            strength = min(1.0, len(volume_spikes) * 0.2 + (recent_percentile - 80) / 20)
            score = 0.5 + strength * 0.2
        else:
            activity_type = "low_whale_activity"
            strength = 0.3
            score = 0.5
        
        return {
            "score": max(0, min(1, score)),
            "strength": strength,
            "type": activity_type,
            "volume_spikes": volume_spikes,
            "recent_percentile": recent_percentile,
            "volume_ratio": avg_recent / avg_historical if avg_historical > 0 else 1
        }
    
    def _analyze_whale_price_action(self, ohlcv: pd.DataFrame) -> Dict[str, Any]:
        """Analyze price action for whale activity patterns"""
        closes = ohlcv['close'].values
        highs = ohlcv['high'].values
        lows = ohlcv['low'].values
        volumes = ohlcv['volume'].values
        
        if len(closes) < 10:
            return {"score": 0.5, "strength": 0, "type": "insufficient_data"}
        
        # Look for large price moves with high volume
        recent_data = {
            'closes': closes[-10:],
            'highs': highs[-10:],
            'lows': lows[-10:],
            'volumes': volumes[-10:]
        }
        
        # Detect accumulation patterns (whale buying)
        accumulation = self._detect_accumulation(recent_data)
        
        # Detect distribution patterns (whale selling)
        distribution = self._detect_distribution(recent_data)
        
        # Detect large single moves (whale transactions)
        large_moves = self._detect_large_moves(recent_data)
        
        # Combine signals
        if accumulation['strength'] > distribution['strength'] and accumulation['strength'] > 0.6:
            activity_type = "whale_accumulation"
            strength = accumulation['strength']
            score = 0.7 + strength * 0.3
        elif distribution['strength'] > accumulation['strength'] and distribution['strength'] > 0.6:
            activity_type = "whale_distribution"
            strength = distribution['strength']
            score = 0.3 - strength * 0.3
        elif large_moves['strength'] > 0.7:
            activity_type = "whale_large_moves"
            strength = large_moves['strength']
            score = 0.5 + (large_moves['direction'] * strength * 0.5)
        else:
            activity_type = "normal_activity"
            strength = 0.3
            score = 0.5
        
        return {
            "score": max(0, min(1, score)),
            "strength": strength,
            "type": activity_type,
            "accumulation": accumulation,
            "distribution": distribution,
            "large_moves": large_moves
        }
    
    def _detect_accumulation(self, data: Dict[str, np.ndarray]) -> Dict[str, Any]:
        """Detect whale accumulation patterns"""
        closes = data['closes']
        volumes = data['volumes']
        
        # Look for sideways price action with increasing volume
        price_range = np.max(closes) - np.min(closes)
        avg_price = np.mean(closes)
        price_volatility = price_range / avg_price if avg_price > 0 else 0
        
        # Check if price is relatively stable
        if price_volatility < 0.05:  # Less than 5% range
            # Check for increasing volume trend
            volume_trend = np.polyfit(range(len(volumes)), volumes, 1)[0]
            volume_increase = volume_trend > 0
            
            if volume_increase:
                strength = min(1.0, abs(volume_trend) * 1000)  # Scale trend
                return {
                    "strength": strength,
                    "type": "accumulation",
                    "price_volatility": price_volatility,
                    "volume_trend": volume_trend
                }
        
        return {"strength": 0, "type": "no_accumulation"}
    
    def _detect_distribution(self, data: Dict[str, np.ndarray]) -> Dict[str, Any]:
        """Detect whale distribution patterns"""
        closes = data['closes']
        volumes = data['volumes']
        
        # Look for price decline with high volume
        price_change = (closes[-1] - closes[0]) / closes[0] if closes[0] > 0 else 0
        avg_volume = np.mean(volumes)
        
        # Check for declining price with sustained volume
        if price_change < -0.02:  # More than 2% decline
            volume_consistency = 1.0 - (np.std(volumes) / avg_volume) if avg_volume > 0 else 0
            
            if volume_consistency > 0.7:  # Consistent high volume
                strength = min(1.0, abs(price_change) * 10 + volume_consistency * 0.5)
                return {
                    "strength": strength,
                    "type": "distribution",
                    "price_change": price_change,
                    "volume_consistency": volume_consistency
                }
        
        return {"strength": 0, "type": "no_distribution"}
    
    def _detect_large_moves(self, data: Dict[str, np.ndarray]) -> Dict[str, Any]:
        """Detect large price moves that might indicate whale activity"""
        closes = data['closes']
        volumes = data['volumes']
        
        # Find largest single-period move
        price_changes = np.diff(closes)
        max_change_idx = np.argmax(np.abs(price_changes))
        max_change = price_changes[max_change_idx]
        max_change_pct = max_change / closes[max_change_idx] if closes[max_change_idx] > 0 else 0
        
        # Check if move was accompanied by high volume
        move_volume = volumes[max_change_idx + 1]
        avg_volume = np.mean(volumes)
        volume_ratio = move_volume / avg_volume if avg_volume > 0 else 1
        
        # Determine if this looks like whale activity
        if abs(max_change_pct) > 0.05 and volume_ratio > 1.5:  # 5% move with 1.5x volume
            strength = min(1.0, abs(max_change_pct) * 10 + (volume_ratio - 1) * 0.2)
            direction = 1 if max_change > 0 else -1
            return {
                "strength": strength,
                "direction": direction,
                "type": "large_move",
                "change_pct": max_change_pct,
                "volume_ratio": volume_ratio
            }
        
        return {"strength": 0, "type": "no_large_moves"}
    
    def _calculate_percentile(self, value: float, data: np.ndarray) -> float:
        """Calculate percentile of value in data"""
        if len(data) == 0:
            return 50
        
        sorted_data = np.sort(data)
        percentile = (np.searchsorted(sorted_data, value) / len(sorted_data)) * 100
        return percentile
    
    def _combine_whale_signals(self, volume_analysis: Dict, price_analysis: Dict) -> Dict[str, Any]:
        """Combine volume and price analysis for whale activity"""
        # Weight the analyses
        volume_weight = 0.6
        price_weight = 0.4
        
        # Calculate combined score
        combined_score = (
            volume_analysis['score'] * volume_weight +
            price_analysis['score'] * price_weight
        )
        
        # Determine direction
        if combined_score > 0.6:
            direction = "BULLISH"  # Whale accumulation
        elif combined_score < 0.4:
            direction = "BEARISH"  # Whale distribution
        else:
            direction = "NEUTRAL"
        
        # Calculate strength
        strength = abs(combined_score - 0.5) * 2
        
        return {
            "score": combined_score,
            "direction": direction,
            "strength": strength,
            "volume_analysis": volume_analysis,
            "price_analysis": price_analysis
        }
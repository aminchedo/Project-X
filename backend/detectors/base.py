"""
Base detector interface and common functionality
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List
import pandas as pd
from dataclasses import dataclass

@dataclass
class DetectionResult:
    """Standard result format for all detectors"""
    score: float  # 0-1, where 0.5 is neutral
    direction: str  # "BULLISH", "BEARISH", or "NEUTRAL"
    confidence: float  # 0-1 confidence level
    meta: Dict[str, Any]  # Additional metadata

class BaseDetector(ABC):
    """Base class for all pattern detectors"""
    
    def __init__(self, name: str):
        self.name = name
    
    @abstractmethod
    async def detect(self, ohlcv: pd.DataFrame, context: Dict[str, Any] = None) -> DetectionResult:
        """
        Detect patterns in OHLCV data
        
        Args:
            ohlcv: DataFrame with columns ['open', 'high', 'low', 'close', 'volume']
            context: Additional context data
            
        Returns:
            DetectionResult with score, direction, confidence, and metadata
        """
        pass
    
    def _normalize_score(self, raw_score: float, min_val: float = -1, max_val: float = 1) -> float:
        """Normalize score to 0-1 range"""
        return max(0, min(1, (raw_score - min_val) / (max_val - min_val)))
    
    def _calculate_confidence(self, pattern_strength: float, market_conditions: Dict[str, Any] = None) -> float:
        """Calculate confidence based on pattern strength and market conditions"""
        base_confidence = min(1.0, abs(pattern_strength))
        
        # Adjust based on market conditions
        if market_conditions:
            volatility = market_conditions.get('volatility', 0.02)
            volume_ratio = market_conditions.get('volume_ratio', 1.0)
            
            # Higher volatility reduces confidence
            volatility_factor = max(0.5, 1.0 - (volatility - 0.02) * 10)
            
            # Higher volume increases confidence
            volume_factor = min(1.2, volume_ratio)
            
            base_confidence *= volatility_factor * volume_factor
        
        return min(1.0, base_confidence)
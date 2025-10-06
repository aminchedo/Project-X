"""
Harmonic Pattern Detection Module
Phase 3.1: Advanced Pattern Detectors

Detects Butterfly, Bat, Gartley, and Crab harmonic patterns using Fibonacci ratios.
"""

from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict, Any
import numpy as np
from scipy.signal import argrelextrema
import logging

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class HarmonicPattern:
    """Validated harmonic pattern"""
    name: str  # "Butterfly", "Bat", "Gartley", "Crab"
    points: dict  # X, A, B, C, D coordinates
    ratios: dict  # Actual ratios vs ideal
    quality_score: float  # How well ratios match ideal
    is_bullish: bool
    completion_level: float  # % completion of pattern
    projected_targets: List[float]

@dataclass
class DetectionResult:
    """Standard detection result format"""
    score: float
    confidence: float
    direction: str  # "BULLISH", "BEARISH", "NEUTRAL"
    meta: Dict[str, Any]

class ZigZagExtractor:
    """Extract swing highs/lows for pattern recognition"""
    
    def __init__(self, threshold_pct: float = 5.0):
        self.threshold_pct = threshold_pct
    
    def extract_pivots(self, ohlcv: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract significant swing points using ZigZag logic
        
        Args:
            ohlcv: List of OHLCV bars with 'high', 'low', 'open', 'close', 'volume' keys
        
        Returns:
            List of pivots: [{"index": int, "price": float, "type": "HIGH"|"LOW"}, ...]
        """
        try:
            highs = np.array([bar['high'] for bar in ohlcv])
            lows = np.array([bar['low'] for bar in ohlcv])
            
            # Find local extrema with order=5 (5 bars on each side)
            high_indices = argrelextrema(highs, np.greater, order=5)[0]
            low_indices = argrelextrema(lows, np.less, order=5)[0]
            
            pivots = []
            for idx in high_indices:
                pivots.append({"index": int(idx), "price": float(highs[idx]), "type": "HIGH"})
            for idx in low_indices:
                pivots.append({"index": int(idx), "price": float(lows[idx]), "type": "LOW"})
            
            # Sort by index
            pivots.sort(key=lambda p: p['index'])
            
            # Filter by threshold - only keep significant swings
            filtered = [pivots[0]] if pivots else []
            for i in range(1, len(pivots)):
                prev_price = filtered[-1]['price']
                curr_price = pivots[i]['price']
                pct_change = abs((curr_price - prev_price) / prev_price * 100)
                
                if pct_change >= self.threshold_pct:
                    filtered.append(pivots[i])
            
            logger.debug(f"Extracted {len(filtered)} pivots from {len(ohlcv)} bars")
            return filtered
            
        except Exception as e:
            logger.error(f"Error extracting pivots: {e}")
            return []

class HarmonicDetector:
    """Detect Butterfly, Bat, Gartley, Crab patterns"""
    
    PATTERNS = {
        "Butterfly": {
            "XA_AB": (0.786, 0.02),  # AB = 0.786 of XA ± 2%
            "AB_BC": (0.382, 0.886, 0.04),  # BC between 0.382-0.886 of AB
            "BC_CD": (1.618, 2.618, 0.1),  # CD between 1.618-2.618 of BC
            "XA_AD": (1.27, 1.618, 0.05)  # AD extension
        },
        "Bat": {
            "XA_AB": (0.382, 0.5, 0.03),
            "AB_BC": (0.382, 0.886, 0.04),
            "BC_CD": (1.618, 2.618, 0.1),
            "XA_AD": (0.886, 0.03)
        },
        "Gartley": {
            "XA_AB": (0.618, 0.03),
            "AB_BC": (0.382, 0.886, 0.04),
            "BC_CD": (1.27, 1.618, 0.05),
            "XA_AD": (0.786, 0.03)
        },
        "Crab": {
            "XA_AB": (0.382, 0.618, 0.04),
            "AB_BC": (0.382, 0.886, 0.04),
            "BC_CD": (2.618, 3.618, 0.15),
            "XA_AD": (1.618, 0.05)
        }
    }
    
    def __init__(self):
        self.zigzag = ZigZagExtractor(threshold_pct=3.0)
    
    async def detect(self, ohlcv: List[Dict[str, Any]], context: Dict[str, Any] = None) -> DetectionResult:
        """
        Detect harmonic patterns and return signed score
        
        Args:
            ohlcv: List of OHLCV bars
            context: Additional context (RSI, trend, etc.)
        
        Returns:
            DetectionResult with score [-1, +1] and pattern details
        """
        if context is None:
            context = {}
            
        try:
            if len(ohlcv) < 100:
                return DetectionResult(
                    score=0.0,
                    confidence=0.0,
                    direction="NEUTRAL",
                    meta={"error": "Insufficient data"}
                )
            
            pivots = self.zigzag.extract_pivots(ohlcv)
            
            if len(pivots) < 5:
                return DetectionResult(
                    score=0.0,
                    confidence=0.0,
                    direction="NEUTRAL",
                    meta={"pivots_found": len(pivots)}
                )
            
            # Scan for patterns in last 5 pivots
            best_pattern = None
            best_score = 0.0
            
            for i in range(len(pivots) - 4):
                X, A, B, C, D = pivots[i:i+5]
                
                # Check alternation (must go high-low-high-low or vice versa)
                if not self._validate_alternation([X, A, B, C, D]):
                    continue
                
                for pattern_name, ratios in self.PATTERNS.items():
                    pattern = self._validate_pattern(X, A, B, C, D, pattern_name, ratios)
                    
                    if pattern and pattern.quality_score > best_score:
                        best_pattern = pattern
                        best_score = pattern.quality_score
            
            if not best_pattern:
                return DetectionResult(
                    score=0.0,
                    confidence=0.0,
                    direction="NEUTRAL",
                    meta={"patterns_scanned": len(pivots) - 4}
                )
            
            # Calculate final score with confluence
            confluence_score = self._calculate_confluence(best_pattern, ohlcv, context)
            
            # Combine quality + confluence
            final_score = best_pattern.quality_score * 0.6 + confluence_score * 0.4
            
            # Apply sign based on direction
            if not best_pattern.is_bullish:
                final_score = -final_score
            
            direction = "BULLISH" if best_pattern.is_bullish else "BEARISH"
            
            return DetectionResult(
                score=float(np.clip(final_score, -1.0, 1.0)),
                confidence=best_pattern.quality_score,
                direction=direction,
                meta={
                    "pattern": best_pattern.name,
                    "points": best_pattern.points,
                    "ratios": best_pattern.ratios,
                    "completion": best_pattern.completion_level,
                    "targets": best_pattern.projected_targets
                }
            )
            
        except Exception as e:
            logger.error(f"Error in harmonic pattern detection: {e}")
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"error": str(e)}
            )
    
    def _validate_alternation(self, pivots: List[Dict[str, Any]]) -> bool:
        """Ensure pivots alternate between HIGH and LOW"""
        if len(pivots) < 2:
            return False
        
        for i in range(1, len(pivots)):
            if pivots[i]['type'] == pivots[i-1]['type']:
                return False
        
        return True
    
    def _validate_pattern(self, X: Dict, A: Dict, B: Dict, C: Dict, D: Dict, 
                         pattern_name: str, ratios: Dict) -> Optional[HarmonicPattern]:
        """Validate if 5 pivots form a valid harmonic pattern"""
        try:
            # Calculate distances
            XA = abs(A['price'] - X['price'])
            AB = abs(B['price'] - A['price'])
            BC = abs(C['price'] - B['price'])
            CD = abs(D['price'] - C['price'])
            AD = abs(D['price'] - A['price'])
            
            # Calculate ratios
            actual_ratios = {
                "XA_AB": AB / XA if XA > 0 else 0,
                "AB_BC": BC / AB if AB > 0 else 0,
                "BC_CD": CD / BC if BC > 0 else 0,
                "XA_AD": AD / XA if XA > 0 else 0
            }
            
            # Check each ratio against pattern requirements
            quality_scores = []
            for ratio_name, (min_val, max_val, tolerance) in ratios.items():
                if ratio_name not in actual_ratios:
                    continue
                
                actual = actual_ratios[ratio_name]
                ideal = (min_val + max_val) / 2
                
                # Calculate how close we are to ideal
                if min_val <= actual <= max_val:
                    # Within range - calculate quality
                    distance_from_ideal = abs(actual - ideal) / ideal
                    quality = max(0, 1 - distance_from_ideal / tolerance)
                    quality_scores.append(quality)
                else:
                    # Outside range
                    quality_scores.append(0)
            
            if not quality_scores:
                return None
            
            # Overall quality is average of individual ratios
            overall_quality = np.mean(quality_scores)
            
            # Only return patterns with decent quality
            if overall_quality < 0.3:
                return None
            
            # Determine if bullish or bearish
            is_bullish = (X['type'] == 'LOW' and A['type'] == 'HIGH' and 
                         B['type'] == 'LOW' and C['type'] == 'HIGH' and D['type'] == 'LOW')
            
            # Calculate completion level (how much of the pattern is complete)
            completion = 1.0  # All 5 points are present
            
            # Project targets
            targets = []
            if is_bullish:
                # Bullish targets above D
                targets.append(D['price'] * 1.1)  # 10% above D
                targets.append(D['price'] * 1.2)  # 20% above D
            else:
                # Bearish targets below D
                targets.append(D['price'] * 0.9)  # 10% below D
                targets.append(D['price'] * 0.8)  # 20% below D
            
            return HarmonicPattern(
                name=pattern_name,
                points={"X": X, "A": A, "B": B, "C": C, "D": D},
                ratios=actual_ratios,
                quality_score=overall_quality,
                is_bullish=is_bullish,
                completion_level=completion,
                projected_targets=targets
            )
            
        except Exception as e:
            logger.error(f"Error validating pattern {pattern_name}: {e}")
            return None
    
    def _calculate_confluence(self, pattern: HarmonicPattern, ohlcv: List[Dict[str, Any]], 
                            context: Dict[str, Any]) -> float:
        """Calculate confluence score based on additional factors"""
        confluence = 0.0
        
        # Volume confluence
        if 'volume' in ohlcv[-1]:
            recent_volume = ohlcv[-1]['volume']
            avg_volume = np.mean([bar.get('volume', 0) for bar in ohlcv[-20:]])
            if recent_volume > avg_volume * 1.5:
                confluence += 0.2
        
        # RSI confluence
        if 'rsi' in context:
            rsi = context['rsi']
            if pattern.is_bullish and rsi < 30:  # Oversold for bullish pattern
                confluence += 0.3
            elif not pattern.is_bullish and rsi > 70:  # Overbought for bearish pattern
                confluence += 0.3
        
        # Trend confluence
        if 'trend' in context:
            trend = context['trend']
            if (pattern.is_bullish and trend == 'BULLISH') or \
               (not pattern.is_bullish and trend == 'BEARISH'):
                confluence += 0.2
        
        return min(confluence, 1.0)
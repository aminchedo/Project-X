"""
Elliott Wave Detection Module
Phase 3.2: Advanced Pattern Detectors

Detects Elliott Wave patterns and wave counting for market structure analysis.
"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict, Any
import numpy as np
import logging
from .harmonic import ZigZagExtractor, DetectionResult

# Configure logging
logger = logging.getLogger(__name__)

class WaveType(Enum):
    IMPULSE = "impulse"
    CORRECTIVE = "corrective"

@dataclass
class WaveCount:
    """Elliott wave labeling"""
    waves: List[Dict[str, Any]]  # [{label: "1", start_idx, end_idx, price_start, price_end}, ...]
    degree: str  # "minor", "intermediate", "primary"
    confidence: float
    current_wave: str
    forecast: Dict[str, Any]

class ElliottWaveDetector:
    """Simplified Elliott Wave heuristic detector"""
    
    def __init__(self):
        self.zigzag = ZigZagExtractor(threshold_pct=4.0)
    
    async def detect(self, ohlcv: List[Dict[str, Any]], context: Dict[str, Any] = None) -> DetectionResult:
        """
        Detect Elliott Wave patterns
        
        Focus on Wave 3 (strongest) and Wave 5 (final impulse) detection
        
        Args:
            ohlcv: List of OHLCV bars
            context: Additional context (RSI, trend, etc.)
        
        Returns:
            DetectionResult with score [-1, +1] and wave details
        """
        if context is None:
            context = {}
            
        try:
            if len(ohlcv) < 150:
                return DetectionResult(
                    score=0.0,
                    confidence=0.0,
                    direction="NEUTRAL",
                    meta={"error": "Insufficient data for wave analysis"}
                )
            
            pivots = self.zigzag.extract_pivots(ohlcv)
            
            if len(pivots) < 8:  # Need at least 8 pivots for 5-wave structure
                return DetectionResult(
                    score=0.0,
                    confidence=0.0,
                    direction="NEUTRAL",
                    meta={"pivots": len(pivots)}
                )
            
            # Scan for 5-wave impulse structures
            best_wave = None
            best_confidence = 0.0
            
            for i in range(len(pivots) - 7):
                wave_structure = pivots[i:i+8]
                
                wave_count = self._identify_impulse_wave(wave_structure)
                
                if wave_count and wave_count.confidence > best_confidence:
                    best_wave = wave_count
                    best_confidence = wave_count.confidence
            
            if not best_wave:
                return DetectionResult(
                    score=0.0,
                    confidence=0.0,
                    direction="NEUTRAL",
                    meta={"no_clear_wave_structure": True}
                )
            
            # Calculate score based on current wave position
            score = self._calculate_wave_score(best_wave, ohlcv)
            
            direction = "BULLISH" if score > 0 else "BEARISH" if score < 0 else "NEUTRAL"
            
            return DetectionResult(
                score=float(np.clip(score, -1.0, 1.0)),
                confidence=best_wave.confidence,
                direction=direction,
                meta={
                    "wave_count": best_wave.waves,
                    "current_wave": best_wave.current_wave,
                    "degree": best_wave.degree,
                    "forecast": best_wave.forecast
                }
            )
            
        except Exception as e:
            logger.error(f"Error in Elliott Wave detection: {e}")
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"error": str(e)}
            )
    
    def _identify_impulse_wave(self, pivots: List[Dict[str, Any]]) -> Optional[WaveCount]:
        """Identify 5-wave impulse structure from 8 pivots"""
        try:
            if len(pivots) < 8:
                return None
            
            # Check if we have proper alternation (high-low-high-low...)
            for i in range(1, len(pivots)):
                if pivots[i]['type'] == pivots[i-1]['type']:
                    return None
            
            # Look for 5-wave structure: 1-2-3-4-5
            waves = []
            confidence = 0.0
            
            # Wave 1: First significant move
            wave1_start = pivots[0]
            wave1_end = pivots[1]
            wave1_size = abs(wave1_end['price'] - wave1_start['price'])
            
            # Wave 2: Retracement (should be < 100% of wave 1)
            wave2_start = pivots[1]
            wave2_end = pivots[2]
            wave2_size = abs(wave2_end['price'] - wave2_start['price'])
            wave2_retracement = wave2_size / wave1_size if wave1_size > 0 else 0
            
            if wave2_retracement > 1.0:  # Wave 2 too large
                return None
            
            # Wave 3: Strongest move (should be > wave 1)
            wave3_start = pivots[2]
            wave3_end = pivots[3]
            wave3_size = abs(wave3_end['price'] - wave3_start['price'])
            wave3_ratio = wave3_size / wave1_size if wave1_size > 0 else 0
            
            if wave3_ratio < 1.0:  # Wave 3 not strong enough
                return None
            
            # Wave 4: Retracement (should be < wave 3)
            wave4_start = pivots[3]
            wave4_end = pivots[4]
            wave4_size = abs(wave4_end['price'] - wave4_start['price'])
            wave4_retracement = wave4_size / wave3_size if wave3_size > 0 else 0
            
            if wave4_retracement > 0.618:  # Wave 4 too deep
                return None
            
            # Wave 5: Final move
            wave5_start = pivots[4]
            wave5_end = pivots[5]
            wave5_size = abs(wave5_end['price'] - wave5_start['price'])
            
            # Calculate confidence based on Elliott Wave rules
            confidence = 0.0
            
            # Rule 1: Wave 2 should not retrace more than 100% of wave 1
            if wave2_retracement < 1.0:
                confidence += 0.2
            
            # Rule 2: Wave 3 should be the strongest
            if wave3_ratio > 1.0:
                confidence += 0.3
            
            # Rule 3: Wave 4 should not overlap wave 1
            if self._check_no_overlap(pivots[0], pivots[1], pivots[3], pivots[4]):
                confidence += 0.2
            
            # Rule 4: Wave 5 should complete the structure
            if wave5_size > 0:
                confidence += 0.1
            
            # Rule 5: Alternation between waves
            if self._check_alternation(pivots[:6]):
                confidence += 0.2
            
            if confidence < 0.5:
                return None
            
            # Create wave structure
            waves = [
                {"label": "1", "start": wave1_start, "end": wave1_end, "size": wave1_size},
                {"label": "2", "start": wave2_start, "end": wave2_end, "size": wave2_size},
                {"label": "3", "start": wave3_start, "end": wave3_end, "size": wave3_size},
                {"label": "4", "start": wave4_start, "end": wave4_end, "size": wave4_size},
                {"label": "5", "start": wave5_start, "end": wave5_end, "size": wave5_size}
            ]
            
            # Determine current wave (assume we're in wave 5 or correction)
            current_wave = "5"
            
            # Create forecast
            forecast = {
                "next_target": wave5_end['price'] * 1.1 if wave5_end['type'] == 'LOW' else wave5_end['price'] * 0.9,
                "correction_target": wave5_end['price'] * 0.618 if wave5_end['type'] == 'HIGH' else wave5_end['price'] * 1.382
            }
            
            return WaveCount(
                waves=waves,
                degree="minor",
                confidence=confidence,
                current_wave=current_wave,
                forecast=forecast
            )
            
        except Exception as e:
            logger.error(f"Error identifying impulse wave: {e}")
            return None
    
    def _check_no_overlap(self, wave1_start: Dict, wave1_end: Dict, 
                         wave4_start: Dict, wave4_end: Dict) -> bool:
        """Check that wave 4 doesn't overlap wave 1"""
        try:
            # Get price ranges
            wave1_min = min(wave1_start['price'], wave1_end['price'])
            wave1_max = max(wave1_start['price'], wave1_end['price'])
            wave4_min = min(wave4_start['price'], wave4_end['price'])
            wave4_max = max(wave4_start['price'], wave4_end['price'])
            
            # Check for overlap
            return not (wave4_max >= wave1_min and wave4_min <= wave1_max)
        except:
            return False
    
    def _check_alternation(self, pivots: List[Dict[str, Any]]) -> bool:
        """Check that pivots alternate between HIGH and LOW"""
        for i in range(1, len(pivots)):
            if pivots[i]['type'] == pivots[i-1]['type']:
                return False
        return True
    
    def _calculate_wave_score(self, wave_count: WaveCount, ohlcv: List[Dict[str, Any]]) -> float:
        """Calculate trading score based on wave position"""
        try:
            current_wave = wave_count.current_wave
            
            # Score based on current wave
            if current_wave == "3":
                return 0.8  # Wave 3 is strongest
            elif current_wave == "5":
                return 0.6  # Wave 5 is final impulse
            elif current_wave == "1":
                return 0.4  # Early in structure
            elif current_wave in ["2", "4"]:
                return -0.3  # Correction waves
            else:
                return 0.0
                
        except Exception as e:
            logger.error(f"Error calculating wave score: {e}")
            return 0.0
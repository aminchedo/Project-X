"""
Dynamic Scoring Engine - Phase 4 Implementation
Context-aware multi-detector scoring system
"""

from typing import Dict, List, Optional, Literal
from dataclasses import dataclass
from pydantic import BaseModel, Field, validator
import asyncio
import numpy as np
import structlog

from backend.scoring.detector_protocol import DetectionResult, OHLCVBar, DetectorProtocol
# from analytics.indicators import IndicatorEngine

logger = structlog.get_logger()

class WeightConfig(BaseModel):
    """Configurable detector weights"""
    harmonic: float = Field(default=0.15, ge=0.0, le=1.0)
    elliott: float = Field(default=0.15, ge=0.0, le=1.0)
    fibonacci: float = Field(default=0.10, ge=0.0, le=1.0)
    price_action: float = Field(default=0.15, ge=0.0, le=1.0)
    smc: float = Field(default=0.20, ge=0.0, le=1.0)
    sar: float = Field(default=0.10, ge=0.0, le=1.0)
    sentiment: float = Field(default=0.10, ge=0.0, le=1.0)
    news: float = Field(default=0.03, ge=0.0, le=1.0)
    whales: float = Field(default=0.02, ge=0.0, le=1.0)
    
    def validate_sum(self):
        total = sum([
            self.harmonic, self.elliott, self.fibonacci,
            self.price_action, self.smc, self.sar,
            self.sentiment, self.news, self.whales
        ])
        if not 0.95 <= total <= 1.05:
            raise ValueError(f"Weights must sum to ~1.0, got {total}")

@dataclass
class CombinedScore:
    """Final scoring output"""
    final_score: float  # 0..1 (0=strong bear, 1=strong bull)
    direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    bull_mass: float  # Sum of positive weighted scores
    bear_mass: float  # Sum of negative weighted scores
    confidence: float  # Overall detection confidence
    components: Dict[str, dict]  # {"detector": {raw, normalized, weighted, meta}}
    advice: Literal["BUY", "SELL", "HOLD"]
    disagreement: float  # Measure of detector conflict

class DynamicScoringEngine:
    """Context-aware multi-detector scoring"""
    
    def __init__(self, detectors: dict, weights: WeightConfig):
        self.detectors = detectors
        self.weights = weights
        self.weights.validate_sum()
    
    async def score(
        self,
        ohlcv: List[OHLCVBar],
        context: Optional[dict] = None
    ) -> CombinedScore:
        """
        Execute all detectors and combine scores
        
        Args:
            ohlcv: Price data (minimum 100 bars)
            context: Optional market context {"trend": "up"|"down"|"ranging", "volatility": "high"|"normal"|"low"}
        
        Returns:
            CombinedScore with full breakdown
        """
        if len(ohlcv) < 100:
            raise ValueError("Minimum 100 bars required for scoring")
        
        # Enrich context with indicators
        if context is None:
            context = {}
        
        context = await self._enrich_context(ohlcv, context)
        
        # Run all detectors in parallel
        detector_tasks = {
            name: detector.detect(ohlcv, context)
            for name, detector in self.detectors.items()
        }
        
        results = await asyncio.gather(
            *detector_tasks.values(),
            return_exceptions=True
        )
        
        # Map results back to detector names
        detection_results = {}
        for (name, _), result in zip(detector_tasks.items(), results):
            if isinstance(result, Exception):
                logger.error(f"Detector {name} failed", error=str(result))
                # Use neutral fallback
                detection_results[name] = DetectionResult(
                    score=0.0,
                    confidence=0.0,
                    direction="NEUTRAL",
                    meta={"error": str(result)}
                )
            else:
                detection_results[name] = result
        
        # Apply context filters and gates
        filtered_results = self._apply_context_gates(detection_results, context)
        
        # Combine with weights
        combined = self._combine_scores(filtered_results, context)
        
        # Check for disagreement and potentially refine
        if combined.disagreement > 0.4:
            logger.warning("High detector disagreement", disagreement=combined.disagreement)
            # Could trigger recursive refinement here
        
        return combined
    
    async def _enrich_context(self, ohlcv: List[OHLCVBar], context: dict) -> dict:
        """Add computed indicators to context"""
        try:
            # Mock indicators for now - would use real IndicatorEngine in production
            indicators = {
                'rsi': [50.0] * len(ohlcv),
                'atr': [100.0] * len(ohlcv),
                'bb_upper': [ohlcv[-1]['close'] * 1.02] * len(ohlcv),
                'bb_lower': [ohlcv[-1]['close'] * 0.98] * len(ohlcv),
                'ema_fast': [ohlcv[-1]['close']] * len(ohlcv),
                'ema_slow': [ohlcv[-1]['close']] * len(ohlcv)
            }
            
            # Add key indicators to context
            context['rsi'] = float(indicators['rsi'][-1])
            context['atr'] = float(indicators['atr'][-1])
            context['bb_position'] = self._calculate_bb_position(
                ohlcv[-1]['close'],
                indicators['bb_upper'][-1],
                indicators['bb_lower'][-1]
            )
            
            # Determine trend regime
            if 'trend' not in context:
                ema_fast = indicators['ema_fast'][-1]
                ema_slow = indicators['ema_slow'][-1]
                
                if ema_fast > ema_slow * 1.02:
                    context['trend'] = 'up'
                elif ema_fast < ema_slow * 0.98:
                    context['trend'] = 'down'
                else:
                    context['trend'] = 'ranging'
            
            # Determine volatility regime
            if 'volatility' not in context:
                atr_pct = context['atr'] / ohlcv[-1]['close']
                if atr_pct > 0.03:
                    context['volatility'] = 'high'
                elif atr_pct < 0.01:
                    context['volatility'] = 'low'
                else:
                    context['volatility'] = 'normal'
                    
        except Exception as e:
            logger.warning("Failed to enrich context", error=str(e))
            # Set defaults
            context.setdefault('trend', 'ranging')
            context.setdefault('volatility', 'normal')
            context.setdefault('rsi', 50.0)
            context.setdefault('atr', 0.0)
            context.setdefault('bb_position', 0.5)
        
        return context
    
    def _calculate_bb_position(self, price: float, upper: float, lower: float) -> float:
        """Calculate position within Bollinger Bands (0=lower, 1=upper)"""
        if upper == lower:
            return 0.5
        return (price - lower) / (upper - lower)
    
    def _apply_context_gates(
        self,
        results: Dict[str, DetectionResult],
        context: dict
    ) -> Dict[str, DetectionResult]:
        """Apply regime-based filtering"""
        filtered = {}
        
        for name, result in results.items():
            # Reduce weight in high volatility for mean-reversion detectors
            if context.get('volatility') == 'high' and name in ['fibonacci', 'harmonic']:
                result.score *= 0.7
            
            # Boost trend-following in clear trends
            if context.get('trend') in ['up', 'down'] and name in ['smc', 'elliott', 'sar']:
                result.score *= 1.2
            
            # Dampen in ranging markets
            if context.get('trend') == 'ranging':
                if name in ['elliott', 'sar']:
                    result.score *= 0.5
            
            filtered[name] = result
        
        return filtered
    
    def _combine_scores(
        self,
        results: Dict[str, DetectionResult],
        context: dict
    ) -> CombinedScore:
        """Weighted combination of all detector scores"""
        
        components = {}
        bull_mass = 0.0
        bear_mass = 0.0
        total_confidence = 0.0
        
        weight_map = {
            'harmonic': self.weights.harmonic,
            'elliott': self.weights.elliott,
            'fibonacci': self.weights.fibonacci,
            'price_action': self.weights.price_action,
            'smc': self.weights.smc,
            'sar': self.weights.sar,
            'sentiment': self.weights.sentiment,
            'news': self.weights.news,
            'whales': self.weights.whales
        }
        
        for name, result in results.items():
            weight = weight_map.get(name, 0.0)
            
            # Normalize score to 0..1 range (from -1..1)
            normalized = (result.score + 1.0) / 2.0
            
            # Apply weight and confidence
            weighted_score = normalized * weight * result.confidence
            
            components[name] = {
                "raw_score": float(result.score),
                "normalized": float(normalized),
                "weight": float(weight),
                "confidence": float(result.confidence),
                "weighted_score": float(weighted_score),
                "direction": result.direction,
                "meta": result.meta
            }
            
            # Accumulate masses
            if result.score > 0:
                bull_mass += weighted_score
            elif result.score < 0:
                bear_mass += abs(weighted_score)
            
            total_confidence += result.confidence * weight
        
        # Calculate final score
        total_mass = bull_mass + bear_mass
        
        if total_mass > 0:
            final_score = bull_mass / total_mass
        else:
            final_score = 0.5
        
        # Determine direction
        if final_score >= 0.6:
            direction = "BULLISH"
        elif final_score <= 0.4:
            direction = "BEARISH"
        else:
            direction = "NEUTRAL"
        
        # Calculate disagreement (variance in raw scores)
        raw_scores = [c['raw_score'] for c in components.values()]
        disagreement = float(np.std(raw_scores)) if raw_scores else 0.0
        
        # Generate advice
        advice = self._generate_advice(final_score, direction, disagreement, context)
        
        return CombinedScore(
            final_score=float(final_score),
            direction=direction,
            bull_mass=float(bull_mass),
            bear_mass=float(bear_mass),
            confidence=float(total_confidence),
            components=components,
            advice=advice,
            disagreement=float(disagreement)
        )
    
    def _generate_advice(
        self,
        score: float,
        direction: str,
        disagreement: float,
        context: dict
    ) -> str:
        """Generate trading advice based on score and context"""
        
        # High disagreement = hold
        if disagreement > 0.5:
            return "HOLD"
        
        # Strong signals
        if direction == "BULLISH" and score >= 0.65:
            return "BUY"
        elif direction == "BEARISH" and score <= 0.35:
            return "SELL"
        
        # Moderate signals with trend confirmation
        if direction == "BULLISH" and score >= 0.55 and context.get('trend') == 'up':
            return "BUY"
        elif direction == "BEARISH" and score <= 0.45 and context.get('trend') == 'down':
            return "SELL"
        
        return "HOLD"

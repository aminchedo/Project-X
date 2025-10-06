"""
Simplified Detector Adapters for Phase 4 Testing
Mock implementations that don't require external analytics dependencies
"""

import asyncio
from typing import Dict, List
import pandas as pd
import structlog

from backend.scoring.detector_protocol import DetectorProtocol, DetectionResult, OHLCVBar

logger = structlog.get_logger()

class RSI_MACD_Detector:
    """RSI + MACD detector adapter (simplified)"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Mock RSI+MACD analysis"""
        try:
            if len(ohlcv) < 50:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": "Insufficient data"})
            
            # Simple mock analysis
            closes = [c['close'] for c in ohlcv[-20:]]
            price_change = (closes[-1] - closes[0]) / closes[0]
            
            if price_change > 0.02:
                score = 0.7
                direction = "BULLISH"
                confidence = 0.8
            elif price_change < -0.02:
                score = -0.7
                direction = "BEARISH"
                confidence = 0.8
            else:
                score = 0.0
                direction = "NEUTRAL"
                confidence = 0.3
            
            return DetectionResult(
                score=score,
                confidence=confidence,
                direction=direction,
                meta={"price_change": price_change, "method": "mock_rsi_macd"}
            )
        except Exception as e:
            logger.error("RSI_MACD detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class SentimentDetector:
    """Sentiment analysis detector adapter (simplified)"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Mock sentiment analysis"""
        try:
            if len(ohlcv) < 20:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": "Insufficient data"})
            
            # Simple mock sentiment based on price action
            recent_closes = [c['close'] for c in ohlcv[-10:]]
            volatility = (max(recent_closes) - min(recent_closes)) / recent_closes[0]
            
            if volatility > 0.03:
                score = 0.6
                direction = "BULLISH"
                confidence = 0.7
            elif volatility < 0.01:
                score = -0.3
                direction = "BEARISH"
                confidence = 0.5
            else:
                score = 0.0
                direction = "NEUTRAL"
                confidence = 0.3
            
            return DetectionResult(
                score=score,
                confidence=confidence,
                direction=direction,
                meta={"volatility": volatility, "method": "mock_sentiment"}
            )
        except Exception as e:
            logger.error("Sentiment detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class SMCDetector:
    """Smart Money Concepts detector adapter (simplified)"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Mock SMC analysis"""
        try:
            if len(ohlcv) < 50:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": "Insufficient data"})
            
            # Simple mock SMC analysis
            recent_data = ohlcv[-20:]
            highs = [c['high'] for c in recent_data]
            lows = [c['low'] for c in recent_data]
            
            # Check for higher highs and higher lows (bullish structure)
            if len(highs) >= 4 and len(lows) >= 4:
                hh = highs[-1] > highs[-3] and highs[-2] > highs[-4]
                hl = lows[-1] > lows[-3] and lows[-2] > lows[-4]
                
                if hh and hl:
                    score = 0.8
                    direction = "BULLISH"
                    confidence = 0.9
                elif not hh and not hl:
                    score = -0.8
                    direction = "BEARISH"
                    confidence = 0.9
                else:
                    score = 0.0
                    direction = "NEUTRAL"
                    confidence = 0.4
            else:
                score = 0.0
                direction = "NEUTRAL"
                confidence = 0.2
            
            return DetectionResult(
                score=score,
                confidence=confidence,
                direction=direction,
                meta={"hh": hh if 'hh' in locals() else False, "hl": hl if 'hl' in locals() else False, "method": "mock_smc"}
            )
        except Exception as e:
            logger.error("SMC detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class HarmonicPatternDetector:
    """Harmonic pattern detector adapter (simplified)"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Mock harmonic pattern detection"""
        try:
            if len(ohlcv) < 100:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": "Insufficient data"})
            
            # Simple mock pattern detection
            recent_data = ohlcv[-50:]
            highs = [c['high'] for c in recent_data]
            lows = [c['low'] for c in recent_data]
            
            # Check for simple patterns
            range_size = max(highs) - min(lows)
            current_price = ohlcv[-1]['close']
            
            if current_price > max(highs) * 0.95:  # Near recent high
                score = 0.6
                direction = "BULLISH"
                confidence = 0.7
            elif current_price < min(lows) * 1.05:  # Near recent low
                score = -0.6
                direction = "BEARISH"
                confidence = 0.7
            else:
                score = 0.0
                direction = "NEUTRAL"
                confidence = 0.3
            
            return DetectionResult(
                score=score,
                confidence=confidence,
                direction=direction,
                meta={"range_size": range_size, "position": (current_price - min(lows)) / range_size, "method": "mock_harmonic"}
            )
        except Exception as e:
            logger.error("Harmonic pattern detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class ElliottWaveDetector:
    """Elliott Wave detector adapter (simplified)"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Mock Elliott Wave detection"""
        try:
            if len(ohlcv) < 50:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": "Insufficient data"})
            
            # Simple mock Elliott Wave analysis
            recent_data = ohlcv[-30:]
            closes = [c['close'] for c in recent_data]
            
            # Simple trend analysis
            first_half = closes[:len(closes)//2]
            second_half = closes[len(closes)//2:]
            
            first_avg = sum(first_half) / len(first_half)
            second_avg = sum(second_half) / len(second_half)
            
            trend_strength = (second_avg - first_avg) / first_avg
            
            if trend_strength > 0.02:
                score = 0.7
                direction = "BULLISH"
                confidence = 0.8
            elif trend_strength < -0.02:
                score = -0.7
                direction = "BEARISH"
                confidence = 0.8
            else:
                score = 0.0
                direction = "NEUTRAL"
                confidence = 0.3
            
            return DetectionResult(
                score=score,
                confidence=confidence,
                direction=direction,
                meta={"trend_strength": trend_strength, "method": "mock_elliott"}
            )
        except Exception as e:
            logger.error("Elliott Wave detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class PriceActionDetector:
    """Price action detector adapter (simplified)"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Mock price action analysis"""
        try:
            if len(ohlcv) < 20:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": "Insufficient data"})
            
            # Simple price action analysis
            recent_candles = ohlcv[-10:]
            closes = [c['close'] for c in recent_candles]
            highs = [c['high'] for c in recent_candles]
            lows = [c['low'] for c in recent_candles]
            
            # Calculate momentum
            price_change = (closes[-1] - closes[0]) / closes[0]
            
            # Calculate volatility
            volatility = (max(highs) - min(lows)) / closes[0]
            
            # Simple scoring based on momentum and volatility
            if price_change > 0.02 and volatility > 0.01:  # Strong bullish momentum
                score = 0.8
                direction = "BULLISH"
                confidence = min(0.9, volatility * 10)
            elif price_change < -0.02 and volatility > 0.01:  # Strong bearish momentum
                score = -0.8
                direction = "BEARISH"
                confidence = min(0.9, volatility * 10)
            elif abs(price_change) < 0.005:  # Consolidation
                score = 0.0
                direction = "NEUTRAL"
                confidence = 0.3
            else:
                score = price_change * 10  # Moderate signal
                direction = "BULLISH" if price_change > 0 else "BEARISH"
                confidence = 0.5
            
            return DetectionResult(
                score=score,
                confidence=confidence,
                direction=direction,
                meta={"price_change": price_change, "volatility": volatility, "method": "mock_price_action"}
            )
        except Exception as e:
            logger.error("Price action detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class FibonacciDetector:
    """Fibonacci retracement detector adapter (simplified)"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Mock Fibonacci retracement detection"""
        try:
            if len(ohlcv) < 50:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": "Insufficient data"})
            
            # Find recent swing high and low
            recent_data = ohlcv[-50:]
            highs = [c['high'] for c in recent_data]
            lows = [c['low'] for c in recent_data]
            
            swing_high = max(highs)
            swing_low = min(lows)
            current_price = ohlcv[-1]['close']
            
            # Calculate Fibonacci levels
            fib_range = swing_high - swing_low
            fib_618 = swing_high - fib_range * 0.618
            fib_382 = swing_high - fib_range * 0.382
            
            # Check proximity to key levels
            if abs(current_price - fib_618) / current_price < 0.01:  # Near 61.8% level
                score = 0.6
                direction = "BULLISH"
                confidence = 0.8
            elif abs(current_price - fib_382) / current_price < 0.01:  # Near 38.2% level
                score = -0.6
                direction = "BEARISH"
                confidence = 0.8
            else:
                score = 0.0
                direction = "NEUTRAL"
                confidence = 0.2
            
            return DetectionResult(
                score=score,
                confidence=confidence,
                direction=direction,
                meta={"swing_high": swing_high, "swing_low": swing_low, "fib_618": fib_618, "fib_382": fib_382, "method": "mock_fibonacci"}
            )
        except Exception as e:
            logger.error("Fibonacci detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class SARDetector:
    """Parabolic SAR detector adapter (simplified)"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Mock Parabolic SAR analysis"""
        try:
            if len(ohlcv) < 20:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": "Insufficient data"})
            
            # Simple SAR calculation (simplified)
            recent_data = ohlcv[-20:]
            highs = [c['high'] for c in recent_data]
            lows = [c['low'] for c in recent_data]
            closes = [c['close'] for c in recent_data]
            
            # Simple trend detection
            first_half = closes[:len(closes)//2]
            second_half = closes[len(closes)//2:]
            
            first_avg = sum(first_half) / len(first_half)
            second_avg = sum(second_half) / len(second_half)
            
            current_price = closes[-1]
            
            # Determine signal
            if second_avg > first_avg * 1.01 and current_price > first_avg:
                score = 0.6
                direction = "BULLISH"
                confidence = 0.7
            elif second_avg < first_avg * 0.99 and current_price < first_avg:
                score = -0.6
                direction = "BEARISH"
                confidence = 0.7
            else:
                score = 0.0
                direction = "NEUTRAL"
                confidence = 0.3
            
            return DetectionResult(
                score=score,
                confidence=confidence,
                direction=direction,
                meta={"first_avg": first_avg, "second_avg": second_avg, "method": "mock_sar"}
            )
        except Exception as e:
            logger.error("SAR detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

# Factory function to create all detectors
def create_detectors() -> Dict[str, DetectorProtocol]:
    """Create all available detectors"""
    return {
        'price_action': PriceActionDetector(),
        'rsi_macd': RSI_MACD_Detector(),
        'sentiment': SentimentDetector(),
        'smc': SMCDetector(),
        'harmonic': HarmonicPatternDetector(),
        'elliott': ElliottWaveDetector(),
        'fibonacci': FibonacciDetector(),
        'sar': SARDetector(),
        # Placeholder detectors for news and whales
        'news': PriceActionDetector(),  # Placeholder
        'whales': PriceActionDetector()  # Placeholder
    }
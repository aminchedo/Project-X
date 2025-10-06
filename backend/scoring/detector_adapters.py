"""
Detector Adapters for Existing Analytics Modules
Converts existing analytics functions to DetectorProtocol interface
"""

import asyncio
from typing import Dict, List
import pandas as pd
import structlog

from backend.scoring.detector_protocol import DetectorProtocol, DetectionResult, OHLCVBar
# Mock imports for now - would use real analytics in production
# from analytics.core_signals import generate_rsi_macd_signal
# from analytics.indicators import calculate_rsi, calculate_macd, calculate_ema, calculate_atr
# from analytics.sentiment import analyze_sentiment
# from analytics.smc_analysis import analyze_smc_structure
# from analytics.pattern_detection import detect_harmonic_patterns, detect_elliott_waves

logger = structlog.get_logger()

class RSI_MACD_Detector:
    """RSI + MACD detector adapter"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Convert OHLCV to DataFrame and run RSI+MACD analysis"""
        try:
            # Convert to DataFrame
            df = pd.DataFrame(ohlcv)
            df['timestamp'] = pd.to_datetime(df['ts'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # Generate signal
            signal = generate_rsi_macd_signal(df)
            
            # Convert to DetectionResult
            score = (signal['score'] - 0.5) * 2  # Convert 0-1 to -1 to 1
            direction = "BULLISH" if signal['action'] == 'BUY' else "BEARISH" if signal['action'] == 'SELL' else "NEUTRAL"
            
            return DetectionResult(
                score=score,
                confidence=signal['confidence'],
                direction=direction,
                meta={
                    'rsi_value': signal.get('rsi_value', 50),
                    'macd_histogram': signal.get('macd_histogram', 0),
                    'strength': signal.get('strength', 0)
                }
            )
        except Exception as e:
            logger.error("RSI_MACD detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class SentimentDetector:
    """Sentiment analysis detector adapter"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Run sentiment analysis on price data"""
        try:
            # Convert to DataFrame
            df = pd.DataFrame(ohlcv)
            df['timestamp'] = pd.to_datetime(df['ts'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # Analyze sentiment
            sentiment_result = analyze_sentiment(df)
            
            # Convert to DetectionResult
            score = (sentiment_result['score'] - 0.5) * 2  # Convert 0-1 to -1 to 1
            direction = "BULLISH" if sentiment_result['sentiment'] == 'positive' else "BEARISH" if sentiment_result['sentiment'] == 'negative' else "NEUTRAL"
            
            return DetectionResult(
                score=score,
                confidence=sentiment_result['confidence'],
                direction=direction,
                meta={
                    'sentiment': sentiment_result['sentiment'],
                    'strength': sentiment_result.get('strength', 0),
                    'sources': sentiment_result.get('sources', [])
                }
            )
        except Exception as e:
            logger.error("Sentiment detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class SMCDetector:
    """Smart Money Concepts detector adapter"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Run SMC analysis"""
        try:
            # Convert to DataFrame
            df = pd.DataFrame(ohlcv)
            df['timestamp'] = pd.to_datetime(df['ts'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # Analyze SMC structure
            smc_result = analyze_smc_structure(df)
            
            # Convert to DetectionResult
            score = (smc_result['score'] - 0.5) * 2  # Convert 0-1 to -1 to 1
            direction = "BULLISH" if smc_result['bias'] == 'bullish' else "BEARISH" if smc_result['bias'] == 'bearish' else "NEUTRAL"
            
            return DetectionResult(
                score=score,
                confidence=smc_result['confidence'],
                direction=direction,
                meta={
                    'bias': smc_result['bias'],
                    'structure': smc_result.get('structure', {}),
                    'levels': smc_result.get('levels', {})
                }
            )
        except Exception as e:
            logger.error("SMC detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class HarmonicPatternDetector:
    """Harmonic pattern detector adapter"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Detect harmonic patterns"""
        try:
            # Convert to DataFrame
            df = pd.DataFrame(ohlcv)
            df['timestamp'] = pd.to_datetime(df['ts'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # Detect patterns
            patterns = detect_harmonic_patterns(df)
            
            if not patterns:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"patterns": []})
            
            # Get the strongest pattern
            strongest = max(patterns, key=lambda p: p['confidence'])
            
            # Convert to DetectionResult
            score = (strongest['score'] - 0.5) * 2  # Convert 0-1 to -1 to 1
            direction = "BULLISH" if strongest['type'] in ['Gartley', 'Butterfly', 'Bat'] and strongest['bullish'] else "BEARISH" if not strongest['bullish'] else "NEUTRAL"
            
            return DetectionResult(
                score=score,
                confidence=strongest['confidence'],
                direction=direction,
                meta={
                    'pattern_type': strongest['type'],
                    'bullish': strongest['bullish'],
                    'completion_ratio': strongest.get('completion_ratio', 0),
                    'all_patterns': patterns
                }
            )
        except Exception as e:
            logger.error("Harmonic pattern detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class ElliottWaveDetector:
    """Elliott Wave detector adapter"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Detect Elliott Wave patterns"""
        try:
            # Convert to DataFrame
            df = pd.DataFrame(ohlcv)
            df['timestamp'] = pd.to_datetime(df['ts'], unit='ms')
            df.set_index('timestamp', inplace=True)
            
            # Detect waves
            waves = detect_elliott_waves(df)
            
            if not waves:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"waves": []})
            
            # Get the strongest wave
            strongest = max(waves, key=lambda w: w['confidence'])
            
            # Convert to DetectionResult
            score = (strongest['score'] - 0.5) * 2  # Convert 0-1 to -1 to 1
            direction = "BULLISH" if strongest['impulse'] and strongest['bullish'] else "BEARISH" if strongest['impulse'] and not strongest['bullish'] else "NEUTRAL"
            
            return DetectionResult(
                score=score,
                confidence=strongest['confidence'],
                direction=direction,
                meta={
                    'wave_type': strongest['type'],
                    'impulse': strongest['impulse'],
                    'bullish': strongest['bullish'],
                    'degree': strongest.get('degree', 'Minor'),
                    'all_waves': waves
                }
            )
        except Exception as e:
            logger.error("Elliott Wave detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class PriceActionDetector:
    """Price action detector adapter"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Analyze price action patterns"""
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
                meta={
                    'price_change': price_change,
                    'volatility': volatility,
                    'recent_high': max(highs),
                    'recent_low': min(lows)
                }
            )
        except Exception as e:
            logger.error("Price action detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class FibonacciDetector:
    """Fibonacci retracement detector adapter"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Detect Fibonacci retracement levels"""
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
            fib_levels = {
                0.0: swing_high,
                0.236: swing_high - fib_range * 0.236,
                0.382: swing_high - fib_range * 0.382,
                0.5: swing_high - fib_range * 0.5,
                0.618: swing_high - fib_range * 0.618,
                0.786: swing_high - fib_range * 0.786,
                1.0: swing_low
            }
            
            # Find closest Fibonacci level
            closest_level = min(fib_levels.items(), key=lambda x: abs(x[1] - current_price))
            level, price = closest_level
            distance_pct = abs(current_price - price) / price
            
            # Score based on proximity to key levels
            if distance_pct < 0.01:  # Very close to level
                if level in [0.236, 0.382]:  # Support levels
                    score = 0.7
                    direction = "BULLISH"
                    confidence = 0.8
                elif level in [0.618, 0.786]:  # Resistance levels
                    score = -0.7
                    direction = "BEARISH"
                    confidence = 0.8
                else:
                    score = 0.0
                    direction = "NEUTRAL"
                    confidence = 0.3
            else:
                score = 0.0
                direction = "NEUTRAL"
                confidence = 0.2
            
            return DetectionResult(
                score=score,
                confidence=confidence,
                direction=direction,
                meta={
                    'swing_high': swing_high,
                    'swing_low': swing_low,
                    'closest_level': level,
                    'level_price': price,
                    'distance_pct': distance_pct,
                    'fib_levels': fib_levels
                }
            )
        except Exception as e:
            logger.error("Fibonacci detector failed", error=str(e))
            return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": str(e)})

class SARDetector:
    """Parabolic SAR detector adapter"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """Detect Parabolic SAR signals"""
        try:
            if len(ohlcv) < 20:
                return DetectionResult(score=0.0, confidence=0.0, direction="NEUTRAL", meta={"error": "Insufficient data"})
            
            # Simple SAR calculation (simplified)
            recent_data = ohlcv[-20:]
            highs = [c['high'] for c in recent_data]
            lows = [c['low'] for c in recent_data]
            closes = [c['close'] for c in recent_data]
            
            # Calculate simple SAR
            af = 0.02  # Acceleration factor
            max_af = 0.2
            
            # Initialize
            sar = lows[0]
            trend = 1  # 1 for uptrend, -1 for downtrend
            ep = highs[0] if trend == 1 else lows[0]
            
            # Calculate SAR for recent periods
            for i in range(1, len(recent_data)):
                if trend == 1:
                    sar = sar + af * (ep - sar)
                    if lows[i] <= sar:
                        trend = -1
                        sar = ep
                        ep = lows[i]
                        af = 0.02
                    else:
                        if highs[i] > ep:
                            ep = highs[i]
                            af = min(af + 0.02, max_af)
                else:
                    sar = sar + af * (ep - sar)
                    if highs[i] >= sar:
                        trend = 1
                        sar = ep
                        ep = highs[i]
                        af = 0.02
                    else:
                        if lows[i] < ep:
                            ep = lows[i]
                            af = min(af + 0.02, max_af)
            
            current_price = closes[-1]
            
            # Determine signal
            if trend == 1 and current_price > sar:
                score = 0.6
                direction = "BULLISH"
                confidence = 0.7
            elif trend == -1 and current_price < sar:
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
                meta={
                    'sar_value': sar,
                    'trend': trend,
                    'ep': ep,
                    'af': af,
                    'current_price': current_price
                }
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
"""
Price Action Pattern Detector
Detects candlestick patterns and price action signals
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List
from .base import BaseDetector, DetectionResult

class PriceActionDetector(BaseDetector):
    """Detects price action patterns and candlestick formations"""
    
    def __init__(self):
        super().__init__("price_action")
    
    async def detect(self, ohlcv: pd.DataFrame, context: Dict[str, Any] = None) -> DetectionResult:
        """Detect price action patterns in OHLCV data"""
        try:
            if len(ohlcv) < 10:
                return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": "Insufficient data"})
            
            # Get recent OHLCV data
            recent_data = ohlcv.tail(20)
            
            # Detect various price action patterns
            candlestick_patterns = self._detect_candlestick_patterns(recent_data)
            price_action_signals = self._detect_price_action_signals(recent_data)
            trend_signals = self._analyze_trend_signals(recent_data)
            
            # Combine all signals
            combined_score = self._calculate_combined_score(
                candlestick_patterns, price_action_signals, trend_signals
            )
            
            direction = self._determine_price_action_direction(
                candlestick_patterns, price_action_signals, trend_signals
            )
            
            confidence = self._calculate_confidence(combined_score, context)
            
            return DetectionResult(
                score=combined_score,
                direction=direction,
                confidence=confidence,
                meta={
                    "candlestick_patterns": candlestick_patterns,
                    "price_action_signals": price_action_signals,
                    "trend_signals": trend_signals
                }
            )
            
        except Exception as e:
            return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": str(e)})
    
    def _detect_candlestick_patterns(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect candlestick patterns"""
        patterns = []
        
        if len(data) < 3:
            return patterns
        
        # Get OHLC data
        opens = data['open'].values
        highs = data['high'].values
        lows = data['low'].values
        closes = data['close'].values
        
        # Check for patterns in the last few candles
        for i in range(2, len(data)):
            # Hammer pattern
            if self._is_hammer(opens[i], highs[i], lows[i], closes[i]):
                patterns.append({
                    'pattern': 'hammer',
                    'strength': self._calculate_hammer_strength(opens[i], highs[i], lows[i], closes[i]),
                    'direction': 'bullish',
                    'index': i
                })
            
            # Shooting star pattern
            if self._is_shooting_star(opens[i], highs[i], lows[i], closes[i]):
                patterns.append({
                    'pattern': 'shooting_star',
                    'strength': self._calculate_shooting_star_strength(opens[i], highs[i], lows[i], closes[i]),
                    'direction': 'bearish',
                    'index': i
                })
            
            # Doji pattern
            if self._is_doji(opens[i], highs[i], lows[i], closes[i]):
                patterns.append({
                    'pattern': 'doji',
                    'strength': self._calculate_doji_strength(opens[i], highs[i], lows[i], closes[i]),
                    'direction': 'neutral',
                    'index': i
                })
            
            # Engulfing patterns
            if i >= 1:
                if self._is_bullish_engulfing(opens[i-1], closes[i-1], opens[i], closes[i]):
                    patterns.append({
                        'pattern': 'bullish_engulfing',
                        'strength': self._calculate_engulfing_strength(opens[i-1], closes[i-1], opens[i], closes[i]),
                        'direction': 'bullish',
                        'index': i
                    })
                
                if self._is_bearish_engulfing(opens[i-1], closes[i-1], opens[i], closes[i]):
                    patterns.append({
                        'pattern': 'bearish_engulfing',
                        'strength': self._calculate_engulfing_strength(opens[i-1], closes[i-1], opens[i], closes[i]),
                        'direction': 'bearish',
                        'index': i
                    })
        
        return patterns[-5:]  # Return last 5 patterns
    
    def _is_hammer(self, open_price: float, high: float, low: float, close: float) -> bool:
        """Check if candle is a hammer pattern"""
        body_size = abs(close - open_price)
        lower_shadow = min(open_price, close) - low
        upper_shadow = high - max(open_price, close)
        total_range = high - low
        
        if total_range == 0:
            return False
        
        # Hammer criteria: small body, long lower shadow, small upper shadow
        return (body_size / total_range < 0.3 and
                lower_shadow / total_range > 0.6 and
                upper_shadow / total_range < 0.1)
    
    def _is_shooting_star(self, open_price: float, high: float, low: float, close: float) -> bool:
        """Check if candle is a shooting star pattern"""
        body_size = abs(close - open_price)
        lower_shadow = min(open_price, close) - low
        upper_shadow = high - max(open_price, close)
        total_range = high - low
        
        if total_range == 0:
            return False
        
        # Shooting star criteria: small body, long upper shadow, small lower shadow
        return (body_size / total_range < 0.3 and
                upper_shadow / total_range > 0.6 and
                lower_shadow / total_range < 0.1)
    
    def _is_doji(self, open_price: float, high: float, low: float, close: float) -> bool:
        """Check if candle is a doji pattern"""
        body_size = abs(close - open_price)
        total_range = high - low
        
        if total_range == 0:
            return False
        
        # Doji criteria: very small body relative to total range
        return body_size / total_range < 0.1
    
    def _is_bullish_engulfing(self, prev_open: float, prev_close: float, 
                             curr_open: float, curr_close: float) -> bool:
        """Check if current candle is a bullish engulfing pattern"""
        # Previous candle should be bearish
        if prev_close >= prev_open:
            return False
        
        # Current candle should be bullish
        if curr_close <= curr_open:
            return False
        
        # Current candle should engulf previous candle
        return curr_open < prev_close and curr_close > prev_open
    
    def _is_bearish_engulfing(self, prev_open: float, prev_close: float,
                             curr_open: float, curr_close: float) -> bool:
        """Check if current candle is a bearish engulfing pattern"""
        # Previous candle should be bullish
        if prev_close <= prev_open:
            return False
        
        # Current candle should be bearish
        if curr_close >= curr_open:
            return False
        
        # Current candle should engulf previous candle
        return curr_open > prev_close and curr_close < prev_open
    
    def _calculate_hammer_strength(self, open_price: float, high: float, low: float, close: float) -> float:
        """Calculate strength of hammer pattern"""
        body_size = abs(close - open_price)
        lower_shadow = min(open_price, close) - low
        total_range = high - low
        
        if total_range == 0:
            return 0
        
        # Strength based on shadow length and body size
        shadow_ratio = lower_shadow / total_range
        body_ratio = body_size / total_range
        
        return min(1.0, shadow_ratio * 2 - body_ratio)
    
    def _calculate_shooting_star_strength(self, open_price: float, high: float, low: float, close: float) -> float:
        """Calculate strength of shooting star pattern"""
        body_size = abs(close - open_price)
        upper_shadow = high - max(open_price, close)
        total_range = high - low
        
        if total_range == 0:
            return 0
        
        shadow_ratio = upper_shadow / total_range
        body_ratio = body_size / total_range
        
        return min(1.0, shadow_ratio * 2 - body_ratio)
    
    def _calculate_doji_strength(self, open_price: float, high: float, low: float, close: float) -> float:
        """Calculate strength of doji pattern"""
        body_size = abs(close - open_price)
        total_range = high - low
        
        if total_range == 0:
            return 0
        
        # Doji strength is inverse of body size
        return 1.0 - (body_size / total_range)
    
    def _calculate_engulfing_strength(self, prev_open: float, prev_close: float,
                                    curr_open: float, curr_close: float) -> float:
        """Calculate strength of engulfing pattern"""
        prev_body = abs(prev_close - prev_open)
        curr_body = abs(curr_close - curr_open)
        
        if prev_body == 0:
            return 0
        
        # Strength based on how much the current candle engulfs the previous
        engulfing_ratio = curr_body / prev_body
        return min(1.0, engulfing_ratio - 1.0)
    
    def _detect_price_action_signals(self, data: pd.DataFrame) -> List[Dict[str, Any]]:
        """Detect price action signals"""
        signals = []
        
        if len(data) < 5:
            return signals
        
        closes = data['close'].values
        highs = data['high'].values
        lows = data['low'].values
        
        # Check for breakout signals
        breakout = self._detect_breakout(highs, lows, closes)
        if breakout:
            signals.append(breakout)
        
        # Check for reversal signals
        reversal = self._detect_reversal(highs, lows, closes)
        if reversal:
            signals.append(reversal)
        
        # Check for continuation signals
        continuation = self._detect_continuation(highs, lows, closes)
        if continuation:
            signals.append(continuation)
        
        return signals
    
    def _detect_breakout(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> Dict[str, Any]:
        """Detect breakout signals"""
        if len(highs) < 10:
            return None
        
        # Look for recent resistance/support levels
        recent_highs = highs[-10:]
        recent_lows = lows[-10:]
        current_close = closes[-1]
        
        # Check for resistance breakout
        resistance_level = np.max(recent_highs[:-1])  # Exclude current bar
        if current_close > resistance_level * 1.001:  # 0.1% above resistance
            return {
                'signal': 'resistance_breakout',
                'direction': 'bullish',
                'strength': min(1.0, (current_close - resistance_level) / resistance_level * 100),
                'level': resistance_level
            }
        
        # Check for support breakdown
        support_level = np.min(recent_lows[:-1])  # Exclude current bar
        if current_close < support_level * 0.999:  # 0.1% below support
            return {
                'signal': 'support_breakdown',
                'direction': 'bearish',
                'strength': min(1.0, (support_level - current_close) / support_level * 100),
                'level': support_level
            }
        
        return None
    
    def _detect_reversal(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> Dict[str, Any]:
        """Detect reversal signals"""
        if len(closes) < 5:
            return None
        
        # Check for double top/bottom patterns
        recent_closes = closes[-5:]
        
        # Simple double top detection
        if len(recent_closes) >= 4:
            if (recent_closes[0] > recent_closes[1] and
                recent_closes[1] < recent_closes[2] and
                recent_closes[2] > recent_closes[3] and
                abs(recent_closes[0] - recent_closes[2]) / recent_closes[0] < 0.02):
                return {
                    'signal': 'double_top',
                    'direction': 'bearish',
                    'strength': 0.7
                }
        
        # Simple double bottom detection
        if len(recent_closes) >= 4:
            if (recent_closes[0] < recent_closes[1] and
                recent_closes[1] > recent_closes[2] and
                recent_closes[2] < recent_closes[3] and
                abs(recent_closes[0] - recent_closes[2]) / recent_closes[0] < 0.02):
                return {
                    'signal': 'double_bottom',
                    'direction': 'bullish',
                    'strength': 0.7
                }
        
        return None
    
    def _detect_continuation(self, highs: np.ndarray, lows: np.ndarray, closes: np.ndarray) -> Dict[str, Any]:
        """Detect continuation signals"""
        if len(closes) < 5:
            return None
        
        # Check for flag/pennant patterns
        recent_closes = closes[-5:]
        
        # Simple flag pattern detection
        if len(recent_closes) >= 4:
            # Check for consolidation after a move
            price_range = max(recent_closes) - min(recent_closes)
            avg_price = np.mean(recent_closes)
            
            if price_range / avg_price < 0.02:  # Less than 2% range
                return {
                    'signal': 'consolidation',
                    'direction': 'neutral',
                    'strength': 0.5
                }
        
        return None
    
    def _analyze_trend_signals(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Analyze trend signals"""
        if len(data) < 10:
            return {}
        
        closes = data['close'].values
        
        # Calculate simple moving averages
        sma_5 = np.mean(closes[-5:])
        sma_10 = np.mean(closes[-10:])
        
        # Determine trend
        if sma_5 > sma_10 * 1.01:  # 5-period SMA > 10-period SMA by 1%
            trend = 'uptrend'
            strength = min(1.0, (sma_5 - sma_10) / sma_10 * 100)
        elif sma_5 < sma_10 * 0.99:  # 5-period SMA < 10-period SMA by 1%
            trend = 'downtrend'
            strength = min(1.0, (sma_10 - sma_5) / sma_10 * 100)
        else:
            trend = 'sideways'
            strength = 0.5
        
        return {
            'trend': trend,
            'strength': strength,
            'sma_5': sma_5,
            'sma_10': sma_10
        }
    
    def _calculate_combined_score(self, candlestick_patterns: List[Dict], 
                                 price_action_signals: List[Dict], 
                                 trend_signals: Dict) -> float:
        """Calculate combined price action score"""
        score = 0.5  # Base score
        
        # Candlestick patterns contribution
        if candlestick_patterns:
            pattern_scores = [p['strength'] for p in candlestick_patterns]
            avg_pattern_score = np.mean(pattern_scores)
            score += (avg_pattern_score - 0.5) * 0.3
        
        # Price action signals contribution
        if price_action_signals:
            signal_scores = [s['strength'] for s in price_action_signals]
            avg_signal_score = np.mean(signal_scores)
            score += (avg_signal_score - 0.5) * 0.3
        
        # Trend signals contribution
        if trend_signals:
            trend_strength = trend_signals.get('strength', 0.5)
            score += (trend_strength - 0.5) * 0.4
        
        return max(0, min(1, score))
    
    def _determine_price_action_direction(self, candlestick_patterns: List[Dict],
                                        price_action_signals: List[Dict],
                                        trend_signals: Dict) -> str:
        """Determine overall price action direction"""
        bullish_signals = 0
        bearish_signals = 0
        
        # Count candlestick patterns
        for pattern in candlestick_patterns:
            if pattern['direction'] == 'bullish':
                bullish_signals += 1
            elif pattern['direction'] == 'bearish':
                bearish_signals += 1
        
        # Count price action signals
        for signal in price_action_signals:
            if signal['direction'] == 'bullish':
                bullish_signals += 1
            elif signal['direction'] == 'bearish':
                bearish_signals += 1
        
        # Count trend signals
        trend = trend_signals.get('trend', 'sideways')
        if trend == 'uptrend':
            bullish_signals += 1
        elif trend == 'downtrend':
            bearish_signals += 1
        
        if bullish_signals > bearish_signals:
            return "BULLISH"
        elif bearish_signals > bullish_signals:
            return "BEARISH"
        else:
            return "NEUTRAL"
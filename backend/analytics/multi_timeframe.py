import pandas as pd
import asyncio
from typing import Dict, List, Tuple
from datetime import datetime, timedelta
import numpy as np

# Import existing modules (assuming they exist)
try:
    from ..data.binance_client import binance_client
except ImportError:
    binance_client = None

try:
    from .core_signals import generate_rsi_macd_signal
except ImportError:
    def generate_rsi_macd_signal(data):
        return {"score": 0.5, "action": "HOLD", "confidence": 0.5}

try:
    from .smc_analysis import analyze_smart_money_concepts
except ImportError:
    def analyze_smart_money_concepts(data):
        return {"score": 0.5, "bos": False, "choch": False}

try:
    from .pattern_detection import detect_candlestick_patterns
except ImportError:
    def detect_candlestick_patterns(data):
        return {"score": 0.5, "patterns": []}

class MultiTimeframeAnalyzer:
    def __init__(self):
        self.timeframes = ['1m', '5m', '15m', '1h', '4h', '1d']
        self.weights = {
            '1m': 0.05,
            '5m': 0.10,
            '15m': 0.15,
            '1h': 0.25,
            '4h': 0.25,
            '1d': 0.20
        }
    
    async def analyze_multi_timeframe(self, symbol: str) -> Dict:
        """Comprehensive multi-timeframe analysis"""
        
        # Get data for all timeframes
        timeframe_data = await self._fetch_all_timeframes(symbol)
        
        # Analyze each timeframe
        timeframe_signals = {}
        for tf, data in timeframe_data.items():
            if not data.empty:
                signals = await self._analyze_timeframe(tf, data)
                timeframe_signals[tf] = signals
        
        # Calculate combined signal
        combined_signal = self._combine_timeframe_signals(timeframe_signals)
        
        # Determine trend alignment
        trend_alignment = self._calculate_trend_alignment(timeframe_signals)
        
        return {
            'symbol': symbol,
            'timestamp': datetime.now(),
            'timeframe_signals': timeframe_signals,
            'combined_signal': combined_signal,
            'trend_alignment': trend_alignment,
            'recommendation': self._generate_recommendation(combined_signal, trend_alignment)
        }
    
    async def _fetch_all_timeframes(self, symbol: str) -> Dict[str, pd.DataFrame]:
        """Fetch OHLCV data for all timeframes"""
        
        timeframe_data = {}
        
        # If binance_client is available, use it
        if binance_client:
            tasks = []
            for tf in self.timeframes:
                limit = self._get_limit_for_timeframe(tf)
                task = binance_client.get_klines(symbol, tf, limit)
                tasks.append(task)
            
            try:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for i, result in enumerate(results):
                    if not isinstance(result, Exception) and not result.empty:
                        timeframe_data[self.timeframes[i]] = result
            except Exception as e:
                print(f"Error fetching data: {e}")
        
        # Generate mock data if no real data available
        if not timeframe_data:
            timeframe_data = self._generate_mock_data(symbol)
        
        return timeframe_data
    
    def _generate_mock_data(self, symbol: str) -> Dict[str, pd.DataFrame]:
        """Generate mock OHLCV data for testing"""
        
        timeframe_data = {}
        base_price = 45000 if 'BTC' in symbol else 3000
        
        for tf in self.timeframes:
            limit = self._get_limit_for_timeframe(tf)
            
            # Generate realistic price movement
            dates = pd.date_range(end=datetime.now(), periods=limit, freq='1H')
            
            # Random walk for prices
            price_changes = np.random.normal(0, 0.02, limit)
            prices = [base_price]
            
            for change in price_changes[1:]:
                new_price = prices[-1] * (1 + change)
                prices.append(max(new_price, base_price * 0.8))  # Prevent too low prices
            
            # Create OHLCV data
            data = []
            for i, (date, close_price) in enumerate(zip(dates, prices)):
                high = close_price * (1 + abs(np.random.normal(0, 0.01)))
                low = close_price * (1 - abs(np.random.normal(0, 0.01)))
                open_price = prices[i-1] if i > 0 else close_price
                volume = np.random.uniform(100, 1000)
                
                data.append({
                    'timestamp': date,
                    'open': open_price,
                    'high': high,
                    'low': low,
                    'close': close_price,
                    'volume': volume
                })
            
            timeframe_data[tf] = pd.DataFrame(data)
        
        return timeframe_data
    
    def _get_limit_for_timeframe(self, timeframe: str) -> int:
        """Get appropriate data limit for each timeframe"""
        limits = {
            '1m': 200,
            '5m': 200,
            '15m': 200,
            '1h': 168,  # 1 week
            '4h': 168,  # 4 weeks
            '1d': 100   # ~3 months
        }
        return limits.get(timeframe, 100)
    
    async def _analyze_timeframe(self, timeframe: str, data: pd.DataFrame) -> Dict:
        """Analyze individual timeframe"""
        
        # Core technical analysis
        core_signal = generate_rsi_macd_signal(data)
        
        # SMC analysis
        smc_analysis = analyze_smart_money_concepts(data)
        
        # Pattern detection
        pattern_analysis = detect_candlestick_patterns(data)
        
        # Trend determination
        trend = self._determine_trend(data)
        
        # Volatility analysis
        volatility = self._calculate_volatility(data)
        
        # Support and resistance levels
        sr_levels = self._calculate_support_resistance(data)
        
        # Calculate timeframe score
        tf_score = self._calculate_timeframe_score(
            core_signal, smc_analysis, pattern_analysis, trend, volatility
        )
        
        return {
            'timeframe': timeframe,
            'core_signal': core_signal,
            'smc_analysis': smc_analysis,
            'pattern_analysis': pattern_analysis,
            'trend': trend,
            'volatility': volatility,
            'support_resistance': sr_levels,
            'score': tf_score,
            'weight': self.weights.get(timeframe, 0.1)
        }
    
    def _determine_trend(self, data: pd.DataFrame) -> Dict:
        """Determine trend for the timeframe"""
        
        if len(data) < 50:
            return {'direction': 'NEUTRAL', 'strength': 0.5}
        
        # Calculate EMAs
        ema_20 = data['close'].ewm(span=20).mean()
        ema_50 = data['close'].ewm(span=50).mean()
        
        current_price = data['close'].iloc[-1]
        current_ema_20 = ema_20.iloc[-1]
        current_ema_50 = ema_50.iloc[-1]
        
        # Determine trend direction
        if current_price > current_ema_20 > current_ema_50:
            direction = 'BULLISH'
            strength = min((current_price - current_ema_50) / current_ema_50 * 10, 1.0)
        elif current_price < current_ema_20 < current_ema_50:
            direction = 'BEARISH'
            strength = min((current_ema_50 - current_price) / current_ema_50 * 10, 1.0)
        else:
            direction = 'NEUTRAL'
            strength = 0.5
        
        return {
            'direction': direction,
            'strength': strength,
            'ema_20': current_ema_20,
            'ema_50': current_ema_50
        }
    
    def _calculate_volatility(self, data: pd.DataFrame) -> Dict:
        """Calculate volatility metrics"""
        
        returns = data['close'].pct_change().dropna()
        
        if len(returns) < 20:
            return {'value': 0, 'level': 'LOW'}
        
        volatility = returns.std() * (252 ** 0.5)  # Annualized
        
        # Classify volatility level
        if volatility < 0.2:
            level = 'LOW'
        elif volatility < 0.5:
            level = 'MODERATE'
        elif volatility < 1.0:
            level = 'HIGH'
        else:
            level = 'EXTREME'
        
        return {
            'value': volatility,
            'level': level,
            'percentile': self._calculate_volatility_percentile(returns)
        }
    
    def _calculate_volatility_percentile(self, returns: pd.Series, window: int = 50) -> float:
        """Calculate volatility percentile"""
        
        if len(returns) < window:
            return 0.5
        
        rolling_vol = returns.rolling(window).std()
        current_vol = rolling_vol.iloc[-1]
        
        percentile = (rolling_vol < current_vol).sum() / len(rolling_vol.dropna())
        return percentile
    
    def _calculate_support_resistance(self, data: pd.DataFrame) -> Dict:
        """Calculate support and resistance levels"""
        
        if len(data) < 50:
            return {'support': [], 'resistance': []}
        
        # Use pivot points method
        highs = data['high'].rolling(window=10).max()
        lows = data['low'].rolling(window=10).min()
        
        # Find significant levels
        resistance_levels = []
        support_levels = []
        
        current_price = data['close'].iloc[-1]
        
        # Simple resistance levels (recent highs)
        recent_highs = data['high'].tail(50).nlargest(5)
        for high in recent_highs:
            if high > current_price:
                resistance_levels.append(high)
        
        # Simple support levels (recent lows)
        recent_lows = data['low'].tail(50).nsmallest(5)
        for low in recent_lows:
            if low < current_price:
                support_levels.append(low)
        
        return {
            'support': sorted(support_levels, reverse=True)[:3],
            'resistance': sorted(resistance_levels)[:3]
        }
    
    def _calculate_timeframe_score(self, core_signal: Dict, smc_analysis: Dict, 
                                  pattern_analysis: Dict, trend: Dict, volatility: Dict) -> float:
        """Calculate combined score for timeframe"""
        
        # Base score from core algorithm
        base_score = (
            0.40 * core_signal.get('score', 0.5) +
            0.25 * smc_analysis.get('score', 0.5) +
            0.20 * pattern_analysis.get('score', 0.5) +
            0.15 * trend.get('strength', 0.5)
        )
        
        # Adjust for volatility
        vol_adjustment = 1.0
        if volatility['level'] == 'EXTREME':
            vol_adjustment = 0.8  # Reduce confidence in extreme volatility
        elif volatility['level'] == 'LOW':
            vol_adjustment = 1.1  # Increase confidence in low volatility
        
        return min(base_score * vol_adjustment, 1.0)
    
    def _combine_timeframe_signals(self, timeframe_signals: Dict) -> Dict:
        """Combine signals from all timeframes"""
        
        if not timeframe_signals:
            return {'score': 0.5, 'action': 'HOLD', 'confidence': 0.0}
        
        # Weighted average of all timeframe scores
        total_weighted_score = 0.0
        total_weight = 0.0
        
        action_votes = {'BUY': 0, 'SELL': 0, 'HOLD': 0}
        
        for tf_data in timeframe_signals.values():
            weight = tf_data['weight']
            score = tf_data['score']
            
            total_weighted_score += score * weight
            total_weight += weight
            
            # Count action votes
            action = tf_data['core_signal'].get('action', 'HOLD')
            action_votes[action] += weight
        
        # Calculate final score
        final_score = total_weighted_score / total_weight if total_weight > 0 else 0.5
        
        # Determine action based on votes
        max_action = max(action_votes, key=action_votes.get)
        confidence = action_votes[max_action] / total_weight if total_weight > 0 else 0.0
        
        return {
            'score': final_score,
            'action': max_action,
            'confidence': confidence,
            'weighted_votes': action_votes
        }
    
    def _calculate_trend_alignment(self, timeframe_signals: Dict) -> Dict:
        """Calculate trend alignment across timeframes"""
        
        if not timeframe_signals:
            return {'alignment': 0.0, 'direction': 'NEUTRAL'}
        
        trend_directions = []
        weights = []
        
        for tf_data in timeframe_signals.values():
            trend_dir = tf_data['trend']['direction']
            weight = tf_data['weight']
            
            trend_directions.append(trend_dir)
            weights.append(weight)
        
        # Calculate alignment score
        bullish_weight = sum(w for td, w in zip(trend_directions, weights) if td == 'BULLISH')
        bearish_weight = sum(w for td, w in zip(trend_directions, weights) if td == 'BEARISH')
        neutral_weight = sum(w for td, w in zip(trend_directions, weights) if td == 'NEUTRAL')
        
        total_weight = sum(weights)
        
        if total_weight == 0:
            return {'alignment': 0.0, 'direction': 'NEUTRAL'}
        
        bullish_pct = bullish_weight / total_weight
        bearish_pct = bearish_weight / total_weight
        neutral_pct = neutral_weight / total_weight
        
        # Determine overall direction and alignment
        if bullish_pct > bearish_pct and bullish_pct > neutral_pct:
            direction = 'BULLISH'
            alignment = bullish_pct
        elif bearish_pct > bullish_pct and bearish_pct > neutral_pct:
            direction = 'BEARISH'
            alignment = bearish_pct
        else:
            direction = 'NEUTRAL'
            alignment = neutral_pct
        
        return {
            'alignment': alignment,
            'direction': direction,
            'bullish_pct': bullish_pct,
            'bearish_pct': bearish_pct,
            'neutral_pct': neutral_pct
        }
    
    def _generate_recommendation(self, combined_signal: Dict, trend_alignment: Dict) -> Dict:
        """Generate final trading recommendation"""
        
        action = combined_signal['action']
        confidence = combined_signal['confidence']
        alignment = trend_alignment['alignment']
        
        # Adjust confidence based on trend alignment
        if alignment > 0.7:  # Strong alignment
            confidence *= 1.2
        elif alignment < 0.4:  # Poor alignment
            confidence *= 0.8
        
        confidence = min(confidence, 1.0)
        
        # Generate recommendation
        if confidence > 0.7 and action in ['BUY', 'SELL']:
            recommendation = f"STRONG {action}"
        elif confidence > 0.5 and action in ['BUY', 'SELL']:
            recommendation = f"MODERATE {action}"
        else:
            recommendation = "HOLD"
        
        return {
            'action': recommendation,
            'confidence': confidence,
            'reasons': self._generate_reasons(combined_signal, trend_alignment)
        }
    
    def _generate_reasons(self, combined_signal: Dict, trend_alignment: Dict) -> List[str]:
        """Generate reasons for the recommendation"""
        
        reasons = []
        
        if trend_alignment['alignment'] > 0.7:
            reasons.append(f"Strong trend alignment ({trend_alignment['direction']})")
        
        if combined_signal['confidence'] > 0.7:
            reasons.append("High signal confidence across timeframes")
        
        if trend_alignment['direction'] == combined_signal['action']:
            reasons.append("Signal direction matches trend direction")
        
        if combined_signal['score'] > 0.6:
            reasons.append("Technical indicators show favorable conditions")
        
        return reasons

# Global multi-timeframe analyzer
mtf_analyzer = MultiTimeframeAnalyzer()

# Convenience function for quick analysis
async def analyze_symbol_mtf(symbol: str) -> Dict:
    """Quick multi-timeframe analysis for a symbol"""
    return await mtf_analyzer.analyze_multi_timeframe(symbol)
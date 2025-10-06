"""
Phase 5: Multi-Timeframe Scanner
Implements comprehensive multi-timeframe scanning with filtering and ranking
"""

import asyncio
import numpy as np
from typing import List, Dict, Optional, Literal
from dataclasses import dataclass, field
from datetime import datetime
import structlog

logger = structlog.get_logger()

# Import existing modules
try:
    from ..data.data_manager import data_manager
    from ..analytics.core_signals import generate_rsi_macd_signal
    from ..analytics.smc_analysis import analyze_smart_money_concepts
    from ..analytics.pattern_detection import detect_candlestick_patterns
    from ..analytics.sentiment import SentimentAnalyzer
    from ..analytics.ml_predictor import ml_predictor
    from ..analytics.indicators import calculate_atr
except ImportError as e:
    logger.warning(f"Import error in mtf_scanner: {e}")

@dataclass
class ScanRule:
    """Scanner filtering rules"""
    mode: Literal["aggressive", "conservative"] = "conservative"
    any_tf_threshold: float = 0.65  # Aggressive: trigger if ANY TF exceeds
    majority_tf_threshold: float = 0.60  # Conservative: need majority
    min_confidence: float = 0.5
    exclude_neutral: bool = True

@dataclass
class CombinedScore:
    """Combined score from all detectors"""
    final_score: float
    direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    confidence: float
    bull_mass: float
    bear_mass: float
    disagreement: float
    components: Dict[str, float]

@dataclass
class ScanResult:
    """Single symbol scan result"""
    symbol: str
    overall_score: float
    overall_direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    timeframe_scores: Dict[str, CombinedScore]
    consensus_strength: float  # Agreement across timeframes
    recommended_action: str
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]

class MultiTimeframeScanner:
    """Scan multiple symbols across multiple timeframes"""
    
    def __init__(self, data_aggregator, scoring_engine, weights):
        self.data = data_aggregator
        self.engine = scoring_engine
        self.weights = weights
        
        # Timeframe weights (higher TF = more weight)
        self.tf_weights = {
            "5m": 0.1,
            "15m": 0.15,
            "1h": 0.25,
            "4h": 0.3,
            "1d": 0.2
        }
    
    async def scan(
        self,
        symbols: List[str],
        timeframes: List[str],
        rules: Optional[ScanRule] = None
    ) -> List[ScanResult]:
        """
        Scan symbols across timeframes
        
        Args:
            symbols: ["BTC/USDT", "ETH/USDT", ...]
            timeframes: ["15m", "1h", "4h"]
            rules: Filtering and ranking rules
        
        Returns:
            Sorted list of scan results (best opportunities first)
        """
        if rules is None:
            rules = ScanRule()
        
        logger.info(
            "Starting MTF scan",
            symbols=len(symbols),
            timeframes=timeframes,
            mode=rules.mode
        )
        
        # Scan all symbol-timeframe combinations in parallel
        scan_tasks = []
        for symbol in symbols:
            scan_tasks.append(
                self._scan_symbol_all_timeframes(symbol, timeframes)
            )
        
        results = await asyncio.gather(*scan_tasks, return_exceptions=True)
        
        # Process results
        valid_results = []
        for symbol, result in zip(symbols, results):
            if isinstance(result, Exception):
                logger.error(f"Scan failed for {symbol}", error=str(result))
                continue
            
            # Apply filtering rules
            if self._passes_filter(result, rules):
                valid_results.append(result)
        
        # Sort by score (descending for bullish, ascending for bearish)
        valid_results.sort(
            key=lambda r: r.overall_score if r.overall_direction == "BULLISH" else 1 - r.overall_score,
            reverse=True
        )
        
        logger.info(
            "Scan complete",
            total_symbols=len(symbols),
            opportunities_found=len(valid_results)
        )
        
        return valid_results
    
    async def _scan_symbol_all_timeframes(
        self,
        symbol: str,
        timeframes: List[str]
    ) -> ScanResult:
        """Scan single symbol across all timeframes"""
        
        tf_scores = {}
        
        for tf in timeframes:
            try:
                # Get OHLCV data
                ohlcv = await self._get_ohlcv_data(symbol, tf, limit=200)
                
                if ohlcv is None or len(ohlcv) < 50:
                    logger.warning(f"Insufficient data for {symbol} {tf}")
                    continue
                
                # Generate combined score
                score = await self._generate_combined_score(ohlcv, symbol, tf)
                tf_scores[tf] = score
                
            except Exception as e:
                logger.warning(f"Failed to scan {symbol} {tf}", error=str(e))
                # Continue with other timeframes
        
        if not tf_scores:
            raise ValueError(f"No valid timeframes for {symbol}")
        
        # Aggregate across timeframes
        aggregated = self._aggregate_timeframes(tf_scores)
        
        return ScanResult(
            symbol=symbol,
            overall_score=aggregated['score'],
            overall_direction=aggregated['direction'],
            timeframe_scores=tf_scores,
            consensus_strength=aggregated['consensus'],
            recommended_action=aggregated['action'],
            risk_level=aggregated['risk']
        )
    
    async def _get_ohlcv_data(self, symbol: str, timeframe: str, limit: int = 200):
        """Get OHLCV data from data manager"""
        try:
            # Convert timeframe format if needed
            tf_mapping = {
                "5m": "5m",
                "15m": "15m", 
                "1h": "1h",
                "4h": "4h",
                "1d": "1d"
            }
            
            tf = tf_mapping.get(timeframe, timeframe)
            
            # Try to get data from data manager
            if hasattr(self.data, 'get_ohlcv_data'):
                return await self.data.get_ohlcv_data(symbol, tf, limit)
            else:
                # Fallback to mock data
                return self._generate_mock_ohlcv(symbol, limit)
                
        except Exception as e:
            logger.error(f"Error getting OHLCV data for {symbol} {timeframe}: {e}")
            return self._generate_mock_ohlcv(symbol, limit)
    
    def _generate_mock_ohlcv(self, symbol: str, limit: int):
        """Generate mock OHLCV data for testing"""
        import pandas as pd
        import numpy as np
        
        base_price = 45000 if 'BTC' in symbol else 3000 if 'ETH' in symbol else 100
        
        # Generate realistic price movement
        dates = pd.date_range(end=datetime.now(), periods=limit, freq='1H')
        price_changes = np.random.normal(0, 0.02, limit)
        prices = [base_price]
        
        for change in price_changes[1:]:
            new_price = prices[-1] * (1 + change)
            prices.append(max(new_price, base_price * 0.8))
        
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
        
        return pd.DataFrame(data)
    
    async def _generate_combined_score(self, ohlcv, symbol: str, timeframe: str) -> CombinedScore:
        """Generate combined score using all available detectors"""
        
        try:
            # 1. Core RSI+MACD signal (40% weight)
            core_signal = generate_rsi_macd_signal(ohlcv)
            rsi_macd_score = core_signal.get('score', 0.5)
            
            # 2. Smart Money Concepts (25% weight)
            smc_analysis = analyze_smart_money_concepts(ohlcv)
            smc_score = smc_analysis.get('score', 0.5)
            
            # 3. Pattern detection (20% weight)
            pattern_analysis = detect_candlestick_patterns(ohlcv)
            pattern_score = pattern_analysis.get('score', 0.5)
            
            # 4. Sentiment analysis (10% weight)
            sentiment_score = 0.5  # Placeholder
            try:
                sentiment_analyzer = SentimentAnalyzer()
                sentiment_data = await self.data.get_sentiment_data(symbol.replace('USDT', ''))
                sentiment_score = sentiment_data.get('score', 0.5)
            except:
                pass
            
            # 5. ML prediction (5% weight)
            ml_score = 0.5  # Placeholder
            try:
                ml_prediction = ml_predictor.predict(ohlcv)
                ml_score = ml_prediction.get('score', 0.5)
            except:
                pass
            
            # Calculate final score using immutable formula
            final_score = (
                0.40 * rsi_macd_score +
                0.25 * smc_score +
                0.20 * pattern_score +
                0.10 * sentiment_score +
                0.05 * ml_score
            )
            
            # Determine direction
            if final_score > 0.6:
                direction = "BULLISH"
            elif final_score < 0.4:
                direction = "BEARISH"
            else:
                direction = "NEUTRAL"
            
            # Calculate confidence
            confidence = abs(final_score - 0.5) * 2
            
            # Calculate bull/bear mass
            bull_mass = max(0, final_score - 0.5) * 2
            bear_mass = max(0, 0.5 - final_score) * 2
            
            # Calculate disagreement (how much detectors disagree)
            scores = [rsi_macd_score, smc_score, pattern_score, sentiment_score, ml_score]
            disagreement = np.std(scores)
            
            return CombinedScore(
                final_score=final_score,
                direction=direction,
                confidence=confidence,
                bull_mass=bull_mass,
                bear_mass=bear_mass,
                disagreement=disagreement,
                components={
                    'rsi_macd': rsi_macd_score,
                    'smc': smc_score,
                    'pattern': pattern_score,
                    'sentiment': sentiment_score,
                    'ml': ml_score
                }
            )
            
        except Exception as e:
            logger.error(f"Error generating combined score for {symbol} {timeframe}: {e}")
            # Return neutral score on error
            return CombinedScore(
                final_score=0.5,
                direction="NEUTRAL",
                confidence=0.0,
                bull_mass=0.0,
                bear_mass=0.0,
                disagreement=1.0,
                components={}
            )
    
    def _aggregate_timeframes(self, tf_scores: Dict[str, CombinedScore]) -> dict:
        """Combine scores from multiple timeframes"""
        
        weighted_sum = 0.0
        total_weight = 0.0
        directions = []
        
        for tf, score in tf_scores.items():
            weight = self.tf_weights.get(tf, 0.2)
            weighted_sum += score.final_score * weight
            total_weight += weight
            directions.append(score.direction)
        
        overall_score = weighted_sum / total_weight if total_weight > 0 else 0.5
        
        # Consensus: percentage of timeframes agreeing
        bullish_count = directions.count("BULLISH")
        bearish_count = directions.count("BEARISH")
        
        if bullish_count > bearish_count:
            overall_direction = "BULLISH"
            consensus = bullish_count / len(directions)
        elif bearish_count > bullish_count:
            overall_direction = "BEARISH"
            consensus = bearish_count / len(directions)
        else:
            overall_direction = "NEUTRAL"
            consensus = 0.5
        
        # Recommended action
        if overall_direction == "BULLISH" and overall_score >= 0.65 and consensus >= 0.6:
            action = "STRONG_BUY"
        elif overall_direction == "BULLISH" and overall_score >= 0.55:
            action = "BUY"
        elif overall_direction == "BEARISH" and overall_score <= 0.35 and consensus >= 0.6:
            action = "STRONG_SELL"
        elif overall_direction == "BEARISH" and overall_score <= 0.45:
            action = "SELL"
        else:
            action = "HOLD"
        
        # Risk level based on consensus
        if consensus >= 0.75:
            risk = "LOW"
        elif consensus >= 0.5:
            risk = "MEDIUM"
        else:
            risk = "HIGH"
        
        return {
            "score": overall_score,
            "direction": overall_direction,
            "consensus": consensus,
            "action": action,
            "risk": risk
        }
    
    def _passes_filter(self, result: ScanResult, rules: ScanRule) -> bool:
        """Apply filtering rules"""
        
        # Exclude neutrals if requested
        if rules.exclude_neutral and result.overall_direction == "NEUTRAL":
            return False
        
        # Check confidence threshold
        avg_confidence = np.mean([
            score.confidence
            for score in result.timeframe_scores.values()
        ])
        
        if avg_confidence < rules.min_confidence:
            return False
        
        # Aggressive mode: any TF exceeds threshold
        if rules.mode == "aggressive":
            for score in result.timeframe_scores.values():
                if (score.direction == "BULLISH" and score.final_score >= rules.any_tf_threshold) or \
                   (score.direction == "BEARISH" and score.final_score <= (1 - rules.any_tf_threshold)):
                    return True
            return False
        
        # Conservative mode: majority exceeds threshold
        else:
            qualifying_tfs = 0
            for score in result.timeframe_scores.values():
                if (score.direction == "BULLISH" and score.final_score >= rules.majority_tf_threshold) or \
                   (score.direction == "BEARISH" and score.final_score <= (1 - rules.majority_tf_threshold)):
                    qualifying_tfs += 1
            
            return qualifying_tfs >= len(result.timeframe_scores) / 2

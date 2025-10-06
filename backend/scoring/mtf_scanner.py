"""
Multi-Timeframe Scanner - Phase 4 Implementation
Scans multiple symbols across multiple timeframes with aggregation logic
"""

from typing import List, Dict, Optional, Literal
from dataclasses import dataclass, field
import asyncio
import numpy as np
import structlog

from backend.scoring.engine import DynamicScoringEngine, WeightConfig, CombinedScore
# from data.data_manager import DataManager

logger = structlog.get_logger()

@dataclass
class ScanRule:
    """Scanner filtering rules"""
    mode: Literal["aggressive", "conservative"] = "conservative"
    any_tf_threshold: float = 0.65  # Aggressive: trigger if ANY TF exceeds
    majority_tf_threshold: float = 0.60  # Conservative: need majority
    min_confidence: float = 0.5
    exclude_neutral: bool = True

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
    
    def __init__(
        self,
        data_aggregator,  # DataManager
        scoring_engine: DynamicScoringEngine,
        weights: WeightConfig
    ):
        self.data = data_aggregator
        self.engine = scoring_engine
        self.weights = weights
    
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
                ohlcv = await self.data.get_ohlcv(symbol, tf, limit=200)
                
                score = await self.engine.score(ohlcv)
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
    
    def _aggregate_timeframes(self, tf_scores: Dict[str, CombinedScore]) -> dict:
        """Combine scores from multiple timeframes"""
        
        # Weight by timeframe (higher TF = more weight)
        tf_weights = {
            "5m": 0.1,
            "15m": 0.15,
            "1h": 0.25,
            "4h": 0.3,
            "1d": 0.2
        }
        
        weighted_sum = 0.0
        total_weight = 0.0
        directions = []
        
        for tf, score in tf_scores.items():
            weight = tf_weights.get(tf, 0.2)
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
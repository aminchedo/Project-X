"""
Multi-Timeframe Scanner for market opportunities
"""

import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd

from ..api.models import ScanRequest, ScanResult, ScanRule, WeightConfig
from .engine import DynamicScoringEngine
from ..data.data_manager import data_manager

class MultiTimeframeScanner:
    """Scans multiple symbols across timeframes for trading opportunities"""
    
    def __init__(self, data_aggregator, scoring_engine: DynamicScoringEngine, default_weights: WeightConfig):
        self.data_aggregator = data_aggregator
        self.scoring_engine = scoring_engine
        self.default_weights = default_weights
    
    async def scan(self, symbols: List[str], timeframes: List[str], rules: Optional[ScanRule] = None) -> List[ScanResult]:
        """
        Scan symbols across timeframes for opportunities
        
        Args:
            symbols: List of symbols to scan
            timeframes: List of timeframes to analyze
            rules: Optional scan rules for filtering
            
        Returns:
            List of ScanResult objects sorted by overall score
        """
        if rules is None:
            rules = ScanRule()
        
        # Create tasks for parallel scanning
        scan_tasks = []
        for symbol in symbols:
            task = asyncio.create_task(self._scan_symbol(symbol, timeframes, rules))
            scan_tasks.append(task)
        
        # Wait for all scans to complete
        results = await asyncio.gather(*scan_tasks, return_exceptions=True)
        
        # Filter out exceptions and apply rules
        valid_results = []
        for result in results:
            if isinstance(result, Exception):
                continue  # Skip failed scans
            
            if self._passes_rules(result, rules):
                valid_results.append(result)
        
        # Sort by overall score (descending)
        valid_results.sort(key=lambda x: x.overall_score, reverse=True)
        
        return valid_results
    
    async def _scan_symbol(self, symbol: str, timeframes: List[str], rules: ScanRule) -> ScanResult:
        """Scan a single symbol across multiple timeframes"""
        timeframe_scores = {}
        all_scores = []
        all_directions = []
        all_confidences = []
        
        # Scan each timeframe
        for timeframe in timeframes:
            try:
                # Get OHLCV data
                ohlcv = await self.data_aggregator.get_ohlcv(symbol, timeframe, limit=200)
                
                if ohlcv is None or len(ohlcv) < 50:
                    continue  # Skip if insufficient data
                
                # Score the timeframe
                score_result = await self.scoring_engine.score(ohlcv)
                timeframe_scores[timeframe] = score_result
                
                # Collect data for overall calculation
                all_scores.append(score_result.final_score)
                all_directions.append(score_result.direction)
                all_confidences.append(score_result.confidence)
                
            except Exception as e:
                # Skip this timeframe if it fails
                continue
        
        if not timeframe_scores:
            # Return neutral result if no timeframes succeeded
            return ScanResult(
                symbol=symbol,
                overall_score=0.5,
                overall_direction="NEUTRAL",
                recommended_action="HOLD",
                risk_level="UNKNOWN",
                consensus_strength=0.0,
                timeframe_scores={}
            )
        
        # Calculate overall metrics
        overall_score = np.mean(all_scores) if all_scores else 0.5
        overall_direction = self._determine_overall_direction(all_directions)
        recommended_action = self._determine_action(overall_score, overall_direction)
        risk_level = self._assess_risk_level(overall_score, all_confidences)
        consensus_strength = self._calculate_consensus_strength(all_directions, all_confidences)
        
        return ScanResult(
            symbol=symbol,
            overall_score=overall_score,
            overall_direction=overall_direction,
            recommended_action=recommended_action,
            risk_level=risk_level,
            consensus_strength=consensus_strength,
            timeframe_scores=timeframe_scores
        )
    
    def _determine_overall_direction(self, directions: List[str]) -> str:
        """Determine overall direction from timeframe directions"""
        if not directions:
            return "NEUTRAL"
        
        bullish_count = directions.count("BULLISH")
        bearish_count = directions.count("BEARISH")
        neutral_count = directions.count("NEUTRAL")
        
        total = len(directions)
        
        if bullish_count / total > 0.6:
            return "BULLISH"
        elif bearish_count / total > 0.6:
            return "BEARISH"
        else:
            return "NEUTRAL"
    
    def _determine_action(self, score: float, direction: str) -> str:
        """Determine recommended action based on score and direction"""
        if direction == "BULLISH":
            if score > 0.75:
                return "STRONG_BUY"
            elif score > 0.6:
                return "BUY"
            else:
                return "WEAK_BUY"
        elif direction == "BEARISH":
            if score < 0.25:
                return "STRONG_SELL"
            elif score < 0.4:
                return "SELL"
            else:
                return "WEAK_SELL"
        else:  # NEUTRAL
            if score > 0.6:
                return "HOLD_BULLISH"
            elif score < 0.4:
                return "HOLD_BEARISH"
            else:
                return "HOLD"
    
    def _assess_risk_level(self, score: float, confidences: List[float]) -> str:
        """Assess risk level based on score and confidence"""
        if not confidences:
            return "MEDIUM"
        
        avg_confidence = np.mean(confidences)
        
        if avg_confidence > 0.8 and (score > 0.7 or score < 0.3):
            return "LOW"
        elif avg_confidence < 0.5 or (0.4 <= score <= 0.6):
            return "HIGH"
        else:
            return "MEDIUM"
    
    def _calculate_consensus_strength(self, directions: List[str], confidences: List[float]) -> float:
        """Calculate consensus strength across timeframes"""
        if not directions or not confidences:
            return 0.0
        
        # Count direction distribution
        direction_counts = {}
        for direction in directions:
            direction_counts[direction] = direction_counts.get(direction, 0) + 1
        
        # Calculate consensus (how many agree with the majority)
        total = len(directions)
        max_count = max(direction_counts.values())
        consensus_ratio = max_count / total
        
        # Weight by average confidence
        avg_confidence = np.mean(confidences)
        consensus_strength = consensus_ratio * avg_confidence
        
        return min(1.0, consensus_strength)
    
    def _passes_rules(self, result: ScanResult, rules: ScanRule) -> bool:
        """Check if result passes the scan rules"""
        # Check minimum score
        if result.overall_score < rules.min_score:
            return False
        
        # Check minimum confidence (using consensus strength as proxy)
        if result.consensus_strength < rules.min_confidence:
            return False
        
        # Check risk level
        risk_levels = {"LOW": 1, "MEDIUM": 2, "HIGH": 3}
        if risk_levels.get(result.risk_level, 2) > risk_levels.get(rules.max_risk_level, 2):
            return False
        
        # Check excluded symbols
        if result.symbol in rules.exclude_symbols:
            return False
        
        return True
    
    async def get_top_opportunities(self, symbols: List[str], timeframes: List[str], 
                                  rules: Optional[ScanRule] = None, limit: int = 10) -> List[ScanResult]:
        """Get top N opportunities from scan"""
        results = await self.scan(symbols, timeframes, rules)
        return results[:limit]
    
    async def scan_with_volume_filter(self, symbols: List[str], timeframes: List[str],
                                    min_volume_usd: float = 1000000) -> List[ScanResult]:
        """Scan with volume filtering"""
        # This would integrate with volume data in a real implementation
        # For now, just use regular scan
        return await self.scan(symbols, timeframes)
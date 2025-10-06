"""
Smart Money Concepts (SMC) Detection Module
Phase 3.3: Advanced Pattern Detectors

Detects Smart Money Concepts including BOS, CHOCH, Order Blocks, and Fair Value Gaps.
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
import numpy as np
import logging
from .harmonic import DetectionResult

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class OrderBlock:
    """Identified order block zone"""
    start_idx: int
    end_idx: int
    high: float
    low: float
    is_bullish: bool
    strength: float  # Based on volume and reaction

@dataclass
class FVG:
    """Fair Value Gap"""
    start_idx: int
    gap_high: float
    gap_low: float
    is_bullish: bool

class SMCDetector:
    """Smart Money Concepts - BOS, CHOCH, Order Blocks, FVG"""
    
    async def detect(self, ohlcv: List[Dict[str, Any]], context: Dict[str, Any] = None) -> DetectionResult:
        """
        Detect SMC structures
        
        Priority signals:
        1. Break of Structure (BOS) - strong continuation
        2. Change of Character (CHOCH) - potential reversal
        3. Order Blocks - institutional zones
        4. Fair Value Gaps - imbalance zones
        
        Args:
            ohlcv: List of OHLCV bars
            context: Additional context (volume, trend, etc.)
        
        Returns:
            DetectionResult with score [-1, +1] and SMC details
        """
        if context is None:
            context = {}
            
        try:
            if len(ohlcv) < 50:
                return DetectionResult(
                    score=0.0,
                    confidence=0.0,
                    direction="NEUTRAL",
                    meta={"error": "Insufficient data"}
                )
            
            # Detect structures
            bos = self._detect_bos(ohlcv)
            choch = self._detect_choch(ohlcv)
            order_blocks = self._detect_order_blocks(ohlcv)
            fvgs = self._detect_fvg(ohlcv)
            
            # Calculate proximity scores
            current_price = ohlcv[-1]['close']
            
            ob_score = self._score_order_block_proximity(order_blocks, current_price)
            fvg_score = self._score_fvg_proximity(fvgs, current_price)
            
            # Combine signals
            structure_score = 0.0
            confidence = 0.5
            
            if bos:
                structure_score += 0.7 if bos['is_bullish'] else -0.7
                confidence += 0.2
            
            if choch:
                structure_score += 0.5 if choch['is_bullish'] else -0.5
                confidence += 0.15
            
            # Weight by proximity to key zones
            final_score = (structure_score * 0.5 + ob_score * 0.3 + fvg_score * 0.2)
            
            direction = "BULLISH" if final_score > 0 else "BEARISH" if final_score < 0 else "NEUTRAL"
            
            return DetectionResult(
                score=float(np.clip(final_score, -1.0, 1.0)),
                confidence=float(np.clip(confidence, 0.0, 1.0)),
                direction=direction,
                meta={
                    "bos": bos is not None,
                    "choch": choch is not None,
                    "order_blocks_count": len(order_blocks),
                    "fvg_count": len(fvgs),
                    "nearest_ob": self._get_nearest_ob(order_blocks, current_price) if order_blocks else None,
                    "bos_details": bos,
                    "choch_details": choch
                }
            )
            
        except Exception as e:
            logger.error(f"Error in SMC detection: {e}")
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"error": str(e)}
            )
    
    def _detect_bos(self, ohlcv: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Detect Break of Structure - price breaks previous high/low with momentum"""
        try:
            lookback = min(20, len(ohlcv) - 1)
            
            highs = [bar['high'] for bar in ohlcv[-lookback:]]
            lows = [bar['low'] for bar in ohlcv[-lookback:]]
            
            recent_high = max(highs[:-3])
            recent_low = min(lows[:-3])
            
            current_close = ohlcv[-1]['close']
            prev_close = ohlcv[-2]['close']
            
            # Bullish BOS
            if current_close > recent_high and prev_close <= recent_high:
                return {
                    "is_bullish": True,
                    "break_level": recent_high,
                    "strength": (current_close - recent_high) / recent_high,
                    "type": "BOS"
                }
            
            # Bearish BOS
            if current_close < recent_low and prev_close >= recent_low:
                return {
                    "is_bullish": False,
                    "break_level": recent_low,
                    "strength": (recent_low - current_close) / recent_low,
                    "type": "BOS"
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error detecting BOS: {e}")
            return None
    
    def _detect_choch(self, ohlcv: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Detect Change of Character - trend exhaustion signal"""
        try:
            if len(ohlcv) < 30:
                return None
            
            # Look for failure to make new high/low
            lookback = 15
            
            highs = [bar['high'] for bar in ohlcv[-lookback:]]
            lows = [bar['low'] for bar in ohlcv[-lookback:]]
            
            # Check if recent bars failed to break previous extreme
            prev_high = max(highs[:-5])
            recent_high = max(highs[-5:])
            
            prev_low = min(lows[:-5])
            recent_low = min(lows[-5:])
            
            # Bullish CHOCH - failed to make new low
            if recent_low > prev_low:
                return {
                    "is_bullish": True, 
                    "type": "CHOCH",
                    "strength": (recent_low - prev_low) / prev_low
                }
            
            # Bearish CHOCH - failed to make new high
            if recent_high < prev_high:
                return {
                    "is_bullish": False, 
                    "type": "CHOCH",
                    "strength": (prev_high - recent_high) / prev_high
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error detecting CHOCH: {e}")
            return None
    
    def _detect_order_blocks(self, ohlcv: List[Dict[str, Any]]) -> List[OrderBlock]:
        """
        Detect Order Blocks - last down/up candle before strong move
        """
        try:
            order_blocks = []
            lookback = min(50, len(ohlcv))
            
            for i in range(lookback - 3, 0, -1):
                curr = ohlcv[i]
                next1 = ohlcv[i + 1]
                next2 = ohlcv[i + 2]
                
                # Bullish OB: down candle followed by strong up move
                if (curr['close'] < curr['open'] and  # Down candle
                    next1['close'] > next1['open'] and  # Up candle
                    next1['close'] > curr['high']):  # Breaks high
                    
                    move_size = (next1['close'] - next1['open']) / next1['open']
                    if move_size > 0.02:  # At least 2% move
                        order_blocks.append(OrderBlock(
                            start_idx=i,
                            end_idx=i,
                            high=curr['high'],
                            low=curr['low'],
                            is_bullish=True,
                            strength=move_size
                        ))
                
                # Bearish OB: up candle followed by strong down move
                elif (curr['close'] > curr['open'] and
                      next1['close'] < next1['open'] and
                      next1['close'] < curr['low']):
                    
                    move_size = (next1['open'] - next1['close']) / next1['open']
                    if move_size > 0.02:
                        order_blocks.append(OrderBlock(
                            start_idx=i,
                            end_idx=i,
                            high=curr['high'],
                            low=curr['low'],
                            is_bullish=False,
                            strength=move_size
                        ))
            
            # Keep only strongest OBs
            order_blocks.sort(key=lambda ob: ob.strength, reverse=True)
            return order_blocks[:5]
            
        except Exception as e:
            logger.error(f"Error detecting order blocks: {e}")
            return []
    
    def _detect_fvg(self, ohlcv: List[Dict[str, Any]]) -> List[FVG]:
        """
        Detect Fair Value Gaps - 3-candle imbalance
        """
        try:
            fvgs = []
            
            for i in range(len(ohlcv) - 3):
                candle1 = ohlcv[i]
                candle2 = ohlcv[i + 1]
                candle3 = ohlcv[i + 2]
                
                # Bullish FVG: gap between candle1 high and candle3 low
                if candle3['low'] > candle1['high']:
                    gap_size = (candle3['low'] - candle1['high']) / candle1['high']
                    if gap_size > 0.005:  # At least 0.5% gap
                        fvgs.append(FVG(
                            start_idx=i,
                            gap_high=candle3['low'],
                            gap_low=candle1['high'],
                            is_bullish=True
                        ))
                
                # Bearish FVG: gap between candle1 low and candle3 high
                elif candle3['high'] < candle1['low']:
                    gap_size = (candle1['low'] - candle3['high']) / candle3['high']
                    if gap_size > 0.005:
                        fvgs.append(FVG(
                            start_idx=i,
                            gap_high=candle1['low'],
                            gap_low=candle3['high'],
                            is_bullish=False
                        ))
            
            # Keep recent FVGs only
            return fvgs[-10:]
            
        except Exception as e:
            logger.error(f"Error detecting FVG: {e}")
            return []
    
    def _score_order_block_proximity(self, order_blocks: List[OrderBlock], current_price: float) -> float:
        """Score based on proximity to order blocks"""
        try:
            if not order_blocks:
                return 0.0
            
            nearest = min(
                order_blocks,
                key=lambda ob: min(
                    abs(current_price - ob.high),
                    abs(current_price - ob.low)
                )
            )
            
            distance = min(
                abs(current_price - nearest.high),
                abs(current_price - nearest.low)
            ) / current_price
            
            # Within 1% of OB
            if distance < 0.01:
                return 0.7 if nearest.is_bullish else -0.7
            elif distance < 0.03:
                return 0.4 if nearest.is_bullish else -0.4
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error scoring order block proximity: {e}")
            return 0.0
    
    def _score_fvg_proximity(self, fvgs: List[FVG], current_price: float) -> float:
        """Score based on FVG proximity"""
        try:
            if not fvgs:
                return 0.0
            
            for fvg in fvgs:
                # Price inside FVG
                if fvg.gap_low <= current_price <= fvg.gap_high:
                    return 0.5 if fvg.is_bullish else -0.5
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error scoring FVG proximity: {e}")
            return 0.0
    
    def _get_nearest_ob(self, order_blocks: List[OrderBlock], current_price: float) -> Optional[Dict[str, Any]]:
        """Get nearest order block details"""
        try:
            if not order_blocks:
                return None
            
            nearest = min(
                order_blocks,
                key=lambda ob: min(abs(current_price - ob.high), abs(current_price - ob.low))
            )
            
            return {
                "high": nearest.high,
                "low": nearest.low,
                "is_bullish": nearest.is_bullish,
                "distance_pct": min(
                    abs(current_price - nearest.high),
                    abs(current_price - nearest.low)
                ) / current_price * 100
            }
            
        except Exception as e:
            logger.error(f"Error getting nearest order block: {e}")
            return None

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from .base import BaseDetector, DetectionResult

class SMCDetector(BaseDetector):
    """Detects Smart Money Concepts patterns"""
    
    def __init__(self):
        super().__init__("smc")
    
    async def detect(self, ohlcv: pd.DataFrame, context: Dict[str, Any] = None) -> DetectionResult:
        """Detect SMC patterns in OHLCV data"""
        try:
            if len(ohlcv) < 30:
                return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": "Insufficient data"})
            
            # Get price data
            highs = ohlcv['high'].values
            lows = ohlcv['low'].values
            closes = ohlcv['close'].values
            volumes = ohlcv['volume'].values
            
            # Analyze recent data for SMC patterns
            recent_data = {
                'highs': highs[-30:],
                'lows': lows[-30:],
                'closes': closes[-30:],
                'volumes': volumes[-30:]
            }
            
            # Detect various SMC patterns
            order_blocks = self._detect_order_blocks(recent_data)
            liquidity_zones = self._detect_liquidity_zones(recent_data)
            market_structure = self._analyze_market_structure(recent_data)
            volume_profile = self._analyze_volume_profile(recent_data)
            
            # Combine all SMC signals
            smc_score = self._calculate_smc_score(
                order_blocks, liquidity_zones, market_structure, volume_profile
            )
            
            direction = self._determine_smc_direction(
                order_blocks, liquidity_zones, market_structure
            )
            
            confidence = self._calculate_confidence(smc_score, context)
            
            return DetectionResult(
                score=smc_score,
                direction=direction,
                confidence=confidence,
                meta={
                    "order_blocks": order_blocks,
                    "liquidity_zones": liquidity_zones,
                    "market_structure": market_structure,
                    "volume_profile": volume_profile
                }
            )
            
        except Exception as e:
            return DetectionResult(0.5, "NEUTRAL", 0.0, {"error": str(e)})
    
    def _detect_order_blocks(self, data: Dict[str, np.ndarray]) -> List[Dict[str, Any]]:
        """Detect order blocks (supply/demand zones)"""
        order_blocks = []
        highs = data['highs']
        lows = data['lows']
        closes = data['closes']
        volumes = data['volumes']
        
        # Look for significant moves followed by consolidation
        for i in range(5, len(closes) - 5):
            # Check for bullish order block
            if self._is_bullish_order_block(i, highs, lows, closes, volumes):
                order_blocks.append({
                    'type': 'bullish_order_block',
                    'start': i - 2,
                    'end': i + 2,
                    'strength': self._calculate_order_block_strength(i, highs, lows, volumes),
                    'price_level': (highs[i] + lows[i]) / 2
                })
            
            # Check for bearish order block
            elif self._is_bearish_order_block(i, highs, lows, closes, volumes):
                order_blocks.append({
                    'type': 'bearish_order_block',
                    'start': i - 2,
                    'end': i + 2,
                    'strength': self._calculate_order_block_strength(i, highs, lows, volumes),
                    'price_level': (highs[i] + lows[i]) / 2
                })
        
        return order_blocks[-3:]  # Return last 3 order blocks
    
    def _is_bullish_order_block(self, i: int, highs: np.ndarray, lows: np.ndarray, 
                               closes: np.ndarray, volumes: np.ndarray) -> bool:
        """Check if current position is a bullish order block"""
        # Look for strong bullish move followed by consolidation
        if i < 3 or i >= len(closes) - 3:
            return False
        
        # Check for strong bullish candle
        current_candle = closes[i] - closes[i-1]
        if current_candle <= 0:
            return False
        
        # Check for high volume
        avg_volume = np.mean(volumes[i-5:i])
        if volumes[i] < avg_volume * 1.2:
            return False
        
        # Check for consolidation after the move
        consolidation = True
        for j in range(i+1, min(i+4, len(closes))):
            if closes[j] < closes[i-1]:  # Price retraced below the move
                consolidation = False
                break
        
        return consolidation
    
    def _is_bearish_order_block(self, i: int, highs: np.ndarray, lows: np.ndarray,
                               closes: np.ndarray, volumes: np.ndarray) -> bool:
        """Check if current position is a bearish order block"""
        # Similar logic but for bearish moves
        if i < 3 or i >= len(closes) - 3:
            return False
        
        current_candle = closes[i] - closes[i-1]
        if current_candle >= 0:
            return False
        
        avg_volume = np.mean(volumes[i-5:i])
        if volumes[i] < avg_volume * 1.2:
            return False
        
        consolidation = True
        for j in range(i+1, min(i+4, len(closes))):
            if closes[j] > closes[i-1]:
                consolidation = False
                break
        
        return consolidation
    
    def _calculate_order_block_strength(self, i: int, highs: np.ndarray, lows: np.ndarray, 
                                       volumes: np.ndarray) -> float:
        """Calculate strength of order block"""
        # Based on volume, price movement, and consolidation
        volume_strength = min(1.0, volumes[i] / np.mean(volumes[i-5:i]))
        price_strength = abs(highs[i] - lows[i]) / np.mean(highs[i-5:i] - lows[i-5:i])
        
        return (volume_strength + price_strength) / 2
    
    def _detect_liquidity_zones(self, data: Dict[str, np.ndarray]) -> List[Dict[str, Any]]:
        """Detect liquidity zones (support/resistance)"""
        liquidity_zones = []
        highs = data['highs']
        lows = data['lows']
        closes = data['closes']
        
        # Find significant price levels
        price_levels = self._find_significant_levels(highs, lows, closes)
        
        for level in price_levels:
            # Check if level is still relevant
            recent_touches = self._count_recent_touches(level, highs, lows, closes)
            
            if recent_touches > 0:
                liquidity_zones.append({
                    'price_level': level,
                    'type': 'support' if level < closes[-1] else 'resistance',
                    'strength': min(1.0, recent_touches / 3),
                    'touches': recent_touches
                })
        
        return liquidity_zones
    
    def _find_significant_levels(self, highs: np.ndarray, lows: np.ndarray, 
                                closes: np.ndarray) -> List[float]:
        """Find significant price levels"""
        levels = []
        
        # Find pivot highs and lows
        for i in range(2, len(highs) - 2):
            # Pivot high
            if (highs[i] > highs[i-1] and highs[i] > highs[i+1] and
                highs[i] > highs[i-2] and highs[i] > highs[i+2]):
                levels.append(highs[i])
            
            # Pivot low
            if (lows[i] < lows[i-1] and lows[i] < lows[i+1] and
                lows[i] < lows[i-2] and lows[i] < lows[i+2]):
                levels.append(lows[i])
        
        # Group similar levels
        grouped_levels = self._group_similar_levels(levels)
        
        return grouped_levels
    
    def _group_similar_levels(self, levels: List[float], tolerance: float = 0.005) -> List[float]:
        """Group similar price levels together"""
        if not levels:
            return []
        
        levels.sort()
        grouped = [levels[0]]
        
        for level in levels[1:]:
            if level - grouped[-1] > tolerance * grouped[-1]:
                grouped.append(level)
        
        return grouped
    
    def _count_recent_touches(self, level: float, highs: np.ndarray, lows: np.ndarray, 
                             closes: np.ndarray, tolerance: float = 0.002) -> int:
        """Count recent touches of a price level"""
        touches = 0
        level_range = level * (1 + tolerance)
        level_min = level * (1 - tolerance)
        
        for i in range(len(highs)):
            if level_min <= highs[i] <= level_range or level_min <= lows[i] <= level_range:
                touches += 1
        
        return touches
    
    def _analyze_market_structure(self, data: Dict[str, np.ndarray]) -> Dict[str, Any]:
        """Analyze market structure (trend, break of structure, etc.)"""
        highs = data['highs']
        lows = data['lows']
        closes = data['closes']
        
        # Find recent swing highs and lows
        swing_highs = self._find_swing_highs(highs)
        swing_lows = self._find_swing_lows(lows)
        
        # Determine trend
        trend = self._determine_trend(swing_highs, swing_lows, closes)
        
        # Check for break of structure
        bos = self._check_break_of_structure(swing_highs, swing_lows, closes)
        
        return {
            'trend': trend,
            'break_of_structure': bos,
            'swing_highs': swing_highs[-3:],
            'swing_lows': swing_lows[-3:]
        }
    
    def _find_swing_highs(self, highs: np.ndarray, lookback: int = 3) -> List[int]:
        """Find swing high points"""
        swing_highs = []
        for i in range(lookback, len(highs) - lookback):
            if all(highs[i] > highs[i-j] for j in range(1, lookback+1)) and \
               all(highs[i] > highs[i+j] for j in range(1, lookback+1)):
                swing_highs.append(i)
        return swing_highs
    
    def _find_swing_lows(self, lows: np.ndarray, lookback: int = 3) -> List[int]:
        """Find swing low points"""
        swing_lows = []
        for i in range(lookback, len(lows) - lookback):
            if all(lows[i] < lows[i-j] for j in range(1, lookback+1)) and \
               all(lows[i] < lows[i+j] for j in range(1, lookback+1)):
                swing_lows.append(i)
        return swing_lows
    
    def _determine_trend(self, swing_highs: List[int], swing_lows: List[int], 
                        closes: np.ndarray) -> str:
        """Determine current trend"""
        if len(swing_highs) < 2 or len(swing_lows) < 2:
            return "sideways"
        
        # Check if higher highs and higher lows (uptrend)
        recent_highs = swing_highs[-2:]
        recent_lows = swing_lows[-2:]
        
        if (closes[recent_highs[-1]] > closes[recent_highs[-2]] and
            closes[recent_lows[-1]] > closes[recent_lows[-2]]):
            return "uptrend"
        
        # Check if lower highs and lower lows (downtrend)
        elif (closes[recent_highs[-1]] < closes[recent_highs[-2]] and
              closes[recent_lows[-1]] < closes[recent_lows[-2]]):
            return "downtrend"
        
        return "sideways"
    
    def _check_break_of_structure(self, swing_highs: List[int], swing_lows: List[int], 
                                 closes: np.ndarray) -> Dict[str, Any]:
        """Check for break of structure"""
        if len(swing_highs) < 2 or len(swing_lows) < 2:
            return {'bullish': False, 'bearish': False}
        
        recent_high = closes[swing_highs[-1]]
        previous_high = closes[swing_highs[-2]]
        recent_low = closes[swing_lows[-1]]
        previous_low = closes[swing_lows[-2]]
        
        # Bullish break of structure
        bullish_bos = recent_high > previous_high
        
        # Bearish break of structure
        bearish_bos = recent_low < previous_low
        
        return {
            'bullish': bullish_bos,
            'bearish': bearish_bos
        }
    
    def _analyze_volume_profile(self, data: Dict[str, np.ndarray]) -> Dict[str, Any]:
        """Analyze volume profile for SMC insights"""
        volumes = data['volumes']
        closes = data['closes']
        
        # Calculate volume-weighted average price
        vwap = np.sum(volumes * closes) / np.sum(volumes)
        
        # Analyze volume distribution
        volume_above_vwap = np.sum(volumes[closes > vwap])
        volume_below_vwap = np.sum(volumes[closes < vwap])
        
        # Calculate volume imbalance
        volume_imbalance = (volume_above_vwap - volume_below_vwap) / (volume_above_vwap + volume_below_vwap)
        
        return {
            'vwap': vwap,
            'volume_imbalance': volume_imbalance,
            'current_price_vs_vwap': closes[-1] / vwap - 1
        }
    
    def _calculate_smc_score(self, order_blocks: List[Dict], liquidity_zones: List[Dict],
                           market_structure: Dict, volume_profile: Dict) -> float:
        """Calculate overall SMC score"""
        score = 0.5  # Base score
        
        # Order blocks contribution
        if order_blocks:
            avg_ob_strength = np.mean([ob['strength'] for ob in order_blocks])
            score += avg_ob_strength * 0.2
        
        # Liquidity zones contribution
        if liquidity_zones:
            avg_lz_strength = np.mean([lz['strength'] for lz in liquidity_zones])
            score += avg_lz_strength * 0.2
        
        # Market structure contribution
        if market_structure.get('trend') == 'uptrend':
            score += 0.1
        elif market_structure.get('trend') == 'downtrend':
            score -= 0.1
        
        # Volume profile contribution
        volume_imbalance = volume_profile.get('volume_imbalance', 0)
        score += volume_imbalance * 0.1
        
        return max(0, min(1, score))
    
    def _determine_smc_direction(self, order_blocks: List[Dict], liquidity_zones: List[Dict],
                               market_structure: Dict) -> str:
        """Determine SMC-based direction"""
        bullish_signals = 0
        bearish_signals = 0
        
        # Order blocks
        for ob in order_blocks:
            if ob['type'] == 'bullish_order_block':
                bullish_signals += 1
            elif ob['type'] == 'bearish_order_block':
                bearish_signals += 1
        
        # Market structure
        trend = market_structure.get('trend', 'sideways')
        if trend == 'uptrend':
            bullish_signals += 1
        elif trend == 'downtrend':
            bearish_signals += 1
        
        # Break of structure
        bos = market_structure.get('break_of_structure', {})
        if bos.get('bullish'):
            bullish_signals += 1
        if bos.get('bearish'):
            bearish_signals += 1
        
        if bullish_signals > bearish_signals:
            return "BULLISH"
        elif bearish_signals > bullish_signals:
            return "BEARISH"
        else:
            return "NEUTRAL"

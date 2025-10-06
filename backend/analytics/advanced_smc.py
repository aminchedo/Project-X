import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

@dataclass
class OrderBlock:
    price_level: float
    strength: float
    timestamp: datetime
    block_type: str  # 'bullish' or 'bearish'
    volume: float
    validated: bool = False

@dataclass
class LiquidityZone:
    high: float
    low: float
    strength: float
    sweep_count: int
    last_sweep: datetime
    zone_type: str  # 'buy_side' or 'sell_side'

@dataclass
class FairValueGap:
    high: float
    low: float
    gap_type: str  # 'bullish' or 'bearish'
    timestamp: datetime
    filled_percentage: float = 0.0
    mitigation_level: float = 0.0

class AdvancedSMCAnalyzer:
    def __init__(self):
        self.order_blocks: List[OrderBlock] = []
        self.liquidity_zones: List[LiquidityZone] = []
        self.fair_value_gaps: List[FairValueGap] = []
        self.market_structure = "NEUTRAL"
        self.institutional_flow = "NEUTRAL"
    
    def analyze_comprehensive_smc(self, ohlcv_data: pd.DataFrame, volume_profile: pd.DataFrame = None) -> Dict:
        """Complete SMC analysis with all components"""
        
        # 1. Market Structure Analysis
        market_structure = self._analyze_market_structure(ohlcv_data)
        
        # 2. Advanced Order Block Detection
        order_blocks = self._detect_advanced_order_blocks(ohlcv_data)
        
        # 3. Liquidity Analysis
        liquidity_analysis = self._analyze_liquidity_zones(ohlcv_data)
        
        # 4. Fair Value Gap Detection
        fvg_analysis = self._analyze_fair_value_gaps(ohlcv_data)
        
        # 5. Institutional Flow Analysis
        institutional_flow = self._analyze_institutional_flow(ohlcv_data)
        
        # 6. Premium/Discount Analysis
        premium_discount = self._analyze_premium_discount(ohlcv_data)
        
        # 7. Calculate comprehensive SMC score
        smc_score = self._calculate_advanced_smc_score(
            market_structure, order_blocks, liquidity_analysis, 
            fvg_analysis, institutional_flow, premium_discount
        )
        
        return {
            'score': smc_score,
            'market_structure': market_structure,
            'order_blocks': order_blocks,
            'liquidity_analysis': liquidity_analysis,
            'fair_value_gaps': fvg_analysis,
            'institutional_flow': institutional_flow,
            'premium_discount': premium_discount,
            'signal_strength': self._determine_signal_strength(smc_score),
            'key_levels': self._extract_key_levels(),
            'trade_direction': self._determine_trade_direction(smc_score, market_structure)
        }
    
    def _analyze_market_structure(self, df: pd.DataFrame) -> Dict:
        """Analyze market structure - HH, HL, LH, LL patterns"""
        
        # Find swing highs and lows
        swing_highs = self._find_swing_points(df['high'], order=5, point_type='high')
        swing_lows = self._find_swing_points(df['low'], order=5, point_type='low')
        
        # Determine trend structure
        structure_type = "NEUTRAL"
        structure_strength = 0.5
        
        if len(swing_highs) >= 2 and len(swing_lows) >= 2:
            # Check for Higher Highs and Higher Lows (Uptrend)
            recent_highs = swing_highs[-2:]
            recent_lows = swing_lows[-2:]
            
            hh = recent_highs[1]['value'] > recent_highs[0]['value']
            hl = recent_lows[1]['value'] > recent_lows[0]['value']
            
            # Check for Lower Highs and Lower Lows (Downtrend)
            lh = recent_highs[1]['value'] < recent_highs[0]['value']
            ll = recent_lows[1]['value'] < recent_lows[0]['value']
            
            if hh and hl:
                structure_type = "BULLISH"
                structure_strength = 0.8
            elif lh and ll:
                structure_type = "BEARISH"
                structure_strength = 0.8
            elif hh and ll:
                structure_type = "RANGING_BULLISH"
                structure_strength = 0.6
            elif lh and hl:
                structure_type = "RANGING_BEARISH"
                structure_strength = 0.6
        
        # Calculate break of structure (BOS) and change of character (CHoCH)
        bos_signals = self._detect_bos_choch(swing_highs, swing_lows)
        
        return {
            'type': structure_type,
            'strength': structure_strength,
            'swing_highs': swing_highs[-3:],  # Last 3 swing highs
            'swing_lows': swing_lows[-3:],    # Last 3 swing lows
            'bos_signals': bos_signals,
            'trend_confirmation': structure_strength > 0.7
        }
    
    def _detect_advanced_order_blocks(self, df: pd.DataFrame) -> Dict:
        """Detect institutional order blocks with validation"""
        
        order_blocks = []
        
        for i in range(5, len(df) - 1):
            current = df.iloc[i]
            
            # Check for bearish order block
            if self._is_bearish_order_block(df, i):
                ob = OrderBlock(
                    price_level=current['high'],
                    strength=self._calculate_ob_strength(df, i, 'bearish'),
                    timestamp=current.name,
                    block_type='bearish',
                    volume=current['volume'],
                    validated=self._validate_order_block(df, i, 'bearish')
                )
                order_blocks.append(ob)
            
            # Check for bullish order block
            elif self._is_bullish_order_block(df, i):
                ob = OrderBlock(
                    price_level=current['low'],
                    strength=self._calculate_ob_strength(df, i, 'bullish'),
                    timestamp=current.name,
                    block_type='bullish',
                    volume=current['volume'],
                    validated=self._validate_order_block(df, i, 'bullish')
                )
                order_blocks.append(ob)
        
        # Filter and rank order blocks
        validated_obs = [ob for ob in order_blocks if ob.validated]
        ranked_obs = sorted(validated_obs, key=lambda x: x.strength, reverse=True)
        
        return {
            'order_blocks': ranked_obs[:5],  # Top 5 order blocks
            'total_count': len(order_blocks),
            'validated_count': len(validated_obs),
            'bullish_count': len([ob for ob in validated_obs if ob.block_type == 'bullish']),
            'bearish_count': len([ob for ob in validated_obs if ob.block_type == 'bearish']),
            'average_strength': np.mean([ob.strength for ob in validated_obs]) if validated_obs else 0
        }
    
    def _analyze_liquidity_zones(self, df: pd.DataFrame) -> Dict:
        """Analyze liquidity pools and sweeps"""
        
        # Find Equal Highs (EQH) and Equal Lows (EQL)
        eqh_levels = self._find_equal_highs(df)
        eql_levels = self._find_equal_lows(df)
        
        # Detect liquidity sweeps
        buy_side_sweeps = self._detect_liquidity_sweeps(df, eqh_levels, 'buy_side')
        sell_side_sweeps = self._detect_liquidity_sweeps(df, eql_levels, 'sell_side')
        
        # Build liquidity zones
        liquidity_zones = []
        
        for level in eqh_levels:
            zone = LiquidityZone(
                high=level['high'] * 1.001,  # 0.1% buffer
                low=level['high'] * 0.999,
                strength=level['strength'],
                sweep_count=level['sweep_count'],
                last_sweep=level['last_sweep'],
                zone_type='buy_side'
            )
            liquidity_zones.append(zone)
        
        for level in eql_levels:
            zone = LiquidityZone(
                high=level['low'] * 1.001,
                low=level['low'] * 0.999,
                strength=level['strength'],
                sweep_count=level['sweep_count'],
                last_sweep=level['last_sweep'],
                zone_type='sell_side'
            )
            liquidity_zones.append(zone)
        
        return {
            'liquidity_zones': liquidity_zones,
            'buy_side_sweeps': buy_side_sweeps,
            'sell_side_sweeps': sell_side_sweeps,
            'liquidity_bias': self._calculate_liquidity_bias(buy_side_sweeps, sell_side_sweeps),
            'sweep_efficiency': self._calculate_sweep_efficiency(buy_side_sweeps, sell_side_sweeps)
        }
    
    def _analyze_fair_value_gaps(self, df: pd.DataFrame) -> Dict:
        """Advanced FVG analysis with mitigation tracking"""
        
        fvgs = []
        
        for i in range(1, len(df) - 1):
            # Bullish FVG: Gap between candle lows
            if df.iloc[i+1]['low'] > df.iloc[i-1]['high']:
                fvg = FairValueGap(
                    high=df.iloc[i+1]['low'],
                    low=df.iloc[i-1]['high'],
                    gap_type='bullish',
                    timestamp=df.iloc[i].name
                )
                # Calculate mitigation
                fvg.filled_percentage = self._calculate_fvg_mitigation(df, fvg, i+1)
                fvgs.append(fvg)
            
            # Bearish FVG: Gap between candle highs
            elif df.iloc[i+1]['high'] < df.iloc[i-1]['low']:
                fvg = FairValueGap(
                    high=df.iloc[i-1]['low'],
                    low=df.iloc[i+1]['high'],
                    gap_type='bearish',
                    timestamp=df.iloc[i].name
                )
                # Calculate mitigation
                fvg.filled_percentage = self._calculate_fvg_mitigation(df, fvg, i+1)
                fvgs.append(fvg)
        
        # Filter recent and significant FVGs
        recent_fvgs = [fvg for fvg in fvgs if fvg.filled_percentage < 0.5]
        
        return {
            'fair_value_gaps': recent_fvgs[-10:],  # Last 10 FVGs
            'total_fvgs': len(fvgs),
            'unfilled_fvgs': len(recent_fvgs),
            'bullish_fvgs': len([fvg for fvg in recent_fvgs if fvg.gap_type == 'bullish']),
            'bearish_fvgs': len([fvg for fvg in recent_fvgs if fvg.gap_type == 'bearish']),
            'fvg_bias': self._calculate_fvg_bias(recent_fvgs)
        }
    
    def _analyze_institutional_flow(self, df: pd.DataFrame) -> Dict:
        """Analyze institutional order flow patterns"""
        
        # Volume analysis
        volume_profile = self._calculate_volume_profile(df)
        
        # Large candle analysis (institutional involvement)
        large_candles = self._identify_large_candles(df)
        
        # Absorption patterns
        absorption_signals = self._detect_absorption_patterns(df)
        
        # Smart money divergence
        divergence_signals = self._detect_smart_money_divergence(df)
        
        flow_score = self._calculate_institutional_flow_score(
            volume_profile, large_candles, absorption_signals, divergence_signals
        )
        
        return {
            'flow_score': flow_score,
            'volume_profile': volume_profile,
            'large_candles': large_candles[-5:],
            'absorption_patterns': absorption_signals,
            'divergence_signals': divergence_signals,
            'institutional_bias': 'BULLISH' if flow_score > 0.6 else 'BEARISH' if flow_score < 0.4 else 'NEUTRAL'
        }
    
    def _analyze_premium_discount(self, df: pd.DataFrame) -> Dict:
        """Analyze premium/discount zones using Fibonacci levels"""
        
        # Find significant swing high and low for Fibonacci calculation
        lookback = min(50, len(df))
        recent_data = df.tail(lookback)
        
        swing_high = recent_data['high'].max()
        swing_low = recent_data['low'].min()
        current_price = df['close'].iloc[-1]
        
        # Calculate Fibonacci levels
        fib_range = swing_high - swing_low
        fib_levels = {
            '0.0': swing_low,
            '0.236': swing_low + (fib_range * 0.236),
            '0.382': swing_low + (fib_range * 0.382),
            '0.5': swing_low + (fib_range * 0.5),
            '0.618': swing_low + (fib_range * 0.618),
            '0.786': swing_low + (fib_range * 0.786),
            '1.0': swing_high
        }
        
        # Determine current zone
        current_fib_level = self._get_current_fib_level(current_price, fib_levels)
        
        # Premium = above 0.5, Discount = below 0.5
        is_premium = current_fib_level > 0.5
        is_discount = current_fib_level < 0.5
        
        return {
            'current_level': current_fib_level,
            'is_premium': is_premium,
            'is_discount': is_discount,
            'fib_levels': fib_levels,
            'zone_strength': abs(current_fib_level - 0.5) * 2,  # 0-1 scale
            'recommended_action': 'SELL' if is_premium else 'BUY' if is_discount else 'HOLD'
        }
    
    # Helper methods implementation
    def _find_swing_points(self, series: pd.Series, order: int, point_type: str) -> List[Dict]:
        """Find swing highs or lows"""
        points = []
        for i in range(order, len(series) - order):
            if point_type == 'high':
                is_swing = all(series.iloc[i] >= series.iloc[i-j] for j in range(1, order+1)) and \
                          all(series.iloc[i] >= series.iloc[i+j] for j in range(1, order+1))
                if is_swing:
                    points.append({
                        'index': i,
                        'value': series.iloc[i],
                        'timestamp': series.index[i]
                    })
            else:  # low
                is_swing = all(series.iloc[i] <= series.iloc[i-j] for j in range(1, order+1)) and \
                          all(series.iloc[i] <= series.iloc[i+j] for j in range(1, order+1))
                if is_swing:
                    points.append({
                        'index': i,
                        'value': series.iloc[i],
                        'timestamp': series.index[i]
                    })
        return points
    
    def _detect_bos_choch(self, highs: List, lows: List) -> Dict:
        """Detect Break of Structure and Change of Character"""
        bos_signals = []
        choch_signals = []
        
        if len(highs) >= 2 and len(lows) >= 2:
            # Simple BOS detection - break of previous high/low
            last_high = highs[-1]['value']
            prev_high = highs[-2]['value']
            last_low = lows[-1]['value']
            prev_low = lows[-2]['value']
            
            if last_high > prev_high:
                bos_signals.append({
                    'type': 'bullish_bos',
                    'level': prev_high,
                    'timestamp': highs[-1]['timestamp']
                })
            
            if last_low < prev_low:
                bos_signals.append({
                    'type': 'bearish_bos',
                    'level': prev_low,
                    'timestamp': lows[-1]['timestamp']
                })
        
        return {
            'bos_signals': bos_signals,
            'choch_signals': choch_signals,
            'has_recent_bos': len(bos_signals) > 0
        }
    
    def _is_bearish_order_block(self, df: pd.DataFrame, i: int) -> bool:
        """Check if candle is a bearish order block"""
        current = df.iloc[i]
        
        # Large bearish candle with high volume
        body_size = abs(current['close'] - current['open'])
        avg_body = df['close'].iloc[i-10:i].sub(df['open'].iloc[i-10:i]).abs().mean()
        
        is_bearish = current['close'] < current['open']
        is_large = body_size > avg_body * 1.5
        has_volume = current['volume'] > df['volume'].iloc[i-10:i].mean() * 1.2
        
        # Check for subsequent downward movement
        subsequent_low = df['low'].iloc[i+1:i+6].min() if i+6 < len(df) else current['low']
        has_followthrough = subsequent_low < current['low']
        
        return is_bearish and is_large and has_volume and has_followthrough
    
    def _is_bullish_order_block(self, df: pd.DataFrame, i: int) -> bool:
        """Check if candle is a bullish order block"""
        current = df.iloc[i]
        
        # Large bullish candle with high volume
        body_size = abs(current['close'] - current['open'])
        avg_body = df['close'].iloc[i-10:i].sub(df['open'].iloc[i-10:i]).abs().mean()
        
        is_bullish = current['close'] > current['open']
        is_large = body_size > avg_body * 1.5
        has_volume = current['volume'] > df['volume'].iloc[i-10:i].mean() * 1.2
        
        # Check for subsequent upward movement
        subsequent_high = df['high'].iloc[i+1:i+6].max() if i+6 < len(df) else current['high']
        has_followthrough = subsequent_high > current['high']
        
        return is_bullish and is_large and has_volume and has_followthrough
    
    def _calculate_ob_strength(self, df: pd.DataFrame, i: int, ob_type: str) -> float:
        """Calculate order block strength (0-1)"""
        current = df.iloc[i]
        
        # Volume strength
        avg_volume = df['volume'].iloc[i-20:i].mean()
        volume_strength = min(current['volume'] / avg_volume, 3.0) / 3.0
        
        # Size strength
        body_size = abs(current['close'] - current['open'])
        avg_range = (df['high'].iloc[i-20:i] - df['low'].iloc[i-20:i]).mean()
        size_strength = min(body_size / avg_range, 2.0) / 2.0
        
        # Follow-through strength
        if ob_type == 'bullish':
            subsequent_move = df['high'].iloc[i+1:i+10].max() - current['high'] if i+10 < len(df) else 0
        else:
            subsequent_move = current['low'] - df['low'].iloc[i+1:i+10].min() if i+10 < len(df) else 0
        
        followthrough_strength = min(subsequent_move / avg_range, 1.0) if avg_range > 0 else 0
        
        return (volume_strength * 0.4 + size_strength * 0.3 + followthrough_strength * 0.3)
    
    def _validate_order_block(self, df: pd.DataFrame, i: int, ob_type: str) -> bool:
        """Validate order block with additional criteria"""
        # Simple validation - check if price respected the level later
        current = df.iloc[i]
        future_data = df.iloc[i+1:i+20] if i+20 < len(df) else df.iloc[i+1:]
        
        if len(future_data) == 0:
            return False
        
        if ob_type == 'bullish':
            # Check if price came back to test the low and bounced
            touched_level = future_data['low'].min() <= current['low'] * 1.001
            bounced = future_data['close'].iloc[-1] > current['low'] if len(future_data) > 0 else False
            return touched_level and bounced
        else:
            # Check if price came back to test the high and rejected
            touched_level = future_data['high'].max() >= current['high'] * 0.999
            rejected = future_data['close'].iloc[-1] < current['high'] if len(future_data) > 0 else False
            return touched_level and rejected
    
    def _find_equal_highs(self, df: pd.DataFrame, tolerance: float = 0.001) -> List[Dict]:
        """Find equal highs for liquidity analysis"""
        swing_highs = self._find_swing_points(df['high'], order=3, point_type='high')
        equal_highs = []
        
        for i, high1 in enumerate(swing_highs):
            equal_count = 1
            last_sweep = high1['timestamp']
            
            for high2 in swing_highs[i+1:]:
                if abs(high1['value'] - high2['value']) / high1['value'] <= tolerance:
                    equal_count += 1
                    last_sweep = max(last_sweep, high2['timestamp'])
            
            if equal_count >= 2:
                equal_highs.append({
                    'high': high1['value'],
                    'strength': min(equal_count / 5.0, 1.0),
                    'sweep_count': equal_count,
                    'last_sweep': last_sweep
                })
        
        return equal_highs
    
    def _find_equal_lows(self, df: pd.DataFrame, tolerance: float = 0.001) -> List[Dict]:
        """Find equal lows for liquidity analysis"""
        swing_lows = self._find_swing_points(df['low'], order=3, point_type='low')
        equal_lows = []
        
        for i, low1 in enumerate(swing_lows):
            equal_count = 1
            last_sweep = low1['timestamp']
            
            for low2 in swing_lows[i+1:]:
                if abs(low1['value'] - low2['value']) / low1['value'] <= tolerance:
                    equal_count += 1
                    last_sweep = max(last_sweep, low2['timestamp'])
            
            if equal_count >= 2:
                equal_lows.append({
                    'low': low1['value'],
                    'strength': min(equal_count / 5.0, 1.0),
                    'sweep_count': equal_count,
                    'last_sweep': last_sweep
                })
        
        return equal_lows
    
    def _detect_liquidity_sweeps(self, df: pd.DataFrame, levels: List[Dict], sweep_type: str) -> List[Dict]:
        """Detect liquidity sweeps"""
        sweeps = []
        
        for level in levels:
            if sweep_type == 'buy_side':
                # Look for sweeps above the high
                sweep_candles = df[df['high'] > level['high']]
            else:
                # Look for sweeps below the low
                sweep_candles = df[df['low'] < level['low']]
            
            if len(sweep_candles) > 0:
                sweeps.append({
                    'level': level,
                    'sweep_times': sweep_candles.index.tolist(),
                    'sweep_type': sweep_type,
                    'efficiency': len(sweep_candles) / len(df)
                })
        
        return sweeps
    
    def _calculate_liquidity_bias(self, buy_sweeps: List, sell_sweeps: List) -> str:
        """Calculate overall liquidity bias"""
        buy_efficiency = sum([s['efficiency'] for s in buy_sweeps]) if buy_sweeps else 0
        sell_efficiency = sum([s['efficiency'] for s in sell_sweeps]) if sell_sweeps else 0
        
        if buy_efficiency > sell_efficiency * 1.2:
            return 'BULLISH'
        elif sell_efficiency > buy_efficiency * 1.2:
            return 'BEARISH'
        else:
            return 'NEUTRAL'
    
    def _calculate_sweep_efficiency(self, buy_sweeps: List, sell_sweeps: List) -> float:
        """Calculate overall sweep efficiency"""
        total_sweeps = len(buy_sweeps) + len(sell_sweeps)
        if total_sweeps == 0:
            return 0.0
        
        total_efficiency = sum([s['efficiency'] for s in buy_sweeps + sell_sweeps])
        return total_efficiency / total_sweeps
    
    def _calculate_fvg_mitigation(self, df: pd.DataFrame, fvg: FairValueGap, start_idx: int) -> float:
        """Calculate how much of the FVG has been filled"""
        future_data = df.iloc[start_idx:]
        
        if len(future_data) == 0:
            return 0.0
        
        gap_size = fvg.high - fvg.low
        
        if fvg.gap_type == 'bullish':
            # Check how much price has retraced into the gap
            lowest_retrace = future_data['low'].min()
            if lowest_retrace >= fvg.high:
                return 0.0  # No mitigation
            elif lowest_retrace <= fvg.low:
                return 1.0  # Full mitigation
            else:
                return (fvg.high - lowest_retrace) / gap_size
        else:
            # Bearish FVG
            highest_retrace = future_data['high'].max()
            if highest_retrace <= fvg.low:
                return 0.0  # No mitigation
            elif highest_retrace >= fvg.high:
                return 1.0  # Full mitigation
            else:
                return (highest_retrace - fvg.low) / gap_size
    
    def _calculate_fvg_bias(self, fvgs: List[FairValueGap]) -> str:
        """Calculate FVG bias"""
        if not fvgs:
            return 'NEUTRAL'
        
        bullish_count = len([fvg for fvg in fvgs if fvg.gap_type == 'bullish'])
        bearish_count = len([fvg for fvg in fvgs if fvg.gap_type == 'bearish'])
        
        if bullish_count > bearish_count * 1.5:
            return 'BULLISH'
        elif bearish_count > bullish_count * 1.5:
            return 'BEARISH'
        else:
            return 'NEUTRAL'
    
    def _calculate_volume_profile(self, df: pd.DataFrame) -> Dict:
        """Calculate volume profile analysis"""
        # Simple volume profile
        price_levels = np.linspace(df['low'].min(), df['high'].max(), 20)
        volume_at_price = []
        
        for i in range(len(price_levels) - 1):
            level_volume = df[
                (df['low'] <= price_levels[i+1]) & 
                (df['high'] >= price_levels[i])
            ]['volume'].sum()
            volume_at_price.append(level_volume)
        
        max_volume_idx = np.argmax(volume_at_price)
        poc = (price_levels[max_volume_idx] + price_levels[max_volume_idx + 1]) / 2
        
        return {
            'point_of_control': poc,
            'high_volume_node': max(volume_at_price),
            'value_area_high': price_levels[max_volume_idx + 2] if max_volume_idx + 2 < len(price_levels) else price_levels[-1],
            'value_area_low': price_levels[max_volume_idx - 2] if max_volume_idx - 2 >= 0 else price_levels[0]
        }
    
    def _identify_large_candles(self, df: pd.DataFrame) -> List[Dict]:
        """Identify large institutional candles"""
        avg_range = (df['high'] - df['low']).rolling(20).mean()
        avg_volume = df['volume'].rolling(20).mean()
        
        large_candles = []
        
        for i in range(20, len(df)):
            current_range = df.iloc[i]['high'] - df.iloc[i]['low']
            current_volume = df.iloc[i]['volume']
            
            if (current_range > avg_range.iloc[i] * 2.0 and 
                current_volume > avg_volume.iloc[i] * 1.5):
                
                large_candles.append({
                    'index': i,
                    'timestamp': df.index[i],
                    'range_ratio': current_range / avg_range.iloc[i],
                    'volume_ratio': current_volume / avg_volume.iloc[i],
                    'direction': 'bullish' if df.iloc[i]['close'] > df.iloc[i]['open'] else 'bearish'
                })
        
        return large_candles
    
    def _detect_absorption_patterns(self, df: pd.DataFrame) -> List[Dict]:
        """Detect volume absorption patterns"""
        patterns = []
        
        for i in range(5, len(df) - 1):
            current = df.iloc[i]
            prev_volumes = df['volume'].iloc[i-5:i].values
            
            # High volume with small price movement (absorption)
            price_change = abs(current['close'] - current['open']) / current['open']
            volume_percentile = np.percentile(prev_volumes, 80)
            
            if current['volume'] > volume_percentile and price_change < 0.01:
                patterns.append({
                    'timestamp': current.name,
                    'type': 'absorption',
                    'volume_ratio': current['volume'] / np.mean(prev_volumes),
                    'price_change': price_change
                })
        
        return patterns
    
    def _detect_smart_money_divergence(self, df: pd.DataFrame) -> List[Dict]:
        """Detect smart money divergence patterns"""
        divergences = []
        
        # Price vs Volume divergence
        price_trend = df['close'].rolling(10).apply(lambda x: 1 if x.iloc[-1] > x.iloc[0] else -1)
        volume_trend = df['volume'].rolling(10).apply(lambda x: 1 if x.iloc[-1] > x.iloc[0] else -1)
        
        for i in range(10, len(df)):
            if price_trend.iloc[i] != volume_trend.iloc[i]:
                divergences.append({
                    'timestamp': df.index[i],
                    'type': 'price_volume_divergence',
                    'price_direction': 'up' if price_trend.iloc[i] > 0 else 'down',
                    'volume_direction': 'up' if volume_trend.iloc[i] > 0 else 'down'
                })
        
        return divergences
    
    def _calculate_institutional_flow_score(self, volume_profile: Dict, large_candles: List, 
                                          absorption_signals: List, divergence_signals: List) -> float:
        """Calculate institutional flow score"""
        
        # Volume profile score
        vp_score = 0.5  # Neutral baseline
        
        # Large candles score
        bullish_large = len([c for c in large_candles if c['direction'] == 'bullish'])
        bearish_large = len([c for c in large_candles if c['direction'] == 'bearish'])
        
        if bullish_large + bearish_large > 0:
            large_candle_score = bullish_large / (bullish_large + bearish_large)
        else:
            large_candle_score = 0.5
        
        # Absorption score (neutral)
        absorption_score = 0.5
        
        # Divergence score (bearish signal)
        divergence_score = max(0, 0.5 - len(divergence_signals) * 0.1)
        
        # Weighted combination
        flow_score = (vp_score * 0.3 + large_candle_score * 0.4 + 
                     absorption_score * 0.2 + divergence_score * 0.1)
        
        return max(0, min(1, flow_score))
    
    def _get_current_fib_level(self, current_price: float, fib_levels: Dict) -> float:
        """Get current Fibonacci retracement level"""
        fib_values = list(fib_levels.values())
        fib_keys = [float(k) for k in fib_levels.keys()]
        
        for i in range(len(fib_values) - 1):
            if fib_values[i] <= current_price <= fib_values[i + 1]:
                # Interpolate between levels
                lower_price, upper_price = fib_values[i], fib_values[i + 1]
                lower_level, upper_level = fib_keys[i], fib_keys[i + 1]
                
                ratio = (current_price - lower_price) / (upper_price - lower_price)
                return lower_level + (upper_level - lower_level) * ratio
        
        # Outside range
        if current_price < fib_values[0]:
            return 0.0
        elif current_price > fib_values[-1]:
            return 1.0
        else:
            return 0.5
    
    def _calculate_advanced_smc_score(self, market_structure: Dict, order_blocks: Dict, 
                                    liquidity_analysis: Dict, fvg_analysis: Dict,
                                    institutional_flow: Dict, premium_discount: Dict) -> float:
        """Calculate comprehensive SMC score (0-1)"""
        
        # Market structure score
        structure_score = market_structure['strength']
        if market_structure['type'] in ['BULLISH', 'RANGING_BULLISH']:
            structure_score *= 1.2
        elif market_structure['type'] in ['BEARISH', 'RANGING_BEARISH']:
            structure_score *= 0.8
        
        # Order blocks score
        ob_score = 0.5
        if order_blocks['validated_count'] > 0:
            bullish_ratio = order_blocks['bullish_count'] / order_blocks['validated_count']
            ob_score = bullish_ratio
        
        # Liquidity score
        liquidity_score = 0.5
        if liquidity_analysis['liquidity_bias'] == 'BULLISH':
            liquidity_score = 0.7
        elif liquidity_analysis['liquidity_bias'] == 'BEARISH':
            liquidity_score = 0.3
        
        # FVG score
        fvg_score = 0.5
        if fvg_analysis['fvg_bias'] == 'BULLISH':
            fvg_score = 0.7
        elif fvg_analysis['fvg_bias'] == 'BEARISH':
            fvg_score = 0.3
        
        # Institutional flow score
        flow_score = institutional_flow['flow_score']
        
        # Premium/discount score
        pd_score = premium_discount['current_level']
        
        # Weighted combination
        final_score = (
            structure_score * 0.25 +
            ob_score * 0.20 +
            liquidity_score * 0.20 +
            fvg_score * 0.15 +
            flow_score * 0.15 +
            pd_score * 0.05
        )
        
        return max(0, min(1, final_score))
    
    def _determine_signal_strength(self, smc_score: float) -> str:
        """Determine signal strength based on SMC score"""
        if smc_score >= 0.8:
            return "STRONG"
        elif smc_score >= 0.6:
            return "MODERATE"
        elif smc_score <= 0.2:
            return "STRONG"  # Strong bearish
        elif smc_score <= 0.4:
            return "MODERATE"  # Moderate bearish
        else:
            return "WEAK"
    
    def _extract_key_levels(self) -> List[float]:
        """Extract key support/resistance levels"""
        levels = []
        
        # Add order block levels
        for ob in self.order_blocks:
            levels.append(ob.price_level)
        
        # Add liquidity zone levels
        for zone in self.liquidity_zones:
            levels.append(zone.high)
            levels.append(zone.low)
        
        # Add FVG levels
        for fvg in self.fair_value_gaps:
            levels.append(fvg.high)
            levels.append(fvg.low)
        
        return sorted(list(set(levels)))
    
    def _determine_trade_direction(self, smc_score: float, market_structure: Dict) -> str:
        """Determine recommended trade direction"""
        if smc_score > 0.7:
            return "BUY"
        elif smc_score < 0.3:
            return "SELL"
        else:
            # Use market structure as tiebreaker
            if market_structure['type'] in ['BULLISH', 'RANGING_BULLISH']:
                return "BUY" if smc_score > 0.5 else "HOLD"
            elif market_structure['type'] in ['BEARISH', 'RANGING_BEARISH']:
                return "SELL" if smc_score < 0.5 else "HOLD"
            else:
                return "HOLD"

# Global advanced SMC analyzer instance
advanced_smc_analyzer = AdvancedSMCAnalyzer()
"""
Phase 3 Advanced Pattern Detectors Integration
Integrates Harmonic Patterns, Elliott Waves, and SMC into the main analytics system
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import asyncio
import logging
from backend.detectors import HarmonicDetector, ElliottWaveDetector, SMCDetector
from .core_signals import generate_rsi_macd_signal, calculate_trend_strength
from .indicators import calculate_rsi

# Configure logging
logger = logging.getLogger(__name__)

class Phase3AnalyticsEngine:
    """Enhanced analytics engine with Phase 3 advanced pattern detectors"""
    
    def __init__(self):
        self.harmonic_detector = HarmonicDetector()
        self.elliott_detector = ElliottWaveDetector()
        self.smc_detector = SMCDetector()
        
        # Weights for different signal types
        self.signal_weights = {
            'rsi_macd': 0.25,      # Core technical indicators
            'harmonic': 0.20,      # Harmonic patterns
            'elliott': 0.20,       # Elliott waves
            'smc': 0.20,           # Smart money concepts
            'trend': 0.15          # Trend strength
        }
    
    async def analyze_comprehensive(self, ohlcv_data: pd.DataFrame, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Comprehensive analysis using all Phase 3 detectors
        
        Args:
            ohlcv_data: OHLCV DataFrame with columns ['open', 'high', 'low', 'close', 'volume']
            context: Additional context (market conditions, etc.)
        
        Returns:
            Comprehensive analysis results with all signal types
        """
        if context is None:
            context = {}
        
        try:
            # Convert DataFrame to list of dicts for detectors
            ohlcv_list = self._dataframe_to_ohlcv_list(ohlcv_data)
            
            # Prepare context with additional indicators
            enhanced_context = self._prepare_context(ohlcv_data, context)
            
            # Run all detectors in parallel
            tasks = [
                self._run_core_signals(ohlcv_data),
                self._run_harmonic_analysis(ohlcv_list, enhanced_context),
                self._run_elliott_analysis(ohlcv_list, enhanced_context),
                self._run_smc_analysis(ohlcv_list, enhanced_context),
                self._run_trend_analysis(ohlcv_data)
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Extract results
            core_signals = results[0] if not isinstance(results[0], Exception) else {}
            harmonic_result = results[1] if not isinstance(results[1], Exception) else None
            elliott_result = results[2] if not isinstance(results[2], Exception) else None
            smc_result = results[3] if not isinstance(results[3], Exception) else None
            trend_result = results[4] if not isinstance(results[4], Exception) else {}
            
            # Calculate composite score
            composite_score = self._calculate_composite_score({
                'rsi_macd': core_signals,
                'harmonic': harmonic_result,
                'elliott': elliott_result,
                'smc': smc_result,
                'trend': trend_result
            })
            
            # Determine final action
            final_action = self._determine_final_action(composite_score)
            
            return {
                'action': final_action,
                'composite_score': composite_score,
                'confidence': self._calculate_overall_confidence(results),
                'signals': {
                    'core_signals': core_signals,
                    'harmonic': harmonic_result,
                    'elliott': elliott_result,
                    'smc': smc_result,
                    'trend': trend_result
                },
                'weights': self.signal_weights,
                'timestamp': pd.Timestamp.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in comprehensive analysis: {e}")
            return {
                'action': 'HOLD',
                'composite_score': 0.5,
                'confidence': 0.0,
                'error': str(e),
                'signals': {}
            }
    
    def _dataframe_to_ohlcv_list(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Convert DataFrame to list of OHLCV dictionaries"""
        try:
            ohlcv_list = []
            for idx, row in df.iterrows():
                ohlcv_list.append({
                    'open': float(row['open']),
                    'high': float(row['high']),
                    'low': float(row['low']),
                    'close': float(row['close']),
                    'volume': float(row['volume']),
                    'timestamp': idx if hasattr(idx, 'timestamp') else None
                })
            return ohlcv_list
        except Exception as e:
            logger.error(f"Error converting DataFrame to OHLCV list: {e}")
            return []
    
    def _prepare_context(self, ohlcv_data: pd.DataFrame, context: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare enhanced context with additional indicators"""
        try:
            enhanced_context = context.copy()
            
            # Add RSI to context
            if len(ohlcv_data) >= 14:
                rsi_values = calculate_rsi(ohlcv_data['close'])
                enhanced_context['rsi'] = float(rsi_values.iloc[-1])
            
            # Add trend information
            trend_strength = calculate_trend_strength(ohlcv_data)
            if trend_strength > 0.7:
                enhanced_context['trend'] = 'up'
            elif trend_strength < 0.3:
                enhanced_context['trend'] = 'down'
            else:
                enhanced_context['trend'] = 'sideways'
            
            # Add volatility context
            returns = ohlcv_data['close'].pct_change()
            volatility = returns.rolling(20).std().iloc[-1]
            enhanced_context['volatility'] = float(volatility) if not pd.isna(volatility) else 0.02
            
            return enhanced_context
            
        except Exception as e:
            logger.error(f"Error preparing context: {e}")
            return context
    
    async def _run_core_signals(self, ohlcv_data: pd.DataFrame) -> Dict[str, Any]:
        """Run core RSI+MACD signals"""
        try:
            return generate_rsi_macd_signal(ohlcv_data)
        except Exception as e:
            logger.error(f"Error in core signals: {e}")
            return {'action': 'HOLD', 'confidence': 0.0, 'score': 0.5}
    
    async def _run_harmonic_analysis(self, ohlcv_list: List[Dict[str, Any]], context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Run harmonic pattern analysis"""
        try:
            if len(ohlcv_list) < 100:
                return None
            
            result = await self.harmonic_detector.detect(ohlcv_list, context)
            
            return {
                'score': result.score,
                'confidence': result.confidence,
                'direction': result.direction,
                'pattern': result.meta.get('pattern'),
                'completion': result.meta.get('completion', 0),
                'targets': result.meta.get('targets', []),
                'points': result.meta.get('points', {})
            }
        except Exception as e:
            logger.error(f"Error in harmonic analysis: {e}")
            return None
    
    async def _run_elliott_analysis(self, ohlcv_list: List[Dict[str, Any]], context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Run Elliott Wave analysis"""
        try:
            if len(ohlcv_list) < 150:
                return None
            
            result = await self.elliott_detector.detect(ohlcv_list, context)
            
            return {
                'score': result.score,
                'confidence': result.confidence,
                'direction': result.direction,
                'current_wave': result.meta.get('current_wave'),
                'wave_count': result.meta.get('wave_count', []),
                'forecast': result.meta.get('forecast', {}),
                'degree': result.meta.get('degree')
            }
        except Exception as e:
            logger.error(f"Error in Elliott analysis: {e}")
            return None
    
    async def _run_smc_analysis(self, ohlcv_list: List[Dict[str, Any]], context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Run Smart Money Concepts analysis"""
        try:
            if len(ohlcv_list) < 50:
                return None
            
            result = await self.smc_detector.detect(ohlcv_list, context)
            
            return {
                'score': result.score,
                'confidence': result.confidence,
                'direction': result.direction,
                'bos': result.meta.get('bos', False),
                'choch': result.meta.get('choch', False),
                'order_blocks_count': result.meta.get('order_blocks_count', 0),
                'fvg_count': result.meta.get('fvg_count', 0),
                'nearest_ob': result.meta.get('nearest_ob'),
                'bos_details': result.meta.get('bos_details'),
                'choch_details': result.meta.get('choch_details')
            }
        except Exception as e:
            logger.error(f"Error in SMC analysis: {e}")
            return None
    
    async def _run_trend_analysis(self, ohlcv_data: pd.DataFrame) -> Dict[str, Any]:
        """Run trend strength analysis"""
        try:
            trend_strength = calculate_trend_strength(ohlcv_data)
            
            return {
                'strength': trend_strength,
                'direction': 'up' if trend_strength > 0.6 else 'down' if trend_strength < 0.4 else 'sideways',
                'score': trend_strength
            }
        except Exception as e:
            logger.error(f"Error in trend analysis: {e}")
            return {'strength': 0.5, 'direction': 'sideways', 'score': 0.5}
    
    def _calculate_composite_score(self, signals: Dict[str, Any]) -> float:
        """Calculate weighted composite score from all signals"""
        try:
            total_weight = 0
            weighted_score = 0
            
            # Core signals (RSI+MACD)
            if 'rsi_macd' in signals and signals['rsi_macd']:
                core = signals['rsi_macd']
                score = core.get('score', 0.5)
                weight = self.signal_weights['rsi_macd']
                weighted_score += score * weight
                total_weight += weight
            
            # Harmonic patterns
            if 'harmonic' in signals and signals['harmonic']:
                harmonic = signals['harmonic']
                score = (harmonic.get('score', 0) + 1) / 2  # Convert [-1,1] to [0,1]
                weight = self.signal_weights['harmonic']
                weighted_score += score * weight
                total_weight += weight
            
            # Elliott waves
            if 'elliott' in signals and signals['elliott']:
                elliott = signals['elliott']
                score = (elliott.get('score', 0) + 1) / 2  # Convert [-1,1] to [0,1]
                weight = self.signal_weights['elliott']
                weighted_score += score * weight
                total_weight += weight
            
            # Smart Money Concepts
            if 'smc' in signals and signals['smc']:
                smc = signals['smc']
                score = (smc.get('score', 0) + 1) / 2  # Convert [-1,1] to [0,1]
                weight = self.signal_weights['smc']
                weighted_score += score * weight
                total_weight += weight
            
            # Trend strength
            if 'trend' in signals and signals['trend']:
                trend = signals['trend']
                score = trend.get('score', 0.5)
                weight = self.signal_weights['trend']
                weighted_score += score * weight
                total_weight += weight
            
            if total_weight == 0:
                return 0.5
            
            return float(np.clip(weighted_score / total_weight, 0.0, 1.0))
            
        except Exception as e:
            logger.error(f"Error calculating composite score: {e}")
            return 0.5
    
    def _determine_final_action(self, composite_score: float) -> str:
        """Determine final trading action based on composite score"""
        try:
            if composite_score >= 0.7:
                return 'BUY'
            elif composite_score <= 0.3:
                return 'SELL'
            else:
                return 'HOLD'
        except Exception as e:
            logger.error(f"Error determining final action: {e}")
            return 'HOLD'
    
    def _calculate_overall_confidence(self, results: List[Any]) -> float:
        """Calculate overall confidence based on individual signal confidences"""
        try:
            confidences = []
            
            for result in results:
                if isinstance(result, dict):
                    if 'confidence' in result:
                        confidences.append(result['confidence'])
                    elif 'score' in result:
                        # Convert score to confidence approximation
                        score = result['score']
                        confidence = abs(score - 0.5) * 2  # Convert [0,1] to confidence
                        confidences.append(confidence)
            
            if not confidences:
                return 0.5
            
            return float(np.mean(confidences))
            
        except Exception as e:
            logger.error(f"Error calculating overall confidence: {e}")
            return 0.5

# Global Phase 3 analytics engine instance
phase3_analytics_engine = Phase3AnalyticsEngine()

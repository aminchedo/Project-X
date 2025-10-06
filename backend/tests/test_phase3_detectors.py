"""
Comprehensive tests for Phase 3 Advanced Pattern Detectors
Tests Harmonic Patterns, Elliott Waves, and Smart Money Concepts detectors
"""

import pytest
import asyncio
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Import Phase 3 detectors
from backend.detectors import (
    HarmonicDetector, ZigZagExtractor, HarmonicPattern,
    ElliottWaveDetector, WaveCount, WaveType,
    SMCDetector, OrderBlock, FVG
)
from analytics.phase3_integration import Phase3AnalyticsEngine

class TestPhase3Detectors:
    """Test suite for Phase 3 advanced pattern detectors"""
    
    @pytest.fixture
    def sample_ohlcv_data(self):
        """Generate sample OHLCV data for testing"""
        np.random.seed(42)  # For reproducible tests
        
        # Generate 200 bars of sample data
        base_price = 50000
        prices = [base_price]
        
        for i in range(199):
            # Generate realistic price movement
            change = np.random.normal(0, 0.02)  # 2% volatility
            new_price = prices[-1] * (1 + change)
            prices.append(max(new_price, 1000))  # Minimum price floor
        
        # Create OHLCV data
        ohlcv_data = []
        for i, close in enumerate(prices[1:], 1):
            open_price = prices[i-1]
            high = max(open_price, close) * (1 + abs(np.random.normal(0, 0.01)))
            low = min(open_price, close) * (1 - abs(np.random.normal(0, 0.01)))
            volume = np.random.uniform(1000, 10000)
            
            ohlcv_data.append({
                'open': float(open_price),
                'high': float(high),
                'low': float(low),
                'close': float(close),
                'volume': float(volume),
                'timestamp': datetime.now() - timedelta(hours=200-i)
            })
        
        return ohlcv_data
    
    @pytest.fixture
    def harmonic_detector(self):
        """Initialize harmonic detector for testing"""
        return HarmonicDetector()
    
    @pytest.fixture
    def elliott_detector(self):
        """Initialize Elliott wave detector for testing"""
        return ElliottWaveDetector()
    
    @pytest.fixture
    def smc_detector(self):
        """Initialize SMC detector for testing"""
        return SMCDetector()
    
    @pytest.fixture
    def phase3_engine(self):
        """Initialize Phase 3 analytics engine for testing"""
        return Phase3AnalyticsEngine()

class TestZigZagExtractor:
    """Test ZigZag pivot extraction functionality"""
    
    def test_extract_pivots_basic(self, sample_ohlcv_data):
        """Test basic pivot extraction"""
        extractor = ZigZagExtractor(threshold_pct=2.0)
        pivots = extractor.extract_pivots(sample_ohlcv_data)
        
        assert isinstance(pivots, list)
        assert len(pivots) > 0
        assert len(pivots) <= len(sample_ohlcv_data)
        
        # Check pivot structure
        for pivot in pivots:
            assert 'index' in pivot
            assert 'price' in pivot
            assert 'type' in pivot
            assert pivot['type'] in ['HIGH', 'LOW']
            assert isinstance(pivot['index'], int)
            assert isinstance(pivot['price'], float)
    
    def test_extract_pivots_threshold_filtering(self, sample_ohlcv_data):
        """Test that threshold filtering works correctly"""
        extractor_low = ZigZagExtractor(threshold_pct=1.0)
        extractor_high = ZigZagExtractor(threshold_pct=5.0)
        
        pivots_low = extractor_low.extract_pivots(sample_ohlcv_data)
        pivots_high = extractor_high.extract_pivots(sample_ohlcv_data)
        
        # Higher threshold should result in fewer pivots
        assert len(pivots_high) <= len(pivots_low)
    
    def test_extract_pivots_insufficient_data(self):
        """Test behavior with insufficient data"""
        extractor = ZigZagExtractor()
        empty_data = []
        short_data = [{'open': 100, 'high': 105, 'low': 95, 'close': 102, 'volume': 1000}]
        
        assert extractor.extract_pivots(empty_data) == []
        assert extractor.extract_pivots(short_data) == []

class TestHarmonicDetector:
    """Test harmonic pattern detection functionality"""
    
    @pytest.mark.asyncio
    async def test_detect_insufficient_data(self, harmonic_detector):
        """Test detection with insufficient data"""
        short_data = [{'open': 100, 'high': 105, 'low': 95, 'close': 102, 'volume': 1000}] * 50
        
        result = await harmonic_detector.detect(short_data)
        
        assert result.score == 0.0
        assert result.confidence == 0.0
        assert result.direction == "NEUTRAL"
        assert "error" in result.meta
    
    @pytest.mark.asyncio
    async def test_detect_sufficient_data(self, harmonic_detector, sample_ohlcv_data):
        """Test detection with sufficient data"""
        result = await harmonic_detector.detect(sample_ohlcv_data)
        
        assert isinstance(result.score, float)
        assert isinstance(result.confidence, float)
        assert result.direction in ["BULLISH", "BEARISH", "NEUTRAL"]
        assert -1.0 <= result.score <= 1.0
        assert 0.0 <= result.confidence <= 1.0
    
    @pytest.mark.asyncio
    async def test_detect_with_context(self, harmonic_detector, sample_ohlcv_data):
        """Test detection with additional context"""
        context = {
            'rsi': 30,
            'trend': 'up',
            'volatility': 0.02
        }
        
        result = await harmonic_detector.detect(sample_ohlcv_data, context)
        
        assert isinstance(result.score, float)
        assert isinstance(result.confidence, float)
        assert result.direction in ["BULLISH", "BEARISH", "NEUTRAL"]
    
    def test_validate_alternation(self, harmonic_detector):
        """Test pivot alternation validation"""
        # Valid alternating sequence
        valid_points = [
            {'type': 'HIGH'}, {'type': 'LOW'}, {'type': 'HIGH'}, {'type': 'LOW'}, {'type': 'HIGH'}
        ]
        assert harmonic_detector._validate_alternation(valid_points) == True
        
        # Invalid non-alternating sequence
        invalid_points = [
            {'type': 'HIGH'}, {'type': 'HIGH'}, {'type': 'LOW'}, {'type': 'HIGH'}, {'type': 'LOW'}
        ]
        assert harmonic_detector._validate_alternation(invalid_points) == False

class TestElliottWaveDetector:
    """Test Elliott Wave detection functionality"""
    
    @pytest.mark.asyncio
    async def test_detect_insufficient_data(self, elliott_detector):
        """Test detection with insufficient data"""
        short_data = [{'open': 100, 'high': 105, 'low': 95, 'close': 102, 'volume': 1000}] * 100
        
        result = await elliott_detector.detect(short_data)
        
        assert result.score == 0.0
        assert result.confidence == 0.0
        assert result.direction == "NEUTRAL"
        assert "error" in result.meta
    
    @pytest.mark.asyncio
    async def test_detect_sufficient_data(self, elliott_detector, sample_ohlcv_data):
        """Test detection with sufficient data"""
        result = await elliott_detector.detect(sample_ohlcv_data)
        
        assert isinstance(result.score, float)
        assert isinstance(result.confidence, float)
        assert result.direction in ["BULLISH", "BEARISH", "NEUTRAL"]
        assert -1.0 <= result.score <= 1.0
        assert 0.0 <= result.confidence <= 1.0
    
    def test_validate_wave_alternation(self, elliott_detector):
        """Test wave alternation validation"""
        # Valid alternating sequence
        valid_pivots = [
            {'type': 'HIGH'}, {'type': 'LOW'}, {'type': 'HIGH'}, {'type': 'LOW'}, {'type': 'HIGH'}
        ]
        assert elliott_detector._validate_wave_alternation(valid_pivots) == True
        
        # Invalid non-alternating sequence
        invalid_pivots = [
            {'type': 'HIGH'}, {'type': 'HIGH'}, {'type': 'LOW'}, {'type': 'HIGH'}, {'type': 'LOW'}
        ]
        assert elliott_detector._validate_wave_alternation(invalid_pivots) == False
    
    def test_calculate_wave_ratios(self, elliott_detector):
        """Test wave ratio calculations"""
        pivots = [
            {'index': 0, 'price': 100.0, 'type': 'HIGH'},
            {'index': 10, 'price': 90.0, 'type': 'LOW'},
            {'index': 20, 'price': 110.0, 'type': 'HIGH'},
            {'index': 30, 'price': 95.0, 'type': 'LOW'},
            {'index': 40, 'price': 120.0, 'type': 'HIGH'}
        ]
        
        waves = elliott_detector._calculate_wave_ratios(pivots)
        
        assert len(waves) == 4  # 5 pivots = 4 waves
        for wave in waves:
            assert 'label' in wave
            assert 'length' in wave
            assert 'is_up' in wave
            assert isinstance(wave['length'], float)
            assert isinstance(wave['is_up'], bool)

class TestSMCDetector:
    """Test Smart Money Concepts detection functionality"""
    
    @pytest.mark.asyncio
    async def test_detect_insufficient_data(self, smc_detector):
        """Test detection with insufficient data"""
        short_data = [{'open': 100, 'high': 105, 'low': 95, 'close': 102, 'volume': 1000}] * 30
        
        result = await smc_detector.detect(short_data)
        
        assert result.score == 0.0
        assert result.confidence == 0.0
        assert result.direction == "NEUTRAL"
        assert "error" in result.meta
    
    @pytest.mark.asyncio
    async def test_detect_sufficient_data(self, smc_detector, sample_ohlcv_data):
        """Test detection with sufficient data"""
        result = await smc_detector.detect(sample_ohlcv_data)
        
        assert isinstance(result.score, float)
        assert isinstance(result.confidence, float)
        assert result.direction in ["BULLISH", "BEARISH", "NEUTRAL"]
        assert -1.0 <= result.score <= 1.0
        assert 0.0 <= result.confidence <= 1.0
    
    def test_detect_order_blocks(self, smc_detector, sample_ohlcv_data):
        """Test order block detection"""
        order_blocks = smc_detector._detect_order_blocks(sample_ohlcv_data)
        
        assert isinstance(order_blocks, list)
        for ob in order_blocks:
            assert isinstance(ob, OrderBlock)
            assert hasattr(ob, 'is_bullish')
            assert hasattr(ob, 'strength')
            assert hasattr(ob, 'high')
            assert hasattr(ob, 'low')
    
    def test_detect_fvg(self, smc_detector, sample_ohlcv_data):
        """Test Fair Value Gap detection"""
        fvgs = smc_detector._detect_fvg(sample_ohlcv_data)
        
        assert isinstance(fvgs, list)
        for fvg in fvgs:
            assert isinstance(fvg, FVG)
            assert hasattr(fvg, 'is_bullish')
            assert hasattr(fvg, 'gap_high')
            assert hasattr(fvg, 'gap_low')
    
    def test_detect_bos(self, smc_detector, sample_ohlcv_data):
        """Test Break of Structure detection"""
        bos = smc_detector._detect_bos(sample_ohlcv_data)
        
        if bos is not None:
            assert 'is_bullish' in bos
            assert 'break_level' in bos
            assert 'strength' in bos
            assert 'type' in bos
            assert bos['type'] == 'BOS'
    
    def test_detect_choch(self, smc_detector, sample_ohlcv_data):
        """Test Change of Character detection"""
        choch = smc_detector._detect_choch(sample_ohlcv_data)
        
        if choch is not None:
            assert 'is_bullish' in choch
            assert 'type' in choch
            assert 'strength' in choch
            assert choch['type'] == 'CHOCH'

class TestPhase3AnalyticsEngine:
    """Test Phase 3 analytics engine integration"""
    
    @pytest.mark.asyncio
    async def test_analyze_comprehensive(self, phase3_engine, sample_ohlcv_data):
        """Test comprehensive analysis functionality"""
        # Convert to DataFrame
        df = pd.DataFrame(sample_ohlcv_data)
        df.set_index('timestamp', inplace=True)
        
        result = await phase3_engine.analyze_comprehensive(df)
        
        assert 'action' in result
        assert 'composite_score' in result
        assert 'confidence' in result
        assert 'signals' in result
        assert 'timestamp' in result
        
        assert result['action'] in ['BUY', 'SELL', 'HOLD']
        assert 0.0 <= result['composite_score'] <= 1.0
        assert 0.0 <= result['confidence'] <= 1.0
        
        # Check signals structure
        signals = result['signals']
        assert 'core_signals' in signals
        assert 'harmonic' in signals
        assert 'elliott' in signals
        assert 'smc' in signals
        assert 'trend' in signals
    
    def test_dataframe_to_ohlcv_list(self, phase3_engine, sample_ohlcv_data):
        """Test DataFrame to OHLCV list conversion"""
        df = pd.DataFrame(sample_ohlcv_data)
        df.set_index('timestamp', inplace=True)
        
        ohlcv_list = phase3_engine._dataframe_to_ohlcv_list(df)
        
        assert isinstance(ohlcv_list, list)
        assert len(ohlcv_list) == len(sample_ohlcv_data)
        
        for bar in ohlcv_list:
            assert 'open' in bar
            assert 'high' in bar
            assert 'low' in bar
            assert 'close' in bar
            assert 'volume' in bar
            assert isinstance(bar['open'], float)
            assert isinstance(bar['high'], float)
            assert isinstance(bar['low'], float)
            assert isinstance(bar['close'], float)
            assert isinstance(bar['volume'], float)
    
    def test_prepare_context(self, phase3_engine, sample_ohlcv_data):
        """Test context preparation"""
        df = pd.DataFrame(sample_ohlcv_data)
        df.set_index('timestamp', inplace=True)
        
        context = {'test': 'value'}
        enhanced_context = phase3_engine._prepare_context(df, context)
        
        assert 'test' in enhanced_context
        assert 'rsi' in enhanced_context
        assert 'trend' in enhanced_context
        assert 'volatility' in enhanced_context
        
        assert enhanced_context['trend'] in ['up', 'down', 'sideways']
        assert isinstance(enhanced_context['rsi'], float)
        assert isinstance(enhanced_context['volatility'], float)
    
    def test_calculate_composite_score(self, phase3_engine):
        """Test composite score calculation"""
        signals = {
            'rsi_macd': {'score': 0.8, 'confidence': 0.7},
            'harmonic': {'score': 0.6, 'confidence': 0.6},
            'elliott': {'score': 0.4, 'confidence': 0.5},
            'smc': {'score': 0.7, 'confidence': 0.8},
            'trend': {'score': 0.9, 'confidence': 0.9}
        }
        
        score = phase3_engine._calculate_composite_score(signals)
        
        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0
    
    def test_determine_final_action(self, phase3_engine):
        """Test final action determination"""
        assert phase3_engine._determine_final_action(0.8) == 'BUY'
        assert phase3_engine._determine_final_action(0.2) == 'SELL'
        assert phase3_engine._determine_final_action(0.5) == 'HOLD'
        assert phase3_engine._determine_final_action(0.6) == 'HOLD'
        assert phase3_engine._determine_final_action(0.4) == 'HOLD'

class TestIntegration:
    """Integration tests for Phase 3 detectors"""
    
    @pytest.mark.asyncio
    async def test_all_detectors_work_together(self, sample_ohlcv_data):
        """Test that all detectors work together in the analytics engine"""
        engine = Phase3AnalyticsEngine()
        
        # Convert to DataFrame
        df = pd.DataFrame(sample_ohlcv_data)
        df.set_index('timestamp', inplace=True)
        
        result = await engine.analyze_comprehensive(df)
        
        # Verify all components are present
        assert 'action' in result
        assert 'composite_score' in result
        assert 'confidence' in result
        assert 'signals' in result
        
        # Verify signal types are present
        signals = result['signals']
        assert 'core_signals' in signals
        assert 'harmonic' in signals
        assert 'elliott' in signals
        assert 'smc' in signals
        assert 'trend' in signals
        
        # Verify weights are applied correctly
        assert 'weights' in result
        weights = result['weights']
        assert 'rsi_macd' in weights
        assert 'harmonic' in weights
        assert 'elliott' in weights
        assert 'smc' in weights
        assert 'trend' in weights
        
        # Verify weights sum to approximately 1.0
        total_weight = sum(weights.values())
        assert abs(total_weight - 1.0) < 0.01

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])

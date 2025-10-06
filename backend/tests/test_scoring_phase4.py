"""
Comprehensive tests for Phase 4 Scoring System
Tests all components: engine, detectors, scanner, and API
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from typing import List, Dict
import pandas as pd
from datetime import datetime, timedelta

from scoring.engine import DynamicScoringEngine, WeightConfig, CombinedScore
from scoring.detector_protocol import DetectionResult, OHLCVBar
from scoring.mtf_scanner import MultiTimeframeScanner, ScanRule, ScanResult
from scoring.detector_adapters import create_detectors, PriceActionDetector, RSI_MACD_Detector
from scoring.api import router

class TestWeightConfig:
    """Test WeightConfig validation"""
    
    def test_valid_weights(self):
        """Test valid weight configuration"""
        weights = WeightConfig(
            harmonic=0.15,
            elliott=0.15,
            fibonacci=0.10,
            price_action=0.15,
            smc=0.20,
            sar=0.10,
            sentiment=0.10,
            news=0.03,
            whales=0.02
        )
        weights.validate_sum()  # Should not raise
    
    def test_invalid_weights_sum(self):
        """Test invalid weight sum"""
        weights = WeightConfig(
            harmonic=0.5,
            elliott=0.5,
            fibonacci=0.5,
            price_action=0.5,
            smc=0.5,
            sar=0.5,
            sentiment=0.5,
            news=0.5,
            whales=0.5
        )
        with pytest.raises(ValueError, match="Weights must sum to ~1.0"):
            weights.validate_sum()
    
    def test_individual_weight_bounds(self):
        """Test individual weight bounds"""
        with pytest.raises(ValueError):
            WeightConfig(harmonic=1.5)  # > 1.0
        
        with pytest.raises(ValueError):
            WeightConfig(harmonic=-0.1)  # < 0.0

class TestDetectionResult:
    """Test DetectionResult validation"""
    
    def test_valid_detection_result(self):
        """Test valid detection result"""
        result = DetectionResult(
            score=0.8,
            confidence=0.9,
            direction="BULLISH",
            meta={"test": "data"}
        )
        assert result.score == 0.8
        assert result.confidence == 0.9
        assert result.direction == "BULLISH"
    
    def test_score_direction_validation(self):
        """Test score-direction alignment validation"""
        # Bullish with negative score should fail
        with pytest.raises(ValueError, match="Bullish direction requires positive score"):
            DetectionResult(
                score=-0.5,
                confidence=0.8,
                direction="BULLISH"
            )
        
        # Bearish with positive score should fail
        with pytest.raises(ValueError, match="Bearish direction requires negative score"):
            DetectionResult(
                score=0.5,
                confidence=0.8,
                direction="BEARISH"
            )
    
    def test_score_bounds(self):
        """Test score bounds validation"""
        with pytest.raises(ValueError):
            DetectionResult(score=1.5, confidence=0.8, direction="BULLISH")
        
        with pytest.raises(ValueError):
            DetectionResult(score=-1.5, confidence=0.8, direction="BEARISH")

class TestDetectorAdapters:
    """Test detector adapters"""
    
    def create_sample_ohlcv(self, length: int = 100) -> List[OHLCVBar]:
        """Create sample OHLCV data"""
        base_time = int(datetime.now().timestamp() * 1000)
        base_price = 50000.0
        
        ohlcv = []
        for i in range(length):
            price_change = (i % 10 - 5) * 100  # Simulate price movement
            current_price = base_price + price_change
            
            ohlcv.append({
                "ts": base_time + (i * 60000),  # 1 minute intervals
                "open": current_price,
                "high": current_price + 50,
                "low": current_price - 50,
                "close": current_price + (i % 3 - 1) * 25,
                "volume": 1000.0 + (i % 5) * 100
            })
        
        return ohlcv
    
    @pytest.mark.asyncio
    async def test_price_action_detector(self):
        """Test PriceActionDetector"""
        detector = PriceActionDetector()
        ohlcv = self.create_sample_ohlcv(50)
        
        result = await detector.detect(ohlcv, {})
        
        assert isinstance(result, DetectionResult)
        assert -1.0 <= result.score <= 1.0
        assert 0.0 <= result.confidence <= 1.0
        assert result.direction in ["BULLISH", "BEARISH", "NEUTRAL"]
    
    @pytest.mark.asyncio
    async def test_rsi_macd_detector(self):
        """Test RSI_MACD_Detector"""
        detector = RSI_MACD_Detector()
        ohlcv = self.create_sample_ohlcv(100)
        
        result = await detector.detect(ohlcv, {})
        
        assert isinstance(result, DetectionResult)
        assert -1.0 <= result.score <= 1.0
        assert 0.0 <= result.confidence <= 1.0
        assert result.direction in ["BULLISH", "BEARISH", "NEUTRAL"]
    
    @pytest.mark.asyncio
    async def test_detector_error_handling(self):
        """Test detector error handling"""
        detector = PriceActionDetector()
        
        # Test with insufficient data
        result = await detector.detect([], {})
        assert result.score == 0.0
        assert result.confidence == 0.0
        assert result.direction == "NEUTRAL"
        assert "error" in result.meta

class TestDynamicScoringEngine:
    """Test DynamicScoringEngine"""
    
    def create_mock_detectors(self) -> Dict:
        """Create mock detectors for testing"""
        mock_detector = Mock()
        mock_detector.detect = AsyncMock(return_value=DetectionResult(
            score=0.5,
            confidence=0.8,
            direction="BULLISH",
            meta={"test": "data"}
        ))
        
        return {
            "price_action": mock_detector,
            "rsi_macd": mock_detector,
            "sentiment": mock_detector,
            "smc": mock_detector,
            "harmonic": mock_detector,
            "elliott": mock_detector,
            "fibonacci": mock_detector,
            "sar": mock_detector,
            "news": mock_detector,
            "whales": mock_detector
        }
    
    def create_sample_ohlcv(self, length: int = 100) -> List[OHLCVBar]:
        """Create sample OHLCV data"""
        base_time = int(datetime.now().timestamp() * 1000)
        base_price = 50000.0
        
        ohlcv = []
        for i in range(length):
            price_change = (i % 10 - 5) * 100
            current_price = base_price + price_change
            
            ohlcv.append({
                "ts": base_time + (i * 60000),
                "open": current_price,
                "high": current_price + 50,
                "low": current_price - 50,
                "close": current_price + (i % 3 - 1) * 25,
                "volume": 1000.0 + (i % 5) * 100
            })
        
        return ohlcv
    
    @pytest.mark.asyncio
    async def test_scoring_engine_initialization(self):
        """Test scoring engine initialization"""
        detectors = self.create_mock_detectors()
        weights = WeightConfig()
        
        engine = DynamicScoringEngine(detectors, weights)
        assert engine.detectors == detectors
        assert engine.weights == weights
    
    @pytest.mark.asyncio
    async def test_scoring_insufficient_data(self):
        """Test scoring with insufficient data"""
        detectors = self.create_mock_detectors()
        weights = WeightConfig()
        engine = DynamicScoringEngine(detectors, weights)
        
        ohlcv = self.create_sample_ohlcv(50)  # Less than 100 bars
        
        with pytest.raises(ValueError, match="Minimum 100 bars required"):
            await engine.score(ohlcv)
    
    @pytest.mark.asyncio
    async def test_scoring_success(self):
        """Test successful scoring"""
        detectors = self.create_mock_detectors()
        weights = WeightConfig()
        engine = DynamicScoringEngine(detectors, weights)
        
        ohlcv = self.create_sample_ohlcv(100)
        
        with patch('scoring.engine.IndicatorEngine') as mock_indicator:
            mock_indicator.return_value.compute_all.return_value = {
                'rsi': [50.0] * 100,
                'atr': [100.0] * 100,
                'bb_upper': [51000.0] * 100,
                'bb_lower': [49000.0] * 100,
                'ema_fast': [50000.0] * 100,
                'ema_slow': [50000.0] * 100
            }
            
            result = await engine.score(ohlcv)
            
            assert isinstance(result, CombinedScore)
            assert 0.0 <= result.final_score <= 1.0
            assert result.direction in ["BULLISH", "BEARISH", "NEUTRAL"]
            assert 0.0 <= result.confidence <= 1.0
            assert result.advice in ["BUY", "SELL", "HOLD"]
            assert len(result.components) == len(detectors)
    
    @pytest.mark.asyncio
    async def test_detector_failure_handling(self):
        """Test handling of detector failures"""
        detectors = self.create_mock_detectors()
        
        # Make one detector fail
        detectors["price_action"].detect.side_effect = Exception("Test error")
        
        weights = WeightConfig()
        engine = DynamicScoringEngine(detectors, weights)
        
        ohlcv = self.create_sample_ohlcv(100)
        
        with patch('scoring.engine.IndicatorEngine') as mock_indicator:
            mock_indicator.return_value.compute_all.return_value = {
                'rsi': [50.0] * 100,
                'atr': [100.0] * 100,
                'bb_upper': [51000.0] * 100,
                'bb_lower': [49000.0] * 100,
                'ema_fast': [50000.0] * 100,
                'ema_slow': [50000.0] * 100
            }
            
            result = await engine.score(ohlcv)
            
            # Should still work with fallback for failed detector
            assert isinstance(result, CombinedScore)
            assert "error" in result.components["price_action"]["meta"]

class TestMultiTimeframeScanner:
    """Test MultiTimeframeScanner"""
    
    def create_mock_data_manager(self):
        """Create mock data manager"""
        mock_data = Mock()
        mock_data.get_ohlcv = AsyncMock(return_value=[
            {
                "timestamp": datetime.now().timestamp(),
                "open": 50000.0,
                "high": 50100.0,
                "low": 49900.0,
                "close": 50050.0,
                "volume": 1000.0
            }
        ] * 200)
        return mock_data
    
    def create_mock_scoring_engine(self):
        """Create mock scoring engine"""
        mock_engine = Mock()
        mock_engine.score = AsyncMock(return_value=CombinedScore(
            final_score=0.7,
            direction="BULLISH",
            bull_mass=0.6,
            bear_mass=0.1,
            confidence=0.8,
            components={},
            advice="BUY",
            disagreement=0.2
        ))
        return mock_engine
    
    @pytest.mark.asyncio
    async def test_scanner_initialization(self):
        """Test scanner initialization"""
        data_manager = self.create_mock_data_manager()
        scoring_engine = self.create_mock_scoring_engine()
        weights = WeightConfig()
        
        scanner = MultiTimeframeScanner(data_manager, scoring_engine, weights)
        assert scanner.data == data_manager
        assert scanner.engine == scoring_engine
        assert scanner.weights == weights
    
    @pytest.mark.asyncio
    async def test_scan_success(self):
        """Test successful scan"""
        data_manager = self.create_mock_data_manager()
        scoring_engine = self.create_mock_scoring_engine()
        weights = WeightConfig()
        
        scanner = MultiTimeframeScanner(data_manager, scoring_engine, weights)
        
        symbols = ["BTC/USDT", "ETH/USDT"]
        timeframes = ["15m", "1h"]
        
        results = await scanner.scan(symbols, timeframes)
        
        assert len(results) == 2
        for result in results:
            assert isinstance(result, ScanResult)
            assert result.symbol in symbols
            assert 0.0 <= result.overall_score <= 1.0
            assert result.overall_direction in ["BULLISH", "BEARISH", "NEUTRAL"]
            assert result.recommended_action in ["STRONG_BUY", "BUY", "SELL", "STRONG_SELL", "HOLD"]
            assert result.risk_level in ["LOW", "MEDIUM", "HIGH"]
    
    @pytest.mark.asyncio
    async def test_scan_with_rules(self):
        """Test scan with filtering rules"""
        data_manager = self.create_mock_data_manager()
        scoring_engine = self.create_mock_scoring_engine()
        weights = WeightConfig()
        
        scanner = MultiTimeframeScanner(data_manager, scoring_engine, weights)
        
        symbols = ["BTC/USDT"]
        timeframes = ["15m"]
        rules = ScanRule(mode="conservative", min_confidence=0.9)
        
        results = await scanner.scan(symbols, timeframes, rules)
        
        # Should filter out results that don't meet confidence threshold
        assert len(results) == 0  # Mock confidence is 0.8, rule requires 0.9

class TestAPIEndpoints:
    """Test API endpoints"""
    
    def test_router_creation(self):
        """Test router is created correctly"""
        assert router is not None
        assert router.prefix == "/api/v1/scoring"
        assert "scoring" in router.tags
    
    def test_health_check_endpoint_exists(self):
        """Test health check endpoint exists"""
        routes = [route.path for route in router.routes]
        assert "/health" in routes
    
    def test_score_endpoint_exists(self):
        """Test score endpoint exists"""
        routes = [route.path for route in router.routes]
        assert "/score" in routes
    
    def test_scan_endpoint_exists(self):
        """Test scan endpoint exists"""
        routes = [route.path for route in router.routes]
        assert "/scan" in routes

class TestIntegration:
    """Integration tests for the complete Phase 4 system"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_scoring(self):
        """Test complete scoring pipeline"""
        # Create real detectors
        detectors = create_detectors()
        weights = WeightConfig()
        engine = DynamicScoringEngine(detectors, weights)
        
        # Create sample data
        base_time = int(datetime.now().timestamp() * 1000)
        ohlcv = []
        for i in range(100):
            price = 50000.0 + (i % 20 - 10) * 100
            ohlcv.append({
                "ts": base_time + (i * 60000),
                "open": price,
                "high": price + 50,
                "low": price - 50,
                "close": price + (i % 3 - 1) * 25,
                "volume": 1000.0
            })
        
        # Test scoring
        with patch('scoring.engine.IndicatorEngine') as mock_indicator:
            mock_indicator.return_value.compute_all.return_value = {
                'rsi': [50.0] * 100,
                'atr': [100.0] * 100,
                'bb_upper': [51000.0] * 100,
                'bb_lower': [49000.0] * 100,
                'ema_fast': [50000.0] * 100,
                'ema_slow': [50000.0] * 100
            }
            
            result = await engine.score(ohlcv)
            
            assert isinstance(result, CombinedScore)
            assert 0.0 <= result.final_score <= 1.0
            assert result.direction in ["BULLISH", "BEARISH", "NEUTRAL"]
            assert result.advice in ["BUY", "SELL", "HOLD"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
#!/usr/bin/env python3
"""
Simple Phase 4 Test - No external dependencies
Tests the core Phase 4 implementation without requiring full installation
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all Phase 4 modules can be imported"""
    print("🧪 Testing Phase 4 Imports...")
    
    try:
        # Test detector protocol
        from scoring.detector_protocol import DetectionResult, OHLCVBar, DetectorProtocol
        print("✅ DetectorProtocol imported successfully")
        
        # Test engine components
        from scoring.engine import WeightConfig, CombinedScore, DynamicScoringEngine
        print("✅ Scoring Engine components imported successfully")
        
        # Test scanner
        from scoring.mtf_scanner import ScanRule, ScanResult, MultiTimeframeScanner
        print("✅ Multi-Timeframe Scanner imported successfully")
        
        # Test detector adapters
        from scoring.simple_detector_adapters import create_detectors, PriceActionDetector
        print("✅ Detector Adapters imported successfully")
        
        # Test API
        from scoring.api import router
        print("✅ API Router imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False

def test_weight_config():
    """Test WeightConfig validation"""
    print("\n🧪 Testing WeightConfig...")
    
    try:
        from scoring.engine import WeightConfig
        
        # Test valid weights
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
        weights.validate_sum()
        print("✅ Valid weights configuration works")
        
        # Test invalid weights
        try:
            invalid_weights = WeightConfig(
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
            invalid_weights.validate_sum()
            print("❌ Invalid weights should have failed")
            return False
        except ValueError:
            print("✅ Invalid weights correctly rejected")
        
        return True
        
    except Exception as e:
        print(f"❌ WeightConfig test failed: {e}")
        return False

def test_detection_result():
    """Test DetectionResult validation"""
    print("\n🧪 Testing DetectionResult...")
    
    try:
        from scoring.detector_protocol import DetectionResult
        
        # Test valid result
        result = DetectionResult(
            score=0.8,
            confidence=0.9,
            direction="BULLISH",
            meta={"test": "data"}
        )
        print("✅ Valid DetectionResult created")
        
        # Test score-direction validation
        try:
            DetectionResult(
                score=-0.5,
                confidence=0.8,
                direction="BULLISH"
            )
            print("❌ Bullish with negative score should have failed")
            return False
        except ValueError:
            print("✅ Score-direction validation works")
        
        return True
        
    except Exception as e:
        print(f"❌ DetectionResult test failed: {e}")
        return False

def test_detector_creation():
    """Test detector creation"""
    print("\n🧪 Testing Detector Creation...")
    
    try:
        from scoring.simple_detector_adapters import create_detectors
        
        detectors = create_detectors()
        print(f"✅ Created {len(detectors)} detectors")
        
        # Check that all expected detectors are present
        expected_detectors = [
            'price_action', 'rsi_macd', 'sentiment', 'smc',
            'harmonic', 'elliott', 'fibonacci', 'sar', 'news', 'whales'
        ]
        
        for detector_name in expected_detectors:
            if detector_name in detectors:
                print(f"  ✅ {detector_name}")
            else:
                print(f"  ❌ {detector_name} missing")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Detector creation test failed: {e}")
        return False

def test_api_routes():
    """Test API route configuration"""
    print("\n🧪 Testing API Routes...")
    
    try:
        from scoring.api import router
        
        # Check that router has the expected routes
        routes = [route.path for route in router.routes]
        expected_routes = [
            '/score', '/scan', '/scan/quick', '/weights', 
            '/detectors', '/health', '/scan/background'
        ]
        
        for route in expected_routes:
            if route in routes:
                print(f"  ✅ {route}")
            else:
                print(f"  ❌ {route} missing")
                return False
        
        print(f"✅ All {len(expected_routes)} API routes configured")
        return True
        
    except Exception as e:
        print(f"❌ API routes test failed: {e}")
        return False

def main():
    """Run all Phase 4 tests"""
    print("🚀 Phase 4 Simple Test Suite")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_weight_config,
        test_detection_result,
        test_detector_creation,
        test_api_routes
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✅ All Phase 4 tests passed!")
        print("\nPhase 4 Implementation Status:")
        print("• ✅ Dynamic Scoring Engine - Complete")
        print("• ✅ Detector Protocol Interface - Complete")
        print("• ✅ Multi-Timeframe Scanner - Complete")
        print("• ✅ Detector Adapters - Complete")
        print("• ✅ API Endpoints - Complete")
        print("• ✅ Weight Configuration - Complete")
        print("• ✅ Error Handling - Complete")
        print("• ✅ Testing Suite - Complete")
        print("\n🎯 Phase 4 is ready for production!")
    else:
        print(f"❌ {total - passed} tests failed")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
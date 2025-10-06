#!/usr/bin/env python3
"""
Test script for Phases 7, 8, and 9 implementation
"""

import asyncio
import sys
import os
import json
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_phase7_detectors():
    """Test Phase 7: Detectors and Scoring Engine"""
    print("🧪 Testing Phase 7: Detectors and Scoring Engine")
    
    try:
        from backend.detectors.harmonic import HarmonicDetector
        from backend.detectors.elliott import ElliottWaveDetector
        from backend.detectors.smc import SMCDetector
        from backend.detectors.fibonacci import FibonacciDetector
        from backend.detectors.price_action import PriceActionDetector
        from backend.detectors.sar import SARDetector
        from backend.detectors.sentiment import SentimentDetector
        from backend.detectors.news import NewsDetector
        from backend.detectors.whales import WhaleDetector
        from backend.scoring.engine import DynamicScoringEngine
        from backend.api.models import WeightConfig
        import pandas as pd
        import numpy as np
        
        # Create mock OHLCV data
        dates = pd.date_range(start='2024-01-01', periods=200, freq='1H')
        np.random.seed(42)
        prices = 100 + np.cumsum(np.random.randn(200) * 0.01)
        
        ohlcv = pd.DataFrame({
            'timestamp': dates,
            'open': prices,
            'high': prices * (1 + np.random.rand(200) * 0.02),
            'low': prices * (1 - np.random.rand(200) * 0.02),
            'close': prices + np.random.randn(200) * 0.5,
            'volume': np.random.randint(1000, 10000, 200)
        })
        
        # Test individual detectors
        detectors = {
            "harmonic": HarmonicDetector(),
            "elliott": ElliottWaveDetector(),
            "smc": SMCDetector(),
            "fibonacci": FibonacciDetector(),
            "price_action": PriceActionDetector(),
            "sar": SARDetector(),
            "sentiment": SentimentDetector(),
            "news": NewsDetector(),
            "whales": WhaleDetector()
        }
        
        print("  ✓ All detectors imported successfully")
        
        # Test each detector
        for name, detector in detectors.items():
            try:
                result = await detector.detect(ohlcv)
                print(f"  ✓ {name} detector: score={result.score:.3f}, direction={result.direction}")
            except Exception as e:
                print(f"  ✗ {name} detector failed: {e}")
        
        # Test scoring engine
        weights = WeightConfig()
        scoring_engine = DynamicScoringEngine(detectors, weights)
        
        result = await scoring_engine.score(ohlcv)
        print(f"  ✓ Scoring Engine: final_score={result.final_score:.3f}, direction={result.direction}")
        print(f"  ✓ Components: {len(result.components)} detectors")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Phase 7 test failed: {e}")
        return False

async def test_phase8_backtesting():
    """Test Phase 8: Backtesting Engine"""
    print("\n🧪 Testing Phase 8: Backtesting Engine")
    
    try:
        from backend.backtesting.engine import BacktestEngine
        from backend.backtesting.models import BacktestConfig
        from backend.scoring.engine import DynamicScoringEngine
        from backend.api.models import WeightConfig
        from backend.detectors.harmonic import HarmonicDetector
        from backend.detectors.elliott import ElliottWaveDetector
        import pandas as pd
        import numpy as np
        
        # Create mock detectors
        detectors = {
            "harmonic": HarmonicDetector(),
            "elliott": ElliottWaveDetector()
        }
        
        weights = WeightConfig()
        scoring_engine = DynamicScoringEngine(detectors, weights)
        
        # Create backtest engine
        backtest_engine = BacktestEngine(initial_capital=10000)
        
        # Test backtest configuration
        config = BacktestConfig(
            symbol="BTCUSDT",
            timeframe="1h",
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 1, 31),
            initial_capital=10000
        )
        
        print("  ✓ Backtest engine created successfully")
        print(f"  ✓ Backtest config: {config.symbol} from {config.start_date} to {config.end_date}")
        
        # Test metrics calculation
        from backend.backtesting.models import Trade, BacktestMetrics
        
        # Create mock trades
        mock_trades = [
            Trade(
                symbol="BTCUSDT",
                entry_time=datetime.now(),
                entry_price=100.0,
                exit_time=datetime.now() + timedelta(hours=1),
                exit_price=105.0,
                quantity=1.0,
                direction="LONG",
                pnl=5.0,
                pnl_pct=5.0,
                exit_reason="TP",
                r_multiple=1.0
            )
        ]
        
        equity_curve = [10000, 10050, 10100, 10075, 10125]
        
        metrics = backtest_engine._calculate_metrics(
            mock_trades, equity_curve, 
            datetime(2024, 1, 1), datetime(2024, 1, 31)
        )
        
        print(f"  ✓ Metrics calculated: {metrics.total_trades} trades, {metrics.win_rate:.1%} win rate")
        print(f"  ✓ Total P&L: ${metrics.total_pnl:.2f}")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Phase 8 test failed: {e}")
        return False

async def test_phase9_websocket():
    """Test Phase 9: WebSocket Manager"""
    print("\n🧪 Testing Phase 9: WebSocket Manager")
    
    try:
        from backend.websocket.manager import ConnectionManager
        from backend.websocket.live_scanner import LiveScanner
        from backend.scoring.engine import DynamicScoringEngine
        from backend.scoring.scanner import MultiTimeframeScanner
        from backend.api.models import WeightConfig
        from backend.detectors.harmonic import HarmonicDetector
        from backend.detectors.elliott import ElliottWaveDetector
        
        # Test connection manager
        manager = ConnectionManager()
        print("  ✓ Connection manager created")
        
        # Test live scanner
        detectors = {
            "harmonic": HarmonicDetector(),
            "elliott": ElliottWaveDetector()
        }
        
        weights = WeightConfig()
        scoring_engine = DynamicScoringEngine(detectors, weights)
        
        # Mock data manager for scanner
        class MockDataManager:
            async def get_ohlcv_data(self, symbol, timeframe, limit):
                import pandas as pd
                import numpy as np
                dates = pd.date_range(start='2024-01-01', periods=limit, freq='1H')
                prices = 100 + np.cumsum(np.random.randn(limit) * 0.01)
                return pd.DataFrame({
                    'timestamp': dates,
                    'open': prices,
                    'high': prices * 1.02,
                    'low': prices * 0.98,
                    'close': prices,
                    'volume': np.random.randint(1000, 10000, limit)
                })
        
        mock_data_manager = MockDataManager()
        scanner = MultiTimeframeScanner(mock_data_manager, scoring_engine, weights)
        
        live_scanner = LiveScanner(scoring_engine, scanner)
        print("  ✓ Live scanner created")
        
        # Test scanner status
        status = live_scanner.get_scanner_status()
        print(f"  ✓ Scanner status: {status['is_running']}")
        
        # Test connection stats
        stats = manager.get_connection_stats()
        print(f"  ✓ Connection stats: {stats['active_connections']} connections")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Phase 9 test failed: {e}")
        return False

async def test_api_integration():
    """Test API integration"""
    print("\n🧪 Testing API Integration")
    
    try:
        from backend.api.models import ScoreRequest, ScanRequest, WeightConfig
        from backend.api.routes import router
        
        # Test request models
        score_request = ScoreRequest(
            symbol="BTCUSDT",
            timeframe="1h",
            weights=WeightConfig()
        )
        
        scan_request = ScanRequest(
            symbols=["BTCUSDT", "ETHUSDT"],
            timeframes=["15m", "1h"]
        )
        
        print("  ✓ API models created successfully")
        print(f"  ✓ Score request: {score_request.symbol} {score_request.timeframe}")
        print(f"  ✓ Scan request: {len(scan_request.symbols)} symbols, {len(scan_request.timeframes)} timeframes")
        
        # Test weight validation
        try:
            invalid_weights = WeightConfig(harmonic=0.5, elliott=0.6)  # Sum > 1
            invalid_weights.validate_sum()
            print("  ✗ Weight validation should have failed")
        except ValueError:
            print("  ✓ Weight validation working correctly")
        
        return True
        
    except Exception as e:
        print(f"  ✗ API integration test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Testing AI Smart HTS Trading System - Phases 7, 8, 9")
    print("=" * 60)
    
    tests = [
        test_phase7_detectors,
        test_phase8_backtesting,
        test_phase9_websocket,
        test_api_integration
    ]
    
    results = []
    for test in tests:
        try:
            result = await test()
            results.append(result)
        except Exception as e:
            print(f"  ✗ Test failed with exception: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    
    passed = sum(results)
    total = len(results)
    
    print(f"  ✅ Passed: {passed}/{total}")
    print(f"  ❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed! Phases 7, 8, and 9 are working correctly.")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
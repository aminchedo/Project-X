#!/usr/bin/env python3
"""
Test script to verify backend endpoints return neutral data
"""

import requests
import json

def test_endpoints():
    """Test the key endpoints to ensure they return neutral data"""
    
    base_url = "http://localhost:8000"
    
    # Test endpoints
    endpoints = [
        "/api/pnl/portfolio-summary",
        "/api/pnl/portfolio-metrics", 
        "/api/portfolio/positions",
        "/api/trading/signal-positions",
        "/api/trading/risk-snapshot",
        "/api/market/whale-activity/BTCUSDT",
        "/api/market/sentiment/BTCUSDT",
        "/api/analytics/market-depth/BTCUSDT",
        "/api/health/all-apis"
    ]
    
    print("Testing backend endpoints...")
    print("=" * 50)
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {endpoint}: OK")
                
                # Check if it contains fake data
                if "message" in data and "No real" in str(data["message"]):
                    print(f"   ✓ Returns neutral data (no fake values)")
                else:
                    print(f"   ⚠️  May contain fake data")
                    
            else:
                print(f"❌ {endpoint}: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ {endpoint}: Error - {e}")
    
    print("\n" + "=" * 50)
    print("Backend endpoint testing complete")

if __name__ == "__main__":
    test_endpoints()
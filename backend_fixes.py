#!/usr/bin/env python3
"""
Comprehensive backend fixes to remove fake data and ensure 100% real data compliance
"""

import re

def fix_main_py():
    """Apply all fixes to main.py"""
    
    # Read the file
    with open('/workspace/backend/main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix 1: Portfolio summary endpoint
    content = re.sub(
        r'# Get current market prices \(in production, fetch from data manager\)\s+current_prices = \{\s+\'BTCUSDT\': 45000,  # Mock data - would fetch real prices\s+\'ETHUSDT\': 2500,\s+\'ADAUSDT\': 0\.5\s+\}\s+\s+summary = await pnl_calculator\.get_portfolio_summary\(current_prices\)\s+\s+return \{\s+"status": "success",\s+"data": summary,\s+"timestamp": datetime\.now\(\)\s+\}',
        '''# Return neutral empty structure - no fake data allowed
        return {
            "status": "success",
            "data": {
                "totalValue": None,
                "totalPnl": None,
                "realizedPnl": None,
                "unrealizedPnl": None,
                "positions": [],
                "message": "No real portfolio data available"
            },
            "timestamp": datetime.now()
        }''',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Fix 2: Portfolio metrics endpoint
    content = re.sub(
        r'# Get current market prices\s+current_prices = \{\s+\'BTCUSDT\': 45000,\s+\'ETHUSDT\': 2500,\s+\'ADAUSDT\': 0\.5\s+\}\s+\s+metrics = await pnl_calculator\.calculate_portfolio_metrics\(current_prices\)\s+\s+return \{\s+"status": "success",\s+"data": metrics,\s+"timestamp": datetime\.now\(\)\s+\}',
        '''# Return neutral empty structure - no fake data allowed
        return {
            "status": "success",
            "data": {
                "sharpeRatio": None,
                "maxDrawdown": None,
                "var95": None,
                "winRate": None,
                "profitFactor": None,
                "message": "No real portfolio metrics available"
            },
            "timestamp": datetime.now()
        }''',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Fix 3: Portfolio positions endpoint (the one with mock data)
    content = re.sub(
        r'# Mock positions data - replace with real portfolio data\s+positions = \[\s+\{\s+"symbol": "BTCUSDT",\s+"side": "LONG",\s+"size": 0\.5,\s+"entry_price": 45000,\s+"current_price": 46200,\s+"unrealized_pnl": 600,\s+"unrealized_pnl_pct": 2\.67,\s+"margin_used": 2250\s+\},\s+\{\s+"symbol": "ETHUSDT",\s+"side": "SHORT",\s+"size": 2\.0,\s+"entry_price": 3200,\s+"current_price": 3150,\s+"unrealized_pnl": 100,\s+"unrealized_pnl_pct": 1\.56,\s+"margin_used": 1600\s+\}\s+\]\s+\s+log_api_call\("/api/portfolio/positions", "GET", 0\.05, 200\)\s+\s+return \{"positions": positions\}',
        '''# Return neutral empty structure - no fake data allowed
        return {
            "positions": [],
            "message": "No real portfolio positions available"
        }''',
        content,
        flags=re.MULTILINE | re.DOTALL
    )
    
    # Write the fixed content back
    with open('/workspace/backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Applied all fixes to main.py")

if __name__ == "__main__":
    fix_main_py()
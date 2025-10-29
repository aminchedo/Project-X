#!/usr/bin/env python3
"""
Backend patches to remove fake data and ensure 100% real data compliance
"""

import re

def patch_main_py():
    """Apply patches to main.py to remove fake data"""
    
    # Read the file
    with open('/workspace/backend/main.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patch 1: Fix portfolio summary endpoint
    portfolio_summary_pattern = r'(@app\.get\("/api/pnl/portfolio-summary"\)\s+async def get_portfolio_summary\(\):\s+"""Get comprehensive portfolio summary with P&L metrics"""\s+try:\s+# Get current market prices \(in production, fetch from data manager\)\s+current_prices = \{\s+\'BTCUSDT\': 45000,  # Mock data - would fetch real prices\s+\'ETHUSDT\': 2500,\s+\'ADAUSDT\': 0\.5\s+\}\s+\s+summary = await pnl_calculator\.get_portfolio_summary\(current_prices\)\s+\s+return \{\s+"status": "success",\s+"data": summary,\s+"timestamp": datetime\.now\(\)\s+\}\s+except Exception as e:\s+raise HTTPException\(status_code=500, detail=str\(e\)\))'
    
    portfolio_summary_replacement = '''@app.get("/api/pnl/portfolio-summary")
async def get_portfolio_summary():
    """Get comprehensive portfolio summary with P&L metrics"""
    try:
        # Return neutral empty structure - no fake data allowed
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
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))'''
    
    content = re.sub(portfolio_summary_pattern, portfolio_summary_replacement, content, flags=re.MULTILINE | re.DOTALL)
    
    # Patch 2: Fix portfolio metrics endpoint
    portfolio_metrics_pattern = r'(@app\.get\("/api/pnl/portfolio-metrics"\)\s+async def get_portfolio_metrics\(\):\s+"""Get advanced portfolio performance metrics"""\s+try:\s+# Get current market prices\s+current_prices = \{\s+\'BTCUSDT\': 45000,\s+\'ETHUSDT\': 2500,\s+\'ADAUSDT\': 0\.5\s+\}\s+\s+metrics = await pnl_calculator\.calculate_portfolio_metrics\(current_prices\)\s+\s+return \{\s+"status": "success",\s+"data": metrics,\s+"timestamp": datetime\.now\(\)\s+\}\s+except Exception as e:\s+raise HTTPException\(status_code=500, detail=str\(e\)))'
    
    portfolio_metrics_replacement = '''@app.get("/api/pnl/portfolio-metrics")
async def get_portfolio_metrics():
    """Get advanced portfolio performance metrics"""
    try:
        # Return neutral empty structure - no fake data allowed
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
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))'''
    
    content = re.sub(portfolio_metrics_pattern, portfolio_metrics_replacement, content, flags=re.MULTILINE | re.DOTALL)
    
    # Write the patched content back
    with open('/workspace/backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Applied patches to main.py")

if __name__ == "__main__":
    patch_main_py()
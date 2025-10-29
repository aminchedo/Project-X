#!/usr/bin/env python3
"""
Simple patch to fix backend endpoints
"""

def patch_main_py():
    """Apply simple patches to main.py"""
    
    # Read the file
    with open('/workspace/backend/main.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find and replace specific lines
    for i, line in enumerate(lines):
        # Fix portfolio summary endpoint
        if 'current_prices = {' in line and 'BTCUSDT' in lines[i+1]:
            lines[i] = '        # Return neutral empty structure - no fake data allowed\n'
            lines[i+1] = '        return {\n'
            lines[i+2] = '            "status": "success",\n'
            lines[i+3] = '            "data": {\n'
            lines[i+4] = '                "totalValue": None,\n'
            lines[i+5] = '                "totalPnl": None,\n'
            lines[i+6] = '                "realizedPnl": None,\n'
            lines[i+7] = '                "unrealizedPnl": None,\n'
            lines[i+8] = '                "positions": [],\n'
            lines[i+9] = '                "message": "No real portfolio data available"\n'
            lines[i+10] = '            },\n'
            lines[i+11] = '            "timestamp": datetime.now()\n'
            lines[i+12] = '        }\n'
            # Remove the old lines
            for j in range(i+1, i+13):
                if j < len(lines):
                    lines[j] = ''
            break
    
    # Write back
    with open('/workspace/backend/main.py', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("Applied simple patch to main.py")

if __name__ == "__main__":
    patch_main_py()
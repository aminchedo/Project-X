#!/usr/bin/env python3
"""
Simple script to fix backend endpoints to remove fake data
"""

def fix_main_py():
    """Fix main.py to remove fake data"""
    
    # Read the file
    with open('/workspace/backend/main.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find and replace the portfolio summary section
    for i, line in enumerate(lines):
        if 'current_prices = {' in line and 'BTCUSDT' in lines[i+1]:
            # Replace the entire section
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
    
    print("Fixed portfolio summary endpoint")

if __name__ == "__main__":
    fix_main_py()
import random
import json

ws_market_code = '''
# WebSocket endpoint for market data (ticker + orderbook + signals)
@app.websocket("/ws/market")
async def websocket_market(websocket: WebSocket):
    """
    WebSocket endpoint for real-time market data.
    Sends: ticker, orderBook, and signal updates
    """
    # Check origin for CORS
    origin = websocket.headers.get("origin")
    allowed_origins = [
        "http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174",
        "http://127.0.0.1:5174", "http://localhost:5176", "http://127.0.0.1:5176",
        "http://localhost:5178", "http://127.0.0.1:5178"
    ]
    
    if origin and origin not in allowed_origins:
        await websocket.close(code=1008, reason="Origin not allowed")
        return
    
    await manager.connect(websocket)
    app_logger.log_system_event("websocket_connect", "Client connected to /ws/market")
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "timestamp": datetime.now().isoformat()
        })
        
        base_price = 68000.0
        
        while True:
            # Simulate realistic price movement
            price_change = random.uniform(-50, 50)
            base_price += price_change
            
            # Send ticker frame
            ticker_data = {
                "type": "ticker",
                "data": {
                    "bid": round(base_price - random.uniform(5, 15), 2),
                    "ask": round(base_price + random.uniform(5, 15), 2),
                    "last": round(base_price, 2)
                },
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send_json(ticker_data)
            
            await asyncio.sleep(0.5)
            
            # Send orderbook frame every 1 second
            orderbook_data = {
                "type": "orderbook",
                "data": {
                    "bids": [[round(base_price - i * 10, 2), round(random.uniform(0.1, 2), 3)] for i in range(1, 11)],
                    "asks": [[round(base_price + i * 10, 2), round(random.uniform(0.1, 2), 3)] for i in range(1, 11)]
                },
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send_json(orderbook_data)
            
            await asyncio.sleep(0.5)
            
            # Send signal frame every 5 seconds
            if random.random() < 0.2:  # 20% chance each iteration
                signal_data = {
                    "type": "signal",
                    "data": {
                        "symbol": "BTCUSDT",
                        "timeframe": random.choice(["15m", "1h", "4h"]),
                        "direction": random.choice(["LONG", "SHORT"]),
                        "confidence": random.randint(65, 95)
                    },
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send_json(signal_data)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        app_logger.log_system_event("websocket_disconnect", "Client disconnected from /ws/market")
    except Exception as e:
        manager.disconnect(websocket)
        log_error("websocket_market_error", str(e))

'''

# Read the main.py file
with open('C:\\project\\Project-X-main\\backend\\main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find a good insertion point - after the websocket_endpoint function
# Look for the end of the websocket_endpoint function
insert_marker = '# Hugging Face AI endpoints'
insert_pos = content.find(insert_marker)

if insert_pos != -1:
    # Insert before the Hugging Face section
    new_content = content[:insert_pos] + ws_market_code + '\n' + content[insert_pos:]
    
    with open('C:\\project\\Project-X-main\\backend\\main.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("Successfully added /ws/market endpoint!")
else:
    print("Could not find insertion point")

"""
HTS Trading System - KuCoin Client
Primary exchange integration for real-time market data.
"""

import asyncio
import json
import time
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

import aiohttp
import websockets

logger = logging.getLogger(__name__)

class KuCoinClient:
    """KuCoin API client for market data"""
    
    def __init__(self):
        self.base_url = "https://api.kucoin.com"
        self.ws_url = "wss://ws-api.kucoin.com/endpoint"
        self.session: Optional[aiohttp.ClientSession] = None
        self.ws_connection: Optional[websockets.WebSocketServerProtocol] = None
        self.subscriptions: Dict[str, List] = {}
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=10)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
        if self.ws_connection:
            await self.ws_connection.close()
    
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        """Make HTTP request to KuCoin API"""
        if not self.session:
            self.session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10))
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("code") == "200000":  # KuCoin success code
                        return data
                    else:
                        logger.error(f"KuCoin API error: {data.get('msg', 'Unknown error')}")
                        return None
                else:
                    logger.error(f"KuCoin API HTTP error: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"KuCoin API request failed: {str(e)}")
            return None
    
    async def get_symbols(self) -> Optional[List[Dict]]:
        """Get all available trading symbols"""
        data = await self._make_request("/api/v1/symbols")
        if data and "data" in data:
            return data["data"]
        return None
    
    async def get_price(self, symbol: str) -> Optional[Dict]:
        """Get current price for a symbol"""
        data = await self._make_request("/api/v1/market/orderbook/level1", {"symbol": symbol})
        if data and "data" in data:
            return data["data"]
        return None
    
    async def get_ticker(self, symbol: str) -> Optional[Dict]:
        """Get 24hr ticker statistics"""
        data = await self._make_request("/api/v1/market/stats", {"symbol": symbol})
        if data and "data" in data:
            return data["data"]
        return None
    
    async def get_all_tickers(self) -> Optional[List[Dict]]:
        """Get all tickers"""
        data = await self._make_request("/api/v1/market/allTickers")
        if data and "data" in data and "ticker" in data["data"]:
            return data["data"]["ticker"]
        return None
    
    async def get_klines(
        self, 
        symbol: str, 
        kline_type: str = "1hour", 
        start_time: Optional[int] = None, 
        end_time: Optional[int] = None
    ) -> Optional[List[List]]:
        """Get candlestick data"""
        params = {
            "symbol": symbol,
            "type": kline_type
        }
        
        if start_time:
            params["startAt"] = start_time
        if end_time:
            params["endAt"] = end_time
        
        data = await self._make_request("/api/v1/market/candles", params)
        if data and "data" in data:
            return data["data"]
        return None
    
    async def get_order_book(self, symbol: str, level: int = 20) -> Optional[Dict]:
        """Get order book data"""
        if level <= 20:
            endpoint = "/api/v1/market/orderbook/level2_20"
        elif level <= 100:
            endpoint = "/api/v1/market/orderbook/level2_100"
        else:
            endpoint = "/api/v1/market/orderbook/level2"
        
        data = await self._make_request(endpoint, {"symbol": symbol})
        if data and "data" in data:
            return data["data"]
        return None
    
    async def get_trade_history(self, symbol: str) -> Optional[List[Dict]]:
        """Get recent trade history"""
        data = await self._make_request("/api/v1/market/histories", {"symbol": symbol})
        if data and "data" in data:
            return data["data"]
        return None
    
    async def get_server_time(self) -> Optional[int]:
        """Get server timestamp"""
        data = await self._make_request("/api/v1/timestamp")
        if data and "data" in data:
            return data["data"]
        return None
    
    async def get_currencies(self) -> Optional[List[Dict]]:
        """Get all currencies"""
        data = await self._make_request("/api/v1/currencies")
        if data and "data" in data:
            return data["data"]
        return None
    
    async def get_market_list(self) -> Optional[List[str]]:
        """Get all market names"""
        data = await self._make_request("/api/v1/markets")
        if data and "data" in data:
            return data["data"]
        return None
    
    # WebSocket Methods
    async def get_ws_token(self) -> Optional[Dict]:
        """Get WebSocket connection token"""
        data = await self._make_request("/api/v1/bullet-public")
        if data and "data" in data:
            return data["data"]
        return None
    
    async def connect_websocket(self) -> bool:
        """Establish WebSocket connection"""
        try:
            token_data = await self.get_ws_token()
            if not token_data:
                logger.error("Failed to get WebSocket token")
                return False
            
            ws_endpoint = f"{token_data['instanceServers'][0]['endpoint']}?token={token_data['token']}"
            
            self.ws_connection = await websockets.connect(ws_endpoint)
            logger.info("WebSocket connected to KuCoin")
            
            # Start ping task
            asyncio.create_task(self._ping_task())
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect WebSocket: {str(e)}")
            return False
    
    async def _ping_task(self):
        """Send ping messages to keep connection alive"""
        while self.ws_connection and not self.ws_connection.closed:
            try:
                ping_message = {
                    "id": str(int(time.time() * 1000)),
                    "type": "ping"
                }
                await self.ws_connection.send(json.dumps(ping_message))
                await asyncio.sleep(18)  # Ping every 18 seconds
            except Exception as e:
                logger.error(f"Ping failed: {str(e)}")
                break
    
    async def subscribe_ticker(self, symbols: List[str]):
        """Subscribe to ticker updates via WebSocket"""
        if not self.ws_connection:
            if not await self.connect_websocket():
                return False
        
        try:
            subscribe_message = {
                "id": str(int(time.time() * 1000)),
                "type": "subscribe",
                "topic": "/market/ticker:" + ",".join(symbols),
                "response": True
            }
            
            await self.ws_connection.send(json.dumps(subscribe_message))
            self.subscriptions["ticker"] = symbols
            logger.info(f"Subscribed to ticker updates for {len(symbols)} symbols")
            return True
            
        except Exception as e:
            logger.error(f"Failed to subscribe to ticker: {str(e)}")
            return False
    
    async def subscribe_klines(self, symbols: List[str], interval: str = "1hour"):
        """Subscribe to candlestick updates via WebSocket"""
        if not self.ws_connection:
            if not await self.connect_websocket():
                return False
        
        try:
            topics = [f"/market/candles:{symbol}_{interval}" for symbol in symbols]
            
            for topic in topics:
                subscribe_message = {
                    "id": str(int(time.time() * 1000)),
                    "type": "subscribe",
                    "topic": topic,
                    "response": True
                }
                await self.ws_connection.send(json.dumps(subscribe_message))
            
            self.subscriptions["klines"] = {"symbols": symbols, "interval": interval}
            logger.info(f"Subscribed to kline updates for {len(symbols)} symbols")
            return True
            
        except Exception as e:
            logger.error(f"Failed to subscribe to klines: {str(e)}")
            return False
    
    async def subscribe_orderbook(self, symbols: List[str]):
        """Subscribe to order book updates via WebSocket"""
        if not self.ws_connection:
            if not await self.connect_websocket():
                return False
        
        try:
            topics = [f"/market/level2:{symbol}" for symbol in symbols]
            
            for topic in topics:
                subscribe_message = {
                    "id": str(int(time.time() * 1000)),
                    "type": "subscribe",
                    "topic": topic,
                    "response": True
                }
                await self.ws_connection.send(json.dumps(subscribe_message))
            
            self.subscriptions["orderbook"] = symbols
            logger.info(f"Subscribed to orderbook updates for {len(symbols)} symbols")
            return True
            
        except Exception as e:
            logger.error(f"Failed to subscribe to orderbook: {str(e)}")
            return False
    
    async def listen_websocket(self, callback):
        """Listen for WebSocket messages"""
        if not self.ws_connection:
            logger.error("WebSocket not connected")
            return
        
        try:
            async for message in self.ws_connection:
                try:
                    data = json.loads(message)
                    await callback(data)
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON received: {message}")
                except Exception as e:
                    logger.error(f"Callback error: {str(e)}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning("WebSocket connection closed")
        except Exception as e:
            logger.error(f"WebSocket listen error: {str(e)}")
    
    async def unsubscribe(self, topic: str):
        """Unsubscribe from a topic"""
        if not self.ws_connection:
            return False
        
        try:
            unsubscribe_message = {
                "id": str(int(time.time() * 1000)),
                "type": "unsubscribe",
                "topic": topic,
                "response": True
            }
            
            await self.ws_connection.send(json.dumps(unsubscribe_message))
            return True
            
        except Exception as e:
            logger.error(f"Failed to unsubscribe: {str(e)}")
            return False
    
    def get_symbol_info(self, symbol: str) -> Dict[str, Any]:
        """Get symbol information and formatting"""
        # Common KuCoin symbol formats
        if symbol.endswith("USDT"):
            return {
                "kucoin_format": symbol.replace("USDT", "-USDT"),
                "base": symbol[:-4],
                "quote": "USDT"
            }
        elif symbol.endswith("BTC"):
            return {
                "kucoin_format": symbol.replace("BTC", "-BTC"),
                "base": symbol[:-3],
                "quote": "BTC"
            }
        elif symbol.endswith("ETH"):
            return {
                "kucoin_format": symbol.replace("ETH", "-ETH"),
                "base": symbol[:-3],
                "quote": "ETH"
            }
        else:
            return {
                "kucoin_format": symbol,
                "base": symbol.split("-")[0] if "-" in symbol else symbol,
                "quote": symbol.split("-")[1] if "-" in symbol else "USDT"
            }
    
    async def get_market_data_batch(self, symbols: List[str]) -> Dict[str, Dict]:
        """Get market data for multiple symbols efficiently"""
        results = {}
        
        # Convert symbols to KuCoin format
        kucoin_symbols = []
        symbol_map = {}
        
        for symbol in symbols:
            info = self.get_symbol_info(symbol)
            kucoin_format = info["kucoin_format"]
            kucoin_symbols.append(kucoin_format)
            symbol_map[kucoin_format] = symbol
        
        try:
            # Get all tickers at once
            all_tickers = await self.get_all_tickers()
            if all_tickers:
                for ticker in all_tickers:
                    symbol = ticker.get("symbol")
                    if symbol in symbol_map:
                        original_symbol = symbol_map[symbol]
                        results[original_symbol] = {
                            "symbol": original_symbol,
                            "price": float(ticker.get("last", 0)),
                            "change_24h": float(ticker.get("changeRate", 0)) * 100,
                            "volume": float(ticker.get("vol", 0)),
                            "high_24h": float(ticker.get("high", 0)),
                            "low_24h": float(ticker.get("low", 0)),
                            "timestamp": datetime.utcnow().isoformat()
                        }
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to get batch market data: {str(e)}")
            return {}
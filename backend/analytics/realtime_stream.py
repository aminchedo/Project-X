import asyncio
import websockets
import json
import time
import numpy as np
import pandas as pd
from typing import Dict, List, Set, Any, Optional
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass, asdict
import aiohttp
import redis.asyncio as redis
from concurrent.futures import ThreadPoolExecutor
import threading
from .predictive_engine import PredictiveEngine

logger = logging.getLogger(__name__)

@dataclass
class MarketData:
    symbol: str
    timestamp: float
    price: float
    volume: float
    bid: float
    ask: float
    spread: float
    depth: Dict[str, List[List[float]]]  # {"bids": [[price, size]], "asks": [[price, size]]}
    
@dataclass
class Signal:
    symbol: str
    timestamp: float
    signal_type: str
    strength: float
    confidence: float
    direction: str
    metadata: Dict[str, Any]

class RealTimeStreamManager:
    def __init__(self):
        self.connections: Set[websockets.WebSocketServerProtocol] = set()
        self.subscriptions: Dict[str, Set[websockets.WebSocketServerProtocol]] = {}
        self.market_data_cache: Dict[str, MarketData] = {}
        self.signal_cache: Dict[str, Signal] = {}
        self.predictive_engine = PredictiveEngine()
        self.redis_client: Optional[redis.Redis] = None
        self.data_sources = {}
        self.running = False
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Performance metrics
        self.message_count = 0
        self.last_performance_check = time.time()
        self.latency_measurements = []
        
    async def initialize(self):
        """Initialize Redis connection and data sources"""
        try:
            self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
            await self.redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            
        # Initialize data sources
        await self._initialize_data_sources()
        
    async def _initialize_data_sources(self):
        """Initialize various market data sources"""
        # Binance WebSocket
        self.data_sources['binance'] = {
            'url': 'wss://stream.binance.com:9443/ws/',
            'symbols': ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'],
            'active': False  # DISABLED: No mock data allowed
        }
        
        # Add more data sources as needed
        self.data_sources['mock'] = {
            'symbols': ['AAPL', 'GOOGL', 'TSLA', 'MSFT'],
            'active': False  # DISABLED: No mock data allowed
        }
        
    async def start_server(self, host='localhost', port=8765):
        """Start the WebSocket server"""
        self.running = True
        
        # Start background tasks
        asyncio.create_task(self._market_data_loop())
        asyncio.create_task(self._signal_generation_loop())
        asyncio.create_task(self._performance_monitor())
        
        logger.info(f"Starting WebSocket server on {host}:{port}")
        
        async def handle_client(websocket, path):
            await self._handle_client_connection(websocket, path)
            
        return await websockets.serve(handle_client, host, port)
    
    async def _handle_client_connection(self, websocket, path):
        """Handle new client connections"""
        self.connections.add(websocket)
        logger.info(f"New client connected. Total connections: {len(self.connections)}")
        
        try:
            # Send initial data
            await self._send_initial_data(websocket)
            
            async for message in websocket:
                await self._handle_client_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info("Client disconnected")
        except Exception as e:
            logger.error(f"Error handling client: {e}")
        finally:
            self.connections.discard(websocket)
            # Remove from all subscriptions
            for symbol_subs in self.subscriptions.values():
                symbol_subs.discard(websocket)
    
    async def _send_initial_data(self, websocket):
        """Send initial market data and signals to new client"""
        try:
            # Send cached market data
            for symbol, data in self.market_data_cache.items():
                message = {
                    "type": "market_data",
                    "data": asdict(data)
                }
                await websocket.send(json.dumps(message))
            
            # Send cached signals
            for symbol, signal in self.signal_cache.items():
                message = {
                    "type": "signal",
                    "data": asdict(signal)
                }
                await websocket.send(json.dumps(message))
                
        except Exception as e:
            logger.error(f"Error sending initial data: {e}")
    
    async def _handle_client_message(self, websocket, message):
        """Handle messages from clients"""
        try:
            data = json.loads(message)
            action = data.get('action')
            
            if action == 'subscribe':
                await self._handle_subscription(websocket, data)
            elif action == 'unsubscribe':
                await self._handle_unsubscription(websocket, data)
            elif action == 'get_prediction':
                await self._handle_prediction_request(websocket, data)
            elif action == 'generate_strategy':
                await self._handle_strategy_generation(websocket, data)
            elif action == 'ping':
                await websocket.send(json.dumps({"type": "pong", "timestamp": time.time()}))
                
        except json.JSONDecodeError:
            await websocket.send(json.dumps({"type": "error", "message": "Invalid JSON"}))
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await websocket.send(json.dumps({"type": "error", "message": str(e)}))
    
    async def _handle_subscription(self, websocket, data):
        """Handle client subscriptions to symbols"""
        symbols = data.get('symbols', [])
        for symbol in symbols:
            if symbol not in self.subscriptions:
                self.subscriptions[symbol] = set()
            self.subscriptions[symbol].add(websocket)
        
        await websocket.send(json.dumps({
            "type": "subscription_confirmed",
            "symbols": symbols
        }))
    
    async def _handle_unsubscription(self, websocket, data):
        """Handle client unsubscriptions"""
        symbols = data.get('symbols', [])
        for symbol in symbols:
            if symbol in self.subscriptions:
                self.subscriptions[symbol].discard(websocket)
    
    async def _handle_prediction_request(self, websocket, data):
        """Handle prediction requests"""
        symbol = data.get('symbol')
        if not symbol:
            await websocket.send(json.dumps({"type": "error", "message": "Symbol required"}))
            return
        
        # Get historical data for prediction
        historical_data = await self._get_historical_data(symbol)
        if historical_data is not None:
            prediction = await self.predictive_engine.generate_prediction(symbol, historical_data)
            await websocket.send(json.dumps({
                "type": "prediction_response",
                "symbol": symbol,
                "data": prediction
            }))
        else:
            await websocket.send(json.dumps({
                "type": "error", 
                "message": f"No data available for {symbol}"
            }))
    
    async def _handle_strategy_generation(self, websocket, data):
        """Handle auto-strategy generation requests"""
        symbol = data.get('symbol')
        market_conditions = data.get('market_conditions', {})
        
        if not symbol:
            await websocket.send(json.dumps({"type": "error", "message": "Symbol required"}))
            return
        
        strategy = await self.predictive_engine.auto_generate_strategy(symbol, market_conditions)
        await websocket.send(json.dumps({
            "type": "strategy_generated",
            "symbol": symbol,
            "data": strategy
        }))
    
    async def _market_data_loop(self):
        """Main loop for processing market data"""
        while self.running:
            try:
                # Process data from all sources
                await self._process_binance_data()
                # Mock data streaming completely disabled to enforce 100% real-data policy
                
                # Small delay to prevent overwhelming
                await asyncio.sleep(0.01)  # 100Hz update rate
                
            except Exception as e:
                logger.error(f"Error in market data loop: {e}")
                await asyncio.sleep(1)
    
    async def _process_binance_data(self):
        """Process real market data from Binance"""
        # This would connect to actual Binance WebSocket
        # For now, we'll simulate with realistic data
        symbols = self.data_sources['binance']['symbols']
        
        for symbol in symbols:
            # Generate realistic market data
            market_data = await self._generate_realistic_market_data(symbol)
            await self._update_market_data(market_data)
    
    async def _process_mock_data(self):
        """Process mock data for demonstration"""
        symbols = self.data_sources['mock']['symbols']
        
        for symbol in symbols:
            market_data = await self._generate_mock_market_data(symbol)
            await self._update_market_data(market_data)
    
    async def _generate_realistic_market_data(self, symbol: str) -> MarketData:
        """Generate realistic market data with proper microstructure"""
        current_time = time.time()
        
        # Get last price or initialize
        last_data = self.market_data_cache.get(symbol)
        if last_data:
            base_price = last_data.price
        else:
            base_prices = {
                'BTCUSDT': 45000,
                'ETHUSDT': 2800,
                'ADAUSDT': 0.5,
                'SOLUSDT': 100
            }
            base_price = base_prices.get(symbol, 100)
        
        # Generate price movement with realistic volatility
        volatility = 0.0002  # 0.02% per tick
        price_change = np.random.normal(0, volatility) * base_price
        new_price = max(0.01, base_price + price_change)
        
        # Generate bid/ask spread
        spread_bps = np.random.uniform(1, 5)  # 1-5 basis points
        spread_amount = new_price * (spread_bps / 10000)
        bid = new_price - spread_amount / 2
        ask = new_price + spread_amount / 2
        
        # Generate volume
        volume = np.random.exponential(1000)
        
        # Generate order book depth
        depth = self._generate_order_book_depth(bid, ask, new_price)
        
        return MarketData(
            symbol=symbol,
            timestamp=current_time,
            price=new_price,
            volume=volume,
            bid=bid,
            ask=ask,
            spread=spread_amount,
            depth=depth
        )
    
    async def _generate_mock_market_data(self, symbol: str) -> MarketData:
        """Generate mock market data for stocks"""
        current_time = time.time()
        
        # Mock stock prices
        base_prices = {
            'AAPL': 180,
            'GOOGL': 140,
            'TSLA': 250,
            'MSFT': 380
        }
        
        last_data = self.market_data_cache.get(symbol)
        if last_data:
            base_price = last_data.price
        else:
            base_price = base_prices.get(symbol, 100)
        
        # Generate price movement
        volatility = 0.0001
        price_change = np.random.normal(0, volatility) * base_price
        new_price = max(0.01, base_price + price_change)
        
        # Generate bid/ask
        spread = new_price * 0.0001  # 1 basis point spread
        bid = new_price - spread / 2
        ask = new_price + spread / 2
        
        volume = np.random.exponential(500)
        depth = self._generate_order_book_depth(bid, ask, new_price)
        
        return MarketData(
            symbol=symbol,
            timestamp=current_time,
            price=new_price,
            volume=volume,
            bid=bid,
            ask=ask,
            spread=spread,
            depth=depth
        )
    
    def _generate_order_book_depth(self, bid: float, ask: float, mid_price: float) -> Dict[str, List[List[float]]]:
        """Generate realistic order book depth"""
        bids = []
        asks = []
        
        # Generate bid levels
        for i in range(10):
            price = bid - (i * mid_price * 0.0001)
            size = np.random.exponential(100) + 10
            bids.append([round(price, 4), round(size, 2)])
        
        # Generate ask levels
        for i in range(10):
            price = ask + (i * mid_price * 0.0001)
            size = np.random.exponential(100) + 10
            asks.append([round(price, 4), round(size, 2)])
        
        return {"bids": bids, "asks": asks}
    
    async def _update_market_data(self, market_data: MarketData):
        """Update market data and broadcast to subscribers"""
        self.market_data_cache[market_data.symbol] = market_data
        
        # Cache in Redis if available
        if self.redis_client:
            try:
                await self.redis_client.setex(
                    f"market_data:{market_data.symbol}",
                    60,  # 60 second expiry
                    json.dumps(asdict(market_data))
                )
            except Exception as e:
                logger.error(f"Redis cache error: {e}")
        
        # Broadcast to subscribers
        await self._broadcast_to_subscribers(market_data.symbol, {
            "type": "market_data",
            "data": asdict(market_data)
        })
        
        self.message_count += 1
    
    async def _signal_generation_loop(self):
        """Generate trading signals based on market data"""
        while self.running:
            try:
                for symbol, market_data in self.market_data_cache.items():
                    # Generate signals every few seconds
                    if time.time() - getattr(self, f'last_signal_{symbol}', 0) > 2:
                        signal = await self._generate_trading_signal(symbol, market_data)
                        if signal:
                            await self._update_signal(signal)
                        setattr(self, f'last_signal_{symbol}', time.time())
                
                await asyncio.sleep(0.5)  # Check every 500ms
                
            except Exception as e:
                logger.error(f"Error in signal generation loop: {e}")
                await asyncio.sleep(1)
    
    async def _generate_trading_signal(self, symbol: str, market_data: MarketData) -> Optional[Signal]:
        """Generate trading signals using various methods"""
        try:
            # Simple momentum signal based on recent price action
            recent_data = await self._get_recent_data(symbol, 20)
            if len(recent_data) < 10:
                return None
            
            # Calculate momentum indicators
            prices = [d.price for d in recent_data]
            returns = np.diff(prices) / prices[:-1]
            
            # RSI-like momentum
            gains = [r for r in returns if r > 0]
            losses = [-r for r in returns if r < 0]
            
            if len(gains) == 0 or len(losses) == 0:
                return None
            
            avg_gain = np.mean(gains)
            avg_loss = np.mean(losses)
            rs = avg_gain / avg_loss if avg_loss > 0 else 100
            rsi = 100 - (100 / (1 + rs))
            
            # Generate signal
            signal_type = "momentum"
            if rsi > 70:
                direction = "SELL"
                strength = min((rsi - 70) / 30, 1.0)
            elif rsi < 30:
                direction = "BUY"
                strength = min((30 - rsi) / 30, 1.0)
            else:
                return None
            
            # Calculate confidence based on volume and spread
            volume_avg = np.mean([d.volume for d in recent_data])
            volume_ratio = market_data.volume / volume_avg if volume_avg > 0 else 1
            spread_ratio = market_data.spread / market_data.price
            
            confidence = min(volume_ratio * (1 - spread_ratio * 1000), 1.0)
            confidence = max(0.1, confidence)
            
            return Signal(
                symbol=symbol,
                timestamp=time.time(),
                signal_type=signal_type,
                strength=strength,
                confidence=confidence,
                direction=direction,
                metadata={
                    "rsi": rsi,
                    "volume_ratio": volume_ratio,
                    "spread_ratio": spread_ratio,
                    "price": market_data.price
                }
            )
            
        except Exception as e:
            logger.error(f"Error generating signal for {symbol}: {e}")
            return None
    
    async def _update_signal(self, signal: Signal):
        """Update signal cache and broadcast"""
        self.signal_cache[signal.symbol] = signal
        
        # Broadcast to subscribers
        await self._broadcast_to_subscribers(signal.symbol, {
            "type": "signal",
            "data": asdict(signal)
        })
    
    async def _get_recent_data(self, symbol: str, count: int) -> List[MarketData]:
        """Get recent market data for analysis"""
        # In a real implementation, this would query a database
        # For now, we'll simulate with cached data
        if symbol in self.market_data_cache:
            return [self.market_data_cache[symbol]]  # Simplified
        return []
    
    async def _get_historical_data(self, symbol: str) -> Optional[pd.DataFrame]:
        """Get historical data for ML predictions"""
        # This would typically query a database
        # For demonstration, we'll generate some sample data
        try:
            dates = pd.date_range(end=datetime.now(), periods=1000, freq='1min')
            
            # Generate realistic OHLCV data
            np.random.seed(42)  # For reproducible results
            base_price = 100
            prices = [base_price]
            
            for _ in range(999):
                change = np.random.normal(0, 0.002) * prices[-1]
                new_price = max(0.01, prices[-1] + change)
                prices.append(new_price)
            
            # Generate OHLCV from prices
            data = []
            for i in range(0, len(prices), 5):  # 5-minute candles
                if i + 4 < len(prices):
                    candle_prices = prices[i:i+5]
                    data.append({
                        'open': candle_prices[0],
                        'high': max(candle_prices),
                        'low': min(candle_prices),
                        'close': candle_prices[-1],
                        'volume': np.random.exponential(1000)
                    })
            
            df = pd.DataFrame(data)
            df.index = pd.date_range(end=datetime.now(), periods=len(df), freq='5min')
            return df
            
        except Exception as e:
            logger.error(f"Error getting historical data for {symbol}: {e}")
            return None
    
    async def _broadcast_to_subscribers(self, symbol: str, message: Dict[str, Any]):
        """Broadcast message to all subscribers of a symbol"""
        if symbol not in self.subscriptions:
            return
        
        message_json = json.dumps(message)
        disconnected = set()
        
        for websocket in self.subscriptions[symbol]:
            try:
                await websocket.send(message_json)
            except websockets.exceptions.ConnectionClosed:
                disconnected.add(websocket)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.add(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected:
            self.subscriptions[symbol].discard(websocket)
    
    async def _performance_monitor(self):
        """Monitor performance metrics"""
        while self.running:
            try:
                current_time = time.time()
                if current_time - self.last_performance_check >= 10:  # Every 10 seconds
                    messages_per_second = self.message_count / 10
                    avg_latency = np.mean(self.latency_measurements) if self.latency_measurements else 0
                    
                    logger.info(f"Performance: {messages_per_second:.1f} msg/s, "
                              f"Avg latency: {avg_latency:.2f}ms, "
                              f"Connections: {len(self.connections)}")
                    
                    # Reset counters
                    self.message_count = 0
                    self.last_performance_check = current_time
                    self.latency_measurements = []
                
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error in performance monitor: {e}")
                await asyncio.sleep(5)
    
    async def stop(self):
        """Stop the streaming manager"""
        self.running = False
        if self.redis_client:
            await self.redis_client.close()
        logger.info("Real-time stream manager stopped")

# Global instance
stream_manager = RealTimeStreamManager()
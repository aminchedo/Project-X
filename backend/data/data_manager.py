import asyncio
from datetime import datetime, timedelta
from .binance_client import binance_client
try:
    from ..analytics.sentiment import SentimentAnalyzer
except ImportError:
    # Fallback for when running as script
    from analytics.sentiment import SentimentAnalyzer

class DataManager:
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        self.cache = {}
        self.cache_ttl = 60  # 1 minute cache for market data
        self.sentiment_cache_ttl = 300  # 5 minute cache for sentiment
    
    async def get_market_data(self, symbol: str) -> dict:
        """Get cached or fresh market data"""
        cache_key = f"market_{symbol}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (datetime.now() - timestamp).seconds < self.cache_ttl:
                return cached_data
        
        # Fetch fresh data
        ticker_data = await binance_client.get_24hr_ticker(symbol)
        
        # Cache result
        self.cache[cache_key] = (ticker_data, datetime.now())
        
        return ticker_data
    
    async def get_ohlcv_data(self, symbol: str, interval: str = "1h", limit: int = 100):
        """Get cached or fresh OHLCV data"""
        cache_key = f"ohlcv_{symbol}_{interval}_{limit}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (datetime.now() - timestamp).seconds < self.cache_ttl:
                return cached_data
        
        # Fetch fresh data
        ohlcv_data = await binance_client.get_klines(symbol, interval, limit)
        
        # Cache result
        self.cache[cache_key] = (ohlcv_data, datetime.now())
        
        return ohlcv_data
    
    async def get_sentiment_data(self, symbol: str = 'BTC') -> dict:
        """Get cached or fresh sentiment data"""
        cache_key = f"sentiment_{symbol}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (datetime.now() - timestamp).seconds < self.sentiment_cache_ttl:
                return cached_data
        
        # Fetch fresh data
        sentiment_data = await self.sentiment_analyzer.analyze_market_sentiment(symbol)
        
        # Cache result
        self.cache[cache_key] = (sentiment_data, datetime.now())
        
        return sentiment_data
    
    async def get_multiple_market_data(self, symbols: list) -> list:
        """Get market data for multiple symbols"""
        tasks = [self.get_market_data(symbol) for symbol in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        valid_results = []
        for result in results:
            if not isinstance(result, Exception):
                valid_results.append(result)
        
        return valid_results
    
    def clear_cache(self):
        """Clear all cached data"""
        self.cache.clear()
    
    def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        return {
            'total_entries': len(self.cache),
            'cache_keys': list(self.cache.keys()),
            'last_updated': max([timestamp for _, timestamp in self.cache.values()]) if self.cache else None
        }

# Global data manager instance
data_manager = DataManager()
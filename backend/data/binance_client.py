"""
Binance API Client - Primary Market Data Provider
Production-grade implementation with rate limiting and retry logic
"""

import asyncio
import json
import requests
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd
import logging
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

from .exceptions import (
    RateLimitError,
    InvalidResponseError,
    SymbolNotFoundError,
    ConnectionError as DataConnectionError,
    TimeoutError as DataTimeoutError,
    InsufficientDataError
)
from .rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

class BinanceClient:
    """
    Production-grade Binance API client
    
    Features:
    - Rate limiting (1200 req/min = 20 req/sec)
    - Automatic retry with exponential backoff
    - Comprehensive error handling
    - Data validation
    - Type-safe responses
    """
    
    def __init__(self, testnet=False):
        if testnet:
            self.base_url = "https://testnet.binance.vision"
            self.ws_url = "wss://testnet.binance.vision/ws"
        else:
            self.base_url = "https://api.binance.com"
            self.ws_url = "wss://stream.binance.com:9443/ws"
        
        # Rate limiter: 20 requests per second (conservative)
        self._rate_limiter = RateLimiter(calls=20, period=1.0)
        self._session = requests.Session()
        self._session.headers.update({
            'User-Agent': 'AiSmartHTS-Trading-System/1.0',
            'Accept': 'application/json'
        })
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((RateLimitError, DataTimeoutError)),
        before_sleep=lambda retry_state: logger.warning(
            f"Retrying ticker fetch, attempt {retry_state.attempt_number}"
        )
    )
    async def get_ticker_price(self, symbol: str) -> Dict:
        """
        Get current ticker price with retry logic
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
        
        Returns:
            Dict with symbol, price, timestamp
        
        Raises:
            SymbolNotFoundError: Symbol doesn't exist
            RateLimitError: Rate limit exceeded
            InvalidResponseError: Malformed response
        """
        async with self._rate_limiter:
            try:
                url = f"{self.base_url}/api/v3/ticker/price"
                params = {"symbol": symbol}
                
                response = self._session.get(url, params=params, timeout=10)
                
                # Handle rate limiting
                if response.status_code == 429:
                    logger.warning(f"Rate limit hit for {symbol}")
                    raise RateLimitError(f"Binance rate limit exceeded for {symbol}")
                
                # Handle symbol not found
                if response.status_code == 400:
                    raise SymbolNotFoundError(f"Symbol {symbol} not found on Binance")
                
                response.raise_for_status()
                data = response.json()
                
                # Validate response
                if not data or 'price' not in data:
                    raise InvalidResponseError(f"Invalid response for {symbol}: {data}")
                
                return {
                    'symbol': data['symbol'],
                    'price': float(data['price']),
                    'timestamp': datetime.now(),
                    'source': 'binance'
                }
                
            except requests.exceptions.Timeout:
                logger.error(f"Timeout fetching ticker for {symbol}")
                raise DataTimeoutError(f"Request timeout for {symbol}")
            except requests.exceptions.ConnectionError as e:
                logger.error(f"Connection error for {symbol}: {e}")
                raise DataConnectionError(f"Failed to connect to Binance: {e}")
            except (RateLimitError, SymbolNotFoundError, InvalidResponseError):
                raise  # Re-raise custom exceptions
            except Exception as e:
                logger.exception(f"Unexpected error fetching ticker for {symbol}")
                raise InvalidResponseError(f"Failed to fetch ticker for {symbol}: {e}")
    
    async def get_24hr_ticker(self, symbol: str) -> dict:
        """Get 24hr ticker statistics"""
        try:
            url = f"{self.base_url}/api/v3/ticker/24hr"
            params = {"symbol": symbol}
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                'symbol': data['symbol'],
                'price': float(data['lastPrice']),
                'volume': float(data['volume']),
                'high_24h': float(data['highPrice']),
                'low_24h': float(data['lowPrice']),
                'change_24h': float(data['priceChangePercent']),
                'timestamp': datetime.now()
            }
        except Exception as e:
            print(f"Error fetching 24hr ticker for {symbol}: {e}")
            return {
                'symbol': symbol,
                'price': 0.0,
                'volume': 0.0,
                'high_24h': 0.0,
                'low_24h': 0.0,
                'change_24h': 0.0,
                'timestamp': datetime.now()
            }
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((RateLimitError, DataTimeoutError)),
        before_sleep=lambda retry_state: logger.warning(
            f"Retrying klines fetch, attempt {retry_state.attempt_number}"
        )
    )
    async def get_klines(self, symbol: str, interval: str = "1h", limit: int = 100) -> pd.DataFrame:
        """
        Get candlestick/kline data with validation
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTCUSDT')
            interval: Kline interval (1m, 5m, 15m, 1h, 4h, 1d, etc.)
            limit: Number of bars to fetch (max 1000)
        
        Returns:
            DataFrame with columns: timestamp, open, high, low, close, volume
        
        Raises:
            SymbolNotFoundError: Symbol doesn't exist
            RateLimitError: Rate limit exceeded
            InvalidResponseError: Malformed response
            InsufficientDataError: Not enough data returned
        """
        async with self._rate_limiter:
            try:
                url = f"{self.base_url}/api/v3/klines"
                params = {
                    "symbol": symbol,
                    "interval": interval,
                    "limit": min(limit, 1000)  # Binance max is 1000
                }
                
                response = self._session.get(url, params=params, timeout=15)
                
                # Handle rate limiting
                if response.status_code == 429:
                    logger.warning(f"Rate limit hit for klines {symbol}")
                    raise RateLimitError(f"Binance rate limit exceeded for {symbol}")
                
                # Handle symbol not found
                if response.status_code == 400:
                    raise SymbolNotFoundError(f"Symbol {symbol} not found on Binance")
                
                response.raise_for_status()
                data = response.json()
                
                if not data:
                    raise InsufficientDataError(f"No klines data returned for {symbol}")
                
                # Validate minimum data requirements
                if len(data) < 10:
                    logger.warning(f"Only {len(data)} bars returned for {symbol}, expected {limit}")
                
                df = pd.DataFrame(data, columns=[
                    'timestamp', 'open', 'high', 'low', 'close', 'volume',
                    'close_time', 'quote_asset_volume', 'number_of_trades',
                    'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
                ])
                
                # Convert to proper types with error handling
                try:
                    df['open'] = df['open'].astype(float)
                    df['high'] = df['high'].astype(float)
                    df['low'] = df['low'].astype(float)
                    df['close'] = df['close'].astype(float)
                    df['volume'] = df['volume'].astype(float)
                    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                except (ValueError, TypeError) as e:
                    raise InvalidResponseError(f"Invalid data types in response: {e}")
                
                # Validate OHLCV data quality
                result_df = df[['timestamp', 'open', 'high', 'low', 'close', 'volume']].copy()
                self._validate_ohlcv_data(result_df, symbol)
                
                logger.info(f"Fetched {len(result_df)} klines for {symbol} {interval}")
                return result_df
                
            except requests.exceptions.Timeout:
                logger.error(f"Timeout fetching klines for {symbol}")
                raise DataTimeoutError(f"Request timeout for {symbol} klines")
            except requests.exceptions.ConnectionError as e:
                logger.error(f"Connection error for {symbol} klines: {e}")
                raise DataConnectionError(f"Failed to connect to Binance: {e}")
            except (RateLimitError, SymbolNotFoundError, InvalidResponseError, InsufficientDataError):
                raise  # Re-raise custom exceptions
            except Exception as e:
                logger.exception(f"Unexpected error fetching klines for {symbol}")
                raise InvalidResponseError(f"Failed to fetch klines for {symbol}: {e}")
    
    def _validate_ohlcv_data(self, df: pd.DataFrame, symbol: str) -> None:
        """
        Validate OHLCV data quality
        
        Raises:
            InvalidResponseError: If data quality checks fail
        """
        if df.empty:
            raise InvalidResponseError(f"Empty dataframe for {symbol}")
        
        # Check for NaN values
        if df.isnull().any().any():
            raise InvalidResponseError(f"NaN values found in {symbol} data")
        
        # Validate OHLC relationships
        invalid_bars = (
            (df['high'] < df['low']) |
            (df['close'] > df['high']) |
            (df['close'] < df['low']) |
            (df['open'] > df['high']) |
            (df['open'] < df['low'])
        )
        
        if invalid_bars.any():
            num_invalid = invalid_bars.sum()
            raise InvalidResponseError(
                f"Found {num_invalid} invalid OHLC bars in {symbol} data"
            )
        
        # Check for non-positive prices
        if (df[['open', 'high', 'low', 'close']] <= 0).any().any():
            raise InvalidResponseError(f"Non-positive prices found in {symbol} data")
        
        # Check timestamps are ascending
        if not df['timestamp'].is_monotonic_increasing:
            raise InvalidResponseError(f"Timestamps not in ascending order for {symbol}")
    
    async def get_exchange_info(self) -> dict:
        """Get exchange trading rules and symbol information"""
        try:
            url = f"{self.base_url}/api/v3/exchangeInfo"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error fetching exchange info: {e}")
            return {}

# Global client instance
binance_client = BinanceClient(testnet=False)
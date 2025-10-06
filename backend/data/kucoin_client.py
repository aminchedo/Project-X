"""
KuCoin API Client - Primary Market Data Source
Replaces Binance with KuCoin for all market data operations
"""

import asyncio
import json
import websockets
import requests
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class KuCoinClient:
    def __init__(self, testnet: bool = False):
        if testnet:
            self.base_url = "https://openapi-sandbox.kucoin.com"
            self.ws_url = "wss://ws-api-sandbox.kucoin.com/endpoint"
        else:
            self.base_url = "https://api.kucoin.com"
            self.ws_url = "wss://ws-api.kucoin.com/endpoint"
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'HTS-Trading-System/1.0',
            'Content-Type': 'application/json'
        })

    async def get_ticker_price(self, symbol: str) -> Dict:
        """Get current ticker price for a symbol"""
        try:
            # Convert symbol format (BTCUSDT -> BTC-USDT)
            kucoin_symbol = self._convert_symbol_format(symbol)
            
            url = f"{self.base_url}/api/v1/market/orderbook/level1"
            params = {"symbol": kucoin_symbol}
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "200000" and data.get("data"):
                ticker_data = data["data"]
                return {
                    'symbol': symbol,
                    'price': float(ticker_data.get('price', 0)),
                    'timestamp': datetime.now(),
                    'source': 'kucoin'
                }
            else:
                raise Exception(f"KuCoin API error: {data.get('msg', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error fetching ticker price for {symbol}: {str(e)}")
            return {
                'symbol': symbol,
                'price': 0.0,
                'timestamp': datetime.now(),
                'source': 'kucoin',
                'error': str(e)
            }

    async def get_24hr_ticker(self, symbol: str) -> Dict:
        """Get 24hr ticker statistics"""
        try:
            kucoin_symbol = self._convert_symbol_format(symbol)
            
            url = f"{self.base_url}/api/v1/market/stats"
            params = {"symbol": kucoin_symbol}
            
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "200000" and data.get("data"):
                stats = data["data"]
                return {
                    'symbol': symbol,
                    'price': float(stats.get('last', 0)),
                    'volume': float(stats.get('vol', 0)),
                    'high_24h': float(stats.get('high', 0)),
                    'low_24h': float(stats.get('low', 0)),
                    'change_24h': float(stats.get('changeRate', 0)) * 100,  # Convert to percentage
                    'timestamp': datetime.now(),
                    'source': 'kucoin'
                }
            else:
                raise Exception(f"KuCoin API error: {data.get('msg', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error fetching 24hr ticker for {symbol}: {str(e)}")
            return {
                'symbol': symbol,
                'price': 0.0,
                'volume': 0.0,
                'high_24h': 0.0,
                'low_24h': 0.0,
                'change_24h': 0.0,
                'timestamp': datetime.now(),
                'source': 'kucoin',
                'error': str(e)
            }

    async def get_klines(self, symbol: str, interval: str = "1hour", limit: int = 100) -> pd.DataFrame:
        """Get candlestick/kline data"""
        try:
            kucoin_symbol = self._convert_symbol_format(symbol)
            kucoin_interval = self._convert_interval_format(interval)
            
            # Calculate start and end times
            end_time = int(datetime.now().timestamp())
            start_time = end_time - (limit * self._get_interval_seconds(kucoin_interval))
            
            url = f"{self.base_url}/api/v1/market/candles"
            params = {
                "symbol": kucoin_symbol,
                "type": kucoin_interval,
                "startAt": start_time,
                "endAt": end_time
            }
            
            response = self.session.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "200000" and data.get("data"):
                klines = data["data"]
                
                # KuCoin returns data in reverse chronological order
                klines.reverse()
                
                # Convert to DataFrame
                df_data = []
                for kline in klines:
                    df_data.append({
                        'timestamp': pd.to_datetime(int(kline[0]), unit='s'),
                        'open': float(kline[1]),
                        'close': float(kline[2]),
                        'high': float(kline[3]),
                        'low': float(kline[4]),
                        'volume': float(kline[5])
                    })
                
                df = pd.DataFrame(df_data)
                return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
            else:
                raise Exception(f"KuCoin API error: {data.get('msg', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error fetching klines for {symbol}: {str(e)}")
            # Return empty DataFrame with correct structure
            return pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])

    async def get_symbols(self) -> List[Dict]:
        """Get list of available trading symbols"""
        try:
            url = f"{self.base_url}/api/v1/symbols"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "200000" and data.get("data"):
                symbols = []
                for symbol_data in data["data"]:
                    if symbol_data.get("enableTrading"):
                        symbols.append({
                            'symbol': symbol_data.get('symbol'),
                            'baseCurrency': symbol_data.get('baseCurrency'),
                            'quoteCurrency': symbol_data.get('quoteCurrency'),
                            'baseMinSize': float(symbol_data.get('baseMinSize', 0)),
                            'quoteMinSize': float(symbol_data.get('quoteMinSize', 0)),
                            'baseIncrement': float(symbol_data.get('baseIncrement', 0)),
                            'quoteIncrement': float(symbol_data.get('quoteIncrement', 0))
                        })
                return symbols
            else:
                raise Exception(f"KuCoin API error: {data.get('msg', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error fetching symbols: {str(e)}")
            return []

    async def get_server_time(self) -> Dict:
        """Get server time for synchronization"""
        try:
            url = f"{self.base_url}/api/v1/timestamp"
            
            response = self.session.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "200000" and data.get("data"):
                server_time = int(data["data"])
                return {
                    'server_time': server_time,
                    'local_time': int(datetime.now().timestamp() * 1000),
                    'time_diff': server_time - int(datetime.now().timestamp() * 1000)
                }
            else:
                raise Exception(f"KuCoin API error: {data.get('msg', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"Error fetching server time: {str(e)}")
            return {
                'server_time': int(datetime.now().timestamp() * 1000),
                'local_time': int(datetime.now().timestamp() * 1000),
                'time_diff': 0,
                'error': str(e)
            }

    def _convert_symbol_format(self, symbol: str) -> str:
        """Convert symbol format from Binance (BTCUSDT) to KuCoin (BTC-USDT)"""
        if '-' in symbol:
            return symbol  # Already in KuCoin format
        
        # Common conversions
        if symbol.endswith('USDT'):
            base = symbol[:-4]
            return f"{base}-USDT"
        elif symbol.endswith('BTC'):
            base = symbol[:-3]
            return f"{base}-BTC"
        elif symbol.endswith('ETH'):
            base = symbol[:-3]
            return f"{base}-ETH"
        else:
            # Default: assume last 4 characters are quote currency
            if len(symbol) > 4:
                base = symbol[:-4]
                quote = symbol[-4:]
                return f"{base}-{quote}"
            else:
                return symbol

    def _convert_interval_format(self, interval: str) -> str:
        """Convert interval format from Binance to KuCoin"""
        interval_map = {
            '1m': '1min',
            '3m': '3min',
            '5m': '5min',
            '15m': '15min',
            '30m': '30min',
            '1h': '1hour',
            '2h': '2hour',
            '4h': '4hour',
            '6h': '6hour',
            '8h': '8hour',
            '12h': '12hour',
            '1d': '1day',
            '1w': '1week'
        }
        return interval_map.get(interval, '1hour')

    def _get_interval_seconds(self, interval: str) -> int:
        """Get interval duration in seconds"""
        interval_seconds = {
            '1min': 60,
            '3min': 180,
            '5min': 300,
            '15min': 900,
            '30min': 1800,
            '1hour': 3600,
            '2hour': 7200,
            '4hour': 14400,
            '6hour': 21600,
            '8hour': 28800,
            '12hour': 43200,
            '1day': 86400,
            '1week': 604800
        }
        return interval_seconds.get(interval, 3600)

    async def test_connection(self) -> Dict:
        """Test connection to KuCoin API"""
        try:
            server_time = await self.get_server_time()
            symbols = await self.get_symbols()
            
            return {
                'status': 'connected',
                'server_time': server_time,
                'available_symbols': len(symbols),
                'test_timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'test_timestamp': datetime.now().isoformat()
            }

# Global client instance
kucoin_client = KuCoinClient(testnet=False)
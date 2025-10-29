"""
HTS Trading System - API Fallback Manager
Manages automatic failover between 40 APIs for 99.9% uptime.
"""

import asyncio
import time
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta

import aiohttp
import redis

from .api_config import API_CONFIG, PRIORITY_APIS

logger = logging.getLogger(__name__)

@dataclass
class APIHealthStatus:
    """API health status tracking"""
    name: str
    status: str  # "healthy", "degraded", "down"
    response_time: float
    last_check: datetime
    error_count: int
    success_count: int
    consecutive_failures: int

class APIFallbackManager:
    """Manages automatic failover between multiple APIs"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.redis_client = redis_client
        self.api_health: Dict[str, APIHealthStatus] = {}
        self.rate_limiters: Dict[str, List[float]] = {}
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Initialize health status for all APIs
        for api_name in API_CONFIG:
            self.api_health[api_name] = APIHealthStatus(
                name=api_name,
                status="unknown",
                response_time=0.0,
                last_check=datetime.utcnow(),
                error_count=0,
                success_count=0,
                consecutive_failures=0
            )
            self.rate_limiters[api_name] = []
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=10),
            connector=aiohttp.TCPConnector(limit=100, ttl_dns_cache=300)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _is_rate_limited(self, api_name: str) -> bool:
        """Check if API is rate limited"""
        if api_name not in API_CONFIG:
            return True
        
        config = API_CONFIG[api_name]
        rate_limit = config.get("rate_limit", 60)  # Default 60 requests per minute
        
        now = time.time()
        requests = self.rate_limiters[api_name]
        
        # Remove old requests (older than 1 minute)
        requests[:] = [req_time for req_time in requests if now - req_time < 60]
        
        return len(requests) >= rate_limit
    
    def _record_request(self, api_name: str):
        """Record a new request for rate limiting"""
        self.rate_limiters[api_name].append(time.time())
    
    async def _make_request(
        self, 
        api_name: str, 
        endpoint: str, 
        params: Optional[Dict] = None,
        headers: Optional[Dict] = None
    ) -> Tuple[bool, Optional[Dict], float]:
        """Make HTTP request to API with error handling"""
        if not self.session:
            return False, None, 0.0
        
        if self._is_rate_limited(api_name):
            logger.warning(f"API {api_name} is rate limited")
            return False, {"error": "rate_limited"}, 0.0
        
        config = API_CONFIG.get(api_name, {})
        base_url = config.get("base_url", "")
        
        # Merge headers
        request_headers = config.get("headers", {}).copy()
        if headers:
            request_headers.update(headers)
        
        # Merge params
        request_params = config.get("params", {}).copy()
        if params:
            request_params.update(params)
        
        url = f"{base_url}{endpoint}"
        start_time = time.time()
        
        try:
            self._record_request(api_name)
            
            async with self.session.get(
                url, 
                params=request_params, 
                headers=request_headers
            ) as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    return True, data, response_time
                elif response.status == 429:  # Rate limited
                    logger.warning(f"API {api_name} returned 429 (rate limited)")
                    return False, {"error": "rate_limited"}, response_time
                else:
                    logger.error(f"API {api_name} returned status {response.status}")
                    return False, {"error": f"http_{response.status}"}, response_time
                    
        except asyncio.TimeoutError:
            response_time = time.time() - start_time
            logger.error(f"API {api_name} request timed out")
            return False, {"error": "timeout"}, response_time
        except Exception as e:
            response_time = time.time() - start_time
            logger.error(f"API {api_name} request failed: {str(e)}")
            return False, {"error": str(e)}, response_time
    
    def _update_health_status(self, api_name: str, success: bool, response_time: float):
        """Update API health status based on request result"""
        health = self.api_health[api_name]
        health.last_check = datetime.utcnow()
        health.response_time = response_time
        
        if success:
            health.success_count += 1
            health.consecutive_failures = 0
            
            if health.response_time < 1.0:
                health.status = "healthy"
            elif health.response_time < 3.0:
                health.status = "degraded"
            else:
                health.status = "slow"
        else:
            health.error_count += 1
            health.consecutive_failures += 1
            
            if health.consecutive_failures >= 3:
                health.status = "down"
            elif health.consecutive_failures >= 1:
                health.status = "degraded"
    
    async def get_price_with_fallback(self, symbol: str) -> Optional[Dict]:
        """Get price with automatic fallback between APIs"""
        # Normalize symbol for different exchanges
        symbol_variants = {
            "kucoin": symbol.replace("USDT", "-USDT"),
            "binance": symbol,
            "coinbase": symbol.replace("USDT", "-USD"),
            "kraken": symbol.replace("USDT", "USD"),
            "huobi": symbol.lower()
        }
        
        # Try APIs in priority order
        for api_name, config in PRIORITY_APIS:
            if config["type"] not in ["exchange", "market_data"]:
                continue
            
            # Skip if API is down
            if self.api_health[api_name].status == "down":
                continue
            
            try:
                api_symbol = symbol_variants.get(api_name, symbol)
                success, data, response_time = await self._get_price_from_api(api_name, api_symbol)
                
                self._update_health_status(api_name, success, response_time)
                
                if success and data:
                    logger.info(f"Successfully got price for {symbol} from {api_name}")
                    return {
                        "symbol": symbol,
                        "price": data.get("price", 0),
                        "source": api_name,
                        "timestamp": datetime.utcnow().isoformat(),
                        "response_time": response_time
                    }
                    
            except Exception as e:
                logger.error(f"Error getting price from {api_name}: {str(e)}")
                self._update_health_status(api_name, False, 0.0)
                continue
        
        logger.error(f"Failed to get price for {symbol} from all APIs")
        return None
    
    async def _get_price_from_api(self, api_name: str, symbol: str) -> Tuple[bool, Optional[Dict], float]:
        """Get price from specific API"""
        config = API_CONFIG.get(api_name, {})
        endpoints = config.get("endpoints", {})
        
        if api_name == "kucoin":
            endpoint = endpoints.get("price", "")
            success, data, response_time = await self._make_request(
                api_name, 
                endpoint,
                params={"symbol": symbol}
            )
            if success and data and "data" in data:
                return True, {"price": data["data"]["price"]}, response_time
                
        elif api_name == "binance":
            endpoint = endpoints.get("price", "")
            success, data, response_time = await self._make_request(
                api_name,
                endpoint,
                params={"symbol": symbol}
            )
            if success and data and "price" in data:
                return True, {"price": data["price"]}, response_time
                
        elif api_name == "coinbase":
            endpoint = endpoints.get("price", "").format(symbol=symbol)
            success, data, response_time = await self._make_request(api_name, endpoint)
            if success and data and "price" in data:
                return True, {"price": data["price"]}, response_time
                
        elif api_name == "coinmarketcap" or api_name == "coinmarketcap_backup":
            endpoint = endpoints.get("price", "")
            success, data, response_time = await self._make_request(
                api_name,
                endpoint,
                params={"symbol": symbol.replace("USDT", "")}
            )
            if success and data and "data" in data:
                symbol_data = data["data"].get(symbol.replace("USDT", ""))
                if symbol_data and "quote" in symbol_data:
                    price = symbol_data["quote"]["USD"]["price"]
                    return True, {"price": price}, response_time
                    
        elif api_name == "coingecko":
            endpoint = endpoints.get("price", "")
            coin_id = symbol.replace("USDT", "").lower()
            if coin_id == "btc":
                coin_id = "bitcoin"
            elif coin_id == "eth":
                coin_id = "ethereum"
            
            success, data, response_time = await self._make_request(
                api_name,
                endpoint,
                params={"ids": coin_id, "vs_currencies": "usd"}
            )
            if success and data and coin_id in data:
                return True, {"price": data[coin_id]["usd"]}, response_time
        
        return False, None, 0.0
    
    async def check_api_health(self, api_name: str) -> Dict[str, Any]:
        """Check health of a specific API"""
        if api_name not in API_CONFIG:
            return {"status": "unknown", "error": "API not configured"}
        
        config = API_CONFIG[api_name]
        
        # Simple health check - try to access base endpoint
        try:
            if config["type"] == "exchange":
                # For exchanges, try to get a ticker
                success, data, response_time = await self._make_request(
                    api_name,
                    list(config["endpoints"].values())[0]
                )
            else:
                # For other APIs, try a simple request
                success, data, response_time = await self._make_request(
                    api_name,
                    list(config["endpoints"].values())[0] if config["endpoints"] else ""
                )
            
            self._update_health_status(api_name, success, response_time)
            
            health = self.api_health[api_name]
            return {
                "name": health.name,
                "status": health.status,
                "response_time": health.response_time,
                "last_check": health.last_check.isoformat(),
                "error_count": health.error_count,
                "success_count": health.success_count,
                "consecutive_failures": health.consecutive_failures,
                "success_rate": health.success_count / max(health.success_count + health.error_count, 1) * 100
            }
            
        except Exception as e:
            logger.error(f"Health check failed for {api_name}: {str(e)}")
            return {
                "name": api_name,
                "status": "error",
                "error": str(e),
                "last_check": datetime.utcnow().isoformat()
            }
    
    async def check_all_apis_health(self) -> Dict[str, Dict[str, Any]]:
        """Check health of all APIs"""
        if not self.session:
            async with self:
                return await self._check_all_apis_health()
        else:
            return await self._check_all_apis_health()
    
    async def _check_all_apis_health(self) -> Dict[str, Dict[str, Any]]:
        """Internal method to check all APIs health"""
        tasks = []
        for api_name in API_CONFIG:
            tasks.append(self.check_api_health(api_name))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        health_status = {}
        for i, result in enumerate(results):
            api_name = list(API_CONFIG.keys())[i]
            if isinstance(result, Exception):
                health_status[api_name] = {
                    "name": api_name,
                    "status": "error",
                    "error": str(result)
                }
            else:
                health_status[api_name] = result
        
        return health_status
    
    def get_healthy_apis(self) -> List[str]:
        """Get list of currently healthy APIs"""
        healthy = []
        for api_name, health in self.api_health.items():
            if health.status in ["healthy", "degraded"]:
                healthy.append(api_name)
        return healthy
    
    def get_api_statistics(self) -> Dict[str, Any]:
        """Get overall API statistics"""
        total_apis = len(self.api_health)
        healthy_count = sum(1 for h in self.api_health.values() if h.status == "healthy")
        degraded_count = sum(1 for h in self.api_health.values() if h.status == "degraded")
        down_count = sum(1 for h in self.api_health.values() if h.status == "down")
        
        total_requests = sum(h.success_count + h.error_count for h in self.api_health.values())
        total_success = sum(h.success_count for h in self.api_health.values())
        
        return {
            "total_apis": total_apis,
            "healthy": healthy_count,
            "degraded": degraded_count,
            "down": down_count,
            "uptime_percentage": (healthy_count + degraded_count) / total_apis * 100 if total_apis > 0 else 0,
            "success_rate": total_success / total_requests * 100 if total_requests > 0 else 0,
            "total_requests": total_requests,
            "avg_response_time": sum(h.response_time for h in self.api_health.values()) / total_apis if total_apis > 0 else 0
        }
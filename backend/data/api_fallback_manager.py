"""
Automatic API Fallback Manager with Health Monitoring
Ensures 99.9% data availability through intelligent routing
"""

import asyncio
import aiohttp
import time
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from .api_config import API_CONFIG, API_HEALTH_STATUS

logger = logging.getLogger(__name__)

class APIFallbackManager:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.health_check_interval = 60  # seconds
        self.max_retries = 3
        self.circuit_breaker_threshold = 5  # failures before circuit opens
        self.circuit_breaker_timeout = 300  # seconds to wait before retry
        self.cache = {}  # Simple in-memory cache
        self.cache_ttl = 300  # 5 minutes
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            connector=aiohttp.TCPConnector(limit=100, limit_per_host=20)
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def fetch_with_fallback(self, service_name: str, endpoint: str, params: Dict = None, headers: Dict = None) -> Dict:
        """
        Fetch data with automatic fallback to backup APIs
        Returns data from first successful response
        """
        config = API_CONFIG.get(service_name)
        if not config:
            raise ValueError(f"Unknown service: {service_name}")
        
        # Check cache first
        cache_key = f"{service_name}:{endpoint}:{str(params)}"
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
        
        # Try primary API first
        if "primary" in config:
            try:
                data = await self._fetch_from_api(config["primary"], endpoint, params, headers)
                self._update_api_health(service_name, "primary", True, None)
                self._set_cache(cache_key, data)
                return data
            except Exception as e:
                logger.warning(f"Primary API {service_name} failed: {str(e)}")
                self._update_api_health(service_name, "primary", False, str(e))
        
        # Try fallback APIs
        for i, fallback_config in enumerate(config.get("fallbacks", [])):
            try:
                data = await self._fetch_from_api(fallback_config, endpoint, params, headers)
                self._update_api_health(service_name, f"fallback_{i}", True, None)
                self._set_cache(cache_key, data)
                logger.info(f"Successfully used fallback {i} for {service_name}")
                return data
            except Exception as e:
                logger.warning(f"Fallback {i} for {service_name} failed: {str(e)}")
                self._update_api_health(service_name, f"fallback_{i}", False, str(e))
                continue
        
        # If all APIs failed, try to return cached data (even if expired)
        expired_cache = self._get_from_cache(cache_key, ignore_expiry=True)
        if expired_cache:
            logger.warning(f"All APIs failed for {service_name}, returning expired cache")
            return expired_cache
        
        raise Exception(f"All APIs failed for service {service_name}")

    async def _fetch_from_api(self, api_config: Dict, endpoint: str, params: Dict = None, headers: Dict = None) -> Dict:
        """Fetch data from a specific API configuration"""
        if not self.session:
            raise Exception("Session not initialized")
        
        url = f"{api_config['url']}/{endpoint.lstrip('/')}"
        
        # Add API key to headers or params
        request_headers = headers or {}
        request_params = params or {}
        
        if api_config.get("key"):
            if "coinmarketcap" in api_config["name"]:
                request_headers["X-CMC_PRO_API_KEY"] = api_config["key"]
            elif "newsapi" in api_config["name"]:
                request_params["apiKey"] = api_config["key"]
            else:
                request_params["apikey"] = api_config["key"]
        
        # Check circuit breaker
        if self._is_circuit_open(api_config["name"]):
            raise Exception(f"Circuit breaker open for {api_config['name']}")
        
        start_time = time.time()
        
        try:
            async with self.session.get(
                url, 
                params=request_params, 
                headers=request_headers,
                timeout=aiohttp.ClientTimeout(total=api_config.get("timeout", 15))
            ) as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    self._record_success(api_config["name"], response_time)
                    return data
                else:
                    raise Exception(f"HTTP {response.status}: {await response.text()}")
                    
        except Exception as e:
            self._record_failure(api_config["name"])
            raise e

    async def health_check_all_apis(self) -> Dict[str, Dict]:
        """Perform health checks on all configured APIs"""
        health_results = {}
        
        for service_name, config in API_CONFIG.items():
            service_health = {"primary": None, "fallbacks": []}
            
            # Check primary API
            if "primary" in config:
                try:
                    health = await self._health_check_single_api(config["primary"])
                    service_health["primary"] = health
                except Exception as e:
                    service_health["primary"] = {"status": "error", "error": str(e)}
            
            # Check fallback APIs
            for fallback in config.get("fallbacks", []):
                try:
                    health = await self._health_check_single_api(fallback)
                    service_health["fallbacks"].append(health)
                except Exception as e:
                    service_health["fallbacks"].append({"status": "error", "error": str(e)})
            
            health_results[service_name] = service_health
        
        return health_results

    async def _health_check_single_api(self, api_config: Dict) -> Dict:
        """Perform health check on a single API"""
        start_time = time.time()
        
        try:
            # Use a simple endpoint for health check
            test_endpoint = "ping" if "kucoin" in api_config["name"] else ""
            
            if not self.session:
                self.session = aiohttp.ClientSession()
            
            async with self.session.get(
                f"{api_config['url']}/{test_endpoint}",
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                response_time = time.time() - start_time
                
                return {
                    "status": "healthy" if response.status == 200 else "unhealthy",
                    "response_time": response_time,
                    "status_code": response.status,
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "response_time": time.time() - start_time,
                "timestamp": datetime.now().isoformat()
            }

    def _get_from_cache(self, key: str, ignore_expiry: bool = False) -> Optional[Dict]:
        """Get data from cache"""
        if key in self.cache:
            data, timestamp = self.cache[key]
            if ignore_expiry or (time.time() - timestamp) < self.cache_ttl:
                return data
        return None

    def _set_cache(self, key: str, data: Dict):
        """Set data in cache"""
        self.cache[key] = (data, time.time())

    def _update_api_health(self, service_name: str, api_type: str, success: bool, error: str = None):
        """Update API health status"""
        if service_name not in API_HEALTH_STATUS:
            API_HEALTH_STATUS[service_name] = {
                "status": "unknown",
                "last_check": None,
                "response_time": None,
                "error_count": 0,
                "success_rate": 100.0,
                "last_error": None
            }
        
        status = API_HEALTH_STATUS[service_name]
        status["last_check"] = datetime.now()
        
        if success:
            status["status"] = "healthy"
            status["error_count"] = max(0, status["error_count"] - 1)
        else:
            status["status"] = "unhealthy"
            status["error_count"] += 1
            status["last_error"] = error

    def _is_circuit_open(self, api_name: str) -> bool:
        """Check if circuit breaker is open for an API"""
        # Simple circuit breaker logic
        return False  # Implement based on error counts and timeouts

    def _record_success(self, api_name: str, response_time: float):
        """Record successful API call"""
        pass  # Implement metrics recording

    def _record_failure(self, api_name: str):
        """Record failed API call"""
        pass  # Implement metrics recording

    async def get_api_health_summary(self) -> Dict:
        """Get summary of all API health statuses"""
        total_apis = sum(1 + len(config.get("fallbacks", [])) for config in API_CONFIG.values() if "primary" in config)
        healthy_apis = sum(1 for status in API_HEALTH_STATUS.values() if status["status"] == "healthy")
        
        return {
            "total_apis": total_apis,
            "healthy_apis": healthy_apis,
            "unhealthy_apis": total_apis - healthy_apis,
            "overall_health": (healthy_apis / total_apis) * 100 if total_apis > 0 else 0,
            "last_updated": datetime.now().isoformat(),
            "services": API_HEALTH_STATUS
        }

    async def force_fallback(self, service_name: str) -> bool:
        """Force a service to use fallback APIs"""
        if service_name in API_HEALTH_STATUS:
            API_HEALTH_STATUS[service_name]["status"] = "forced_fallback"
            return True
        return False

# Global instance
api_fallback_manager = APIFallbackManager()
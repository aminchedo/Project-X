"""
Rate limiter for API requests
Prevents API bans by managing request rates
"""

import asyncio
import time
from typing import Optional
from collections import deque
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Token bucket rate limiter with burst support
    
    Example:
        limiter = RateLimiter(calls=5, period=1)  # 5 calls per second
        async with limiter:
            await make_api_call()
    """
    
    def __init__(self, calls: int, period: float):
        """
        Args:
            calls: Number of calls allowed per period
            period: Time period in seconds
        """
        self.calls = calls
        self.period = period
        self.timestamps = deque(maxlen=calls)
        self._lock = asyncio.Lock()
    
    async def __aenter__(self):
        """Async context manager entry"""
        async with self._lock:
            now = time.time()
            
            # Remove timestamps outside the window
            while self.timestamps and now - self.timestamps[0] >= self.period:
                self.timestamps.popleft()
            
            # If at capacity, wait
            if len(self.timestamps) >= self.calls:
                sleep_time = self.period - (now - self.timestamps[0])
                if sleep_time > 0:
                    logger.debug(f"Rate limit reached, sleeping for {sleep_time:.2f}s")
                    await asyncio.sleep(sleep_time)
                    # Remove old timestamp after sleep
                    self.timestamps.popleft()
            
            # Add current timestamp
            self.timestamps.append(time.time())
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        pass
    
    def reset(self):
        """Clear all timestamps"""
        self.timestamps.clear()
    
    @property
    def remaining_calls(self) -> int:
        """Get number of remaining calls in current window"""
        now = time.time()
        # Count valid timestamps
        valid_count = sum(1 for ts in self.timestamps if now - ts < self.period)
        return max(0, self.calls - valid_count)

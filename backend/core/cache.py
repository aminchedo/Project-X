import time
from typing import Any, Dict, Tuple

class TTLCache:
    def __init__(self, ttl_seconds: int = 30):
        self.ttl = ttl_seconds
        self.store: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str):
        rec = self.store.get(key)
        if not rec:
            return None
        ts, val = rec
        if time.time() - ts > self.ttl:
            self.store.pop(key, None)
            return None
        return val

    def set(self, key: str, val: Any):
        self.store[key] = (time.time(), val)

cache = TTLCache(ttl_seconds=30)

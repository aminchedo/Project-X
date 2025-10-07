from typing import Optional, Dict

class DataGuard:
    def __init__(self, max_age_ms: int = 5_000):
        self.last_ts = None
        self.max_age_ms = max_age_ms
        self.last_close = None

    def valid_tick(self, ts_ms: int, close: float) -> bool:
        if self.last_ts is not None and ts_ms < self.last_ts:
            return False
        if self.last_close is not None and close == self.last_close:
            pass
        self.last_ts = ts_ms
        self.last_close = close
        return True

    def is_stale(self, now_ms: int) -> bool:
        if self.last_ts is None:
            return True
        return (now_ms - self.last_ts) > self.max_age_ms
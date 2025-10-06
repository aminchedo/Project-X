import asyncio
from typing import Dict, Any, List, Optional
import httpx

# Strict, short timeouts + HTTP/2
DEFAULT_TIMEOUT = 8.0

class Http:
    def __init__(self, timeout: float = DEFAULT_TIMEOUT):
        self.timeout = timeout

    async def get_first_ok(self, urls: List[str], headers: Optional[Dict[str, str]] = None) -> Any:
        last_exc = None
        async with httpx.AsyncClient(timeout=self.timeout, http2=True, follow_redirects=True) as client:
            for url in urls:
                try:
                    r = await client.get(url, headers=headers)
                    if r.status_code == 200:
                        try:
                            json_data = r.json()
                            # Wrap lists in a dict to ensure consistent return type
                            if isinstance(json_data, list):
                                return {"data": json_data, "source": "array"}
                            return json_data
                        except Exception:
                            # Some mirrors (like allorigins raw) return JSON-as-text.
                            # Try to re-parse as needed on the caller side if necessary.
                            return {"raw": r.text, "source": "text"}
                except Exception as e:
                    last_exc = e
                    await asyncio.sleep(0.2)
        if last_exc:
            raise last_exc
        raise RuntimeError("All providers failed")

http = Http()

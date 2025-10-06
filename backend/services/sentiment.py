from typing import Dict, Any
from backend.core.http import http
from backend.core.config_hardcoded import settings

async def fear_greed() -> Dict[str, Any]:
    urls = [
        f"{settings.ALT_FNG_BASE}/fng/?limit=1&format=json",
        f"{settings.ALT_FNG_BASE}/fng/",
    ]
    return await http.get_first_ok(urls)

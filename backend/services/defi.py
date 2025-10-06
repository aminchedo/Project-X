from typing import Dict, Any
from backend.core.http import http
from backend.core.config_hardcoded import settings

async def protocols() -> Dict[str, Any]:
    urls = [
        f"{settings.DEFILLAMA_BASE}/protocols",
    ]
    return await http.get_first_ok(urls)

async def overview() -> Dict[str, Any]:
    urls = [
        f"{settings.DEFILLAMA_BASE}/summary/fees",
        f"{settings.DEFILLAMA_BASE}/overview/fees",
    ]
    return await http.get_first_ok(urls)

async def defipulse_demo() -> Dict[str, Any]:
    urls = [
        settings.DEFIPULSE_BASE,  # demo key
    ]
    return await http.get_first_ok(urls)

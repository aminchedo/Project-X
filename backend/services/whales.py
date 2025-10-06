from typing import Dict, Any
from backend.core.http import http
from backend.core.config_hardcoded import settings

async def btc_unconfirmed() -> Dict[str, Any]:
    urls = [
        f"{settings.BLOCKCHAIN_INFO_BASE}/unconfirmed-transactions?format=json",
        f"{settings.BLOCKCHAIN_INFO_BASE}/rawmempool?format=json",
    ]
    return await http.get_first_ok(urls)

async def whale_alert(min_value_usd: int = 500000) -> Dict[str, Any]:
    urls = [
        f"{settings.WHALE_ALERT_BASE}&min_value={min_value_usd}",
    ]
    return await http.get_first_ok(urls)

async def btc_tx(hash_str: str) -> Dict[str, Any]:
    urls = [
        f"{settings.BLOCKCHAIN_INFO_BASE}/rawtx/{hash_str}?format=json",
    ]
    return await http.get_first_ok(urls)

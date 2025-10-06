from typing import Dict, Any
from backend.core.http import http
from backend.core.config_hardcoded import settings

async def global_overview() -> Dict[str, Any]:
    urls = [
        f"{settings.COINGECKO_BASE}/global",
        f"{settings.COINPAPRIKA_BASE}/global",
        # DeFi dominance (from HTML list):
        f"{settings.COINGECKO_BASE}/global/decentralized_finance_defi",
    ]
    return await http.get_first_ok(urls)

async def prices_simple(ids_csv: str) -> Dict[str, Any]:
    urls = [
        f"{settings.COINGECKO_BASE}/simple/price?ids={ids_csv}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true",
        f"{settings.COINPAPRIKA_BASE}/tickers?limit=50",  # format differs; client can fallback if needed
        f"{settings.COINBASE_EXCHANGE_BASE}/products/stats",  # format differs; fallback
    ]
    return await http.get_first_ok(urls)

async def paprika_tickers(limit: int = 15) -> Dict[str, Any]:
    urls = [f"{settings.COINPAPRIKA_BASE}/tickers?limit={limit}"]
    return await http.get_first_ok(urls)

async def coinbase_stats() -> Dict[str, Any]:
    urls = [f"{settings.COINBASE_EXCHANGE_BASE}/products/stats"]
    return await http.get_first_ok(urls)

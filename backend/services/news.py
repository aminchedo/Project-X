from typing import Dict, Any
from urllib.parse import quote
from backend.core.http import http
from backend.core.config_hardcoded import settings

async def cryptopanic_latest() -> Dict[str, Any]:
    urls = [
        f"{settings.CRYPTOPANIC_BASE}/posts/?format=json",  # free base, tokenless
    ]
    return await http.get_first_ok(urls)

async def cryptocompare_latest() -> Dict[str, Any]:
    urls = [
        f"https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key={settings.CRYPTOCOMPARE_NEWS_KEY}",
    ]
    return await http.get_first_ok(urls)

async def cryptonews_latest() -> Dict[str, Any]:
    urls = [
        f"https://cryptonews-api.com/api/v1?tickers=BTC,ETH,BNB&items=50&token={settings.CRYPTONEWS_API_TOKEN}",
    ]
    return await http.get_first_ok(urls)

async def rss_aggregated() -> Dict[str, Any]:
    urls = [
        f"{settings.RSS2JSON_PROXY}{quote(settings.RSS_COINTELEGRAPH)}",
        f"{settings.RSS2JSON_PROXY}{quote(settings.RSS_COINDESK)}",
    ]
    return await http.get_first_ok(urls)

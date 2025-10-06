import asyncio
from fastapi import APIRouter, Query
from typing import Dict, Any
from backend.core.cache import cache
from backend.services import market, sentiment, news, whales, defi

router = APIRouter(prefix="/api", tags=["api"])

def set_or_get(key: str, getter):
    v = cache.get(key)
    if v: return v
    # NOTE: getter is a coroutine function; we await it at call site.
    return None

@router.get("/market/global")
async def market_global() -> Dict[str, Any]:
    key = "market_global"
    v = cache.get(key)
    if v: return v
    data = await market.global_overview()
    cache.set(key, data)
    return data

@router.get("/market/prices")
async def market_prices(ids: str = Query("bitcoin,ethereum,binancecoin")) -> Dict[str, Any]:
    key = f"prices:{ids}"
    v = cache.get(key)
    if v: return v
    data = await market.prices_simple(ids)
    cache.set(key, data)
    return data

@router.get("/market/paprika/tickers")
async def paprika_tickers(limit: int = 15) -> Dict[str, Any]:
    key = f"paprika_tickers:{limit}"
    v = cache.get(key)
    if v: return v
    data = await market.paprika_tickers(limit=limit)
    cache.set(key, data)
    return data

@router.get("/exchange/coinbase/stats")
async def coinbase_stats() -> Dict[str, Any]:
    key = "coinbase_stats"
    v = cache.get(key)
    if v: return v
    data = await market.coinbase_stats()
    cache.set(key, data)
    return data

@router.get("/sentiment/fng")
async def fng() -> Dict[str, Any]:
    key = "fng"
    v = cache.get(key)
    if v: return v
    data = await sentiment.fear_greed()
    cache.set(key, data)
    return data

@router.get("/news/cryptopanic")
async def news_cryptopanic() -> Dict[str, Any]:
    key = "news_cp"
    v = cache.get(key)
    if v: return v
    data = await news.cryptopanic_latest()
    cache.set(key, data)
    return data

@router.get("/news/cryptocompare")
async def news_cc() -> Dict[str, Any]:
    key = "news_cc"
    v = cache.get(key)
    if v: return v
    data = await news.cryptocompare_latest()
    cache.set(key, data)
    return data

@router.get("/news/cryptonews")
async def news_cn() -> Dict[str, Any]:
    key = "news_cn"
    v = cache.get(key)
    if v: return v
    data = await news.cryptonews_latest()
    cache.set(key, data)
    return data

@router.get("/news/rss")
async def news_rss() -> Dict[str, Any]:
    key = "news_rss"
    v = cache.get(key)
    if v: return v
    data = await news.rss_aggregated()
    cache.set(key, data)
    return data

@router.get("/whales/btc")
async def whales_btc() -> Dict[str, Any]:
    key = "whales_btc"
    v = cache.get(key)
    if v: return v
    data = await whales.btc_unconfirmed()
    cache.set(key, data)
    return data

@router.get("/whales/alert")
async def whales_alert(min_value_usd: int = 500000) -> Dict[str, Any]:
    key = f"whales_alert:{min_value_usd}"
    v = cache.get(key)
    if v: return v
    data = await whales.whale_alert(min_value_usd=min_value_usd)
    cache.set(key, data)
    return data

@router.get("/onchain/btc/tx/{tx_hash}")
async def onchain_btc_tx(tx_hash: str) -> Dict[str, Any]:
    key = f"btc_tx:{tx_hash}"
    v = cache.get(key)
    if v: return v
    data = await whales.btc_tx(tx_hash)
    cache.set(key, data)
    return data

@router.get("/defi/llama/protocols")
async def llama_protocols() -> Dict[str, Any]:
    key = "llama_protocols"
    v = cache.get(key)
    if v: return v
    data = await defi.protocols()
    cache.set(key, data)
    return data

@router.get("/defi/llama/overview")
async def llama_overview() -> Dict[str, Any]:
    key = "llama_overview"
    v = cache.get(key)
    if v: return v
    data = await defi.overview()
    cache.set(key, data)
    return data

@router.get("/defi/defipulse/demo")
async def defipulse_demo() -> Dict[str, Any]:
    key = "defipulse_demo"
    v = cache.get(key)
    if v: return v
    data = await defi.defipulse_demo()
    cache.set(key, data)
    return data

@router.get("/summary")
async def summary(ids: str = "bitcoin,ethereum,binancecoin", news_limit: int = 20, whale_min_usd: int = 500000) -> Dict[str, Any]:
    key = f"summary:{ids}:{news_limit}:{whale_min_usd}"
    v = cache.get(key)
    if v: return v

    results = await asyncio.gather(
        market.global_overview(),
        market.prices_simple(ids),
        sentiment.fear_greed(),
        news.cryptopanic_latest(),
        news.cryptocompare_latest(),
        news.cryptonews_latest(),
        news.rss_aggregated(),
        whales.btc_unconfirmed(),
        whales.whale_alert(min_value_usd=whale_min_usd),
        defi.protocols(),
        defi.overview(),
        market.coinbase_stats(),
        return_exceptions=True
    )

    # Convert exceptions to error messages for better JSON serialization
    def serialize_result(r):
        if isinstance(r, Exception):
            return {"error": str(r), "type": type(r).__name__}
        return r

    data = {
        "market_global": serialize_result(results[0]),
        "prices": serialize_result(results[1]),
        "sentiment_fng": serialize_result(results[2]),
        "news_cryptopanic": serialize_result(results[3]),
        "news_cryptocompare": serialize_result(results[4]),
        "news_cryptonews": serialize_result(results[5]),
        "news_rss": serialize_result(results[6]),
        "whales_btc": serialize_result(results[7]),
        "whales_alert": serialize_result(results[8]),
        "defi_protocols": serialize_result(results[9]),
        "defi_overview": serialize_result(results[10]),
        "coinbase_stats": serialize_result(results[11]),
    }
    cache.set(key, data)
    return data

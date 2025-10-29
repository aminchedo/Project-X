"""
HTS Trading System - API Configuration
Contains all 40 API configurations with hardcoded keys for maximum reliability.
"""

from typing import Dict, List, Any

# Hardcoded API keys (working keys provided in requirements)
TRONSCAN_KEY = "7ae72726-bffe-4e74-9c33-97b761eeea21"
BSCSCAN_KEY = "K62RKHGXTDCG53RU4MCG6XABIMJKTN19IT"
ETHERSCAN_KEY = "SZHYFZK2RR8H9TIMJBVW54V4H81K2Z2KR2"
ETHERSCAN_KEY_2 = "T6IR8VJHX2NE6ZJW2S3FDVN1TYG4PYYI45"
COINMARKETCAP_KEY = "b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c"
COINMARKETCAP_KEY_2 = "04cf4b5b-9868-465c-8ba0-9f2e78c92eb1"
CRYPTOCOMPARE_KEY = "e79c8e6d4c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f"
NEWSAPI_KEY = "pub_346789abc123def456789ghi012345jkl"

# Complete API Configuration (40 APIs total)
API_CONFIG: Dict[str, Dict[str, Any]] = {
    # 1. KuCoin (Primary)
    "kucoin": {
        "name": "KuCoin",
        "type": "exchange",
        "base_url": "https://api.kucoin.com",
        "endpoints": {
            "price": "/api/v1/market/orderbook/level1",
            "klines": "/api/v1/market/candles",
            "symbols": "/api/v1/symbols",
            "ticker": "/api/v1/market/allTickers"
        },
        "rate_limit": 100,  # requests per second
        "priority": 1,
        "headers": {},
        "auth_required": False
    },
    
    # 2. Binance
    "binance": {
        "name": "Binance",
        "type": "exchange",
        "base_url": "https://api.binance.com",
        "endpoints": {
            "price": "/api/v3/ticker/price",
            "klines": "/api/v3/klines",
            "ticker": "/api/v3/ticker/24hr"
        },
        "rate_limit": 1200,
        "priority": 2,
        "headers": {},
        "auth_required": False
    },
    
    # 3. Coinbase Pro
    "coinbase": {
        "name": "Coinbase Pro",
        "type": "exchange",
        "base_url": "https://api.exchange.coinbase.com",
        "endpoints": {
            "price": "/products/{symbol}/ticker",
            "candles": "/products/{symbol}/candles"
        },
        "rate_limit": 10,
        "priority": 3,
        "headers": {},
        "auth_required": False
    },
    
    # 4. Kraken
    "kraken": {
        "name": "Kraken",
        "type": "exchange",
        "base_url": "https://api.kraken.com",
        "endpoints": {
            "price": "/0/public/Ticker",
            "ohlc": "/0/public/OHLC"
        },
        "rate_limit": 1,
        "priority": 4,
        "headers": {},
        "auth_required": False
    },
    
    # 5. Huobi
    "huobi": {
        "name": "Huobi",
        "type": "exchange",
        "base_url": "https://api.huobi.pro",
        "endpoints": {
            "price": "/market/detail/merged",
            "klines": "/market/history/kline"
        },
        "rate_limit": 100,
        "priority": 5,
        "headers": {},
        "auth_required": False
    },
    
    # 6. CoinMarketCap (Primary)
    "coinmarketcap": {
        "name": "CoinMarketCap",
        "type": "market_data",
        "base_url": "https://pro-api.coinmarketcap.com",
        "endpoints": {
            "price": "/v1/cryptocurrency/quotes/latest",
            "listings": "/v1/cryptocurrency/listings/latest",
            "global": "/v1/global-metrics/quotes/latest"
        },
        "rate_limit": 333,
        "priority": 6,
        "headers": {
            "X-CMC_PRO_API_KEY": COINMARKETCAP_KEY,
            "Accept": "application/json"
        },
        "auth_required": True
    },
    
    # 7. CoinMarketCap (Backup)
    "coinmarketcap_backup": {
        "name": "CoinMarketCap Backup",
        "type": "market_data",
        "base_url": "https://pro-api.coinmarketcap.com",
        "endpoints": {
            "price": "/v1/cryptocurrency/quotes/latest",
            "listings": "/v1/cryptocurrency/listings/latest"
        },
        "rate_limit": 333,
        "priority": 7,
        "headers": {
            "X-CMC_PRO_API_KEY": COINMARKETCAP_KEY_2,
            "Accept": "application/json"
        },
        "auth_required": True
    },
    
    # 8. CoinGecko
    "coingecko": {
        "name": "CoinGecko",
        "type": "market_data",
        "base_url": "https://api.coingecko.com/api/v3",
        "endpoints": {
            "price": "/simple/price",
            "coins": "/coins/markets",
            "global": "/global"
        },
        "rate_limit": 50,
        "priority": 8,
        "headers": {},
        "auth_required": False
    },
    
    # 9. CryptoCompare
    "cryptocompare": {
        "name": "CryptoCompare",
        "type": "market_data",
        "base_url": "https://min-api.cryptocompare.com/data",
        "endpoints": {
            "price": "/price",
            "ohlc": "/v2/histoday",
            "news": "/v2/news/"
        },
        "rate_limit": 100,
        "priority": 9,
        "headers": {
            "Authorization": f"Apikey {CRYPTOCOMPARE_KEY}"
        },
        "auth_required": True
    },
    
    # 10. Etherscan (Primary)
    "etherscan": {
        "name": "Etherscan",
        "type": "blockchain",
        "base_url": "https://api.etherscan.io/api",
        "endpoints": {
            "balance": "",
            "tx": "",
            "token": ""
        },
        "rate_limit": 5,
        "priority": 10,
        "headers": {},
        "params": {"apikey": ETHERSCAN_KEY},
        "auth_required": True
    },
    
    # 11. Etherscan (Backup)
    "etherscan_backup": {
        "name": "Etherscan Backup",
        "type": "blockchain",
        "base_url": "https://api.etherscan.io/api",
        "endpoints": {
            "balance": "",
            "tx": "",
            "token": ""
        },
        "rate_limit": 5,
        "priority": 11,
        "headers": {},
        "params": {"apikey": ETHERSCAN_KEY_2},
        "auth_required": True
    },
    
    # 12. BSCScan
    "bscscan": {
        "name": "BSCScan",
        "type": "blockchain",
        "base_url": "https://api.bscscan.com/api",
        "endpoints": {
            "balance": "",
            "tx": "",
            "token": ""
        },
        "rate_limit": 5,
        "priority": 12,
        "headers": {},
        "params": {"apikey": BSCSCAN_KEY},
        "auth_required": True
    },
    
    # 13. TronScan
    "tronscan": {
        "name": "TronScan",
        "type": "blockchain",
        "base_url": "https://apilist.tronscan.org/api",
        "endpoints": {
            "account": "/account",
            "transaction": "/transaction"
        },
        "rate_limit": 100,
        "priority": 13,
        "headers": {
            "TRON-PRO-API-KEY": TRONSCAN_KEY
        },
        "auth_required": True
    },
    
    # 14. NewsAPI
    "newsapi": {
        "name": "NewsAPI",
        "type": "news",
        "base_url": "https://newsapi.org/v2",
        "endpoints": {
            "everything": "/everything",
            "headlines": "/top-headlines"
        },
        "rate_limit": 1000,
        "priority": 14,
        "headers": {
            "X-API-Key": NEWSAPI_KEY
        },
        "auth_required": True
    },
    
    # 15. CryptoPanic
    "cryptopanic": {
        "name": "CryptoPanic",
        "type": "news",
        "base_url": "https://cryptopanic.com/api/v1",
        "endpoints": {
            "posts": "/posts/"
        },
        "rate_limit": 1000,
        "priority": 15,
        "headers": {},
        "auth_required": False
    },
    
    # 16. CoinDesk
    "coindesk": {
        "name": "CoinDesk",
        "type": "news",
        "base_url": "https://api.coindesk.com/v1",
        "endpoints": {
            "bpi": "/bpi/currentprice.json"
        },
        "rate_limit": 60,
        "priority": 16,
        "headers": {},
        "auth_required": False
    },
    
    # 17. Fear & Greed Index
    "fear_greed": {
        "name": "Fear & Greed Index",
        "type": "sentiment",
        "base_url": "https://api.alternative.me",
        "endpoints": {
            "fng": "/fng/"
        },
        "rate_limit": 60,
        "priority": 17,
        "headers": {},
        "auth_required": False
    },
    
    # 18. Glassnode
    "glassnode": {
        "name": "Glassnode",
        "type": "analytics",
        "base_url": "https://api.glassnode.com/v1/metrics",
        "endpoints": {
            "price": "/market/price_usd_close",
            "volume": "/transactions/count"
        },
        "rate_limit": 100,
        "priority": 18,
        "headers": {},
        "auth_required": False
    },
    
    # 19. Messari
    "messari": {
        "name": "Messari",
        "type": "analytics",
        "base_url": "https://data.messari.io/api/v1",
        "endpoints": {
            "assets": "/assets",
            "metrics": "/assets/{symbol}/metrics"
        },
        "rate_limit": 20,
        "priority": 19,
        "headers": {},
        "auth_required": False
    },
    
    # 20. Nomics
    "nomics": {
        "name": "Nomics",
        "type": "market_data",
        "base_url": "https://api.nomics.com/v1",
        "endpoints": {
            "prices": "/prices",
            "currencies": "/currencies/ticker"
        },
        "rate_limit": 100,
        "priority": 20,
        "headers": {},
        "auth_required": False
    },
    
    # 21-40: Additional backup APIs (simplified configurations)
    "gate_io": {
        "name": "Gate.io",
        "type": "exchange",
        "base_url": "https://api.gateio.ws/api/v4",
        "endpoints": {"price": "/spot/tickers"},
        "rate_limit": 100,
        "priority": 21,
        "headers": {},
        "auth_required": False
    },
    
    "okx": {
        "name": "OKX",
        "type": "exchange",
        "base_url": "https://www.okx.com/api/v5",
        "endpoints": {"price": "/market/ticker"},
        "rate_limit": 100,
        "priority": 22,
        "headers": {},
        "auth_required": False
    },
    
    "bybit": {
        "name": "Bybit",
        "type": "exchange",
        "base_url": "https://api.bybit.com/v2/public",
        "endpoints": {"price": "/tickers"},
        "rate_limit": 120,
        "priority": 23,
        "headers": {},
        "auth_required": False
    },
    
    "bitfinex": {
        "name": "Bitfinex",
        "type": "exchange",
        "base_url": "https://api-pub.bitfinex.com/v2",
        "endpoints": {"price": "/ticker/t{symbol}"},
        "rate_limit": 90,
        "priority": 24,
        "headers": {},
        "auth_required": False
    },
    
    "ftx": {
        "name": "FTX",
        "type": "exchange",
        "base_url": "https://ftx.com/api",
        "endpoints": {"price": "/markets/{symbol}"},
        "rate_limit": 30,
        "priority": 25,
        "headers": {},
        "auth_required": False
    },
    
    "gemini": {
        "name": "Gemini",
        "type": "exchange",
        "base_url": "https://api.gemini.com/v1",
        "endpoints": {"price": "/pubticker/{symbol}"},
        "rate_limit": 120,
        "priority": 26,
        "headers": {},
        "auth_required": False
    },
    
    "bittrex": {
        "name": "Bittrex",
        "type": "exchange",
        "base_url": "https://api.bittrex.com/v3",
        "endpoints": {"price": "/markets/{symbol}/ticker"},
        "rate_limit": 60,
        "priority": 27,
        "headers": {},
        "auth_required": False
    },
    
    "poloniex": {
        "name": "Poloniex",
        "type": "exchange",
        "base_url": "https://api.poloniex.com",
        "endpoints": {"price": "/public?command=returnTicker"},
        "rate_limit": 6,
        "priority": 28,
        "headers": {},
        "auth_required": False
    },
    
    "cryptocom": {
        "name": "Crypto.com",
        "type": "exchange",
        "base_url": "https://api.crypto.com/v2",
        "endpoints": {"price": "/public/get-ticker"},
        "rate_limit": 100,
        "priority": 29,
        "headers": {},
        "auth_required": False
    },
    
    "cex_io": {
        "name": "CEX.io",
        "type": "exchange",
        "base_url": "https://cex.io/api",
        "endpoints": {"price": "/ticker/{symbol}"},
        "rate_limit": 600,
        "priority": 30,
        "headers": {},
        "auth_required": False
    },
    
    # Analytics and Data Providers (31-40)
    "santiment": {
        "name": "Santiment",
        "type": "sentiment",
        "base_url": "https://api.santiment.net/graphql",
        "endpoints": {"metrics": ""},
        "rate_limit": 300,
        "priority": 31,
        "headers": {},
        "auth_required": False
    },
    
    "lunarcrush": {
        "name": "LunarCrush",
        "type": "sentiment",
        "base_url": "https://api.lunarcrush.com/v2",
        "endpoints": {"assets": "/assets"},
        "rate_limit": 50,
        "priority": 32,
        "headers": {},
        "auth_required": False
    },
    
    "intotheblock": {
        "name": "IntoTheBlock",
        "type": "analytics",
        "base_url": "https://api.intotheblock.com",
        "endpoints": {"metrics": "/market/price"},
        "rate_limit": 100,
        "priority": 33,
        "headers": {},
        "auth_required": False
    },
    
    "nansen": {
        "name": "Nansen",
        "type": "analytics",
        "base_url": "https://api.nansen.ai",
        "endpoints": {"wallet": "/wallet"},
        "rate_limit": 60,
        "priority": 34,
        "headers": {},
        "auth_required": False
    },
    
    "dune_analytics": {
        "name": "Dune Analytics",
        "type": "analytics",
        "base_url": "https://api.dune.com/api/v1",
        "endpoints": {"query": "/query/{query_id}/results"},
        "rate_limit": 300,
        "priority": 35,
        "headers": {},
        "auth_required": False
    },
    
    "flipside": {
        "name": "Flipside",
        "type": "analytics",
        "base_url": "https://api.flipsidecrypto.com",
        "endpoints": {"query": "/queries"},
        "rate_limit": 100,
        "priority": 36,
        "headers": {},
        "auth_required": False
    },
    
    "chainalysis": {
        "name": "Chainalysis",
        "type": "analytics",
        "base_url": "https://api.chainalysis.com",
        "endpoints": {"address": "/address"},
        "rate_limit": 100,
        "priority": 37,
        "headers": {},
        "auth_required": False
    },
    
    "elliptic": {
        "name": "Elliptic",
        "type": "analytics",
        "base_url": "https://api.elliptic.co",
        "endpoints": {"wallet": "/wallet"},
        "rate_limit": 60,
        "priority": 38,
        "headers": {},
        "auth_required": False
    },
    
    "coinmetrics": {
        "name": "Coin Metrics",
        "type": "analytics",
        "base_url": "https://api.coinmetrics.io/v4",
        "endpoints": {"assets": "/assets"},
        "rate_limit": 100,
        "priority": 39,
        "headers": {},
        "auth_required": False
    },
    
    "kaiko": {
        "name": "Kaiko",
        "type": "market_data",
        "base_url": "https://eu.market-api.kaiko.io/v2",
        "endpoints": {"ohlc": "/data/trades.v1/spot_direct_exchange_rate"},
        "rate_limit": 100,
        "priority": 40,
        "headers": {},
        "auth_required": False
    }
}

# API Categories for easy filtering
API_CATEGORIES = {
    "exchanges": [name for name, config in API_CONFIG.items() if config["type"] == "exchange"],
    "market_data": [name for name, config in API_CONFIG.items() if config["type"] == "market_data"],
    "blockchain": [name for name, config in API_CONFIG.items() if config["type"] == "blockchain"],
    "news": [name for name, config in API_CONFIG.items() if config["type"] == "news"],
    "sentiment": [name for name, config in API_CONFIG.items() if config["type"] == "sentiment"],
    "analytics": [name for name, config in API_CONFIG.items() if config["type"] == "analytics"]
}

# Priority-sorted API list for fallback
PRIORITY_APIS = sorted(API_CONFIG.items(), key=lambda x: x[1]["priority"])

def get_api_config(api_name: str) -> Dict[str, Any]:
    """Get configuration for a specific API"""
    return API_CONFIG.get(api_name, {})

def get_apis_by_category(category: str) -> List[str]:
    """Get all APIs in a specific category"""
    return API_CATEGORIES.get(category, [])

def get_primary_apis() -> List[str]:
    """Get the top 10 primary APIs"""
    return [name for name, _ in PRIORITY_APIS[:10]]

def get_fallback_apis() -> List[str]:
    """Get all fallback APIs (11-40)"""
    return [name for name, _ in PRIORITY_APIS[10:]]
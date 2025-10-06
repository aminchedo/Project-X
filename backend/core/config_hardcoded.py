# All tokens are one-time/free/demo and intentionally hard-coded.
# Replace later if you want, but this works out-of-the-box with public/free/demo tiers.

class Hardcoded:
    # News providers
    CRYPTOPANIC_BASE = "https://cryptopanic.com/api/free/v1"  # tokenless free API base
    CRYPTOCOMPARE_NEWS_KEY = "demo"  # free/demo placeholder
    CRYPTONEWS_API_TOKEN = "demo"    # free/demo placeholder

    # Sentiment
    ALT_FNG_BASE = "https://api.alternative.me"

    # Market
    COINGECKO_BASE = "https://api.coingecko.com/api/v3"
    COINPAPRIKA_BASE = "https://api.coinpaprika.com/v1"
    COINBASE_EXCHANGE_BASE = "https://api.exchange.coinbase.com"

    # DeFi
    DEFILLAMA_BASE = "https://api.llama.fi"
    DEFIPULSE_BASE = "https://api.defipulse.com/api/v1/defipulse/api?api-key=demo"

    # Whales / On-chain
    BLOCKCHAIN_INFO_BASE = "https://blockchain.info"
    WHALE_ALERT_BASE = "https://api.whale-alert.io/v1/transactions?api_key=demo"  # demo

    # RSS helpers (server-side fetch to avoid CORS):
    RSS_COINTELEGRAPH = "https://cointelegraph.com/rss"
    RSS_COINDESK = "https://www.coindesk.com/arc/outboundfeeds/rss/"
    # Public RSS-to-JSON mirror used server-side:
    RSS2JSON_PROXY = "https://api.allorigins.win/raw?url="

settings = Hardcoded()

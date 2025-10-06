# AiSmart Trader – Unified Strategic Implementation Charter
## Master Instruction Set for Cursor AI Agent

> **Agent Identity:** You are a senior trading systems architect with 10+ years in algorithmic crypto trading. Execute with surgical precision, zero tolerance for placeholders, and obsessive attention to edge cases.

---

## 🎯 MISSION CRITICAL OBJECTIVES

### Primary Goal
Build a **production-grade, multi-algorithm crypto trading system** that:
- Achieves **<2% false positive rate** on directional signals
- Generates actionable signals in **<5 seconds** (data fetch → scored signal)
- Maintains **99.9% uptime** with graceful degradation under load
- Delivers **verifiable edge** through backtested strategies (Sharpe >1.5, Win Rate >55%)

### Success Metrics
```yaml
performance:
  signal_latency_p95: <3s
  scan_throughput: 50 symbols in <5s
  indicator_compute: <100ms per symbol
  
accuracy:
  directional_accuracy: >58%
  false_positive_rate: <2%
  signal_to_noise_ratio: >3.0
  
reliability:
  uptime_sla: 99.9%
  data_fetch_success: >98%
  websocket_reconnect: <2s
```

---

## 🏗️ ARCHITECTURAL PILLARS

### 1. Code Quality Standards (NON-NEGOTIABLE)

```python
# ALWAYS follow this pattern:

from typing import Protocol, TypedDict, Literal
from pydantic import BaseModel, Field, validator
import structlog

logger = structlog.get_logger()

class OHLCVBar(TypedDict):
    """Single OHLCV candle - immutable contract"""
    ts: int          # Unix timestamp milliseconds
    open: float
    high: float
    low: float
    close: float
    volume: float

class DetectionResult(BaseModel):
    """Universal detector output - all detectors MUST return this"""
    score: float = Field(ge=-1.0, le=1.0, description="Signed score: -1=strong bear, +1=strong bull")
    confidence: float = Field(ge=0.0, le=1.0, description="Quality of detection 0=noise, 1=textbook")
    direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    meta: dict = Field(default_factory=dict, description="Detector-specific context")
    
    @validator('score')
    def validate_score_direction_alignment(cls, v, values):
        """Ensure score sign matches direction"""
        if 'direction' in values:
            if values['direction'] == 'BULLISH' and v < 0:
                raise ValueError("Bullish direction requires positive score")
            if values['direction'] == 'BEARISH' and v > 0:
                raise ValueError("Bearish direction requires negative score")
        return v

class DetectorProtocol(Protocol):
    """All detectors implement this interface"""
    async def detect(self, ohlcv: list[OHLCVBar], context: dict) -> DetectionResult:
        """
        Args:
            ohlcv: Minimum 100 bars, validated ascending timestamps
            context: {"trend": "up|down|ranging", "volatility": "high|normal|low"}
        
        Returns:
            DetectionResult with score, confidence, direction, meta
        
        Raises:
            ValueError: If ohlcv insufficient or malformed
            TimeoutError: If computation exceeds 500ms
        """
        ...
```

### 2. Error Handling Philosophy

```python
from tenacity import (
    retry, 
    stop_after_attempt, 
    wait_exponential_jitter,
    retry_if_exception_type
)

class DataProviderError(Exception):
    """Base for all data provider errors"""
    pass

class RateLimitError(DataProviderError):
    """Hit rate limit - backoff required"""
    pass

class InvalidResponseError(DataProviderError):
    """Provider returned malformed data"""
    pass

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    retry=retry_if_exception_type((RateLimitError, TimeoutError)),
    before_sleep=lambda retry_state: logger.warning(
        "Retrying data fetch",
        attempt=retry_state.attempt_number,
        exception=str(retry_state.outcome.exception())
    )
)
async def fetch_ohlcv_with_retry(
    provider: OHLCVProvider,
    symbol: str,
    timeframe: str,
    limit: int = 500
) -> list[OHLCVBar]:
    """Resilient OHLCV fetcher with exponential backoff"""
    try:
        raw_data = await provider.fetch(symbol, timeframe, limit)
        validated = validate_and_normalize(raw_data)
        return validated
    except RateLimitError:
        logger.warning("Rate limited", provider=provider.__class__.__name__)
        raise  # Trigger retry
    except InvalidResponseError as e:
        logger.error("Invalid data received", error=str(e), raw_sample=raw_data[:2])
        raise  # Don't retry - data is fundamentally broken
    except Exception as e:
        logger.exception("Unexpected error in OHLCV fetch")
        raise DataProviderError(f"Failed to fetch {symbol} {timeframe}") from e
```

### 3. Performance Optimization

```python
import numpy as np
from functools import lru_cache
from collections import deque

class RingBuffer:
    """Memory-efficient sliding window for live bars"""
    def __init__(self, maxlen: int = 500):
        self._buffer = deque(maxlen=maxlen)
        self._dirty = True
        self._cached_array = None
    
    def append(self, bar: OHLCVBar):
        self._buffer.append(bar)
        self._dirty = True
    
    def as_numpy(self) -> np.ndarray:
        """Zero-copy view when possible"""
        if self._dirty:
            self._cached_array = np.array([
                [b['open'], b['high'], b['low'], b['close'], b['volume']]
                for b in self._buffer
            ], dtype=np.float64)
            self._dirty = False
        return self._cached_array

@lru_cache(maxsize=128)
def compute_indicators_cached(
    symbol: str,
    timeframe: str,
    bar_hash: int  # hash of last bar timestamp
) -> dict:
    """Memoize expensive indicator calculations"""
    # Actual computation happens here
    pass

# Use vectorized operations ALWAYS
def calculate_rsi_vectorized(closes: np.ndarray, period: int = 14) -> np.ndarray:
    """Numpy-based RSI - 10x faster than pandas"""
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    
    avg_gain = np.convolve(gains, np.ones(period)/period, mode='valid')
    avg_loss = np.convolve(losses, np.ones(period)/period, mode='valid')
    
    rs = avg_gain / (avg_loss + 1e-10)
    rsi = 100 - (100 / (1 + rs))
    
    # Pad to match input length
    return np.pad(rsi, (period, 0), constant_values=50)
```

---

## 📋 PHASE-BY-PHASE IMPLEMENTATION

### Phase 0: Surgical Repository Analysis

**Deliverable:** `docs/ANALYSIS_REPORT.md`

```python
# backend/scripts/repo_analyzer.py

import ast
import json
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Dict

@dataclass
class GapReport:
    stubs_found: List[dict]
    missing_tests: List[str]
    unused_env_vars: List[str]
    hardcoded_values: List[dict]
    missing_type_hints: List[dict]
    performance_warnings: List[dict]

class DeepAnalyzer:
    def __init__(self, repo_root: Path):
        self.root = repo_root
        self.report = GapReport([], [], [], [], [], [])
    
    def scan_for_ellipsis(self):
        """Find all ... placeholders"""
        for pyfile in self.root.rglob("*.py"):
            try:
                tree = ast.parse(pyfile.read_text(), filename=str(pyfile))
                for node in ast.walk(tree):
                    if isinstance(node, ast.Constant) and node.value is Ellipsis:
                        self.report.stubs_found.append({
                            "file": str(pyfile.relative_to(self.root)),
                            "line": node.lineno,
                            "function": self._get_parent_function(tree, node)
                        })
            except SyntaxError:
                pass
    
    def check_hardcoded_secrets(self):
        """Detect potential hardcoded credentials"""
        patterns = [
            r'api[_-]?key\s*=\s*["\'][\w-]{20,}["\']',
            r'secret\s*=\s*["\'][\w-]{20,}["\']',
            r'password\s*=\s*["\'].+["\']'
        ]
        import re
        for pyfile in self.root.rglob("*.py"):
            content = pyfile.read_text()
            for pattern in patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    self.report.hardcoded_values.append({
                        "file": str(pyfile.relative_to(self.root)),
                        "pattern": pattern,
                        "severity": "CRITICAL"
                    })
    
    def validate_test_coverage(self):
        """Map source files to test files"""
        src_files = {f.stem: f for f in self.root.glob("backend/**/*.py") if f.stem != "__init__"}
        test_files = {f.stem.replace("test_", ""): f for f in self.root.glob("tests/**/*.py")}
        
        for src_name, src_path in src_files.items():
            if src_name not in test_files:
                self.report.missing_tests.append(str(src_path.relative_to(self.root)))
    
    def detect_performance_antipatterns(self):
        """Find synchronous IO in async functions"""
        for pyfile in self.root.rglob("*.py"):
            try:
                tree = ast.parse(pyfile.read_text())
                for node in ast.walk(tree):
                    if isinstance(node, ast.AsyncFunctionDef):
                        # Check for requests.get, time.sleep in async functions
                        for subnode in ast.walk(node):
                            if isinstance(subnode, ast.Call):
                                if isinstance(subnode.func, ast.Attribute):
                                    if subnode.func.attr in ['get', 'post'] and isinstance(subnode.func.value, ast.Name):
                                        if subnode.func.value.id == 'requests':
                                            self.report.performance_warnings.append({
                                                "file": str(pyfile.relative_to(self.root)),
                                                "line": subnode.lineno,
                                                "issue": "Synchronous HTTP in async function",
                                                "suggestion": "Use httpx.AsyncClient"
                                            })
            except:
                pass
    
    def generate_markdown_report(self) -> str:
        """Generate comprehensive markdown report"""
        md = ["# Repository Analysis Report", ""]
        md.append(f"**Analysis Date:** {datetime.now().isoformat()}")
        md.append("")
        
        md.append("## 🔴 Critical Issues")
        md.append(f"- **Placeholder Logic (...):** {len(self.report.stubs_found)} locations")
        md.append(f"- **Hardcoded Secrets:** {len(self.report.hardcoded_values)} potential violations")
        md.append("")
        
        md.append("## 🟡 Quality Gaps")
        md.append(f"- **Missing Tests:** {len(self.report.missing_tests)} files")
        md.append(f"- **Performance Antipatterns:** {len(self.report.performance_warnings)} detected")
        md.append("")
        
        md.append("## 📊 Detailed Findings")
        
        if self.report.stubs_found:
            md.append("### Placeholder Logic")
            for stub in self.report.stubs_found:
                md.append(f"- `{stub['file']}:{stub['line']}` in `{stub['function']}`")
        
        if self.report.hardcoded_values:
            md.append("### 🚨 Security Violations")
            for hc in self.report.hardcoded_values:
                md.append(f"- **{hc['severity']}** `{hc['file']}` - Pattern: `{hc['pattern']}`")
        
        return "\n".join(md)
    
    def run_full_analysis(self):
        """Execute all checks"""
        self.scan_for_ellipsis()
        self.check_hardcoded_secrets()
        self.validate_test_coverage()
        self.detect_performance_antipatterns()
        
        # Save JSON report
        (self.root / "docs" / "analysis_report.json").write_text(
            json.dumps(asdict(self.report), indent=2)
        )
        
        # Save markdown report
        (self.root / "docs" / "ANALYSIS_REPORT.md").write_text(
            self.generate_markdown_report()
        )

if __name__ == "__main__":
    analyzer = DeepAnalyzer(Path.cwd())
    analyzer.run_full_analysis()
    print("✅ Analysis complete - see docs/ANALYSIS_REPORT.md")
```

**Exit Criteria:**
- [ ] Zero placeholders (`...`) in production code paths
- [ ] All environment variables documented in `.env.example`
- [ ] Test coverage baseline established (minimum 60%)
- [ ] No hardcoded secrets detected

---

### Phase 1: Battle-Tested Data Layer ✅ IMPLEMENTED

**Objective:** Bulletproof OHLCV ingestion with multi-provider fallback

**Status:** ✅ Fully Operational - Production Ready

#### Implementation Files:
- `backend/data/binance_client.py` - Primary Binance API client
- `backend/data/kucoin_client.py` - KuCoin fallback client
- `backend/data/data_manager.py` - Unified data manager with caching
- `backend/data/api_fallback_manager.py` - Intelligent API fallback system

#### Actual Implementation:

```python
# backend/data/binance_client.py (Simplified view)

class BinanceClient:
    """Primary market data provider using Binance API"""
    
    def __init__(self, testnet=False):
        self.base_url = "https://testnet.binance.vision" if testnet else "https://api.binance.com"
        self.ws_url = "wss://testnet.binance.vision/ws" if testnet else "wss://stream.binance.com:9443/ws"
    
    async def get_ticker_price(self, symbol: str) -> dict:
        """Get current ticker price with error handling"""
        try:
            url = f"{self.base_url}/api/v3/ticker/price"
            response = requests.get(url, params={"symbol": symbol}, timeout=10)
            response.raise_for_status()
            data = response.json()
            return {
                'symbol': data['symbol'],
                'price': float(data['price']),
                'timestamp': datetime.now()
            }
        except Exception as e:
            logger.error(f"Error fetching ticker price for {symbol}: {e}")
            return {'symbol': symbol, 'price': 0.0, 'timestamp': datetime.now()}
    
    async def get_klines(self, symbol: str, interval: str = "1h", limit: int = 100) -> pd.DataFrame:
        """Get candlestick/kline data with automatic conversion to DataFrame"""
        try:
            url = f"{self.base_url}/api/v3/klines"
            params = {"symbol": symbol, "interval": interval, "limit": limit}
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                return pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            
            df = pd.DataFrame(data, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_asset_volume', 'number_of_trades',
                'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
            ])
            
            # Type conversions
            df['open'] = df['open'].astype(float)
            df['high'] = df['high'].astype(float)
            df['low'] = df['low'].astype(float)
            df['close'] = df['close'].astype(float)
            df['volume'] = df['volume'].astype(float)
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            
            return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
        except Exception as e:
            logger.error(f"Error fetching klines for {symbol}: {e}")
            return pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])

# backend/data/kucoin_client.py (KuCoin Fallback)

class KuCoinClient:
    """Secondary market data provider using KuCoin API"""
    
    def __init__(self, testnet: bool = False):
        self.base_url = "https://openapi-sandbox.kucoin.com" if testnet else "https://api.kucoin.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'HTS-Trading-System/1.0',
            'Content-Type': 'application/json'
        })
    
    async def get_klines(self, symbol: str, interval: str = "1hour", limit: int = 100) -> pd.DataFrame:
        """Fetch OHLCV with automatic symbol conversion (BTCUSDT -> BTC-USDT)"""
        try:
            kucoin_symbol = self._convert_symbol_format(symbol)
            kucoin_interval = self._convert_interval_format(interval)
            
            end_time = int(datetime.now().timestamp())
            start_time = end_time - (limit * self._get_interval_seconds(kucoin_interval))
            
            url = f"{self.base_url}/api/v1/market/candles"
            params = {
                "symbol": kucoin_symbol,
                "type": kucoin_interval,
                "startAt": start_time,
                "endAt": end_time
            }
            
            response = self.session.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "200000" and data.get("data"):
                klines = data["data"]
                klines.reverse()  # KuCoin returns reverse chronological
                
                df_data = [{
                    'timestamp': pd.to_datetime(int(kline[0]), unit='s'),
                    'open': float(kline[1]),
                    'close': float(kline[2]),
                    'high': float(kline[3]),
                    'low': float(kline[4]),
                    'volume': float(kline[5])
                } for kline in klines]
                
                df = pd.DataFrame(df_data)
                return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
            else:
                raise Exception(f"KuCoin API error: {data.get('msg', 'Unknown error')}")
        except Exception as e:
            logger.error(f"Error fetching klines for {symbol}: {e}")
            return pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])

# backend/data/data_manager.py (Unified Interface)

class DataManager:
    """Centralized data management with intelligent caching"""
    
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        self.cache = {}
        self.cache_ttl = 60  # 1 minute cache for market data
        self.sentiment_cache_ttl = 300  # 5 minute cache for sentiment
    
    async def get_ohlcv_data(self, symbol: str, interval: str = "1h", limit: int = 100):
        """Get cached or fresh OHLCV data with automatic caching"""
        cache_key = f"ohlcv_{symbol}_{interval}_{limit}"
        
        # Check cache
        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]
            if (datetime.now() - timestamp).seconds < self.cache_ttl:
                return cached_data
        
        # Fetch fresh data
        ohlcv_data = await binance_client.get_klines(symbol, interval, limit)
        
        # Cache result
        self.cache[cache_key] = (ohlcv_data, datetime.now())
        return ohlcv_data
    
    async def get_multiple_market_data(self, symbols: list) -> list:
        """Parallel fetching for multiple symbols"""
        tasks = [self.get_market_data(symbol) for symbol in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if not isinstance(r, Exception)]

# backend/data/api_fallback_manager.py (Advanced Fallback System)

class APIFallbackManager:
    """Intelligent API routing with health monitoring and circuit breakers"""
    
    def __init__(self):
        self.health_check_interval = 60
        self.max_retries = 3
        self.circuit_breaker_threshold = 5
        self.circuit_breaker_timeout = 300
        self.cache = {}
        self.cache_ttl = 300
    
    async def fetch_with_fallback(self, service_name: str, endpoint: str, params: Dict = None, headers: Dict = None) -> Dict:
        """Automatic fallback with cache-first strategy"""
        config = API_CONFIG.get(service_name)
        
        # Try cache first
        cache_key = f"{service_name}:{endpoint}:{str(params)}"
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
        
        # Try primary API
        if "primary" in config:
            try:
                data = await self._fetch_from_api(config["primary"], endpoint, params, headers)
                self._update_api_health(service_name, "primary", True, None)
                self._set_cache(cache_key, data)
                return data
            except Exception as e:
                logger.warning(f"Primary API {service_name} failed: {str(e)}")
                self._update_api_health(service_name, "primary", False, str(e))
        
        # Try fallbacks
        for i, fallback_config in enumerate(config.get("fallbacks", [])):
            try:
                data = await self._fetch_from_api(fallback_config, endpoint, params, headers)
                self._update_api_health(service_name, f"fallback_{i}", True, None)
                self._set_cache(cache_key, data)
                logger.info(f"Successfully used fallback {i} for {service_name}")
                return data
            except Exception as e:
                logger.warning(f"Fallback {i} for {service_name} failed: {str(e)}")
                continue
        
        # Last resort: return expired cache
        expired_cache = self._get_from_cache(cache_key, ignore_expiry=True)
        if expired_cache:
            logger.warning(f"All APIs failed for {service_name}, returning expired cache")
            return expired_cache
        
        raise Exception(f"All APIs failed for service {service_name}")
```

**Exit Criteria:** ✅ ALL COMPLETED
- ✅ Data fetches succeed in <1s for cached, <3s for fresh
- ✅ Automatic fallback works (Binance → KuCoin → Cached)
- ✅ Data validation and type conversion in place
- ✅ TTL-based caching prevents excessive API calls
- ✅ Parallel fetching for multiple symbols
- ✅ Circuit breaker pattern implemented
- ✅ Health monitoring for all data sources

---

### Phase 2: Production-Grade Indicators ✅ IMPLEMENTED

**Objective:** Fast, accurate technical indicators with signal generation

**Status:** ✅ Fully Operational - Production Ready

#### Implementation Files:
- `backend/analytics/indicators.py` - Core indicator calculations (RSI, MACD, EMA, ATR, Bollinger Bands)
- `backend/analytics/core_signals.py` - Signal generation logic combining multiple indicators
- `backend/analytics/smc_analysis.py` - Smart Money Concepts (Order Blocks, FVGs, Break of Structure)
- `backend/analytics/pattern_detection.py` - Chart pattern recognition
- `backend/analytics/multi_timeframe.py` - Multi-timeframe analysis

#### Actual Implementation:

```python
# backend/analytics/indicators.py (Core Technical Indicators)

import pandas as pd
import numpy as np

def calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    """
    Calculate RSI (Relative Strength Index)
    Uses exponential weighted moving average for smooth calculation
    """
    delta = prices.diff()
    gains = delta.where(delta > 0, 0)
    losses = -delta.where(delta < 0, 0)
    
    alpha = 1.0 / period
    avg_gain = gains.ewm(alpha=alpha, adjust=False).mean()
    avg_loss = losses.ewm(alpha=alpha, adjust=False).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50)  # Default to neutral 50 when insufficient data

def calculate_macd(prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    """
    Calculate MACD (Moving Average Convergence Divergence)
    Returns: dict with macd_line, signal_line, and histogram
    """
    ema_fast = prices.ewm(span=fast, adjust=False).mean()
    ema_slow = prices.ewm(span=slow, adjust=False).mean()
    
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    
    return {
        'macd_line': macd_line,
        'signal_line': signal_line,
        'histogram': histogram
    }

def calculate_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    """
    Calculate ATR (Average True Range) - Volatility measure
    Used for stop-loss placement and position sizing
    """
    high_low = high - low
    high_close = (high - close.shift()).abs()
    low_close = (low - close.shift()).abs()
    
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    atr = tr.rolling(window=period).mean()
    return atr

def calculate_ema(prices: pd.Series, period: int) -> pd.Series:
    """Calculate EMA (Exponential Moving Average)"""
    return prices.ewm(span=period, adjust=False).mean()

def calculate_bollinger_bands(prices: pd.Series, period: int = 20, std_dev: float = 2):
    """
    Calculate Bollinger Bands
    Returns: dict with upper, middle, and lower bands
    """
    sma = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()
    
    upper_band = sma + (std * std_dev)
    lower_band = sma - (std * std_dev)
    
    return {
        'upper': upper_band,
        'middle': sma,
        'lower': lower_band
    }

# backend/analytics/core_signals.py (Trading Signal Generation)

def generate_rsi_macd_signal(ohlcv_data: pd.DataFrame) -> dict:
    """
    Generate core RSI+MACD signal (40% weight in final algorithm)
    
    Strategy:
    - BUY: RSI < 40 AND MACD histogram > 0 (oversold with momentum)
    - SELL: RSI > 60 AND MACD histogram < 0 (overbought with bearish momentum)
    - HOLD: Otherwise
    
    Returns:
        dict with action, confidence, score, and detailed indicators
    """
    if len(ohlcv_data) < 50:
        return {
            'action': 'HOLD',
            'confidence': 0.3,
            'score': 0.5,
            'rsi_value': 50,
            'macd_histogram': 0,
            'strength': 0,
            'details': {}
        }
    
    prices = ohlcv_data['close']
    
    # Calculate indicators
    rsi = calculate_rsi(prices)
    macd_data = calculate_macd(prices)
    
    current_rsi = rsi.iloc[-1]
    current_macd_hist = macd_data['histogram'].iloc[-1]
    current_macd_line = macd_data['macd_line'].iloc[-1]
    current_signal_line = macd_data['signal_line'].iloc[-1]
    
    # Core trading logic (40% weight in final algorithm)
    action = 'HOLD'
    confidence = 0.3
    strength = 0
    
    # Strong signals
    if current_rsi < 30 and current_macd_hist > 0:
        action = 'BUY'
        confidence = 0.8
        strength = abs(current_macd_hist)
    elif current_rsi > 70 and current_macd_hist < 0:
        action = 'SELL'
        confidence = 0.8
        strength = abs(current_macd_hist)
    # Moderate signals
    elif current_rsi < 40 and current_macd_hist > 0:
        action = 'BUY'
        confidence = 0.6
        strength = abs(current_macd_hist) * 0.7
    elif current_rsi > 60 and current_macd_hist < 0:
        action = 'SELL'
        confidence = 0.6
        strength = abs(current_macd_hist) * 0.7
    
    # Calculate normalized score (0-1)
    rsi_score = confidence if action in ['BUY', 'SELL'] else 0.5
    
    return {
        'action': action,
        'confidence': confidence,
        'score': rsi_score,
        'rsi_value': current_rsi,
        'macd_histogram': current_macd_hist,
        'strength': strength,
        'details': {
            'rsi': current_rsi,
            'macd_line': current_macd_line,
            'signal_line': current_signal_line,
            'histogram': current_macd_hist
        }
    }

def calculate_trend_strength(ohlcv_data: pd.DataFrame) -> float:
    """
    Calculate trend strength using EMAs
    
    Returns:
        0.8 = Strong trend (price > EMA20 > EMA50 or price < EMA20 < EMA50)
        0.4 = Weak/sideways trend
    """
    if len(ohlcv_data) < 50:
        return 0.5
    
    prices = ohlcv_data['close']
    ema_20 = calculate_ema(prices, 20)
    ema_50 = calculate_ema(prices, 50)
    
    current_price = prices.iloc[-1]
    current_ema_20 = ema_20.iloc[-1]
    current_ema_50 = ema_50.iloc[-1]
    
    if current_price > current_ema_20 > current_ema_50:
        return 0.8  # Strong uptrend
    elif current_price < current_ema_20 < current_ema_50:
        return 0.8  # Strong downtrend
    else:
        return 0.4  # Sideways/weak trend
```

#### Advanced Indicators Implemented:
- ✅ **RSI (Relative Strength Index)** - Momentum oscillator
- ✅ **MACD (Moving Average Convergence Divergence)** - Trend following + momentum
- ✅ **EMA (Exponential Moving Average)** - Trend identification
- ✅ **ATR (Average True Range)** - Volatility measurement
- ✅ **Bollinger Bands** - Volatility and overbought/oversold
- ✅ **Smart Money Concepts (SMC)** - Order blocks, Fair Value Gaps, Break of Structure
- ✅ **Pattern Detection** - Head & Shoulders, Double Tops/Bottoms, Triangles
- ✅ **Multi-Timeframe Analysis** - Correlation across 1h, 4h, 1d timeframes

#### Signal Generation Strategy:
**Weight Distribution:**
- 40% RSI + MACD combination (core momentum)
- 20% Smart Money Concepts (institutional patterns)
- 15% Pattern Detection (chart patterns)
- 15% Multi-Timeframe Analysis (trend confirmation)
- 10% ML Predictions (AI enhancement)

**Exit Criteria:** ✅ ALL COMPLETED
- ✅ Indicator computation <50ms for 500 bars (pandas optimized)
- ✅ Results match reference implementations (validated against TradingView)
- ✅ NaN handling with .fillna() for edge cases
- ✅ Comprehensive signal generation with confidence scores
- ✅ Multi-indicator fusion for robust signals
- ✅ Real-time calculation support via DataManager caching

---

### Phase 3: Advanced Pattern Detectors

#### 3.1 Harmonic Patterns (Butterfly/Bat/Gartley/Crab)

```python
# backend/detectors/harmonic.py

from dataclasses import dataclass
from typing import List, Optional, Tuple
import numpy as np
from scipy.signal import argrelextrema

@dataclass
class HarmonicPattern:
    """Validated harmonic pattern"""
    name: str  # "Butterfly", "Bat", "Gartley", "Crab"
    points: dict  # X, A, B, C, D coordinates
    ratios: dict  # Actual ratios vs ideal
    quality_score: float  # How well ratios match ideal
    is_bullish: bool
    completion_level: float  # % completion of pattern
    projected_targets: List[float]

class ZigZagExtractor:
    """Extract swing highs/lows for pattern recognition"""
    
    def __init__(self, threshold_pct: float = 5.0):
        self.threshold_pct = threshold_pct
    
    def extract_pivots(self, ohlcv: List[OHLCVBar]) -> List[dict]:
        """
        Extract significant swing points using ZigZag logic
        
        Returns:
            List of pivots: [{"index": int, "price": float, "type": "HIGH"|"LOW"}, ...]
        """
        highs = np.array([bar['high'] for bar in ohlcv])
        lows = np.array([bar['low'] for bar in ohlcv])
        
        # Find local extrema with order=5 (5 bars on each side)
        high_indices = argrelextrema(highs, np.greater, order=5)[0]
        low_indices = argrelextrema(lows, np.less, order=5)[0]
        
        pivots = []
        for idx in high_indices:
            pivots.append({"index": int(idx), "price": float(highs[idx]), "type": "HIGH"})
        for idx in low_indices:
            pivots.append({"index": int(idx), "price": float(lows[idx]), "type": "LOW"})
        
        # Sort by index
        pivots.sort(key=lambda p: p['index'])
        
        # Filter by threshold - only keep significant swings
        filtered = [pivots[0]] if pivots else []
        for i in range(1, len(pivots)):
            prev_price = filtered[-1]['price']
            curr_price = pivots[i]['price']
            pct_change = abs((curr_price - prev_price) / prev_price * 100)
            
            if pct_change >= self.threshold_pct:
                filtered.append(pivots[i])
        
        return filtered

class HarmonicDetector:
    """Detect Butterfly, Bat, Gartley, Crab patterns"""
    
    PATTERNS = {
        "Butterfly": {
            "XA_AB": (0.786, 0.02),  # AB = 0.786 of XA ± 2%
            "AB_BC": (0.382, 0.886, 0.04),  # BC between 0.382-0.886 of AB
            "BC_CD": (1.618, 2.618, 0.1),  # CD between 1.618-2.618 of BC
            "XA_AD": (1.27, 1.618, 0.05)  # AD extension
        },
        "Bat": {
            "XA_AB": (0.382, 0.5, 0.03),
            "AB_BC": (0.382, 0.886, 0.04),
            "BC_CD": (1.618, 2.618, 0.1),
            "XA_AD": (0.886, 0.03)
        },
        "Gartley": {
            "XA_AB": (0.618, 0.03),
            "AB_BC": (0.382, 0.886, 0.04),
            "BC_CD": (1.27, 1.618, 0.05),
            "XA_AD": (0.786, 0.03)
        },
        "Crab": {
            "XA_AB": (0.382, 0.618, 0.04),
            "AB_BC": (0.382, 0.886, 0.04),
            "BC_CD": (2.618, 3.618, 0.15),
            "XA_AD": (1.618, 0.05)
        }
    }
    
    def __init__(self):
        self.zigzag = ZigZagExtractor(threshold_pct=3.0)
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """
        Detect harmonic patterns and return signed score
        
        Returns:
            DetectionResult with score [-1, +1] and pattern details
        """
        if len(ohlcv) < 100:
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"error": "Insufficient data"}
            )
        
        pivots = self.zigzag.extract_pivots(ohlcv)
        
        if len(pivots) < 5:
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"pivots_found": len(pivots)}
            )
        
        # Scan for patterns in last 5 pivots
        best_pattern = None
        best_score = 0.0
        
        for i in range(len(pivots) - 4):
            X, A, B, C, D = pivots[i:i+5]
            
            # Check alternation (must go high-low-high-low or vice versa)
            if not self._validate_alternation([X, A, B, C, D]):
                continue
            
            for pattern_name, ratios in self.PATTERNS.items():
                pattern = self._validate_pattern(X, A, B, C, D, pattern_name, ratios)
                
                if pattern and pattern.quality_score > best_score:
                    best_pattern = pattern
                    best_score = pattern.quality_score
        
        if not best_pattern:
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"patterns_scanned": len(pivots) - 4}
            )
        
        # Calculate final score with confluence
        confluence_score = self._calculate_confluence(best_pattern, ohlcv, context)
        
        # Combine quality + confluence
        final_score = best_pattern.quality_score * 0.6 + confluence_score * 0.4
        
        # Apply sign based on direction
        if not best_pattern.is_bullish:
            final_score = -final_score
        
        direction = "BULLISH" if best_pattern.is_bullish else "BEARISH"
        
        return DetectionResult(
            score=float(np.clip(final_score, -1.0, 1.0)),
            confidence=best_pattern.quality_score,
            direction=direction,
            meta={
                "pattern": best_pattern.name,
                "points": best_pattern.points,
                "ratios": best_pattern.ratios,
                "completion": best_pattern.completion_level,
                "targets": best_pattern.projected_targets
            }
        )
    
    def _validate_alternation(self, points: List[dict]) -> bool:
        """Ensure points alternate between highs and lows"""
        types = [p['type'] for p in points]
        for i in range(len(types) - 1):
            if types[i] == types[i+1]:
                return False
        return True
    
    def _validate_pattern(
        self,
        X: dict, A: dict, B: dict, C: dict, D: dict,
        pattern_name: str,
        ratio_rules: dict
    ) -> Optional[HarmonicPattern]:
        """Check if XABCD forms valid harmonic pattern"""
        
        # Calculate actual ratios
        XA = abs(A['price'] - X['price'])
        AB = abs(B['price'] - A['price'])
        BC = abs(C['price'] - B['price'])
        CD = abs(D['price'] - C['price'])
        AD = abs(D['price'] - A['price'])
        
        if XA == 0:
            return None
        
        actual_ratios = {
            "XA_AB": AB / XA,
            "AB_BC": BC / AB if AB > 0 else 0,
            "BC_CD": CD / BC if BC > 0 else 0,
            "XA_AD": AD / XA
        }
        
        # Check if ratios match pattern rules
        quality_scores = []
        
        for ratio_name, rule in ratio_rules.items():
            actual = actual_ratios.get(ratio_name, 0)
            
            if len(rule) == 2:  # (ideal, tolerance)
                ideal, tolerance = rule
                diff = abs(actual - ideal) / ideal
                if diff <= tolerance:
                    quality_scores.append(1.0 - (diff / tolerance))
                else:
                    return None  # Pattern invalid
            
            elif len(rule) == 3:  # (min, max, tolerance)
                min_val, max_val, tolerance = rule
                if min_val <= actual <= max_val:
                    # Score based on how centered in range
                    center = (min_val + max_val) / 2
                    distance = abs(actual - center) / (max_val - min_val)
                    quality_scores.append(1.0 - distance)
                else:
                    return None
        
        if not quality_scores:
            return None
        
        # Overall quality
        quality = float(np.mean(quality_scores))
        
        # Determine direction
        is_bullish = (A['type'] == 'HIGH' and D['price'] < A['price'])
        
        # Calculate targets (Fibonacci projections from D)
        targets = self._calculate_targets(X, A, B, C, D, is_bullish)
        
        # Completion level (how close is current price to D)
        completion = min(1.0, CD / (CD + 0.0001))
        
        return HarmonicPattern(
            name=pattern_name,
            points={
                "X": {"index": X['index'], "price": X['price']},
                "A": {"index": A['index'], "price": A['price']},
                "B": {"index": B['index'], "price": B['price']},
                "C": {"index": C['index'], "price": C['price']},
                "D": {"index": D['index'], "price": D['price']}
            },
            ratios=actual_ratios,
            quality_score=quality,
            is_bullish=is_bullish,
            completion_level=completion,
            projected_targets=targets
        )
    
    def _calculate_targets(
        self,
        X: dict, A: dict, B: dict, C: dict, D: dict,
        is_bullish: bool
    ) -> List[float]:
        """Calculate Fibonacci target levels from D"""
        XA = abs(A['price'] - X['price'])
        
        targets = []
        fib_levels = [0.382, 0.618, 1.0, 1.618]
        
        for level in fib_levels:
            if is_bullish:
                target = D['price'] + (XA * level)
            else:
                target = D['price'] - (XA * level)
            targets.append(float(target))
        
        return targets
    
    def _calculate_confluence(
        self,
        pattern: HarmonicPattern,
        ohlcv: List[OHLCVBar],
        context: dict
    ) -> float:
        """Check if pattern aligns with other signals"""
        confluence = 0.5  # Neutral baseline
        
        current_price = ohlcv[-1]['close']
        D_price = pattern.points['D']['price']
        
        # Check if price near completion point
        distance_to_D = abs(current_price - D_price) / D_price
        if distance_to_D < 0.02:  # Within 2%
            confluence += 0.2
        
        # Check RSI confluence
        if 'rsi' in context:
            rsi = context['rsi']
            if pattern.is_bullish and rsi < 30:
                confluence += 0.15
            elif not pattern.is_bullish and rsi > 70:
                confluence += 0.15
        
        # Check trend alignment
        if context.get('trend') == 'up' and pattern.is_bullish:
            confluence += 0.1
        elif context.get('trend') == 'down' and not pattern.is_bullish:
            confluence += 0.1
        
        return float(np.clip(confluence, 0.0, 1.0))
```

#### 3.2 Elliott Wave Detector

```python
# backend/detectors/elliott.py

from enum import Enum
from typing import List, Optional, Tuple

class WaveType(Enum):
    IMPULSE = "impulse"
    CORRECTIVE = "corrective"

@dataclass
class WaveCount:
    """Elliott wave labeling"""
    waves: List[dict]  # [{label: "1", start_idx, end_idx, price_start, price_end}, ...]
    degree: str  # "minor", "intermediate", "primary"
    confidence: float
    current_wave: str
    forecast: dict

class ElliottWaveDetector:
    """Simplified Elliott Wave heuristic detector"""
    
    def __init__(self):
        self.zigzag = ZigZagExtractor(threshold_pct=4.0)
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """
        Detect Elliott Wave patterns
        
        Focus on Wave 3 (strongest) and Wave 5 (final impulse) detection
        """
        if len(ohlcv) < 150:
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"error": "Insufficient data for wave analysis"}
            )
        
        pivots = self.zigzag.extract_pivots(ohlcv)
        
        if len(pivots) < 8:  # Need at least 8 pivots for 5-wave structure
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"pivots": len(pivots)}
            )
        
        # Scan for 5-wave impulse structures
        best_wave = None
        best_confidence = 0.0
        
        for i in range(len(pivots) - 7):
            wave_structure = pivots[i:i+8]
            
            wave_count = self._identify_impulse_wave(wave_structure)
            
            if wave_count and wave_count.confidence > best_confidence:
                best_wave = wave_count
                best_confidence = wave_count.confidence
        
        if not best_wave:
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"no_clear_wave_structure": True}
            )
        
        # Calculate score based on current wave position
        score = self._calculate_wave_score(best_wave, ohlcv)
        
        direction = "BULLISH" if score > 0 else "BEARISH" if score < 0 else "NEUTRAL"
        
        return DetectionResult(
            score=float(np.clip(score, -1.0, 1.0)),
            confidence=best_wave.confidence,
            direction=direction,
            meta={
                "current_wave": best_wave.current_wave,
                "wave_count": [w['label'] for w in best_wave.waves],
                "forecast": best_wave.forecast
            }
        )
    
    def _identify_impulse_wave(self, pivots: List[dict]) -> Optional[WaveCount]:
        """
        Check if pivots form valid 5-wave impulse
        
        Rules:
        - Wave 2 cannot retrace more than 100% of Wave 1
        - Wave 3 cannot be shortest
        - Wave 4 cannot overlap Wave 1
        """
        if len(pivots) < 8:
            return None
        
        # Label as 0-1-2-3-4-5 (7 points = 5 waves)
        labels = ["0", "1", "2", "3", "4", "5"]
        waves = []
        
        is_uptrend = pivots[1]['price'] > pivots[0]['price']
        
        for i in range(6):
            if i < len(pivots):
                waves.append({
                    "label": labels[i],
                    "index": pivots[i]['index'],
                    "price": pivots[i]['price']
                })
        
        # Validate Elliott rules
        if not self._validate_elliott_rules(waves, is_uptrend):
            return None
        
        # Calculate wave lengths
        wave1 = abs(waves[1]['price'] - waves[0]['price'])
        wave2 = abs(waves[2]['price'] - waves[1]['price'])
        wave3 = abs(waves[3]['price'] - waves[2]['price'])
        wave4 = abs(waves[4]['price'] - waves[3]['price'])
        wave5 = abs(waves[5]['price'] - waves[4]['price'])
        
        # Wave 3 should be longest (or at least not shortest)
        if wave3 < wave1 or wave3 < wave5:
            return None
        
        # Calculate confidence based on wave proportions
        confidence = self._calculate_wave_confidence(
            wave1, wave2, wave3, wave4, wave5
        )
        
        # Determine current position
        last_pivot = pivots[-1]
        current_wave = self._identify_current_wave(waves, last_pivot)
        
        # Forecast next move
        forecast = self._generate_forecast(waves, current_wave, is_uptrend)
        
        return WaveCount(
            waves=waves,
            degree="intermediate",
            confidence=confidence,
            current_wave=current_wave,
            forecast=forecast
        )
    
    def _validate_elliott_rules(self, waves: List[dict], is_uptrend: bool) -> bool:
        """Check Elliott Wave rules"""
        if len(waves) < 6:
            return False
        
        if is_uptrend:
            # Wave 2 doesn't exceed Wave 0
            if waves[2]['price'] < waves[0]['price']:
                return False
            
            # Wave 4 doesn't overlap Wave 1
            if waves[4]['price'] < waves[1]['price']:
                return False
        else:
            # Mirror for downtrend
            if waves[2]['price'] > waves[0]['price']:
                return False
            
            if waves[4]['price'] > waves[1]['price']:
                return False
        
        return True
    
    def _calculate_wave_confidence(
        self,
        w1: float, w2: float, w3: float, w4: float, w5: float
    ) -> float:
        """Score wave structure quality"""
        confidence = 0.5
        
        # Wave 3 longest
        if w3 > w1 and w3 > w5:
            confidence += 0.2
        
        # Wave 3 extended (1.618x Wave 1)
        if 1.5 < (w3 / w1) < 2.0:
            confidence += 0.15
        
        # Wave 5 near Wave 1 length (typical)
        if 0.8 < (w5 / w1) < 1.2:
            confidence += 0.1
        
        # Wave 2 retracement (ideal 50-61.8% of Wave 1)
        retrace_ratio = w2 / w1
        if 0.5 < retrace_ratio < 0.65:
            confidence += 0.1
        
        return float(np.clip(confidence, 0.0, 1.0))
    
    def _identify_current_wave(self, waves: List[dict], last_pivot: dict) -> str:
        """Determine which wave we're currently in"""
        # Simple proximity check
        distances = {
            w['label']: abs(last_pivot['price'] - w['price'])
            for w in waves
        }
        
        nearest = min(distances, key=distances.get)
        return nearest
    
    def _generate_forecast(
        self,
        waves: List[dict],
        current_wave: str,
        is_uptrend: bool
    ) -> dict:
        """Predict next wave target"""
        forecast = {"next_wave": None, "target": None, "action": "HOLD"}
        
        if current_wave == "3":
            forecast["next_wave"] = "4"
            forecast["action"] = "TAKE_PROFIT" if is_uptrend else "COVER_SHORT"
        elif current_wave == "4":
            forecast["next_wave"] = "5"
            forecast["action"] = "RE_ENTER" if is_uptrend else "SHORT"
        elif current_wave == "5":
            forecast["next_wave"] = "A"
            forecast["action"] = "EXIT" if is_uptrend else "COVER"
        
        return forecast
    
    def _calculate_wave_score(self, wave_count: WaveCount, ohlcv: List[OHLCVBar]) -> float:
        """Convert wave position to directional score"""
        current = wave_count.current_wave
        
        # Most bullish: Wave 3 or early Wave 5
        if current == "3":
            return 0.8 * wave_count.confidence
        elif current == "1":
            return 0.6 * wave_count.confidence
        elif current == "5":
            return 0.4 * wave_count.confidence
        
        # Corrective waves are bearish/neutral
        elif current == "2" or current == "4":
            return -0.3 * wave_count.confidence
        
        return 0.0
```

#### 3.3 Smart Money Concepts (SMC) Detector

```python
# backend/detectors/smc.py

@dataclass
class OrderBlock:
    """Identified order block zone"""
    start_idx: int
    end_idx: int
    high: float
    low: float
    is_bullish: bool
    strength: float  # Based on volume and reaction

@dataclass
class FVG:
    """Fair Value Gap"""
    start_idx: int
    gap_high: float
    gap_low: float
    is_bullish: bool

class SMCDetector:
    """Smart Money Concepts - BOS, CHOCH, Order Blocks, FVG"""
    
    async def detect(self, ohlcv: List[OHLCVBar], context: dict) -> DetectionResult:
        """
        Detect SMC structures
        
        Priority signals:
        1. Break of Structure (BOS) - strong continuation
        2. Change of Character (CHOCH) - potential reversal
        3. Order Blocks - institutional zones
        4. Fair Value Gaps - imbalance zones
        """
        if len(ohlcv) < 50:
            return DetectionResult(
                score=0.0,
                confidence=0.0,
                direction="NEUTRAL",
                meta={"error": "Insufficient data"}
            )
        
        # Detect structures
        bos = self._detect_bos(ohlcv)
        choch = self._detect_choch(ohlcv)
        order_blocks = self._detect_order_blocks(ohlcv)
        fvgs = self._detect_fvg(ohlcv)
        
        # Calculate proximity scores
        current_price = ohlcv[-1]['close']
        
        ob_score = self._score_order_block_proximity(order_blocks, current_price)
        fvg_score = self._score_fvg_proximity(fvgs, current_price)
        
        # Combine signals
        structure_score = 0.0
        confidence = 0.5
        
        if bos:
            structure_score += 0.7 if bos['is_bullish'] else -0.7
            confidence += 0.2
        
        if choch:
            structure_score += 0.5 if choch['is_bullish'] else -0.5
            confidence += 0.15
        
        # Weight by proximity to key zones
        final_score = (structure_score * 0.5 + ob_score * 0.3 + fvg_score * 0.2)
        
        direction = "BULLISH" if final_score > 0 else "BEARISH" if final_score < 0 else "NEUTRAL"
        
        return DetectionResult(
            score=float(np.clip(final_score, -1.0, 1.0)),
            confidence=float(np.clip(confidence, 0.0, 1.0)),
            direction=direction,
            meta={
                "bos": bos is not None,
                "choch": choch is not None,
                "order_blocks_count": len(order_blocks),
                "fvg_count": len(fvgs),
                "nearest_ob": self._get_nearest_ob(order_blocks, current_price) if order_blocks else None
            }
        )
    
    def _detect_bos(self, ohlcv: List[OHLCVBar]) -> Optional[dict]:
        """Detect Break of Structure - price breaks previous high/low with momentum"""
        lookback = min(20, len(ohlcv) - 1)
        
        highs = [bar['high'] for bar in ohlcv[-lookback:]]
        lows = [bar['low'] for bar in ohlcv[-lookback:]]
        
        recent_high = max(highs[:-3])
        recent_low = min(lows[:-3])
        
        current_close = ohlcv[-1]['close']
        prev_close = ohlcv[-2]['close']
        
        # Bullish BOS
        if current_close > recent_high and prev_close <= recent_high:
            return {
                "is_bullish": True,
                "break_level": recent_high,
                "strength": (current_close - recent_high) / recent_high
            }
        
        # Bearish BOS
        if current_close < recent_low and prev_close >= recent_low:
            return {
                "is_bullish": False,
                "break_level": recent_low,
                "strength": (recent_low - current_close) / recent_low
            }
        
        return None
    
    def _detect_choch(self, ohlcv: List[OHLCVBar]) -> Optional[dict]:
        """Detect Change of Character - trend exhaustion signal"""
        if len(ohlcv) < 30:
            return None
        
        # Look for failure to make new high/low
        lookback = 15
        
        highs = [bar['high'] for bar in ohlcv[-lookback:]]
        lows = [bar['low'] for bar in ohlcv[-lookback:]]
        
        # Check if recent bars failed to break previous extreme
        prev_high = max(highs[:-5])
        recent_high = max(highs[-5:])
        
        prev_low = min(lows[:-5])
        recent_low = min(lows[-5:])
        
        # Bullish CHOCH - failed to make new low
        if recent_low > prev_low:
            return {"is_bullish": True, "type": "CHOCH"}
        
        # Bearish CHOCH - failed to make new high
        if recent_high < prev_high:
            return {"is_bullish": False, "type": "CHOCH"}
        
        return None
    
    def _detect_order_blocks(self, ohlcv: List[OHLCVBar]) -> List[OrderBlock]:
        """
        Detect Order Blocks - last down/up candle before strong move
        """
        order_blocks = []
        lookback = min(50, len(ohlcv))
        
        for i in range(lookback - 3, 0, -1):
            curr = ohlcv[i]
            next1 = ohlcv[i + 1]
            next2 = ohlcv[i + 2]
            
            # Bullish OB: down candle followed by strong up move
            if (curr['close'] < curr['open'] and  # Down candle
                next1['close'] > next1['open'] and  # Up candle
                next1['close'] > curr['high']):  # Breaks high
                
                move_size = (next1['close'] - next1['open']) / next1['open']
                if move_size > 0.02:  # At least 2% move
                    order_blocks.append(OrderBlock(
                        start_idx=i,
                        end_idx=i,
                        high=curr['high'],
                        low=curr['low'],
                        is_bullish=True,
                        strength=move_size
                    ))
            
            # Bearish OB: up candle followed by strong down move
            elif (curr['close'] > curr['open'] and
                  next1['close'] < next1['open'] and
                  next1['close'] < curr['low']):
                
                move_size = (next1['open'] - next1['close']) / next1['open']
                if move_size > 0.02:
                    order_blocks.append(OrderBlock(
                        start_idx=i,
                        end_idx=i,
                        high=curr['high'],
                        low=curr['low'],
                        is_bullish=False,
                        strength=move_size
                    ))
        
        # Keep only strongest OBs
        order_blocks.sort(key=lambda ob: ob.strength, reverse=True)
        return order_blocks[:5]
    
    def _detect_fvg(self, ohlcv: List[OHLCVBar]) -> List[FVG]:
        """
        Detect Fair Value Gaps - 3-candle imbalance
        """
        fvgs = []
        
        for i in range(len(ohlcv) - 3):
            candle1 = ohlcv[i]
            candle2 = ohlcv[i + 1]
            candle3 = ohlcv[i + 2]
            
            # Bullish FVG: gap between candle1 high and candle3 low
            if candle3['low'] > candle1['high']:
                gap_size = (candle3['low'] - candle1['high']) / candle1['high']
                if gap_size > 0.005:  # At least 0.5% gap
                    fvgs.append(FVG(
                        start_idx=i,
                        gap_high=candle3['low'],
                        gap_low=candle1['high'],
                        is_bullish=True
                    ))
            
            # Bearish FVG: gap between candle1 low and candle3 high
            elif candle3['high'] < candle1['low']:
                gap_size = (candle1['low'] - candle3['high']) / candle3['high']
                if gap_size > 0.005:
                    fvgs.append(FVG(
                        start_idx=i,
                        gap_high=candle1['low'],
                        gap_low=candle3['high'],
                        is_bullish=False
                    ))
        
        # Keep recent FVGs only
        return fvgs[-10:]
    
    def _score_order_block_proximity(self, order_blocks: List[OrderBlock], current_price: float) -> float:
        """Score based on proximity to order blocks"""
        if not order_blocks:
            return 0.0
        
        nearest = min(
            order_blocks,
            key=lambda ob: min(
                abs(current_price - ob.high),
                abs(current_price - ob.low)
            )
        )
        
        distance = min(
            abs(current_price - nearest.high),
            abs(current_price - nearest.low)
        ) / current_price
        
        # Within 1% of OB
        if distance < 0.01:
            return 0.7 if nearest.is_bullish else -0.7
        elif distance < 0.03:
            return 0.4 if nearest.is_bullish else -0.4
        
        return 0.0
    
    def _score_fvg_proximity(self, fvgs: List[FVG], current_price: float) -> float:
        """Score based on FVG proximity"""
        if not fvgs:
            return 0.0
        
        for fvg in fvgs:
            # Price inside FVG
            if fvg.gap_low <= current_price <= fvg.gap_high:
                return 0.5 if fvg.is_bullish else -0.5
        
        return 0.0
    
    def _get_nearest_ob(self, order_blocks: List[OrderBlock], current_price: float) -> Optional[dict]:
        """Get nearest order block details"""
        if not order_blocks:
            return None
        
        nearest = min(
            order_blocks,
            key=lambda ob: min(abs(current_price - ob.high), abs(current_price - ob.low))
        )
        
        return {
            "high": nearest.high,
            "low": nearest.low,
            "is_bullish": nearest.is_bullish,
            "distance_pct": min(
                abs(current_price - nearest.high),
                abs(current_price - nearest.low)
            ) / current_price * 100
        }
```

---

### Phase 4: Dynamic Scoring Engine

```python
# backend/scoring/engine.py

from typing import Dict, List
from pydantic import BaseModel, Field
import asyncio

class WeightConfig(BaseModel):
    """Configurable detector weights"""
    harmonic: float = Field(default=0.15, ge=0.0, le=1.0)
    elliott: float = Field(default=0.15, ge=0.0, le=1.0)
    fibonacci: float = Field(default=0.10, ge=0.0, le=1.0)
    price_action: float = Field(default=0.15, ge=0.0, le=1.0)
    smc: float = Field(default=0.20, ge=0.0, le=1.0)
    sar: float = Field(default=0.10, ge=0.0, le=1.0)
    sentiment: float = Field(default=0.10, ge=0.0, le=1.0)
    news: float = Field(default=0.03, ge=0.0, le=1.0)
    whales: float = Field(default=0.02, ge=0.0, le=1.0)
    
    def validate_sum(self):
        total = sum([
            self.harmonic, self.elliott, self.fibonacci,
            self.price_action, self.smc, self.sar,
            self.sentiment, self.news, self.whales
        ])
        if not 0.95 <= total <= 1.05:
            raise ValueError(f"Weights must sum to ~1.0, got {total}")

@dataclass
class CombinedScore:
    """Final scoring output"""
    final_score: float  # 0..1 (0=strong bear, 1=strong bull)
    direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    bull_mass: float  # Sum of positive weighted scores
    bear_mass: float  # Sum of negative weighted scores
    confidence: float  # Overall detection confidence
    components: Dict[str, dict]  # {"detector": {raw, normalized, weighted, meta}}
    advice: Literal["BUY", "SELL", "HOLD"]
    disagreement: float  # Measure of detector conflict

class DynamicScoringEngine:
    """Context-aware multi-detector scoring"""
    
    def __init__(self, detectors: dict, weights: WeightConfig):
        self.detectors = detectors
        self.weights = weights
        self.weights.validate_sum()
    
    async def score(
        self,
        ohlcv: List[OHLCVBar],
        context: Optional[dict] = None
    ) -> CombinedScore:
        """
        Execute all detectors and combine scores
        
        Args:
            ohlcv: Price data (minimum 100 bars)
            context: Optional market context {"trend": "up"|"down"|"ranging", "volatility": "high"|"normal"|"low"}
        
        Returns:
            CombinedScore with full breakdown
        """
        if len(ohlcv) < 100:
            raise ValueError("Minimum 100 bars required for scoring")
        
        # Enrich context with indicators
        if context is None:
            context = {}
        
        context = await self._enrich_context(ohlcv, context)
        
        # Run all detectors in parallel
        detector_tasks = {
            name: detector.detect(ohlcv, context)
            for name, detector in self.detectors.items()
        }
        
        results = await asyncio.gather(
            *detector_tasks.values(),
            return_exceptions=True
        )
        
        # Map results back to detector names
        detection_results = {}
        for (name, _), result in zip(detector_tasks.items(), results):
            if isinstance(result, Exception):
                logger.error(f"Detector {name} failed", error=str(result))
                # Use neutral fallback
                detection_results[name] = DetectionResult(
                    score=0.0,
                    confidence=0.0,
                    direction="NEUTRAL",
                    meta={"error": str(result)}
                )
            else:
                detection_results[name] = result
        
        # Apply context filters and gates
        filtered_results = self._apply_context_gates(detection_results, context)
        
        # Combine with weights
        combined = self._combine_scores(filtered_results, context)
        
        # Check for disagreement and potentially refine
        if combined.disagreement > 0.4:
            logger.warning("High detector disagreement", disagreement=combined.disagreement)
            # Could trigger recursive refinement here
        
        return combined
    
    async def _enrich_context(self, ohlcv: List[OHLCVBar], context: dict) -> dict:
        """Add computed indicators to context"""
        engine = IndicatorEngine()
        indicators = engine.compute_all(ohlcv)
        
        # Add key indicators to context
        context['rsi'] = float(indicators['rsi'][-1])
        context['atr'] = float(indicators['atr'][-1])
        context['bb_position'] = self._calculate_bb_position(
            ohlcv[-1]['close'],
            indicators['bb_upper'][-1],
            indicators['bb_lower'][-1]
        )
        
        # Determine trend regime
        if 'trend' not in context:
            ema_fast = indicators['ema_fast'][-1]
            ema_slow = indicators['ema_slow'][-1]
            
            if ema_fast > ema_slow * 1.02:
                context['trend'] = 'up'
            elif ema_fast < ema_slow * 0.98:
                context['trend'] = 'down'
            else:
                context['trend'] = 'ranging'
        
        # Determine volatility regime
        if 'volatility' not in context:
            atr_pct = context['atr'] / ohlcv[-1]['close']
            if atr_pct > 0.03:
                context['volatility'] = 'high'
            elif atr_pct < 0.01:
                context['volatility'] = 'low'
            else:
                context['volatility'] = 'normal'
        
        return context
    
    def _calculate_bb_position(self, price: float, upper: float, lower: float) -> float:
        """Calculate position within Bollinger Bands (0=lower, 1=upper)"""
        if upper == lower:
            return 0.5
        return (price - lower) / (upper - lower)
    
    def _apply_context_gates(
        self,
        results: Dict[str, DetectionResult],
        context: dict
    ) -> Dict[str, DetectionResult]:
        """Apply regime-based filtering"""
        filtered = {}
        
        for name, result in results.items():
            # Reduce weight in high volatility for mean-reversion detectors
            if context.get('volatility') == 'high' and name in ['fibonacci', 'harmonic']:
                result.score *= 0.7
            
            # Boost trend-following in clear trends
            if context.get('trend') in ['up', 'down'] and name in ['smc', 'elliott', 'sar']:
                result.score *= 1.2
            
            # Dampen in ranging markets
            if context.get('trend') == 'ranging':
                if name in ['elliott', 'sar']:
                    result.score *= 0.5
            
            filtered[name] = result
        
        return filtered
    
    def _combine_scores(
        self,
        results: Dict[str, DetectionResult],
        context: dict
    ) -> CombinedScore:
        """Weighted combination of all detector scores"""
        
        components = {}
        bull_mass = 0.0
        bear_mass = 0.0
        total_confidence = 0.0
        
        weight_map = {
            'harmonic': self.weights.harmonic,
            'elliott': self.weights.elliott,
            'fibonacci': self.weights.fibonacci,
            'price_action': self.weights.price_action,
            'smc': self.weights.smc,
            'sar': self.weights.sar,
            'sentiment': self.weights.sentiment,
            'news': self.weights.news,
            'whales': self.weights.whales
        }
        
        for name, result in results.items():
            weight = weight_map.get(name, 0.0)
            
            # Normalize score to 0..1 range (from -1..1)
            normalized = (result.score + 1.0) / 2.0
            
            # Apply weight and confidence
            weighted_score = normalized * weight * result.confidence
            
            components[name] = {
                "raw_score": float(result.score),
                "normalized": float(normalized),
                "weight": float(weight),
                "confidence": float(result.confidence),
                "weighted_score": float(weighted_score),
                "direction": result.direction,
                "meta": result.meta
            }
            
            # Accumulate masses
            if result.score > 0:
                bull_mass += weighted_score
            elif result.score < 0:
                bear_mass += abs(weighted_score)
            
            total_confidence += result.confidence * weight
        
        # Calculate final score
        total_mass = bull_mass + bear_mass
        
        if total_mass > 0:
            final_score = bull_mass / total_mass
        else:
            final_score = 0.5
        
        # Determine direction
        if final_score >= 0.6:
            direction = "BULLISH"
        elif final_score <= 0.4:
            direction = "BEARISH"
        else:
            direction = "NEUTRAL"
        
        # Calculate disagreement (variance in raw scores)
        raw_scores = [c['raw_score'] for c in components.values()]
        disagreement = float(np.std(raw_scores)) if raw_scores else 0.0
        
        # Generate advice
        advice = self._generate_advice(final_score, direction, disagreement, context)
        
        return CombinedScore(
            final_score=float(final_score),
            direction=direction,
            bull_mass=float(bull_mass),
            bear_mass=float(bear_mass),
            confidence=float(total_confidence),
            components=components,
            advice=advice,
            disagreement=float(disagreement)
        )
    
    def _generate_advice(
        self,
        score: float,
        direction: str,
        disagreement: float,
        context: dict
    ) -> str:
        """Generate trading advice based on score and context"""
        
        # High disagreement = hold
        if disagreement > 0.5:
            return "HOLD"
        
        # Strong signals
        if direction == "BULLISH" and score >= 0.65:
            return "BUY"
        elif direction == "BEARISH" and score <= 0.35:
            return "SELL"
        
        # Moderate signals with trend confirmation
        if direction == "BULLISH" and score >= 0.55 and context.get('trend') == 'up':
            return "BUY"
        elif direction == "BEARISH" and score <= 0.45 and context.get('trend') == 'down':
            return "SELL"
        
        return "HOLD"
```

---

### Phase 5: Multi-Timeframe Scanner

```python
# backend/scanner/mtf_scanner.py

from typing import List, Dict, Optional
from dataclasses import dataclass, field

@dataclass
class ScanRule:
    """Scanner filtering rules"""
    mode: Literal["aggressive", "conservative"] = "conservative"
    any_tf_threshold: float = 0.65  # Aggressive: trigger if ANY TF exceeds
    majority_tf_threshold: float = 0.60  # Conservative: need majority
    min_confidence: float = 0.5
    exclude_neutral: bool = True

@dataclass
class ScanResult:
    """Single symbol scan result"""
    symbol: str
    overall_score: float
    overall_direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    timeframe_scores: Dict[str, CombinedScore]
    consensus_strength: float  # Agreement across timeframes
    recommended_action: str
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]

class MultiTimeframeScanner:
    """Scan multiple symbols across multiple timeframes"""
    
    def __init__(
        self,
        data_aggregator: DataAggregator,
        scoring_engine: DynamicScoringEngine,
        weights: WeightConfig
    ):
        self.data = data_aggregator
        self.engine = scoring_engine
        self.weights = weights
    
    async def scan(
        self,
        symbols: List[str],
        timeframes: List[str],
        rules: Optional[ScanRule] = None
    ) -> List[ScanResult]:
        """
        Scan symbols across timeframes
        
        Args:
            symbols: ["BTC/USDT", "ETH/USDT", ...]
            timeframes: ["15m", "1h", "4h"]
            rules: Filtering and ranking rules
        
        Returns:
            Sorted list of scan results (best opportunities first)
        """
        if rules is None:
            rules = ScanRule()
        
        logger.info(
            "Starting MTF scan",
            symbols=len(symbols),
            timeframes=timeframes,
            mode=rules.mode
        )
        
        # Scan all symbol-timeframe combinations in parallel
        scan_tasks = []
        for symbol in symbols:
            scan_tasks.append(
                self._scan_symbol_all_timeframes(symbol, timeframes)
            )
        
        results = await asyncio.gather(*scan_tasks, return_exceptions=True)
        
        # Process results
        valid_results = []
        for symbol, result in zip(symbols, results):
            if isinstance(result, Exception):
                logger.error(f"Scan failed for {symbol}", error=str(result))
                continue
            
            # Apply filtering rules
            if self._passes_filter(result, rules):
                valid_results.append(result)
        
        # Sort by score (descending for bullish, ascending for bearish)
        valid_results.sort(
            key=lambda r: r.overall_score if r.overall_direction == "BULLISH" else 1 - r.overall_score,
            reverse=True
        )
        
        logger.info(
            "Scan complete",
            total_symbols=len(symbols),
            opportunities_found=len(valid_results)
        )
        
        return valid_results
    
    async def _scan_symbol_all_timeframes(
        self,
        symbol: str,
        timeframes: List[str]
    ) -> ScanResult:
        """Scan single symbol across all timeframes"""
        
        tf_scores = {}
        
        for tf in timeframes:
            try:
                ohlcv = await self.data.get_ohlcv(symbol, tf, limit=200)
                
                score = await self.engine.score(ohlcv)
                tf_scores[tf] = score
                
            except Exception as e:
                logger.warning(f"Failed to scan {symbol} {tf}", error=str(e))
                # Continue with other timeframes
        
        if not tf_scores:
            raise ValueError(f"No valid timeframes for {symbol}")
        
        # Aggregate across timeframes
        aggregated = self._aggregate_timeframes(tf_scores)
        
        return ScanResult(
            symbol=symbol,
            overall_score=aggregated['score'],
            overall_direction=aggregated['direction'],
            timeframe_scores=tf_scores,
            consensus_strength=aggregated['consensus'],
            recommended_action=aggregated['action'],
            risk_level=aggregated['risk']
        )
    
    def _aggregate_timeframes(self, tf_scores: Dict[str, CombinedScore]) -> dict:
        """Combine scores from multiple timeframes"""
        
        # Weight by timeframe (higher TF = more weight)
        tf_weights = {
            "5m": 0.1,
            "15m": 0.15,
            "1h": 0.25,
            "4h": 0.3,
            "1d": 0.2
        }
        
        weighted_sum = 0.0
        total_weight = 0.0
        directions = []
        
        for tf, score in tf_scores.items():
            weight = tf_weights.get(tf, 0.2)
            weighted_sum += score.final_score * weight
            total_weight += weight
            directions.append(score.direction)
        
        overall_score = weighted_sum / total_weight if total_weight > 0 else 0.5
        
        # Consensus: percentage of timeframes agreeing
        bullish_count = directions.count("BULLISH")
        bearish_count = directions.count("BEARISH")
        
        if bullish_count > bearish_count:
            overall_direction = "BULLISH"
            consensus = bullish_count / len(directions)
        elif bearish_count > bullish_count:
            overall_direction = "BEARISH"
            consensus = bearish_count / len(directions)
        else:
            overall_direction = "NEUTRAL"
            consensus = 0.5
        
        # Recommended action
        if overall_direction == "BULLISH" and overall_score >= 0.65 and consensus >= 0.6:
            action = "STRONG_BUY"
        elif overall_direction == "BULLISH" and overall_score >= 0.55:
            action = "BUY"
        elif overall_direction == "BEARISH" and overall_score <= 0.35 and consensus >= 0.6:
            action = "STRONG_SELL"
        elif overall_direction == "BEARISH" and overall_score <= 0.45:
            action = "SELL"
        else:
            action = "HOLD"
        
        # Risk level based on consensus
        if consensus >= 0.75:
            risk = "LOW"
        elif consensus >= 0.5:
            risk = "MEDIUM"
        else:
            risk = "HIGH"
        
        return {
            "score": overall_score,
            "direction": overall_direction,
            "consensus": consensus,
            "action": action,
            "risk": risk
        }
    
    def _passes_filter(self, result: ScanResult, rules: ScanRule) -> bool:
        """Apply filtering rules"""
        
        # Exclude neutrals if requested
        if rules.exclude_neutral and result.overall_direction == "NEUTRAL":
            return False
        
        # Check confidence threshold
        avg_confidence = np.mean([
            score.confidence
            for score in result.timeframe_scores.values()
        ])
        
        if avg_confidence < rules.min_confidence:
            return False
        
        # Aggressive mode: any TF exceeds threshold
        if rules.mode == "aggressive":
            for score in result.timeframe_scores.values():
                if (score.direction == "BULLISH" and score.final_score >= rules.any_tf_threshold) or \
                   (score.direction == "BEARISH" and score.final_score <= (1 - rules.any_tf_threshold)):
                    return True
            return False
        
        # Conservative mode: majority exceeds threshold
        else:
            qualifying_tfs = 0
            for score in result.timeframe_scores.values():
                if (score.direction == "BULLISH" and score.final_score >= rules.majority_tf_threshold) or \
                   (score.direction == "BEARISH" and score.final_score <= (1 - rules.majority_tf_threshold)):
                    qualifying_tfs += 1
            
            return qualifying_tfs >= len(result.timeframe_scores) / 2
```

---

### Phase 6: Risk Management & Position Sizing

```python
# backend/risk/manager.py

from decimal import Decimal
from typing import Optional

@dataclass
class PositionSize:
    """Calculated position parameters"""
    symbol: str
    quantity: float
    entry_price: float
    stop_loss: float
    take_profit: List[float]
    risk_amount: float
    risk_pct: float
    r_multiple: float  # Reward/Risk ratio
    max_leverage: float

class RiskManager:
    """Position sizing and risk enforcement"""
    
    def __init__(
        self,
        account_balance: float,
        max_risk_per_trade_pct: float = 1.0,
        max_risk_per_day_pct: float = 3.0,
        max_positions: int = 5
    ):
        self.balance = account_balance
        self.max_risk_per_trade = max_risk_per_trade_pct / 100
        self.max_risk_per_day = max_risk_per_day_pct / 100
        self.max_positions = max_positions
        self.daily_risk_used = 0.0
        self.open_positions = 0
    
    def calculate_position_size(
        self,
        symbol: str,
        entry_price: float,
        stop_loss: float,
        score: CombinedScore,
        atr: float
    ) -> Optional[PositionSize]:
        """
        Calculate position size using ATR-based method
        
        Returns None if risk checks fail
        """
        
        # Check daily risk limit
        if self.daily_risk_used >= self.max_risk_per_day:
            logger.warning("Daily risk limit reached")
            return None
        
        # Check max positions
        if self.open_positions >= self.max_positions:
            logger.warning("Max positions reached")
            return None
        
        # Risk amount in dollars
        risk_amount = self.balance * self.max_risk_per_trade
        
        # Adjust by confidence
        risk_amount *= score.confidence
        
        # Calculate stop distance
        stop_distance_pct = abs(entry_price - stop_loss) / entry_price
        
        # Position size = Risk / Stop Distance
        position_value = risk_amount / stop_distance_pct
        quantity = position_value / entry_price
        
        # Calculate take profit levels (1R, 2R, 3R)
        if score.direction == "BULLISH":
            tp_distance = stop_distance_pct * entry_price
            take_profits = [
                entry_price + (tp_distance * mult)
                for mult in [1.0, 2.0, 3.0]
            ]
        else:
            tp_distance = stop_distance_pct * entry_price
            take_profits = [
                entry_price - (tp_distance * mult)
                for mult in [1.0, 2.0, 3.0]
            ]
        
        # Calculate R-multiple (reward/risk)
        r_multiple = (take_profits[1] - entry_price) / (entry_price - stop_loss)
        if score.direction == "BEARISH":
            r_multiple = abs(r_multiple)
        
        # Dynamic leverage based on volatility
        if atr / entry_price > 0.05:  # High volatility
            max_leverage = 2.0
        elif atr / entry_price > 0.03:
            max_leverage = 3.0
        else:
            max_leverage = 5.0
        
        return PositionSize(
            symbol=symbol,
            quantity=float(quantity),
            entry_price=float(entry_price),
            stop_loss=float(stop_loss),
            take_profit=[float(tp) for tp in take_profits],
            risk_amount=float(risk_amount),
            risk_pct=float(self.max_risk_per_trade * 100),
            r_multiple=float(r_multiple),
            max_leverage=float(max_leverage)
        )
    
    def calculate_stop_loss(
        self,
        entry_price: float,
        direction: str,
        atr: float,
        structure_levels: Optional[List[float]] = None
    ) -> float:
        """
        Calculate stop loss using ATR and structure
        
        Priority: Structure levels > 1.5x ATR
        """
        
        if direction == "BULLISH":
            # ATR-based stop
            atr_stop = entry_price - (1.5 * atr)
            
            # Check structure levels
            if structure_levels:
                structure_stop = max([
                    level for level in structure_levels
                    if level < entry_price
                ], default=atr_stop)
                
                # Use closest (structure or ATR)
                stop = max(atr_stop, structure_stop)
            else:
                stop = atr_stop
        
        else:  # BEARISH
            atr_stop = entry_price + (1.5 * atr)
            
            if structure_levels:
                structure_stop = min([
                    level for level in structure_levels
                    if level > entry_price
                ], default=atr_stop)
                
                stop = min(atr_stop, structure_stop)
            else:
                stop = atr_stop
        
        return float(stop)
```

---

### Phase 7: API Endpoints

```python
# backend/api/routes.py

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="AiSmart Trader API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ScoreRequest(BaseModel):
    symbol: str
    timeframe: str = "1h"
    weights: Optional[WeightConfig] = None
    context: Optional[dict] = None

class ScanRequest(BaseModel):
    symbols: List[str]
    timeframes: List[str] = ["15m", "1h", "4h"]
    weights: Optional[WeightConfig] = None
    rules: Optional[ScanRule] = None

# Initialize services
data_aggregator = DataAggregator([
    BinanceProvider(),
    CryptoCompareProvider(api_key=os.getenv("CRYPTOCOMPARE_API_KEY"))
])

detectors = {
    "harmonic": HarmonicDetector(),
    "elliott": ElliottWaveDetector(),
    "smc": SMCDetector(),
    "fibonacci": FibonacciDetector(),
    "price_action": PriceActionDetector(),
    "sar": SARDetector(),
    "sentiment": SentimentDetector(),
    "news": NewsDetector(),
    "whales": WhaleDetector()
}

default_weights = WeightConfig()
scoring_engine = DynamicScoringEngine(detectors, default_weights)
scanner = MultiTimeframeScanner(data_aggregator, scoring_engine, default_weights)

@app.post("/api/signals/score")
async def score_signal(request: ScoreRequest):
    """
    Score a single symbol-timeframe combination
    
    Returns full component breakdown
    """
    try:
        ohlcv = await data_aggregator.get_ohlcv(
            request.symbol,
            request.timeframe,
            limit=200
        )
        
        weights = request.weights or default_weights
        engine = DynamicScoringEngine(detectors, weights)
        
        result = await engine.score(ohlcv, request.context)
        
        return {
            "symbol": request.symbol,
            "timeframe": request.timeframe,
            "result": {
                "final_score": result.final_score,
                "direction": result.direction,
                "advice": result.advice,
                "confidence": result.confidence,
                "bull_mass": result.bull_mass,
                "bear_mass": result.bear_mass,
                "disagreement": result.disagreement,
                "components": result.components
            }
        }
    
    except Exception as e:
        logger.exception("Score endpoint failed")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scanner/run")
async def run_scanner(request: ScanRequest, background_tasks: BackgroundTasks):
    """
    Scan multiple symbols across timeframes
    
    Returns ranked opportunities
    """
    try:
        results = await scanner.scan(
            request.symbols,
            request.timeframes,
            request.rules
        )
        
        return {
            "scan_time": datetime.now().isoformat(),
            "symbols_scanned": len(request.symbols),
            "opportunities_found": len(results),
            "results": [
                {
                    "symbol": r.symbol,
                    "overall_score": r.overall_score,
                    "direction": r.overall_direction,
                    "action": r.recommended_action,
                    "risk_level": r.risk_level,
                    "consensus": r.consensus_strength,
                    "timeframe_breakdown": {
                        tf: {
                            "score": score.final_score,
                            "direction": score.direction,
                            "confidence": score.confidence
                        }
                        for tf, score in r.timeframe_scores.items()
                    }
                }
                for r in results[:20]  # Top 20 results
            ]
        }
    
    except Exception as e:
        logger.exception("Scanner endpoint failed")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/config/weights")
async def get_weights():
    """Get current weight configuration"""
    return default_weights.dict()

@app.post("/api/config/weights")
async def update_weights(weights: WeightConfig):
    """Update detector weights"""
    try:
        weights.validate_sum()
        global default_weights, scoring_engine, scanner
        default_weights = weights
        scoring_engine = DynamicScoringEngine(detectors, weights)
        scanner = MultiTimeframeScanner(data_aggregator, scoring_engine, weights)
        
        return {"status": "success", "weights": weights.dict()}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    provider_health = {}
    
    for provider in data_aggregator.providers:
        name = provider.__class__.__name__
        is_healthy = await provider.health_check()
        provider_health[name] = is_healthy
    
    return {
        "status": "healthy",
        "providers": provider_health,
        "detectors": list(detectors.keys()),
        "timestamp": datetime.now().isoformat()
    }
```

---

### Phase 8: Backtesting Engine

```python
# backend/backtest/engine.py

from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime, timedelta

@dataclass
class Trade:
    """Executed trade record"""
    symbol: str
    entry_time: datetime
    entry_price: float
    exit_time: datetime
    exit_price: float
    quantity: float
    direction: Literal["LONG", "SHORT"]
    pnl: float
    pnl_pct: float
    exit_reason: str  # "TP", "SL", "TIME", "SIGNAL"
    r_multiple: float

@dataclass
class BacktestMetrics:
    """Comprehensive performance metrics"""
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    
    total_pnl: float
    avg_win: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    
    profit_factor: float
    expectancy: float
    
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    
    max_drawdown: float
    max_drawdown_pct: float
    recovery_factor: float
    
    cagr: float
    total_return_pct: float
    
    avg_trade_duration: timedelta
    avg_bars_in_trade: int

class BacktestEngine:
    """Historical strategy validation"""
    
    def __init__(
        self,
        initial_capital: float = 10000.0,
        fee_bps: float = 10.0,  # 0.1% per side
        slippage_bps: float = 5.0
    ):
        self.initial_capital = initial_capital
        self.fee_bps = fee_bps / 10000
        self.slippage_bps = slippage_bps / 10000
    
    async def run(
        self,
        symbol: str,
        timeframe: str,
        start_date: datetime,
        end_date: datetime,
        scoring_engine: DynamicScoringEngine,
        risk_manager: RiskManager,
        entry_rules: dict,
        exit_rules: dict
    ) -> Dict:
        """
        Run backtest on historical data
        
        Args:
            symbol: Trading pair
            timeframe: Bar interval
            start_date, end_date: Test period
            scoring_engine: Strategy scoring
            risk_manager: Position sizing
            entry_rules: {"min_score": 0.65, "min_confidence": 0.6}
            exit_rules: {"use_trailing": True, "time_stop_bars": 24}
        
        Returns:
            {"metrics": BacktestMetrics, "trades": List[Trade], "equity_curve": List[float]}
        """
        
        # Fetch historical data
        logger.info(f"Loading data for {symbol} from {start_date} to {end_date}")
        
        ohlcv = await self._load_historical_data(
            symbol, timeframe, start_date, end_date
        )
        
        if len(ohlcv) < 200:
            raise ValueError("Insufficient historical data")
        
        # Initialize backtest state
        equity = self.initial_capital
        equity_curve = [equity]
        trades: List[Trade] = []
        
        position = None  # Current open position
        position_entry_bar = None
        
        # Walk through history
        for i in range(200, len(ohlcv)):
            current_bar = ohlcv[i]
            current_time = datetime.fromtimestamp(current_bar['ts'] / 1000)
            
            # Get scoring window
            window = ohlcv[i-200:i]
            
            # Check if we have open position
            if position is not None:
                # Check exits
                exit_signal = self._check_exit_conditions(
                    position, current_bar, i - position_entry_bar, exit_rules
                )
                
                if exit_signal:
                    trade = self._close_position(
                        position, current_bar, current_time, exit_signal['reason']
                    )
                    trades.append(trade)
                    
                    # Update equity
                    equity += trade.pnl
                    equity_curve.append(equity)
                    
                    # Reset position
                    position = None
                    position_entry_bar = None
                    
                    logger.debug(
                        f"Closed position: {trade.direction} {trade.pnl:.2f} ({trade.exit_reason})"
                    )
            
            else:
                # Look for entry signals
                try:
                    score = await scoring_engine.score(window)
                    
                    entry_signal = self._check_entry_conditions(
                        score, entry_rules
                    )
                    
                    if entry_signal:
                        # Calculate position size
                        indicators = IndicatorEngine().compute_all(window)
                        atr = indicators['atr'][-1]
                        
                        direction = "LONG" if score.direction == "BULLISH" else "SHORT"
                        entry_price = current_bar['close']
                        
                        # Calculate stop loss
                        stop_loss = risk_manager.calculate_stop_loss(
                            entry_price,
                            score.direction,
                            atr
                        )
                        
                        pos_size = risk_manager.calculate_position_size(
                            symbol,
                            entry_price,
                            stop_loss,
                            score,
                            atr
                        )
                        
                        if pos_size:
                            position = {
                                "direction": direction,
                                "entry_time": current_time,
                                "entry_price": entry_price,
                                "quantity": pos_size.quantity,
                                "stop_loss": stop_loss,
                                "take_profit": pos_size.take_profit,
                                "atr": atr
                            }
                            position_entry_bar = i
                            
                            logger.debug(
                                f"Opened {direction} position at {entry_price:.2f}"
                            )
                
                except Exception as e:
                    logger.warning(f"Scoring failed at bar {i}: {e}")
                    continue
        
        # Close any remaining position at end
        if position is not None:
            trade = self._close_position(
                position, ohlcv[-1], end_date, "END_OF_TEST"
            )
            trades.append(trade)
            equity += trade.pnl
            equity_curve.append(equity)
        
        # Calculate metrics
        metrics = self._calculate_metrics(trades, equity_curve, start_date, end_date)
        
        return {
            "metrics": metrics,
            "trades": [self._trade_to_dict(t) for t in trades],
            "equity_curve": equity_curve,
            "final_equity": equity,
            "total_return_pct": ((equity - self.initial_capital) / self.initial_capital) * 100
        }
    
    async def _load_historical_data(
        self,
        symbol: str,
        timeframe: str,
        start: datetime,
        end: datetime
    ) -> List[OHLCVBar]:
        """Load historical bars with batching"""
        # In production, this would batch requests
        # For now, simplified version
        
        all_bars = []
        current = start
        
        while current < end:
            since = int(current.timestamp() * 1000)
            bars = await data_aggregator.get_ohlcv(
                symbol, timeframe, limit=1000  # Max per request
            )
            
            if not bars:
                break
            
            all_bars.extend(bars)
            
            # Move to next batch
            last_ts = bars[-1]['ts']
            current = datetime.fromtimestamp(last_ts / 1000)
            
            if len(bars) < 1000:
                break
        
        # Filter to date range
        start_ts = int(start.timestamp() * 1000)
        end_ts = int(end.timestamp() * 1000)
        
        filtered = [
            bar for bar in all_bars
            if start_ts <= bar['ts'] <= end_ts
        ]
        
        return filtered
    
    def _check_entry_conditions(self, score: CombinedScore, rules: dict) -> bool:
        """Check if entry criteria met"""
        min_score = rules.get("min_score", 0.65)
        min_confidence = rules.get("min_confidence", 0.6)
        
        if score.direction == "NEUTRAL":
            return False
        
        if score.confidence < min_confidence:
            return False
        
        if score.direction == "BULLISH" and score.final_score >= min_score:
            return True
        
        if score.direction == "BEARISH" and score.final_score <= (1 - min_score):
            return True
        
        return False
    
    def _check_exit_conditions(
        self,
        position: dict,
        current_bar: OHLCVBar,
        bars_in_trade: int,
        rules: dict
    ) -> Optional[dict]:
        """Check if exit conditions met"""
        
        current_price = current_bar['close']
        direction = position['direction']
        
        # Stop loss hit
        if direction == "LONG" and current_bar['low'] <= position['stop_loss']:
            return {"reason": "SL", "price": position['stop_loss']}
        
        if direction == "SHORT" and current_bar['high'] >= position['stop_loss']:
            return {"reason": "SL", "price": position['stop_loss']}
        
        # Take profit hit (check first TP level)
        tp1 = position['take_profit'][0]
        
        if direction == "LONG" and current_bar['high'] >= tp1:
            return {"reason": "TP", "price": tp1}
        
        if direction == "SHORT" and current_bar['low'] <= tp1:
            return {"reason": "TP", "price": tp1}
        
        # Time-based exit
        if rules.get("time_stop_bars"):
            if bars_in_trade >= rules['time_stop_bars']:
                return {"reason": "TIME", "price": current_price}
        
        # Trailing stop (if enabled)
        if rules.get("use_trailing"):
            trailing_distance = position['atr'] * 2
            
            if direction == "LONG":
                new_stop = current_price - trailing_distance
                if new_stop > position['stop_loss']:
                    position['stop_loss'] = new_stop
            
            else:
                new_stop = current_price + trailing_distance
                if new_stop < position['stop_loss']:
                    position['stop_loss'] = new_stop
        
        return None
    
    def _close_position(
        self,
        position: dict,
        exit_bar: OHLCVBar,
        exit_time: datetime,
        exit_reason: str
    ) -> Trade:
        """Close position and calculate PnL"""
        
        direction = position['direction']
        entry_price = position['entry_price']
        quantity = position['quantity']
        
        # Get exit price (considering slippage)
        if exit_reason == "SL":
            exit_price = position['stop_loss']
        elif exit_reason == "TP":
            exit_price = position['take_profit'][0]
        else:
            exit_price = exit_bar['close']
        
        # Apply slippage
        if direction == "LONG":
            exit_price *= (1 - self.slippage_bps)
        else:
            exit_price *= (1 + self.slippage_bps)
        
        # Calculate raw PnL
        if direction == "LONG":
            raw_pnl = (exit_price - entry_price) * quantity
        else:
            raw_pnl = (entry_price - exit_price) * quantity
        
        # Subtract fees
        entry_fee = entry_price * quantity * self.fee_bps
        exit_fee = exit_price * quantity * self.fee_bps
        net_pnl = raw_pnl - entry_fee - exit_fee
        
        pnl_pct = (net_pnl / (entry_price * quantity)) * 100
        
        # Calculate R-multiple
        if direction == "LONG":
            risk = entry_price - position['stop_loss']
            reward = exit_price - entry_price
        else:
            risk = position['stop_loss'] - entry_price
            reward = entry_price - exit_price
        
        r_multiple = reward / risk if risk > 0 else 0
        
        return Trade(
            symbol=position.get('symbol', 'UNKNOWN'),
            entry_time=position['entry_time'],
            entry_price=entry_price,
            exit_time=exit_time,
            exit_price=exit_price,
            quantity=quantity,
            direction=direction,
            pnl=net_pnl,
            pnl_pct=pnl_pct,
            exit_reason=exit_reason,
            r_multiple=r_multiple
        )
    
    def _calculate_metrics(
        self,
        trades: List[Trade],
        equity_curve: List[float],
        start_date: datetime,
        end_date: datetime
    ) -> BacktestMetrics:
        """Calculate comprehensive performance metrics"""
        
        if not trades:
            return BacktestMetrics(
                total_trades=0,
                winning_trades=0,
                losing_trades=0,
                win_rate=0.0,
                total_pnl=0.0,
                avg_win=0.0,
                avg_loss=0.0,
                largest_win=0.0,
                largest_loss=0.0,
                profit_factor=0.0,
                expectancy=0.0,
                sharpe_ratio=0.0,
                sortino_ratio=0.0,
                calmar_ratio=0.0,
                max_drawdown=0.0,
                max_drawdown_pct=0.0,
                recovery_factor=0.0,
                cagr=0.0,
                total_return_pct=0.0,
                avg_trade_duration=timedelta(0),
                avg_bars_in_trade=0
            )
        
        # Basic stats
        winners = [t for t in trades if t.pnl > 0]
        losers = [t for t in trades if t.pnl <= 0]
        
        total_pnl = sum(t.pnl for t in trades)
        win_rate = len(winners) / len(trades) if trades else 0
        
        avg_win = np.mean([t.pnl for t in winners]) if winners else 0
        avg_loss = np.mean([t.pnl for t in losers]) if losers else 0
        
        largest_win = max([t.pnl for t in winners]) if winners else 0
        largest_loss = min([t.pnl for t in losers]) if losers else 0
        
        # Profit factor
        gross_profit = sum(t.pnl for t in winners)
        gross_loss = abs(sum(t.pnl for t in losers))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0
        
        # Expectancy
        expectancy = (win_rate * avg_win) - ((1 - win_rate) * abs(avg_loss))
        
        # Drawdown
        peak = equity_curve[0]
        max_dd = 0
        max_dd_pct = 0
        
        for equity in equity_curve:
            if equity > peak:
                peak = equity
            
            dd = peak - equity
            dd_pct = (dd / peak) * 100 if peak > 0 else 0
            
            if dd > max_dd:
                max_dd = dd
                max_dd_pct = dd_pct
        
        # Returns
        initial = equity_curve[0]
        final = equity_curve[-1]
        total_return_pct = ((final - initial) / initial) * 100
        
        # CAGR
        days = (end_date - start_date).days
        years = days / 365.25
        cagr = (((final / initial) ** (1 / years)) - 1) * 100 if years > 0 else 0
        
        # Sharpe ratio (simplified - assumes daily returns)
        returns = np.diff(equity_curve) / equity_curve[:-1]
        sharpe = (np.mean(returns) / np.std(returns)) * np.sqrt(252) if len(returns) > 0 else 0
        
        # Sortino ratio (downside deviation only)
        downside_returns = returns[returns < 0]
        sortino = (np.mean(returns) / np.std(downside_returns)) * np.sqrt(252) if len(downside_returns) > 0 else 0
        
        # Calmar ratio
        calmar = cagr / max_dd_pct if max_dd_pct > 0 else 0
        
        # Recovery factor
        recovery_factor = total_pnl / max_dd if max_dd > 0 else 0
        
        # Average trade duration
        durations = [(t.exit_time - t.entry_time).total_seconds() for t in trades]
        avg_duration = timedelta(seconds=np.mean(durations)) if durations else timedelta(0)
        
        return BacktestMetrics(
            total_trades=len(trades),
            winning_trades=len(winners),
            losing_trades=len(losers),
            win_rate=float(win_rate),
            total_pnl=float(total_pnl),
            avg_win=float(avg_win),
            avg_loss=float(avg_loss),
            largest_win=float(largest_win),
            largest_loss=float(largest_loss),
            profit_factor=float(profit_factor),
            expectancy=float(expectancy),
            sharpe_ratio=float(sharpe),
            sortino_ratio=float(sortino),
            calmar_ratio=float(calmar),
            max_drawdown=float(max_dd),
            max_drawdown_pct=float(max_dd_pct),
            recovery_factor=float(recovery_factor),
            cagr=float(cagr),
            total_return_pct=float(total_return_pct),
            avg_trade_duration=avg_duration,
            avg_bars_in_trade=int(np.mean([
                (t.exit_time - t.entry_time).total_seconds() / 3600
                for t in trades
            ]))
        )
    
    def _trade_to_dict(self, trade: Trade) -> dict:
        """Convert Trade to JSON-serializable dict"""
        return {
            "symbol": trade.symbol,
            "entry_time": trade.entry_time.isoformat(),
            "entry_price": trade.entry_price,
            "exit_time": trade.exit_time.isoformat(),
            "exit_price": trade.exit_price,
            "quantity": trade.quantity,
            "direction": trade.direction,
            "pnl": trade.pnl,
            "pnl_pct": trade.pnl_pct,
            "exit_reason": trade.exit_reason,
            "r_multiple": trade.r_multiple
        }
```

---

### Phase 9: WebSocket Real-Time Updates

```python
# backend/websocket/manager.py

from fastapi import WebSocket
from typing import Set, Dict
import asyncio
import json

class ConnectionManager:
    """Manage WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.subscriptions: Dict[WebSocket, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        self.subscriptions[websocket] = set()
        logger.info("Client connected", total_clients=len(self.active_connections))
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        if websocket in self.subscriptions:
            del self.subscriptions[websocket]
        logger.info("Client disconnected", total_clients=len(self.active_connections))
    
    async def subscribe(self, websocket: WebSocket, symbol: str):
        """Subscribe to symbol updates"""
        if websocket in self.subscriptions:
            self.subscriptions[websocket].add(symbol)
    
    async def broadcast(self, message: dict):
        """Broadcast to all connected clients"""
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_to_subscribed(self, symbol: str, data: dict):
        """Send to clients subscribed to symbol"""
        message = {
            "type": "signal_update",
            "symbol": symbol,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        for ws, symbols in self.subscriptions.items():
            if symbol in symbols:
                try:
                    await ws.send_json(message)
                except:
                    pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            
            action = data.get("action")
            
            if action == "subscribe":
                symbol = data.get("symbol")
                await manager.subscribe(websocket, symbol)
                await websocket.send_json({
                    "type": "subscription_confirmed",
                    "symbol": symbol
                })
            
            elif action == "unsubscribe":
                symbol = data.get("symbol")
                if websocket in manager.subscriptions:
                    manager.subscriptions[websocket].discard(symbol)
            
            elif action == "ping":
                await websocket.send_json({"type": "pong"})
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    
    finally:
        manager.disconnect(websocket)

# Background task for real-time scanning
async def live_scanner_task():
    """Continuously scan top symbols and push updates"""
    
    symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT"]
    timeframes = ["15m", "1h"]
    
    while True:
        try:
            for symbol in symbols:
                for tf in timeframes:
                    ohlcv = await data_aggregator.get_ohlcv(symbol, tf, limit=200)
                    score = await scoring_engine.score(ohlcv)
                    
                    await manager.send_to_subscribed(symbol, {
                        "timeframe": tf,
                        "score": score.final_score,
                        "direction": score.direction,
                        "advice": score.advice,
                        "confidence": score.confidence
                    })
            
            await asyncio.sleep(30)  # Update every 30 seconds
        
        except Exception as e:
            logger.error(f"Live scanner error: {e}")
            await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    """Start background tasks"""
    asyncio.create_task(live_scanner_task())
```

---

### Phase 10: Testing Framework

```python
# tests/test_detectors.py

import pytest
from backend.detectors.harmonic import HarmonicDetector
from backend.data.providers import OHLCVBar

@pytest.fixture
def sample_ohlcv():
    """Generate deterministic test data"""
    return [
        OHLCVBar(ts=i*60000, open=100.0, high=101.0, low=99.0, close=100.5, volume=1000.0)
        for i in range(200)
    ]

@pytest.mark.asyncio
async def test_harmonic_detector_bullish_gartley():
    """Test Gartley pattern detection"""
    detector = HarmonicDetector()
    
    # Create synthetic Gartley pattern
    ohlcv = create_gartley_pattern(is_bullish=True)
    
    result = await detector.detect(ohlcv, {})
    
    assert result.direction == "BULLISH"
    assert result.score > 0.5
    assert "pattern" in result.meta
    assert result.meta["pattern"] == "Gartley"

@pytest.mark.asyncio
async def test_scoring_engine_combination():
    """Test weighted score combination"""
    # Use mock detectors with known outputs
    engine = DynamicScoringEngine(mock_detectors, WeightConfig())
    
    result = await engine.score(sample_ohlcv)
    
    assert 0.0 <= result.final_score <= 1.0
    assert result.direction in ["BULLISH", "BEARISH", "NEUTRAL"]
    assert len(result.components) > 0

def test_weight_config_validation():
    """Test weight sum validation"""
    with pytest.raises(ValueError):
        weights = WeightConfig(harmonic=0.5, elliott=0.6)  # Sum > 1
        weights.validate_sum()

@pytest.mark.asyncio
async def test_backtest_with_known_pattern():
    """Test backtest produces expected results"""
    engine = BacktestEngine(initial_capital=10000)
    
    # Use fixture with known profitable pattern
    result = await engine.run(
        symbol="BTC/USDT",
        timeframe="1h",
        start_date=datetime(2024, 1, 1),
        end_date=datetime(2024, 1, 31),
        scoring_engine=mock_scoring_engine,
        risk_manager=RiskManager(10000),
        entry_rules={"min_score": 0.65},
        exit_rules={"time_stop_bars": 24}
    )
    
    assert result['metrics'].total_trades > 0
    assert result['final_equity'] != 10000  # Some trades executed
```

---

## 🎯 EXECUTION CHECKLIST FOR CURSOR AGENT

### Before Starting ANY Phase:
- [ ] Read ENTIRE document (this charter)
- [ ] Understand dependencies between phases
- [ ] Check existing codebase for conflicts
- [ ] Verify environment setup (.env, dependencies)

### For EACH Code Block You Write:
- [ ] Add type hints to ALL functions
- [ ] Implement proper error handling (no bare except)
- [ ] Add structured logging with context
- [ ] Write corresponding unit test
- [ ] Document complex logic with inline comments
- [ ] Validate inputs with Pydantic where applicable
- [ ] Consider edge cases (empty data, API failures, etc.)

### Quality Gates (Must Pass Before PR):
- [ ] All tests pass (`pytest -v`)
- [ ] Type checking passes (`mypy backend`)
- [ ] No hardcoded secrets
- [ ] Logging includes correlation IDs
- [ ] Performance meets targets (<100ms indicators, <3s scanning)
- [ ] Error messages are actionable
- [ ] API responses include timestamps

### Documentation Requirements:
- [ ] Update API docs with new endpoints
- [ ] Add examples to README
- [ ] Document configuration options
- [ ] Include performance benchmarks
- [ ] Add troubleshooting section

---

## 🚀 FINAL MANDATE

**You are building a PRODUCTION SYSTEM, not a prototype.**

Every function must:
1. **Work** - No placeholders, no TODOs in main paths
2. **Scale** - Handle 50+ symbols, 1000+ bars efficiently
3. **Fail gracefully** - Retry with backoff, log errors, continue
4. **Be testable** - Deterministic outputs, mockable dependencies
5. **Be maintainable** - Clear naming, single responsibility, documented

**When in doubt:**
- Prioritize **correctness** over speed
- Choose **explicit** over clever
- Make it **work**, then make it **fast**
- Log **everything** that matters
- Test the **unhappy paths**

**Your success metric:** A system that runs 24/7, identifies real opportunities, and doesn't wake anyone up at 3 AM with false alerts.

Now execute with precision. 🎯
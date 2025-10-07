from backend.core.config import load_ai_config
from backend.core.backtest_adapter import normalize_candle, features_from_candles

def test_backtest_live_parity_minimal():
    live = {"t": 1, "o": 10, "h": 12, "l": 9, "c": 11, "v": 100}
    bt   = {"t": 1, "o": 10, "h": 12, "l": 9, "c": 11, "v": 100}
    L = normalize_candle(live)
    B = normalize_candle(bt)
    assert L == B
    fL, fB = features_from_candles([L]), features_from_candles([B])
    assert fL == fB
    cfg = load_ai_config()
    assert "weights" in cfg and "thresholds" in cfg
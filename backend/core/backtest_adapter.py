from typing import Dict, Any, List

def normalize_candle(c) -> Dict[str, Any]:
    return {
        "t": int(c["t"]), "o": float(c["o"]), "h": float(c["h"]),
        "l": float(c["l"]), "c": float(c["c"]), "v": float(c.get("v", 0.0))
    }

def features_from_candles(candles: List[Dict[str, Any]]) -> Dict[str, Any]:
    last = candles[-1]
    return {"close": last["c"], "volume": last["v"]}
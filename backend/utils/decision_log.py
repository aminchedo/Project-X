"""
Structured decision logging for trade analysis
Logs all trading decisions with reasons for accept/block
"""

import json
import time
import os
from pathlib import Path
from typing import Dict, Any


# Get log path from environment or use default
LOG_PATH = Path(os.environ.get("DECISION_LOG", "logs/decisions.ndjson"))


def log_decision(record: Dict[str, Any]) -> None:
    """
    Log a trading decision to NDJSON file
    
    Args:
        record: Decision record with following structure:
            {
                "sym": str,           # Symbol
                "tf": str,            # Timeframe
                "dir": str,           # Direction (LONG/SHORT)
                "scores": {           # Score dictionary
                    "entry": float,
                    "conf": float,
                    "SMC_ZQS": float,
                    "FVG_ATR": float,
                    "LIQ": float
                },
                "gates": {            # Gate results
                    "rsi_macd": bool,
                    "smc": bool,
                    "sent": bool,
                    "bos2": bool,
                    "momentum": bool
                },
                "regime": {           # Market regime
                    "news": bool,
                    "highVol": bool,
                    "wideSpread": bool,
                    "trend": bool
                },
                "session_ok": bool,   # In trading session
                "scaled": float,      # Position scale factor
                "blocked": bool,      # Was trade blocked?
                "why_block": list     # Reasons for blocking
            }
    """
    # Ensure log directory exists
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Add timestamp (milliseconds since epoch)
    record["ts"] = int(time.time() * 1000)
    
    # Write as NDJSON (newline-delimited JSON)
    try:
        with LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception as e:
        # Log error but don't crash
        print(f"Error writing decision log: {e}")
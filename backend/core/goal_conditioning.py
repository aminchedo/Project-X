from __future__ import annotations
from typing import Dict, Tuple
from backend.core.config import load_ai_config

GOAL_TABLE = {
    "auto": {
        "weights": {},
        "threshold_adjust": {},
        "risk_scale": 1.0
    },
    "continuation": {
        "weights": {"SMC_ZQS": 1.10, "RSI": 1.05, "MACD": 1.05},
        "threshold_adjust": {"ZQS_min": +0.02},
        "risk_scale": 1.0
    },
    "reversal": {
        "weights": {"LIQ_GRAB": 1.15, "Sentiment": 1.10},
        "threshold_adjust": {"ZQS_min": +0.04, "FVG_min_atr": +0.02},
        "risk_scale": 0.8
    }
}

def resolve_goal(user_goal: str | None, htf_trend: int) -> str:
    goal = (user_goal or "auto").lower()
    if goal == "auto":
        return "continuation" if htf_trend != 0 else "reversal"
    return goal if goal in GOAL_TABLE else "auto"

def apply_goal(goal: str) -> Tuple[Dict[str,float], Dict[str,float], float]:
    g = GOAL_TABLE.get(goal, GOAL_TABLE["auto"])
    return dict(g["weights"]), dict(g["threshold_adjust"]), float(g["risk_scale"])

def adjust_thresholds(base_th: Dict[str,float], delta: Dict[str,float]) -> Dict[str,float]:
    out = dict(base_th)
    for k,v in delta.items():
        out[k] = float(out.get(k, 0.0)) + float(v)
    return out

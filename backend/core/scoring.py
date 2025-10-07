from typing import Dict

def weighted_score(signals: Dict[str, float], weights: Dict[str, float]) -> float:
    s, wsum = 0.0, 0.0
    for k, w in weights.items():
        if k in signals:
            s += w * float(signals[k])
            wsum += w
    return s / wsum if wsum > 0 else 0.0
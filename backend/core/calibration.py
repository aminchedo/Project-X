from __future__ import annotations
from typing import List, Tuple, Dict
import math, json, pathlib

CALIB_PATH = pathlib.Path("backend/config/calibration.json")

def _sigmoid(x: float) -> float:
    try:
        return 1.0 / (1.0 + math.exp(-x))
    except OverflowError:
        return 0.0 if x < 0 else 1.0

def platt_fit(scores: List[float], labels: List[int]) -> Tuple[float,float]:
    A, B = 0.0, 0.0
    l2 = 1e-4
    for _ in range(50):
        gA=gB=0.0; hAA=hBB=hAB=0.0
        for s,y in zip(scores, labels):
            p = _sigmoid(A*s + B)
            w = p*(1-p)
            gA += (p - y)*s + l2*A
            gB += (p - y)    + l2*B
            hAA += w*s*s + l2
            hBB += w      + l2
            hAB += w*s
        det = hAA*hBB - hAB*hAB
        if abs(det) < 1e-12: break
        dA = ( hBB*gA - hAB*gB)/det
        dB = (-hAB*gA + hAA*gB)/det
        A -= dA; B -= dB
        if abs(dA)+abs(dB) < 1e-6: break
    return A,B

def platt_apply(score: float, A: float, B: float) -> float:
    return _sigmoid(A*score + B)

def save_platt(A: float, B: float):
    CALIB_PATH.parent.mkdir(parents=True, exist_ok=True)
    CALIB_PATH.write_text(json.dumps({"platt": {"A":A, "B":B}}, indent=2))

def load_platt() -> Tuple[float,float] | None:
    if not CALIB_PATH.exists(): return None
    data = json.loads(CALIB_PATH.read_text())
    p = data.get("platt")
    if not p: return None
    return float(p.get("A",0.0)), float(p.get("B",0.0))

def calibrate_from_history(entries: List[Dict]) -> Tuple[float,float]:
    scores = [float(e["raw_score"]) for e in entries]
    labels = [int(e["label"]) for e in entries]
    return platt_fit(scores, labels)

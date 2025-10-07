import random, math
from typing import Dict, List, Tuple
from backend.core.config import load_ai_config, save_ai_config
from backend.core.scoring import weighted_score

INDICATORS = ["RSI","MACD","SMC","Harmonic","Sentiment","SAR"]

def fitness(weights: Dict[str, float], walk: List[Dict]) -> float:
    pnl = 0.0
    for bar in walk:
        signals = bar["signals"]
        score = weighted_score(signals, weights)
        pnl += (bar["ret"] * (1 if score >= 0.5 else 0))
    return pnl

def normalize(weights: Dict[str, float]) -> Dict[str, float]:
    s = sum(max(0.0, v) for v in weights.values())
    return {k: (max(0.0, v) / s if s>0 else 1.0/len(weights)) for k,v in weights.items()}

def random_weights() -> Dict[str, float]:
    w = {k: random.random() for k in INDICATORS}
    return normalize(w)

def mate(a: Dict[str, float], b: Dict[str, float]) -> Dict[str, float]:
    c = {k: (a[k] if random.random()<0.5 else b[k]) for k in INDICATORS}
    for k in INDICATORS:
        if random.random() < 0.1:
            c[k] += random.uniform(-0.1, 0.1)
    return normalize(c)

def calibrate(walk_train: List[Dict], pop=30, gens=25) -> Dict[str, float]:
    popu = [random_weights() for _ in range(pop)]
    for _ in range(gens):
        scored = sorted([(fitness(w, walk_train), w) for w in popu], key=lambda x: -x[0])
        elite = [w for _, w in scored[: max(2, pop//5)]]
        newp = elite[:]
        while len(newp) < pop:
            newp.append(mate(random.choice(elite), random.choice(elite)))
        popu = newp
    best = sorted([(fitness(w, walk_train), w) for w in popu], key=lambda x: -x[0])[0][1]
    return best

def run_ga_and_save(walk_train: List[Dict]):
    cfg = load_ai_config()
    best = calibrate(walk_train)
    cfg["weights"].update(best)
    save_ai_config(cfg)
    return cfg
import random, math
from typing import Dict, List
from backend.core.config import load_ai_config, save_ai_config

ACTIONS = [
    ("EntryScore", +0.02), ("EntryScore", -0.02),
    ("ConfluenceScore", +0.02), ("ConfluenceScore", -0.02)
]

class QAgent:
    def __init__(self, epsilon=0.1, alpha=0.2, gamma=0.9):
        self.Q = {}
        self.eps, self.alpha, self.gamma = epsilon, alpha, gamma

    def state_key(self, perf: float) -> int:
        return int(perf * 10)

    def act(self, s):
        if random.random() < self.eps:
            return random.randrange(len(ACTIONS))
        qs = self.Q.get(s, [0.0]*len(ACTIONS))
        return max(range(len(ACTIONS)), key=lambda i: qs[i])

    def update(self, s, a, r, s2):
        qs = self.Q.get(s, [0.0]*len(ACTIONS))
        q_next = self.Q.get(s2, [0.0]*len(ACTIONS))
        target = r + self.gamma * max(q_next)
        qs[a] = qs[a] + self.alpha * (target - qs[a])
        self.Q[s] = qs

def apply_action(cfg, a_idx):
    k, delta = ACTIONS[a_idx]
    cfg["thresholds"][k] = float(max(0.3, min(0.9, cfg["thresholds"][k] + delta)))

def run_rl_week(cfg_perf_history: List[float]):
    cfg = load_ai_config()
    agent = QAgent()
    for i in range(len(cfg_perf_history)-1):
        s = agent.state_key(cfg_perf_history[i])
        a = agent.act(s)
        apply_action(cfg, a)
        r = cfg_perf_history[i+1]
        s2 = agent.state_key(cfg_perf_history[i+1])
        agent.update(s, a, r, s2)
    save_ai_config(cfg)
    return cfg
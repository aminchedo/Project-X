from dataclasses import dataclass
from typing import Optional

@dataclass
class RiskParams:
    max_equity_risk: float = 0.01
    max_position: float = 0.2
    circuit_volatility: float = 0.08
    max_drawdown: float = 0.25

class RiskState:
    def __init__(self):
        self.peak_equity = 1.0
        self.current_equity = 1.0
        self.circuit_open = False

    def update_equity(self, equity: float):
        self.current_equity = equity
        if equity > self.peak_equity:
            self.peak_equity = equity

    def drawdown(self) -> float:
        if self.peak_equity <= 0:
            return 0.0
        return 1.0 - (self.current_equity / self.peak_equity)

def position_size(equity: float, atr_pct: float, rp: RiskParams) -> float:
    if atr_pct <= 0:
        return 0.0
    raw = min(rp.max_equity_risk / atr_pct, rp.max_position)
    return max(0.0, min(raw, rp.max_position))

def should_trip_circuit(atr_pct: float, rp: RiskParams) -> bool:
    return atr_pct >= rp.circuit_volatility

def is_trading_allowed(state: RiskState, rp: RiskParams, current_atr_pct: float) -> bool:
    if should_trip_circuit(current_atr_pct, rp):
        state.circuit_open = True
    if state.drawdown() >= rp.max_drawdown:
        return False
    return not state.circuit_open
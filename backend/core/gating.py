from typing import Dict

def gate_alignment_rsi_macd(rsi_val: float, macd_hist: float, direction: str) -> bool:
    if direction == "LONG":
        return rsi_val < 30 and macd_hist > 0
    if direction == "SHORT":
        return rsi_val > 70 and macd_hist < 0
    return False

def gate_smc(smc: Dict[str, bool]) -> bool:
    return any([smc.get("fvg"), smc.get("order_block"), smc.get("bos")])

def gate_sentiment(sent: float, direction: str) -> bool:
    if direction == "LONG":  return sent >= 0.5
    if direction == "SHORT": return sent <= 0.5
    return False

def gate_confluence(entry_score: float, conf_score: float, entry_thr: float, conf_thr: float) -> bool:
    return entry_score >= entry_thr and conf_score >= conf_thr

def final_gate(rsi, macd_hist, direction, smc, sentiment, entry_score, conf_score, thrs) -> bool:
    if not gate_alignment_rsi_macd(rsi, macd_hist, direction):
        return False
    if not gate_smc(smc):
        return False
    if not gate_sentiment(sentiment, direction):
        return False
    return gate_confluence(entry_score, conf_score, thrs["EntryScore"], thrs["ConfluenceScore"])
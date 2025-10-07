from backend.core.gating import final_gate

def test_final_gate_long_pass():
    th = {"EntryScore": 0.6, "ConfluenceScore": 0.5}
    ok = final_gate(rsi=25, macd_hist=0.1, direction="LONG",
                    smc={"fvg": True, "order_block": False, "bos": False},
                    sentiment=0.7, entry_score=0.7, conf_score=0.55, thrs=th)
    assert ok is True

def test_final_gate_short_blocked_by_sentiment():
    th = {"EntryScore": 0.6, "ConfluenceScore": 0.5}
    ok = final_gate(rsi=80, macd_hist=-0.2, direction="SHORT",
                    smc={"fvg": True, "order_block": False, "bos": False},
                    sentiment=0.8, entry_score=0.8, conf_score=0.7, thrs=th)
    assert ok is False
from backend.core.risk import RiskParams, RiskState, position_size, is_trading_allowed

def test_position_size_bounds():
    rp = RiskParams()
    s = position_size(equity=1.0, atr_pct=0.02, rp=rp)
    assert 0.0 <= s <= rp.max_position

def test_drawdown_blocks():
    rp = RiskParams(max_drawdown=0.1)
    st = RiskState()
    st.update_equity(1.0)
    st.update_equity(0.88)
    assert st.drawdown() > 0.1
    assert is_trading_allowed(st, rp, current_atr_pct=0.01) is False
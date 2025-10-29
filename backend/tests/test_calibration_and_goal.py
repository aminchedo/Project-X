from backend.core.calibration import platt_fit, platt_apply
from backend.core.goal_conditioning import resolve_goal, apply_goal, adjust_thresholds

def test_platt_basic():
    scores = [0.1,0.2,0.8,0.9]
    labels = [0,0,1,1]
    A,B = platt_fit(scores, labels)
    p_lo = platt_apply(0.1, A, B)
    p_hi = platt_apply(0.9, A, B)
    assert p_hi > p_lo

def test_goal_resolve_and_adjust():
    g = resolve_goal("auto", htf_trend=1)
    wmul, th, r = apply_goal(g)
    assert g in ("continuation", "reversal")
    base = {"ZQS_min": 0.6}
    out = adjust_thresholds(base, th)
    assert "ZQS_min" in out

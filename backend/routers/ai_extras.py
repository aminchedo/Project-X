from fastapi import APIRouter
from typing import List, Dict, Any
from backend.core.calibration import calibrate_from_history, save_platt, load_platt
from backend.core.goal_conditioning import resolve_goal, apply_goal

router = APIRouter(prefix="/ai/extras", tags=["ai-extras"])

@router.post("/calibrate/platt")
def api_calibrate_platt(history: List[Dict[str, Any]]):
    A,B = calibrate_from_history(history)
    save_platt(A,B)
    return {"ok": True, "A": A, "B": B}

@router.get("/calibrate/platt")
def api_get_platt():
    v = load_platt()
    if not v: return {"ok": False, "msg": "not_fitted"}
    A,B = v
    return {"ok": True, "A": A, "B": B}

@router.post("/goal/resolve")
def api_goal_resolve(payload: Dict[str, Any]):
    goal = resolve_goal(payload.get("goal"), int(payload.get("htf_trend", 0)))
    wmul, th_adj, rscale = apply_goal(goal)
    return {"ok": True, "goal": goal, "weight_multipliers": wmul, "threshold_adjust": th_adj, "risk_scale": rscale}

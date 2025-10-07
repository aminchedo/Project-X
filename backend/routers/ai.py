from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
from backend.core.config import load_ai_config
from backend.ai.ga_calibrator import run_ga_and_save
from backend.ai.rl_agent import run_rl_week

router = APIRouter(prefix="/ai", tags=["ai"])

class Bar(BaseModel):
    signals: Dict[str, float]
    ret: float

class Perf(BaseModel):
    weekly_pnl: List[float]

@router.post("/ga/calibrate")
def ga_calibrate(payload: List[Bar]):
    walk = [b.dict() for b in payload]
    cfg = run_ga_and_save(walk)
    return {"ok": True, "config": cfg}

@router.post("/rl/train")
def rl_train(payload: Perf):
    cfg = run_rl_week(payload.weekly_pnl)
    return {"ok": True, "config": cfg}

@router.get("/config")
def get_cfg():
    return load_ai_config()
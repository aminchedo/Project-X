# Win-Rate Boost Pack (Drop-in)

Adds:
- **Goal Conditioning** (`backend/core/goal_conditioning.py`)
- **Confidence Calibration (Platt)** (`backend/core/calibration.py` + `/ai/extras`)
- **Light Experiment Tracker** (`backend/utils/experiment_tracker.py`)
- **Attribution Panel** (`src/components/AttributionPanel.tsx`)
- **Calibration Lab** (`src/pages/CalibrationLab.tsx`)
- **Tests**

## Wire-up
1) Mount router in `backend/main.py`:
```python
from backend.routers.ai_extras import router as extras_router
app.include_router(extras_router)
```
2) Apply Platt after computing raw entry score:
```python
from backend.core.calibration import load_platt, platt_apply
v = load_platt()
entry_score_calibrated = platt_apply(entry_score, *v) if v else entry_score
```
3) Goal-conditioning in signal flow:
```python
from backend.core.goal_conditioning import resolve_goal, apply_goal, adjust_thresholds
goal = resolve_goal(user_goal, smc.get("HTF_TREND",0))
wmul, th_adj, rscale = apply_goal(goal)
eff_weights = {k: base_weights.get(k,0.0)*wmul.get(k,1.0) for k in base_weights}
eff_thresholds = adjust_thresholds(base_thresholds, th_adj)
size *= rscale
```
4) Show AttributionPanel using decision logs.
5) Tests:
```
pytest -q
npx vitest run --passWithNoTests
```

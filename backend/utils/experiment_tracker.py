from __future__ import annotations
from typing import Dict, Any
import time, json, os
from pathlib import Path

EXPERIMENT_DIR = Path(os.environ.get("EXPERIMENT_DIR", "logs/experiments"))
EXPERIMENT_DIR.mkdir(parents=True, exist_ok=True)

def log_run(run_name: str, params: Dict[str, Any], metrics: Dict[str, Any]):
    ts = int(time.time()*1000)
    rec = {"ts": ts, "run": run_name, "params": params, "metrics": metrics}
    p = EXPERIMENT_DIR / f"{run_name}.ndjson"
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return str(p)

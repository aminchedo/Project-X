from pathlib import Path
import json, os

DEFAULT_PATH = Path(os.getenv("AI_CONFIG_PATH", "backend/config/ai_strategy_weights.json"))

def load_ai_config(path: Path = DEFAULT_PATH):
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({
            "weights": {
                "RSI": 0.2, "MACD": 0.2, "SMC": 0.25, "Harmonic": 0.1,
                "Sentiment": 0.2, "SAR": 0.05
            },
            "thresholds": {
                "EntryScore": 0.65, "ConfluenceScore": 0.55
            }
        }, indent=2))
    return json.loads(path.read_text())

def save_ai_config(cfg, path: Path = DEFAULT_PATH):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cfg, indent=2))
"""
Session filter for trading window management
Restricts trading to specific time windows (e.g., London/NY sessions)
"""

from datetime import datetime, time
from zoneinfo import ZoneInfo
from typing import Tuple
from backend.core.config import load_ai_config


def in_session(now: datetime) -> Tuple[bool, float]:
    """
    Check if current time is within configured trading windows
    
    Args:
        now: Current datetime (timezone-aware)
    
    Returns:
        Tuple of (is_in_session, scale_factor)
        - is_in_session: True if within any trading window
        - scale_factor: 1.0 if in session, 0.0 if strict mode and out of session,
                       scale_outside value if non-strict mode and out of session
    """
    cfg = load_ai_config()
    session_cfg = cfg.get("session", {})
    
    # Get configuration
    tz_str = session_cfg.get("timezone", "Europe/London")
    windows = session_cfg.get("windows", [])
    strict = session_cfg.get("strict", True)
    scale_outside = float(session_cfg.get("scale_outside", 0.3))
    
    # Convert to target timezone
    try:
        tz = ZoneInfo(tz_str)
    except Exception:
        # Fallback to UTC if timezone is invalid
        tz = ZoneInfo("UTC")
    
    t = now.astimezone(tz).time()
    
    # Check if time falls within any window
    for window in windows:
        try:
            start_time = time.fromisoformat(window["start"])
            end_time = time.fromisoformat(window["end"])
            
            if start_time <= t <= end_time:
                return True, 1.0
        except (KeyError, ValueError):
            # Skip invalid window
            continue
    
    # Out of session
    if strict:
        return False, 0.0
    else:
        return False, scale_outside
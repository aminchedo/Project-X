"""
Risk management with SMC-aware position sizing
Includes countertrend detection and dynamic size adjustment
"""

from typing import Dict, Optional
import structlog
from backend.core.goal_conditioning import resolve_goal, apply_goal

logger = structlog.get_logger()


class RiskPolicy:
    """Risk management policy parameters"""
    
    def __init__(
        self,
        max_risk_per_trade: float = 0.02,
        max_position: float = 0.25,
        stop_loss_atr_multiple: float = 1.5,
        take_profit_rr: float = 2.0,
        countertrend_reduction: float = 0.5,
        news_impact_reduction: float = 0.5
    ):
        self.max_risk_per_trade = max_risk_per_trade
        self.max_position = max_position
        self.stop_loss_atr_multiple = stop_loss_atr_multiple
        self.take_profit_rr = take_profit_rr
        self.countertrend_reduction = countertrend_reduction
        self.news_impact_reduction = news_impact_reduction


def position_size(
    equity: float,
    atr_pct: float,
    risk_policy: RiskPolicy
) -> float:
    """
    Calculate base position size using ATR-based risk
    
    Args:
        equity: Account equity
        atr_pct: ATR as percentage of price (e.g., 0.02 = 2%)
        risk_policy: RiskPolicy instance
    
    Returns:
        Position size as fraction of equity
    """
    if atr_pct <= 0 or equity <= 0:
        return 0.0
    
    # Risk amount = equity * max_risk_per_trade
    risk_amount = equity * risk_policy.max_risk_per_trade
    
    # Position size = risk_amount / (price * atr_pct * stop_loss_multiple)
    # Simplified: size_fraction = max_risk / (atr_pct * stop_loss_multiple)
    size = risk_policy.max_risk_per_trade / (atr_pct * risk_policy.stop_loss_atr_multiple)
    
    # Cap at max_position
    size = min(size, risk_policy.max_position)
    
    return max(0.0, size)


def position_size_with_policy(
    equity: float,
    atr_pct: float,
    risk_policy: RiskPolicy,
    countertrend: bool = False,
    news_high_impact: bool = False,
    user_goal: Optional[str] = None,
    htf_trend: float = 0.0
) -> float:
    """
    Calculate position size with policy adjustments
    
    Args:
        equity: Account equity
        atr_pct: ATR as percentage of price
        risk_policy: RiskPolicy instance
        countertrend: True if trading against HTF trend
        news_high_impact: True if high-impact news event nearby
        user_goal: Optional goal for goal-conditioning ("auto", "continuation", "reversal")
        htf_trend: HTF trend value (-1, 0, or 1) for goal resolution
    
    Returns:
        Adjusted position size as fraction of equity
    """
    # Base size
    size = position_size(equity, atr_pct, risk_policy)
    
    # Reduce size if countertrend
    if countertrend:
        size *= risk_policy.countertrend_reduction
        logger.info("Position size reduced (countertrend)", reduction=risk_policy.countertrend_reduction)
    
    # Reduce size if high-impact news
    if news_high_impact:
        size *= risk_policy.news_impact_reduction
        logger.info("Position size reduced (news impact)", reduction=risk_policy.news_impact_reduction)
    
    # Apply goal-conditioning risk scaling
    if user_goal:
        goal = resolve_goal(user_goal, htf_trend)
        _, _, rscale = apply_goal(goal)
        size *= float(rscale)
        logger.info("Position size scaled (goal-conditioning)", goal=goal, scale=rscale)
    
    # Final cap
    size = max(0.0, min(size, risk_policy.max_position))
    
    return size


def is_countertrend(
    direction: str,
    htf_trend: int
) -> bool:
    """
    Detect if trade is countertrend to HTF bias
    
    Args:
        direction: "LONG" or "SHORT"
        htf_trend: HTF trend indicator {-1: down, 0: neutral, 1: up}
    
    Returns:
        True if countertrend, False otherwise
    """
    if direction == "LONG" and htf_trend < 0:
        return True
    if direction == "SHORT" and htf_trend > 0:
        return True
    return False


def calculate_stop_loss(
    entry_price: float,
    atr: float,
    direction: str,
    atr_multiple: float = 1.5
) -> float:
    """
    Calculate stop loss based on ATR
    
    Args:
        entry_price: Entry price
        atr: ATR value (absolute price units)
        direction: "LONG" or "SHORT"
        atr_multiple: ATR multiplier for stop distance
    
    Returns:
        Stop loss price
    """
    if atr <= 0 or entry_price <= 0:
        # Fallback: 2% stop
        return entry_price * (0.98 if direction == "LONG" else 1.02)
    
    stop_distance = atr * atr_multiple
    
    if direction == "LONG":
        return entry_price - stop_distance
    else:  # SHORT
        return entry_price + stop_distance


def calculate_take_profit(
    entry_price: float,
    stop_loss: float,
    direction: str,
    risk_reward_ratio: float = 2.0
) -> float:
    """
    Calculate take profit based on risk-reward ratio
    
    Args:
        entry_price: Entry price
        stop_loss: Stop loss price
        direction: "LONG" or "SHORT"
        risk_reward_ratio: Reward/risk ratio
    
    Returns:
        Take profit price
    """
    if entry_price <= 0 or stop_loss <= 0:
        # Fallback: 4% profit target
        return entry_price * (1.04 if direction == "LONG" else 0.96)
    
    risk = abs(entry_price - stop_loss)
    reward = risk * risk_reward_ratio
    
    if direction == "LONG":
        return entry_price + reward
    else:  # SHORT
        return entry_price - reward


def calculate_risk_metrics(
    equity: float,
    entry_price: float,
    position_size: float,
    stop_loss: float,
    take_profit: float,
    direction: str
) -> Dict[str, float]:
    """
    Calculate comprehensive risk metrics for a position
    
    Args:
        equity: Account equity
        entry_price: Entry price
        position_size: Position size (as fraction of equity)
        stop_loss: Stop loss price
        take_profit: Take profit price
        direction: "LONG" or "SHORT"
    
    Returns:
        Dictionary with risk metrics:
        - position_value: Dollar value of position
        - risk_amount: Dollar amount at risk
        - risk_pct: Risk as % of equity
        - reward_amount: Potential reward in dollars
        - rr_ratio: Actual risk-reward ratio
    """
    position_value = equity * position_size
    
    if direction == "LONG":
        risk_amount = (entry_price - stop_loss) * (position_value / entry_price)
        reward_amount = (take_profit - entry_price) * (position_value / entry_price)
    else:  # SHORT
        risk_amount = (stop_loss - entry_price) * (position_value / entry_price)
        reward_amount = (entry_price - take_profit) * (position_value / entry_price)
    
    risk_pct = (risk_amount / equity) * 100 if equity > 0 else 0.0
    rr_ratio = (reward_amount / risk_amount) if risk_amount > 0 else 0.0
    
    return {
        "position_value": position_value,
        "risk_amount": risk_amount,
        "risk_pct": risk_pct,
        "reward_amount": reward_amount,
        "rr_ratio": rr_ratio
    }
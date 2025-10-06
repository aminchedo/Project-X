"""
Phase 6: Enhanced Risk Management & Position Sizing
Implements comprehensive risk management with ATR-based position sizing
"""

import numpy as np
from decimal import Decimal
from typing import Optional, List, Dict, Literal
from dataclasses import dataclass
from datetime import datetime
import structlog

logger = structlog.get_logger()

@dataclass
class PositionSize:
    """Calculated position parameters"""
    symbol: str
    quantity: float
    entry_price: float
    stop_loss: float
    take_profit: List[float]
    risk_amount: float
    risk_pct: float
    r_multiple: float  # Reward/Risk ratio
    max_leverage: float

@dataclass
class RiskLimits:
    """Risk management limits"""
    max_risk_per_trade: float = 0.01  # 1%
    max_risk_per_day: float = 0.03   # 3%
    max_positions: int = 5
    max_correlation: float = 0.7
    max_single_asset: float = 0.3    # 30% of portfolio
    max_drawdown: float = 0.15       # 15%
    max_var_95: float = 0.05         # 5% VaR
    max_leverage: float = 5.0
    min_diversification: int = 3

class EnhancedRiskManager:
    """Enhanced position sizing and risk enforcement"""
    
    def __init__(
        self,
        account_balance: float,
        risk_limits: Optional[RiskLimits] = None
    ):
        self.balance = account_balance
        self.initial_balance = account_balance
        self.limits = risk_limits or RiskLimits()
        
        # Daily tracking
        self.daily_risk_used = 0.0
        self.daily_pnl = 0.0
        self.open_positions = 0
        self.position_history = []
        
        # Portfolio tracking
        self.portfolio_value = account_balance
        self.max_portfolio_value = account_balance
        self.current_drawdown = 0.0
        
        # Position tracking
        self.active_positions = {}
        self.correlation_matrix = {}
        
    def calculate_position_size(
        self,
        symbol: str,
        entry_price: float,
        stop_loss: float,
        score: Dict,
        atr: float,
        structure_levels: Optional[List[float]] = None
    ) -> Optional[PositionSize]:
        """
        Calculate position size using ATR-based method
        
        Returns None if risk checks fail
        """
        
        # Check daily risk limit
        if self.daily_risk_used >= self.limits.max_risk_per_day:
            logger.warning("Daily risk limit reached")
            return None
        
        # Check max positions
        if self.open_positions >= self.limits.max_positions:
            logger.warning("Max positions reached")
            return None
        
        # Check drawdown limit
        if self.current_drawdown >= self.limits.max_drawdown:
            logger.warning("Max drawdown limit reached")
            return None
        
        # Risk amount in dollars
        risk_amount = self.balance * self.limits.max_risk_per_trade
        
        # Adjust by confidence
        confidence = score.get('confidence', 0.5)
        risk_amount *= confidence
        
        # Calculate stop distance
        stop_distance_pct = abs(entry_price - stop_loss) / entry_price
        
        if stop_distance_pct <= 0:
            logger.warning("Invalid stop loss distance")
            return None
        
        # Position size = Risk / Stop Distance
        position_value = risk_amount / stop_distance_pct
        quantity = position_value / entry_price
        
        # Check single asset limit
        position_value_pct = (position_value / self.portfolio_value) * 100
        if position_value_pct > self.limits.max_single_asset * 100:
            # Reduce position size to fit within limits
            max_position_value = self.portfolio_value * self.limits.max_single_asset
            quantity = max_position_value / entry_price
            position_value = max_position_value
            risk_amount = position_value * stop_distance_pct
        
        # Calculate take profit levels (1R, 2R, 3R)
        if score.get('direction') == "BULLISH":
            tp_distance = stop_distance_pct * entry_price
            take_profits = [
                entry_price + (tp_distance * mult)
                for mult in [1.0, 2.0, 3.0]
            ]
        else:
            tp_distance = stop_distance_pct * entry_price
            take_profits = [
                entry_price - (tp_distance * mult)
                for mult in [1.0, 2.0, 3.0]
            ]
        
        # Calculate R-multiple (reward/risk)
        r_multiple = (take_profits[1] - entry_price) / (entry_price - stop_loss)
        if score.get('direction') == "BEARISH":
            r_multiple = abs(r_multiple)
        
        # Dynamic leverage based on volatility
        volatility_pct = atr / entry_price if entry_price > 0 else 0.05
        if volatility_pct > 0.05:  # High volatility
            max_leverage = min(2.0, self.limits.max_leverage)
        elif volatility_pct > 0.03:
            max_leverage = min(3.0, self.limits.max_leverage)
        else:
            max_leverage = self.limits.max_leverage
        
        return PositionSize(
            symbol=symbol,
            quantity=float(quantity),
            entry_price=float(entry_price),
            stop_loss=float(stop_loss),
            take_profit=[float(tp) for tp in take_profits],
            risk_amount=float(risk_amount),
            risk_pct=float(self.limits.max_risk_per_trade * 100),
            r_multiple=float(r_multiple),
            max_leverage=float(max_leverage)
        )
    
    def calculate_stop_loss(
        self,
        entry_price: float,
        direction: str,
        atr: float,
        structure_levels: Optional[List[float]] = None
    ) -> float:
        """
        Calculate stop loss using ATR and structure
        
        Priority: Structure levels > 1.5x ATR
        """
        
        if direction == "BULLISH":
            # ATR-based stop
            atr_stop = entry_price - (1.5 * atr)
            
            # Check structure levels
            if structure_levels:
                structure_stop = max([
                    level for level in structure_levels
                    if level < entry_price
                ], default=atr_stop)
                
                # Use closest (structure or ATR)
                stop = max(atr_stop, structure_stop)
            else:
                stop = atr_stop
        
        else:  # BEARISH
            atr_stop = entry_price + (1.5 * atr)
            
            if structure_levels:
                structure_stop = min([
                    level for level in structure_levels
                    if level > entry_price
                ], default=atr_stop)
                
                stop = min(atr_stop, structure_stop)
            else:
                stop = atr_stop
        
        return float(stop)
    
    def check_correlation_limits(
        self,
        new_position: Dict,
        existing_positions: List[Dict]
    ) -> Dict:
        """Check correlation limits for new position"""
        
        if not existing_positions:
            return {"allowed": True, "reason": "No existing positions"}
        
        # Calculate correlation with existing positions
        symbol = new_position.get('symbol', '')
        correlations = []
        
        for pos in existing_positions:
            existing_symbol = pos.get('symbol', '')
            if existing_symbol != symbol:
                # Mock correlation calculation (in real implementation, use historical data)
                correlation = np.random.uniform(-0.5, 0.8)
                correlations.append(correlation)
        
        if correlations:
            max_correlation = max(correlations)
            avg_correlation = np.mean(correlations)
            
            if max_correlation > self.limits.max_correlation:
                return {
                    "allowed": False,
                    "reason": f"High correlation with existing position: {max_correlation:.3f}",
                    "max_correlation": max_correlation,
                    "limit": self.limits.max_correlation
                }
        
        return {
            "allowed": True,
            "reason": "Correlation within limits",
            "max_correlation": max(correlations) if correlations else 0,
            "limit": self.limits.max_correlation
        }
    
    def calculate_portfolio_var(
        self,
        positions: List[Dict],
        confidence: float = 0.95
    ) -> Dict:
        """Calculate portfolio Value at Risk"""
        
        if not positions:
            return {"var": 0, "confidence": confidence}
        
        # Mock VaR calculation (in real implementation, use historical returns)
        portfolio_value = sum(pos.get('value', 0) for pos in positions)
        
        # Simple VaR calculation based on volatility
        volatility = 0.02  # 2% daily volatility (mock)
        z_score = 1.96 if confidence == 0.95 else 2.33  # 99% confidence
        
        var = portfolio_value * volatility * z_score
        
        return {
            "var": var,
            "var_pct": (var / portfolio_value) * 100 if portfolio_value > 0 else 0,
            "confidence": confidence,
            "portfolio_value": portfolio_value
        }
    
    def assess_portfolio_risk(
        self,
        portfolio: Dict,
        current_prices: Dict
    ) -> Dict:
        """Get comprehensive portfolio risk assessment"""
        
        positions = portfolio.get('open_positions', [])
        portfolio_value = portfolio.get('portfolio_value', self.balance)
        
        # Calculate current portfolio value
        current_value = 0
        for pos in positions:
            symbol = pos.get('symbol', '')
            quantity = pos.get('quantity', 0)
            current_price = current_prices.get(symbol, pos.get('entry_price', 0))
            current_value += quantity * current_price
        
        # Calculate P&L
        total_pnl = current_value - portfolio_value
        
        # Calculate drawdown
        if current_value > self.max_portfolio_value:
            self.max_portfolio_value = current_value
        
        drawdown = (self.max_portfolio_value - current_value) / self.max_portfolio_value
        
        # Calculate VaR
        var_result = self.calculate_portfolio_var(positions)
        
        # Check risk limits
        risk_checks = {
            "daily_risk_ok": self.daily_risk_used < self.limits.max_risk_per_day,
            "drawdown_ok": drawdown < self.limits.max_drawdown,
            "var_ok": var_result["var_pct"] < self.limits.max_var_95 * 100,
            "positions_ok": len(positions) < self.limits.max_positions
        }
        
        return {
            "portfolio_value": current_value,
            "total_pnl": total_pnl,
            "pnl_pct": (total_pnl / portfolio_value) * 100 if portfolio_value > 0 else 0,
            "drawdown": drawdown,
            "var": var_result,
            "risk_checks": risk_checks,
            "overall_risk": "HIGH" if not all(risk_checks.values()) else "LOW",
            "recommendations": self._generate_risk_recommendations(risk_checks, drawdown, var_result)
        }
    
    def _generate_risk_recommendations(
        self,
        risk_checks: Dict,
        drawdown: float,
        var_result: Dict
    ) -> List[str]:
        """Generate risk management recommendations"""
        
        recommendations = []
        
        if not risk_checks["daily_risk_ok"]:
            recommendations.append("Daily risk limit exceeded - reduce position sizes")
        
        if not risk_checks["drawdown_ok"]:
            recommendations.append(f"High drawdown ({drawdown:.1%}) - consider reducing exposure")
        
        if not risk_checks["var_ok"]:
            recommendations.append(f"High VaR ({var_result['var_pct']:.1f}%) - diversify portfolio")
        
        if not risk_checks["positions_ok"]:
            recommendations.append("Too many positions - close some before opening new ones")
        
        if not recommendations:
            recommendations.append("Portfolio risk within acceptable limits")
        
        return recommendations
    
    def update_position(
        self,
        symbol: str,
        position: PositionSize,
        current_price: float
    ) -> Dict:
        """Update position with current market data"""
        
        # Calculate unrealized P&L
        if position.quantity > 0:  # Long position
            unrealized_pnl = (current_price - position.entry_price) * position.quantity
        else:  # Short position
            unrealized_pnl = (position.entry_price - current_price) * abs(position.quantity)
        
        # Calculate P&L percentage
        pnl_pct = (unrealized_pnl / (position.entry_price * abs(position.quantity))) * 100
        
        # Update portfolio value
        self.portfolio_value += unrealized_pnl - self.active_positions.get(symbol, {}).get('unrealized_pnl', 0)
        
        # Store position data
        self.active_positions[symbol] = {
            "position": position,
            "current_price": current_price,
            "unrealized_pnl": unrealized_pnl,
            "pnl_pct": pnl_pct,
            "last_updated": datetime.now()
        }
        
        return {
            "symbol": symbol,
            "unrealized_pnl": unrealized_pnl,
            "pnl_pct": pnl_pct,
            "current_price": current_price,
            "portfolio_value": self.portfolio_value
        }
    
    def close_position(self, symbol: str, exit_price: float) -> Dict:
        """Close a position and update risk metrics"""
        
        if symbol not in self.active_positions:
            return {"error": "Position not found"}
        
        position_data = self.active_positions[symbol]
        position = position_data["position"]
        
        # Calculate final P&L
        if position.quantity > 0:  # Long position
            final_pnl = (exit_price - position.entry_price) * position.quantity
        else:  # Short position
            final_pnl = (position.entry_price - exit_price) * abs(position.quantity)
        
        # Update daily P&L
        self.daily_pnl += final_pnl
        self.portfolio_value += final_pnl
        
        # Update risk metrics
        self.daily_risk_used += abs(final_pnl) / self.balance
        self.open_positions -= 1
        
        # Remove from active positions
        del self.active_positions[symbol]
        
        # Add to position history
        self.position_history.append({
            "symbol": symbol,
            "entry_price": position.entry_price,
            "exit_price": exit_price,
            "quantity": position.quantity,
            "pnl": final_pnl,
            "pnl_pct": (final_pnl / (position.entry_price * abs(position.quantity))) * 100,
            "entry_time": position_data["last_updated"],
            "exit_time": datetime.now()
        })
        
        return {
            "symbol": symbol,
            "final_pnl": final_pnl,
            "pnl_pct": (final_pnl / (position.entry_price * abs(position.quantity))) * 100,
            "portfolio_value": self.portfolio_value,
            "daily_pnl": self.daily_pnl
        }
    
    def reset_daily_metrics(self):
        """Reset daily risk metrics"""
        self.daily_risk_used = 0.0
        self.daily_pnl = 0.0
        logger.info("Daily risk metrics reset")
    
    def get_risk_status(self) -> Dict:
        """Get current risk management status"""
        return {
            "account_balance": self.balance,
            "portfolio_value": self.portfolio_value,
            "daily_risk_used": self.daily_risk_used,
            "daily_pnl": self.daily_pnl,
            "open_positions": self.open_positions,
            "current_drawdown": self.current_drawdown,
            "max_drawdown": self.limits.max_drawdown,
            "daily_risk_limit": self.limits.max_risk_per_day,
            "position_limit": self.limits.max_positions,
            "can_trade": self._can_trade()
        }
    
    def _can_trade(self) -> bool:
        """Check if trading is allowed based on risk limits"""
        return (
            self.daily_risk_used < self.limits.max_risk_per_day and
            self.open_positions < self.limits.max_positions and
            self.current_drawdown < self.limits.max_drawdown
        )

# Global enhanced risk manager instance
enhanced_risk_manager = EnhancedRiskManager(10000.0)

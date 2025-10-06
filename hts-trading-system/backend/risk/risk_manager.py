"""
HTS Trading System - Risk Manager
Implements comprehensive risk management for trading operations.
"""

import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

class RiskLevel(Enum):
    """Risk level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"

@dataclass
class RiskMetrics:
    """Risk metrics data structure"""
    var_1d: float  # 1-day Value at Risk
    var_7d: float  # 7-day Value at Risk
    expected_shortfall: float  # Expected Shortfall (CVaR)
    max_drawdown: float  # Maximum Drawdown
    sharpe_ratio: float  # Sharpe Ratio
    sortino_ratio: float  # Sortino Ratio
    volatility: float  # Annualized Volatility
    beta: float  # Market Beta
    risk_level: RiskLevel  # Overall Risk Level

@dataclass
class PositionRisk:
    """Position-specific risk metrics"""
    symbol: str
    position_size: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    risk_amount: float  # Amount at risk
    stop_loss: Optional[float]
    take_profit: Optional[float]
    risk_reward_ratio: float
    position_risk_pct: float  # Risk as % of portfolio

class RiskManager:
    """Comprehensive risk management system"""
    
    def __init__(self):
        self.max_position_risk = 0.02  # 2% max risk per position
        self.max_portfolio_risk = 0.10  # 10% max total portfolio risk
        self.max_correlation_exposure = 0.30  # 30% max exposure to correlated assets
        self.var_confidence_level = 0.05  # 95% confidence for VaR
        self.risk_free_rate = 0.02  # 2% annual risk-free rate
        
        # Risk limits
        self.max_daily_loss = 0.05  # 5% max daily loss
        self.max_drawdown_limit = 0.20  # 20% max drawdown
        self.leverage_limit = 3.0  # 3x max leverage
        
        # Historical data for risk calculations
        self.price_history: Dict[str, List[float]] = {}
        self.returns_history: Dict[str, List[float]] = {}
        
    def calculate_position_size(
        self, 
        symbol: str, 
        entry_price: float, 
        stop_loss: float, 
        portfolio_value: float,
        risk_percentage: Optional[float] = None
    ) -> Dict[str, Any]:
        """Calculate optimal position size based on risk parameters"""
        try:
            risk_pct = risk_percentage or self.max_position_risk
            
            # Calculate risk per share
            risk_per_share = abs(entry_price - stop_loss)
            if risk_per_share == 0:
                return {"error": "Stop loss cannot equal entry price"}
            
            # Calculate maximum risk amount
            max_risk_amount = portfolio_value * risk_pct
            
            # Calculate position size
            position_size = max_risk_amount / risk_per_share
            
            # Calculate position value
            position_value = position_size * entry_price
            
            # Check if position exceeds portfolio limits
            position_pct = position_value / portfolio_value
            if position_pct > 0.25:  # Max 25% in single position
                position_size = (portfolio_value * 0.25) / entry_price
                position_value = position_size * entry_price
                position_pct = 0.25
            
            # Calculate actual risk
            actual_risk = position_size * risk_per_share
            actual_risk_pct = actual_risk / portfolio_value
            
            return {
                "symbol": symbol,
                "position_size": round(position_size, 8),
                "position_value": round(position_value, 2),
                "position_pct": round(position_pct * 100, 2),
                "risk_amount": round(actual_risk, 2),
                "risk_pct": round(actual_risk_pct * 100, 2),
                "risk_per_share": round(risk_per_share, 8),
                "entry_price": entry_price,
                "stop_loss": stop_loss,
                "risk_reward_ratio": self._calculate_risk_reward_ratio(entry_price, stop_loss)
            }
            
        except Exception as e:
            logger.error(f"Error calculating position size: {str(e)}")
            return {"error": str(e)}
    
    def _calculate_risk_reward_ratio(
        self, 
        entry_price: float, 
        stop_loss: float, 
        take_profit: Optional[float] = None
    ) -> float:
        """Calculate risk/reward ratio"""
        risk = abs(entry_price - stop_loss)
        
        if take_profit:
            reward = abs(take_profit - entry_price)
            return reward / risk if risk > 0 else 0
        
        # Default to 2:1 reward if no take profit specified
        return 2.0
    
    def calculate_var(
        self, 
        returns: List[float], 
        confidence_level: float = 0.05,
        time_horizon: int = 1
    ) -> float:
        """Calculate Value at Risk (VaR)"""
        try:
            if len(returns) < 30:
                logger.warning("Insufficient data for reliable VaR calculation")
                return 0.0
            
            returns_array = np.array(returns)
            
            # Scale for time horizon
            if time_horizon > 1:
                returns_array = returns_array * np.sqrt(time_horizon)
            
            # Calculate VaR using historical simulation
            var = np.percentile(returns_array, confidence_level * 100)
            
            return abs(var)
            
        except Exception as e:
            logger.error(f"Error calculating VaR: {str(e)}")
            return 0.0
    
    def calculate_expected_shortfall(
        self, 
        returns: List[float], 
        confidence_level: float = 0.05
    ) -> float:
        """Calculate Expected Shortfall (Conditional VaR)"""
        try:
            if len(returns) < 30:
                return 0.0
            
            returns_array = np.array(returns)
            var_threshold = np.percentile(returns_array, confidence_level * 100)
            
            # Calculate expected shortfall as average of losses beyond VaR
            tail_losses = returns_array[returns_array <= var_threshold]
            
            if len(tail_losses) > 0:
                return abs(np.mean(tail_losses))
            
            return 0.0
            
        except Exception as e:
            logger.error(f"Error calculating Expected Shortfall: {str(e)}")
            return 0.0
    
    def calculate_max_drawdown(self, prices: List[float]) -> Tuple[float, int, int]:
        """Calculate maximum drawdown and its duration"""
        try:
            if len(prices) < 2:
                return 0.0, 0, 0
            
            prices_array = np.array(prices)
            cumulative = np.cumprod(1 + np.diff(prices_array) / prices_array[:-1])
            
            # Calculate running maximum
            running_max = np.maximum.accumulate(cumulative)
            
            # Calculate drawdown
            drawdown = (cumulative - running_max) / running_max
            
            # Find maximum drawdown
            max_dd = np.min(drawdown)
            max_dd_idx = np.argmin(drawdown)
            
            # Find start of drawdown period
            start_idx = 0
            for i in range(max_dd_idx, -1, -1):
                if drawdown[i] == 0:
                    start_idx = i
                    break
            
            return abs(max_dd), start_idx, max_dd_idx
            
        except Exception as e:
            logger.error(f"Error calculating max drawdown: {str(e)}")
            return 0.0, 0, 0
    
    def calculate_sharpe_ratio(
        self, 
        returns: List[float], 
        risk_free_rate: Optional[float] = None
    ) -> float:
        """Calculate Sharpe ratio"""
        try:
            if len(returns) < 2:
                return 0.0
            
            rf_rate = risk_free_rate or self.risk_free_rate
            returns_array = np.array(returns)
            
            # Annualized excess return
            excess_return = np.mean(returns_array) * 252 - rf_rate
            
            # Annualized volatility
            volatility = np.std(returns_array) * np.sqrt(252)
            
            if volatility == 0:
                return 0.0
            
            return excess_return / volatility
            
        except Exception as e:
            logger.error(f"Error calculating Sharpe ratio: {str(e)}")
            return 0.0
    
    def calculate_sortino_ratio(
        self, 
        returns: List[float], 
        risk_free_rate: Optional[float] = None
    ) -> float:
        """Calculate Sortino ratio (downside deviation)"""
        try:
            if len(returns) < 2:
                return 0.0
            
            rf_rate = risk_free_rate or self.risk_free_rate
            returns_array = np.array(returns)
            
            # Annualized excess return
            excess_return = np.mean(returns_array) * 252 - rf_rate
            
            # Downside deviation (only negative returns)
            negative_returns = returns_array[returns_array < 0]
            if len(negative_returns) == 0:
                return float('inf')
            
            downside_deviation = np.std(negative_returns) * np.sqrt(252)
            
            if downside_deviation == 0:
                return 0.0
            
            return excess_return / downside_deviation
            
        except Exception as e:
            logger.error(f"Error calculating Sortino ratio: {str(e)}")
            return 0.0
    
    def calculate_beta(
        self, 
        asset_returns: List[float], 
        market_returns: List[float]
    ) -> float:
        """Calculate beta relative to market"""
        try:
            if len(asset_returns) != len(market_returns) or len(asset_returns) < 30:
                return 1.0  # Default beta
            
            asset_array = np.array(asset_returns)
            market_array = np.array(market_returns)
            
            # Calculate covariance and market variance
            covariance = np.cov(asset_array, market_array)[0, 1]
            market_variance = np.var(market_array)
            
            if market_variance == 0:
                return 1.0
            
            return covariance / market_variance
            
        except Exception as e:
            logger.error(f"Error calculating beta: {str(e)}")
            return 1.0
    
    def assess_portfolio_risk(
        self, 
        positions: List[Dict], 
        market_data: Dict[str, List[float]]
    ) -> RiskMetrics:
        """Comprehensive portfolio risk assessment"""
        try:
            if not positions:
                return RiskMetrics(0, 0, 0, 0, 0, 0, 0, 1, RiskLevel.LOW)
            
            # Calculate portfolio returns
            portfolio_returns = self._calculate_portfolio_returns(positions, market_data)
            
            if len(portfolio_returns) < 30:
                logger.warning("Insufficient data for comprehensive risk assessment")
                return RiskMetrics(0, 0, 0, 0, 0, 0, 0, 1, RiskLevel.MEDIUM)
            
            # Calculate risk metrics
            var_1d = self.calculate_var(portfolio_returns, time_horizon=1)
            var_7d = self.calculate_var(portfolio_returns, time_horizon=7)
            expected_shortfall = self.calculate_expected_shortfall(portfolio_returns)
            
            # Portfolio values for drawdown calculation
            portfolio_values = self._calculate_portfolio_values(positions, market_data)
            max_dd, _, _ = self.calculate_max_drawdown(portfolio_values)
            
            sharpe = self.calculate_sharpe_ratio(portfolio_returns)
            sortino = self.calculate_sortino_ratio(portfolio_returns)
            
            # Annualized volatility
            volatility = np.std(portfolio_returns) * np.sqrt(252)
            
            # Beta (assume BTC as market proxy)
            market_returns = market_data.get("BTCUSDT", portfolio_returns)
            beta = self.calculate_beta(portfolio_returns, market_returns)
            
            # Determine overall risk level
            risk_level = self._determine_risk_level(var_1d, max_dd, volatility)
            
            return RiskMetrics(
                var_1d=var_1d,
                var_7d=var_7d,
                expected_shortfall=expected_shortfall,
                max_drawdown=max_dd,
                sharpe_ratio=sharpe,
                sortino_ratio=sortino,
                volatility=volatility,
                beta=beta,
                risk_level=risk_level
            )
            
        except Exception as e:
            logger.error(f"Error assessing portfolio risk: {str(e)}")
            return RiskMetrics(0, 0, 0, 0, 0, 0, 0, 1, RiskLevel.MEDIUM)
    
    def _calculate_portfolio_returns(
        self, 
        positions: List[Dict], 
        market_data: Dict[str, List[float]]
    ) -> List[float]:
        """Calculate historical portfolio returns"""
        try:
            if not positions or not market_data:
                return []
            
            # Get the minimum length of price data
            min_length = min(len(prices) for prices in market_data.values() if len(prices) > 0)
            if min_length < 2:
                return []
            
            portfolio_returns = []
            total_value = sum(pos.get("value", 0) for pos in positions)
            
            for i in range(1, min_length):
                daily_return = 0.0
                
                for position in positions:
                    symbol = position.get("symbol", "")
                    weight = position.get("value", 0) / total_value if total_value > 0 else 0
                    
                    if symbol in market_data and len(market_data[symbol]) > i:
                        prices = market_data[symbol]
                        asset_return = (prices[i] - prices[i-1]) / prices[i-1]
                        daily_return += weight * asset_return
                
                portfolio_returns.append(daily_return)
            
            return portfolio_returns
            
        except Exception as e:
            logger.error(f"Error calculating portfolio returns: {str(e)}")
            return []
    
    def _calculate_portfolio_values(
        self, 
        positions: List[Dict], 
        market_data: Dict[str, List[float]]
    ) -> List[float]:
        """Calculate historical portfolio values"""
        try:
            if not positions or not market_data:
                return []
            
            min_length = min(len(prices) for prices in market_data.values() if len(prices) > 0)
            if min_length < 1:
                return []
            
            portfolio_values = []
            
            for i in range(min_length):
                total_value = 0.0
                
                for position in positions:
                    symbol = position.get("symbol", "")
                    quantity = position.get("quantity", 0)
                    
                    if symbol in market_data and len(market_data[symbol]) > i:
                        price = market_data[symbol][i]
                        total_value += quantity * price
                
                portfolio_values.append(total_value)
            
            return portfolio_values
            
        except Exception as e:
            logger.error(f"Error calculating portfolio values: {str(e)}")
            return []
    
    def _determine_risk_level(
        self, 
        var_1d: float, 
        max_drawdown: float, 
        volatility: float
    ) -> RiskLevel:
        """Determine overall risk level based on metrics"""
        risk_score = 0
        
        # VaR scoring
        if var_1d > 0.05:  # >5% daily VaR
            risk_score += 3
        elif var_1d > 0.03:  # >3% daily VaR
            risk_score += 2
        elif var_1d > 0.01:  # >1% daily VaR
            risk_score += 1
        
        # Max drawdown scoring
        if max_drawdown > 0.30:  # >30% drawdown
            risk_score += 3
        elif max_drawdown > 0.20:  # >20% drawdown
            risk_score += 2
        elif max_drawdown > 0.10:  # >10% drawdown
            risk_score += 1
        
        # Volatility scoring
        if volatility > 0.60:  # >60% annual volatility
            risk_score += 3
        elif volatility > 0.40:  # >40% annual volatility
            risk_score += 2
        elif volatility > 0.20:  # >20% annual volatility
            risk_score += 1
        
        # Determine risk level
        if risk_score >= 7:
            return RiskLevel.EXTREME
        elif risk_score >= 5:
            return RiskLevel.HIGH
        elif risk_score >= 3:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def check_risk_limits(
        self, 
        positions: List[Dict], 
        portfolio_value: float
    ) -> Dict[str, Any]:
        """Check if positions violate risk limits"""
        violations = []
        warnings = []
        
        try:
            total_risk = 0.0
            
            for position in positions:
                symbol = position.get("symbol", "")
                risk_amount = position.get("risk_amount", 0)
                position_value = position.get("value", 0)
                
                # Check position size limits
                position_pct = position_value / portfolio_value if portfolio_value > 0 else 0
                if position_pct > 0.25:
                    violations.append(f"{symbol}: Position size {position_pct:.1%} exceeds 25% limit")
                
                # Check individual position risk
                risk_pct = risk_amount / portfolio_value if portfolio_value > 0 else 0
                if risk_pct > self.max_position_risk:
                    violations.append(f"{symbol}: Position risk {risk_pct:.1%} exceeds {self.max_position_risk:.1%} limit")
                
                total_risk += risk_amount
            
            # Check total portfolio risk
            total_risk_pct = total_risk / portfolio_value if portfolio_value > 0 else 0
            if total_risk_pct > self.max_portfolio_risk:
                violations.append(f"Total portfolio risk {total_risk_pct:.1%} exceeds {self.max_portfolio_risk:.1%} limit")
            elif total_risk_pct > self.max_portfolio_risk * 0.8:
                warnings.append(f"Total portfolio risk {total_risk_pct:.1%} approaching limit")
            
            return {
                "violations": violations,
                "warnings": warnings,
                "total_risk_pct": total_risk_pct,
                "within_limits": len(violations) == 0
            }
            
        except Exception as e:
            logger.error(f"Error checking risk limits: {str(e)}")
            return {"error": str(e), "within_limits": False}
    
    def suggest_position_adjustments(
        self, 
        positions: List[Dict], 
        portfolio_value: float
    ) -> List[Dict]:
        """Suggest position adjustments to improve risk profile"""
        suggestions = []
        
        try:
            risk_check = self.check_risk_limits(positions, portfolio_value)
            
            if not risk_check.get("within_limits", True):
                for position in positions:
                    symbol = position.get("symbol", "")
                    current_size = position.get("quantity", 0)
                    risk_amount = position.get("risk_amount", 0)
                    
                    # Calculate suggested position size
                    max_risk = portfolio_value * self.max_position_risk
                    if risk_amount > max_risk and risk_amount > 0:
                        reduction_factor = max_risk / risk_amount
                        suggested_size = current_size * reduction_factor
                        
                        suggestions.append({
                            "symbol": symbol,
                            "action": "reduce",
                            "current_size": current_size,
                            "suggested_size": suggested_size,
                            "reduction_pct": (1 - reduction_factor) * 100,
                            "reason": f"Reduce risk from {risk_amount/portfolio_value:.1%} to {self.max_position_risk:.1%}"
                        })
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error suggesting position adjustments: {str(e)}")
            return []
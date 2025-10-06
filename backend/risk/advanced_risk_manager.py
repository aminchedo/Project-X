import asyncio
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import warnings
warnings.filterwarnings('ignore')

from ..trading.trade_logger import trade_logger
from ..schemas.validation import RiskAlertSchema, SeverityLevel


@dataclass
class RiskLimits:
    max_portfolio_risk: float = 0.02  # 2% max loss per day
    max_correlation: float = 0.7      # Max asset correlation
    max_single_asset: float = 0.20    # 20% max per asset
    max_drawdown: float = 0.15        # 15% max drawdown
    max_var_95: float = 0.05          # 5% max VaR at 95% confidence
    max_leverage: float = 3.0         # 3x max leverage
    min_diversification: int = 3      # Minimum 3 assets


@dataclass
class PositionRisk:
    symbol: str
    current_exposure: float
    var_contribution: float
    correlation_risk: float
    concentration_risk: float
    individual_var: float


class AdvancedRiskManager:
    def __init__(self):
        self.limits = RiskLimits()
        self.price_history: Dict[str, List[float]] = {}
        self.correlation_matrix: Optional[pd.DataFrame] = None
        self.last_risk_calculation = None
        self.risk_alerts_history: List[Dict] = []
        
        # Risk monitoring parameters
        self.var_confidence_levels = [0.95, 0.99]
        self.lookback_periods = [30, 60, 90]  # days
        self.rebalance_threshold = 0.05  # 5% deviation triggers rebalance check
        
    async def calculate_portfolio_var(self, positions: List[Dict], confidence: float = 0.95) -> Dict:
        """Calculate Value at Risk using Monte Carlo simulation"""
        try:
            if not positions:
                return self._get_empty_var_result()
            
            # Get historical returns for all positions
            returns_data = await self._get_returns_matrix(positions)
            
            if returns_data.empty:
                return self._get_empty_var_result()
            
            # Calculate portfolio weights
            total_value = sum(pos['quantity'] * pos['entry_price'] for pos in positions)
            weights = np.array([
                (pos['quantity'] * pos['entry_price']) / total_value 
                for pos in positions
            ])
            
            # Portfolio returns
            portfolio_returns = (returns_data * weights).sum(axis=1)
            
            # Calculate VaR using historical simulation
            var_percentile = (1 - confidence) * 100
            var_value = np.percentile(portfolio_returns, var_percentile)
            
            # Calculate Expected Shortfall (CVaR)
            cvar_value = portfolio_returns[portfolio_returns <= var_value].mean()
            
            # Monte Carlo simulation for forward-looking VaR
            mc_var = await self._monte_carlo_var(returns_data, weights, confidence)
            
            # Component VaR calculation
            component_vars = await self._calculate_component_var(returns_data, weights, positions)
            
            return {
                'calculation_time': datetime.now(),
                'confidence_level': confidence,
                'portfolio_var': abs(var_value),
                'portfolio_cvar': abs(cvar_value),
                'monte_carlo_var': mc_var,
                'portfolio_volatility': portfolio_returns.std(),
                'component_vars': component_vars,
                'total_portfolio_value': total_value,
                'risk_contribution': self._calculate_risk_contribution(component_vars),
                'risk_metrics': {
                    'sharpe_estimate': portfolio_returns.mean() / portfolio_returns.std() if portfolio_returns.std() > 0 else 0,
                    'skewness': float(portfolio_returns.skew()),
                    'kurtosis': float(portfolio_returns.kurtosis()),
                    'max_drawdown_risk': self._estimate_drawdown_risk(portfolio_returns)
                }
            }
            
        except Exception as e:
            print(f"Error calculating portfolio VaR: {str(e)}")
            return self._get_empty_var_result()
    
    async def check_correlation_limits(self, new_position: Dict, existing_positions: List[Dict]) -> Dict:
        """Check correlation limits before adding new position"""
        try:
            if not existing_positions:
                return {
                    'status': 'approved',
                    'max_correlation': 0,
                    'correlated_assets': [],
                    'recommendation': 'First position - no correlation concerns'
                }
            
            # Get correlation matrix
            all_symbols = [pos['symbol'] for pos in existing_positions] + [new_position['symbol']]
            correlation_matrix = await self._calculate_correlation_matrix(all_symbols)
            
            if correlation_matrix is None:
                return {
                    'status': 'warning',
                    'max_correlation': 0,
                    'correlated_assets': [],
                    'recommendation': 'Insufficient data for correlation analysis'
                }
            
            new_symbol = new_position['symbol']
            correlations = []
            
            for pos in existing_positions:
                existing_symbol = pos['symbol']
                if existing_symbol in correlation_matrix.index and new_symbol in correlation_matrix.columns:
                    corr = correlation_matrix.loc[existing_symbol, new_symbol]
                    correlations.append({
                        'symbol': existing_symbol,
                        'correlation': float(corr),
                        'exposure': pos['quantity'] * pos['entry_price']
                    })
            
            # Find maximum correlation
            max_corr = max([abs(c['correlation']) for c in correlations]) if correlations else 0
            
            # Check if correlation exceeds limits
            if max_corr > self.limits.max_correlation:
                highly_correlated = [c for c in correlations if abs(c['correlation']) > self.limits.max_correlation]
                
                return {
                    'status': 'rejected',
                    'max_correlation': max_corr,
                    'correlated_assets': highly_correlated,
                    'recommendation': f'Position rejected due to high correlation ({max_corr:.2f}) with existing positions'
                }
            
            return {
                'status': 'approved',
                'max_correlation': max_corr,
                'correlated_assets': correlations,
                'recommendation': 'Position approved - correlation within limits'
            }
            
        except Exception as e:
            print(f"Error checking correlation limits: {str(e)}")
            return {
                'status': 'error',
                'max_correlation': 0,
                'correlated_assets': [],
                'recommendation': f'Error in correlation analysis: {str(e)}'
            }
    
    async def optimize_position_sizing(self, signal: Dict, portfolio: Dict, current_prices: Dict) -> Dict:
        """Optimize position sizing using Kelly criterion and portfolio constraints"""
        try:
            symbol = signal['symbol']
            confidence = signal['confidence']
            action = signal['action']
            
            # Get current portfolio metrics
            portfolio_value = portfolio.get('portfolio_value', 10000)
            current_positions = portfolio.get('open_positions', [])
            
            # Base position size using confidence
            base_position_pct = 0.05  # 5% base allocation
            confidence_multiplier = 0.5 + (confidence * 1.5)  # 0.5x to 2.0x based on confidence
            
            # Kelly criterion adjustment
            kelly_fraction = await self._calculate_kelly_fraction(symbol, signal)
            
            # Risk-adjusted position size
            risk_adjusted_size = min(
                base_position_pct * confidence_multiplier,
                kelly_fraction * 0.25,  # Use 25% of Kelly to be conservative
                self.limits.max_single_asset
            )
            
            # Check portfolio concentration
            concentration_check = await self._check_concentration_limits(
                symbol, risk_adjusted_size, current_positions
            )
            
            if not concentration_check['approved']:
                risk_adjusted_size = concentration_check['max_allowed_size']
            
            # Apply volatility adjustment
            volatility_adjustment = await self._get_volatility_adjustment(symbol)
            final_size = risk_adjusted_size * volatility_adjustment
            
            # Convert to dollar amount
            current_price = current_prices.get(symbol, signal.get('price', 0))
            position_value = portfolio_value * final_size
            quantity = position_value / current_price if current_price > 0 else 0
            
            return {
                'symbol': symbol,
                'recommended_size_pct': final_size,
                'recommended_value': position_value,
                'recommended_quantity': quantity,
                'kelly_fraction': kelly_fraction,
                'confidence_multiplier': confidence_multiplier,
                'volatility_adjustment': volatility_adjustment,
                'concentration_check': concentration_check,
                'risk_metrics': {
                    'expected_var_contribution': await self._estimate_var_contribution(symbol, final_size),
                    'correlation_risk': await self._estimate_correlation_risk(symbol, current_positions),
                    'concentration_risk': final_size / self.limits.max_single_asset
                }
            }
            
        except Exception as e:
            print(f"Error optimizing position sizing: {str(e)}")
            return {
                'symbol': signal.get('symbol', 'UNKNOWN'),
                'recommended_size_pct': 0.01,  # Conservative fallback
                'recommended_value': 100,
                'recommended_quantity': 0,
                'error': str(e)
            }
    
    async def assess_portfolio_risk(self, portfolio: Dict, current_prices: Dict) -> Dict:
        """Comprehensive portfolio risk assessment"""
        try:
            positions = portfolio.get('open_positions', [])
            portfolio_value = portfolio.get('portfolio_value', 10000)
            
            if not positions:
                return self._get_empty_risk_assessment()
            
            # Calculate VaR
            var_analysis = await self.calculate_portfolio_var(positions)
            
            # Check concentration limits
            concentration_analysis = await self._analyze_concentration(positions, portfolio_value)
            
            # Check correlation risks
            correlation_analysis = await self._analyze_correlation_risks(positions)
            
            # Calculate drawdown risk
            drawdown_analysis = await self._analyze_drawdown_risk(portfolio)
            
            # Liquidity risk assessment
            liquidity_analysis = await self._analyze_liquidity_risk(positions, current_prices)
            
            # Overall risk score (0-100, higher is riskier)
            risk_score = self._calculate_overall_risk_score({
                'var': var_analysis,
                'concentration': concentration_analysis,
                'correlation': correlation_analysis,
                'drawdown': drawdown_analysis,
                'liquidity': liquidity_analysis
            })
            
            # Generate risk alerts if necessary
            alerts = await self._generate_risk_alerts(risk_score, {
                'var': var_analysis,
                'concentration': concentration_analysis,
                'correlation': correlation_analysis,
                'drawdown': drawdown_analysis
            })
            
            return {
                'assessment_time': datetime.now(),
                'overall_risk_score': risk_score,
                'risk_level': self._categorize_risk_level(risk_score),
                'portfolio_value': portfolio_value,
                'var_analysis': var_analysis,
                'concentration_analysis': concentration_analysis,
                'correlation_analysis': correlation_analysis,
                'drawdown_analysis': drawdown_analysis,
                'liquidity_analysis': liquidity_analysis,
                'alerts': alerts,
                'recommendations': self._generate_risk_recommendations(risk_score, alerts)
            }
            
        except Exception as e:
            print(f"Error assessing portfolio risk: {str(e)}")
            return self._get_empty_risk_assessment()
    
    async def _get_returns_matrix(self, positions: List[Dict]) -> pd.DataFrame:
        """Get historical returns matrix for positions"""
        try:
            symbols = [pos['symbol'] for pos in positions]
            returns_data = {}
            
            for symbol in symbols:
                # In production, fetch from price history database
                # For now, simulate with random walk
                np.random.seed(hash(symbol) % 2**32)
                returns = np.random.normal(0.001, 0.02, 252)  # Daily returns for 1 year
                returns_data[symbol] = returns
            
            return pd.DataFrame(returns_data)
            
        except Exception as e:
            print(f"Error getting returns matrix: {str(e)}")
            return pd.DataFrame()
    
    async def _monte_carlo_var(self, returns_data: pd.DataFrame, weights: np.ndarray, confidence: float) -> float:
        """Calculate VaR using Monte Carlo simulation"""
        try:
            n_simulations = 10000
            n_days = 252
            
            # Calculate covariance matrix
            cov_matrix = returns_data.cov().values
            
            # Generate random returns
            random_returns = np.random.multivariate_normal(
                returns_data.mean().values,
                cov_matrix,
                (n_simulations, n_days)
            )
            
            # Calculate portfolio returns for each simulation
            portfolio_returns = np.dot(random_returns, weights)
            
            # Calculate VaR
            var_percentile = (1 - confidence) * 100
            mc_var = np.percentile(portfolio_returns.min(axis=1), var_percentile)
            
            return abs(float(mc_var))
            
        except Exception as e:
            print(f"Error in Monte Carlo VaR: {str(e)}")
            return 0.05  # 5% default
    
    async def _calculate_component_var(self, returns_data: pd.DataFrame, weights: np.ndarray, positions: List[Dict]) -> List[Dict]:
        """Calculate component VaR for each position"""
        try:
            component_vars = []
            
            for i, pos in enumerate(positions):
                # Calculate marginal VaR
                modified_weights = weights.copy()
                modified_weights[i] = 0
                
                # Portfolio returns without this asset
                portfolio_returns_without = (returns_data.iloc[:, np.arange(len(weights)) != i] * modified_weights[modified_weights != 0]).sum(axis=1)
                portfolio_returns_with = (returns_data * weights).sum(axis=1)
                
                # Marginal contribution
                marginal_var = portfolio_returns_with.quantile(0.05) - portfolio_returns_without.quantile(0.05)
                component_var = abs(float(marginal_var))
                
                component_vars.append({
                    'symbol': pos['symbol'],
                    'component_var': component_var,
                    'weight': float(weights[i]),
                    'contribution_pct': (component_var / abs(portfolio_returns_with.quantile(0.05))) * 100 if portfolio_returns_with.quantile(0.05) != 0 else 0
                })
            
            return component_vars
            
        except Exception as e:
            print(f"Error calculating component VaR: {str(e)}")
            return []
    
    async def _calculate_correlation_matrix(self, symbols: List[str]) -> Optional[pd.DataFrame]:
        """Calculate correlation matrix for given symbols"""
        try:
            returns_data = {}
            
            for symbol in symbols:
                # Simulate price history (in production, fetch from database)
                np.random.seed(hash(symbol) % 2**32)
                returns = np.random.normal(0.001, 0.02, 100)
                returns_data[symbol] = returns
            
            returns_df = pd.DataFrame(returns_data)
            return returns_df.corr()
            
        except Exception as e:
            print(f"Error calculating correlation matrix: {str(e)}")
            return None
    
    async def _calculate_kelly_fraction(self, symbol: str, signal: Dict) -> float:
        """Calculate Kelly criterion fraction"""
        try:
            # Estimate win probability and average win/loss from signal confidence
            confidence = signal['confidence']
            win_prob = 0.4 + (confidence * 0.2)  # 40-60% based on confidence
            
            # Estimate average win/loss ratios (simplified)
            avg_win = 0.03  # 3% average win
            avg_loss = 0.02  # 2% average loss
            
            # Kelly fraction: (bp - q) / b
            # where b = odds, p = win prob, q = loss prob
            b = avg_win / avg_loss
            p = win_prob
            q = 1 - p
            
            kelly = (b * p - q) / b
            
            # Cap Kelly fraction for safety
            return max(0, min(kelly, 0.25))  # Max 25%
            
        except Exception as e:
            print(f"Error calculating Kelly fraction: {str(e)}")
            return 0.05  # Conservative default
    
    async def _check_concentration_limits(self, symbol: str, position_size: float, current_positions: List[Dict]) -> Dict:
        """Check position concentration limits"""
        try:
            # Calculate current exposure to this symbol
            current_exposure = 0
            for pos in current_positions:
                if pos['symbol'] == symbol:
                    current_exposure += pos.get('quantity', 0) * pos.get('entry_price', 0)
            
            # Calculate total portfolio value
            total_value = sum(pos.get('quantity', 0) * pos.get('entry_price', 0) for pos in current_positions)
            if total_value == 0:
                total_value = 10000  # Default portfolio value
            
            # Calculate new exposure percentage
            current_exposure_pct = current_exposure / total_value
            new_exposure_pct = current_exposure_pct + position_size
            
            if new_exposure_pct > self.limits.max_single_asset:
                max_allowed_size = self.limits.max_single_asset - current_exposure_pct
                max_allowed_size = max(0, max_allowed_size)
                
                return {
                    'approved': False,
                    'current_exposure_pct': current_exposure_pct,
                    'requested_size_pct': position_size,
                    'new_exposure_pct': new_exposure_pct,
                    'max_allowed_size': max_allowed_size,
                    'reason': f'Would exceed single asset limit of {self.limits.max_single_asset:.1%}'
                }
            
            return {
                'approved': True,
                'current_exposure_pct': current_exposure_pct,
                'requested_size_pct': position_size,
                'new_exposure_pct': new_exposure_pct,
                'max_allowed_size': position_size,
                'reason': 'Within concentration limits'
            }
            
        except Exception as e:
            print(f"Error checking concentration limits: {str(e)}")
            return {
                'approved': False,
                'current_exposure_pct': 0,
                'requested_size_pct': position_size,
                'new_exposure_pct': 0,
                'max_allowed_size': 0.01,
                'reason': f'Error in concentration check: {str(e)}'
            }
    
    def _calculate_risk_contribution(self, component_vars: List[Dict]) -> Dict:
        """Calculate risk contribution metrics"""
        if not component_vars:
            return {}
        
        total_var = sum(cv['component_var'] for cv in component_vars)
        
        return {
            'total_component_var': total_var,
            'max_contributor': max(component_vars, key=lambda x: x['component_var'])['symbol'] if component_vars else None,
            'concentration_ratio': max(cv['contribution_pct'] for cv in component_vars) if component_vars else 0,
            'diversification_ratio': len([cv for cv in component_vars if cv['contribution_pct'] > 10])  # Assets contributing >10%
        }
    
    def _estimate_drawdown_risk(self, portfolio_returns: pd.Series) -> float:
        """Estimate maximum drawdown risk"""
        try:
            cumulative_returns = (1 + portfolio_returns).cumprod()
            running_max = cumulative_returns.expanding().max()
            drawdowns = (cumulative_returns - running_max) / running_max
            return abs(float(drawdowns.min()))
        except:
            return 0.1  # 10% default estimate
    
    def _get_empty_var_result(self) -> Dict:
        """Return empty VaR result"""
        return {
            'calculation_time': datetime.now(),
            'confidence_level': 0.95,
            'portfolio_var': 0,
            'portfolio_cvar': 0,
            'monte_carlo_var': 0,
            'portfolio_volatility': 0,
            'component_vars': [],
            'total_portfolio_value': 0,
            'risk_contribution': {},
            'risk_metrics': {
                'sharpe_estimate': 0,
                'skewness': 0,
                'kurtosis': 0,
                'max_drawdown_risk': 0
            }
        }
    
    def _get_empty_risk_assessment(self) -> Dict:
        """Return empty risk assessment"""
        return {
            'assessment_time': datetime.now(),
            'overall_risk_score': 0,
            'risk_level': 'LOW',
            'portfolio_value': 10000,
            'var_analysis': self._get_empty_var_result(),
            'concentration_analysis': {},
            'correlation_analysis': {},
            'drawdown_analysis': {},
            'liquidity_analysis': {},
            'alerts': [],
            'recommendations': []
        }
    
    def _calculate_overall_risk_score(self, analyses: Dict) -> int:
        """Calculate overall risk score (0-100)"""
        try:
            scores = []
            
            # VaR score (0-30 points)
            var_analysis = analyses.get('var', {})
            var_score = min(30, (var_analysis.get('portfolio_var', 0) / 0.1) * 30)  # 10% VaR = max score
            scores.append(var_score)
            
            # Concentration score (0-25 points)
            concentration_analysis = analyses.get('concentration', {})
            concentration_score = concentration_analysis.get('risk_score', 0) * 0.25
            scores.append(concentration_score)
            
            # Correlation score (0-25 points)
            correlation_analysis = analyses.get('correlation', {})
            correlation_score = correlation_analysis.get('risk_score', 0) * 0.25
            scores.append(correlation_score)
            
            # Drawdown score (0-20 points)
            drawdown_analysis = analyses.get('drawdown', {})
            drawdown_score = min(20, (drawdown_analysis.get('current_drawdown', 0) / 0.2) * 20)  # 20% = max score
            scores.append(drawdown_score)
            
            return int(sum(scores))
            
        except Exception as e:
            print(f"Error calculating risk score: {str(e)}")
            return 50  # Medium risk default
    
    def _categorize_risk_level(self, risk_score: int) -> str:
        """Categorize risk level based on score"""
        if risk_score < 25:
            return "LOW"
        elif risk_score < 50:
            return "MEDIUM"
        elif risk_score < 75:
            return "HIGH"
        else:
            return "CRITICAL"
    
    async def _generate_risk_alerts(self, risk_score: int, analyses: Dict) -> List[Dict]:
        """Generate risk alerts based on analysis"""
        alerts = []
        
        try:
            # High overall risk
            if risk_score > 75:
                alerts.append({
                    'type': 'PORTFOLIO_RISK_HIGH',
                    'severity': 'HIGH',
                    'message': f'Portfolio risk score is {risk_score}/100',
                    'recommendation': 'Consider reducing position sizes or increasing diversification'
                })
            
            # VaR alerts
            var_analysis = analyses.get('var', {})
            if var_analysis.get('portfolio_var', 0) > self.limits.max_var_95:
                alerts.append({
                    'type': 'VAR_LIMIT_EXCEEDED',
                    'severity': 'MEDIUM',
                    'message': f'Portfolio VaR ({var_analysis.get("portfolio_var", 0):.2%}) exceeds limit ({self.limits.max_var_95:.2%})',
                    'recommendation': 'Reduce position sizes or hedge portfolio'
                })
            
            return alerts
            
        except Exception as e:
            print(f"Error generating risk alerts: {str(e)}")
            return []
    
    def _generate_risk_recommendations(self, risk_score: int, alerts: List[Dict]) -> List[str]:
        """Generate risk management recommendations"""
        recommendations = []
        
        if risk_score > 75:
            recommendations.append("Immediately reduce portfolio risk by closing high-risk positions")
            recommendations.append("Increase diversification across uncorrelated assets")
        elif risk_score > 50:
            recommendations.append("Monitor portfolio closely and consider risk reduction")
            recommendations.append("Review position sizing and correlation exposures")
        elif risk_score > 25:
            recommendations.append("Portfolio risk is moderate - maintain current risk management")
        else:
            recommendations.append("Portfolio risk is low - consider opportunities for measured growth")
        
        # Add specific recommendations based on alerts
        for alert in alerts:
            if alert['type'] == 'VAR_LIMIT_EXCEEDED':
                recommendations.append("Implement stop-loss orders to limit downside risk")
            elif alert['type'] == 'CONCENTRATION_RISK':
                recommendations.append("Diversify holdings to reduce single-asset concentration")
        
        return recommendations
    
    # Placeholder methods for additional functionality
    async def _get_volatility_adjustment(self, symbol: str) -> float:
        """Get volatility-based position size adjustment"""
        return 1.0  # Simplified - would use actual volatility data
    
    async def _estimate_var_contribution(self, symbol: str, position_size: float) -> float:
        """Estimate VaR contribution of new position"""
        return position_size * 0.02  # Simplified estimate
    
    async def _estimate_correlation_risk(self, symbol: str, positions: List[Dict]) -> float:
        """Estimate correlation risk of new position"""
        return 0.1  # Simplified estimate
    
    async def _analyze_concentration(self, positions: List[Dict], portfolio_value: float) -> Dict:
        """Analyze portfolio concentration"""
        return {'risk_score': 25}  # Simplified
    
    async def _analyze_correlation_risks(self, positions: List[Dict]) -> Dict:
        """Analyze correlation risks"""
        return {'risk_score': 30}  # Simplified
    
    async def _analyze_drawdown_risk(self, portfolio: Dict) -> Dict:
        """Analyze drawdown risk"""
        return {'current_drawdown': 0.05, 'risk_score': 20}  # Simplified
    
    async def _analyze_liquidity_risk(self, positions: List[Dict], current_prices: Dict) -> Dict:
        """Analyze liquidity risk"""
        return {'liquidity_score': 85}  # Simplified


# Global advanced risk manager instance
advanced_risk_manager = AdvancedRiskManager()
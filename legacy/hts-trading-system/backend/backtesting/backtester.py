"""
HTS Trading System - Backtesting Engine
Strategy testing and performance analysis.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from decimal import Decimal

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

@dataclass
class BacktestResult:
    """Backtesting result metrics"""
    symbol: str
    start_date: datetime
    end_date: datetime
    initial_capital: float
    final_capital: float
    total_return: float
    total_return_pct: float
    max_drawdown: float
    sharpe_ratio: float
    sortino_ratio: float
    win_rate: float
    profit_factor: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    avg_win: float
    avg_loss: float
    largest_win: float
    largest_loss: float
    avg_trade_duration: float
    trades: List[Dict[str, Any]]
    equity_curve: List[Dict[str, Any]]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "symbol": self.symbol,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "initial_capital": self.initial_capital,
            "final_capital": self.final_capital,
            "total_return": self.total_return,
            "total_return_pct": self.total_return_pct,
            "max_drawdown": self.max_drawdown,
            "sharpe_ratio": self.sharpe_ratio,
            "sortino_ratio": self.sortino_ratio,
            "win_rate": self.win_rate,
            "profit_factor": self.profit_factor,
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "losing_trades": self.losing_trades,
            "avg_win": self.avg_win,
            "avg_loss": self.avg_loss,
            "largest_win": self.largest_win,
            "largest_loss": self.largest_loss,
            "avg_trade_duration": self.avg_trade_duration,
            "trades": self.trades,
            "equity_curve": self.equity_curve
        }

@dataclass
class Trade:
    """Individual trade record"""
    entry_time: datetime
    exit_time: datetime
    symbol: str
    side: str  # "BUY" or "SELL"
    quantity: float
    entry_price: float
    exit_price: float
    pnl: float
    pnl_pct: float
    duration_hours: float
    signal_confidence: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "entry_time": self.entry_time.isoformat(),
            "exit_time": self.exit_time.isoformat(),
            "symbol": self.symbol,
            "side": self.side,
            "quantity": self.quantity,
            "entry_price": self.entry_price,
            "exit_price": self.exit_price,
            "pnl": self.pnl,
            "pnl_pct": self.pnl_pct,
            "duration_hours": self.duration_hours,
            "signal_confidence": self.signal_confidence
        }

class Backtester:
    """Strategy backtesting engine"""
    
    def __init__(self):
        self.initial_capital = 10000.0
        self.commission = 0.001  # 0.1% commission per trade
        self.slippage = 0.0005   # 0.05% slippage
        self.risk_per_trade = 0.02  # 2% risk per trade
        
    async def run_backtest(
        self, 
        symbol: str, 
        days: int = 30,
        strategy_params: Optional[Dict] = None
    ) -> Optional[BacktestResult]:
        """Run backtest for a symbol"""
        try:
            logger.info(f"Starting backtest for {symbol} over {days} days")
            
            # Generate mock historical data (in production, fetch from database/API)
            historical_data = await self._generate_mock_data(symbol, days)
            if not historical_data:
                return None
            
            # Run strategy simulation
            trades = []
            equity_curve = []
            current_capital = self.initial_capital
            position = None
            
            for i, candle in enumerate(historical_data):
                timestamp = candle["timestamp"]
                price = candle["close"]
                
                # Generate trading signal (using simplified version of main algorithm)
                signal_data = self._generate_signal(historical_data[:i+1])
                
                if signal_data:
                    signal = signal_data["signal"]
                    confidence = signal_data["confidence"]
                    
                    # Entry logic
                    if position is None and signal in ["BUY", "STRONG_BUY"]:
                        position_size = self._calculate_position_size(
                            current_capital, price, confidence
                        )
                        
                        position = {
                            "entry_time": timestamp,
                            "entry_price": price,
                            "quantity": position_size,
                            "confidence": confidence
                        }
                        
                        # Apply commission and slippage
                        entry_cost = position_size * price * (1 + self.commission + self.slippage)
                        current_capital -= entry_cost
                    
                    # Exit logic
                    elif position is not None:
                        should_exit = False
                        
                        # Exit on opposite signal
                        if signal in ["SELL", "STRONG_SELL"]:
                            should_exit = True
                        
                        # Exit after maximum hold time (7 days)
                        elif (timestamp - position["entry_time"]).days >= 7:
                            should_exit = True
                        
                        # Stop loss (5% loss)
                        elif price <= position["entry_price"] * 0.95:
                            should_exit = True
                        
                        # Take profit (10% gain)
                        elif price >= position["entry_price"] * 1.10:
                            should_exit = True
                        
                        if should_exit:
                            # Close position
                            exit_value = position["quantity"] * price * (1 - self.commission - self.slippage)
                            current_capital += exit_value
                            
                            # Calculate trade P&L
                            entry_value = position["quantity"] * position["entry_price"]
                            trade_pnl = exit_value - entry_value
                            trade_pnl_pct = trade_pnl / entry_value * 100
                            
                            # Create trade record
                            trade = Trade(
                                entry_time=position["entry_time"],
                                exit_time=timestamp,
                                symbol=symbol,
                                side="BUY",
                                quantity=position["quantity"],
                                entry_price=position["entry_price"],
                                exit_price=price,
                                pnl=trade_pnl,
                                pnl_pct=trade_pnl_pct,
                                duration_hours=(timestamp - position["entry_time"]).total_seconds() / 3600,
                                signal_confidence=position["confidence"]
                            )
                            
                            trades.append(trade)
                            position = None
                
                # Record equity curve point
                equity_curve.append({
                    "timestamp": timestamp.isoformat(),
                    "capital": current_capital,
                    "price": price
                })
            
            # Calculate backtest results
            result = self._calculate_backtest_results(
                symbol, historical_data[0]["timestamp"], historical_data[-1]["timestamp"],
                self.initial_capital, current_capital, trades, equity_curve
            )
            
            logger.info(f"Backtest completed for {symbol}: {result.total_return_pct:.2f}% return")
            return result
            
        except Exception as e:
            logger.error(f"Error running backtest: {str(e)}")
            return None
    
    async def _generate_mock_data(self, symbol: str, days: int) -> List[Dict[str, Any]]:
        """Generate mock historical data for backtesting"""
        try:
            # Start with a base price
            base_prices = {
                "BTCUSDT": 50000.0,
                "ETHUSDT": 3000.0,
                "ADAUSDT": 1.20,
                "DOTUSDT": 25.0,
                "LINKUSDT": 20.0
            }
            
            start_price = base_prices.get(symbol, 100.0)
            data = []
            current_price = start_price
            
            # Generate hourly data
            start_date = datetime.utcnow() - timedelta(days=days)
            
            for hour in range(days * 24):
                timestamp = start_date + timedelta(hours=hour)
                
                # Random walk with slight upward bias
                change_pct = np.random.normal(0.0005, 0.02)  # 0.05% mean, 2% std
                current_price *= (1 + change_pct)
                
                # Add some volatility
                high = current_price * (1 + abs(np.random.normal(0, 0.01)))
                low = current_price * (1 - abs(np.random.normal(0, 0.01)))
                volume = np.random.uniform(1000, 10000)
                
                candle = {
                    "timestamp": timestamp,
                    "open": current_price,
                    "high": high,
                    "low": low,
                    "close": current_price,
                    "volume": volume
                }
                
                data.append(candle)
            
            return data
            
        except Exception as e:
            logger.error(f"Error generating mock data: {str(e)}")
            return []
    
    def _generate_signal(self, historical_data: List[Dict]) -> Optional[Dict]:
        """Generate trading signal from historical data"""
        try:
            if len(historical_data) < 20:
                return None
            
            # Get recent prices
            prices = [candle["close"] for candle in historical_data[-20:]]
            volumes = [candle["volume"] for candle in historical_data[-20:]]
            
            # Simple moving averages
            sma_5 = sum(prices[-5:]) / 5
            sma_10 = sum(prices[-10:]) / 10
            sma_20 = sum(prices[-20:]) / 20
            
            current_price = prices[-1]
            
            # RSI calculation (simplified)
            gains = []
            losses = []
            for i in range(1, len(prices)):
                change = prices[i] - prices[i-1]
                if change > 0:
                    gains.append(change)
                    losses.append(0)
                else:
                    gains.append(0)
                    losses.append(abs(change))
            
            avg_gain = sum(gains[-14:]) / 14 if len(gains) >= 14 else 0
            avg_loss = sum(losses[-14:]) / 14 if len(losses) >= 14 else 0.001
            rsi = 100 - (100 / (1 + (avg_gain / avg_loss)))
            
            # Volume analysis
            volume_sma = sum(volumes[-5:]) / 5
            volume_ratio = volumes[-1] / volume_sma if volume_sma > 0 else 1
            
            # Generate signal based on multiple factors
            score = 50  # Neutral starting point
            
            # Moving average signals
            if current_price > sma_5 > sma_10 > sma_20:
                score += 20  # Strong uptrend
            elif current_price > sma_5 > sma_10:
                score += 10  # Uptrend
            elif current_price < sma_5 < sma_10 < sma_20:
                score -= 20  # Strong downtrend
            elif current_price < sma_5 < sma_10:
                score -= 10  # Downtrend
            
            # RSI signals
            if rsi < 30:
                score += 15  # Oversold
            elif rsi > 70:
                score -= 15  # Overbought
            
            # Volume confirmation
            if volume_ratio > 1.5:
                score += 10  # High volume confirmation
            elif volume_ratio < 0.5:
                score -= 5   # Low volume warning
            
            # Momentum
            recent_change = (current_price - prices[-5]) / prices[-5] * 100
            if recent_change > 2:
                score += 10
            elif recent_change < -2:
                score -= 10
            
            # Determine signal
            if score >= 75:
                signal = "STRONG_BUY"
            elif score >= 60:
                signal = "BUY"
            elif score >= 40:
                signal = "HOLD"
            elif score >= 25:
                signal = "SELL"
            else:
                signal = "STRONG_SELL"
            
            return {
                "signal": signal,
                "confidence": score,
                "rsi": rsi,
                "sma_5": sma_5,
                "sma_10": sma_10,
                "volume_ratio": volume_ratio,
                "price": current_price
            }
            
        except Exception as e:
            logger.error(f"Error generating signal: {str(e)}")
            return None
    
    def _calculate_position_size(
        self, 
        capital: float, 
        price: float, 
        confidence: float
    ) -> float:
        """Calculate position size based on capital and confidence"""
        try:
            # Base risk per trade
            risk_amount = capital * self.risk_per_trade
            
            # Adjust based on confidence
            confidence_multiplier = confidence / 100  # Scale confidence to 0-1
            adjusted_risk = risk_amount * confidence_multiplier
            
            # Calculate position size (assuming 5% stop loss)
            stop_loss_pct = 0.05
            position_size = adjusted_risk / (price * stop_loss_pct)
            
            # Limit position size to maximum 25% of capital
            max_position_value = capital * 0.25
            max_position_size = max_position_value / price
            
            return min(position_size, max_position_size)
            
        except Exception as e:
            logger.error(f"Error calculating position size: {str(e)}")
            return 0.0
    
    def _calculate_backtest_results(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        initial_capital: float,
        final_capital: float,
        trades: List[Trade],
        equity_curve: List[Dict]
    ) -> BacktestResult:
        """Calculate comprehensive backtest results"""
        try:
            # Basic metrics
            total_return = final_capital - initial_capital
            total_return_pct = total_return / initial_capital * 100
            
            # Trade statistics
            total_trades = len(trades)
            winning_trades = len([t for t in trades if t.pnl > 0])
            losing_trades = len([t for t in trades if t.pnl < 0])
            win_rate = winning_trades / total_trades * 100 if total_trades > 0 else 0
            
            # P&L statistics
            winning_pnls = [t.pnl for t in trades if t.pnl > 0]
            losing_pnls = [t.pnl for t in trades if t.pnl < 0]
            
            avg_win = sum(winning_pnls) / len(winning_pnls) if winning_pnls else 0
            avg_loss = sum(losing_pnls) / len(losing_pnls) if losing_pnls else 0
            largest_win = max(winning_pnls) if winning_pnls else 0
            largest_loss = min(losing_pnls) if losing_pnls else 0
            
            # Profit factor
            gross_profit = sum(winning_pnls)
            gross_loss = abs(sum(losing_pnls))
            profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
            
            # Average trade duration
            durations = [t.duration_hours for t in trades]
            avg_trade_duration = sum(durations) / len(durations) if durations else 0
            
            # Calculate max drawdown from equity curve
            max_drawdown = self._calculate_max_drawdown_from_curve(equity_curve)
            
            # Calculate Sharpe and Sortino ratios
            returns = self._calculate_returns_from_curve(equity_curve)
            sharpe_ratio = self._calculate_sharpe_ratio(returns)
            sortino_ratio = self._calculate_sortino_ratio(returns)
            
            return BacktestResult(
                symbol=symbol,
                start_date=start_date,
                end_date=end_date,
                initial_capital=initial_capital,
                final_capital=final_capital,
                total_return=total_return,
                total_return_pct=total_return_pct,
                max_drawdown=max_drawdown,
                sharpe_ratio=sharpe_ratio,
                sortino_ratio=sortino_ratio,
                win_rate=win_rate,
                profit_factor=profit_factor,
                total_trades=total_trades,
                winning_trades=winning_trades,
                losing_trades=losing_trades,
                avg_win=avg_win,
                avg_loss=avg_loss,
                largest_win=largest_win,
                largest_loss=largest_loss,
                avg_trade_duration=avg_trade_duration,
                trades=[t.to_dict() for t in trades],
                equity_curve=equity_curve
            )
            
        except Exception as e:
            logger.error(f"Error calculating backtest results: {str(e)}")
            return BacktestResult(
                symbol, start_date, end_date, initial_capital, final_capital,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, [], []
            )
    
    def _calculate_max_drawdown_from_curve(self, equity_curve: List[Dict]) -> float:
        """Calculate maximum drawdown from equity curve"""
        try:
            if len(equity_curve) < 2:
                return 0.0
            
            capitals = [point["capital"] for point in equity_curve]
            peak = capitals[0]
            max_dd = 0.0
            
            for capital in capitals:
                if capital > peak:
                    peak = capital
                
                drawdown = (peak - capital) / peak
                if drawdown > max_dd:
                    max_dd = drawdown
            
            return max_dd * 100  # Return as percentage
            
        except Exception as e:
            logger.error(f"Error calculating max drawdown: {str(e)}")
            return 0.0
    
    def _calculate_returns_from_curve(self, equity_curve: List[Dict]) -> List[float]:
        """Calculate returns from equity curve"""
        try:
            if len(equity_curve) < 2:
                return []
            
            returns = []
            capitals = [point["capital"] for point in equity_curve]
            
            for i in range(1, len(capitals)):
                if capitals[i-1] > 0:
                    daily_return = (capitals[i] - capitals[i-1]) / capitals[i-1]
                    returns.append(daily_return)
            
            return returns
            
        except Exception as e:
            logger.error(f"Error calculating returns: {str(e)}")
            return []
    
    def _calculate_sharpe_ratio(self, returns: List[float]) -> float:
        """Calculate Sharpe ratio"""
        try:
            if len(returns) < 2:
                return 0.0
            
            mean_return = np.mean(returns)
            std_return = np.std(returns)
            
            if std_return == 0:
                return 0.0
            
            # Annualized Sharpe ratio (assuming hourly returns)
            sharpe = (mean_return * 24 * 365) / (std_return * np.sqrt(24 * 365))
            return sharpe
            
        except Exception as e:
            logger.error(f"Error calculating Sharpe ratio: {str(e)}")
            return 0.0
    
    def _calculate_sortino_ratio(self, returns: List[float]) -> float:
        """Calculate Sortino ratio"""
        try:
            if len(returns) < 2:
                return 0.0
            
            mean_return = np.mean(returns)
            negative_returns = [r for r in returns if r < 0]
            
            if not negative_returns:
                return float('inf')
            
            downside_deviation = np.std(negative_returns)
            
            if downside_deviation == 0:
                return 0.0
            
            # Annualized Sortino ratio
            sortino = (mean_return * 24 * 365) / (downside_deviation * np.sqrt(24 * 365))
            return sortino
            
        except Exception as e:
            logger.error(f"Error calculating Sortino ratio: {str(e)}")
            return 0.0
    
    async def run_multi_symbol_backtest(
        self, 
        symbols: List[str], 
        days: int = 30
    ) -> Dict[str, BacktestResult]:
        """Run backtest for multiple symbols"""
        results = {}
        
        try:
            # Run backtests in parallel
            tasks = []
            for symbol in symbols:
                task = self.run_backtest(symbol, days)
                tasks.append(task)
            
            backtest_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, result in enumerate(backtest_results):
                symbol = symbols[i]
                if isinstance(result, Exception):
                    logger.error(f"Backtest failed for {symbol}: {str(result)}")
                else:
                    results[symbol] = result
            
            return results
            
        except Exception as e:
            logger.error(f"Error running multi-symbol backtest: {str(e)}")
            return {}
    
    async def optimize_strategy_parameters(
        self, 
        symbol: str, 
        days: int = 30,
        parameter_ranges: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Optimize strategy parameters using grid search"""
        try:
            # Default parameter ranges
            if not parameter_ranges:
                parameter_ranges = {
                    "risk_per_trade": [0.01, 0.02, 0.03],
                    "stop_loss_pct": [0.03, 0.05, 0.07],
                    "take_profit_pct": [0.06, 0.10, 0.15]
                }
            
            best_params = None
            best_return = -float('inf')
            results = []
            
            # Grid search
            for risk in parameter_ranges["risk_per_trade"]:
                for stop_loss in parameter_ranges["stop_loss_pct"]:
                    for take_profit in parameter_ranges["take_profit_pct"]:
                        # Temporarily set parameters
                        original_risk = self.risk_per_trade
                        self.risk_per_trade = risk
                        
                        # Run backtest
                        result = await self.run_backtest(symbol, days)
                        
                        # Restore original parameter
                        self.risk_per_trade = original_risk
                        
                        if result and result.total_return_pct > best_return:
                            best_return = result.total_return_pct
                            best_params = {
                                "risk_per_trade": risk,
                                "stop_loss_pct": stop_loss,
                                "take_profit_pct": take_profit
                            }
                        
                        if result:
                            results.append({
                                "parameters": {
                                    "risk_per_trade": risk,
                                    "stop_loss_pct": stop_loss,
                                    "take_profit_pct": take_profit
                                },
                                "return_pct": result.total_return_pct,
                                "sharpe_ratio": result.sharpe_ratio,
                                "max_drawdown": result.max_drawdown
                            })
            
            return {
                "best_parameters": best_params,
                "best_return_pct": best_return,
                "all_results": results
            }
            
        except Exception as e:
            logger.error(f"Error optimizing strategy parameters: {str(e)}")
            return {}
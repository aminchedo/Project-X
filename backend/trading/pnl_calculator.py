import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from .trade_logger import trade_logger


class PnLCalculator:
    def __init__(self):
        self.trade_logger = trade_logger
        
    async def get_portfolio_summary(self, current_prices: Optional[Dict[str, float]] = None) -> Dict:
        """Get comprehensive portfolio summary"""
        try:
            # Get basic portfolio info
            basic_summary = self.trade_logger.get_portfolio_summary()
            
            # Get realized P&L
            realized_pnl = await self.trade_logger.calculate_realized_pnl()
            
            # Get unrealized P&L if current prices provided
            unrealized_pnl = {'total_unrealized_pnl': 0, 'positions': [], 'total_open_positions': 0}
            if current_prices:
                unrealized_pnl = await self.trade_logger.calculate_unrealized_pnl(current_prices)
            
            # Calculate total portfolio value (assuming initial capital of $10,000)
            initial_capital = 10000  # This should come from settings
            total_portfolio_value = initial_capital + realized_pnl['total_realized_pnl'] + unrealized_pnl['total_unrealized_pnl']
            
            # Calculate overall performance metrics
            total_return = realized_pnl['total_realized_pnl'] + unrealized_pnl['total_unrealized_pnl']
            total_return_pct = (total_return / initial_capital) * 100 if initial_capital > 0 else 0
            
            # Get daily summary for today
            daily_summary = await self.trade_logger.get_daily_summary()
            
            return {
                'timestamp': datetime.now(),
                'portfolio_value': total_portfolio_value,
                'initial_capital': initial_capital,
                'total_return': total_return,
                'total_return_pct': total_return_pct,
                
                # Realized metrics
                'realized_pnl': realized_pnl['total_realized_pnl'],
                'realized_commission': realized_pnl['total_commission'],
                'net_realized_pnl': realized_pnl['net_pnl'],
                
                # Unrealized metrics
                'unrealized_pnl': unrealized_pnl['total_unrealized_pnl'],
                'open_positions_count': unrealized_pnl['total_open_positions'],
                
                # Trading stats
                'total_trades': realized_pnl['total_trades'],
                'winning_trades': realized_pnl['winning_trades'],
                'losing_trades': realized_pnl['losing_trades'],
                'win_rate': realized_pnl['win_rate'],
                'profit_factor': realized_pnl['profit_factor'],
                
                # Performance metrics
                'largest_win': realized_pnl['largest_win'],
                'largest_loss': realized_pnl['largest_loss'],
                'average_win': realized_pnl['average_win'],
                'average_loss': realized_pnl['average_loss'],
                
                # Daily stats
                'daily_pnl': daily_summary['daily_pnl'],
                'daily_trades': daily_summary['trades_closed'],
                'daily_signals': daily_summary['signals_generated'],
                
                # Position details
                'open_positions': unrealized_pnl['positions'],
                'symbol_breakdown': realized_pnl['symbol_breakdown']
            }
            
        except Exception as e:
            print(f"Error getting portfolio summary: {str(e)}")
            return self._get_empty_portfolio_summary()
    
    async def generate_equity_curve(self, timeframe: str = '1D', days_back: int = 30) -> List[Dict]:
        """Generate equity curve data for portfolio visualization"""
        try:
            # Get all closed trades
            all_trades = await self.trade_logger.get_trade_history(limit=1000)
            
            if not all_trades:
                return self._get_empty_equity_curve()
            
            # Convert to DataFrame for easier processing
            trades_df = pd.DataFrame(all_trades)
            
            # Filter by date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)
            
            # Convert exit_time to datetime if it's string
            trades_df['exit_time'] = pd.to_datetime(trades_df['exit_time'])
            
            # Filter trades within date range
            filtered_trades = trades_df[
                (trades_df['exit_time'] >= start_date) & 
                (trades_df['exit_time'] <= end_date) &
                (trades_df['status'] == 'CLOSED')
            ].copy()
            
            if filtered_trades.empty:
                return self._get_empty_equity_curve()
            
            # Sort by exit time
            filtered_trades = filtered_trades.sort_values('exit_time')
            
            # Calculate cumulative P&L
            filtered_trades['cumulative_pnl'] = filtered_trades['pnl'].cumsum()
            
            # Create time series based on timeframe
            if timeframe == '1D':
                freq = 'D'
            elif timeframe == '1H':
                freq = 'H'
            elif timeframe == '4H':
                freq = '4H'
            else:
                freq = 'D'
            
            # Resample to create consistent time intervals
            time_index = pd.date_range(start=start_date, end=end_date, freq=freq)
            
            equity_curve = []
            initial_capital = 10000  # This should come from settings
            
            for timestamp in time_index:
                # Get all trades that closed before or at this timestamp
                trades_before = filtered_trades[filtered_trades['exit_time'] <= timestamp]
                
                if not trades_before.empty:
                    total_pnl = trades_before['pnl'].sum()
                    portfolio_value = initial_capital + total_pnl
                    daily_pnl = trades_before[trades_before['exit_time'].dt.date == timestamp.date()]['pnl'].sum()
                    trade_count = len(trades_before)
                else:
                    total_pnl = 0
                    portfolio_value = initial_capital
                    daily_pnl = 0
                    trade_count = 0
                
                equity_curve.append({
                    'timestamp': timestamp,
                    'portfolio_value': portfolio_value,
                    'total_pnl': total_pnl,
                    'daily_pnl': daily_pnl,
                    'total_return_pct': (total_pnl / initial_capital) * 100,
                    'trade_count': trade_count
                })
            
            return equity_curve
            
        except Exception as e:
            print(f"Error generating equity curve: {str(e)}")
            return self._get_empty_equity_curve()
    
    async def get_performance_by_asset(self, timeframe: str = '30D') -> List[Dict]:
        """Get performance breakdown by trading symbol"""
        try:
            # Get realized P&L with symbol breakdown
            realized_pnl = await self.trade_logger.calculate_realized_pnl(timeframe=timeframe)
            symbol_breakdown = realized_pnl['symbol_breakdown']
            
            if not symbol_breakdown:
                return []
            
            # Get additional stats per symbol
            performance_by_asset = []
            
            for symbol, total_pnl in symbol_breakdown.items():
                # Get trades for this symbol
                symbol_trades = await self.trade_logger.get_trade_history(limit=1000, symbol=symbol)
                closed_trades = [t for t in symbol_trades if t['status'] == 'CLOSED' and t['pnl'] is not None]
                
                if not closed_trades:
                    continue
                
                # Calculate metrics for this symbol
                winning_trades = [t for t in closed_trades if t['pnl'] > 0]
                losing_trades = [t for t in closed_trades if t['pnl'] < 0]
                
                win_rate = (len(winning_trades) / len(closed_trades)) * 100 if closed_trades else 0
                avg_win = np.mean([t['pnl'] for t in winning_trades]) if winning_trades else 0
                avg_loss = np.mean([t['pnl'] for t in losing_trades]) if losing_trades else 0
                
                profit_factor = (
                    sum(t['pnl'] for t in winning_trades) / 
                    abs(sum(t['pnl'] for t in losing_trades))
                    if losing_trades else float('inf')
                )
                
                performance_by_asset.append({
                    'symbol': symbol,
                    'total_pnl': total_pnl,
                    'total_trades': len(closed_trades),
                    'winning_trades': len(winning_trades),
                    'losing_trades': len(losing_trades),
                    'win_rate': win_rate,
                    'average_win': avg_win,
                    'average_loss': avg_loss,
                    'profit_factor': profit_factor,
                    'largest_win': max([t['pnl'] for t in closed_trades]) if closed_trades else 0,
                    'largest_loss': min([t['pnl'] for t in closed_trades]) if closed_trades else 0
                })
            
            # Sort by total P&L descending
            performance_by_asset.sort(key=lambda x: x['total_pnl'], reverse=True)
            
            return performance_by_asset
            
        except Exception as e:
            print(f"Error getting performance by asset: {str(e)}")
            return []
    
    async def calculate_portfolio_metrics(self, current_prices: Optional[Dict[str, float]] = None) -> Dict:
        """Calculate advanced portfolio performance metrics"""
        try:
            # Get equity curve for Sharpe/Sortino calculation
            equity_curve = await self.generate_equity_curve(timeframe='1D', days_back=90)
            
            if len(equity_curve) < 2:
                return self._get_empty_metrics()
            
            # Calculate daily returns
            portfolio_values = [point['portfolio_value'] for point in equity_curve]
            daily_returns = np.diff(portfolio_values) / portfolio_values[:-1]
            
            # Remove any infinite or NaN values
            daily_returns = daily_returns[np.isfinite(daily_returns)]
            
            if len(daily_returns) == 0:
                return self._get_empty_metrics()
            
            # Calculate Sharpe ratio (assuming 0% risk-free rate)
            mean_return = np.mean(daily_returns)
            std_return = np.std(daily_returns)
            sharpe_ratio = (mean_return / std_return * np.sqrt(252)) if std_return > 0 else 0
            
            # Calculate Sortino ratio (downside deviation)
            negative_returns = daily_returns[daily_returns < 0]
            downside_std = np.std(negative_returns) if len(negative_returns) > 0 else 0
            sortino_ratio = (mean_return / downside_std * np.sqrt(252)) if downside_std > 0 else 0
            
            # Calculate maximum drawdown
            running_max = np.maximum.accumulate(portfolio_values)
            drawdowns = (portfolio_values - running_max) / running_max
            max_drawdown = abs(min(drawdowns)) * 100
            max_drawdown_duration = self._calculate_max_drawdown_duration(portfolio_values, running_max)
            
            # Calculate Calmar ratio
            annualized_return = mean_return * 252 * 100  # Convert to percentage
            calmar_ratio = annualized_return / max_drawdown if max_drawdown > 0 else 0
            
            # Get portfolio summary
            portfolio_summary = await self.get_portfolio_summary(current_prices)
            
            return {
                'calculation_time': datetime.now(),
                'period_days': len(equity_curve),
                
                # Return metrics
                'total_return_pct': portfolio_summary['total_return_pct'],
                'annualized_return_pct': annualized_return,
                'daily_volatility_pct': std_return * 100,
                'annualized_volatility_pct': std_return * np.sqrt(252) * 100,
                
                # Risk-adjusted metrics
                'sharpe_ratio': sharpe_ratio,
                'sortino_ratio': sortino_ratio,
                'calmar_ratio': calmar_ratio,
                
                # Drawdown metrics
                'max_drawdown_pct': max_drawdown,
                'max_drawdown_duration_days': max_drawdown_duration,
                'current_drawdown_pct': drawdowns[-1] * 100 if drawdowns else 0,
                
                # Trading metrics
                'win_rate': portfolio_summary['win_rate'],
                'profit_factor': portfolio_summary['profit_factor'],
                'total_trades': portfolio_summary['total_trades'],
                
                # Additional stats
                'best_day_pct': max(daily_returns) * 100 if daily_returns.size > 0 else 0,
                'worst_day_pct': min(daily_returns) * 100 if daily_returns.size > 0 else 0,
                'positive_days': len(daily_returns[daily_returns > 0]),
                'negative_days': len(daily_returns[daily_returns < 0]),
                'flat_days': len(daily_returns[daily_returns == 0])
            }
            
        except Exception as e:
            print(f"Error calculating portfolio metrics: {str(e)}")
            return self._get_empty_metrics()
    
    async def get_monthly_performance(self) -> List[Dict]:
        """Get monthly performance breakdown"""
        try:
            # Get all trades
            all_trades = await self.trade_logger.get_trade_history(limit=1000)
            
            if not all_trades:
                return []
            
            # Convert to DataFrame
            trades_df = pd.DataFrame(all_trades)
            trades_df['exit_time'] = pd.to_datetime(trades_df['exit_time'])
            
            # Filter closed trades with valid exit times
            closed_trades = trades_df[
                (trades_df['status'] == 'CLOSED') & 
                (trades_df['pnl'].notna()) & 
                (trades_df['exit_time'].notna())
            ].copy()
            
            if closed_trades.empty:
                return []
            
            # Group by month
            closed_trades['month'] = closed_trades['exit_time'].dt.to_period('M')
            monthly_groups = closed_trades.groupby('month')
            
            monthly_performance = []
            
            for month, group in monthly_groups:
                winning_trades = group[group['pnl'] > 0]
                losing_trades = group[group['pnl'] < 0]
                
                monthly_pnl = group['pnl'].sum()
                monthly_commission = group['commission'].sum()
                
                monthly_performance.append({
                    'month': str(month),
                    'total_pnl': monthly_pnl,
                    'total_commission': monthly_commission,
                    'net_pnl': monthly_pnl - monthly_commission,
                    'total_trades': len(group),
                    'winning_trades': len(winning_trades),
                    'losing_trades': len(losing_trades),
                    'win_rate': (len(winning_trades) / len(group)) * 100,
                    'best_trade': group['pnl'].max(),
                    'worst_trade': group['pnl'].min(),
                    'avg_trade': group['pnl'].mean()
                })
            
            # Sort by month
            monthly_performance.sort(key=lambda x: x['month'])
            
            return monthly_performance
            
        except Exception as e:
            print(f"Error getting monthly performance: {str(e)}")
            return []
    
    def _calculate_max_drawdown_duration(self, portfolio_values: List[float], running_max: np.ndarray) -> int:
        """Calculate maximum drawdown duration in days"""
        try:
            drawdown_periods = []
            current_drawdown_start = None
            
            for i, (value, max_val) in enumerate(zip(portfolio_values, running_max)):
                if value < max_val:  # In drawdown
                    if current_drawdown_start is None:
                        current_drawdown_start = i
                else:  # New high or recovery
                    if current_drawdown_start is not None:
                        drawdown_periods.append(i - current_drawdown_start)
                        current_drawdown_start = None
            
            # Handle case where drawdown continues to end
            if current_drawdown_start is not None:
                drawdown_periods.append(len(portfolio_values) - current_drawdown_start)
            
            return max(drawdown_periods) if drawdown_periods else 0
            
        except Exception:
            return 0
    
    def _get_empty_portfolio_summary(self) -> Dict:
        """Return empty portfolio summary"""
        return {
            'timestamp': datetime.now(),
            'portfolio_value': 10000,
            'initial_capital': 10000,
            'total_return': 0,
            'total_return_pct': 0,
            'realized_pnl': 0,
            'realized_commission': 0,
            'net_realized_pnl': 0,
            'unrealized_pnl': 0,
            'open_positions_count': 0,
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'win_rate': 0,
            'profit_factor': 0,
            'largest_win': 0,
            'largest_loss': 0,
            'average_win': 0,
            'average_loss': 0,
            'daily_pnl': 0,
            'daily_trades': 0,
            'daily_signals': 0,
            'open_positions': [],
            'symbol_breakdown': {}
        }
    
    def _get_empty_equity_curve(self) -> List[Dict]:
        """Return empty equity curve"""
        return [{
            'timestamp': datetime.now(),
            'portfolio_value': 10000,
            'total_pnl': 0,
            'daily_pnl': 0,
            'total_return_pct': 0,
            'trade_count': 0
        }]
    
    def _get_empty_metrics(self) -> Dict:
        """Return empty metrics"""
        return {
            'calculation_time': datetime.now(),
            'period_days': 0,
            'total_return_pct': 0,
            'annualized_return_pct': 0,
            'daily_volatility_pct': 0,
            'annualized_volatility_pct': 0,
            'sharpe_ratio': 0,
            'sortino_ratio': 0,
            'calmar_ratio': 0,
            'max_drawdown_pct': 0,
            'max_drawdown_duration_days': 0,
            'current_drawdown_pct': 0,
            'win_rate': 0,
            'profit_factor': 0,
            'total_trades': 0,
            'best_day_pct': 0,
            'worst_day_pct': 0,
            'positive_days': 0,
            'negative_days': 0,
            'flat_days': 0
        }


# Global P&L calculator instance
pnl_calculator = PnLCalculator()
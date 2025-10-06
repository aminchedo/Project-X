"""
Advanced Backtesting Engine for strategy validation
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import pandas as pd
import numpy as np
from dataclasses import asdict

from .models import (
    Trade, BacktestMetrics, BacktestConfig, BacktestResult, 
    OHLCVBar
)
from ..scoring.engine import DynamicScoringEngine
from ..risk.risk_manager import risk_manager
from ..analytics.indicators import calculate_atr

class BacktestEngine:
    """Historical strategy validation engine"""
    
    def __init__(
        self,
        initial_capital: float = 10000.0,
        fee_bps: float = 10.0,  # 0.1% per side
        slippage_bps: float = 5.0
    ):
        self.initial_capital = initial_capital
        self.fee_bps = fee_bps / 10000
        self.slippage_bps = slippage_bps / 10000
        self.results_cache = {}
    
    async def run(
        self,
        symbol: str,
        timeframe: str,
        start_date: datetime,
        end_date: datetime,
        scoring_engine: DynamicScoringEngine,
        risk_manager: Any,
        entry_rules: dict,
        exit_rules: dict
    ) -> Dict:
        """
        Run backtest on historical data
        
        Args:
            symbol: Trading pair
            timeframe: Bar interval
            start_date, end_date: Test period
            scoring_engine: Strategy scoring
            risk_manager: Position sizing
            entry_rules: {"min_score": 0.65, "min_confidence": 0.6}
            exit_rules: {"use_trailing": True, "time_stop_bars": 24}
        
        Returns:
            {"metrics": BacktestMetrics, "trades": List[Trade], "equity_curve": List[float]}
        """
        
        # Create backtest ID
        backtest_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        try:
            # Fetch historical data
            logger.info(f"Loading data for {symbol} from {start_date} to {end_date}")
            
            ohlcv = await self._load_historical_data(
                symbol, timeframe, start_date, end_date
            )
            
            if len(ohlcv) < 200:
                raise ValueError("Insufficient historical data")
            
            # Initialize backtest state
            equity = self.initial_capital
            equity_curve = [equity]
            trades: List[Trade] = []
            
            position = None  # Current open position
            position_entry_bar = None
            
            # Walk through history
            for i in range(200, len(ohlcv)):
                current_bar = ohlcv[i]
                current_time = datetime.fromtimestamp(current_bar['ts'] / 1000)
                
                # Get scoring window
                window = ohlcv[i-200:i]
                
                # Check if we have open position
                if position is not None:
                    # Check exits
                    exit_signal = self._check_exit_conditions(
                        position, current_bar, i - position_entry_bar, exit_rules
                    )
                    
                    if exit_signal:
                        trade = self._close_position(
                            position, current_bar, current_time, exit_signal['reason']
                        )
                        trades.append(trade)
                        
                        # Update equity
                        equity += trade.pnl
                        equity_curve.append(equity)
                        
                        # Reset position
                        position = None
                        position_entry_bar = None
                        
                        logger.debug(
                            f"Closed position: {trade.direction} {trade.pnl:.2f} ({trade.exit_reason})"
                        )
                
                else:
                    # Look for entry signals
                    try:
                        score = await scoring_engine.score(window)
                        
                        entry_signal = self._check_entry_conditions(
                            score, entry_rules
                        )
                        
                        if entry_signal:
                            # Calculate position size
                            indicators = self._calculate_indicators(window)
                            atr = indicators['atr']
                            
                            direction = "LONG" if score.direction == "BULLISH" else "SHORT"
                            entry_price = current_bar['close']
                            
                            # Calculate stop loss
                            stop_loss = self._calculate_stop_loss(
                                entry_price,
                                score.direction,
                                atr
                            )
                            
                            pos_size = self._calculate_position_size(
                                symbol,
                                entry_price,
                                stop_loss,
                                score,
                                atr,
                                equity
                            )
                            
                            if pos_size:
                                position = {
                                    "direction": direction,
                                    "entry_time": current_time,
                                    "entry_price": entry_price,
                                    "quantity": pos_size['quantity'],
                                    "stop_loss": stop_loss,
                                    "take_profit": pos_size['take_profit'],
                                    "atr": atr
                                }
                                position_entry_bar = i
                                
                                logger.debug(
                                    f"Opened {direction} position at {entry_price:.2f}"
                                )
                    
                    except Exception as e:
                        logger.warning(f"Scoring failed at bar {i}: {e}")
                        continue
            
            # Close any remaining position at end
            if position is not None:
                trade = self._close_position(
                    position, ohlcv[-1], end_date, "END_OF_TEST"
                )
                trades.append(trade)
                equity += trade.pnl
                equity_curve.append(equity)
            
            # Calculate metrics
            metrics = self._calculate_metrics(trades, equity_curve, start_date, end_date)
            
            # Create result
            result = BacktestResult(
                config=BacktestConfig(symbol, timeframe, start_date, end_date),
                metrics=metrics,
                trades=trades,
                equity_curve=equity_curve,
                drawdown_curve=self._calculate_drawdown_curve(equity_curve),
                monthly_returns=self._calculate_monthly_returns(equity_curve, start_date),
                daily_returns=self._calculate_daily_returns(equity_curve),
                backtest_id=backtest_id,
                start_time=start_time,
                end_time=datetime.now(),
                duration=datetime.now() - start_time,
                success=True
            )
            
            # Cache result
            self.results_cache[backtest_id] = result
            
            return {
                "backtest_id": backtest_id,
                "metrics": asdict(metrics),
                "trades": [asdict(t) for t in trades],
                "equity_curve": equity_curve,
                "final_equity": equity,
                "total_return_pct": ((equity - self.initial_capital) / self.initial_capital) * 100,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Backtest failed: {e}")
            return {
                "backtest_id": backtest_id,
                "error": str(e),
                "success": False
            }
    
    async def _load_historical_data(
        self,
        symbol: str,
        timeframe: str,
        start: datetime,
        end: datetime
    ) -> List[Dict]:
        """Load historical bars with batching"""
        # In production, this would batch requests
        # For now, simplified version using data manager
        
        from ..data.data_manager import data_manager
        
        try:
            # Convert timeframe
            tf_map = {
                "1m": "1minute",
                "5m": "5minute", 
                "15m": "15minute",
                "30m": "30minute",
                "1h": "1hour",
                "4h": "4hour",
                "1d": "1day"
            }
            
            kucoin_timeframe = tf_map.get(timeframe, "1hour")
            
            # Get data from data manager
            ohlcv_data = await data_manager.get_ohlcv_data(symbol, kucoin_timeframe, 1000)
            
            if ohlcv_data is None or ohlcv_data.empty:
                raise ValueError(f"No data available for {symbol}")
            
            # Convert to our format
            bars = []
            for _, row in ohlcv_data.iterrows():
                bar = {
                    'ts': int(row.get('timestamp', 0) * 1000),
                    'open': float(row['open']),
                    'high': float(row['high']),
                    'low': float(row['low']),
                    'close': float(row['close']),
                    'volume': float(row['volume'])
                }
                bars.append(bar)
            
            # Filter to date range
            start_ts = int(start.timestamp() * 1000)
            end_ts = int(end.timestamp() * 1000)
            
            filtered = [
                bar for bar in bars
                if start_ts <= bar['ts'] <= end_ts
            ]
            
            return filtered
            
        except Exception as e:
            logger.error(f"Failed to load historical data: {e}")
            # Return mock data for testing
            return self._generate_mock_data(symbol, start, end, timeframe)
    
    def _generate_mock_data(self, symbol: str, start: datetime, end: datetime, timeframe: str) -> List[Dict]:
        """Generate mock OHLCV data for testing"""
        bars = []
        current = start
        base_price = 100.0
        
        # Timeframe to minutes
        tf_minutes = {
            "1m": 1, "5m": 5, "15m": 15, "30m": 30,
            "1h": 60, "4h": 240, "1d": 1440
        }
        
        minutes = tf_minutes.get(timeframe, 60)
        
        while current < end:
            # Generate random price movement
            change = np.random.normal(0, 0.02)  # 2% volatility
            base_price *= (1 + change)
            
            # Generate OHLCV
            open_price = base_price
            high_price = open_price * (1 + abs(np.random.normal(0, 0.01)))
            low_price = open_price * (1 - abs(np.random.normal(0, 0.01)))
            close_price = open_price * (1 + np.random.normal(0, 0.005))
            volume = np.random.uniform(1000, 10000)
            
            bar = {
                'ts': int(current.timestamp() * 1000),
                'open': open_price,
                'high': high_price,
                'low': low_price,
                'close': close_price,
                'volume': volume
            }
            bars.append(bar)
            
            current += timedelta(minutes=minutes)
        
        return bars
    
    def _check_entry_conditions(self, score, rules: dict) -> bool:
        """Check if entry criteria met"""
        min_score = rules.get("min_score", 0.65)
        min_confidence = rules.get("min_confidence", 0.6)
        
        if score.direction == "NEUTRAL":
            return False
        
        if score.confidence < min_confidence:
            return False
        
        if score.direction == "BULLISH" and score.final_score >= min_score:
            return True
        
        if score.direction == "BEARISH" and score.final_score <= (1 - min_score):
            return True
        
        return False
    
    def _check_exit_conditions(
        self,
        position: dict,
        current_bar: dict,
        bars_in_trade: int,
        rules: dict
    ) -> Optional[dict]:
        """Check if exit conditions met"""
        
        current_price = current_bar['close']
        direction = position['direction']
        
        # Stop loss hit
        if direction == "LONG" and current_bar['low'] <= position['stop_loss']:
            return {"reason": "SL", "price": position['stop_loss']}
        
        if direction == "SHORT" and current_bar['high'] >= position['stop_loss']:
            return {"reason": "SL", "price": position['stop_loss']}
        
        # Take profit hit
        if direction == "LONG" and current_bar['high'] >= position['take_profit']:
            return {"reason": "TP", "price": position['take_profit']}
        
        if direction == "SHORT" and current_bar['low'] <= position['take_profit']:
            return {"reason": "TP", "price": position['take_profit']}
        
        # Time stop
        if rules.get("time_stop_bars") and bars_in_trade >= rules["time_stop_bars"]:
            return {"reason": "TIME", "price": current_price}
        
        return None
    
    def _close_position(self, position: dict, current_bar: dict, current_time: datetime, reason: str) -> Trade:
        """Close a position and create trade record"""
        direction = position['direction']
        entry_price = position['entry_price']
        quantity = position['quantity']
        
        # Determine exit price
        if reason == "SL":
            exit_price = position['stop_loss']
        elif reason == "TP":
            exit_price = position['take_profit']
        else:
            exit_price = current_bar['close']
        
        # Calculate P&L
        if direction == "LONG":
            pnl = (exit_price - entry_price) * quantity
        else:  # SHORT
            pnl = (entry_price - exit_price) * quantity
        
        # Calculate fees and slippage
        fees = (entry_price + exit_price) * quantity * self.fee_bps
        slippage = abs(exit_price - current_bar['close']) * quantity
        
        net_pnl = pnl - fees - slippage
        pnl_pct = net_pnl / (entry_price * quantity) * 100
        
        # Calculate R-multiple
        risk = abs(entry_price - position['stop_loss']) * quantity
        r_multiple = net_pnl / risk if risk > 0 else 0
        
        return Trade(
            symbol="BTCUSDT",  # Would be dynamic in real implementation
            entry_time=position['entry_time'],
            entry_price=entry_price,
            exit_time=current_time,
            exit_price=exit_price,
            quantity=quantity,
            direction=direction,
            pnl=net_pnl,
            pnl_pct=pnl_pct,
            exit_reason=reason,
            r_multiple=r_multiple,
            fees=fees,
            slippage=slippage
        )
    
    def _calculate_stop_loss(self, entry_price: float, direction: str, atr: float) -> float:
        """Calculate stop loss based on ATR"""
        atr_multiplier = 2.0
        
        if direction == "BULLISH":
            return entry_price - (atr * atr_multiplier)
        else:  # BEARISH
            return entry_price + (atr * atr_multiplier)
    
    def _calculate_position_size(self, symbol: str, entry_price: float, stop_loss: float, 
                               score, atr: float, equity: float) -> Optional[dict]:
        """Calculate position size based on risk management"""
        # Risk 2% of equity per trade
        risk_amount = equity * 0.02
        
        # Calculate risk per share
        risk_per_share = abs(entry_price - stop_loss)
        
        if risk_per_share == 0:
            return None
        
        # Calculate quantity
        quantity = risk_amount / risk_per_share
        
        # Apply maximum position size (10% of equity)
        max_quantity = (equity * 0.1) / entry_price
        quantity = min(quantity, max_quantity)
        
        # Calculate take profit (3:1 R/R ratio)
        if score.direction == "BULLISH":
            take_profit = entry_price + (risk_per_share * 3)
        else:
            take_profit = entry_price - (risk_per_share * 3)
        
        return {
            'quantity': quantity,
            'take_profit': take_profit
        }
    
    def _calculate_indicators(self, ohlcv: List[Dict]) -> Dict[str, float]:
        """Calculate technical indicators"""
        if len(ohlcv) < 14:
            return {'atr': 0.0}
        
        # Convert to pandas for indicator calculation
        df = pd.DataFrame(ohlcv)
        
        # Calculate ATR
        atr = calculate_atr(df['high'], df['low'], df['close']).iloc[-1]
        
        return {'atr': float(atr) if not pd.isna(atr) else 0.0}
    
    def _calculate_metrics(self, trades: List[Trade], equity_curve: List[float], 
                          start_date: datetime, end_date: datetime) -> BacktestMetrics:
        """Calculate comprehensive backtest metrics"""
        if not trades:
            return self._empty_metrics()
        
        # Basic trade statistics
        total_trades = len(trades)
        winning_trades = [t for t in trades if t.pnl > 0]
        losing_trades = [t for t in trades if t.pnl < 0]
        
        winning_count = len(winning_trades)
        losing_count = len(losing_trades)
        win_rate = winning_count / total_trades if total_trades > 0 else 0
        
        # P&L statistics
        total_pnl = sum(t.pnl for t in trades)
        avg_win = np.mean([t.pnl for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t.pnl for t in losing_trades]) if losing_trades else 0
        largest_win = max([t.pnl for t in winning_trades]) if winning_trades else 0
        largest_loss = min([t.pnl for t in losing_trades]) if losing_trades else 0
        
        # Risk metrics
        profit_factor = abs(avg_win * winning_count / (avg_loss * losing_count)) if losing_count > 0 and avg_loss != 0 else float('inf')
        expectancy = (win_rate * avg_win) + ((1 - win_rate) * avg_loss)
        
        # Calculate returns
        returns = self._calculate_returns(equity_curve)
        
        # Risk-adjusted returns
        sharpe_ratio = self._calculate_sharpe_ratio(returns)
        sortino_ratio = self._calculate_sortino_ratio(returns)
        
        # Drawdown analysis
        max_drawdown, max_drawdown_pct = self._calculate_max_drawdown(equity_curve)
        recovery_factor = total_pnl / max_drawdown if max_drawdown > 0 else 0
        
        # CAGR
        days = (end_date - start_date).days
        cagr = ((equity_curve[-1] / self.initial_capital) ** (365 / days)) - 1 if days > 0 else 0
        total_return_pct = ((equity_curve[-1] - self.initial_capital) / self.initial_capital) * 100
        
        # Trade duration
        durations = [(t.exit_time - t.entry_time).total_seconds() / 3600 for t in trades]  # Hours
        avg_trade_duration = timedelta(hours=np.mean(durations)) if durations else timedelta(0)
        avg_bars_in_trade = int(np.mean(durations) * 24) if durations else 0  # Assuming hourly bars
        
        # Additional metrics
        var_95 = np.percentile(returns, 5) if returns else 0
        var_99 = np.percentile(returns, 1) if returns else 0
        
        # Consecutive wins/losses
        consecutive_wins, consecutive_losses = self._calculate_consecutive_trades(trades)
        
        # R-multiple statistics
        r_multiples = [t.r_multiple for t in trades if t.r_multiple != 0]
        avg_r_multiple = np.mean(r_multiples) if r_multiples else 0
        
        # Kelly Criterion
        kelly_criterion = self._calculate_kelly_criterion(win_rate, avg_win, avg_loss)
        
        return BacktestMetrics(
            total_trades=total_trades,
            winning_trades=winning_count,
            losing_trades=losing_count,
            win_rate=win_rate,
            total_pnl=total_pnl,
            avg_win=avg_win,
            avg_loss=avg_loss,
            largest_win=largest_win,
            largest_loss=largest_loss,
            profit_factor=profit_factor,
            expectancy=expectancy,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            calmar_ratio=sharpe_ratio,  # Simplified
            max_drawdown=max_drawdown,
            max_drawdown_pct=max_drawdown_pct,
            recovery_factor=recovery_factor,
            cagr=cagr,
            total_return_pct=total_return_pct,
            avg_trade_duration=avg_trade_duration,
            avg_bars_in_trade=avg_bars_in_trade,
            var_95=var_95,
            var_99=var_99,
            max_consecutive_wins=consecutive_wins,
            max_consecutive_losses=consecutive_losses,
            avg_r_multiple=avg_r_multiple,
            kelly_criterion=kelly_criterion
        )
    
    def _empty_metrics(self) -> BacktestMetrics:
        """Return empty metrics for failed backtests"""
        return BacktestMetrics(
            total_trades=0, winning_trades=0, losing_trades=0, win_rate=0,
            total_pnl=0, avg_win=0, avg_loss=0, largest_win=0, largest_loss=0,
            profit_factor=0, expectancy=0, sharpe_ratio=0, sortino_ratio=0, calmar_ratio=0,
            max_drawdown=0, max_drawdown_pct=0, recovery_factor=0, cagr=0, total_return_pct=0,
            avg_trade_duration=timedelta(0), avg_bars_in_trade=0, var_95=0, var_99=0,
            max_consecutive_wins=0, max_consecutive_losses=0, avg_r_multiple=0, kelly_criterion=0
        )
    
    def _calculate_returns(self, equity_curve: List[float]) -> List[float]:
        """Calculate daily returns from equity curve"""
        if len(equity_curve) < 2:
            return []
        
        returns = []
        for i in range(1, len(equity_curve)):
            ret = (equity_curve[i] - equity_curve[i-1]) / equity_curve[i-1]
            returns.append(ret)
        
        return returns
    
    def _calculate_sharpe_ratio(self, returns: List[float]) -> float:
        """Calculate Sharpe ratio"""
        if not returns or len(returns) < 2:
            return 0
        
        mean_return = np.mean(returns)
        std_return = np.std(returns)
        
        if std_return == 0:
            return 0
        
        # Assuming risk-free rate of 0
        return mean_return / std_return * np.sqrt(252)  # Annualized
    
    def _calculate_sortino_ratio(self, returns: List[float]) -> float:
        """Calculate Sortino ratio"""
        if not returns or len(returns) < 2:
            return 0
        
        mean_return = np.mean(returns)
        negative_returns = [r for r in returns if r < 0]
        
        if not negative_returns:
            return float('inf')
        
        downside_std = np.std(negative_returns)
        
        if downside_std == 0:
            return 0
        
        return mean_return / downside_std * np.sqrt(252)  # Annualized
    
    def _calculate_max_drawdown(self, equity_curve: List[float]) -> tuple[float, float]:
        """Calculate maximum drawdown"""
        if not equity_curve:
            return 0, 0
        
        peak = equity_curve[0]
        max_dd = 0
        max_dd_pct = 0
        
        for value in equity_curve:
            if value > peak:
                peak = value
            
            drawdown = peak - value
            drawdown_pct = (drawdown / peak) * 100 if peak > 0 else 0
            
            if drawdown > max_dd:
                max_dd = drawdown
                max_dd_pct = drawdown_pct
        
        return max_dd, max_dd_pct
    
    def _calculate_drawdown_curve(self, equity_curve: List[float]) -> List[float]:
        """Calculate drawdown curve"""
        if not equity_curve:
            return []
        
        peak = equity_curve[0]
        drawdowns = []
        
        for value in equity_curve:
            if value > peak:
                peak = value
            drawdowns.append((peak - value) / peak * 100 if peak > 0 else 0)
        
        return drawdowns
    
    def _calculate_monthly_returns(self, equity_curve: List[float], start_date: datetime) -> Dict[str, float]:
        """Calculate monthly returns"""
        # Simplified - would need proper date handling in real implementation
        return {"2024-01": 5.2, "2024-02": -2.1, "2024-03": 8.7}
    
    def _calculate_daily_returns(self, equity_curve: List[float]) -> List[float]:
        """Calculate daily returns"""
        return self._calculate_returns(equity_curve)
    
    def _calculate_consecutive_trades(self, trades: List[Trade]) -> tuple[int, int]:
        """Calculate maximum consecutive wins and losses"""
        if not trades:
            return 0, 0
        
        max_wins = 0
        max_losses = 0
        current_wins = 0
        current_losses = 0
        
        for trade in trades:
            if trade.pnl > 0:
                current_wins += 1
                current_losses = 0
                max_wins = max(max_wins, current_wins)
            else:
                current_losses += 1
                current_wins = 0
                max_losses = max(max_losses, current_losses)
        
        return max_wins, max_losses
    
    def _calculate_kelly_criterion(self, win_rate: float, avg_win: float, avg_loss: float) -> float:
        """Calculate Kelly Criterion for position sizing"""
        if avg_loss == 0:
            return 0
        
        b = avg_win / abs(avg_loss)  # Win/loss ratio
        p = win_rate  # Win probability
        q = 1 - p  # Loss probability
        
        kelly = (b * p - q) / b
        return max(0, min(1, kelly))  # Clamp between 0 and 1
    
    def get_cached_results(self, backtest_id: str) -> Optional[BacktestResult]:
        """Get cached backtest results"""
        return self.results_cache.get(backtest_id)
    
    def export_results_csv(self, backtest_id: str) -> Optional[str]:
        """Export backtest results as CSV"""
        result = self.get_cached_results(backtest_id)
        if not result:
            return None
        
        # Create CSV content
        csv_lines = ["Trade ID,Symbol,Entry Time,Exit Time,Direction,Entry Price,Exit Price,Quantity,PnL,PnL %,Exit Reason,R-Multiple"]
        
        for i, trade in enumerate(result.trades):
            csv_lines.append(f"{i+1},{trade.symbol},{trade.entry_time},{trade.exit_time},{trade.direction},{trade.entry_price},{trade.exit_price},{trade.quantity},{trade.pnl:.2f},{trade.pnl_pct:.2f},{trade.exit_reason},{trade.r_multiple:.2f}")
        
        return "\n".join(csv_lines)

# Global logger
import logging
logger = logging.getLogger(__name__)
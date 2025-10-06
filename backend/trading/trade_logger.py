import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import pandas as pd
import numpy as np


@dataclass
class TradeRecord:
    id: str
    signal_id: Optional[str]
    symbol: str
    action: str  # BUY, SELL
    quantity: float
    entry_price: float
    exit_price: Optional[float]
    entry_time: datetime
    exit_time: Optional[datetime]
    pnl: Optional[float]
    commission: float
    status: str  # OPEN, CLOSED, CANCELLED
    stop_loss: Optional[float]
    take_profit: Optional[float]
    signal_confidence: Optional[float]
    strategy_source: str  # HTS, MANUAL, etc.
    metadata: Dict[str, Any]


@dataclass
class SignalRecord:
    id: str
    symbol: str
    action: str
    confidence: float
    final_score: float
    timestamp: datetime
    price: float
    components: Dict[str, float]
    executed: bool
    trade_id: Optional[str]
    metadata: Dict[str, Any]


class TradeLogger:
    def __init__(self):
        # In-memory storage (in production, this would use a database)
        self.signals: Dict[str, SignalRecord] = {}
        self.trades: Dict[str, TradeRecord] = {}
        self.daily_stats: Dict[str, Dict] = {}
        
        # Current portfolio state
        self.open_positions: Dict[str, TradeRecord] = {}
        self.total_realized_pnl = 0.0
        self.total_commission_paid = 0.0
        
    async def log_signal(self, signal: Dict) -> str:
        """Log a trading signal"""
        try:
            signal_id = signal.get('id') or f"sig_{int(datetime.now().timestamp() * 1000)}"
            
            signal_record = SignalRecord(
                id=signal_id,
                symbol=signal['symbol'],
                action=signal['action'],
                confidence=signal['confidence'],
                final_score=signal['final_score'],
                timestamp=signal.get('timestamp', datetime.now()),
                price=signal['price'],
                components={
                    'rsi_macd_score': signal.get('rsi_macd_score', 0),
                    'smc_score': signal.get('smc_score', 0),
                    'pattern_score': signal.get('pattern_score', 0),
                    'sentiment_score': signal.get('sentiment_score', 0),
                    'ml_score': signal.get('ml_score', 0)
                },
                executed=False,
                trade_id=None,
                metadata=signal.get('metadata', {})
            )
            
            self.signals[signal_id] = signal_record
            await self._update_daily_stats('signals_generated', 1)
            
            return signal_id
            
        except Exception as e:
            print(f"Error logging signal: {str(e)}")
            return ""
    
    async def log_trade_execution(self, trade: Dict, signal_id: Optional[str] = None) -> str:
        """Log trade execution"""
        try:
            trade_id = trade.get('id') or f"trade_{int(datetime.now().timestamp() * 1000)}"
            
            trade_record = TradeRecord(
                id=trade_id,
                signal_id=signal_id,
                symbol=trade['symbol'],
                action=trade['action'],
                quantity=trade['quantity'],
                entry_price=trade['entry_price'],
                exit_price=trade.get('exit_price'),
                entry_time=trade.get('entry_time', datetime.now()),
                exit_time=trade.get('exit_time'),
                pnl=trade.get('pnl'),
                commission=trade.get('commission', 0),
                status=trade.get('status', 'OPEN'),
                stop_loss=trade.get('stop_loss'),
                take_profit=trade.get('take_profit'),
                signal_confidence=trade.get('signal_confidence'),
                strategy_source=trade.get('strategy_source', 'HTS'),
                metadata=trade.get('metadata', {})
            )
            
            self.trades[trade_id] = trade_record
            
            # Update signal as executed
            if signal_id and signal_id in self.signals:
                self.signals[signal_id].executed = True
                self.signals[signal_id].trade_id = trade_id
            
            # Track open positions
            if trade_record.status == 'OPEN':
                self.open_positions[trade_id] = trade_record
                await self._update_daily_stats('trades_opened', 1)
            elif trade_record.status == 'CLOSED':
                if trade_id in self.open_positions:
                    del self.open_positions[trade_id]
                await self._close_trade_stats(trade_record)
            
            self.total_commission_paid += trade_record.commission
            
            return trade_id
            
        except Exception as e:
            print(f"Error logging trade execution: {str(e)}")
            return ""
    
    async def close_trade(self, trade_id: str, exit_price: float, exit_time: Optional[datetime] = None) -> bool:
        """Close an open trade"""
        try:
            if trade_id not in self.trades:
                return False
            
            trade = self.trades[trade_id]
            
            if trade.status != 'OPEN':
                return False
            
            trade.exit_price = exit_price
            trade.exit_time = exit_time or datetime.now()
            trade.status = 'CLOSED'
            
            # Calculate P&L
            if trade.action == 'BUY':
                trade.pnl = (exit_price - trade.entry_price) * trade.quantity
            else:  # SELL
                trade.pnl = (trade.entry_price - exit_price) * trade.quantity
            
            # Subtract commission
            trade.pnl -= trade.commission
            
            # Update tracking
            if trade_id in self.open_positions:
                del self.open_positions[trade_id]
            
            self.total_realized_pnl += trade.pnl
            await self._close_trade_stats(trade)
            
            return True
            
        except Exception as e:
            print(f"Error closing trade: {str(e)}")
            return False
    
    async def calculate_realized_pnl(self, symbol: Optional[str] = None, timeframe: Optional[str] = None) -> Dict:
        """Calculate realized P&L"""
        try:
            closed_trades = [
                trade for trade in self.trades.values() 
                if trade.status == 'CLOSED' and trade.pnl is not None
            ]
            
            # Filter by symbol if specified
            if symbol:
                closed_trades = [trade for trade in closed_trades if trade.symbol == symbol]
            
            # Filter by timeframe if specified
            if timeframe:
                cutoff_date = self._get_timeframe_cutoff(timeframe)
                closed_trades = [
                    trade for trade in closed_trades 
                    if trade.exit_time and trade.exit_time >= cutoff_date
                ]
            
            if not closed_trades:
                return self._get_empty_pnl_summary()
            
            # Calculate metrics
            total_pnl = sum(trade.pnl for trade in closed_trades)
            total_commission = sum(trade.commission for trade in closed_trades)
            
            winning_trades = [trade for trade in closed_trades if trade.pnl > 0]
            losing_trades = [trade for trade in closed_trades if trade.pnl < 0]
            
            win_rate = len(winning_trades) / len(closed_trades) * 100 if closed_trades else 0
            
            avg_win = np.mean([trade.pnl for trade in winning_trades]) if winning_trades else 0
            avg_loss = np.mean([trade.pnl for trade in losing_trades]) if losing_trades else 0
            
            profit_factor = (
                sum(trade.pnl for trade in winning_trades) / 
                abs(sum(trade.pnl for trade in losing_trades)) 
                if losing_trades else float('inf')
            )
            
            # Group by symbol
            symbol_pnl = {}
            for trade in closed_trades:
                if trade.symbol not in symbol_pnl:
                    symbol_pnl[trade.symbol] = 0
                symbol_pnl[trade.symbol] += trade.pnl
            
            return {
                'total_realized_pnl': total_pnl,
                'total_commission': total_commission,
                'net_pnl': total_pnl - total_commission,
                'total_trades': len(closed_trades),
                'winning_trades': len(winning_trades),
                'losing_trades': len(losing_trades),
                'win_rate': win_rate,
                'average_win': avg_win,
                'average_loss': avg_loss,
                'profit_factor': profit_factor,
                'largest_win': max([trade.pnl for trade in closed_trades]) if closed_trades else 0,
                'largest_loss': min([trade.pnl for trade in closed_trades]) if closed_trades else 0,
                'symbol_breakdown': symbol_pnl,
                'timeframe': timeframe or 'all_time',
                'calculation_time': datetime.now()
            }
            
        except Exception as e:
            print(f"Error calculating realized P&L: {str(e)}")
            return self._get_empty_pnl_summary()
    
    async def calculate_unrealized_pnl(self, current_prices: Dict[str, float]) -> Dict:
        """Calculate unrealized P&L for open positions"""
        try:
            if not self.open_positions:
                return {
                    'total_unrealized_pnl': 0,
                    'positions': [],
                    'total_open_positions': 0,
                    'calculation_time': datetime.now()
                }
            
            positions_pnl = []
            total_unrealized = 0
            
            for trade in self.open_positions.values():
                current_price = current_prices.get(trade.symbol)
                
                if current_price is None:
                    continue
                
                # Calculate unrealized P&L
                if trade.action == 'BUY':
                    unrealized_pnl = (current_price - trade.entry_price) * trade.quantity
                else:  # SELL
                    unrealized_pnl = (trade.entry_price - current_price) * trade.quantity
                
                position_info = {
                    'trade_id': trade.id,
                    'symbol': trade.symbol,
                    'action': trade.action,
                    'quantity': trade.quantity,
                    'entry_price': trade.entry_price,
                    'current_price': current_price,
                    'unrealized_pnl': unrealized_pnl,
                    'unrealized_pnl_pct': (unrealized_pnl / (trade.entry_price * trade.quantity)) * 100,
                    'entry_time': trade.entry_time,
                    'days_held': (datetime.now() - trade.entry_time).days,
                    'stop_loss': trade.stop_loss,
                    'take_profit': trade.take_profit
                }
                
                positions_pnl.append(position_info)
                total_unrealized += unrealized_pnl
            
            return {
                'total_unrealized_pnl': total_unrealized,
                'positions': positions_pnl,
                'total_open_positions': len(positions_pnl),
                'calculation_time': datetime.now()
            }
            
        except Exception as e:
            print(f"Error calculating unrealized P&L: {str(e)}")
            return {
                'total_unrealized_pnl': 0,
                'positions': [],
                'total_open_positions': 0,
                'calculation_time': datetime.now(),
                'error': str(e)
            }
    
    async def get_trade_history(self, limit: int = 50, symbol: Optional[str] = None) -> List[Dict]:
        """Get recent trade history"""
        try:
            trades = list(self.trades.values())
            
            # Filter by symbol if specified
            if symbol:
                trades = [trade for trade in trades if trade.symbol == symbol]
            
            # Sort by entry time (most recent first)
            trades.sort(key=lambda x: x.entry_time, reverse=True)
            
            # Limit results
            trades = trades[:limit]
            
            # Convert to dict format
            return [asdict(trade) for trade in trades]
            
        except Exception as e:
            print(f"Error getting trade history: {str(e)}")
            return []
    
    async def get_signal_history(self, limit: int = 50, symbol: Optional[str] = None) -> List[Dict]:
        """Get recent signal history"""
        try:
            signals = list(self.signals.values())
            
            # Filter by symbol if specified
            if symbol:
                signals = [signal for signal in signals if signal.symbol == symbol]
            
            # Sort by timestamp (most recent first)
            signals.sort(key=lambda x: x.timestamp, reverse=True)
            
            # Limit results
            signals = signals[:limit]
            
            # Convert to dict format
            return [asdict(signal) for signal in signals]
            
        except Exception as e:
            print(f"Error getting signal history: {str(e)}")
            return []
    
    async def get_daily_summary(self, date: Optional[datetime] = None) -> Dict:
        """Get daily trading summary"""
        try:
            target_date = date or datetime.now()
            date_key = target_date.strftime('%Y-%m-%d')
            
            if date_key not in self.daily_stats:
                return self._get_empty_daily_summary(date_key)
            
            stats = self.daily_stats[date_key]
            
            # Calculate additional metrics
            if stats.get('trades_closed', 0) > 0:
                win_rate = (stats.get('winning_trades', 0) / stats.get('trades_closed', 1)) * 100
            else:
                win_rate = 0
            
            return {
                'date': date_key,
                'signals_generated': stats.get('signals_generated', 0),
                'trades_opened': stats.get('trades_opened', 0),
                'trades_closed': stats.get('trades_closed', 0),
                'winning_trades': stats.get('winning_trades', 0),
                'losing_trades': stats.get('losing_trades', 0),
                'daily_pnl': stats.get('daily_pnl', 0),
                'daily_commission': stats.get('daily_commission', 0),
                'win_rate': win_rate,
                'best_trade': stats.get('best_trade', 0),
                'worst_trade': stats.get('worst_trade', 0),
                'total_volume': stats.get('total_volume', 0)
            }
            
        except Exception as e:
            print(f"Error getting daily summary: {str(e)}")
            return self._get_empty_daily_summary(datetime.now().strftime('%Y-%m-%d'))
    
    def _get_timeframe_cutoff(self, timeframe: str) -> datetime:
        """Get cutoff date for timeframe"""
        now = datetime.now()
        
        if timeframe == '1D':
            return now - timedelta(days=1)
        elif timeframe == '7D':
            return now - timedelta(days=7)
        elif timeframe == '30D':
            return now - timedelta(days=30)
        elif timeframe == '90D':
            return now - timedelta(days=90)
        elif timeframe == '1Y':
            return now - timedelta(days=365)
        else:
            return datetime.min
    
    def _get_empty_pnl_summary(self) -> Dict:
        """Return empty P&L summary"""
        return {
            'total_realized_pnl': 0,
            'total_commission': 0,
            'net_pnl': 0,
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'win_rate': 0,
            'average_win': 0,
            'average_loss': 0,
            'profit_factor': 0,
            'largest_win': 0,
            'largest_loss': 0,
            'symbol_breakdown': {},
            'timeframe': 'all_time',
            'calculation_time': datetime.now()
        }
    
    def _get_empty_daily_summary(self, date: str) -> Dict:
        """Return empty daily summary"""
        return {
            'date': date,
            'signals_generated': 0,
            'trades_opened': 0,
            'trades_closed': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'daily_pnl': 0,
            'daily_commission': 0,
            'win_rate': 0,
            'best_trade': 0,
            'worst_trade': 0,
            'total_volume': 0
        }
    
    async def _update_daily_stats(self, metric: str, value: float):
        """Update daily statistics"""
        try:
            date_key = datetime.now().strftime('%Y-%m-%d')
            
            if date_key not in self.daily_stats:
                self.daily_stats[date_key] = {}
            
            current_value = self.daily_stats[date_key].get(metric, 0)
            self.daily_stats[date_key][metric] = current_value + value
            
        except Exception as e:
            print(f"Error updating daily stats: {str(e)}")
    
    async def _close_trade_stats(self, trade: TradeRecord):
        """Update statistics when a trade is closed"""
        try:
            await self._update_daily_stats('trades_closed', 1)
            
            if trade.pnl and trade.pnl > 0:
                await self._update_daily_stats('winning_trades', 1)
                await self._update_daily_stats('best_trade', max(
                    self.daily_stats.get(datetime.now().strftime('%Y-%m-%d'), {}).get('best_trade', 0),
                    trade.pnl
                ))
            elif trade.pnl and trade.pnl < 0:
                await self._update_daily_stats('losing_trades', 1)
                await self._update_daily_stats('worst_trade', min(
                    self.daily_stats.get(datetime.now().strftime('%Y-%m-%d'), {}).get('worst_trade', 0),
                    trade.pnl
                ))
            
            if trade.pnl:
                await self._update_daily_stats('daily_pnl', trade.pnl)
            
            await self._update_daily_stats('daily_commission', trade.commission)
            await self._update_daily_stats('total_volume', trade.quantity * trade.entry_price)
            
        except Exception as e:
            print(f"Error updating close trade stats: {str(e)}")
    
    def get_portfolio_summary(self) -> Dict:
        """Get overall portfolio summary"""
        return {
            'total_signals': len(self.signals),
            'total_trades': len(self.trades),
            'open_positions': len(self.open_positions),
            'total_realized_pnl': self.total_realized_pnl,
            'total_commission_paid': self.total_commission_paid,
            'net_realized_pnl': self.total_realized_pnl - self.total_commission_paid
        }


# Global trade logger instance
trade_logger = TradeLogger()
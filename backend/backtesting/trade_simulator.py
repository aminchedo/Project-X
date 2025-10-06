from datetime import datetime
from typing import Dict, List, Optional
import uuid


class Position:
    def __init__(self, symbol: str, action: str, quantity: float, entry_price: float, entry_time: datetime):
        self.id = str(uuid.uuid4())
        self.symbol = symbol
        self.action = action  # BUY or SELL
        self.quantity = quantity
        self.entry_price = entry_price
        self.entry_time = entry_time
        self.exit_price: Optional[float] = None
        self.exit_time: Optional[datetime] = None
        self.status = "OPEN"  # OPEN, CLOSED
        self.stop_loss: Optional[float] = None
        self.take_profit: Optional[float] = None
        
    def get_unrealized_pnl(self, current_price: float) -> float:
        """Calculate unrealized P&L for open position"""
        if self.status != "OPEN":
            return 0
        
        if self.action == "BUY":
            return (current_price - self.entry_price) * self.quantity
        else:  # SELL
            return (self.entry_price - current_price) * self.quantity
    
    def get_realized_pnl(self) -> float:
        """Calculate realized P&L for closed position"""
        if self.status != "CLOSED" or self.exit_price is None:
            return 0
        
        if self.action == "BUY":
            return (self.exit_price - self.entry_price) * self.quantity
        else:  # SELL
            return (self.entry_price - self.exit_price) * self.quantity
    
    def close_position(self, exit_price: float, exit_time: datetime) -> Dict:
        """Close position and return trade details"""
        self.exit_price = exit_price
        self.exit_time = exit_time
        self.status = "CLOSED"
        
        pnl = self.get_realized_pnl()
        
        return {
            'id': self.id,
            'symbol': self.symbol,
            'action': self.action,
            'quantity': self.quantity,
            'entry_price': self.entry_price,
            'exit_price': self.exit_price,
            'entry_time': self.entry_time,
            'exit_time': self.exit_time,
            'pnl': pnl,
            'status': self.status
        }


class TradeSimulator:
    def __init__(self, initial_capital: float, commission: float = 0.001, slippage: float = 0.0005):
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.commission = commission
        self.slippage = slippage
        
        self.open_positions: Dict[str, Position] = {}
        self.closed_trades: List[Dict] = []
        self.total_commission_paid = 0
        
        # Risk management settings
        self.max_position_size = 0.95  # 95% of capital per position
        self.default_stop_loss_pct = 0.02  # 2% stop loss
        self.default_take_profit_pct = 0.06  # 6% take profit
        
    def execute_signal(self, signal: Dict, current_price: float, timestamp: datetime) -> Optional[Dict]:
        """Execute trading signal and manage positions"""
        try:
            symbol = signal['symbol']
            action = signal['action']
            confidence = signal['confidence']
            
            # Check if we have an opposite position to close first
            opposite_action = "SELL" if action == "BUY" else "BUY"
            position_to_close = None
            
            for pos_id, position in self.open_positions.items():
                if position.symbol == symbol and position.action == opposite_action:
                    position_to_close = position
                    break
            
            # Close opposite position if exists
            if position_to_close:
                self._close_position(position_to_close, current_price, timestamp)
            
            # Calculate position size based on confidence and available capital
            position_size = self._calculate_position_size(signal, current_price)
            
            if position_size <= 0:
                return None
            
            # Apply slippage
            execution_price = self._apply_slippage(current_price, action)
            
            # Calculate commission
            trade_value = position_size * execution_price
            commission_cost = trade_value * self.commission
            
            # Check if we have enough cash
            if action == "BUY":
                total_cost = trade_value + commission_cost
                if total_cost > self.cash:
                    # Adjust position size to available cash
                    available_for_trade = self.cash * 0.99  # Leave 1% buffer
                    position_size = available_for_trade / (execution_price * (1 + self.commission))
                    trade_value = position_size * execution_price
                    commission_cost = trade_value * self.commission
                    total_cost = trade_value + commission_cost
                    
                    if total_cost > self.cash:
                        return None  # Still not enough cash
                
                # Execute BUY
                self.cash -= total_cost
                
            else:  # SELL
                # For SELL, we need to have the position or simulate short selling
                # For simplicity, we'll treat this as closing a BUY position or opening a short
                pass
            
            # Create new position
            new_position = Position(
                symbol=symbol,
                action=action,
                quantity=position_size,
                entry_price=execution_price,
                entry_time=timestamp
            )
            
            # Set stop loss and take profit
            if action == "BUY":
                new_position.stop_loss = execution_price * (1 - self.default_stop_loss_pct)
                new_position.take_profit = execution_price * (1 + self.default_take_profit_pct)
            else:  # SELL
                new_position.stop_loss = execution_price * (1 + self.default_stop_loss_pct)
                new_position.take_profit = execution_price * (1 - self.default_take_profit_pct)
            
            self.open_positions[new_position.id] = new_position
            self.total_commission_paid += commission_cost
            
            return {
                'position_id': new_position.id,
                'symbol': symbol,
                'action': action,
                'quantity': position_size,
                'execution_price': execution_price,
                'commission': commission_cost,
                'timestamp': timestamp
            }
            
        except Exception as e:
            print(f"Error executing signal: {str(e)}")
            return None
    
    def _calculate_position_size(self, signal: Dict, current_price: float) -> float:
        """Calculate position size based on confidence and risk management"""
        try:
            confidence = signal['confidence']
            available_capital = self.cash
            
            # Base position size as percentage of capital
            base_position_pct = 0.1  # 10% base
            
            # Adjust based on confidence (0.5 to 1.0 confidence maps to 0.5x to 2.0x position)
            confidence_multiplier = 0.5 + (confidence * 1.5)
            
            # Calculate position size in dollars
            position_value = available_capital * base_position_pct * confidence_multiplier
            
            # Apply maximum position size limit
            max_position_value = available_capital * self.max_position_size
            position_value = min(position_value, max_position_value)
            
            # Convert to quantity
            position_size = position_value / current_price
            
            return position_size
            
        except Exception as e:
            print(f"Error calculating position size: {str(e)}")
            return 0
    
    def _apply_slippage(self, price: float, action: str) -> float:
        """Apply slippage to execution price"""
        if action == "BUY":
            return price * (1 + self.slippage)
        else:  # SELL
            return price * (1 - self.slippage)
    
    def _close_position(self, position: Position, exit_price: float, exit_time: datetime) -> Dict:
        """Close a position and update cash"""
        try:
            # Apply slippage to exit price
            exit_price_with_slippage = self._apply_slippage(exit_price, 
                "SELL" if position.action == "BUY" else "BUY")
            
            # Close position
            trade_result = position.close_position(exit_price_with_slippage, exit_time)
            
            # Calculate proceeds
            if position.action == "BUY":
                # Selling BUY position
                proceeds = position.quantity * exit_price_with_slippage
                commission_cost = proceeds * self.commission
                net_proceeds = proceeds - commission_cost
                self.cash += net_proceeds
            else:
                # Covering SELL position
                cost = position.quantity * exit_price_with_slippage
                commission_cost = cost * self.commission
                total_cost = cost + commission_cost
                self.cash -= total_cost
            
            self.total_commission_paid += commission_cost
            
            # Remove from open positions and add to closed trades
            if position.id in self.open_positions:
                del self.open_positions[position.id]
            
            self.closed_trades.append(trade_result)
            
            return trade_result
            
        except Exception as e:
            print(f"Error closing position: {str(e)}")
            return {}
    
    def check_stop_loss_take_profit(self, current_price: float, timestamp: datetime) -> List[Dict]:
        """Check and execute stop loss/take profit orders"""
        executed_orders = []
        
        positions_to_close = []
        
        for position in self.open_positions.values():
            should_close = False
            
            if position.action == "BUY":
                # Check stop loss (price below stop)
                if position.stop_loss and current_price <= position.stop_loss:
                    should_close = True
                # Check take profit (price above target)
                elif position.take_profit and current_price >= position.take_profit:
                    should_close = True
            else:  # SELL position
                # Check stop loss (price above stop)
                if position.stop_loss and current_price >= position.stop_loss:
                    should_close = True
                # Check take profit (price below target)
                elif position.take_profit and current_price <= position.take_profit:
                    should_close = True
            
            if should_close:
                positions_to_close.append(position)
        
        # Close positions that hit stop/target
        for position in positions_to_close:
            trade_result = self._close_position(position, current_price, timestamp)
            executed_orders.append(trade_result)
        
        return executed_orders
    
    def get_portfolio_value(self, current_price: float) -> float:
        """Calculate total portfolio value"""
        portfolio_value = self.cash
        
        # Add unrealized P&L from open positions
        for position in self.open_positions.values():
            portfolio_value += position.get_unrealized_pnl(current_price)
        
        return portfolio_value
    
    def get_open_positions(self) -> List[Dict]:
        """Get all open positions"""
        return [
            {
                'id': pos.id,
                'symbol': pos.symbol,
                'action': pos.action,
                'quantity': pos.quantity,
                'entry_price': pos.entry_price,
                'entry_time': pos.entry_time,
                'stop_loss': pos.stop_loss,
                'take_profit': pos.take_profit,
                'status': pos.status
            }
            for pos in self.open_positions.values()
        ]
    
    def get_completed_trades(self) -> List[Dict]:
        """Get all completed trades"""
        return self.closed_trades.copy()
    
    def get_portfolio_summary(self, current_price: float) -> Dict:
        """Get portfolio summary statistics"""
        portfolio_value = self.get_portfolio_value(current_price)
        total_return = portfolio_value - self.initial_capital
        total_return_pct = (total_return / self.initial_capital) * 100
        
        # Calculate unrealized P&L
        unrealized_pnl = sum(
            pos.get_unrealized_pnl(current_price) 
            for pos in self.open_positions.values()
        )
        
        # Calculate realized P&L
        realized_pnl = sum(trade['pnl'] for trade in self.closed_trades)
        
        return {
            'initial_capital': self.initial_capital,
            'current_cash': self.cash,
            'portfolio_value': portfolio_value,
            'total_return': total_return,
            'total_return_pct': total_return_pct,
            'realized_pnl': realized_pnl,
            'unrealized_pnl': unrealized_pnl,
            'total_commission_paid': self.total_commission_paid,
            'open_positions_count': len(self.open_positions),
            'completed_trades_count': len(self.closed_trades)
        }
    
    def reset(self):
        """Reset simulator to initial state"""
        self.cash = self.initial_capital
        self.open_positions.clear()
        self.closed_trades.clear()
        self.total_commission_paid = 0
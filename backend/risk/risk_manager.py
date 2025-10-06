import pandas as pd
import numpy as np
from datetime import datetime
from ..analytics.indicators import calculate_atr

class RiskManager:
    def __init__(self):
        self.max_risk_per_trade = 0.02  # 2%
        self.max_daily_loss = 0.05  # 5%
        self.position_size_multiplier = 1.0
        self.stop_loss_atr_multiple = 1.5
        self.daily_start_equity = 10000.0
        self.current_equity = 10000.0
        self.consecutive_losses = 0
        self.max_consecutive_losses = 5
        self.trades_today = 0
        self.max_trades_per_day = 10
    
    def calculate_position_size(self, equity: float, atr: float, market_vol: float, vol_24h: float, confidence: float) -> float:
        """Calculate position size based on risk parameters"""
        if atr <= 0 or vol_24h <= 0 or equity <= 0:
            return 0.0
        
        # Base position size calculation
        base_size_risk = (self.max_risk_per_trade * equity) / atr
        base_size_volume = (0.1 * market_vol) / vol_24h if vol_24h > 0 else base_size_risk
        
        base_size = min(base_size_risk, base_size_volume)
        
        # Apply confidence multiplier (sigmoid function)
        confidence_factor = 1 / (1 + np.exp(-2 * (confidence - 0.5)))
        
        # Apply position size multiplier
        final_size = base_size * confidence_factor * self.position_size_multiplier
        
        # Apply risk limits
        if self.check_daily_loss_limit() or self.check_consecutive_losses():
            final_size *= 0.5  # Reduce position size when limits are hit
        
        return max(final_size, 0.0)
    
    def calculate_stop_loss(self, entry_price: float, atr: float, direction: str) -> float:
        """Calculate stop loss based on ATR"""
        if atr <= 0 or entry_price <= 0:
            return entry_price * (0.98 if direction == "BUY" else 1.02)
        
        if direction == "BUY":
            return entry_price - (atr * self.stop_loss_atr_multiple)
        else:  # SELL
            return entry_price + (atr * self.stop_loss_atr_multiple)
    
    def calculate_take_profit(self, entry_price: float, stop_loss: float, direction: str, risk_reward_ratio: float = 2.0) -> float:
        """Calculate take profit based on risk-reward ratio"""
        if entry_price <= 0 or stop_loss <= 0:
            return entry_price * (1.04 if direction == "BUY" else 0.96)
        
        risk = abs(entry_price - stop_loss)
        reward = risk * risk_reward_ratio
        
        if direction == "BUY":
            return entry_price + reward
        else:  # SELL
            return entry_price - reward
    
    def calculate_atr_from_ohlcv(self, ohlcv_data: pd.DataFrame) -> float:
        """Calculate ATR from OHLCV data"""
        if len(ohlcv_data) < 14:
            return 0.0
        
        try:
            atr = calculate_atr(ohlcv_data['high'], ohlcv_data['low'], ohlcv_data['close'])
            return float(atr.iloc[-1]) if not pd.isna(atr.iloc[-1]) else 0.0
        except Exception as e:
            print(f"Error calculating ATR: {e}")
            return 0.0
    
    def check_daily_loss_limit(self) -> bool:
        """Check if daily loss limit has been hit"""
        daily_loss = (self.current_equity - self.daily_start_equity) / self.daily_start_equity
        return daily_loss <= -self.max_daily_loss
    
    def check_consecutive_losses(self) -> bool:
        """Check if consecutive loss limit has been hit"""
        return self.consecutive_losses >= self.max_consecutive_losses
    
    def check_daily_trade_limit(self) -> bool:
        """Check if daily trade limit has been hit"""
        return self.trades_today >= self.max_trades_per_day
    
    def can_trade(self) -> bool:
        """Check if trading is allowed based on risk limits"""
        return not (
            self.check_daily_loss_limit() or 
            self.check_consecutive_losses() or 
            self.check_daily_trade_limit()
        )
    
    def update_trade_result(self, profit_loss: float, is_win: bool):
        """Update equity and trade statistics"""
        self.current_equity += profit_loss
        self.trades_today += 1
        
        if is_win:
            self.consecutive_losses = 0
        else:
            self.consecutive_losses += 1
    
    def reset_daily_stats(self):
        """Reset daily statistics"""
        self.daily_start_equity = self.current_equity
        self.consecutive_losses = 0
        self.trades_today = 0
    
    def update_settings(self, settings: dict):
        """Update risk management settings"""
        if 'position_size_multiplier' in settings:
            self.position_size_multiplier = max(0.1, min(3.0, float(settings['position_size_multiplier'])))
        
        if 'max_risk_per_trade' in settings:
            self.max_risk_per_trade = max(0.005, min(0.1, float(settings['max_risk_per_trade'])))
        
        if 'stop_loss_atr_multiple' in settings:
            self.stop_loss_atr_multiple = max(0.5, min(5.0, float(settings['stop_loss_atr_multiple'])))
    
    def get_risk_status(self) -> dict:
        """Get current risk management status"""
        daily_loss = (self.current_equity - self.daily_start_equity) / self.daily_start_equity
        
        return {
            'current_equity': self.current_equity,
            'daily_loss_pct': daily_loss * 100,
            'consecutive_losses': self.consecutive_losses,
            'trades_today': self.trades_today,
            'daily_loss_limit_hit': self.check_daily_loss_limit(),
            'consecutive_loss_limit_hit': self.check_consecutive_losses(),
            'daily_trade_limit_hit': self.check_daily_trade_limit(),
            'can_trade': self.can_trade(),
            'position_size_multiplier': self.position_size_multiplier,
            'max_risk_per_trade': self.max_risk_per_trade * 100,
            'max_trades_per_day': self.max_trades_per_day
        }
    
    def get_position_metrics(self, entry_price: float, current_price: float, position_size: float, direction: str) -> dict:
        """Calculate position metrics"""
        if direction == "BUY":
            unrealized_pnl = (current_price - entry_price) * position_size
            pnl_percentage = ((current_price - entry_price) / entry_price) * 100
        else:  # SELL
            unrealized_pnl = (entry_price - current_price) * position_size
            pnl_percentage = ((entry_price - current_price) / entry_price) * 100
        
        return {
            'unrealized_pnl': unrealized_pnl,
            'pnl_percentage': pnl_percentage,
            'position_value': current_price * position_size,
            'risk_amount': abs(unrealized_pnl) if unrealized_pnl < 0 else 0
        }

# Global risk manager instance
risk_manager = RiskManager()
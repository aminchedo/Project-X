"""
HTS Trading System - Portfolio Risk Manager
Advanced portfolio management with real-time P&L tracking and risk monitoring.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from decimal import Decimal, ROUND_HALF_UP

import asyncpg
import redis
import numpy as np

from .risk_manager import RiskManager, RiskMetrics, PositionRisk

logger = logging.getLogger(__name__)

@dataclass
class Position:
    """Portfolio position data structure"""
    id: Optional[int]
    symbol: str
    quantity: Decimal
    avg_price: Decimal
    current_price: Decimal
    market_value: Decimal
    unrealized_pnl: Decimal
    realized_pnl: Decimal
    total_pnl: Decimal
    pnl_pct: float
    weight: float
    entry_time: datetime
    last_update: datetime
    stop_loss: Optional[Decimal] = None
    take_profit: Optional[Decimal] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "symbol": self.symbol,
            "quantity": float(self.quantity),
            "avg_price": float(self.avg_price),
            "current_price": float(self.current_price),
            "market_value": float(self.market_value),
            "unrealized_pnl": float(self.unrealized_pnl),
            "realized_pnl": float(self.realized_pnl),
            "total_pnl": float(self.total_pnl),
            "pnl_pct": self.pnl_pct,
            "weight": self.weight,
            "entry_time": self.entry_time.isoformat() if self.entry_time else None,
            "last_update": self.last_update.isoformat() if self.last_update else None,
            "stop_loss": float(self.stop_loss) if self.stop_loss else None,
            "take_profit": float(self.take_profit) if self.take_profit else None
        }

@dataclass
class PortfolioSummary:
    """Portfolio summary metrics"""
    total_value: Decimal
    cash_balance: Decimal
    invested_value: Decimal
    total_pnl: Decimal
    unrealized_pnl: Decimal
    realized_pnl: Decimal
    daily_pnl: Decimal
    pnl_pct: float
    daily_pnl_pct: float
    position_count: int
    winning_positions: int
    losing_positions: int
    win_rate: float
    largest_winner: Decimal
    largest_loser: Decimal
    risk_metrics: Optional[RiskMetrics]
    last_update: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "total_value": float(self.total_value),
            "cash_balance": float(self.cash_balance),
            "invested_value": float(self.invested_value),
            "total_pnl": float(self.total_pnl),
            "unrealized_pnl": float(self.unrealized_pnl),
            "realized_pnl": float(self.realized_pnl),
            "daily_pnl": float(self.daily_pnl),
            "pnl_pct": self.pnl_pct,
            "daily_pnl_pct": self.daily_pnl_pct,
            "position_count": self.position_count,
            "winning_positions": self.winning_positions,
            "losing_positions": self.losing_positions,
            "win_rate": self.win_rate,
            "largest_winner": float(self.largest_winner),
            "largest_loser": float(self.largest_loser),
            "risk_metrics": asdict(self.risk_metrics) if self.risk_metrics else None,
            "last_update": self.last_update.isoformat()
        }

class PortfolioRiskManager:
    """Advanced portfolio management and risk monitoring"""
    
    def __init__(self, db_pool: Optional[asyncpg.Pool] = None, redis_client: Optional[redis.Redis] = None):
        self.db_pool = db_pool
        self.redis_client = redis_client
        self.risk_manager = RiskManager()
        
        # Portfolio configuration
        self.initial_capital = Decimal('10000.00')  # Starting capital
        self.max_positions = 20  # Maximum number of positions
        self.rebalance_threshold = 0.05  # 5% deviation threshold for rebalancing
        
        # Performance tracking
        self.positions: Dict[str, Position] = {}
        self.portfolio_history: List[Dict] = []
        self.daily_snapshots: List[Dict] = []
        
    async def initialize_portfolio(self, initial_capital: Optional[Decimal] = None) -> bool:
        """Initialize portfolio with starting capital"""
        try:
            capital = initial_capital or self.initial_capital
            
            if self.db_pool:
                async with self.db_pool.acquire() as conn:
                    # Create portfolio record
                    await conn.execute("""
                        INSERT INTO portfolio_snapshots (
                            date, total_value, cash_balance, invested_value,
                            total_pnl, unrealized_pnl, realized_pnl
                        ) VALUES ($1, $2, $2, $3, $4, $4, $4)
                        ON CONFLICT (date) DO NOTHING
                    """, datetime.utcnow().date(), capital, Decimal('0'), Decimal('0'))
            
            logger.info(f"Portfolio initialized with capital: {capital}")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing portfolio: {str(e)}")
            return False
    
    async def add_position(
        self, 
        symbol: str, 
        quantity: Decimal, 
        price: Decimal,
        stop_loss: Optional[Decimal] = None,
        take_profit: Optional[Decimal] = None
    ) -> Optional[Position]:
        """Add new position to portfolio"""
        try:
            current_price = await self._get_current_price(symbol)
            if not current_price:
                current_price = price
            
            market_value = quantity * current_price
            unrealized_pnl = (current_price - price) * quantity
            
            position = Position(
                id=None,
                symbol=symbol,
                quantity=quantity,
                avg_price=price,
                current_price=current_price,
                market_value=market_value,
                unrealized_pnl=unrealized_pnl,
                realized_pnl=Decimal('0'),
                total_pnl=unrealized_pnl,
                pnl_pct=float(unrealized_pnl / (price * quantity) * 100) if quantity > 0 else 0.0,
                weight=0.0,  # Will be calculated in portfolio summary
                entry_time=datetime.utcnow(),
                last_update=datetime.utcnow(),
                stop_loss=stop_loss,
                take_profit=take_profit
            )
            
            # Store in database
            if self.db_pool:
                async with self.db_pool.acquire() as conn:
                    position_id = await conn.fetchval("""
                        INSERT INTO positions (
                            symbol, quantity, avg_price, unrealized_pnl,
                            stop_loss, take_profit, created_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                        RETURNING id
                    """, symbol, quantity, price, unrealized_pnl,
                        stop_loss, take_profit, datetime.utcnow())
                    
                    position.id = position_id
            
            # Update in-memory positions
            if symbol in self.positions:
                # Update existing position (average down/up)
                existing = self.positions[symbol]
                total_quantity = existing.quantity + quantity
                total_cost = (existing.quantity * existing.avg_price) + (quantity * price)
                new_avg_price = total_cost / total_quantity
                
                existing.quantity = total_quantity
                existing.avg_price = new_avg_price
                existing.last_update = datetime.utcnow()
                
                await self._update_position_values(existing)
            else:
                self.positions[symbol] = position
            
            logger.info(f"Added position: {symbol} - {quantity} @ {price}")
            return position
            
        except Exception as e:
            logger.error(f"Error adding position: {str(e)}")
            return None
    
    async def close_position(
        self, 
        symbol: str, 
        quantity: Optional[Decimal] = None,
        price: Optional[Decimal] = None
    ) -> Optional[Dict[str, Any]]:
        """Close position (full or partial)"""
        try:
            if symbol not in self.positions:
                return {"error": "Position not found"}
            
            position = self.positions[symbol]
            close_quantity = quantity or position.quantity
            close_price = price or await self._get_current_price(symbol)
            
            if not close_price:
                return {"error": "Unable to get current price"}
            
            if close_quantity > position.quantity:
                return {"error": "Close quantity exceeds position size"}
            
            # Calculate realized P&L
            realized_pnl = (close_price - position.avg_price) * close_quantity
            
            # Log the trade
            if self.db_pool:
                async with self.db_pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO trades (
                            symbol, side, quantity, price, pnl, executed_at
                        ) VALUES ($1, $2, $3, $4, $5, $6)
                    """, symbol, "SELL", close_quantity, close_price, realized_pnl, datetime.utcnow())
            
            # Update position
            if close_quantity == position.quantity:
                # Full close
                del self.positions[symbol]
                
                if self.db_pool:
                    async with self.db_pool.acquire() as conn:
                        await conn.execute("DELETE FROM positions WHERE symbol = $1", symbol)
            else:
                # Partial close
                position.quantity -= close_quantity
                position.realized_pnl += realized_pnl
                position.last_update = datetime.utcnow()
                
                await self._update_position_values(position)
            
            trade_result = {
                "symbol": symbol,
                "quantity": float(close_quantity),
                "price": float(close_price),
                "realized_pnl": float(realized_pnl),
                "pnl_pct": float(realized_pnl / (position.avg_price * close_quantity) * 100),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Closed position: {symbol} - {close_quantity} @ {close_price}, P&L: {realized_pnl}")
            return trade_result
            
        except Exception as e:
            logger.error(f"Error closing position: {str(e)}")
            return {"error": str(e)}
    
    async def update_positions(self, price_data: Dict[str, Decimal]) -> int:
        """Update all positions with current prices"""
        updated_count = 0
        
        try:
            for symbol, position in self.positions.items():
                if symbol in price_data:
                    position.current_price = price_data[symbol]
                    await self._update_position_values(position)
                    updated_count += 1
            
            # Update database
            if self.db_pool and updated_count > 0:
                async with self.db_pool.acquire() as conn:
                    for symbol, position in self.positions.items():
                        if symbol in price_data:
                            await conn.execute("""
                                UPDATE positions 
                                SET current_price = $1, unrealized_pnl = $2, updated_at = $3
                                WHERE symbol = $4
                            """, position.current_price, position.unrealized_pnl, 
                                datetime.utcnow(), symbol)
            
            return updated_count
            
        except Exception as e:
            logger.error(f"Error updating positions: {str(e)}")
            return 0
    
    async def _update_position_values(self, position: Position):
        """Update calculated values for a position"""
        try:
            position.market_value = position.quantity * position.current_price
            position.unrealized_pnl = (position.current_price - position.avg_price) * position.quantity
            position.total_pnl = position.unrealized_pnl + position.realized_pnl
            position.pnl_pct = float(position.total_pnl / (position.avg_price * position.quantity) * 100) if position.quantity > 0 else 0.0
            position.last_update = datetime.utcnow()
            
        except Exception as e:
            logger.error(f"Error updating position values: {str(e)}")
    
    async def get_portfolio_summary(self) -> Optional[PortfolioSummary]:
        """Get comprehensive portfolio summary"""
        try:
            if not self.positions:
                return PortfolioSummary(
                    total_value=self.initial_capital,
                    cash_balance=self.initial_capital,
                    invested_value=Decimal('0'),
                    total_pnl=Decimal('0'),
                    unrealized_pnl=Decimal('0'),
                    realized_pnl=Decimal('0'),
                    daily_pnl=Decimal('0'),
                    pnl_pct=0.0,
                    daily_pnl_pct=0.0,
                    position_count=0,
                    winning_positions=0,
                    losing_positions=0,
                    win_rate=0.0,
                    largest_winner=Decimal('0'),
                    largest_loser=Decimal('0'),
                    risk_metrics=None,
                    last_update=datetime.utcnow()
                )
            
            # Calculate portfolio metrics
            total_market_value = sum(pos.market_value for pos in self.positions.values())
            total_unrealized_pnl = sum(pos.unrealized_pnl for pos in self.positions.values())
            total_realized_pnl = sum(pos.realized_pnl for pos in self.positions.values())
            total_pnl = total_unrealized_pnl + total_realized_pnl
            
            # Calculate weights
            for position in self.positions.values():
                position.weight = float(position.market_value / total_market_value * 100) if total_market_value > 0 else 0.0
            
            # Portfolio value
            total_value = self.initial_capital + total_pnl
            cash_balance = total_value - total_market_value
            
            # Position statistics
            winning_positions = sum(1 for pos in self.positions.values() if pos.total_pnl > 0)
            losing_positions = sum(1 for pos in self.positions.values() if pos.total_pnl < 0)
            win_rate = winning_positions / len(self.positions) * 100 if self.positions else 0.0
            
            # Largest winner/loser
            pnl_values = [pos.total_pnl for pos in self.positions.values()]
            largest_winner = max(pnl_values) if pnl_values else Decimal('0')
            largest_loser = min(pnl_values) if pnl_values else Decimal('0')
            
            # Daily P&L (simplified - would need historical data for accurate calculation)
            daily_pnl = total_unrealized_pnl  # Approximation
            
            # Risk metrics
            risk_metrics = await self._calculate_portfolio_risk_metrics()
            
            summary = PortfolioSummary(
                total_value=total_value,
                cash_balance=cash_balance,
                invested_value=total_market_value,
                total_pnl=total_pnl,
                unrealized_pnl=total_unrealized_pnl,
                realized_pnl=total_realized_pnl,
                daily_pnl=daily_pnl,
                pnl_pct=float(total_pnl / self.initial_capital * 100),
                daily_pnl_pct=float(daily_pnl / total_value * 100) if total_value > 0 else 0.0,
                position_count=len(self.positions),
                winning_positions=winning_positions,
                losing_positions=losing_positions,
                win_rate=win_rate,
                largest_winner=largest_winner,
                largest_loser=largest_loser,
                risk_metrics=risk_metrics,
                last_update=datetime.utcnow()
            )
            
            # Cache summary
            if self.redis_client:
                await self.redis_client.setex(
                    "portfolio_summary", 
                    30, 
                    str(summary.to_dict())
                )
            
            return summary
            
        except Exception as e:
            logger.error(f"Error getting portfolio summary: {str(e)}")
            return None
    
    async def _calculate_portfolio_risk_metrics(self) -> Optional[RiskMetrics]:
        """Calculate portfolio risk metrics"""
        try:
            if not self.positions:
                return None
            
            # Get historical price data for risk calculations
            position_data = []
            market_data = {}
            
            for symbol, position in self.positions.items():
                position_dict = position.to_dict()
                position_data.append(position_dict)
                
                # Mock historical data (in production, would fetch from database)
                market_data[symbol] = [float(position.current_price)] * 100
            
            # Calculate risk metrics using risk manager
            risk_metrics = self.risk_manager.assess_portfolio_risk(position_data, market_data)
            return risk_metrics
            
        except Exception as e:
            logger.error(f"Error calculating portfolio risk metrics: {str(e)}")
            return None
    
    async def get_position(self, symbol: str) -> Optional[Position]:
        """Get specific position"""
        return self.positions.get(symbol)
    
    async def get_all_positions(self) -> List[Position]:
        """Get all positions"""
        return list(self.positions.values())
    
    async def get_position_risk_analysis(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get detailed risk analysis for a position"""
        try:
            if symbol not in self.positions:
                return None
            
            position = self.positions[symbol]
            portfolio_summary = await self.get_portfolio_summary()
            
            if not portfolio_summary:
                return None
            
            # Calculate position risk metrics
            position_value = float(position.market_value)
            portfolio_value = float(portfolio_summary.total_value)
            
            risk_amount = 0.0
            if position.stop_loss:
                risk_per_share = abs(float(position.current_price - position.stop_loss))
                risk_amount = risk_per_share * float(position.quantity)
            
            risk_analysis = {
                "symbol": symbol,
                "position_size": float(position.quantity),
                "current_price": float(position.current_price),
                "avg_price": float(position.avg_price),
                "market_value": position_value,
                "unrealized_pnl": float(position.unrealized_pnl),
                "pnl_pct": position.pnl_pct,
                "portfolio_weight": position.weight,
                "risk_amount": risk_amount,
                "risk_pct": risk_amount / portfolio_value * 100 if portfolio_value > 0 else 0,
                "stop_loss": float(position.stop_loss) if position.stop_loss else None,
                "take_profit": float(position.take_profit) if position.take_profit else None,
                "days_held": (datetime.utcnow() - position.entry_time).days,
                "last_update": position.last_update.isoformat()
            }
            
            return risk_analysis
            
        except Exception as e:
            logger.error(f"Error getting position risk analysis: {str(e)}")
            return None
    
    async def _get_current_price(self, symbol: str) -> Optional[Decimal]:
        """Get current price for symbol"""
        try:
            if self.redis_client:
                cached_price = await self.redis_client.get(f"price:{symbol}")
                if cached_price:
                    import json
                    price_data = json.loads(cached_price)
                    return Decimal(str(price_data.get("price", 0)))
            
            # Fallback to default price (in production, would use API)
            return Decimal('50000.00')  # Mock BTC price
            
        except Exception as e:
            logger.error(f"Error getting current price for {symbol}: {str(e)}")
            return None
    
    async def save_daily_snapshot(self):
        """Save daily portfolio snapshot"""
        try:
            summary = await self.get_portfolio_summary()
            if not summary:
                return False
            
            if self.db_pool:
                async with self.db_pool.acquire() as conn:
                    await conn.execute("""
                        INSERT INTO portfolio_snapshots (
                            date, total_value, cash_balance, invested_value,
                            total_pnl, unrealized_pnl, realized_pnl,
                            position_count, winning_positions, losing_positions
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        ON CONFLICT (date) DO UPDATE SET
                        total_value = $2, cash_balance = $3, invested_value = $4,
                        total_pnl = $5, unrealized_pnl = $6, realized_pnl = $7,
                        position_count = $8, winning_positions = $9, losing_positions = $10
                    """, datetime.utcnow().date(), summary.total_value, summary.cash_balance,
                        summary.invested_value, summary.total_pnl, summary.unrealized_pnl,
                        summary.realized_pnl, summary.position_count, summary.winning_positions,
                        summary.losing_positions)
            
            logger.info("Daily portfolio snapshot saved")
            return True
            
        except Exception as e:
            logger.error(f"Error saving daily snapshot: {str(e)}")
            return False
    
    async def get_performance_history(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get portfolio performance history"""
        try:
            if not self.db_pool:
                return []
            
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT * FROM portfolio_snapshots 
                    WHERE date >= $1 
                    ORDER BY date ASC
                """, datetime.utcnow().date() - timedelta(days=days))
                
                history = []
                for row in rows:
                    history.append({
                        "date": row["date"].isoformat(),
                        "total_value": float(row["total_value"]),
                        "total_pnl": float(row["total_pnl"]),
                        "pnl_pct": float(row["total_pnl"] / self.initial_capital * 100),
                        "position_count": row["position_count"],
                        "win_rate": float(row["winning_positions"] / max(row["position_count"], 1) * 100)
                    })
                
                return history
                
        except Exception as e:
            logger.error(f"Error getting performance history: {str(e)}")
            return []
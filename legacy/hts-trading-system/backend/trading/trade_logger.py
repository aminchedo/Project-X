"""
HTS Trading System - Trade Logger
P&L tracking and trade history management.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from decimal import Decimal

import asyncpg

logger = logging.getLogger(__name__)

class TradeLogger:
    """Trade logging and P&L tracking system"""
    
    def __init__(self, db_pool: Optional[asyncpg.Pool] = None):
        self.db_pool = db_pool
    
    async def log_trade(self, trade_data: Dict[str, Any]) -> Optional[int]:
        """Log a new trade"""
        try:
            required_fields = ["symbol", "side", "quantity", "price"]
            for field in required_fields:
                if field not in trade_data:
                    raise ValueError(f"Missing required field: {field}")
            
            symbol = trade_data["symbol"]
            side = trade_data["side"]  # "BUY" or "SELL"
            quantity = Decimal(str(trade_data["quantity"]))
            price = Decimal(str(trade_data["price"]))
            pnl = Decimal(str(trade_data.get("pnl", 0)))
            fees = Decimal(str(trade_data.get("fees", 0)))
            
            # Calculate trade value
            trade_value = quantity * price
            
            if self.db_pool:
                async with self.db_pool.acquire() as conn:
                    trade_id = await conn.fetchval("""
                        INSERT INTO trades (
                            symbol, side, quantity, price, trade_value, 
                            pnl, fees, executed_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING id
                    """, symbol, side, quantity, price, trade_value, 
                        pnl, fees, datetime.utcnow())
                    
                    logger.info(f"Trade logged: {symbol} {side} {quantity} @ {price}")
                    return trade_id
            
            return None
            
        except Exception as e:
            logger.error(f"Error logging trade: {str(e)}")
            return None
    
    async def get_trade_history(
        self, 
        limit: int = 100, 
        symbol: Optional[str] = None,
        days: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Get trade history with optional filters"""
        try:
            if not self.db_pool:
                return []
            
            # Build query with filters
            query = "SELECT * FROM trades WHERE 1=1"
            params = []
            param_count = 0
            
            if symbol:
                param_count += 1
                query += f" AND symbol = ${param_count}"
                params.append(symbol)
            
            if days:
                param_count += 1
                cutoff_date = datetime.utcnow() - timedelta(days=days)
                query += f" AND executed_at >= ${param_count}"
                params.append(cutoff_date)
            
            query += " ORDER BY executed_at DESC"
            
            if limit:
                param_count += 1
                query += f" LIMIT ${param_count}"
                params.append(limit)
            
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                
                trades = []
                for row in rows:
                    trade = {
                        "id": row["id"],
                        "symbol": row["symbol"],
                        "side": row["side"],
                        "quantity": float(row["quantity"]),
                        "price": float(row["price"]),
                        "trade_value": float(row["trade_value"]),
                        "pnl": float(row["pnl"]),
                        "fees": float(row.get("fees", 0)),
                        "executed_at": row["executed_at"].isoformat()
                    }
                    trades.append(trade)
                
                return trades
            
        except Exception as e:
            logger.error(f"Error getting trade history: {str(e)}")
            return []
    
    async def get_pnl_summary(
        self, 
        symbol: Optional[str] = None,
        days: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get P&L summary statistics"""
        try:
            if not self.db_pool:
                return {}
            
            # Build query with filters
            query = "SELECT * FROM trades WHERE 1=1"
            params = []
            param_count = 0
            
            if symbol:
                param_count += 1
                query += f" AND symbol = ${param_count}"
                params.append(symbol)
            
            if days:
                param_count += 1
                cutoff_date = datetime.utcnow() - timedelta(days=days)
                query += f" AND executed_at >= ${param_count}"
                params.append(cutoff_date)
            
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                
                if not rows:
                    return {
                        "total_pnl": 0.0,
                        "total_fees": 0.0,
                        "net_pnl": 0.0,
                        "total_trades": 0,
                        "winning_trades": 0,
                        "losing_trades": 0,
                        "win_rate": 0.0,
                        "avg_win": 0.0,
                        "avg_loss": 0.0,
                        "profit_factor": 0.0,
                        "largest_win": 0.0,
                        "largest_loss": 0.0,
                        "total_volume": 0.0
                    }
                
                # Calculate statistics
                total_pnl = sum(float(row["pnl"]) for row in rows)
                total_fees = sum(float(row.get("fees", 0)) for row in rows)
                net_pnl = total_pnl - total_fees
                
                winning_trades = [row for row in rows if float(row["pnl"]) > 0]
                losing_trades = [row for row in rows if float(row["pnl"]) < 0]
                
                total_trades = len(rows)
                win_count = len(winning_trades)
                loss_count = len(losing_trades)
                win_rate = win_count / total_trades * 100 if total_trades > 0 else 0
                
                avg_win = sum(float(row["pnl"]) for row in winning_trades) / win_count if win_count > 0 else 0
                avg_loss = sum(float(row["pnl"]) for row in losing_trades) / loss_count if loss_count > 0 else 0
                
                gross_profit = sum(float(row["pnl"]) for row in winning_trades)
                gross_loss = abs(sum(float(row["pnl"]) for row in losing_trades))
                profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
                
                largest_win = max(float(row["pnl"]) for row in rows) if rows else 0
                largest_loss = min(float(row["pnl"]) for row in rows) if rows else 0
                
                total_volume = sum(float(row["trade_value"]) for row in rows)
                
                return {
                    "total_pnl": round(total_pnl, 2),
                    "total_fees": round(total_fees, 2),
                    "net_pnl": round(net_pnl, 2),
                    "total_trades": total_trades,
                    "winning_trades": win_count,
                    "losing_trades": loss_count,
                    "win_rate": round(win_rate, 2),
                    "avg_win": round(avg_win, 2),
                    "avg_loss": round(avg_loss, 2),
                    "profit_factor": round(profit_factor, 2) if profit_factor != float('inf') else 999.99,
                    "largest_win": round(largest_win, 2),
                    "largest_loss": round(largest_loss, 2),
                    "total_volume": round(total_volume, 2)
                }
            
        except Exception as e:
            logger.error(f"Error getting P&L summary: {str(e)}")
            return {}
    
    async def get_daily_pnl(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get daily P&L breakdown"""
        try:
            if not self.db_pool:
                return []
            
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT 
                        DATE(executed_at) as trade_date,
                        SUM(pnl) as daily_pnl,
                        SUM(fees) as daily_fees,
                        COUNT(*) as trade_count,
                        SUM(trade_value) as daily_volume
                    FROM trades 
                    WHERE executed_at >= $1
                    GROUP BY DATE(executed_at)
                    ORDER BY trade_date ASC
                """, cutoff_date)
                
                daily_pnl = []
                for row in rows:
                    daily_pnl.append({
                        "date": row["trade_date"].isoformat(),
                        "pnl": float(row["daily_pnl"]),
                        "fees": float(row["daily_fees"]),
                        "net_pnl": float(row["daily_pnl"]) - float(row["daily_fees"]),
                        "trade_count": row["trade_count"],
                        "volume": float(row["daily_volume"])
                    })
                
                return daily_pnl
            
        except Exception as e:
            logger.error(f"Error getting daily P&L: {str(e)}")
            return []
    
    async def get_symbol_performance(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get performance breakdown by symbol"""
        try:
            if not self.db_pool:
                return []
            
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT 
                        symbol,
                        SUM(pnl) as total_pnl,
                        SUM(fees) as total_fees,
                        COUNT(*) as trade_count,
                        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
                        AVG(pnl) as avg_pnl,
                        MAX(pnl) as best_trade,
                        MIN(pnl) as worst_trade,
                        SUM(trade_value) as total_volume
                    FROM trades 
                    WHERE executed_at >= $1
                    GROUP BY symbol
                    ORDER BY total_pnl DESC
                """, cutoff_date)
                
                performance = []
                for row in rows:
                    win_rate = float(row["winning_trades"]) / row["trade_count"] * 100 if row["trade_count"] > 0 else 0
                    
                    performance.append({
                        "symbol": row["symbol"],
                        "total_pnl": float(row["total_pnl"]),
                        "total_fees": float(row["total_fees"]),
                        "net_pnl": float(row["total_pnl"]) - float(row["total_fees"]),
                        "trade_count": row["trade_count"],
                        "winning_trades": row["winning_trades"],
                        "win_rate": round(win_rate, 2),
                        "avg_pnl": float(row["avg_pnl"]),
                        "best_trade": float(row["best_trade"]),
                        "worst_trade": float(row["worst_trade"]),
                        "total_volume": float(row["total_volume"])
                    })
                
                return performance
            
        except Exception as e:
            logger.error(f"Error getting symbol performance: {str(e)}")
            return []
    
    async def get_trade_analytics(self, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive trade analytics"""
        try:
            # Get basic P&L summary
            pnl_summary = await self.get_pnl_summary(days=days)
            
            # Get daily P&L
            daily_pnl = await self.get_daily_pnl(days)
            
            # Get symbol performance
            symbol_performance = await self.get_symbol_performance(days)
            
            # Calculate additional metrics
            if daily_pnl:
                daily_returns = [day["net_pnl"] for day in daily_pnl]
                
                # Sharpe ratio (simplified)
                avg_daily_return = sum(daily_returns) / len(daily_returns)
                std_daily_return = (sum((r - avg_daily_return) ** 2 for r in daily_returns) / len(daily_returns)) ** 0.5
                sharpe_ratio = (avg_daily_return * (365 ** 0.5)) / std_daily_return if std_daily_return > 0 else 0
                
                # Max drawdown
                cumulative_pnl = []
                running_total = 0
                for day in daily_pnl:
                    running_total += day["net_pnl"]
                    cumulative_pnl.append(running_total)
                
                peak = cumulative_pnl[0]
                max_drawdown = 0
                for value in cumulative_pnl:
                    if value > peak:
                        peak = value
                    drawdown = peak - value
                    if drawdown > max_drawdown:
                        max_drawdown = drawdown
            else:
                sharpe_ratio = 0
                max_drawdown = 0
            
            return {
                "pnl_summary": pnl_summary,
                "daily_pnl": daily_pnl,
                "symbol_performance": symbol_performance,
                "sharpe_ratio": round(sharpe_ratio, 3),
                "max_drawdown": round(max_drawdown, 2),
                "analysis_period_days": days
            }
            
        except Exception as e:
            logger.error(f"Error getting trade analytics: {str(e)}")
            return {}
    
    async def export_trades_csv(
        self, 
        days: Optional[int] = None,
        symbol: Optional[str] = None
    ) -> str:
        """Export trades to CSV format"""
        try:
            trades = await self.get_trade_history(
                limit=None, 
                symbol=symbol, 
                days=days
            )
            
            if not trades:
                return "No trades found for the specified criteria."
            
            # CSV header
            csv_content = "ID,Symbol,Side,Quantity,Price,Trade Value,P&L,Fees,Executed At\n"
            
            # CSV rows
            for trade in trades:
                csv_content += f"{trade['id']},{trade['symbol']},{trade['side']},"
                csv_content += f"{trade['quantity']},{trade['price']},{trade['trade_value']},"
                csv_content += f"{trade['pnl']},{trade['fees']},{trade['executed_at']}\n"
            
            return csv_content
            
        except Exception as e:
            logger.error(f"Error exporting trades to CSV: {str(e)}")
            return f"Error exporting trades: {str(e)}"
    
    async def calculate_tax_report(self, tax_year: int) -> Dict[str, Any]:
        """Generate tax report for specified year"""
        try:
            if not self.db_pool:
                return {}
            
            start_date = datetime(tax_year, 1, 1)
            end_date = datetime(tax_year + 1, 1, 1)
            
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT * FROM trades 
                    WHERE executed_at >= $1 AND executed_at < $2
                    ORDER BY executed_at ASC
                """, start_date, end_date)
                
                if not rows:
                    return {
                        "tax_year": tax_year,
                        "total_realized_pnl": 0.0,
                        "short_term_gains": 0.0,
                        "long_term_gains": 0.0,
                        "total_trades": 0,
                        "total_fees": 0.0
                    }
                
                total_realized_pnl = sum(float(row["pnl"]) for row in rows)
                total_fees = sum(float(row.get("fees", 0)) for row in rows)
                
                # Simplified classification (all as short-term for demo)
                short_term_gains = sum(float(row["pnl"]) for row in rows if float(row["pnl"]) > 0)
                short_term_losses = sum(float(row["pnl"]) for row in rows if float(row["pnl"]) < 0)
                
                return {
                    "tax_year": tax_year,
                    "total_realized_pnl": round(total_realized_pnl, 2),
                    "short_term_gains": round(short_term_gains, 2),
                    "short_term_losses": round(abs(short_term_losses), 2),
                    "long_term_gains": 0.0,  # Would need position tracking for accurate calculation
                    "long_term_losses": 0.0,
                    "total_trades": len(rows),
                    "total_fees": round(total_fees, 2),
                    "net_short_term": round(short_term_gains + short_term_losses, 2)
                }
            
        except Exception as e:
            logger.error(f"Error calculating tax report: {str(e)}")
            return {}
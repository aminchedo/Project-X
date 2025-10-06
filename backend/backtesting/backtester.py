import asyncio
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
from dataclasses import dataclass

from ..data.kucoin_client import kucoin_client
from ..analytics.core_signals import generate_rsi_macd_signal, calculate_trend_strength
from ..analytics.smc_analysis import analyze_smart_money_concepts
from ..analytics.pattern_detection import detect_candlestick_patterns
from ..analytics.sentiment import SentimentAnalyzer
from ..analytics.ml_predictor import ml_predictor
from .trade_simulator import TradeSimulator

@dataclass
class BacktestConfig:
    symbol: str
    start_date: str
    end_date: str
    initial_capital: float = 10000
    commission: float = 0.001
    slippage: float = 0.0005

@dataclass
class BacktestResults:
    backtest_id: str
    config: BacktestConfig
    total_return: float
    total_return_pct: float
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float
    max_drawdown_pct: float
    win_rate: float
    profit_factor: float
    avg_trade_duration: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    largest_win: float
    largest_loss: float
    equity_curve: List[Dict]
    trades: List[Dict]
    monthly_returns: Dict
    performance_metrics: Dict

class BacktestEngine:
    def __init__(self):
        self.sentiment_analyzer = SentimentAnalyzer()
        self.results_cache = {}
        
    async def run_backtest(self, config: BacktestConfig) -> BacktestResults:
        """Run comprehensive backtest with HTS scoring algorithm"""
        backtest_id = str(uuid.uuid4())
        
        try:
            # Fetch historical OHLCV data
            print(f"Fetching historical data for {config.symbol}...")
            ohlcv_data = await self._fetch_historical_data(
                config.symbol, config.start_date, config.end_date
            )
            
            if ohlcv_data.empty:
                raise ValueError("No historical data available for the specified period")
            
            # Initialize trade simulator
            simulator = TradeSimulator(config.initial_capital, config.commission, config.slippage)
            
            # Initialize tracking variables
            equity_curve = []
            signals = []
            
            print(f"Processing {len(ohlcv_data)} data points...")
            
            # Process each timeframe
            for i in range(100, len(ohlcv_data)):  # Start after 100 periods for indicators
                current_data = ohlcv_data.iloc[:i+1]
                current_price = current_data.iloc[-1]['close']
                current_time = current_data.iloc[-1]['timestamp']
                
                # Generate HTS signal
                signal = await self._generate_hts_signal(current_data, config.symbol)
                
                if signal and signal['action'] != 'HOLD':
                    signals.append(signal)
                    
                    # Execute signal in simulator
                    trade_result = simulator.execute_signal(signal, current_price, current_time)
                    
                    if trade_result:
                        print(f"Executed {signal['action']} at {current_price} with confidence {signal['confidence']:.2f}")
                
                # Record equity curve point
                portfolio_value = simulator.get_portfolio_value(current_price)
                equity_curve.append({
                    'timestamp': current_time,
                    'portfolio_value': portfolio_value,
                    'cash': simulator.cash,
                    'positions_value': portfolio_value - simulator.cash,
                    'total_return': portfolio_value - config.initial_capital,
                    'total_return_pct': (portfolio_value - config.initial_capital) / config.initial_capital * 100
                })
            
            # Calculate performance metrics
            trades = simulator.get_completed_trades()
            metrics = await self.calculate_performance_metrics(trades, equity_curve, config.initial_capital)
            
            # Create results object
            results = BacktestResults(
                backtest_id=backtest_id,
                config=config,
                total_return=metrics['total_return'],
                total_return_pct=metrics['total_return_pct'],
                sharpe_ratio=metrics['sharpe_ratio'],
                sortino_ratio=metrics['sortino_ratio'],
                max_drawdown=metrics['max_drawdown'],
                max_drawdown_pct=metrics['max_drawdown_pct'],
                win_rate=metrics['win_rate'],
                profit_factor=metrics['profit_factor'],
                avg_trade_duration=metrics['avg_trade_duration'],
                total_trades=metrics['total_trades'],
                winning_trades=metrics['winning_trades'],
                losing_trades=metrics['losing_trades'],
                largest_win=metrics['largest_win'],
                largest_loss=metrics['largest_loss'],
                equity_curve=equity_curve,
                trades=trades,
                monthly_returns=metrics['monthly_returns'],
                performance_metrics=metrics
            )
            
            # Cache results
            self.results_cache[backtest_id] = results
            
            print(f"Backtest completed. Total Return: {metrics['total_return_pct']:.2f}%, Sharpe: {metrics['sharpe_ratio']:.2f}")
            
            return results
            
        except Exception as e:
            print(f"Backtest failed: {str(e)}")
            raise
    
    async def _fetch_historical_data(self, symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Fetch historical OHLCV data from KuCoin"""
        try:
            # Convert dates to timestamps
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            
            start_timestamp = int(start_dt.timestamp())
            end_timestamp = int(end_dt.timestamp())
            
            # Fetch data in chunks (KuCoin has limits)
            all_data = []
            current_start = start_timestamp
            chunk_size = 7 * 24 * 60 * 60  # 7 days in seconds
            
            while current_start < end_timestamp:
                current_end = min(current_start + chunk_size, end_timestamp)
                
                data = await kucoin_client.get_historical_ohlcv(
                    symbol, 
                    timeframe='1hour',
                    start_time=current_start,
                    end_time=current_end
                )
                
                if data:
                    all_data.extend(data)
                
                current_start = current_end
                await asyncio.sleep(0.1)  # Rate limiting
            
            if not all_data:
                return pd.DataFrame()
            
            # Convert to DataFrame
            df = pd.DataFrame(all_data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
            df = df.sort_values('timestamp').reset_index(drop=True)
            
            # Convert price columns to float
            price_columns = ['open', 'high', 'low', 'close', 'volume']
            for col in price_columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
            return df
            
        except Exception as e:
            print(f"Error fetching historical data: {str(e)}")
            return pd.DataFrame()
    
    async def _generate_hts_signal(self, ohlcv_data: pd.DataFrame, symbol: str) -> Optional[Dict]:
        """Generate HTS signal using all analytics components"""
        try:
            if len(ohlcv_data) < 50:
                return None
            
            # Get current price
            current_price = ohlcv_data.iloc[-1]['close']
            
            # Component 1: RSI/MACD Signal
            rsi_macd_data = generate_rsi_macd_signal(ohlcv_data)
            rsi_macd_score = rsi_macd_data.get('signal_strength', 0)
            
            # Component 2: Smart Money Concepts
            smc_data = analyze_smart_money_concepts(ohlcv_data)
            smc_score = smc_data.get('overall_bias', 0) / 100.0  # Normalize to 0-1
            
            # Component 3: Pattern Detection
            pattern_data = detect_candlestick_patterns(ohlcv_data)
            pattern_score = pattern_data.get('bullish_strength', 0) - pattern_data.get('bearish_strength', 0)
            pattern_score = max(-1, min(1, pattern_score))  # Clamp to -1,1
            
            # Component 4: Sentiment (simplified for backtesting)
            sentiment_score = 0  # Would use historical sentiment if available
            
            # Component 5: ML Prediction
            try:
                ml_data = await ml_predictor.predict_price_movement(ohlcv_data, symbol)
                ml_score = ml_data.get('confidence', 0)
            except:
                ml_score = 0
            
            # Calculate final score (exact weights per spec)
            final_score = (
                0.40 * rsi_macd_score +
                0.25 * smc_score +
                0.20 * pattern_score +
                0.10 * sentiment_score +
                0.05 * ml_score
            )
            final_score_pct = max(0.0, min(100.0, final_score * 100.0))

            # Determine action based on threshold bands
            if final_score_pct >= 60:
                action = 'BUY'
                confidence = min(1.0, final_score)
            elif final_score_pct <= 25:
                action = 'SELL'
                confidence = min(1.0, 1.0 - (final_score if final_score <= 1 else 1.0))
            else:
                action = 'HOLD'
                confidence = 0.5
            
            if action == 'HOLD':
                return None
            
            return {
                'symbol': symbol,
                'action': action,
                'confidence': confidence,
                'final_score': final_score,
                'rsi_macd_score': rsi_macd_score,
                'smc_score': smc_score,
                'pattern_score': pattern_score,
                'sentiment_score': sentiment_score,
                'ml_score': ml_score,
                'timestamp': ohlcv_data.iloc[-1]['timestamp'],
                'price': current_price
            }
            
        except Exception as e:
            print(f"Error generating signal: {str(e)}")
            return None
    
    async def calculate_performance_metrics(self, trades: List[Dict], equity_curve: List[Dict], initial_capital: float) -> Dict:
        """Calculate comprehensive performance metrics"""
        if not trades or not equity_curve:
            return self._get_empty_metrics()
        
        # Basic trade statistics
        total_trades = len(trades)
        winning_trades = len([t for t in trades if t['pnl'] > 0])
        losing_trades = len([t for t in trades if t['pnl'] < 0])
        win_rate = winning_trades / total_trades if total_trades > 0 else 0
        
        # P&L calculations
        total_pnl = sum(t['pnl'] for t in trades)
        total_return_pct = (total_pnl / initial_capital) * 100
        
        gross_profit = sum(t['pnl'] for t in trades if t['pnl'] > 0)
        gross_loss = abs(sum(t['pnl'] for t in trades if t['pnl'] < 0))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float('inf')
        
        # Largest win/loss
        largest_win = max([t['pnl'] for t in trades]) if trades else 0
        largest_loss = min([t['pnl'] for t in trades]) if trades else 0
        
        # Average trade duration
        avg_duration = 0
        if trades:
            durations = []
            for trade in trades:
                if trade.get('exit_time') and trade.get('entry_time'):
                    duration = (trade['exit_time'] - trade['entry_time']).total_seconds() / 3600  # hours
                    durations.append(duration)
            avg_duration = np.mean(durations) if durations else 0
        
        # Equity curve analysis
        portfolio_values = [point['portfolio_value'] for point in equity_curve]
        returns = np.diff(portfolio_values) / portfolio_values[:-1]
        
        # Sharpe ratio (assuming risk-free rate of 0)
        if len(returns) > 1 and np.std(returns) > 0:
            sharpe_ratio = np.mean(returns) / np.std(returns) * np.sqrt(252 * 24)  # Hourly to annual
        else:
            sharpe_ratio = 0
        
        # Sortino ratio
        negative_returns = returns[returns < 0]
        if len(negative_returns) > 1 and np.std(negative_returns) > 0:
            sortino_ratio = np.mean(returns) / np.std(negative_returns) * np.sqrt(252 * 24)
        else:
            sortino_ratio = 0
        
        # Maximum drawdown
        rolling_max = np.maximum.accumulate(portfolio_values)
        drawdowns = (portfolio_values - rolling_max) / rolling_max
        max_drawdown_pct = abs(min(drawdowns)) * 100
        max_drawdown = abs(min(portfolio_values - rolling_max))
        
        # Monthly returns
        monthly_returns = self._calculate_monthly_returns(equity_curve)
        
        return {
            'total_return': total_pnl,
            'total_return_pct': total_return_pct,
            'sharpe_ratio': sharpe_ratio,
            'sortino_ratio': sortino_ratio,
            'max_drawdown': max_drawdown,
            'max_drawdown_pct': max_drawdown_pct,
            'win_rate': win_rate * 100,
            'profit_factor': profit_factor,
            'avg_trade_duration': avg_duration,
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'largest_win': largest_win,
            'largest_loss': largest_loss,
            'monthly_returns': monthly_returns,
            'gross_profit': gross_profit,
            'gross_loss': gross_loss
        }
    
    def _calculate_monthly_returns(self, equity_curve: List[Dict]) -> Dict:
        """Calculate monthly returns from equity curve"""
        if not equity_curve:
            return {}
        
        monthly_data = {}
        for point in equity_curve:
            timestamp = point['timestamp']
            portfolio_value = point['portfolio_value']
            
            # Create month key (YYYY-MM)
            month_key = timestamp.strftime('%Y-%m')
            
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    'start_value': portfolio_value,
                    'end_value': portfolio_value,
                    'start_date': timestamp
                }
            else:
                monthly_data[month_key]['end_value'] = portfolio_value
        
        # Calculate returns
        monthly_returns = {}
        for month, data in monthly_data.items():
            if data['start_value'] > 0:
                return_pct = (data['end_value'] - data['start_value']) / data['start_value'] * 100
                monthly_returns[month] = return_pct
        
        return monthly_returns
    
    def _get_empty_metrics(self) -> Dict:
        """Return empty metrics structure"""
        return {
            'total_return': 0,
            'total_return_pct': 0,
            'sharpe_ratio': 0,
            'sortino_ratio': 0,
            'max_drawdown': 0,
            'max_drawdown_pct': 0,
            'win_rate': 0,
            'profit_factor': 0,
            'avg_trade_duration': 0,
            'total_trades': 0,
            'winning_trades': 0,
            'losing_trades': 0,
            'largest_win': 0,
            'largest_loss': 0,
            'monthly_returns': {},
            'gross_profit': 0,
            'gross_loss': 0
        }
    
    def get_cached_results(self, backtest_id: str) -> Optional[BacktestResults]:
        """Get cached backtest results"""
        return self.results_cache.get(backtest_id)
    
    def export_results_csv(self, backtest_id: str) -> Optional[str]:
        """Export backtest results to CSV format"""
        results = self.get_cached_results(backtest_id)
        if not results:
            return None
        
        try:
            # Create CSV content
            csv_lines = [
                "HTS Trading System - Backtest Results",
                f"Backtest ID: {results.backtest_id}",
                f"Symbol: {results.config.symbol}",
                f"Period: {results.config.start_date} to {results.config.end_date}",
                f"Initial Capital: ${results.config.initial_capital:,.2f}",
                "",
                "Performance Metrics:",
                f"Total Return: ${results.total_return:,.2f} ({results.total_return_pct:.2f}%)",
                f"Sharpe Ratio: {results.sharpe_ratio:.3f}",
                f"Sortino Ratio: {results.sortino_ratio:.3f}",
                f"Maximum Drawdown: ${results.max_drawdown:,.2f} ({results.max_drawdown_pct:.2f}%)",
                f"Win Rate: {results.win_rate:.2f}%",
                f"Profit Factor: {results.profit_factor:.3f}",
                f"Total Trades: {results.total_trades}",
                f"Winning Trades: {results.winning_trades}",
                f"Losing Trades: {results.losing_trades}",
                "",
                "Trade History:",
                "Entry Time,Exit Time,Action,Entry Price,Exit Price,Quantity,P&L,Duration (hours)"
            ]
            
            # Add trade data
            for trade in results.trades:
                duration = 0
                if trade.get('exit_time') and trade.get('entry_time'):
                    duration = (trade['exit_time'] - trade['entry_time']).total_seconds() / 3600
                
                csv_lines.append(
                    f"{trade.get('entry_time', '')},{trade.get('exit_time', '')},"
                    f"{trade.get('action', '')},{trade.get('entry_price', 0):.4f},"
                    f"{trade.get('exit_price', 0):.4f},{trade.get('quantity', 0):.6f},"
                    f"{trade.get('pnl', 0):.2f},{duration:.2f}"
                )
            
            return "\n".join(csv_lines)
            
        except Exception as e:
            print(f"Error exporting CSV: {str(e)}")
            return None

# Global backtesting engine instance
backtest_engine = BacktestEngine()
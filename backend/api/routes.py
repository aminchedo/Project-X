"""
Enhanced API Routes for Phases 7, 8, and 9
"""

import asyncio
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import (
    ScoreRequest, ScanRequest, ScoreResponse, ScanResponse, 
    HealthResponse, WeightConfig, ScanRule
)
from ..detectors.harmonic import HarmonicDetector
from ..detectors.elliott import ElliottWaveDetector
from ..detectors.smc import SMCDetector
from ..detectors.fibonacci import FibonacciDetector
from ..detectors.price_action import PriceActionDetector
from ..detectors.sar import SARDetector
from ..detectors.sentiment import SentimentDetector
from ..detectors.news import NewsDetector
from ..detectors.whales import WhaleDetector
from ..scoring.engine import DynamicScoringEngine
from ..scoring.scanner import MultiTimeframeScanner
from ..backtesting.engine import BacktestEngine
from ..backtesting.models import BacktestConfig
from ..websocket.manager import manager
from ..websocket.live_scanner import live_scanner
from ..data.data_manager import data_manager

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api", tags=["enhanced"])

# Initialize services
detectors = {
    "harmonic": HarmonicDetector(),
    "elliott": ElliottWaveDetector(),
    "smc": SMCDetector(),
    "fibonacci": FibonacciDetector(),
    "price_action": PriceActionDetector(),
    "sar": SARDetector(),
    "sentiment": SentimentDetector(),
    "news": NewsDetector(),
    "whales": WhaleDetector()
}

default_weights = WeightConfig()
scoring_engine = DynamicScoringEngine(detectors, default_weights)
scanner = MultiTimeframeScanner(data_manager, scoring_engine, default_weights)
backtest_engine = BacktestEngine()

# Phase 7: Enhanced API Endpoints

@router.post("/signals/score", response_model=ScoreResponse)
async def score_signal(request: ScoreRequest):
    """
    Score a single symbol-timeframe combination
    
    Returns full component breakdown
    """
    try:
        # Get OHLCV data
        ohlcv = await data_manager.get_ohlcv_data(
            request.symbol,
            request.timeframe,
            limit=200
        )
        
        if ohlcv is None or ohlcv.empty:
            raise HTTPException(status_code=400, detail="No data available for symbol")
        
        # Use custom weights if provided
        if request.weights:
            scoring_engine.update_weights(request.weights)
        
        # Score the data
        result = await scoring_engine.score(ohlcv, request.context)
        
        return ScoreResponse(
            symbol=request.symbol,
            timeframe=request.timeframe,
            result=result
        )
    
    except Exception as e:
        logger.exception("Score endpoint failed")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scanner/run", response_model=ScanResponse)
async def run_scanner(request: ScanRequest, background_tasks: BackgroundTasks):
    """
    Scan multiple symbols across timeframes
    
    Returns ranked opportunities
    """
    try:
        # Use custom weights if provided
        if request.weights:
            scoring_engine.update_weights(request.weights)
        
        # Run scanner
        results = await scanner.scan(
            request.symbols,
            request.timeframes,
            request.rules
        )
        
        return ScanResponse(
            scan_time=datetime.now().isoformat(),
            symbols_scanned=len(request.symbols),
            opportunities_found=len(results),
            results=results
        )
    
    except Exception as e:
        logger.exception("Scanner endpoint failed")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config/weights")
async def get_weights():
    """Get current weight configuration"""
    return default_weights.dict()

@router.post("/config/weights")
async def update_weights(weights: WeightConfig):
    """Update detector weights"""
    try:
        weights.validate_sum()
        default_weights = weights
        scoring_engine.update_weights(weights)
        scanner = MultiTimeframeScanner(data_manager, scoring_engine, weights)
        
        return {"status": "success", "weights": weights.dict()}
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    provider_health = {}
    
    # Check data manager health
    try:
        provider_health["data_manager"] = True
    except:
        provider_health["data_manager"] = False
    
    return HealthResponse(
        status="healthy",
        providers=provider_health,
        detectors=list(detectors.keys()),
        timestamp=datetime.now().isoformat()
    )

# Phase 8: Backtesting Endpoints

@router.post("/backtest/run")
async def run_backtest(
    symbol: str = "BTCUSDT",
    timeframe: str = "1h",
    start_date: str = "2024-01-01",
    end_date: str = "2024-02-01",
    initial_capital: float = 10000.0,
    min_score: float = 0.65,
    min_confidence: float = 0.6
):
    """Run a comprehensive backtest"""
    try:
        # Parse dates
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
        
        # Define entry and exit rules
        entry_rules = {
            "min_score": min_score,
            "min_confidence": min_confidence
        }
        
        exit_rules = {
            "use_trailing": True,
            "time_stop_bars": 24
        }
        
        # Run backtest
        result = await backtest_engine.run(
            symbol=symbol,
            timeframe=timeframe,
            start_date=start_dt,
            end_date=end_dt,
            scoring_engine=scoring_engine,
            risk_manager=None,  # Would use real risk manager
            entry_rules=entry_rules,
            exit_rules=exit_rules
        )
        
        return result
    
    except Exception as e:
        logger.exception("Backtest failed")
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

@router.get("/backtest/results/{backtest_id}")
async def get_backtest_results(backtest_id: str):
    """Get detailed backtest results"""
    try:
        results = backtest_engine.get_cached_results(backtest_id)
        
        if not results:
            raise HTTPException(status_code=404, detail="Backtest results not found")
        
        return {
            "backtest_id": results.backtest_id,
            "config": {
                "symbol": results.config.symbol,
                "timeframe": results.config.timeframe,
                "start_date": results.config.start_date.isoformat(),
                "end_date": results.config.end_date.isoformat(),
                "initial_capital": results.config.initial_capital
            },
            "performance_metrics": {
                "total_return": results.metrics.total_pnl,
                "total_return_pct": results.metrics.total_return_pct,
                "sharpe_ratio": results.metrics.sharpe_ratio,
                "sortino_ratio": results.metrics.sortino_ratio,
                "max_drawdown": results.metrics.max_drawdown,
                "max_drawdown_pct": results.metrics.max_drawdown_pct,
                "win_rate": results.metrics.win_rate,
                "profit_factor": results.metrics.profit_factor,
                "total_trades": results.metrics.total_trades,
                "winning_trades": results.metrics.winning_trades,
                "losing_trades": results.metrics.losing_trades,
                "largest_win": results.metrics.largest_win,
                "largest_loss": results.metrics.largest_loss,
                "avg_trade_duration": str(results.metrics.avg_trade_duration),
                "cagr": results.metrics.cagr,
                "kelly_criterion": results.metrics.kelly_criterion
            },
            "equity_curve": results.equity_curve[-100:],  # Last 100 points
            "trades": [
                {
                    "entry_time": trade.entry_time.isoformat(),
                    "exit_time": trade.exit_time.isoformat(),
                    "direction": trade.direction,
                    "entry_price": trade.entry_price,
                    "exit_price": trade.exit_price,
                    "quantity": trade.quantity,
                    "pnl": trade.pnl,
                    "pnl_pct": trade.pnl_pct,
                    "exit_reason": trade.exit_reason,
                    "r_multiple": trade.r_multiple
                }
                for trade in results.trades[-50:]  # Last 50 trades
            ],
            "monthly_returns": results.monthly_returns
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting backtest results")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/backtest/export/{backtest_id}")
async def export_backtest_csv(backtest_id: str):
    """Export backtest results as CSV"""
    try:
        csv_content = backtest_engine.export_results_csv(backtest_id)
        
        if not csv_content:
            raise HTTPException(status_code=404, detail="Backtest results not found")
        
        from fastapi.responses import Response
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=backtest_{backtest_id}.csv"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error exporting backtest results")
        raise HTTPException(status_code=500, detail=str(e))

# Phase 9: WebSocket Endpoints

@router.websocket("/ws")
async def websocket_endpoint(websocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_json()
            
            action = data.get("action")
            
            if action == "subscribe":
                symbol = data.get("symbol")
                if symbol:
                    await manager.subscribe(websocket, symbol)
                    await websocket.send_json({
                        "type": "subscription_confirmed",
                        "symbol": symbol
                    })
            
            elif action == "unsubscribe":
                symbol = data.get("symbol")
                if symbol:
                    await manager.unsubscribe(websocket, symbol)
            
            elif action == "ping":
                await websocket.send_json({"type": "pong"})
            
            elif action == "get_status":
                status = manager.get_connection_stats()
                await websocket.send_json({
                    "type": "status",
                    "data": status
                })
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    
    finally:
        manager.disconnect(websocket)

# Live Scanner Endpoints

@router.post("/scanner/start")
async def start_live_scanner():
    """Start the live scanner"""
    try:
        if live_scanner is None:
            raise HTTPException(status_code=500, detail="Live scanner not initialized")
        
        await live_scanner.start()
        return {"status": "success", "message": "Live scanner started"}
    
    except Exception as e:
        logger.exception("Error starting live scanner")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scanner/stop")
async def stop_live_scanner():
    """Stop the live scanner"""
    try:
        if live_scanner is None:
            raise HTTPException(status_code=500, detail="Live scanner not initialized")
        
        await live_scanner.stop()
        return {"status": "success", "message": "Live scanner stopped"}
    
    except Exception as e:
        logger.exception("Error stopping live scanner")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scanner/status")
async def get_scanner_status():
    """Get live scanner status"""
    try:
        if live_scanner is None:
            return {"status": "not_initialized"}
        
        return live_scanner.get_scanner_status()
    
    except Exception as e:
        logger.exception("Error getting scanner status")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/scanner/force-scan")
async def force_scan(symbols: List[str] = None):
    """Force immediate market scan"""
    try:
        if live_scanner is None:
            raise HTTPException(status_code=500, detail="Live scanner not initialized")
        
        await live_scanner.force_scan(symbols)
        return {"status": "success", "message": "Force scan completed"}
    
    except Exception as e:
        logger.exception("Error in force scan")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scanner/symbol/{symbol}")
async def get_symbol_score(symbol: str):
    """Get current score for a specific symbol"""
    try:
        if live_scanner is None:
            raise HTTPException(status_code=500, detail="Live scanner not initialized")
        
        result = await live_scanner.get_symbol_score(symbol)
        return result
    
    except Exception as e:
        logger.exception("Error getting symbol score")
        raise HTTPException(status_code=500, detail=str(e))

# System Status Endpoints

@router.get("/system/status")
async def get_system_status():
    """Get comprehensive system status"""
    try:
        # Get connection stats
        connection_stats = manager.get_connection_stats()
        
        # Get scanner status
        scanner_status = live_scanner.get_scanner_status() if live_scanner else {"status": "not_initialized"}
        
        # Get detector status
        detector_status = scoring_engine.get_detector_status()
        
        return {
            "timestamp": datetime.now().isoformat(),
            "connections": connection_stats,
            "scanner": scanner_status,
            "detectors": detector_status,
            "system_health": "healthy"
        }
    
    except Exception as e:
        logger.exception("Error getting system status")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/system/broadcast")
async def broadcast_message(message: dict):
    """Broadcast message to all WebSocket clients"""
    try:
        await manager.broadcast(message)
        return {"status": "success", "message": "Message broadcasted"}
    
    except Exception as e:
        logger.exception("Error broadcasting message")
        raise HTTPException(status_code=500, detail=str(e))
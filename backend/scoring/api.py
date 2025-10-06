"""
API Endpoints for Phase 4 Scoring System
Provides REST API for scoring and scanning functionality
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import asyncio
import structlog

from .engine import DynamicScoringEngine, WeightConfig, CombinedScore
from .mtf_scanner import MultiTimeframeScanner, ScanRule, ScanResult
from .detector_adapters import create_detectors
from ..data.data_manager import DataManager
from ..auth.jwt_auth import get_current_user

logger = structlog.get_logger()

# Create router
router = APIRouter(prefix="/api/v1/scoring", tags=["scoring"])

# Global instances (would be injected via dependency injection in production)
detectors = create_detectors()
default_weights = WeightConfig()
scoring_engine = DynamicScoringEngine(detectors, default_weights)
data_manager = DataManager()

# Request/Response models
class ScoreRequest(BaseModel):
    symbol: str = Field(..., description="Trading symbol (e.g., BTC/USDT)")
    timeframe: str = Field(default="1h", description="Timeframe (5m, 15m, 1h, 4h, 1d)")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Optional market context")

class ScoreResponse(BaseModel):
    symbol: str
    timeframe: str
    score: CombinedScore
    timestamp: int

class ScanRequest(BaseModel):
    symbols: List[str] = Field(..., description="List of symbols to scan")
    timeframes: List[str] = Field(default=["15m", "1h", "4h"], description="Timeframes to scan")
    rules: Optional[ScanRule] = Field(default=None, description="Scan filtering rules")

class ScanResponse(BaseModel):
    results: List[ScanResult]
    total_scanned: int
    opportunities_found: int
    timestamp: int

class WeightUpdateRequest(BaseModel):
    weights: WeightConfig

class WeightResponse(BaseModel):
    weights: WeightConfig
    message: str

# API Endpoints

@router.post("/score", response_model=ScoreResponse)
async def score_symbol(
    request: ScoreRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Score a single symbol using the dynamic scoring engine
    """
    try:
        # Get OHLCV data
        ohlcv = await data_manager.get_ohlcv(request.symbol, request.timeframe, limit=200)
        
        if not ohlcv:
            raise HTTPException(status_code=404, detail=f"No data found for {request.symbol} {request.timeframe}")
        
        # Convert to OHLCVBar format
        ohlcv_bars = [
            {
                "ts": int(candle["timestamp"] * 1000),
                "open": float(candle["open"]),
                "high": float(candle["high"]),
                "low": float(candle["low"]),
                "close": float(candle["close"]),
                "volume": float(candle["volume"])
            }
            for candle in ohlcv
        ]
        
        # Score the symbol
        score = await scoring_engine.score(ohlcv_bars, request.context)
        
        return ScoreResponse(
            symbol=request.symbol,
            timeframe=request.timeframe,
            score=score,
            timestamp=int(asyncio.get_event_loop().time() * 1000)
        )
        
    except Exception as e:
        logger.error("Scoring failed", symbol=request.symbol, error=str(e))
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")

@router.post("/scan", response_model=ScanResponse)
async def scan_symbols(
    request: ScanRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Scan multiple symbols across multiple timeframes
    """
    try:
        # Create scanner
        scanner = MultiTimeframeScanner(data_manager, scoring_engine, default_weights)
        
        # Run scan
        results = await scanner.scan(
            symbols=request.symbols,
            timeframes=request.timeframes,
            rules=request.rules
        )
        
        return ScanResponse(
            results=results,
            total_scanned=len(request.symbols),
            opportunities_found=len(results),
            timestamp=int(asyncio.get_event_loop().time() * 1000)
        )
        
    except Exception as e:
        logger.error("Scan failed", symbols=request.symbols, error=str(e))
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@router.get("/scan/quick", response_model=ScanResponse)
async def quick_scan(
    symbols: str = "BTC/USDT,ETH/USDT,BNB/USDT",
    timeframes: str = "15m,1h,4h",
    mode: str = "conservative",
    current_user: dict = Depends(get_current_user)
):
    """
    Quick scan with query parameters
    """
    try:
        symbol_list = [s.strip() for s in symbols.split(",")]
        timeframe_list = [tf.strip() for tf in timeframes.split(",")]
        
        # Create scan rules
        rules = ScanRule(mode=mode)
        
        # Create scanner
        scanner = MultiTimeframeScanner(data_manager, scoring_engine, default_weights)
        
        # Run scan
        results = await scanner.scan(
            symbols=symbol_list,
            timeframes=timeframe_list,
            rules=rules
        )
        
        return ScanResponse(
            results=results,
            total_scanned=len(symbol_list),
            opportunities_found=len(results),
            timestamp=int(asyncio.get_event_loop().time() * 1000)
        )
        
    except Exception as e:
        logger.error("Quick scan failed", symbols=symbols, error=str(e))
        raise HTTPException(status_code=500, detail=f"Quick scan failed: {str(e)}")

@router.get("/weights", response_model=WeightResponse)
async def get_weights(current_user: dict = Depends(get_current_user)):
    """
    Get current detector weights
    """
    return WeightResponse(
        weights=default_weights,
        message="Current detector weights"
    )

@router.put("/weights", response_model=WeightResponse)
async def update_weights(
    request: WeightUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update detector weights
    """
    try:
        # Validate weights
        request.weights.validate_sum()
        
        # Update global weights
        global default_weights, scoring_engine
        default_weights = request.weights
        scoring_engine = DynamicScoringEngine(detectors, default_weights)
        
        return WeightResponse(
            weights=default_weights,
            message="Weights updated successfully"
        )
        
    except Exception as e:
        logger.error("Weight update failed", error=str(e))
        raise HTTPException(status_code=400, detail=f"Weight update failed: {str(e)}")

@router.get("/detectors")
async def get_detectors(current_user: dict = Depends(get_current_user)):
    """
    Get available detectors and their status
    """
    detector_info = {}
    for name, detector in detectors.items():
        detector_info[name] = {
            "name": name,
            "class": detector.__class__.__name__,
            "status": "active"
        }
    
    return {
        "detectors": detector_info,
        "total": len(detectors)
    }

@router.get("/health")
async def health_check():
    """
    Health check for scoring system
    """
    try:
        # Test with a simple symbol
        test_symbol = "BTC/USDT"
        test_timeframe = "1h"
        
        ohlcv = await data_manager.get_ohlcv(test_symbol, test_timeframe, limit=100)
        
        if not ohlcv:
            return {"status": "unhealthy", "message": "No data available"}
        
        # Convert to OHLCVBar format
        ohlcv_bars = [
            {
                "ts": int(candle["timestamp"] * 1000),
                "open": float(candle["open"]),
                "high": float(candle["high"]),
                "low": float(candle["low"]),
                "close": float(candle["close"]),
                "volume": float(candle["volume"])
            }
            for candle in ohlcv
        ]
        
        # Test scoring
        score = await scoring_engine.score(ohlcv_bars)
        
        return {
            "status": "healthy",
            "message": "Scoring system operational",
            "test_score": {
                "final_score": score.final_score,
                "direction": score.direction,
                "confidence": score.confidence
            }
        }
        
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        return {"status": "unhealthy", "message": f"Health check failed: {str(e)}"}

@router.post("/scan/background")
async def background_scan(
    request: ScanRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Start a background scan task
    """
    try:
        # Create scanner
        scanner = MultiTimeframeScanner(data_manager, scoring_engine, default_weights)
        
        # Add background task
        background_tasks.add_task(
            run_background_scan,
            scanner,
            request.symbols,
            request.timeframes,
            request.rules,
            current_user["user_id"]
        )
        
        return {
            "message": "Background scan started",
            "symbols": request.symbols,
            "timeframes": request.timeframes
        }
        
    except Exception as e:
        logger.error("Background scan start failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Background scan start failed: {str(e)}")

async def run_background_scan(
    scanner: MultiTimeframeScanner,
    symbols: List[str],
    timeframes: List[str],
    rules: Optional[ScanRule],
    user_id: str
):
    """
    Background scan task
    """
    try:
        logger.info("Starting background scan", user_id=user_id, symbols=symbols)
        
        results = await scanner.scan(symbols, timeframes, rules)
        
        logger.info(
            "Background scan completed",
            user_id=user_id,
            opportunities_found=len(results)
        )
        
        # Here you could store results in database or send notifications
        
    except Exception as e:
        logger.error("Background scan failed", user_id=user_id, error=str(e))
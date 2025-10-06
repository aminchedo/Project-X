"""
Enhanced API models for Phase 7 implementation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime
from enum import Enum

class WeightConfig(BaseModel):
    """Configuration for detector weights"""
    harmonic: float = Field(default=0.15, ge=0, le=1)
    elliott: float = Field(default=0.15, ge=0, le=1)
    smc: float = Field(default=0.20, ge=0, le=1)
    fibonacci: float = Field(default=0.10, ge=0, le=1)
    price_action: float = Field(default=0.15, ge=0, le=1)
    sar: float = Field(default=0.10, ge=0, le=1)
    sentiment: float = Field(default=0.10, ge=0, le=1)
    news: float = Field(default=0.03, ge=0, le=1)
    whales: float = Field(default=0.02, ge=0, le=1)
    
    def validate_sum(self):
        """Validate that weights sum to 1.0"""
        total = sum([
            self.harmonic, self.elliott, self.smc, self.fibonacci,
            self.price_action, self.sar, self.sentiment, self.news, self.whales
        ])
        if abs(total - 1.0) > 0.01:
            raise ValueError(f"Weights must sum to 1.0, got {total:.3f}")

class ScanRule(BaseModel):
    """Rules for market scanning"""
    min_score: float = Field(default=0.6, ge=0, le=1)
    min_confidence: float = Field(default=0.5, ge=0, le=1)
    max_risk_level: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH)$")
    min_volume_usd: float = Field(default=1000000, gt=0)
    exclude_symbols: List[str] = Field(default_factory=list)

class ScoreRequest(BaseModel):
    """Request model for scoring a single symbol"""
    symbol: str = Field(..., min_length=1)
    timeframe: str = Field(default="1h", pattern="^(1m|5m|15m|30m|1h|4h|1d|1w)$")
    weights: Optional[WeightConfig] = None
    context: Optional[Dict[str, Any]] = None

class ScanRequest(BaseModel):
    """Request model for market scanning"""
    symbols: List[str] = Field(..., min_items=1, max_items=50)
    timeframes: List[str] = Field(default=["15m", "1h", "4h"], max_items=5)
    weights: Optional[WeightConfig] = None
    rules: Optional[ScanRule] = None

class ComponentScore(BaseModel):
    """Individual detector component score"""
    detector: str
    score: float = Field(ge=0, le=1)
    direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    confidence: float = Field(ge=0, le=1)
    meta: Dict[str, Any] = Field(default_factory=dict)

class CombinedScore(BaseModel):
    """Combined score from all detectors"""
    final_score: float = Field(ge=0, le=1)
    direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    advice: str
    confidence: float = Field(ge=0, le=1)
    bull_mass: float = Field(ge=0, le=1)
    bear_mass: float = Field(ge=0, le=1)
    disagreement: float = Field(ge=0, le=1)
    components: List[ComponentScore]

class ScanResult(BaseModel):
    """Result from market scanning"""
    symbol: str
    overall_score: float = Field(ge=0, le=1)
    overall_direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    recommended_action: str
    risk_level: str
    consensus_strength: float = Field(ge=0, le=1)
    timeframe_scores: Dict[str, CombinedScore]

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    providers: Dict[str, bool]
    detectors: List[str]
    timestamp: str

class ScoreResponse(BaseModel):
    """Response for signal scoring"""
    symbol: str
    timeframe: str
    result: CombinedScore

class ScanResponse(BaseModel):
    """Response for market scanning"""
    scan_time: str
    symbols_scanned: int
    opportunities_found: int
    results: List[ScanResult]
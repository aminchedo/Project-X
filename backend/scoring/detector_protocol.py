"""
Detector Protocol and Detection Result Models
Implements the universal interface for all trading signal detectors
"""

from typing import Protocol, TypedDict, Literal
from pydantic import BaseModel, Field, validator
import structlog

logger = structlog.get_logger()

class OHLCVBar(TypedDict):
    """Single OHLCV candle - immutable contract"""
    ts: int          # Unix timestamp milliseconds
    open: float
    high: float
    low: float
    close: float
    volume: float

class DetectionResult(BaseModel):
    """Universal detector output - all detectors MUST return this"""
    score: float = Field(ge=-1.0, le=1.0, description="Signed score: -1=strong bear, +1=strong bull")
    confidence: float = Field(ge=0.0, le=1.0, description="Quality of detection 0=noise, 1=textbook")
    direction: Literal["BULLISH", "BEARISH", "NEUTRAL"]
    meta: dict = Field(default_factory=dict, description="Detector-specific context")
    
    @validator('score')
    def validate_score_direction_alignment(cls, v, values):
        """Ensure score sign matches direction"""
        if 'direction' in values:
            if values['direction'] == 'BULLISH' and v < 0:
                raise ValueError("Bullish direction requires positive score")
            if values['direction'] == 'BEARISH' and v > 0:
                raise ValueError("Bearish direction requires negative score")
        return v

class DetectorProtocol(Protocol):
    """All detectors implement this interface"""
    async def detect(self, ohlcv: list[OHLCVBar], context: dict) -> DetectionResult:
        """
        Args:
            ohlcv: Minimum 100 bars, validated ascending timestamps
            context: {"trend": "up|down|ranging", "volatility": "high|normal|low"}
        
        Returns:
            DetectionResult with score, confidence, direction, meta
        
        Raises:
            ValueError: If ohlcv insufficient or malformed
            TimeoutError: If computation exceeds 500ms
        """
        ...
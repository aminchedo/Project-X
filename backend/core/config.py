"""
Configuration for SMC-integrated trading system
Includes weights, thresholds, and feature flags for GA/RL optimization
"""

from typing import Dict, Any
from pydantic import BaseModel, Field


class SMCConfig(BaseModel):
    """SMC-specific configuration"""
    enabled: bool = Field(default=True, description="Enable SMC features")
    zqs_min: float = Field(default=0.55, ge=0.0, le=1.0, description="Minimum Zone Quality Score")
    fvg_min_atr: float = Field(default=0.15, ge=0.0, description="Minimum FVG size as ATR fraction")
    htf_timeframe: str = Field(default="15m", description="Higher timeframe for bias")
    ltf_timeframe: str = Field(default="1m", description="Lower timeframe for entries")


class SignalWeights(BaseModel):
    """Weights for all signals (must sum to ~1.0)"""
    RSI: float = Field(default=0.15, ge=0.0, le=1.0)
    MACD: float = Field(default=0.15, ge=0.0, le=1.0)
    SMC_ZQS: float = Field(default=0.25, ge=0.0, le=1.0)
    LIQ_GRAB: float = Field(default=0.10, ge=0.0, le=1.0)
    FVG_ATR: float = Field(default=0.10, ge=0.0, le=1.0)
    Sentiment: float = Field(default=0.15, ge=0.0, le=1.0)
    SAR: float = Field(default=0.10, ge=0.0, le=1.0)
    
    def validate_sum(self) -> bool:
        """Ensure weights sum to approximately 1.0"""
        total = sum([
            self.RSI, self.MACD, self.SMC_ZQS, 
            self.LIQ_GRAB, self.FVG_ATR, 
            self.Sentiment, self.SAR
        ])
        if not 0.95 <= total <= 1.05:
            raise ValueError(f"Weights must sum to ~1.0, got {total}")
        return True


class Thresholds(BaseModel):
    """Entry and filtering thresholds"""
    EntryScore: float = Field(default=0.65, ge=0.0, le=1.0)
    ConfluenceScore: float = Field(default=0.55, ge=0.0, le=1.0)
    ZQS_min: float = Field(default=0.55, ge=0.0, le=1.0)
    FVG_min_atr: float = Field(default=0.15, ge=0.0)


class RiskPolicy(BaseModel):
    """Risk management parameters"""
    max_risk_per_trade: float = Field(default=0.02, ge=0.001, le=0.1)
    max_position: float = Field(default=0.25, ge=0.01, le=1.0)
    stop_loss_atr_multiple: float = Field(default=1.5, ge=0.5, le=5.0)
    take_profit_rr: float = Field(default=2.0, ge=1.0, le=10.0)
    countertrend_reduction: float = Field(default=0.5, ge=0.1, le=1.0)
    news_impact_reduction: float = Field(default=0.5, ge=0.1, le=1.0)


class TradingConfig(BaseModel):
    """Complete trading system configuration"""
    weights: SignalWeights = Field(default_factory=SignalWeights)
    thresholds: Thresholds = Field(default_factory=Thresholds)
    risk: RiskPolicy = Field(default_factory=RiskPolicy)
    smc: SMCConfig = Field(default_factory=SMCConfig)
    
    def model_post_init(self, __context: Any) -> None:
        """Validate after initialization"""
        self.weights.validate_sum()


# Default configuration instance
DEFAULT_CONFIG = TradingConfig()


def get_config() -> TradingConfig:
    """Get the default trading configuration"""
    return DEFAULT_CONFIG


def update_config(updates: Dict[str, Any]) -> TradingConfig:
    """
    Update configuration with new values (for GA/RL)
    
    Args:
        updates: Dictionary with nested updates, e.g.:
            {"weights": {"SMC_ZQS": 0.3}, "thresholds": {"EntryScore": 0.7}}
    
    Returns:
        Updated TradingConfig instance
    """
    config_dict = DEFAULT_CONFIG.model_dump()
    
    for key, value in updates.items():
        if key in config_dict and isinstance(value, dict):
            config_dict[key].update(value)
        else:
            config_dict[key] = value
    
    return TradingConfig(**config_dict)
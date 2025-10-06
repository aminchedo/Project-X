from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import os
from typing import Generator
from .models import Base

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hts_trading.db")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
else:
    engine = create_engine(DATABASE_URL, echo=False)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database with default data"""
    db = SessionLocal()
    try:
        # Create default risk limits if none exist
        from .models import RiskLimit
        existing_limits = db.query(RiskLimit).filter(RiskLimit.is_active == True).first()
        
        if not existing_limits:
            default_limits = RiskLimit(
                max_risk_per_trade=0.02,
                max_daily_loss=0.05,
                max_portfolio_var=0.1,
                max_correlation_limit=0.7,
                max_position_size=0.25,
                confidence_threshold=0.6,
                volatility_adjustment=True,
                drawdown_protection=True,
                is_active=True
            )
            db.add(default_limits)
            db.commit()
            
    finally:
        db.close()
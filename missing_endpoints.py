# Missing endpoints that frontend expects
@app.get("/api/trading/signal-positions")
async def get_signal_positions():
    """Get current signal positions - returns neutral empty structure"""
    try:
        return {
            "positions": [],
            "alerts": [],
            "message": "No real signal positions available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/trading/risk-snapshot")
async def get_risk_snapshot():
    """Get risk snapshot - returns neutral empty structure"""
    try:
        return {
            "metrics": [],
            "positionRisks": [],
            "alerts": [],
            "overallRiskScore": None,
            "portfolioVar": None,
            "maxDrawdown": None,
            "sharpeRatio": None,
            "message": "No real risk data available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/whale-activity/{symbol}")
async def get_whale_activity(symbol: str):
    """Get whale activity for symbol - returns neutral empty structure"""
    try:
        return {
            "score": None,
            "activity": None,
            "largeBuys": 0,
            "largeSells": 0,
            "message": "No real whale activity data available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/market/sentiment/{symbol}")
async def get_market_sentiment(symbol: str):
    """Get market sentiment for symbol - returns neutral empty structure"""
    try:
        return {
            "score": None,
            "mood": None,
            "socialVolume": 0,
            "newsSentiment": None,
            "message": "No real sentiment data available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/market-depth/{symbol}")
async def get_market_depth(symbol: str):
    """Get market depth for symbol - returns neutral empty structure"""
    try:
        return {
            "bids": [],
            "asks": [],
            "symbol": symbol,
            "message": "No real market depth data available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
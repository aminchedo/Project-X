"""
Minimal health check test for the API
"""
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health():
    """Test the /health endpoint responds successfully"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"


def test_price_endpoint():
    """Test the /api/price endpoint works without auth"""
    response = client.get("/api/price/BTCUSDT")
    # Should return 200 or 500 (if API is down), but not 401/403
    assert response.status_code in [200, 500]


def test_ohlcv_endpoint():
    """Test the /api/ohlcv endpoint works without auth"""
    response = client.get("/api/ohlcv/BTCUSDT")
    # Should return 200 or 500 (if API is down), but not 401/403
    assert response.status_code in [200, 500]

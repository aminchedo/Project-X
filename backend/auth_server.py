from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from auth.jwt_auth import authenticate_user, create_access_token, create_refresh_token
import uvicorn

app = FastAPI(title="HTS Trading System - Authentication Server")

# CORS middleware - Allow frontend on port 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000", 
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login")
async def login(credentials: dict):
    username = credentials.get("username")
    password = credentials.get("password")
    
    print(f"Login attempt - Username: '{username}', Password: '{password}'")
    
    if not username or not password:
        print("Missing username or password")
        raise HTTPException(status_code=400, detail="Username and password required")
    
    user = authenticate_user(username, password)
    if not user:
        print(f"Authentication failed for user: {username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create tokens
    access_token = create_access_token(data={"sub": user["username"]})
    refresh_token = create_refresh_token(data={"sub": user["username"]})
    
    print(f"Authentication successful for user: {username}")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "email": user["email"],
            "is_admin": user["is_admin"]
        }
    }

@app.get("/")
async def root():
    return {"message": "HTS Trading System Authentication Server", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "auth"}

# Mock endpoints for the frontend
@app.get("/api/health/all-apis")
async def all_apis_health():
    return {
        "binance": {"status": "healthy", "latency": 50},
        "kucoin": {"status": "healthy", "latency": 45}
    }

@app.get("/settings")
async def get_settings():
    return {
        "risk_management": {
            "max_position_size": 1000,
            "stop_loss_percentage": 5.0,
            "take_profit_percentage": 10.0
        },
        "trading": {
            "default_symbol": "BTCUSDT",
            "default_interval": "1h"
        }
    }

if __name__ == "__main__":
    print("=" * 50)
    print("HTS Trading System - Authentication Server")
    print("=" * 50)
    print("Default credentials:")
    print("  Username: admin")
    print("  Password: admin123")
    print("=" * 50)
    print("Server starting on http://localhost:8000")
    print("Frontend should be accessible on http://localhost:5173")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
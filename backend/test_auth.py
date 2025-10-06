from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from auth.jwt_auth import authenticate_user, create_access_token, create_refresh_token
import uvicorn

app = FastAPI(title="HTS Trading System - Auth Test")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login")
async def login(credentials: dict):
    username = credentials.get("username")
    password = credentials.get("password")
    
    print(f"Login attempt - Username: {username}, Password: {password}")
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    user = authenticate_user(username, password)
    if not user:
        print(f"Authentication failed for user: {username}")
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create tokens
    access_token = create_access_token(data={"sub": user["username"]})
    refresh_token = create_refresh_token(data={"sub": user["username"]})
    
    print(f"Authentication successful for user: {username}")
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/")
async def root():
    return {"message": "HTS Trading System Auth Test Server", "status": "running"}

@app.get("/test")
async def test():
    return {"message": "Server is working", "auth_test": "admin/admin123"}

if __name__ == "__main__":
    print("Starting HTS Trading System Auth Test Server...")
    print("Default credentials: admin / admin123")
    uvicorn.run(app, host="0.0.0.0", port=8000)
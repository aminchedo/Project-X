@echo off
title BoltAI Crypto Trading System - Complete Startup
color 0A

echo.
echo ========================================
echo   BoltAI Crypto Trading System
echo   Complete Startup Script
echo ========================================
echo.

:: Set working directory to project root
cd /d "%~dp0"

:: Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if Python is installed
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

:: Install frontend dependencies if needed
echo [INFO] Checking frontend dependencies...
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

:: Install backend dependencies if needed
echo [INFO] Checking backend dependencies...
if not exist "backend\venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv backend\venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

:: Activate virtual environment and install dependencies
echo [INFO] Activating virtual environment and installing backend dependencies...
call backend\venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

:: Install Python dependencies
pip install -r backend\requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Some backend dependencies may not be installed properly
    echo [INFO] Attempting to install requirements...
    pip install -r backend\requirements.txt
)

:: Start the application
echo.
echo [SUCCESS] All dependencies are ready!
echo [INFO] Starting BoltAI Crypto Trading System...
echo.
echo ========================================
echo   Starting Services...
echo ========================================
echo.
echo [FRONTEND] Starting Vite development server on http://localhost:5173
echo [BACKEND]  Starting FastAPI server on http://localhost:8000
echo.
echo [INFO] Opening browser in 5 seconds...
echo [INFO] Press Ctrl+C to stop all services
echo.

:: Wait 5 seconds then open browser
timeout /t 5 /nobreak >nul

:: Open browser to frontend
start "" "http://localhost:5173"

:: Open browser to backend API docs
start "" "http://localhost:8000/docs"

:: Start both services concurrently
echo [INFO] Starting concurrent services...
start "Backend API" cmd /k "cd /d %~dp0 && call backend\venv\Scripts\activate.bat && python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend
start "Frontend Dev" cmd /k "cd /d %~dp0 && npm run frontend:dev"

echo.
echo ========================================
echo   Services Started Successfully!
echo ========================================
echo.
echo [FRONTEND] http://localhost:5173
echo [BACKEND]  http://localhost:8000
echo [API DOCS] http://localhost:8000/docs
echo.
echo [INFO] Both services are running in separate windows
echo [INFO] Close those windows to stop the services
echo.
echo [INFO] Press any key to open additional browser tabs...
pause >nul

:: Open additional useful URLs
echo [INFO] Opening additional browser tabs...
start "" "http://localhost:8000/health"
start "" "http://localhost:8000/api/health/all-apis"

echo.
echo ========================================
echo   All Done! Enjoy Trading!
echo ========================================
echo.
echo [INFO] Your enhanced ProfessionalDashboard is ready!
echo [INFO] Features: Glassmorphism, Advanced Shadows, Premium Animations
echo.
pause

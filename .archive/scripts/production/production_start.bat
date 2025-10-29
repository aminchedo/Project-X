@echo off
title Production Mode - BoltAI Crypto
color 0C

echo.
echo ========================================
echo   Production Mode - BoltAI Crypto
echo ========================================
echo.

cd /d "%~dp0"

:: Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this from the project root.
    pause
    exit /b 1
)

:: Build frontend for production
echo [INFO] Building frontend for production...
npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed
    pause
    exit /b 1
)

:: Start backend in production mode
echo [INFO] Starting backend in production mode...
call backend\venv\Scripts\activate.bat
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4

echo.
echo [INFO] Production server stopped.
pause

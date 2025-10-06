@echo off
title Quick Start - BoltAI Crypto
color 0B

echo.
echo ========================================
echo   Quick Start - BoltAI Crypto
echo ========================================
echo.

cd /d "%~dp0"

:: Kill any existing processes on ports 5173 and 8000
echo [INFO] Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173"') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000"') do taskkill /f /pid %%a >nul 2>&1

:: Start backend
echo [INFO] Starting Backend API...
start "Backend" cmd /k "cd /d %~dp0 && call backend\venv\Scripts\activate.bat && python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend
echo [INFO] Starting Frontend...
start "Frontend" cmd /k "cd /d %~dp0 && npm run frontend:dev"

:: Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 5 /nobreak >nul

:: Open browsers
echo [INFO] Opening browsers...
start "" "http://localhost:5173"
start "" "http://localhost:8000/docs"

echo.
echo ========================================
echo   Ready! Services Started
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause >nul

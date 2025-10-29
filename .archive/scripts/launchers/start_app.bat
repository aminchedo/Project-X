@echo off
echo ========================================
echo HTS Trading System Startup Script
echo ========================================
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0 && python -m uvicorn backend.simple_main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run frontend:dev"

echo.
echo ========================================
echo Both servers are starting...
echo ========================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173 (or next available port)
echo.
echo Press any key to exit...
pause > nul

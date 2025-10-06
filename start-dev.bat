@echo off
REM HTS Trading System - Windows Development Startup Script
REM This script starts both frontend and backend services

echo 🚀 Starting HTS Trading System...
echo ==================================

REM Function to check if a port is in use
:check_port
netstat -an | find ":%1" > nul
if %errorlevel% == 0 (
    echo Port %1 is in use
    exit /b 0
) else (
    exit /b 1
)

REM Check if Python is installed
echo Checking system requirements...
python --version > nul 2>&1
if %errorlevel% neq 0 (
    python3 --version > nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Python not found. Please install Python 3.8+
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=python3
        echo ✅ Python3 found
    )
) else (
    set PYTHON_CMD=python
    echo ✅ Python found
)

REM Check if Node.js is installed
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 16+
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
)

REM Kill existing processes on ports
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo Killing process on port 8000...
    taskkill /F /PID %%a > nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process on port 3000...
    taskkill /F /PID %%a > nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    echo Killing process on port 5173...
    taskkill /F /PID %%a > nul 2>&1
)

timeout /t 2 /nobreak > nul

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    %PYTHON_CMD% -m venv venv
)

REM Activate virtual environment and install dependencies
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt

cd ..
echo ✅ Backend dependencies installed

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
if not exist "node_modules" (
    npm install
)
echo ✅ Frontend dependencies installed

REM Start backend server
echo 🔧 Starting Backend Server (Port 8000)...
cd backend
call venv\Scripts\activate.bat
start /B %PYTHON_CMD% main.py > ..\backend.log 2>&1
cd ..

REM Wait for backend to start
echo Waiting for backend to start...
set /a count=0
:wait_backend
timeout /t 1 /nobreak > nul
curl -s http://localhost:8000/health > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend started successfully on http://localhost:8000
    goto backend_ready
)
set /a count+=1
if %count% lss 30 goto wait_backend
echo ❌ Backend failed to start
goto cleanup

:backend_ready
REM Start frontend server
echo 🎨 Starting Frontend Server (Port 5173)...
start /B npm run dev > frontend.log 2>&1

REM Wait for frontend to start
echo Waiting for frontend to start...
set /a count=0
:wait_frontend
timeout /t 1 /nobreak > nul
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend started successfully on http://localhost:5173
    goto services_ready
)
set /a count+=1
if %count% lss 30 goto wait_frontend
echo ❌ Frontend failed to start
goto cleanup

:services_ready
echo.
echo 🎉 HTS Trading System is running!
echo ==================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Health:   http://localhost:8000/health
echo.
echo Press Ctrl+C or close this window to stop all services
echo.

REM Keep the script running
:keep_running
timeout /t 5 /nobreak > nul
goto keep_running

:cleanup
echo.
echo 🛑 Shutting down services...

REM Kill processes on ports
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a > nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    taskkill /F /PID %%a > nul 2>&1
)

echo ✅ All services stopped
pause
exit
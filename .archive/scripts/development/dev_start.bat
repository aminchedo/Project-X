@echo off
title Development Mode - BoltAI Crypto
color 0E

echo.
echo ========================================
echo   Development Mode - BoltAI Crypto
echo ========================================
echo.

cd /d "%~dp0"

:: Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this from the project root.
    pause
    exit /b 1
)

:: Clean up any existing processes
echo [INFO] Stopping existing processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1

:: Start development servers using npm script
echo [INFO] Starting development servers...
echo [INFO] This will start both frontend and backend concurrently
echo.

:: Use the existing npm dev script
npm run dev

echo.
echo [INFO] Development servers stopped.
pause

@echo off
title BoltAI Crypto - Application Launcher
color 0F

:menu
cls
echo.
echo ========================================
echo   BoltAI Crypto Trading System
echo   Application Launcher
echo ========================================
echo.
echo Please select an option:
echo.
echo 1. Complete Startup (Full Setup + Browser)
echo 2. Quick Start (Fast Launch)
echo 3. Development Mode (Hot Reload)
echo 4. Production Mode (Optimized)
echo 5. Stop All Services
echo 6. Open Browser Only
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto complete
if "%choice%"=="2" goto quick
if "%choice%"=="3" goto dev
if "%choice%"=="4" goto production
if "%choice%"=="5" goto stop
if "%choice%"=="6" goto browser
if "%choice%"=="7" goto exit
goto menu

:complete
echo.
echo [INFO] Starting Complete Setup...
call start_app_complete.bat
goto menu

:quick
echo.
echo [INFO] Starting Quick Launch...
call quick_start.bat
goto menu

:dev
echo.
echo [INFO] Starting Development Mode...
call dev_start.bat
goto menu

:production
echo.
echo [INFO] Starting Production Mode...
call production_start.bat
goto menu

:stop
echo.
echo [INFO] Stopping all services...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
echo [SUCCESS] All services stopped.
timeout /t 2 /nobreak >nul
goto menu

:browser
echo.
echo [INFO] Opening browser tabs...
start "" "http://localhost:5173"
start "" "http://localhost:8000/docs"
start "" "http://localhost:8000/health"
echo [SUCCESS] Browser tabs opened.
timeout /t 2 /nobreak >nul
goto menu

:exit
echo.
echo [INFO] Goodbye! Happy Trading!
timeout /t 2 /nobreak >nul
exit /b 0

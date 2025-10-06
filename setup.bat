@echo off
echo ================================================================
echo.
echo    HTS Trading System Setup (Windows)
echo.
echo ================================================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed!
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if backend\.env exists
if not exist "backend\.env" (
    echo [INFO] Creating backend\.env from example...
    copy backend\.env.example backend\.env >nul
    echo [OK] backend\.env created
) else (
    echo [OK] backend\.env already exists
)

echo.
echo ================================================================
echo.
echo Setup complete! Now you can run:
echo.
echo    docker-compose up --build
echo.
echo Then open: http://localhost:8080
echo.
echo ================================================================
echo.
pause

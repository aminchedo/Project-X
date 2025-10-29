# Project-X Quick Start Script
# Run this to start both backend and frontend

Write-Host "🚀 Project-X Quick Start" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.10+`` from python.org" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Found Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from nodejs.org" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow

# Setup backend
Write-Host ""
Write-Host "📦 Backend Setup" -ForegroundColor Cyan
Write-Host "----------------" -ForegroundColor Cyan

if (!(Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
cd backend
pip install --quiet -r requirements.txt

if (!(Test-Path ".env")) {
    Write-Host "Creating .env file from example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit backend/.env with your configuration" -ForegroundColor Yellow
}

Write-Host "Initializing database..." -ForegroundColor Yellow
python -c "from database.connection import init_db; init_db()" 2>&1 | Out-Null

cd ..

# Setup frontend
Write-Host ""
Write-Host "📦 Frontend Setup" -ForegroundColor Cyan
Write-Host "-----------------" -ForegroundColor Cyan

if (!(Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install --silent
} else {
    Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend in new window
Write-Host "🟢 Starting Backend on http://localhost:8000" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; & '../venv/Scripts/Activate.ps1'; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# Wait a bit for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "🟢 Starting Frontend on http://localhost:5173" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access the app at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📍 Backend API at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📍 API Docs at: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: Keep both PowerShell windows open. Close them to stop the servers." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this setup window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "HTS Trading System Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Backend Server..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    python -m uvicorn backend.simple_main:app --reload --host 0.0.0.0 --port 8000
}

Write-Host ""
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run frontend:dev
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Both servers are starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: http://localhost:8000" -ForegroundColor Blue
Write-Host "Frontend: http://localhost:5173 (or next available port)" -ForegroundColor Blue
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers..." -ForegroundColor Red

# Function to cleanup processes on exit
function Cleanup {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    exit 0
}

# Set trap to cleanup on script exit
Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup }

try {
    # Wait for user to stop
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
catch {
    Cleanup
}

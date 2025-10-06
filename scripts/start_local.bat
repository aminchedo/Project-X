@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Load backend env
for /f "usebackq tokens=1,* delims==" %%a in (`type backend\.env`) do (
  if "%%a"=="" (echo.) else (
    echo %%a| findstr /r "^[#]" >nul || set %%a=%%b
  )
)

echo Environment loaded.
echo Start backend with:
echo     uvicorn main:app --host 0.0.0.0 --port %PORT%
echo Health:
echo     curl -fsS http://localhost:%PORT%/health
echo WS test:
echo     python scripts\test_ws.py

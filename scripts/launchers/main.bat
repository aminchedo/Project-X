@echo off
setlocal EnableDelayedExpansion
set ROOT=%~dp0
cd /d "%ROOT%"

echo === BoltAiCrypto Setup & Run (v2) ===

rem --- Node version check (warn only) ---
where node >nul 2>nul
if errorlevel 1 (
  echo [WARN] Node.js not found. Please install Node 22.12+ (or >=20.19).
) else (
  for /f "tokens=1 delims=v" %%A in ('node -v') do set NODEV=%%A
  for /f "tokens=1,2,3 delims=." %%A in ("%NODEV%") do (
    set NMJR=%%A
    set NMIN=%%B
    set NPAT=%%C
  )
  echo Node version: v%NMJR%.%NMIN%.%NPAT%
  if "%NMJR%"=="20" if %NMIN% LSS 19 (
    echo [WARN] Vite requires Node >= 20.19 or >= 22.12. Consider upgrading via nvm-windows.
  )
)

rem --- Ensure backend is a package ---
if not exist backend\__init__.py type nul > backend\__init__.py
if not exist backend\data\__init__.py type nul > backend\data\__init__.py
if not exist backend\analytics\__init__.py type nul > backend\analytics\__init__.py
if not exist backend\services\__init__.py type nul > backend\services\__init__.py

rem --- Patch common imports in backend\main.py (safe replace) ---
if exist backend\main.py (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$p='backend\main.py';$t=Get-Content $p -Raw;"+
    "$t=$t -replace 'from models ','from backend.models ';"+
    "$t=$t -replace 'from data\.','from backend.data.';"+
    "$t=$t -replace 'from analytics\.','from backend.analytics.';"+
    "$t=$t -replace 'from services\.','from backend.services.';"+
    "Set-Content $p $t -Encoding UTF8"
)

rem --- Vite config: prefer ESM (.mts). If already .mts, skip rename ---
if exist vite.config.ts if not exist vite.config.mts ren vite.config.ts vite.config.mts

rem --- PostCSS/Tailwind: convert to CJS only if .cjs doesn't exist ---
if exist postcss.config.js if not exist postcss.config.cjs (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$c=Get-Content -Raw 'postcss.config.js'; if($c -match 'export\s+default'){Rename-Item 'postcss.config.js' 'postcss.config.cjs' -Force} else {Set-Content 'postcss.config.cjs' 'module.exports = {`n  plugins: {`n    tailwindcss: {},`n    autoprefixer: {}`n  }`n};' -Encoding UTF8}"
)
if not exist postcss.config.cjs (
  > postcss.config.cjs echo module.exports = {^
  & >> postcss.config.cjs echo   plugins: {^
  & >> postcss.config.cjs echo     tailwindcss: {},^
  & >> postcss.config.cjs echo     autoprefixer: {}^
  & >> postcss.config.cjs echo   }^
  & >> postcss.config.cjs echo };
)

if exist tailwind.config.js if not exist tailwind.config.cjs (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$c=Get-Content -Raw 'tailwind.config.js'; if($c -match 'export\s+default'){Rename-Item 'tailwind.config.js' 'tailwind.config.cjs' -Force} else {Set-Content 'tailwind.config.cjs' 'module.exports = {`n  content: [""./index.html"",""./src/**/*.{js,ts,jsx,tsx}""],`n  theme: { extend: {} },`n  plugins: []`n};' -Encoding UTF8}"
)
if not exist tailwind.config.cjs (
  > tailwind.config.cjs echo module.exports = {^
  & >> tailwind.config.cjs echo   content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],^
  & >> tailwind.config.cjs echo   theme: { extend: {} },^
  & >> tailwind.config.cjs echo   plugins: []^
  & >> tailwind.config.cjs echo };
)

rem --- Ensure package.json scripts/devDependencies (PowerShell-safe with ":" key) ---
if exist package.json (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$p=Get-Content -Raw 'package.json'|ConvertFrom-Json;"+ ^
    "if(-not $p.scripts){$p|Add-Member -NotePropertyName scripts -NotePropertyValue (@{})};"+ ^
    "$p.scripts.'frontend:dev' = 'vite --port 5173';"+ ^
    "if(-not $p.devDependencies){$p|Add-Member -NotePropertyName devDependencies -NotePropertyValue (@{})};"+ ^
    "$p.devDependencies.concurrently = '^9.0.0';"+ ^
    "$p | ConvertTo-Json -Depth 100 | Set-Content 'package.json' -Encoding UTF8"
)

rem --- npm install (frontend) ---
call npm i

rem --- Python venv using current python (not py) ---
where python >nul 2>nul
if errorlevel 1 (
  echo [WARN] Python not found in PATH. Skipping backend venv creation.
) else (
  if not exist .venv (
    python -m venv .venv
  )
  if exist .venv\Scripts\activate.bat call .venv\Scripts\activate.bat
  python -m pip install --upgrade pip
  if exist backend\requirements.txt (
    pip install -r backend\requirements.txt
  ) else (
    pip install fastapi==0.104.1 uvicorn==0.24.0 websockets==12.0 ^
       "python-jose[cryptography]" passlib[bcrypt] python-multipart httpx
  )
)

rem --- Create default nginx.conf if missing (for docker prod later) ---
if not exist nginx mkdir nginx >nul 2>nul
if not exist nginx\nginx.conf (
  > nginx\nginx.conf echo server {^
  & >> nginx\nginx.conf echo   listen 80;^
  & >> nginx\nginx.conf echo   server_name _;^
  & >> nginx\nginx.conf echo   root /usr/share/nginx/html;^
  & >> nginx\nginx.conf echo   index index.html;^
  & >> nginx\nginx.conf echo   location / { try_files $$uri $$uri/ /index.html; }^
  & >> nginx\nginx.conf echo   location /api/ { proxy_pass http://api:8000/api/; proxy_http_version 1.1; proxy_set_header Host $$host; }^
  & >> nginx\nginx.conf echo   location /ws/  { proxy_pass http://api:8000/ws/;  proxy_http_version 1.1; proxy_set_header Upgrade $$http_upgrade; proxy_set_header Connection "Upgrade"; }^
  & >> nginx\nginx.conf echo }
)

rem --- Run backend and frontend in separate windows ---
start "API" cmd /k "cd /d %ROOT% && .\.venv\Scripts\python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"
start "WEB" cmd /k "cd /d %ROOT% && npm run frontend:dev"

echo.
echo Started:
echo   API -> http://localhost:8000/api/health
echo   WEB -> http://localhost:5173
echo NOTE: If Vite fails with EBADENGINE, upgrade Node to 22.12+ (nvm-windows recommended).
echo Done.

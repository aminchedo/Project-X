@echo off
echo ========================================
echo PROJECT CLEANUP SCRIPT
echo BoltAiCrypto Trading System
echo ========================================
echo.

echo [1/6] Creating backup directory...
if not exist "archive" mkdir archive
if not exist "archive\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%" mkdir "archive\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%"

echo [2/6] Archiving duplicate hts-trading-system directory...
if exist "hts-trading-system" (
    echo Moving hts-trading-system to archive...
    move "hts-trading-system" "archive\hts-trading-system-backup"
    echo ✅ Archived hts-trading-system directory
) else (
    echo ⚠️ hts-trading-system directory not found
)

echo [3/6] Removing empty/unused files...
if exist "src\components\enhanced-trading-dashboard.tsx" (
    del "src\components\enhanced-trading-dashboard.tsx"
    echo ✅ Removed empty enhanced-trading-dashboard.tsx
)

if exist "index.html" (
    del "index.html"
    echo ✅ Removed duplicate index.html
)

if exist "start.js" (
    del "start.js"
    echo ✅ Removed unused start.js
)

if exist "main.bat" (
    del "main.bat"
    echo ✅ Removed unused main.bat
)

if exist "setup.bat" (
    del "setup.bat"
    echo ✅ Removed unused setup.bat
)

if exist "setup.sh" (
    del "setup.sh"
    echo ✅ Removed unused setup.sh
)

if exist "setup_and_run_v2.bat" (
    del "setup_and_run_v2.bat"
    echo ✅ Removed unused setup_and_run_v2.bat
)

if exist "start-dev.bat" (
    del "start-dev.bat"
    echo ✅ Removed unused start-dev.bat
)

if exist "start-dev.sh" (
    del "start-dev.sh"
    echo ✅ Removed unused start-dev.sh
)

if exist "test_phases_789.py" (
    del "test_phases_789.py"
    echo ✅ Removed unused test_phases_789.py
)

if exist "verify_implementation.py" (
    del "verify_implementation.py"
    echo ✅ Removed unused verify_implementation.py
)

echo [4/6] Removing duplicate config files...
if exist "postcss.config.cjs" (
    del "postcss.config.cjs"
    echo ✅ Removed duplicate postcss.config.cjs
)

if exist "tailwind.config.cjs" (
    del "tailwind.config.cjs"
    echo ✅ Removed duplicate tailwind.config.cjs
)

echo [5/6] Creating showcase directory for unused components...
if not exist "src\components\showcase" mkdir "src\components\showcase"

echo Moving showcase-only components...
if exist "src\components\ComponentBreakdown.tsx" move "src\components\ComponentBreakdown.tsx" "src\components\showcase\"
if exist "src\components\ConfidenceGauge.tsx" move "src\components\ConfidenceGauge.tsx" "src\components\showcase\"
if exist "src\components\CorrelationHeatMap.tsx" move "src\components\CorrelationHeatMap.tsx" "src\components\showcase\"
if exist "src\components\MarketDepthBars.tsx" move "src\components\MarketDepthBars.tsx" "src\components\showcase\"
if exist "src\components\PositionSizer.tsx" move "src\components\PositionSizer.tsx" "src\components\showcase\"
if exist "src\components\RulesConfig.tsx" move "src\components\RulesConfig.tsx" "src\components\showcase\"
if exist "src\components\ScoreGauge.tsx" move "src\components\ScoreGauge.tsx" "src\components\showcase\"
if exist "src\components\SimpleHeatmap.tsx" move "src\components\SimpleHeatmap.tsx" "src\components\showcase\"
if exist "src\components\WeightSliders.tsx" move "src\components\WeightSliders.tsx" "src\components\showcase\"
if exist "src\components\SystemStatus.tsx" move "src\components\SystemStatus.tsx" "src\components\showcase\"
if exist "src\components\DirectionPill.tsx" move "src\components\DirectionPill.tsx" "src\components\showcase\"

echo ✅ Moved showcase components to showcase directory

echo [6/6] Cleaning up temporary files...
if exist "tmp" rmdir /s /q "tmp"
if exist "*.tmp" del "*.tmp"
if exist "*.log" del "*.log"

echo.
echo ========================================
echo CLEANUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Summary:
echo - Archived duplicate directories
echo - Removed unused files
echo - Moved showcase components
echo - Cleaned temporary files
echo.
echo Next steps:
echo 1. Update imports in ProfessionalDashboard.tsx
echo 2. Test the application
echo 3. Commit changes to git
echo.
pause


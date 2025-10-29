# PROJECT_HELP.md

## High-level architecture

```text
Frontend (React/Vite, Zustand state)
    |
    |-- HTTP via src/services/api.ts --> Backend FastAPI routes (/api/*, /market/candles)
    |
    '-- WebSocket via src/context/LiveDataContext.tsx --> Backend /ws/market stream

Data Flow:
  LiveDataContext (WS)
    -> updates ticker/orderBook/lastSignalWS locally
    -> syncs lastSignal + connectionStatus into useAppStore

  Polling hooks (useOverviewSync, usePortfolioSync)
    -> call getPortfolioStatus(), getPnL(), getRiskLive(), getSignals()
    -> push results into useAppStore (portfolioSummary, pnlSummary, riskSnapshot, lastSignal)

  Scanner:
    - scannerFilters lives in useAppStore
    - GlobalTradeControls updates symbol/timeframe and also injects them into scannerFilters
    - scanSignals(scannerFilters) -> setScanResults() in store
    - ResultsTable renders scanResults and lets user add/remove watchlist symbols

  Watchlist:
    - useAppStore.watchlist is a string[] of symbols
    - ResultsTable can toggle each symbol
    - WatchlistPanel shows current watchlist

  Chart (RealTimeChart):
    - pulls candles via getCandles(symbol,timeframe)
    - also shows latest ticker/orderBook from LiveDataContext

Backend (FastAPI in backend/main.py):
  - serves /api/portfolio/status, /api/portfolio/pnl
  - serves /api/signals and /api/signals/scan
  - serves /api/risk/live
  - serves /market/candles
  - provides /ws/market WebSocket for ticker/orderbook/signal live feed
```

## File index

| Path | Layer | Purpose |
|------|-------|---------|
| .bolt/config.json | infra-doc-tests | misc / utility / helper |
| .bolt/prompt | infra-doc-tests | misc / utility / helper |
| .env.development | infra-doc-tests | Environment variables / secrets template |
| .env.example | infra-doc-tests | Environment variables / secrets template |
| .env.production | infra-doc-tests | Environment variables / secrets template |
| .gitignore | infra-doc-tests | misc / utility / helper |
| COMPREHENSIVE_PROJECT_INDEX.md | infra-doc-tests | Documentation / notes |
| CURSOR_MASTER_PROMPT.txt | infra-doc-tests | misc / utility / helper |
| DEPLOYMENT_RUNTIME_DISABLE.md | infra-doc-tests | Documentation / notes |
| DEPLOYMENT_SUCCESS.txt | infra-doc-tests | misc / utility / helper |
| DYNAMIC_WEIGHTS_IMPLEMENTATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| DYNAMIC_WEIGHTS_QUICK_REF.md | infra-doc-tests | Documentation / notes |
| Doc/COMPREHENSIVE_DELIVERABLES_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/CRYPTO_API_IMPLEMENTATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/CRYPTO_API_QUICK_START.md | infra-doc-tests | Documentation / notes |
| Doc/CURSOR_CHEETAH_MODEL_GUIDE.md | infra-doc-tests | Documentation / notes |
| Doc/DEEP_SCAN_COMPLETION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/DEPLOYMENT_GUIDE.md | infra-doc-tests | Documentation / notes |
| Doc/DEVELOPER_DOCUMENTATION_UPDATE.md | infra-doc-tests | Documentation / notes |
| Doc/DOCKER_SETUP_GUIDE.md | infra-doc-tests | Containerization / deployment config |
| Doc/FINAL_IMPLEMENTATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/FUNCTIONAL_UNUSED_FILES_REPORT.md | infra-doc-tests | Documentation / notes |
| Doc/GIT_DEPLOYMENT_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/IMPLEMENTATION_COMPLETE.md | infra-doc-tests | Documentation / notes |
| Doc/IMPLEMENTATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/PHASE3_IMPLEMENTATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/PHASE4_COMPLETION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/PHASE4_IMPLEMENTATION.md | infra-doc-tests | Documentation / notes |
| Doc/PHASES_789_IMPLEMENTATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/PHASE_1_2_ENHANCEMENTS.md | infra-doc-tests | Documentation / notes |
| Doc/PHASE_5_6_IMPLEMENTATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/PREDICTIVE_ANALYTICS_README.md | infra-doc-tests | Documentation / notes |
| Doc/QUICK_START.md | infra-doc-tests | Documentation / notes |
| Doc/QUICK_START_GUIDE.md | infra-doc-tests | Documentation / notes |
| Doc/README.md | infra-doc-tests | Documentation / notes |
| Doc/README_Cursor_Agent.md | infra-doc-tests | Documentation / notes |
| Doc/README_LOCAL_DEVELOPMENT.md | infra-doc-tests | Documentation / notes |
| Doc/README_RUN_LOCAL.md | infra-doc-tests | Documentation / notes |
| Doc/README_STARTUP.md | infra-doc-tests | Documentation / notes |
| Doc/REDESIGN_IMPLEMENTATION.md | infra-doc-tests | Documentation / notes |
| Doc/SCANNER_IMPLEMENTATION.md | infra-doc-tests | Documentation / notes |
| Doc/SCANNER_PHASE3_COMPLETE.md | infra-doc-tests | Documentation / notes |
| Doc/START_HERE.md | infra-doc-tests | Documentation / notes |
| Doc/START_WITH_DOCKER.md | infra-doc-tests | Containerization / deployment config |
| Doc/ULTRA_DEEP_PROJECT_ANALYSIS.md | infra-doc-tests | Documentation / notes |
| Doc/ULTRA_DEEP_SCAN_COMPREHENSIVE_REPORT.md | infra-doc-tests | Documentation / notes |
| Doc/UNUSED_FILES_IMPLEMENTATION_PLAN.md | infra-doc-tests | Documentation / notes |
| Doc/UNUSED_FILES_INTEGRATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| Doc/VERCEL_DEPLOYMENT_GUIDE.md | infra-doc-tests | Documentation / notes |
| Doc/aismartHTS Trading System.md | infra-doc-tests | Documentation / notes |
| Doc/🎉_MISSION_COMPLETE.md | infra-doc-tests | Documentation / notes |
| Dockerfile | infra-doc-tests | Containerization / deployment config |
| Dockerfile.backend | infra-doc-tests | Containerization / deployment config |
| Dockerfile.frontend | infra-doc-tests | Containerization / deployment config |
| FINAL_DELIVERABLES.md | infra-doc-tests | Documentation / notes |
| FINAL_EXECUTIVE_SUMMARY.md | infra-doc-tests | Documentation / notes |
| FINAL_SESSION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| IMPLEMENTATION_COMMIT_MESSAGE.txt | infra-doc-tests | misc / utility / helper |
| IMPLEMENTATION_COMPLETE.txt | infra-doc-tests | misc / utility / helper |
| IMPLEMENTATION_COMPLETE_CRYPTO_API.txt | infra-doc-tests | misc / utility / helper |
| IMPLEMENTATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| INSTALLATION_COMPLETE.txt | infra-doc-tests | misc / utility / helper |
| LICENSE | infra-doc-tests | misc / utility / helper |
| PHASE_2_PROGRESS_REPORT.md | infra-doc-tests | Documentation / notes |
| PROJECT_DEEP_SCAN_ANALYSIS.md | infra-doc-tests | Documentation / notes |
| PROJECT_LOGIC_ANALYSIS.md | infra-doc-tests | Documentation / notes |
| PROJECT_X_API_CONFIG_BACKUP.json | infra-doc-tests | misc / utility / helper |
| PROJECT_X_COMPLETE_BACKUP.md | infra-doc-tests | Documentation / notes |
| PROJECT_X_COMPONENT_INVENTORY.md | infra-doc-tests | Documentation / notes |
| PROJECT_X_DEPLOYMENT_CHECKLIST.md | infra-doc-tests | Documentation / notes |
| PROJECT_X_INTEGRATION_COMPLETE.md | infra-doc-tests | Documentation / notes |
| PROJECT_X_PACKAGE_BACKUP.json | infra-doc-tests | misc / utility / helper |
| QUICK_START.md | infra-doc-tests | Documentation / notes |
| README.md | infra-doc-tests | Documentation / notes |
| README_DYNAMIC_WEIGHTS.md | infra-doc-tests | Documentation / notes |
| README_SMC_AI_FRONTEND.md | infra-doc-tests | Documentation / notes |
| README_WINRATE_BOOST_PACK.md | infra-doc-tests | Documentation / notes |
| SESSION_2_COMPLETE.txt | infra-doc-tests | misc / utility / helper |
| SESSION_3_PROGRESS.txt | infra-doc-tests | misc / utility / helper |
| SESSION_4_PROGRESS.txt | infra-doc-tests | misc / utility / helper |
| SIDEBAR_NAVIGATION_MAP.md | infra-doc-tests | Documentation / notes |
| SMC_AI_FRONTEND_IMPLEMENTATION.md | infra-doc-tests | Documentation / notes |
| SMC_DEPLOYMENT_CHECKLIST.md | infra-doc-tests | Documentation / notes |
| SMC_INTEGRATION_GUIDE.md | infra-doc-tests | Documentation / notes |
| SMC_INTEGRATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| SMC_QUICK_REFERENCE.md | infra-doc-tests | Documentation / notes |
| TRANSFORMATION_100_PERCENT_COMPLETE.md | infra-doc-tests | Documentation / notes |
| TRANSFORMATION_COMPLETE.txt | infra-doc-tests | misc / utility / helper |
| TRANSFORMATION_COMPLETE_SUMMARY.txt | infra-doc-tests | misc / utility / helper |
| TRANSFORMATION_FINAL_REPORT.md | infra-doc-tests | Documentation / notes |
| TRANSFORMATION_NEARLY_COMPLETE.md | infra-doc-tests | Documentation / notes |
| TRANSFORMATION_QUICKSTART.md | infra-doc-tests | Documentation / notes |
| UI_UX_TRANSFORMATION_STATUS.md | infra-doc-tests | Documentation / notes |
| ULTRA_DEEP_PROJECT_ANALYSIS.md | infra-doc-tests | Documentation / notes |
| VISUAL_SUMMARY.txt | infra-doc-tests | misc / utility / helper |
| WINRATE_BOOST_PACK_INSTALLATION_SUMMARY.md | infra-doc-tests | Documentation / notes |
| backend/.env.example | backend | Environment variables / secrets template |
| backend/Dockerfile | backend | Containerization / deployment config |
| backend/Dockerfile.production | backend | Containerization / deployment config |
| backend/Procfile | backend | misc / utility / helper |
| backend/__init__.py | backend | misc / utility / helper |
| backend/analytics/__init__.py | backend | misc / utility / helper |
| backend/analytics/advanced_smc.py | backend | misc / utility / helper |
| backend/analytics/core_signals.py | backend | misc / utility / helper |
| backend/analytics/huggingface_ai.py | backend | misc / utility / helper |
| backend/analytics/indicator_engine.py | backend | misc / utility / helper |
| backend/analytics/indicators.py | backend | misc / utility / helper |
| backend/analytics/indicators_numba.py | backend | misc / utility / helper |
| backend/analytics/ml_ensemble.py | backend | misc / utility / helper |
| backend/analytics/ml_predictor.py | backend | misc / utility / helper |
| backend/analytics/multi_timeframe.py | backend | misc / utility / helper |
| backend/analytics/pattern_detection.py | backend | misc / utility / helper |
| backend/analytics/phase3_integration.py | backend | misc / utility / helper |
| backend/analytics/predictive_engine.py | backend | misc / utility / helper |
| backend/analytics/realtime_stream.py | backend | misc / utility / helper |
| backend/analytics/sentiment.py | backend | misc / utility / helper |
| backend/analytics/smc_analysis.py | backend | misc / utility / helper |
| backend/api/__init__.py | backend | misc / utility / helper |
| backend/api/models.py | backend | misc / utility / helper |
| backend/api/routes.py | backend | misc / utility / helper |
| backend/auth/__init__.py | backend | misc / utility / helper |
| backend/auth/__pycache__/__init__.cpython-313.pyc | backend | misc / utility / helper |
| backend/auth/__pycache__/jwt_auth.cpython-313.pyc | backend | misc / utility / helper |
| backend/auth/jwt_auth.py | backend | misc / utility / helper |
| backend/auth_server.py | backend | misc / utility / helper |
| backend/backtesting/__init__.py | backend | misc / utility / helper |
| backend/backtesting/backtester.py | backend | Tests |
| backend/backtesting/engine.py | backend | misc / utility / helper |
| backend/backtesting/models.py | backend | misc / utility / helper |
| backend/backtesting/trade_simulator.py | backend | misc / utility / helper |
| backend/core/DYNAMIC_WEIGHTS_USAGE.md | backend | Documentation / notes |
| backend/core/__init__.py | backend | misc / utility / helper |
| backend/core/cache.py | backend | misc / utility / helper |
| backend/core/calibration.py | backend | misc / utility / helper |
| backend/core/config.py | backend | misc / utility / helper |
| backend/core/config_hardcoded.py | backend | misc / utility / helper |
| backend/core/dynamic_weights.py | backend | misc / utility / helper |
| backend/core/gating.py | backend | misc / utility / helper |
| backend/core/goal_conditioning.py | backend | misc / utility / helper |
| backend/core/http.py | backend | misc / utility / helper |
| backend/core/risk.py | backend | misc / utility / helper |
| backend/core/scoring.py | backend | misc / utility / helper |
| backend/data/__init__.py | backend | misc / utility / helper |
| backend/data/__pycache__/__init__.cpython-313.pyc | backend | misc / utility / helper |
| backend/data/__pycache__/binance_client.cpython-313.pyc | backend | misc / utility / helper |
| backend/data/__pycache__/data_manager.cpython-313.pyc | backend | misc / utility / helper |
| backend/data/api_config.py | backend | misc / utility / helper |
| backend/data/api_fallback_manager.py | backend | misc / utility / helper |
| backend/data/binance_client.py | backend | misc / utility / helper |
| backend/data/data_manager.py | backend | misc / utility / helper |
| backend/data/exceptions.py | backend | misc / utility / helper |
| backend/data/kucoin_client.py | backend | misc / utility / helper |
| backend/data/rate_limiter.py | backend | misc / utility / helper |
| backend/database/__init__.py | backend | misc / utility / helper |
| backend/database/connection.py | backend | misc / utility / helper |
| backend/database/models.py | backend | misc / utility / helper |
| backend/demo_phase4.py | backend | misc / utility / helper |
| backend/detectors/__init__.py | backend | misc / utility / helper |
| backend/detectors/base.py | backend | misc / utility / helper |
| backend/detectors/elliott.py | backend | misc / utility / helper |
| backend/detectors/fibonacci.py | backend | misc / utility / helper |
| backend/detectors/harmonic.py | backend | misc / utility / helper |
| backend/detectors/news.py | backend | WebSocket live data provider |
| backend/detectors/price_action.py | backend | misc / utility / helper |
| backend/detectors/sar.py | backend | misc / utility / helper |
| backend/detectors/sentiment.py | backend | misc / utility / helper |
| backend/detectors/smc.py | backend | misc / utility / helper |
| backend/detectors/whales.py | backend | misc / utility / helper |
| backend/examples/smc_integration_example.py | backend | misc / utility / helper |
| backend/logging_config.py | backend | misc / utility / helper |
| backend/main.py | backend | FastAPI / backend entrypoint |
| backend/minimal_server.py | backend | misc / utility / helper |
| backend/models.py | backend | misc / utility / helper |
| backend/notifications/__init__.py | backend | misc / utility / helper |
| backend/notifications/telegram_bot.py | backend | misc / utility / helper |
| backend/pipeline/__init__.py | backend | misc / utility / helper |
| backend/pipeline/smc_features.py | backend | misc / utility / helper |
| backend/requirements-ml.txt | backend | misc / utility / helper |
| backend/requirements.txt | backend | Backend Python dependencies |
| backend/risk/__init__.py | backend | misc / utility / helper |
| backend/risk/advanced_risk_manager.py | backend | misc / utility / helper |
| backend/risk/enhanced_risk_manager.py | backend | misc / utility / helper |
| backend/risk/portfolio_risk_manager.py | backend | misc / utility / helper |
| backend/risk/risk_manager.py | backend | misc / utility / helper |
| backend/routers/__init__.py | backend | misc / utility / helper |
| backend/routers/ai_extras.py | backend | misc / utility / helper |
| backend/routers/data.py | backend | misc / utility / helper |
| backend/runtime.txt | backend | misc / utility / helper |
| backend/scanner/__init__.py | backend | misc / utility / helper |
| backend/scanner/mtf_scanner.py | backend | misc / utility / helper |
| backend/schemas/__init__.py | backend | misc / utility / helper |
| backend/schemas/validation.py | backend | misc / utility / helper |
| backend/scoring/__init__.py | backend | misc / utility / helper |
| backend/scoring/api.py | backend | misc / utility / helper |
| backend/scoring/detector_adapters.py | backend | misc / utility / helper |
| backend/scoring/detector_protocol.py | backend | misc / utility / helper |
| backend/scoring/engine.py | backend | misc / utility / helper |
| backend/scoring/mtf_scanner.py | backend | misc / utility / helper |
| backend/scoring/scanner.py | backend | misc / utility / helper |
| backend/scoring/simple_detector_adapters.py | backend | misc / utility / helper |
| backend/services/__init__.py | backend | misc / utility / helper |
| backend/services/defi.py | backend | misc / utility / helper |
| backend/services/market.py | backend | misc / utility / helper |
| backend/services/news.py | backend | WebSocket live data provider |
| backend/services/sentiment.py | backend | misc / utility / helper |
| backend/services/whales.py | backend | misc / utility / helper |
| backend/simple_main.py | backend | FastAPI / backend entrypoint |
| backend/smc/README.md | backend | Documentation / notes |
| backend/smc/__init__.py | backend | misc / utility / helper |
| backend/smc/entries.py | backend | misc / utility / helper |
| backend/smc/fvg.py | backend | misc / utility / helper |
| backend/smc/liquidity.py | backend | misc / utility / helper |
| backend/smc/structure.py | backend | misc / utility / helper |
| backend/smc/zones.py | backend | misc / utility / helper |
| backend/test_auth.py | backend | Tests |
| backend/test_phase4_final.py | backend | Tests |
| backend/test_phase4_simple.py | backend | Tests |
| backend/test_phases.py | backend | Tests |
| backend/tests/__init__.py | backend | misc / utility / helper |
| backend/tests/test_calibration_and_goal.py | backend | Tests |
| backend/tests/test_dynamic_weights.py | backend | Tests |
| backend/tests/test_health.py | backend | Tests |
| backend/tests/test_phase3_detectors.py | backend | Tests |
| backend/tests/test_phase4_integration.py | backend | Tests |
| backend/tests/test_phase_1_2_enhancements.py | backend | Tests |
| backend/tests/test_scoring_phase4.py | backend | Tests |
| backend/tests/test_smc_entries.py | backend | Tests |
| backend/tests/test_smc_fvg_zones.py | backend | Tests |
| backend/tests/test_smc_structure.py | backend | Tests |
| backend/trading/__init__.py | backend | misc / utility / helper |
| backend/trading/pnl_calculator.py | backend | misc / utility / helper |
| backend/trading/trade_logger.py | backend | misc / utility / helper |
| backend/utils/experiment_tracker.py | backend | misc / utility / helper |
| cleanup_unused_files.bat | infra-doc-tests | misc / utility / helper |
| config/ai_config.json | infra-doc-tests | misc / utility / helper |
| config/api_config.json | infra-doc-tests | misc / utility / helper |
| dev_start.bat | infra-doc-tests | misc / utility / helper |
| docker-compose.production.yml | infra-doc-tests | Containerization / deployment config |
| docker-compose.yml | infra-doc-tests | Containerization / deployment config |
| docs/FRONTEND_AUDIT.md | infra-doc-tests | Documentation / notes |
| docs/SCANNER_README.md | infra-doc-tests | Documentation / notes |
| docs/SCANNER_USER_GUIDE.md | infra-doc-tests | Documentation / notes |
| docs/scanner-presets-examples.json | infra-doc-tests | misc / utility / helper |
| eslint.config.js | infra-doc-tests | misc / utility / helper |
| hts_trading.db | infra-doc-tests | misc / utility / helper |
| index.html | infra-doc-tests | misc / utility / helper |
| init.sql | infra-doc-tests | misc / utility / helper |
| launcher.bat | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/.gitignore | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/DEPLOYMENT_GUIDE.md | infra-doc-tests | Documentation / notes |
| legacy/hts-trading-system/README.md | infra-doc-tests | Documentation / notes |
| legacy/hts-trading-system/RELEASE_NOTES.md | infra-doc-tests | Documentation / notes |
| legacy/hts-trading-system/backend/Dockerfile | infra-doc-tests | Containerization / deployment config |
| legacy/hts-trading-system/backend/backtesting/__init__.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/backtesting/backtester.py | infra-doc-tests | Tests |
| legacy/hts-trading-system/backend/data/__init__.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/data/api_config.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/data/api_fallback_manager.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/data/kucoin_client.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/main.py | infra-doc-tests | FastAPI / backend entrypoint |
| legacy/hts-trading-system/backend/notifications/__init__.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/notifications/telegram_bot.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/requirements.txt | infra-doc-tests | Backend Python dependencies |
| legacy/hts-trading-system/backend/risk/__init__.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/risk/portfolio_risk_manager.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/risk/risk_manager.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/schemas/__init__.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/schemas/validation.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/trading/__init__.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/backend/trading/trade_logger.py | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/database/init.sql | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/deploy.sh | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/docker-compose.yml | infra-doc-tests | Containerization / deployment config |
| legacy/hts-trading-system/frontend/Dockerfile | infra-doc-tests | Containerization / deployment config |
| legacy/hts-trading-system/frontend/package.json | infra-doc-tests | Node project config (deps/scripts) |
| legacy/hts-trading-system/frontend/postcss.config.js | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/frontend/public/index.html | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/frontend/public/manifest.json | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/frontend/src/App.tsx | infra-doc-tests | React root component (main UI shell) |
| legacy/hts-trading-system/frontend/src/components/BacktestPanel.tsx | infra-doc-tests | Tests |
| legacy/hts-trading-system/frontend/src/components/Dashboard.tsx | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/frontend/src/components/PnLDashboard.tsx | infra-doc-tests | PnL UI component |
| legacy/hts-trading-system/frontend/src/components/PortfolioPanel.tsx | infra-doc-tests | Portfolio UI component |
| legacy/hts-trading-system/frontend/src/components/RiskPanel.tsx | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/frontend/src/index.css | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/frontend/src/index.tsx | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/frontend/src/services/api.ts | infra-doc-tests | Frontend API client (HTTP calls to backend) |
| legacy/hts-trading-system/frontend/src/services/telegram.ts | infra-doc-tests | misc / utility / helper |
| legacy/hts-trading-system/frontend/tailwind.config.js | infra-doc-tests | Frontend build/config |
| main.bat | infra-doc-tests | misc / utility / helper |
| nginx.conf | infra-doc-tests | misc / utility / helper |
| nginx/nginx.conf | infra-doc-tests | misc / utility / helper |
| package-lock.json | infra-doc-tests | misc / utility / helper |
| package.json | infra-doc-tests | Node project config (deps/scripts) |
| postcss.config.js | infra-doc-tests | misc / utility / helper |
| production_start.bat | infra-doc-tests | misc / utility / helper |
| projectx_ci_plus_bundle.zip | infra-doc-tests | misc / utility / helper |
| quick_start.bat | infra-doc-tests | misc / utility / helper |
| scripts/start_local.bat | infra-doc-tests | misc / utility / helper |
| scripts/start_local.sh | infra-doc-tests | misc / utility / helper |
| scripts/test_ws.py | infra-doc-tests | WebSocket live data provider |
| scripts/verify_runtime_disable.sh | infra-doc-tests | misc / utility / helper |
| setup.bat | infra-doc-tests | misc / utility / helper |
| setup.sh | infra-doc-tests | misc / utility / helper |
| setup_and_run_v2.bat | infra-doc-tests | misc / utility / helper |
| src/App.tsx | frontend | React root component (main UI shell) |
| src/__tests__/Scanner.test.tsx | frontend | Scanner UI component |
| src/__tests__/components/AttributionPanel.test.tsx | frontend | Tests |
| src/__tests__/setup.ts | frontend | misc / utility / helper |
| src/__tests__/state/strategyStore.test.ts | frontend | Global state management |
| src/__tests__/utils/performance.test.ts | frontend | Tests |
| src/analytics/coreSignals.ts | frontend | misc / utility / helper |
| src/analytics/indicators.ts | frontend | misc / utility / helper |
| src/analytics/mlPredictor.ts | frontend | misc / utility / helper |
| src/analytics/patternDetection.ts | frontend | misc / utility / helper |
| src/analytics/riskManager.ts | frontend | misc / utility / helper |
| src/analytics/smcAnalysis.ts | frontend | misc / utility / helper |
| src/components/AIInsightsPanel.tsx | frontend | misc / utility / helper |
| src/components/AccessibilityEnhancer.tsx | frontend | misc / utility / helper |
| src/components/AccessibilitySkipLink.tsx | frontend | misc / utility / helper |
| src/components/AdvancedTradingChart.tsx | frontend | Chart UI component |
| src/components/AttributionPanel.tsx | frontend | misc / utility / helper |
| src/components/BacktestPanel.tsx | frontend | Tests |
| src/components/Badge.tsx | frontend | misc / utility / helper |
| src/components/Chart.tsx | frontend | Chart UI component |
| src/components/ConfirmationDialog.tsx | frontend | misc / utility / helper |
| src/components/ConnectionStatus.tsx | frontend | misc / utility / helper |
| src/components/CryptoDashboard.css | frontend | misc / utility / helper |
| src/components/CryptoDashboard.tsx | frontend | misc / utility / helper |
| src/components/Dashboard.tsx | frontend | misc / utility / helper |
| src/components/DataVisualization/ProfessionalCharts.tsx | frontend | Chart UI component |
| src/components/DemoSystem.tsx | frontend | misc / utility / helper |
| src/components/Empty.tsx | frontend | misc / utility / helper |
| src/components/ErrorBlock.tsx | frontend | misc / utility / helper |
| src/components/ErrorBoundary.tsx | frontend | misc / utility / helper |
| src/components/ExportDialog.tsx | frontend | misc / utility / helper |
| src/components/HelpCenter.tsx | frontend | misc / utility / helper |
| src/components/IntegrationStatus.tsx | frontend | misc / utility / helper |
| src/components/KeyboardShortcuts.tsx | frontend | misc / utility / helper |
| src/components/Layout/AppShell.tsx | frontend | misc / utility / helper |
| src/components/Layout/AssetSelect.tsx | frontend | misc / utility / helper |
| src/components/Layout/AssetSelector.tsx | frontend | misc / utility / helper |
| src/components/Layout/CompactHeader.tsx | frontend | misc / utility / helper |
| src/components/Layout/ModernSidebar.tsx | frontend | misc / utility / helper |
| src/components/Layout/OverviewPage.tsx | frontend | misc / utility / helper |
| src/components/Layout/ProfessionalLayout.tsx | frontend | misc / utility / helper |
| src/components/Layout/ProfessionalNavigation.tsx | frontend | misc / utility / helper |
| src/components/Layout/SidebarLayout.tsx | frontend | misc / utility / helper |
| src/components/Layout/Topbar.tsx | frontend | misc / utility / helper |
| src/components/LazyComponents.tsx | frontend | misc / utility / helper |
| src/components/Loading.tsx | frontend | misc / utility / helper |
| src/components/Login.tsx | frontend | misc / utility / helper |
| src/components/MarketDepthChart.tsx | frontend | Chart UI component |
| src/components/MarketScanner.tsx | frontend | Scanner UI component |
| src/components/MarketVisualization3D.tsx | frontend | misc / utility / helper |
| src/components/Navigation/ModernSidebar.tsx | frontend | misc / utility / helper |
| src/components/Navigation/ModernSidebarNew.tsx | frontend | misc / utility / helper |
| src/components/Navigation/ProfessionalNavigation.tsx | frontend | misc / utility / helper |
| src/components/NewsBanner.tsx | frontend | WebSocket live data provider |
| src/components/NotificationCenter.tsx | frontend | misc / utility / helper |
| src/components/OrderBook.tsx | frontend | misc / utility / helper |
| src/components/Overview/OverviewPage.tsx | frontend | misc / utility / helper |
| src/components/PerformanceMonitor.tsx | frontend | misc / utility / helper |
| src/components/PnLDashboard.tsx | frontend | PnL UI component |
| src/components/PortfolioPanel.tsx | frontend | Portfolio UI component |
| src/components/PortfolioPerformance.tsx | frontend | Portfolio UI component |
| src/components/PositionManager.tsx | frontend | misc / utility / helper |
| src/components/PredictiveAnalyticsDashboard.tsx | frontend | misc / utility / helper |
| src/components/ProfessionalDashboard.tsx | frontend | misc / utility / helper |
| src/components/ProfessionalTradingDashboard.css | frontend | misc / utility / helper |
| src/components/ProfessionalTradingDashboard.tsx | frontend | misc / utility / helper |
| src/components/ProgressBar.tsx | frontend | misc / utility / helper |
| src/components/QuickActionsBar.tsx | frontend | misc / utility / helper |
| src/components/RealTimeChart.tsx | frontend | Chart UI component |
| src/components/RealTimeNewsSentiment.tsx | frontend | WebSocket live data provider |
| src/components/RealTimeRiskMonitor.tsx | frontend | misc / utility / helper |
| src/components/RealTimeSignalPositions.tsx | frontend | misc / utility / helper |
| src/components/RiskPanel.tsx | frontend | misc / utility / helper |
| src/components/SMCDemoPanel.tsx | frontend | misc / utility / helper |
| src/components/SMCOverlayToggles.tsx | frontend | misc / utility / helper |
| src/components/SearchModal.tsx | frontend | misc / utility / helper |
| src/components/SettingsPanel.tsx | frontend | misc / utility / helper |
| src/components/SignalCard.tsx | frontend | misc / utility / helper |
| src/components/SignalDetails.tsx | frontend | misc / utility / helper |
| src/components/SignalsList.tsx | frontend | misc / utility / helper |
| src/components/Skeleton.tsx | frontend | misc / utility / helper |
| src/components/StrategyBuilder.tsx | frontend | misc / utility / helper |
| src/components/StrategyHUD.tsx | frontend | misc / utility / helper |
| src/components/StrategyList.tsx | frontend | misc / utility / helper |
| src/components/SystemTester.tsx | frontend | Tests |
| src/components/TestingFramework.tsx | frontend | Tests |
| src/components/Toast.tsx | frontend | Toast/notification system |
| src/components/ToastContainer.tsx | frontend | Toast/notification system |
| src/components/Tooltip.tsx | frontend | misc / utility / helper |
| src/components/TradeExecutor.tsx | frontend | misc / utility / helper |
| src/components/TradingChart.tsx | frontend | Chart UI component |
| src/components/TradingHistory.tsx | frontend | misc / utility / helper |
| src/components/UserProfileModal.tsx | frontend | misc / utility / helper |
| src/components/WSBadge.tsx | frontend | WebSocket live data provider |
| src/components/WhaleMovementsChart.tsx | frontend | Chart UI component |
| src/components/WhaleTracker.tsx | frontend | misc / utility / helper |
| src/components/Widgets/ActiveSignalsWidget.tsx | frontend | misc / utility / helper |
| src/components/Widgets/AlertsWidget.tsx | frontend | misc / utility / helper |
| src/components/Widgets/DynamicWidgets.tsx | frontend | misc / utility / helper |
| src/components/Widgets/MarketSentimentWidget.tsx | frontend | misc / utility / helper |
| src/components/Widgets/NewsWidget.tsx | frontend | WebSocket live data provider |
| src/components/Widgets/PortfolioValueWidget.tsx | frontend | Portfolio UI component |
| src/components/Widgets/PriceWidget.tsx | frontend | misc / utility / helper |
| src/components/Widgets/QuickStatsWidget.tsx | frontend | misc / utility / helper |
| src/components/Widgets/RiskLevelWidget.tsx | frontend | misc / utility / helper |
| src/components/Widgets/SentimentWidget.tsx | frontend | misc / utility / helper |
| src/components/Widgets/TopMoversWidget.tsx | frontend | misc / utility / helper |
| src/components/Widgets/TradingActivityWidget.tsx | frontend | misc / utility / helper |
| src/components/Widgets/WhaleActivityWidget.tsx | frontend | misc / utility / helper |
| src/components/api.txt | frontend | misc / utility / helper |
| src/components/layout/AppShell.tsx | frontend | misc / utility / helper |
| src/components/layout/CompactHeader.tsx | frontend | misc / utility / helper |
| src/components/layout/ModernSidebar.tsx | frontend | misc / utility / helper |
| src/components/layout/OverviewPage.tsx | frontend | misc / utility / helper |
| src/components/layout/ProfessionalLayout.tsx | frontend | misc / utility / helper |
| src/components/layout/ProfessionalNavigation.tsx | frontend | misc / utility / helper |
| src/components/layout/SidebarLayout.tsx | frontend | misc / utility / helper |
| src/components/layout/Topbar.tsx | frontend | misc / utility / helper |
| src/components/scanner/AdvancedFilters.tsx | frontend | misc / utility / helper |
| src/components/scanner/ComparisonPanel.tsx | frontend | misc / utility / helper |
| src/components/scanner/ExportMenu.tsx | frontend | misc / utility / helper |
| src/components/scanner/KeyboardShortcutsPanel.tsx | frontend | misc / utility / helper |
| src/components/scanner/PatternBadges.tsx | frontend | misc / utility / helper |
| src/components/scanner/PresetDropdown.tsx | frontend | misc / utility / helper |
| src/components/scanner/QuickFilters.tsx | frontend | misc / utility / helper |
| src/components/scanner/ResultsChart.tsx | frontend | Chart UI component |
| src/components/scanner/ResultsGrid.tsx | frontend | misc / utility / helper |
| src/components/scanner/ResultsHeader.tsx | frontend | misc / utility / helper |
| src/components/scanner/ResultsTable.tsx | frontend | misc / utility / helper |
| src/components/scanner/ScanButtons.tsx | frontend | misc / utility / helper |
| src/components/scanner/ScannerHeatmap.tsx | frontend | Scanner UI component |
| src/components/scanner/SessionHistory.tsx | frontend | misc / utility / helper |
| src/components/scanner/SymbolInput.tsx | frontend | misc / utility / helper |
| src/components/scanner/TimeframeSelector.tsx | frontend | misc / utility / helper |
| src/components/showcase/ComponentBreakdown.tsx | frontend | misc / utility / helper |
| src/components/showcase/ConfidenceGauge.tsx | frontend | misc / utility / helper |
| src/components/showcase/CorrelationHeatMap.tsx | frontend | misc / utility / helper |
| src/components/showcase/DirectionPill.tsx | frontend | misc / utility / helper |
| src/components/showcase/MarketDepthBars.tsx | frontend | misc / utility / helper |
| src/components/showcase/MarketOverview.tsx | frontend | misc / utility / helper |
| src/components/showcase/PerformanceMetrics.tsx | frontend | misc / utility / helper |
| src/components/showcase/PortfolioOverview.tsx | frontend | Portfolio UI component |
| src/components/showcase/PositionSizer.tsx | frontend | misc / utility / helper |
| src/components/showcase/RulesConfig.tsx | frontend | misc / utility / helper |
| src/components/showcase/ScoreGauge.tsx | frontend | misc / utility / helper |
| src/components/showcase/SimpleHeatmap.tsx | frontend | misc / utility / helper |
| src/components/showcase/SystemStatus.tsx | frontend | misc / utility / helper |
| src/components/showcase/TradingSignalShowcase.tsx | frontend | misc / utility / helper |
| src/components/showcase/WeightSliders.tsx | frontend | misc / utility / helper |
| src/components/trading-dashboard.tsx | frontend | misc / utility / helper |
| src/components/widgets/ActiveSignalsWidget.tsx | frontend | misc / utility / helper |
| src/components/widgets/AlertsWidget.tsx | frontend | misc / utility / helper |
| src/components/widgets/MarketSentimentWidget.tsx | frontend | misc / utility / helper |
| src/components/widgets/PortfolioValueWidget.tsx | frontend | Portfolio UI component |
| src/components/widgets/PriceWidget.tsx | frontend | misc / utility / helper |
| src/components/widgets/QuickStatsWidget.tsx | frontend | misc / utility / helper |
| src/components/widgets/RiskLevelWidget.tsx | frontend | misc / utility / helper |
| src/components/widgets/TopMoversWidget.tsx | frontend | misc / utility / helper |
| src/components/widgets/TradingActivityWidget.tsx | frontend | misc / utility / helper |
| src/config/api.ts | frontend | Frontend API client (HTTP calls to backend) |
| src/config/apiKeys.ts | frontend | misc / utility / helper |
| src/design/tokens.ts | frontend | misc / utility / helper |
| src/docs/SMC_AI_FRONTEND_INTEGRATION.md | frontend | Documentation / notes |
| src/hooks/useKeyboardShortcuts.ts | frontend | misc / utility / helper |
| src/hooks/useMobileDetect.ts | frontend | misc / utility / helper |
| src/index.css | frontend | misc / utility / helper |
| src/main.tsx | frontend | React root mount / bootstrap |
| src/pages/AIControls.tsx | frontend | misc / utility / helper |
| src/pages/CalibrationLab.tsx | frontend | misc / utility / helper |
| src/pages/Scanner/index.tsx | frontend | misc / utility / helper |
| src/services/DataManager.ts | frontend | misc / utility / helper |
| src/services/EnhancedWebSocket.ts | frontend | misc / utility / helper |
| src/services/RealApiService.ts | frontend | misc / utility / helper |
| src/services/aiApi.ts | frontend | misc / utility / helper |
| src/services/aiExtras.ts | frontend | misc / utility / helper |
| src/services/api.ts | frontend | Frontend API client (HTTP calls to backend) |
| src/services/binanceApi.ts | frontend | misc / utility / helper |
| src/services/sentimentApi.ts | frontend | misc / utility / helper |
| src/services/tradingEngine.ts | frontend | misc / utility / helper |
| src/services/websocket.ts | frontend | misc / utility / helper |
| src/state/hooks.ts | frontend | misc / utility / helper |
| src/state/observable.ts | frontend | misc / utility / helper |
| src/state/store.ts | frontend | Global state management |
| src/state/strategyStore.ts | frontend | Global state management |
| src/state/useStrategy.ts | frontend | misc / utility / helper |
| src/stores/assetStore.ts | frontend | Global state management |
| src/types/index.ts | frontend | misc / utility / helper |
| src/utils/mockData.ts | frontend | misc / utility / helper |
| src/utils/performance.ts | frontend | misc / utility / helper |
| src/vite-env.d.ts | frontend | Environment variables / secrets template |
| start-dev.bat | infra-doc-tests | misc / utility / helper |
| start-dev.sh | infra-doc-tests | misc / utility / helper |
| start_app.bat | infra-doc-tests | misc / utility / helper |
| start_app.ps1 | infra-doc-tests | misc / utility / helper |
| start_app.sh | infra-doc-tests | misc / utility / helper |
| start_app_complete.bat | infra-doc-tests | misc / utility / helper |
| tailwind.config.js | infra-doc-tests | Frontend build/config |
| test_phases_789.py | infra-doc-tests | Tests |
| tmp/package_.json | infra-doc-tests | misc / utility / helper |
| trading-dashboard-preview.html | infra-doc-tests | misc / utility / helper |
| tsconfig.app.json | infra-doc-tests | Frontend build/config |
| tsconfig.app.tsbuildinfo | infra-doc-tests | Frontend build/config |
| tsconfig.json | infra-doc-tests | Frontend build/config |
| tsconfig.node.json | infra-doc-tests | Frontend build/config |
| tsconfig.node.tsbuildinfo | infra-doc-tests | Frontend build/config |
| vercel.json | infra-doc-tests | misc / utility / helper |
| verify_implementation.py | infra-doc-tests | misc / utility / helper |
| vite.config.mts | infra-doc-tests | Frontend build/config |
| vite.config.ts | infra-doc-tests | Frontend build/config |
| vitest.config.ts | infra-doc-tests | Tests |
| winrate_boost_pack.zip | infra-doc-tests | misc / utility / helper |
| 🌟_55_PERCENT_5_CATEGORIES_COMPLETE.txt | infra-doc-tests | misc / utility / helper |
| 🎉_75_PERCENT_ALMOST_DONE.txt | infra-doc-tests | misc / utility / helper |
| 🎉_TRANSFORMATION_SUCCESS.txt | infra-doc-tests | misc / utility / helper |
| 🎊_60_PERCENT_MILESTONE.txt | infra-doc-tests | misc / utility / helper |
| 🎯_40_PERCENT_MILESTONE.txt | infra-doc-tests | misc / utility / helper |
| 🏆_100_PERCENT_COMPLETE.txt | infra-doc-tests | misc / utility / helper |
| 🏆_50_PERCENT_COMPLETE.txt | infra-doc-tests | misc / utility / helper |
| 🏆_70_PERCENT_7_CATEGORIES.txt | infra-doc-tests | misc / utility / helper |
| 📖_COMPLETE_INDEX.md | infra-doc-tests | Documentation / notes |
| 📚_DOCUMENTATION_INDEX.md | infra-doc-tests | Documentation / notes |
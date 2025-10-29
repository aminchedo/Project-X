#!/usr/bin/env bash
set -euo pipefail

# Frontend (Vite) - separate terminal recommended
# (cd frontend && npm i && npm run dev) &

# Backend (FastAPI via uvicorn) - assumes you 'cd backend' in your real project
export $(grep -v '^#' backend/.env | xargs -d '\n' -I {} echo {})
echo "Environment loaded."
echo "Start your backend with: uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
echo "Health: curl -fsS http://localhost:${PORT:-8000}/health"
echo "WS test: python scripts/test_ws.py"

# Cursor Agent Pack — BoltAiCrypto

This pack contains ready-to-drop files and a master prompt for Cursor to make the app functional with clean env handling, WebSocket setup, and Docker compose.

## Files
- package.json
- .env.development
- .env.production
- src/services/api.ts
- src/services/websocket.ts
- docker-compose.yml
- Dockerfile.backend
- Dockerfile.frontend
- backend/.env.example
- init.sql (optional)

## Local (no Docker)
1. `npm i`
2. Create `backend/.env` from `backend/.env.example`
3. Start backend: `python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`
4. Start frontend: `npm run frontend:dev` (or `npm run dev` to run both if uvicorn is available in PATH)

## Docker
1. `docker compose up --build`
2. Frontend → http://localhost:3000
   Backend  → http://localhost:8000

## Replace in your repo
- Copy `src/services/api.ts` and `src/services/websocket.ts` into your project's `src/services/` folder.
- Put `.env.development` and `.env.production` in the project root.
- Place `package.json` at root (merge scripts if you already have one).
- Put `Dockerfile.backend`, `Dockerfile.frontend`, and `docker-compose.yml` at repo root.
- Copy `backend/.env.example` and create `backend/.env`.

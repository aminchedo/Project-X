# Local Run Pack

This pack gives you ready-to-use environment files, API config, and helper scripts to run your existing project locally (without committing secrets).

## 1) Files

```
local-run-pack/
├─ backend/.env               # Backend secrets (server-side only)
├─ frontend/.env              # Frontend public env (no secrets)
├─ config/api_config.json     # Endpoints + env variable names
└─ scripts/
   ├─ start_local.sh
   ├─ start_local.bat
   └─ test_ws.py
```

### backend/.env (generated from your api.txt)
- COINMARKETCAP_KEY=b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c
- CRYPTOCOMPARE_KEY=e79c8e...
- NEWSAPI_KEY=pub_34...
- TRONSCAN_KEY=7ae727...
- BSCSCAN_KEY=K62RKH...
- ETHERSCAN_KEY=SZHYFZ...
- ETHERSCAN_KEY_2=T6IR8V...

> NOTE: Do not move secrets to the frontend `.env`.

## 2) How to use

1. Place this `local-run-pack` folder at the root of your repo (next to your real `backend/` and `frontend/` folders).
2. Copy `backend/.env` into your actual backend folder (or point your runner to use it).
3. Copy `frontend/.env` into your actual frontend folder.
4. Review `config/api_config.json` and wire your service layer to read endpoints + env keys from it.

## 3) Quick checks

### Backend health
```
curl -fsS http://localhost:8000/health
```

### WebSocket ping
```
python scripts/test_ws.py
```

## 4) Security

- Keep secrets in **backend/.env** only.
- Never commit secrets to git. Use `.gitignore`.

## 5) What is the 24-hour thing?

It's the **automation service** of your remote dev environment that keeps watching your branch, syncing, and merging when policies allow. It's not a human—it's a background pipeline that monitors and reconciles changes. You don't have to do anything for it.

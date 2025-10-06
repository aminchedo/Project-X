# HTS Trading System - Quick Start Guide

## 🚀 Application Status
✅ **Backend**: Running on http://localhost:8000  
✅ **Frontend**: Running on http://localhost:5178  
✅ **Login Removed**: Direct access to dashboard enabled

## 📋 Quick Start Options

### Option 1: Use Startup Scripts (Recommended)

#### Windows:
```bash
# Double-click or run:
start_app.bat

# Or in PowerShell:
.\start_app.ps1
```

#### Linux/Mac:
```bash
chmod +x start_app.sh
./start_app.sh
```

### Option 2: Manual Start

#### Terminal 1 - Backend:
```bash
python -m uvicorn backend.simple_main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend:
```bash
npm run frontend:dev
```

## 🌐 Access URLs
- **Frontend**: http://localhost:5178 (or next available port)
- **Backend API**: http://localhost:8000
- **Health Check**: http://localhost:8000/health

## 🔧 What Was Fixed
1. **Removed Login Page**: App now goes directly to the dashboard
2. **Fixed Import Paths**: Resolved relative import issues in backend
3. **Created Startup Scripts**: Easy one-click startup for both servers
4. **Fixed File Paths**: Ensured correct index.html and main.tsx paths

## 📁 Key Files
- `src/App.tsx` - Main application (login removed)
- `backend/simple_main.py` - Simplified backend server
- `start_app.bat/.ps1/.sh` - Startup scripts
- `index.html` - Root HTML file

## 🎯 Features Available
- Professional Dashboard
- Market Scanner
- Trading Signals
- Portfolio Management
- Risk Monitoring
- Real-time Data
- Demo System
- Testing Framework

## 🆘 Troubleshooting
If ports are busy, the startup scripts will automatically find available ports.

For issues, check:
1. Backend health: `curl http://localhost:8000/health`
2. Frontend status: Check browser console
3. Port conflicts: Use `netstat -an | findstr LISTENING`

---
**Ready to trade!** 🎉

# HTS Trading System - Local Development Guide

## 🚀 Quick Start - Run Frontend + Backend Together

I've created several scripts to run both services together and solve your `ERR_CONNECTION_REFUSED` error:

### Option 1: One-Command Start (Recommended)

```bash
npm start
```

### Option 2: Platform-Specific Scripts

**Linux/Mac:**
```bash
./start-dev.sh
```

**Windows:**
```bash
start-dev.bat
```

**Cross-Platform (Node.js):**
```bash
node start.js
```

## 📋 What These Scripts Do

1. **Check System Requirements** - Verify Python and Node.js are installed
2. **Clean Up Ports** - Kill any existing processes on ports 8000 and 5173
3. **Install Dependencies** - Install both frontend and backend dependencies
4. **Start Backend** - Launch FastAPI server on port 8000
5. **Start Frontend** - Launch Vite dev server on port 5173
6. **Health Checks** - Wait for both services to be ready
7. **Display URLs** - Show you where to access the application

## 🎯 After Running the Script

You'll see:
```
🎉 HTS Trading System is running!
==================================
Frontend: http://localhost:5173
Backend:  http://localhost:8000
API Docs: http://localhost:8000/docs
Health:   http://localhost:8000/health

Press Ctrl+C to stop all services
```

## 🔧 Manual Setup (Alternative)

If you prefer to run services separately:

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 2. Start Backend (Terminal 1)

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

### 3. Start Frontend (Terminal 2)

```bash
npm run dev
```

## 🔍 Troubleshooting

### Common Issues:

1. **Port Already in Use**
   - The scripts automatically kill existing processes
   - Or manually: `lsof -ti :8000 | xargs kill -9` (Linux/Mac)

2. **Python Not Found**
   - Install Python 3.8+ from [python.org](https://python.org)
   - Make sure it's in your PATH

3. **Node.js Not Found**
   - Install Node.js 16+ from [nodejs.org](https://nodejs.org)

4. **Permission Denied (Linux/Mac)**
   - Run: `chmod +x start-dev.sh`

5. **Backend Dependencies Fail**
   - Some packages require system dependencies
   - Ubuntu/Debian: `sudo apt install python3-dev build-essential`
   - macOS: `xcode-select --install`

### Logs and Debugging:

- **Backend logs**: `backend.log`
- **Frontend logs**: `frontend.log`
- **Real-time logs**: Visible in the terminal when running scripts

## 📱 Available Scripts

I've added these npm scripts to your `package.json`:

```json
{
  "scripts": {
    "start": "chmod +x start-dev.sh && ./start-dev.sh",
    "start:windows": "start-dev.bat",
    "dev:frontend": "vite",
    "dev:backend": "cd backend && python main.py",
    "install:all": "npm install && cd backend && pip install -r requirements.txt"
  }
}
```

## 🌐 Accessing Your Application

Once running:

- **Main App**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🛑 Stopping Services

- **Ctrl+C** in the terminal running the script
- Or manually kill processes:
  ```bash
  # Kill backend
  lsof -ti :8000 | xargs kill -9
  
  # Kill frontend
  lsof -ti :5173 | xargs kill -9
  ```

## ✅ Testing the Fix

1. Run any of the start scripts
2. Wait for both services to start
3. Open http://localhost:5173 in your browser
4. Try logging in - the `ERR_CONNECTION_REFUSED` error should be gone!

## 🔄 Development Workflow

1. **Start services**: `npm start`
2. **Make changes** to frontend or backend code
3. **Auto-reload**: Both servers support hot reload
4. **Test changes** in browser
5. **Stop services**: Ctrl+C when done

Your login should now work perfectly since both frontend and backend are running together! 🎉
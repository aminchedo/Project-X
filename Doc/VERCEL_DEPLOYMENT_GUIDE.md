# HTS Trading System - Vercel Deployment Guide

## 🚨 Important: Vercel + Backend Deployment

Your application has **two parts** that need to be deployed separately:
1. **Frontend** (React/Vite) → Deploy to **Vercel**
2. **Backend** (FastAPI/Python) → Deploy to **Heroku**, **Railway**, or **Render**

## ⚡ Quick Fix for Current Issue

The `ERR_CONNECTION_REFUSED` error occurs because your backend isn't running. Here are your options:

### Option 1: Deploy Backend to Heroku (Recommended)

#### Step 1: Deploy Backend to Heroku

```bash
# 1. Install Heroku CLI
# Visit: https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create Heroku app for backend
cd backend
heroku create your-app-name-backend

# 4. Set environment variables
heroku config:set ENVIRONMENT=production
heroku config:set SECRET_KEY=your-secret-key-here
heroku config:set DATABASE_URL=sqlite:///./hts_trading.db

# 5. Deploy backend
git init
git add .
git commit -m "Initial backend deployment"
git push heroku main
```

#### Step 2: Update Frontend Configuration

1. **Get your Heroku backend URL**: `https://your-app-name-backend.herokuapp.com`

2. **Update Vercel environment variables**:
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add:
     ```
     REACT_APP_API_URL = https://your-app-name-backend.herokuapp.com
     REACT_APP_WS_URL = wss://your-app-name-backend.herokuapp.com
     ```

3. **Redeploy frontend on Vercel**

### Option 2: Use Railway (Alternative)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy backend
cd backend
railway login
railway init
railway up
```

### Option 3: Use Render (Alternative)

1. Go to [render.com](https://render.com)
2. Connect your GitHub repo
3. Create a new Web Service
4. Set:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: `ENVIRONMENT=production`

## 🔧 Files Created for Deployment

I've created these files for you:

### `/vercel.json` - Vercel Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### `/backend/Procfile` - Heroku Configuration
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
```

### `/backend/runtime.txt` - Python Version
```
python-3.11.6
```

## 🚀 Complete Deployment Steps

### Step 1: Deploy Backend First

Choose one platform:

**Heroku** (Free tier available):
```bash
cd backend
heroku create your-backend-name
git init
git add .
git commit -m "Backend deployment"
git push heroku main
```

**Railway** (Modern alternative):
```bash
cd backend
railway init
railway up
```

**Render** (Simple setup):
- Connect GitHub repo at render.com
- Select backend folder
- Deploy as Web Service

### Step 2: Update Frontend Environment

After backend deployment, get your backend URL and update:

**In Vercel Dashboard:**
1. Go to your project settings
2. Environment Variables section
3. Add: `REACT_APP_API_URL = https://your-backend-url`

**Or update vercel.json:**
```json
{
  "env": {
    "REACT_APP_API_URL": "https://your-actual-backend-url.herokuapp.com"
  }
}
```

### Step 3: Deploy Frontend to Vercel

```bash
# If not already deployed
vercel

# Or if already deployed, redeploy
vercel --prod
```

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Error**: Update `backend/main.py` CORS origins with your Vercel domain
2. **Environment Variables**: Make sure both platforms have correct env vars
3. **Build Errors**: Check that all dependencies are in requirements.txt

### Testing Your Deployment:

1. **Backend Health Check**: Visit `https://your-backend-url/health`
2. **Frontend**: Visit your Vercel URL
3. **Login Test**: Try logging in through the frontend

## 💡 Development vs Production

**Development** (Local):
- Frontend: `npm run dev` (port 5173)
- Backend: `python main.py` (port 8000)

**Production**:
- Frontend: Vercel (your-app.vercel.app)
- Backend: Heroku/Railway/Render (your-backend.herokuapp.com)

## 📝 Next Steps

1. Deploy backend to chosen platform
2. Get backend URL
3. Update Vercel environment variables
4. Redeploy frontend
5. Test the complete application

Your login should work once both services are properly deployed and connected!
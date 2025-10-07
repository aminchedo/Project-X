# ---------- Stage 1: Frontend build ----------
FROM node:20-alpine AS fe-build
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies (supports npm, pnpm, or yarn)
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm i; fi

# Copy source files
COPY src ./src
COPY index.html vite.config.* tsconfig*.json ./
COPY public ./public 2>/dev/null || true

# Build frontend
RUN npm run build

# ---------- Stage 2: Python API ----------
FROM python:3.11-slim AS api

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /app

# Copy and install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend ./backend

# Copy config directory
COPY config ./config

# Copy built frontend from previous stage
COPY --from=fe-build /app/dist ./dist

# Expose port (HF Spaces uses 7860 by default)
EXPOSE 7860

# Start the application
# Use PORT environment variable with fallback to 7860
CMD ["bash", "-lc", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
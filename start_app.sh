#!/bin/bash

echo "========================================"
echo "HTS Trading System Startup Script"
echo "========================================"
echo

echo "Starting Backend Server..."
cd "$(dirname "$0")"
python -m uvicorn backend.simple_main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo
echo "Waiting for backend to start..."
sleep 5

echo
echo "Starting Frontend Server..."
npm run frontend:dev &
FRONTEND_PID=$!

echo
echo "========================================"
echo "Both servers are starting..."
echo "========================================"
echo
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173 (or next available port)"
echo
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup processes on exit
cleanup() {
    echo
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait

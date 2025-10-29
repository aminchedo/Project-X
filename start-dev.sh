#!/bin/bash

# HTS Trading System - Development Startup Script
# This script starts both frontend and backend services

echo "🚀 Starting HTS Trading System..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -i :$1 >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill processes on specific ports
cleanup_ports() {
    echo -e "${YELLOW}Cleaning up existing processes...${NC}"
    
    if check_port 8000; then
        echo "Killing process on port 8000..."
        lsof -ti :8000 | xargs kill -9 2>/dev/null || true
    fi
    
    if check_port 3000; then
        echo "Killing process on port 3000..."
        lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    fi
    
    if check_port 5173; then
        echo "Killing process on port 5173..."
        lsof -ti :5173 | xargs kill -9 2>/dev/null || true
    fi
    
    sleep 2
}

# Function to check if Python is installed
check_python() {
    if command -v python3 &> /dev/null; then
        echo -e "${GREEN}✓ Python3 found${NC}"
        return 0
    elif command -v python &> /dev/null; then
        echo -e "${GREEN}✓ Python found${NC}"
        return 0
    else
        echo -e "${RED}✗ Python not found. Please install Python 3.8+${NC}"
        return 1
    fi
}

# Function to check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✓ Node.js found ($(node --version))${NC}"
        return 0
    else
        echo -e "${RED}✗ Node.js not found. Please install Node.js 16+${NC}"
        return 1
    fi
}

# Function to install backend dependencies
install_backend_deps() {
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv 2>/dev/null || python -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    pip install --upgrade pip
    pip install -r requirements.txt
    
    cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
}

# Function to install frontend dependencies
install_frontend_deps() {
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting Backend Server (Port 8000)...${NC}"
    cd backend
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Start backend in background
    python3 main.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    
    cd ..
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend started successfully on http://localhost:8000${NC}"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "${RED}✗ Backend failed to start${NC}"
    return 1
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting Frontend Server (Port 5173)...${NC}"
    
    # Start frontend in background
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    echo "Waiting for frontend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:5173 >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Frontend started successfully on http://localhost:5173${NC}"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    echo -e "${RED}✗ Frontend failed to start${NC}"
    return 1
}

# Function to display running services
show_services() {
    echo ""
    echo -e "${GREEN}🎉 HTS Trading System is running!${NC}"
    echo "=================================="
    echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
    echo -e "${BLUE}Backend:${NC}  http://localhost:8000"
    echo -e "${BLUE}API Docs:${NC} http://localhost:8000/docs"
    echo -e "${BLUE}Health:${NC}   http://localhost:8000/health"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    echo ""
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    cleanup_ports
    
    echo -e "${GREEN}✓ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo -e "${BLUE}Checking system requirements...${NC}"
    
    # Check requirements
    if ! check_python || ! check_node; then
        exit 1
    fi
    
    # Cleanup existing processes
    cleanup_ports
    
    # Install dependencies
    install_backend_deps
    install_frontend_deps
    
    # Start services
    if start_backend && start_frontend; then
        show_services
        
        # Keep script running
        while true; do
            sleep 1
        done
    else
        echo -e "${RED}Failed to start services${NC}"
        cleanup
        exit 1
    fi
}

# Run main function
main
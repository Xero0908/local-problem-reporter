#!/bin/bash

# Local Problem Reporter - Development Startup Script (macOS/Linux)
# This script starts both the backend and frontend servers

echo ""
echo "========================================"
echo "🚨 Local Problem Reporter - Dev Startup"
echo "========================================"
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    echo "Please install from https://nodejs.org/"
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ ERROR: Python 3 is not installed"
    echo "Please install from https://python.org/"
    read -p "Press Enter to exit..."
    exit 1
fi

echo "✓ Node.js and Python found"
echo ""

# Start Backend
echo "📦 Starting Backend Server (Port 8000)..."
echo ""

cd backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!

cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo "📱 Starting Frontend Server (Port 3000)..."
echo ""

cd frontend
npm start &
FRONTEND_PID=$!

cd ..

# Wait a bit more
sleep 2

echo "========================================"
echo "✓ Both servers starting..."
echo "========================================"
echo ""

echo "🔗 Frontend:  http://localhost:3000"
echo "🔗 Backend:   http://localhost:8000"
echo "📚 API Docs:  http://localhost:8000/docs"
echo ""
echo "To stop servers: Press Ctrl+C or close this window"
echo ""

# Wait for either process to exit
wait -n
# If one exits, kill the other
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null

echo "Servers stopped."

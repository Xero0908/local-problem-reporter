@echo off
REM Local Problem Reporter - Development Startup Script
REM This script starts both the backend and frontend servers

echo.
echo ========================================
echo 🚨 Local Problem Reporter - Dev Startup
echo ========================================
echo.

REM Check if Node is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo Please install from https://python.org/
    pause
    exit /b 1
)

echo ✓ Node.js and Python found
echo.

REM Start Backend
echo 📦 Starting Backend Server (Port 8000)...
echo.
cd backend
start "Local Problem Reporter - Backend" cmd /k "venv\Scripts\activate && python run.py"
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start Frontend
echo 📱 Starting Frontend Server (Port 3000)...
echo.
cd frontend
start "Local Problem Reporter - Frontend" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo ✓ Both servers starting...
echo ========================================
echo.
echo 🔗 Frontend:  http://localhost:3000
echo 🔗 Backend:   http://localhost:8000
echo 📚 API Docs:  http://localhost:8000/docs
echo.
echo To stop servers: Close the command windows or press Ctrl+C
echo.
pause

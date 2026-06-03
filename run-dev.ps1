# Local Problem Reporter - Development Startup Script (PowerShell)
# This script starts both the backend and frontend servers

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚨 Local Problem Reporter - Dev Startup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Node is installed
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "❌ ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install from https://nodejs.org/`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Python is installed
$pythonCheck = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCheck) {
    Write-Host "❌ ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install from https://python.org/`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ Node.js and Python found`n" -ForegroundColor Green

# Start Backend
Write-Host "📦 Starting Backend Server (Port 8000)..." -ForegroundColor Yellow
Write-Host ""

$backendPath = ".\backend"
$backendCommand = {
    Set-Location $backendPath
    & ".\venv\Scripts\Activate.ps1"
    python run.py
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; $backendCommand"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "📱 Starting Frontend Server (Port 3000)..." -ForegroundColor Yellow
Write-Host ""

$frontendPath = ".\frontend"
$frontendCommand = {
    Set-Location $frontendPath
    npm start
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; $frontendCommand"

# Wait a bit more
Start-Sleep -Seconds 2

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Both servers starting..." -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "🔗 Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop servers: Close the command windows or press Ctrl+C" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to close this window"

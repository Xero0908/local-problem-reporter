@echo off
REM Ultra-simple start script - one command does everything

echo Starting Local Problem Reporter...
echo.

REM Kill any existing processes on ports 8000 and 3000
taskkill /F /IM python.exe /T 2>nul
taskkill /F /IM node.exe /T 2>nul

REM Wait a moment
timeout /t 2 /nobreak

REM Start backend
cd backend
start "Backend" python run.py
cd ..

REM Wait for backend to initialize
timeout /t 3 /nobreak

REM Start frontend
cd frontend
start "Frontend" npm start
cd ..

echo.
echo Servers starting...
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo.
echo Login: admin@authority.com / admin123
echo.
pause

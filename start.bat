@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================
echo UpacharKhoj Nepal - Quick Start
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.11+ from python.org
    echo.
    pause
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js 20+ from nodejs.org
    echo.
    pause
    exit /b 1
)

echo [1/5] Setting up Backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Upgrading pip...
python -m pip install --upgrade pip --quiet

echo Installing dependencies...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo [WARNING] Some dependencies may have failed. Trying again...
    pip install -r requirements.txt
)

echo.
echo Running migrations...
python manage.py migrate
if errorlevel 1 (
    echo [ERROR] Migration failed! Check the error above.
    pause
    exit /b 1
)

echo.
echo Creating seed data (demo hospitals, users, services)...
python manage.py seed_data
if errorlevel 1 (
    echo [WARNING] Seed data may already exist or failed. Continuing...
)

echo.
echo [2/5] Starting Backend Server...
start "UpacharKhoj Backend" cmd /k "cd /d %cd% && call venv\Scripts\activate.bat && python manage.py runserver"

timeout /t 5 /nobreak > nul

cd ..

echo.
echo [3/5] Setting up Frontend...
cd frontend

if not exist "node_modules" (
    echo Installing dependencies (this may take 2-5 minutes)...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed! Check your internet connection.
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo.
echo [4/5] Starting Frontend Server...
start "UpacharKhoj Frontend" cmd /k "cd /d %cd% && npm run dev"

timeout /t 3 /nobreak > nul

cd ..

echo.
echo [5/5] Opening browser...
timeout /t 8 /nobreak > nul
start http://localhost:3000

echo.
echo ========================================
echo ✅ UpacharKhoj Nepal is running!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo Django Admin: http://localhost:8000/admin
echo.
echo LOGIN CREDENTIALS:
echo   System Admin:    admin / Admin@123
echo   Hospital Staff:  hospital1_staff / Staff@123
echo   Health Worker:   hw1 / HealthWorker@123
echo.
echo Two terminal windows opened:
echo   - UpacharKhoj Backend (Django server)
echo   - UpacharKhoj Frontend (Vite dev server)
echo.
echo Close those windows to stop the servers.
echo Check README.md or CREDENTIALS.md for all features!
echo.
pause

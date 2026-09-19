@echo off
echo ========================================
echo UpacharKhoj Nepal - Error Fix Script
echo ========================================
echo.
echo This script will fix common errors...
echo.

cd backend

echo [1/6] Cleaning old virtual environment...
if exist "venv" (
    echo Removing old venv...
    rmdir /s /q venv
)

echo.
echo [2/6] Creating fresh virtual environment...
python -m venv venv
if errorlevel 1 (
    echo [ERROR] Failed to create venv. Is Python installed?
    echo Install Python 3.11+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo.
echo [3/6] Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo [4/6] Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [5/6] Resetting database...
if exist "db.sqlite3" (
    del db.sqlite3
    echo Database deleted.
)

python manage.py migrate
if errorlevel 1 (
    echo [ERROR] Migration failed
    pause
    exit /b 1
)

echo.
echo [6/6] Creating fresh seed data...
python manage.py seed_data
if errorlevel 1 (
    echo [WARNING] Seed data might have failed
)

cd ..

echo.
echo ========================================
echo ✅ Backend errors fixed!
echo ========================================
echo.
echo Now fixing frontend...
echo.

cd frontend

echo [1/3] Cleaning node_modules...
if exist "node_modules" (
    echo Removing old node_modules... (this may take a minute)
    rmdir /s /q node_modules
)

echo.
echo [2/3] Cleaning npm cache...
call npm cache clean --force

echo.
echo [3/3] Installing fresh dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed
    echo Make sure Node.js 20+ is installed from https://nodejs.org/
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo ✅ All errors fixed!
echo ========================================
echo.
echo You can now run: start.bat
echo.
echo Or manually:
echo   Terminal 1: cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
echo   Terminal 2: cd frontend ^&^& npm run dev
echo.
pause

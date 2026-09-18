#!/bin/bash

echo "========================================"
echo "UpacharKhoj Nepal - Error Fix Script"
echo "========================================"
echo ""
echo "This script will fix common errors..."
echo ""

cd backend

echo "[1/6] Cleaning old virtual environment..."
if [ -d "venv" ]; then
    echo "Removing old venv..."
    rm -rf venv
fi

echo ""
echo "[2/6] Creating fresh virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to create venv. Is Python 3.11+ installed?"
    exit 1
fi

echo ""
echo "[3/6] Activating virtual environment..."
source venv/bin/activate

echo ""
echo "[4/6] Installing dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi

echo ""
echo "[5/6] Resetting database..."
if [ -f "db.sqlite3" ]; then
    rm db.sqlite3
    echo "Database deleted."
fi

python manage.py migrate
if [ $? -ne 0 ]; then
    echo "[ERROR] Migration failed"
    exit 1
fi

echo ""
echo "[6/6] Creating fresh seed data..."
python manage.py seed_data

cd ..

echo ""
echo "========================================"
echo "✅ Backend errors fixed!"
echo "========================================"
echo ""
echo "Now fixing frontend..."
echo ""

cd frontend

echo "[1/3] Cleaning node_modules..."
if [ -d "node_modules" ]; then
    echo "Removing old node_modules..."
    rm -rf node_modules
fi

echo ""
echo "[2/3] Cleaning npm cache..."
npm cache clean --force

echo ""
echo "[3/3] Installing fresh dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] npm install failed"
    echo "Make sure Node.js 20+ is installed"
    exit 1
fi

cd ..

echo ""
echo "========================================"
echo "✅ All errors fixed!"
echo "========================================"
echo ""
echo "You can now run: ./start.sh"
echo ""
echo "Or manually:"
echo "  Terminal 1: cd backend && source venv/bin/activate && python manage.py runserver"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""

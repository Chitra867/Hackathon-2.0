#!/bin/bash

echo "========================================"
echo "UpacharKhoj Nepal - Quick Start"
echo "========================================"
echo ""

echo "[1/4] Setting up Backend..."
cd backend

echo "Creating virtual environment..."
python3 -m venv venv

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running migrations..."
python manage.py migrate

echo "Creating seed data (demo hospitals, users, services)..."
python manage.py seed_data

echo ""
echo "[2/4] Starting Backend Server..."
gnome-terminal -- bash -c "cd $(pwd) && source venv/bin/activate && python manage.py runserver; exec bash" 2>/dev/null || \
xterm -e "cd $(pwd) && source venv/bin/activate && python manage.py runserver" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && source venv/bin/activate && python manage.py runserver"' 2>/dev/null &

sleep 3

cd ..

echo ""
echo "[3/4] Setting up Frontend..."
cd frontend

echo "Installing dependencies (this may take a few minutes)..."
npm install

echo ""
echo "[4/4] Starting Frontend Server..."
gnome-terminal -- bash -c "cd $(pwd) && npm run dev; exec bash" 2>/dev/null || \
xterm -e "cd $(pwd) && npm run dev" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"' 2>/dev/null &

echo ""
echo "========================================"
echo "✅ UpacharKhoj Nepal is starting!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Django Admin: http://localhost:8000/admin"
echo ""
echo "LOGIN CREDENTIALS:"
echo "  System Admin:    admin / Admin@123"
echo "  Hospital Staff:  hospital1_staff / Staff@123"
echo "  Health Worker:   hw1 / HealthWorker@123"
echo ""
echo "Check the README.md for all credentials and features!"
echo ""

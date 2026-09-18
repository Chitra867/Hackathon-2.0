@echo off
echo ========================================
echo Installing ALL Dependencies
echo UpacharKhoj Nepal Backend
echo ========================================
echo.

cd /d "%~dp0backend"

echo [Step 1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    echo Please install Python 3.11+ from https://python.org
    echo Make sure to check "Add Python to PATH"
    pause
    exit /b 1
)
python --version
echo.

echo [Step 2/5] Upgrading pip...
python -m pip install --upgrade pip
echo.

echo [Step 3/5] Installing ALL required packages...
echo This will take 2-3 minutes...
echo.

python -m pip install Django==4.2.16
python -m pip install djangorestframework==3.15.2
python -m pip install djangorestframework-simplejwt==5.3.1
python -m pip install django-cors-headers==4.4.0
python -m pip install psycopg2-binary==2.9.9
python -m pip install python-decouple==3.8
python -m pip install Pillow==10.4.0
python -m pip install channels==4.1.0
python -m pip install channels-redis==4.2.0
python -m pip install daphne==4.1.2
python -m pip install redis==5.0.8
python -m pip install django-filter==24.3

echo.
echo [Step 4/5] Verifying installations...
python -c "import django; print('✓ Django', django.get_version())"
python -c "import rest_framework; print('✓ Django REST Framework')"
python -c "import rest_framework_simplejwt; print('✓ SimpleJWT')"
python -c "import corsheaders; print('✓ django-cors-headers')"
python -c "import channels; print('✓ Django Channels')"
python -c "import decouple; print('✓ python-decouple')"
echo.

echo [Step 5/5] Running migrations...
python manage.py migrate
if errorlevel 1 (
    echo [WARNING] Migrations had issues, but continuing...
)
echo.

echo ========================================
echo ✅ All dependencies installed!
echo ========================================
echo.
echo Next steps:
echo   1. Run: python manage.py seed_data
echo   2. Run: python manage.py runserver
echo.
echo Or simply run: start.bat from main folder
echo.
pause

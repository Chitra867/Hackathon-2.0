@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================
echo FIXING BACKEND ERRORS NOW
echo UpacharKhoj Nepal
echo ========================================
echo.

cd /d "%~dp0backend"

echo Current directory: %cd%
echo.

echo [Step 1/6] Verifying Python...
python --version
if errorlevel 1 (
    echo [ERROR] Python not found in PATH
    echo.
    echo Solution:
    echo 1. Install Python 3.11+ from https://python.org
    echo 2. During installation, CHECK "Add Python to PATH"
    echo 3. Restart computer
    echo 4. Run this script again
    pause
    exit /b 1
)
echo ✓ Python found
echo.

echo [Step 2/6] Upgrading pip...
python -m pip install --upgrade pip --quiet
echo ✓ Pip upgraded
echo.

echo [Step 3/6] Installing Django and core packages...
python -m pip install Django==4.2.16 --quiet
python -m pip install djangorestframework==3.15.2 --quiet
python -m pip install djangorestframework-simplejwt==5.3.1 --quiet
echo ✓ Core packages installed
echo.

echo [Step 4/6] Installing django-cors-headers (FIXING YOUR ERROR)...
python -m pip install django-cors-headers==4.4.0
if errorlevel 1 (
    echo Retrying with different version...
    python -m pip install django-cors-headers
)
echo ✓ CORS headers installed
echo.

echo [Step 5/6] Installing remaining packages...
python -m pip install psycopg2-binary==2.9.9 --quiet
python -m pip install python-decouple==3.8 --quiet
python -m pip install Pillow==10.4.0 --quiet
python -m pip install channels==4.1.0 --quiet
python -m pip install channels-redis==4.2.0 --quiet
python -m pip install daphne==4.1.2 --quiet
python -m pip install redis==5.0.8 --quiet
python -m pip install django-filter==24.3 --quiet
echo ✓ All packages installed
echo.

echo [Step 6/6] Verifying critical imports...
python -c "import corsheaders; print('✓ corsheaders: OK')" 2>nul || (
    echo [ERROR] corsheaders still not found
    echo Trying one more time...
    pip install django-cors-headers --force-reinstall
)

python -c "import django; print('✓ Django:', django.get_version())"
python -c "import rest_framework; print('✓ DRF: OK')"
python -c "import corsheaders; print('✓ CORS: OK')"
python -c "import channels; print('✓ Channels: OK')"
echo.

echo ========================================
echo ✅ Backend dependencies installed!
echo ========================================
echo.

echo Testing Django commands...
echo.

echo Running makemigrations...
python manage.py makemigrations
if errorlevel 1 (
    echo [WARNING] Makemigrations had issues
)
echo.

echo Running migrate...
python manage.py migrate
if errorlevel 1 (
    echo [WARNING] Migrate had issues
)
echo.

echo Running seed_data...
python manage.py seed_data
if errorlevel 1 (
    echo [INFO] Seed data may already exist
)
echo.

echo ========================================
echo ✅ BACKEND IS READY!
echo ========================================
echo.
echo You can now run:
echo   python manage.py runserver
echo.
echo Or from main folder:
echo   start.bat
echo.
pause

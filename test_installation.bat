@echo off
echo ========================================
echo UpacharKhoj Nepal - Installation Test
echo ========================================
echo.
echo This script checks if everything is set up correctly.
echo.

set ERROR=0

echo [1/8] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [X] FAIL: Python not found
    echo     Install from https://python.org
    set ERROR=1
) else (
    python --version
    echo [✓] PASS: Python installed
)
echo.

echo [2/8] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] FAIL: Node.js not found
    echo     Install from https://nodejs.org
    set ERROR=1
) else (
    node --version
    echo [✓] PASS: Node.js installed
)
echo.

echo [3/8] Checking npm installation...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] FAIL: npm not found
    set ERROR=1
) else (
    npm --version
    echo [✓] PASS: npm installed
)
echo.

echo [4/8] Checking backend directory...
if exist "backend\manage.py" (
    echo [✓] PASS: Backend files exist
) else (
    echo [X] FAIL: backend\manage.py not found
    set ERROR=1
)
echo.

echo [5/8] Checking frontend directory...
if exist "frontend\package.json" (
    echo [✓] PASS: Frontend files exist
) else (
    echo [X] FAIL: frontend\package.json not found
    set ERROR=1
)
echo.

echo [6/8] Checking requirements.txt...
if exist "backend\requirements.txt" (
    echo [✓] PASS: requirements.txt found
) else (
    echo [X] FAIL: requirements.txt not found
    set ERROR=1
)
echo.

echo [7/8] Checking vite.config.ts...
if exist "frontend\vite.config.ts" (
    echo [✓] PASS: vite.config.ts found
) else (
    echo [X] FAIL: vite.config.ts not found
    set ERROR=1
)
echo.

echo [8/8] Checking helper scripts...
if exist "start.bat" (
    echo [✓] PASS: start.bat found
) else (
    echo [X] FAIL: start.bat not found
    set ERROR=1
)
if exist "fix_errors.bat" (
    echo [✓] PASS: fix_errors.bat found
) else (
    echo [X] FAIL: fix_errors.bat not found
    set ERROR=1
)
echo.

echo ========================================
if %ERROR%==0 (
    echo ✅ All checks passed!
    echo.
    echo You're ready to run the application.
    echo.
    echo Next steps:
    echo   1. Run: start.bat
    echo   2. Wait 30 seconds
    echo   3. Open: http://localhost:3000
    echo.
    echo If you encounter errors, run: fix_errors.bat
) else (
    echo ❌ Some checks failed!
    echo.
    echo Please fix the issues above before running start.bat
    echo.
    echo Common fixes:
    echo   - Install Python 3.11+ from https://python.org
    echo   - Install Node.js 20+ from https://nodejs.org
    echo   - Make sure you're in the UpacharKhoj folder
)
echo ========================================
echo.
pause

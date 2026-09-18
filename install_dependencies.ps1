# UpacharKhoj Nepal - Install Dependencies (PowerShell)
# Run this in PowerShell: .\install_dependencies.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Installing Backend Dependencies" -ForegroundColor Cyan
Write-Host "UpacharKhoj Nepal" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "$PSScriptRoot\backend"

Write-Host "[Step 1/6] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found!" -ForegroundColor Red
    Write-Host "Install from https://python.org" -ForegroundColor Red
    pause
    exit 1
}
Write-Host ""

Write-Host "[Step 2/6] Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip | Out-Null
Write-Host "✓ Pip upgraded" -ForegroundColor Green
Write-Host ""

Write-Host "[Step 3/6] Installing Django core..." -ForegroundColor Yellow
python -m pip install Django==4.2.16 | Out-Null
python -m pip install djangorestframework==3.15.2 | Out-Null
python -m pip install djangorestframework-simplejwt==5.3.1 | Out-Null
Write-Host "✓ Django installed" -ForegroundColor Green
Write-Host ""

Write-Host "[Step 4/6] Installing django-cors-headers (FIXING ERROR)..." -ForegroundColor Yellow
python -m pip install django-cors-headers==4.4.0
if ($LASTEXITCODE -ne 0) {
    Write-Host "Retrying..." -ForegroundColor Yellow
    python -m pip install django-cors-headers
}
Write-Host "✓ CORS headers installed" -ForegroundColor Green
Write-Host ""

Write-Host "[Step 5/6] Installing remaining packages..." -ForegroundColor Yellow
$packages = @(
    "psycopg2-binary==2.9.9",
    "python-decouple==3.8",
    "Pillow==10.4.0",
    "channels==4.1.0",
    "channels-redis==4.2.0",
    "daphne==4.1.2",
    "redis==5.0.8",
    "django-filter==24.3"
)

foreach ($package in $packages) {
    python -m pip install $package --quiet
}
Write-Host "✓ All packages installed" -ForegroundColor Green
Write-Host ""

Write-Host "[Step 6/6] Verifying installations..." -ForegroundColor Yellow
$imports = @(
    "import django; print('✓ Django', django.get_version())",
    "import rest_framework; print('✓ Django REST Framework')",
    "import corsheaders; print('✓ django-cors-headers')",
    "import channels; print('✓ Django Channels')"
)

foreach ($import in $imports) {
    python -c $import
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Dependencies Installed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Running migrations..." -ForegroundColor Yellow
python manage.py migrate

Write-Host ""
Write-Host "Creating seed data..." -ForegroundColor Yellow
python manage.py seed_data

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ BACKEND READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Start server with:" -ForegroundColor Yellow
Write-Host "  python manage.py runserver" -ForegroundColor White
Write-Host ""
pause

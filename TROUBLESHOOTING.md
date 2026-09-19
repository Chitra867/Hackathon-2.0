# 🔧 Troubleshooting Guide - UpacharKhoj Nepal

This guide helps you fix common issues when running the application.

---

## 🚨 Common Issues & Solutions

### 1. Backend Won't Start

#### Error: "python: command not found" or "Python not found"
**Solution**:
```bash
# Install Python 3.11+ from https://www.python.org/downloads/
# Make sure to check "Add Python to PATH" during installation
# Verify installation:
python --version  # Should show Python 3.11 or higher
```

#### Error: "No module named 'django'" or module import errors
**Solution**:
```bash
cd backend
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

#### Error: "ModuleNotFoundError: No module named 'apps'"
**Solution**: Make sure you're running from the `backend/` directory:
```bash
cd C:\Users\rajju\Music\UpacharKhoj\backend
python manage.py runserver
```

#### Error: Database migrations fail
**Solution**:
```bash
cd backend
# Delete existing database
del db.sqlite3  # Windows
rm db.sqlite3  # Linux/Mac

# Re-run migrations
python manage.py migrate
python manage.py seed_data
```

#### Error: "Port 8000 is already in use"
**Solution**:
```bash
# Windows - Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9

# Or use a different port
python manage.py runserver 8001
```

---

### 2. Frontend Won't Start

#### Error: "node: command not found" or "npm: command not found"
**Solution**:
```bash
# Install Node.js 20+ from https://nodejs.org/
# Verify installation:
node --version  # Should show v20 or higher
npm --version
```

#### Error: "Cannot find module" or dependencies missing
**Solution**:
```bash
cd frontend

# Delete node_modules and reinstall
rmdir /s /q node_modules  # Windows
rm -rf node_modules  # Linux/Mac

npm install
```

#### Error: "Port 3000 is already in use"
**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.ts:
# server: { port: 3001 }
```

#### Error: TypeScript compilation errors
**Solution**:
```bash
cd frontend

# Clear TypeScript cache
rmdir /s /q node_modules\.vite  # Windows
rm -rf node_modules/.vite  # Linux/Mac

npm run dev
```

---

### 3. CORS Errors

#### Error: "CORS policy: No 'Access-Control-Allow-Origin'"
**Solution**:
1. Make sure backend is running on port 8000
2. Check `backend/upacharkhoj/settings.py`:
```python
CORS_ALLOW_ALL_ORIGINS = True  # Should be True for development
```
3. Restart backend server

---

### 4. Login Not Working

#### Can't login with credentials
**Solutions**:
1. **Reset database and seed data**:
```bash
cd backend
del db.sqlite3
python manage.py migrate
python manage.py seed_data
```

2. **Verify seed data ran**:
```bash
python manage.py shell
>>> from apps.accounts.models import User
>>> User.objects.filter(username='admin').exists()
True  # Should be True
>>> exit()
```

3. **Create superuser manually** (if seed_data failed):
```bash
python manage.py createsuperuser
# Username: admin
# Email: admin@example.com
# Password: Admin@123
# Password (again): Admin@123
```

---

### 5. No Data Showing / Empty Search Results

#### Solution 1: Re-run seed data
```bash
cd backend
python manage.py seed_data
```

#### Solution 2: Check backend is running
- Open http://localhost:8000/api/hospitals/
- Should see JSON data with hospitals
- If page doesn't load, backend isn't running

#### Solution 3: Check frontend API connection
- Open browser DevTools (F12)
- Go to Console tab
- Look for errors like "Failed to fetch" or "Network Error"
- If you see errors, backend might not be running

---

### 6. Docker Issues

#### Error: "docker-compose: command not found"
**Solution**:
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
```

#### Error: Container won't start
**Solution**:
```bash
# Stop all containers
docker-compose down

# Remove volumes and rebuild
docker-compose down -v
docker-compose up --build
```

#### Error: "Port is already allocated"
**Solution**:
```bash
# Stop conflicting services
docker-compose down

# Or change ports in docker-compose.yml:
# ports:
#   - "8001:8000"  # Backend
#   - "3001:3000"  # Frontend
```

---

### 7. Virtual Environment Issues

#### Can't activate venv (Windows)
**Error**: "cannot be loaded because running scripts is disabled"
**Solution**:
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Can't activate venv (Linux/Mac)
**Solution**:
```bash
# Make sure you're in backend directory
cd backend

# Activate with correct command
source venv/bin/activate

# Your prompt should show (venv) prefix
```

---

### 8. Installation Takes Too Long

#### npm install is slow
**Solution**:
```bash
# Use faster registry
npm install --registry=https://registry.npmmirror.com

# Or use yarn instead
npm install -g yarn
yarn install
```

#### pip install is slow
**Solution**:
```bash
pip install -r requirements.txt --index-url https://pypi.org/simple
```

---

## 🔍 Quick Diagnostic Commands

### Check Backend Status
```bash
cd backend
python manage.py check
python manage.py showmigrations
```

### Check if services are running
```bash
# Check if backend is responding
curl http://localhost:8000/api/hospitals/

# Check if frontend is responding
curl http://localhost:3000
```

### View Django logs
```bash
# Backend terminal shows all requests and errors
# Look for lines with [ERROR] or Traceback
```

### View Frontend logs
```bash
# Frontend terminal shows Vite dev server logs
# Browser DevTools (F12) > Console shows JavaScript errors
```

---

## 🆘 Still Having Issues?

### Step 1: Clean Installation
```bash
# 1. Delete virtual environment
cd backend
rmdir /s /q venv  # Windows
rm -rf venv  # Linux/Mac

# 2. Delete node_modules
cd ../frontend
rmdir /s /q node_modules  # Windows
rm -rf node_modules  # Linux/Mac

# 3. Delete database
cd ../backend
del db.sqlite3  # Windows
rm db.sqlite3  # Linux/Mac

# 4. Run start.bat again
cd ..
start.bat  # Windows
./start.sh  # Linux/Mac
```

### Step 2: Manual Step-by-Step Start

**Terminal 1 - Backend:**
```bash
cd C:\Users\rajju\Music\UpacharKhoj\backend
python -m venv venv
venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd C:\Users\rajju\Music\UpacharKhoj\frontend
npm install
npm run dev
```

### Step 3: Check System Requirements
- **Python**: 3.11 or higher (`python --version`)
- **Node.js**: 20 or higher (`node --version`)
- **npm**: 9 or higher (`npm --version`)
- **Disk Space**: At least 500MB free
- **RAM**: At least 4GB

---

## 📞 Error Messages Decoder

| Error Message | Likely Cause | Solution |
|---------------|--------------|----------|
| "ModuleNotFoundError" | Missing Python package | `pip install -r requirements.txt` |
| "Cannot find module" | Missing npm package | `npm install` |
| "Port already in use" | Another process using port | Kill process or change port |
| "CORS error" | Backend not configured | Check CORS_ALLOW_ALL_ORIGINS=True |
| "401 Unauthorized" | Not logged in or token expired | Log in again |
| "404 Not Found" | Backend not running or wrong URL | Start backend server |
| "Network Error" | Backend not reachable | Check backend is running on :8000 |
| "Syntax Error" | Code issue | Check recent file changes |

---

## ✅ Verification Steps

After fixing issues, verify everything works:

1. **Backend running**: http://localhost:8000/api/hospitals/ shows JSON
2. **Frontend running**: http://localhost:3000 shows homepage
3. **Can search**: Search for "ICU" returns results
4. **Can login**: Login with `hw1` / `HealthWorker@123` works
5. **Can view hospital**: Click any hospital shows detail page
6. **Can create referral**: Login as health worker, create referral succeeds

---

## 🔄 Reset Everything (Nuclear Option)

If nothing works, completely start over:

```bash
# 1. Go to project parent directory
cd C:\Users\rajju\Music

# 2. Backup if needed
# (copy important changes elsewhere)

# 3. Delete entire project
rmdir /s /q UpacharKhoj  # Windows
rm -rf UpacharKhoj  # Linux/Mac

# 4. Re-extract/clone the project
# Then run start.bat
```

---

**Last Updated**: September 18, 2026  
**Platform**: UpacharKhoj Nepal v1.0

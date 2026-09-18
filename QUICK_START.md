# 🚀 Quick Start Guide - UpacharKhoj Nepal

Get the application running in 2 minutes!

---

## ⚡ Super Quick Start (Windows)

1. **Open terminal** in the project folder:
   ```
   C:\Users\rajju\Music\UpacharKhoj
   ```

2. **Run this command**:
   ```cmd
   start.bat
   ```

3. **Wait 30 seconds** - Two terminal windows will open

4. **Open browser**: http://localhost:3000

**Done!** 🎉

---

## ⚡ Super Quick Start (Linux/Mac)

1. **Open terminal** in the project folder

2. **Run this command**:
   ```bash
   ./start.sh
   ```

3. **Wait 30 seconds**

4. **Open browser**: http://localhost:3000

**Done!** 🎉

---

## 🔐 Login Credentials

Try these accounts:

| Role | Username | Password |
|------|----------|----------|
| **Health Worker** | `hw1` | `HealthWorker@123` |
| **Hospital Staff** | `hospital1_staff` | `Staff@123` |
| **Admin** | `admin` | `Admin@123` |

---

## 🧪 Test the Features

### 1. Public Search (No login needed)
- Go to http://localhost:3000
- Search for "ICU" or "MRI"
- Click any hospital to see details

### 2. Health Worker (Create Referral)
- Login: `hw1` / `HealthWorker@123`
- Click "New Referral"
- Select service → Choose hospital → Fill details → Submit

### 3. Hospital Staff (View Dashboard)
- Login: `hospital1_staff` / `Staff@123`
- See availability summary
- See pending referrals

---

## ❌ Having Errors?

### Quick Fix Option 1: Run Fix Script
```cmd
fix_errors.bat  (Windows)
./fix_errors.sh  (Linux/Mac)
```

### Quick Fix Option 2: Manual Reset
```bash
# Delete and recreate
cd backend
rm -rf venv db.sqlite3  # Linux/Mac
rmdir /s /q venv && del db.sqlite3  # Windows

# Then run start.bat again
```

### Still not working?
See **TROUBLESHOOTING.md** for detailed solutions.

---

## 📌 Important URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/hospitals/
- **Django Admin**: http://localhost:8000/admin

---

## 🛑 Stop the Servers

Close the two terminal windows that opened, or press `Ctrl+C` in each terminal.

---

## 📚 Learn More

- **README.md** - Full documentation
- **CREDENTIALS.md** - All login accounts
- **TROUBLESHOOTING.md** - Fix common errors

---

## ✅ Checklist

Before running, make sure you have:
- [ ] Python 3.11+ installed (`python --version`)
- [ ] Node.js 20+ installed (`node --version`)
- [ ] Internet connection (for first-time setup)
- [ ] At least 500MB free disk space

---

## 🎯 What You Get

After running successfully:
- ✅ 5 demo hospitals with availability data
- ✅ 13 user accounts across 5 roles
- ✅ 15 healthcare services
- ✅ Sample referrals with different statuses
- ✅ Full-featured healthcare coordination platform

---

**Need help?** Check TROUBLESHOOTING.md or run `fix_errors.bat`

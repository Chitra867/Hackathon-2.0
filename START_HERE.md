# 🎯 START HERE - UpacharKhoj Nepal

**Welcome! This is your starting point for the healthcare platform.**

---

## ⚡ Quick Start (30 seconds)

### Step 1: Open Terminal
Open Command Prompt or PowerShell in this folder:
```
C:\Users\rajju\Music\UpacharKhoj
```

### Step 2: Run This Command
```cmd
start.bat
```

### Step 3: Wait
Two terminal windows will open. Wait about 30-60 seconds.

### Step 4: Open Browser
Go to: **http://localhost:3000**

**Done!** 🎉

---

## 🔐 Login Now

Try these accounts:

| What You Want to Do | Username | Password |
|---------------------|----------|----------|
| Create a referral | `hw1` | `HealthWorker@123` |
| Manage hospital | `hospital1_staff` | `Staff@123` |
| Admin everything | `admin` | `Admin@123` |

---

## ❌ Getting Errors?

### Quick Fix (works 99% of the time):
```cmd
fix_errors.bat
```
Then run `start.bat` again.

### Still Not Working?
1. Check if Python 3.11+ is installed: `python --version`
2. Check if Node.js 20+ is installed: `node --version`
3. Run: `test_installation.bat` to diagnose
4. See: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed fixes

---

## 📚 Need More Help?

| I want to... | Look here |
|--------------|-----------|
| **Start quickly** | You're already here! |
| **Fix errors** | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| **See all logins** | [CREDENTIALS.md](CREDENTIALS.md) |
| **Learn everything** | [README.md](README.md) |
| **Navigate docs** | [INDEX.md](INDEX.md) |

---

## 🎮 What Can You Do?

### Public (No Login)
- Search hospitals by service (ICU, MRI, Dialysis, etc.)
- View hospital details and availability
- See which hospitals have services available NOW

### Health Worker (Login: hw1 / HealthWorker@123)
- Create referral requests
- Track referral status
- Search for suitable hospitals
- Mark patients as sent/arrived

### Hospital Staff (Login: hospital1_staff / Staff@123)
- View incoming referrals
- See availability dashboard
- Get alerts for stale data
- Respond to referrals (accept/reject)

### Admin (Login: admin / Admin@123)
- Manage all hospitals
- Manage all users
- View audit logs
- Full system control

---

## 🌐 Important Links

- **Website**: http://localhost:3000
- **API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin

---

## ✅ Is It Working?

### Test 1: Public Search
1. Go to http://localhost:3000
2. Search for "ICU"
3. Should see list of hospitals ✅

### Test 2: Login
1. Click "Sign In"
2. Username: `hw1`, Password: `HealthWorker@123`
3. Should see dashboard ✅

### Test 3: Create Referral
1. Login as health worker
2. Click "New Referral"
3. Follow 3-step wizard ✅

All working? **Congratulations!** 🎊

---

## 🚨 Common First-Time Issues

### "Python not found"
→ Install Python 3.11+ from https://python.org  
→ Check "Add to PATH" during installation

### "Node not found"
→ Install Node.js 20+ from https://nodejs.org

### "Port already in use"
→ Close other terminal windows  
→ Or restart computer

### "Module not found"
→ Run `fix_errors.bat`

---

## 📖 Documentation Roadmap

```
START_HERE.md (you are here) → First time setup
    ↓
QUICK_START.md → Detailed 2-min guide
    ↓
README.md → Full documentation
    ↓
TROUBLESHOOTING.md → When things break
    ↓
INDEX.md → Navigation hub
```

---

## 🎯 Next Steps

1. ✅ Start the application (`start.bat`)
2. ✅ Open http://localhost:3000
3. ✅ Try logging in (`hw1` / `HealthWorker@123`)
4. ✅ Search for a hospital
5. ✅ Create a referral
6. 📖 Read [README.md](README.md) for full features

---

## 💡 Pro Tips

- **Two windows will open**: One for backend (Django), one for frontend (React)
- **Don't close them**: Closing = stopping the servers
- **First run takes longer**: Installing dependencies (2-5 minutes)
- **Subsequent runs are fast**: 10-20 seconds
- **Use fix_errors.bat**: If anything goes wrong

---

## 🎓 For Developers

Want to modify the code?
1. Backend code: `backend/apps/` (Python/Django)
2. Frontend code: `frontend/src/` (React/TypeScript)
3. See [README.md](README.md) for architecture details
4. API endpoints: http://localhost:8000/api/

---

## ✨ What You're Getting

- ✅ 5 hospitals with real data
- ✅ 15 healthcare services (ICU, MRI, etc.)
- ✅ 13 user accounts (5 different roles)
- ✅ Sample referrals with different statuses
- ✅ Real-time availability tracking
- ✅ Mobile-responsive design
- ✅ Full authentication system
- ✅ Professional UI with Tailwind CSS

---

## 🎉 Success Looks Like This

```
Terminal 1 shows:
  Starting development server at http://127.0.0.1:8000/

Terminal 2 shows:
  Local:   http://localhost:3000/
  VITE ... ready in XXX ms

Browser shows:
  UpacharKhoj Nepal homepage with search bar
```

**See this?** You're good to go! 🚀

---

## 🆘 Emergency Commands

```cmd
# Fix everything
fix_errors.bat

# Check system
test_installation.bat

# Start fresh
start.bat

# Nuclear option (if completely broken)
cd backend && rmdir /s /q venv && del db.sqlite3
cd ../frontend && rmdir /s /q node_modules
cd .. && fix_errors.bat && start.bat
```

---

**Questions?** Check [INDEX.md](INDEX.md) for all documentation.

**Ready?** Run `start.bat` and let's go! 🚀

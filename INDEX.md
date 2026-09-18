# 📚 UpacharKhoj Nepal - Documentation Index

**Quick navigation to all documentation and resources**

---

## 🚀 Getting Started (Choose One)

| Document | When to Use | Time |
|----------|-------------|------|
| **[QUICK_START.md](QUICK_START.md)** | First time setup | 2 min |
| **[README.md](README.md)** | Full documentation | 15 min |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Having errors | As needed |

---

## 🎯 I Want To...

### Start the Application
→ Run `start.bat` (Windows) or `./start.sh` (Linux/Mac)  
→ See: [QUICK_START.md](QUICK_START.md)

### Fix Errors
→ Run `fix_errors.bat` (Windows) or `./fix_errors.sh` (Linux/Mac)  
→ See: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Get Login Credentials
→ See: [CREDENTIALS.md](CREDENTIALS.md)  
→ Quick: `admin` / `Admin@123` or `hw1` / `HealthWorker@123`

### Test If System is Ready
→ Run `test_installation.bat`  
→ Checks Python, Node.js, and file structure

### Learn About Features
→ See: [README.md](README.md) - Features Section  
→ See: [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)

### Understand the Architecture
→ See: [README.md](README.md) - Tech Stack & Project Structure  
→ See: SRS document (original requirements)

### Deploy to Production
→ See: [README.md](README.md) - Deployment Section  
→ Change passwords first!

---

## 📖 All Documentation Files

### Core Documentation
- **[README.md](README.md)** (535 lines)  
  Complete guide: setup, features, APIs, deployment

- **[QUICK_START.md](QUICK_START.md)** (141 lines)  
  2-minute start guide with login credentials

- **[CREDENTIALS.md](CREDENTIALS.md)** (212 lines)  
  All 13 user accounts with descriptions

- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** (401 lines)  
  Fix common errors, diagnostic commands

### Project Information
- **[COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)** (415 lines)  
  What was built, statistics, verification

- **[FIXES_APPLIED.md](FIXES_APPLIED.md)** (289 lines)  
  Recent fixes to improve stability

- **[INDEX.md](INDEX.md)** (this file)  
  Navigation guide to all docs

---

## 🛠️ Helper Scripts

### Windows (.bat files)
- **start.bat** - Start the application
- **fix_errors.bat** - Fix all common errors
- **test_installation.bat** - Check system readiness

### Linux/Mac (.sh files)
- **start.sh** - Start the application
- **fix_errors.sh** - Fix all common errors

### Docker
- **docker-compose.yml** - Run with Docker
- **backend/Dockerfile** - Backend container
- **frontend/Dockerfile** - Frontend container

---

## 🔐 Login Accounts Quick Reference

| Role | Username | Password |
|------|----------|----------|
| System Admin | `admin` | `Admin@123` |
| Hospital Admin | `hospital1_admin` | `Admin@123` |
| Hospital Staff | `hospital1_staff` | `Staff@123` |
| Health Worker | `hw1` | `HealthWorker@123` |

**Full list**: [CREDENTIALS.md](CREDENTIALS.md)

---

## 🌐 Important URLs

After starting the application:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/ (browse endpoints)

---

## 📂 Code Organization

```
UpacharKhoj/
├── backend/              # Django backend
│   ├── apps/            # Django apps
│   │   ├── accounts/    # User management
│   │   ├── hospitals/   # Hospital & services
│   │   ├── referrals/   # Referral workflow
│   │   └── audit/       # Audit logging
│   └── upacharkhoj/     # Django settings
│
├── frontend/            # React frontend
│   └── src/
│       ├── pages/       # Page components
│       ├── components/  # Reusable components
│       ├── store/       # State management
│       └── lib/         # API client
│
├── Documentation files (you are here)
└── Helper scripts (start, fix, test)
```

---

## 🆘 Common Questions

### Q: Which file do I run to start?
**A**: `start.bat` (Windows) or `./start.sh` (Linux/Mac)

### Q: I'm getting errors, what do I do?
**A**: Run `fix_errors.bat` or see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Q: What are the login credentials?
**A**: See [CREDENTIALS.md](CREDENTIALS.md) or use `hw1` / `HealthWorker@123`

### Q: How do I test if system is ready?
**A**: Run `test_installation.bat`

### Q: Where's the full documentation?
**A**: See [README.md](README.md)

### Q: What was built in this project?
**A**: See [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)

### Q: The app won't start, help!
**A**: 
1. Run `fix_errors.bat`
2. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. Run `test_installation.bat` to check system

---

## 🎓 Learning Path

### For First-Time Users:
1. Read [QUICK_START.md](QUICK_START.md) (2 min)
2. Run `test_installation.bat` (1 min)
3. Run `start.bat` (2 min)
4. Login with `hw1` / `HealthWorker@123`
5. Try creating a referral

### For Developers:
1. Read [README.md](README.md) - Tech Stack section
2. Explore `backend/apps/` - Django models
3. Explore `frontend/src/` - React components
4. Check API at http://localhost:8000/api/
5. Read [COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)

### For System Admins:
1. Read [README.md](README.md) - Deployment section
2. Review [CREDENTIALS.md](CREDENTIALS.md) - Change passwords!
3. Configure PostgreSQL (not SQLite) for production
4. Set up proper CORS and ALLOWED_HOSTS
5. Enable HTTPS

---

## 🔄 Workflow Guides

### Daily Development Workflow:
```bash
# Terminal 1
cd backend
venv\Scripts\activate
python manage.py runserver

# Terminal 2
cd frontend
npm run dev
```

### After Pulling New Code:
```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py migrate

# Frontend
cd frontend
npm install
```

### Reset Everything:
```bash
fix_errors.bat  # Cleanest way

# Or manually:
cd backend && rm -rf venv db.sqlite3
cd ../frontend && rm -rf node_modules
cd .. && start.bat
```

---

## 📞 Need Help?

| Problem Type | Solution |
|--------------|----------|
| Won't start | Run `fix_errors.bat` |
| Specific error | See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| Need login | See [CREDENTIALS.md](CREDENTIALS.md) |
| Want to learn | Read [README.md](README.md) |
| Check system | Run `test_installation.bat` |

---

## ✅ Quick Checklist

Before asking for help, make sure:
- [ ] Python 3.11+ installed (`python --version`)
- [ ] Node.js 20+ installed (`node --version`)
- [ ] Ran `test_installation.bat` (all checks pass)
- [ ] Tried `fix_errors.bat`
- [ ] Checked [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- [ ] Both backend and frontend terminals are open
- [ ] Ports 3000 and 8000 are not blocked

---

**Last Updated**: September 18, 2026  
**Version**: 1.0  
**Status**: ✅ All documentation complete

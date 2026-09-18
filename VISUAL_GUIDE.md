# 🎨 Visual Guide - UpacharKhoj Nepal

**Quick visual guide to get started**

---

## 🗺️ Getting Started Flowchart

```
┌─────────────────────────────────────────────────────┐
│           START: Want to run UpacharKhoj?           │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   First time using?   │
         └───────┬───────────────┘
                 │
         ┌───────┴───────┐
         │               │
       YES              NO
         │               │
         ▼               ▼
    ┌────────┐      ┌────────┐
    │ Read   │      │  Run   │
    │START   │      │start   │
    │HERE.md │      │.bat    │
    └───┬────┘      └────┬───┘
        │                │
        ▼                │
    ┌────────┐           │
    │  Run   │           │
    │test_   │           │
    │install │           │
    │ation   │           │
    └───┬────┘           │
        │                │
        ▼                │
   ┌─────────┐           │
   │All PASS?│           │
   └────┬────┘           │
        │                │
    ┌───┴───┐            │
    │       │            │
   YES     NO            │
    │       │            │
    │       ▼            │
    │  ┌────────┐        │
    │  │  Run   │        │
    │  │fix_    │        │
    │  │errors  │        │
    │  │.bat    │        │
    │  └───┬────┘        │
    │      │             │
    └──────┴─────────────┘
           │
           ▼
      ┌────────┐
      │  Run   │
      │start   │
      │.bat    │
      └───┬────┘
          │
          ▼
    ┌───────────┐
    │Wait 30-60 │
    │ seconds   │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │   Open    │
    │localhost  │
    │   :3000   │
    └─────┬─────┘
          │
          ▼
    ┌───────────┐
    │  SUCCESS! │
    │     🎉    │
    └───────────┘
```

---

## 🔧 Error Recovery Flowchart

```
┌─────────────────────────────────┐
│      Got an error? 😞           │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────┐
    │Close terminal  │
    │   windows      │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │      Run       │
    │  fix_errors    │
    │     .bat       │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │  Wait 2-5 min  │
    │  (installing)  │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │      Run       │
    │   start.bat    │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │   Working? ✅  │
    └────┬───────────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    │         ▼
    │  ┌──────────────┐
    │  │Check         │
    │  │TROUBLESHOOT  │
    │  │   ING.md     │
    │  └──────┬───────┘
    │         │
    │         ▼
    │  ┌──────────────┐
    │  │Find your     │
    │  │error &       │
    │  │follow fix    │
    │  └──────┬───────┘
    │         │
    └─────────┘
         │
         ▼
    ┌──────────┐
    │ SUCCESS! │
    │    🎉   │
    └──────────┘
```

---

## 📂 File Structure Visual

```
C:\Users\rajju\Music\UpacharKhoj\
│
├── 📄 START_HERE.md          ⭐ Start here!
├── 📄 QUICK_START.md         ⚡ 2-min guide
├── 📄 TROUBLESHOOTING.md     🔧 Fix errors
├── 📄 INDEX.md               🗺️ Navigation
├── 📄 CREDENTIALS.md         🔐 All logins
├── 📄 README.md              📖 Full docs
├── 📄 ALL_FIXES_SUMMARY.md   ✅ What's fixed
│
├── 🔧 start.bat              🚀 Run this!
├── 🔧 fix_errors.bat         🔧 Fix errors
├── 🔧 test_installation.bat  ✅ Check system
│
├── 📁 backend/               🐍 Django
│   ├── 📁 apps/
│   │   ├── accounts/         👥 Users
│   │   ├── hospitals/        🏥 Hospitals
│   │   ├── referrals/        📋 Referrals
│   │   └── audit/            📊 Logs
│   ├── manage.py
│   └── requirements.txt
│
└── 📁 frontend/              ⚛️ React
    ├── 📁 src/
    │   ├── pages/            📄 Pages
    │   ├── components/       🧩 Components
    │   ├── store/            💾 State
    │   └── lib/              🔌 API
    └── package.json
```

---

## 🎯 User Journey Map

```
┌─────────────────────────────────────────────┐
│         Public User (No Login)              │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Search │  │ View   │  │ Read   │
│ by     │  │Hospital│  │Contact │
│Service │  │Details │  │Info    │
└────────┘  └────────┘  └────────┘


┌─────────────────────────────────────────────┐
│      Health Worker (hw1 login)              │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Create │  │ Track  │  │ Mark   │
│Referral│  │Status  │  │Patient │
└────────┘  └────────┘  └────────┘


┌─────────────────────────────────────────────┐
│   Hospital Staff (hospital1_staff login)    │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│ View   │  │Respond │  │ Update │
│Pending │  │to Ref  │  │Availab │
└────────┘  └────────┘  └────────┘


┌─────────────────────────────────────────────┐
│       System Admin (admin login)            │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Manage │  │ Manage │  │  View  │
│Hospita │  │ Users  │  │ Audit  │
└────────┘  └────────┘  └────────┘
```

---

## 🔐 Login Quick Reference Card

```
╔═══════════════════════════════════════════════════╗
║            LOGIN CREDENTIALS                      ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  🏥 Health Worker:                                ║
║     Username: hw1                                 ║
║     Password: HealthWorker@123                    ║
║     Access: Create referrals, track status        ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  🏨 Hospital Staff:                               ║
║     Username: hospital1_staff                     ║
║     Password: Staff@123                           ║
║     Access: View/respond to referrals             ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  👑 System Admin:                                 ║
║     Username: admin                               ║
║     Password: Admin@123                           ║
║     Access: Full system control                   ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 📊 System Status Dashboard

```
╔════════════════════════════════════════════════╗
║        UpacharKhoj Nepal Status               ║
╠════════════════════════════════════════════════╣
║                                                ║
║  Backend:   🟢 READY                          ║
║             - Django 4.2                       ║
║             - PostgreSQL/SQLite                ║
║             - JWT Auth                         ║
║             - 41 Python files                  ║
║                                                ║
║  Frontend:  🟢 READY                          ║
║             - React 18 + TypeScript            ║
║             - Tailwind CSS                     ║
║             - 29 TypeScript files              ║
║                                                ║
║  Database:  🟢 READY                          ║
║             - 5 Hospitals                      ║
║             - 15 Services                      ║
║             - 13 User accounts                 ║
║             - Sample referrals                 ║
║                                                ║
║  Scripts:   🟢 READY                          ║
║             - start.bat                        ║
║             - fix_errors.bat                   ║
║             - test_installation.bat            ║
║                                                ║
║  Docs:      🟢 COMPLETE                       ║
║             - 9 markdown files                 ║
║             - 1,500+ lines                     ║
║                                                ║
╚════════════════════════════════════════════════╝
```

---

## 🎬 Quick Command Reference

```
┌─────────────────────────────────────────────┐
│           COMMAND CHEAT SHEET               │
├─────────────────────────────────────────────┤
│                                             │
│  🚀 START APPLICATION                       │
│     start.bat                               │
│                                             │
│  🔧 FIX ALL ERRORS                          │
│     fix_errors.bat                          │
│                                             │
│  ✅ CHECK SYSTEM                            │
│     test_installation.bat                   │
│                                             │
│  🌐 OPEN WEBSITE                            │
│     http://localhost:3000                   │
│                                             │
│  🔌 CHECK BACKEND                           │
│     http://localhost:8000/api/              │
│                                             │
│  👑 OPEN ADMIN                              │
│     http://localhost:8000/admin             │
│                                             │
│  🛑 STOP SERVERS                            │
│     Close terminal windows                  │
│     or Ctrl+C in each                       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🎯 Success Indicators

```
✅ WORKING CORRECTLY:

  Terminal 1:
  ┌─────────────────────────────────────┐
  │ Starting development server at      │
  │ http://127.0.0.1:8000/             │
  │ Quit the server with CTRL-BREAK.   │
  └─────────────────────────────────────┘

  Terminal 2:
  ┌─────────────────────────────────────┐
  │ VITE v5.4.9  ready in 1234 ms      │
  │ ➜  Local:   http://localhost:3000/ │
  │ ➜  Network: use --host to expose   │
  └─────────────────────────────────────┘

  Browser:
  ┌─────────────────────────────────────┐
  │ 🏥 UpacharKhoj Nepal               │
  │                                     │
  │ [Search for service...]  [Search]  │
  │                                     │
  │ Find the right hospital             │
  │ before you travel                   │
  └─────────────────────────────────────┘


❌ NOT WORKING:

  Terminal shows errors like:
  - "Python not found"
  - "Module not found"
  - "Port already in use"
  - "Connection refused"

  → RUN: fix_errors.bat
```

---

## 📖 Documentation Priority

```
┌──────────────────────────────────────────────┐
│       WHEN TO READ WHICH DOC                 │
├──────────────────────────────────────────────┤
│                                              │
│  1. START_HERE.md        ⭐ First time      │
│     → Quick start, 3 min                     │
│                                              │
│  2. QUICK_START.md       ⚡ Detailed guide  │
│     → Step by step, 5 min                    │
│                                              │
│  3. CREDENTIALS.md       🔐 Need login      │
│     → All accounts, 2 min                    │
│                                              │
│  4. TROUBLESHOOTING.md   🔧 Have errors     │
│     → Fix issues, as needed                  │
│                                              │
│  5. README.md            📖 Learn all       │
│     → Full guide, 20 min                     │
│                                              │
│  6. INDEX.md             🗺️ Navigate       │
│     → Find anything, 2 min                   │
│                                              │
│  7. ALL_FIXES_SUMMARY    ✅ What's fixed   │
│     → Recent changes, 5 min                  │
│                                              │
└──────────────────────────────────────────────┘
```

---

**Visual guide complete! 🎨**

**Next step**: Run `start.bat` and see it in action! 🚀

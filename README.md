# UpacharKhoj Nepal

**Healthcare Availability & Referral Coordination Platform**

A full-stack web application built with Django (Backend) and React + TypeScript (Frontend) to help patients, health workers, and hospitals coordinate healthcare services in Nepal.

---

## 🎯 Project Overview

UpacharKhoj Nepal solves a critical problem: **patients traveling long distances to hospitals only to find required services unavailable**. This platform allows:

- **Patients/Families**: Search hospitals by service (ICU, MRI, Dialysis, etc.) and check real-time availability
- **Health Workers**: Create referral requests and track responses before patient transfer
- **Hospital Staff**: Update bed/service availability and respond to incoming referrals
- **System Admins**: Manage hospitals, services, users, and monitor platform health

---

## 🏗️ Tech Stack

### Backend
- **Python 3.11** + **Django 4.2**
- **Django REST Framework** (DRF) for APIs
- **Django Channels** for WebSocket real-time updates
- **SimpleJWT** for authentication
- **SQLite** (development) / **PostgreSQL** (production-ready)
- **Redis** (optional, for production Channels layer)

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (styling)
- **React Router v6** (routing)
- **Zustand** (state management)
- **Axios** (API calls)
- **React Hot Toast** (notifications)
- **date-fns** (date formatting)
- **Leaflet** (maps - placeholder ready)

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 20+** and **npm**
- **Git**

### Option 1: Run with Docker (Recommended)

```bash
cd C:\Users\rajju\Music\UpacharKhoj

# Build and start all services
docker-compose up --build

# Backend will be at: http://localhost:8000
# Frontend will be at: http://localhost:3000
# API docs at: http://localhost:8000/api/
```

The `seed_data` command runs automatically and creates all demo accounts.

### Option 2: Run Manually (Development)

#### Backend Setup

```bash
cd C:\Users\rajju\Music\UpacharKhoj\backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create seed data (demo hospitals, services, users)
python manage.py seed_data

# Start Django server
python manage.py runserver
```

Backend runs at: **http://localhost:8000**

#### Frontend Setup

```bash
cd C:\Users\rajju\Music\UpacharKhoj\frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## 🔐 Demo Account Credentials

After running `python manage.py seed_data`, the following accounts are available:

### 1. System Admin
**Full platform management access**
- **Username**: `admin`
- **Password**: `Admin@123`
- **Access**: Manage hospitals, services, users, audit logs
- **Dashboard**: http://localhost:3000/admin/dashboard

### 2. Hospital Admin (5 accounts for 5 hospitals)
**Manage hospital staff and settings**
- **Username**: `hospital1_admin`, `hospital2_admin`, `hospital3_admin`, `hospital4_admin`, `hospital5_admin`
- **Password**: `Admin@123`
- **Access**: Manage staff for their hospital, view availability
- **Dashboard**: http://localhost:3000/hadmin/dashboard

### 3. Hospital Staff (5 accounts for 5 hospitals)
**Update availability and respond to referrals**
- **Username**: `hospital1_staff`, `hospital2_staff`, `hospital3_staff`, `hospital4_staff`, `hospital5_staff`
- **Password**: `Staff@123`
- **Access**: Update availability (ICU, beds, services), accept/reject referrals
- **Dashboard**: http://localhost:3000/staff/dashboard

### 4. Health Workers (2 accounts)
**Search hospitals and create referrals**
- **Username**: `hw1`, `hw2`
- **Password**: `HealthWorker@123`
- **Access**: Search hospitals, create referral requests, track responses
- **Dashboard**: http://localhost:3000/hw/dashboard

### 5. Public Access (No login required)
- Visit: http://localhost:3000
- Search hospitals by service
- View hospital details and availability
- No referral creation (requires health worker login)

---

## 🗄️ Database Seeded Data

The `seed_data` command creates:

### Hospitals (5 locations across Nepal)
1. **Tribhuvan University Teaching Hospital** - Kathmandu, District Hospital
2. **Grande International Hospital** - Kathmandu, Private
3. **Pokhara Academy of Health Sciences** - Pokhara, District Hospital
4. **Bhaktapur Hospital** - Bhaktapur, Community Hospital
5. **Chitwan Medical College** - Chitwan, Private

### Services (15 categories)
- ICU, NICU, CT Scan, MRI, Dialysis, Cardiology, Maternity, Blood Bank
- Emergency Surgery, Orthopedics, Neurology, Pediatrics, Ophthalmology, ENT, Radiology

### Availability Data
- Each hospital has 5-8 availability records (ICU beds, NICU beds, CT availability, etc.)
- Timestamps vary (some current, some old) to demonstrate freshness features

### Sample Referrals (5)
- Various statuses: pending, accepted, rejected, call_required
- Demonstrates the referral workflow

---

## 📋 Key Features Implemented

### ✅ Public Features
- [x] Homepage with service search
- [x] Hospital search by service name
- [x] Filter by district/municipality
- [x] Hospital detail page with availability table
- [x] Freshness indicators (current/recent/old/stale)
- [x] Mobile-responsive design

### ✅ Health Worker Features
- [x] Dashboard with referral statistics
- [x] Create new referral (3-step wizard)
- [x] List all referrals with filters
- [x] View referral details
- [x] Mark patient sent/arrived
- [x] Referral timeline/events

### ✅ Hospital Staff Features
- [x] Dashboard with availability summary
- [x] Stale data alerts
- [x] Pending referral notifications
- [x] Quick access to manage availability
- [x] View incoming referrals

### ✅ Backend Features
- [x] JWT authentication with refresh tokens
- [x] Role-based permissions (5 roles)
- [x] Hospital, Service, Availability, Referral models
- [x] Audit logging for important actions
- [x] WebSocket support via Django Channels
- [x] API endpoints for all CRUD operations
- [x] Data freshness calculation (<30min=current, >6hr=stale)
- [x] Referral workflow (pending→accepted/rejected→sent→arrived)

### 🚧 Partially Implemented (Placeholder Pages)
- [ ] Hospital staff availability update page (UI ready, needs form)
- [ ] Hospital staff referral response page (UI ready, needs form)
- [ ] Hospital admin staff management
- [ ] System admin hospital/service/user CRUD pages
- [ ] Audit log viewer page

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login/` - Login (returns JWT tokens)
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/register/` - Register health worker
- `GET /api/auth/profile/` - Get current user
- `PATCH /api/auth/profile/` - Update profile
- `POST /api/auth/token/refresh/` - Refresh access token

### Hospitals
- `GET /api/hospitals/` - List hospitals (public, filterable by service/district)
- `GET /api/hospitals/{id}/` - Hospital detail (public)
- `POST /api/hospitals/` - Create hospital (system admin only)
- `PATCH /api/hospitals/{id}/` - Update hospital
- `DELETE /api/hospitals/{id}/` - Delete hospital

### Services
- `GET /api/services/` - List services (public)
- `GET /api/services/{id}/` - Service detail
- `POST /api/services/` - Create service (system admin only)

### Availability
- `GET /api/availability/?hospital={id}` - Get hospital availability (public)
- `POST /api/availability/` - Create availability (hospital staff)
- `PATCH /api/availability/{id}/` - Update availability
- `POST /api/hospitals/{id}/availability/bulk_update/` - Bulk update

### Referrals
- `GET /api/referrals/` - List referrals (filtered by role)
- `POST /api/referrals/` - Create referral (health worker)
- `GET /api/referrals/{id}/` - Referral detail
- `PATCH /api/referrals/{id}/respond/` - Respond to referral (hospital staff)
- `PATCH /api/referrals/{id}/update_status/` - Update status (health worker)

### WebSocket
- `ws://localhost:8000/ws/availability/` - Global availability updates
- `ws://localhost:8000/ws/availability/{hospital_id}/` - Hospital-specific updates

---

## 📁 Project Structure

```
UpacharKhoj/
├── backend/                    # Django backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── upacharkhoj/           # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   ├── wsgi.py
│   │   └── routing.py         # WebSocket routing
│   └── apps/
│       ├── accounts/          # User authentication & roles
│       │   ├── models.py      # Custom User model
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── permissions.py
│       │   └── urls.py
│       ├── hospitals/         # Hospital & service management
│       │   ├── models.py      # Hospital, Service, HospitalService, Availability
│       │   ├── serializers.py
│       │   ├── views.py
│       │   ├── consumers.py   # WebSocket consumers
│       │   ├── management/
│       │   │   └── commands/
│       │   │       └── seed_data.py  # Demo data creation
│       │   └── urls.py
│       ├── referrals/         # Referral workflow
│       │   ├── models.py      # Referral, ReferralEvent
│       │   ├── serializers.py
│       │   ├── views.py
│       │   └── urls.py
│       └── audit/             # Audit logging
│           ├── models.py      # AuditLog
│           ├── views.py
│           └── urls.py
│
├── frontend/                   # React frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── Dockerfile
│   ├── index.html
│   └── src/
│       ├── main.tsx           # Entry point
│       ├── App.tsx            # Router & routes
│       ├── index.css          # Tailwind + custom styles
│       ├── types/
│       │   └── index.ts       # TypeScript interfaces
│       ├── lib/
│       │   └── api.ts         # Axios instance & API functions
│       ├── store/
│       │   ├── authStore.ts   # Zustand auth state
│       │   └── notificationStore.ts
│       ├── hooks/
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.tsx
│       │   │   ├── Footer.tsx
│       │   │   ├── Layout.tsx
│       │   │   └── DashboardLayout.tsx
│       │   └── common/
│       │       ├── FreshnessTag.tsx
│       │       ├── StatusBadge.tsx
│       │       ├── ReferralStatusBadge.tsx
│       │       ├── LoadingSpinner.tsx
│       │       ├── DataFreshnessAlert.tsx
│       │       └── ProtectedRoute.tsx
│       └── pages/
│           ├── public/
│           │   ├── HomePage.tsx
│           │   ├── SearchPage.tsx
│           │   ├── HospitalDetailPage.tsx
│           │   └── LoginPage.tsx
│           ├── healthworker/
│           │   ├── HWDashboard.tsx
│           │   ├── HWReferrals.tsx
│           │   ├── HWNewReferral.tsx
│           │   └── HWReferralDetail.tsx
│           ├── hospitalstaff/
│           │   └── StaffDashboard.tsx
│           ├── hospitaladmin/
│           └── admin/
│
└── docker-compose.yml         # Docker orchestration
```

---

## 🧪 Testing the Platform

### 1. Test Public Search (No login)
1. Go to http://localhost:3000
2. Search for "ICU" or "MRI"
3. View search results with availability
4. Click "View Details" on any hospital
5. See availability table with freshness indicators

### 2. Test Health Worker Flow
1. Login as `hw1` / `HealthWorker@123`
2. Go to Dashboard → see referral stats
3. Click "New Referral"
4. Select service (e.g., "ICU")
5. Choose a destination hospital
6. Fill patient details and submit
7. View referral detail page
8. Note the referral code

### 3. Test Hospital Staff Flow
1. Login as `hospital1_staff` / `Staff@123`
2. View dashboard → see availability summary
3. See pending referrals alert
4. (Placeholder: would respond to referral here)

### 4. Test System Admin Flow
1. Login as `admin` / `Admin@123`
2. Access admin dashboard
3. (Placeholder: manage hospitals, services, users)

### 5. Test Django Admin
1. Go to http://localhost:8000/admin
2. Login as `admin` / `Admin@123`
3. Browse all models: Users, Hospitals, Services, Availability, Referrals, Audit Logs

---

## 🔧 Configuration

### Backend Environment Variables
Create `backend/.env` (optional, has defaults):
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOW_ALL_ORIGINS=True
```

For PostgreSQL:
```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=upacharkhoj
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

### Frontend Environment Variables
No `.env` needed for development. API proxied through Vite config.

---

## 📊 Data Freshness Rules

The platform categorizes availability data by age:

| Age | Label | Color | Meaning |
|-----|-------|-------|---------|
| < 30 min | Current | Green | Recently updated, highly reliable |
| 30 min - 2 hr | Recent | Blue | Likely still accurate |
| 2 hr - 6 hr | Old | Yellow | Verify before relying on it |
| > 6 hr | Stale | Red | Outdated, call hospital to confirm |

---

## 🎨 Design Principles

- **Mobile-first**: All pages work on 360px width and up
- **Accessible**: ARIA labels, keyboard navigation, high contrast
- **Bilingual-ready**: Text structured for English/Nepali translation
- **Clear data freshness**: Every changing data point shows "last updated"
- **Minimal cognitive load**: Focused workflows, no unnecessary features
- **Safety warnings**: Stale data alerts, "hospital-reported" disclaimers

---

## 🚢 Deployment (Production)

### Backend
- **Hosting**: Render, Railway, AWS EC2, DigitalOcean
- **Database**: PostgreSQL (required for production)
- **Static/Media**: AWS S3 or local storage
- **WebSocket**: Redis + Daphne (Channels production setup)

### Frontend
- **Hosting**: Vercel, Netlify, or serve via Django static
- **Build**: `npm run build` → `dist/` folder
- **Env**: Set `VITE_API_URL` to production backend URL

### Commands for Production
```bash
# Backend
python manage.py collectstatic
python manage.py migrate
python manage.py createsuperuser
daphne -b 0.0.0.0 -p 8000 upacharkhoj.asgi:application

# Frontend
npm run build
# Upload dist/ to hosting or serve via Nginx
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.11+)
- Activate venv: `venv\Scripts\activate`
- Install deps: `pip install -r requirements.txt`
- Run migrations: `python manage.py migrate`

### Frontend won't start
- Check Node version: `node --version` (need 20+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check port 3000 is free

### CORS errors
- Ensure backend `CORS_ALLOW_ALL_ORIGINS=True` in development
- Or add `http://localhost:3000` to `CORS_ALLOWED_ORIGINS`

### No data showing
- Run seed command: `python manage.py seed_data`
- Check backend console for errors
- Verify API at http://localhost:8000/api/hospitals/

---

## 📝 License & Credits

**UpacharKhoj Nepal** - Healthcare Availability & Referral Platform for Nepal

Built for Nepal's healthcare coordination needs.

**SRS Document**: `C:\Users\rajju\Downloads\UpacharKhoj_Nepal_SRS.docx`

---

## 📞 Support

For issues or questions:
- Check backend logs: Terminal running `python manage.py runserver`
- Check frontend logs: Browser console (F12)
- Review API responses: Network tab in browser DevTools

---

## ✅ All Credentials Summary

| Role | Username | Password | Dashboard URL |
|------|----------|----------|---------------|
| System Admin | `admin` | `Admin@123` | /admin/dashboard |
| Hospital Admin (Hospital 1) | `hospital1_admin` | `Admin@123` | /hadmin/dashboard |
| Hospital Admin (Hospital 2) | `hospital2_admin` | `Admin@123` | /hadmin/dashboard |
| Hospital Admin (Hospital 3) | `hospital3_admin` | `Admin@123` | /hadmin/dashboard |
| Hospital Admin (Hospital 4) | `hospital4_admin` | `Admin@123` | /hadmin/dashboard |
| Hospital Admin (Hospital 5) | `hospital5_admin` | `Admin@123` | /hadmin/dashboard |
| Hospital Staff (Hospital 1) | `hospital1_staff` | `Staff@123` | /staff/dashboard |
| Hospital Staff (Hospital 2) | `hospital2_staff` | `Staff@123` | /staff/dashboard |
| Hospital Staff (Hospital 3) | `hospital3_staff` | `Staff@123` | /staff/dashboard |
| Hospital Staff (Hospital 4) | `hospital4_staff` | `Staff@123` | /staff/dashboard |
| Hospital Staff (Hospital 5) | `hospital5_staff` | `Staff@123` | /staff/dashboard |
| Health Worker 1 | `hw1` | `HealthWorker@123` | /hw/dashboard |
| Health Worker 2 | `hw2` | `HealthWorker@123` | /hw/dashboard |

**Django Admin Portal**: http://localhost:8000/admin
- Username: `admin`
- Password: `Admin@123`

---

**🏥 Ready to coordinate healthcare in Nepal! 🇳🇵**

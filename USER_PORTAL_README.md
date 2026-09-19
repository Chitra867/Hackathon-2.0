# UpacharKhoj — User Portal Implementation Guide

## What Was Added

### Backend (Django REST Framework)

**New Models** (`backend/apps/hospitals/models.py`):
- `Doctor` — doctor profiles linked to hospitals (name, specialty, duty status, schedule)
- `PatientRequest` — patient assistance requests to hospitals
- `PatientRequestEvent` — audit trail for request status changes

**New Migration**: `0003_add_doctor_patient_request`

**New API Endpoints**:
| Endpoint | Description |
|---|---|
| `GET /api/user/dashboard/` | Authenticated user dashboard data |
| `GET /api/user/hospital-search/` | Search hospitals by treatment/service/location |
| `GET /api/user/hospitals/<id>/` | Detailed hospital profile for patients |
| `GET/POST /api/doctors/` | Doctor list / create |
| `PATCH /api/doctors/<id>/` | Update doctor (hospital admin only) |
| `DELETE /api/doctors/<id>/` | Remove doctor |
| `GET/POST /api/patient-requests/` | Patient requests list / create |
| `GET /api/patient-requests/<id>/` | Request detail (own only) |
| `PATCH /api/patient-requests/<id>/respond/` | Hospital staff respond |
| `POST /api/patient-requests/<id>/cancel/` | Patient cancels own request |

### Frontend (React + TypeScript)

**New Pages** (`frontend/src/pages/user/`):
- `UserDashboard.tsx` — welcome, stats, quick actions, recent requests
- `UserHospitalSearch.tsx` — search with list/map toggle, OSRM routing
- `UserHospitalDetail.tsx` — full hospital profile with doctors, beds, map, request form
- `UserEmergencySearch.tsx` — emergency service search with one-click call
- `UserHospitalMap.tsx` — full-screen interactive map with route navigation
- `MyReferrals.tsx` — patient's own request history with filtering
- `UserReferralDetail.tsx` — request detail with status timeline and cancel
- `UserProfile.tsx` — view/edit profile, change password, logout

**New Hospital Admin Page** (`frontend/src/pages/hospitaladmin/`):
- `DoctorManagement.tsx` — add/edit/delete doctors, quick duty-status toggle

**New Components**:
- `components/user/HospitalCard.tsx` — search result card with availability badges
- `components/user/DoctorAvailability.tsx` — doctor list with duty status
- `components/user/BedAvailability.tsx` — bed/ICU/equipment availability with freshness
- `components/user/MapView.tsx` — interactive Leaflet map with OSRM routing
- `components/user/PatientRequestStatusBadge.tsx` — status badge component
- `components/user/SearchFilters.tsx` — search bar + district selector + emergency toggle
- `components/layout/UserLayout.tsx` — sidebar + mobile nav for user portal
- `components/map/mapSetup.ts` — Leaflet + OSRM utilities (ported from SafeRoute-Nepal)
- `components/map/markers.css` — hospital/user/pin marker styles

**Updated Files**:
- `store/authStore.ts` — `getDashboardPath()` now returns `/user/dashboard` for `user` role
- `components/common/ProtectedRoute.tsx` — redirects `user` role to `/user/dashboard`
- `lib/api.ts` — added `doctorsApi`, `patientRequestsApi`, `userPortalApi`
- `types/index.ts` — added `Doctor`, `PatientRequest`, `HospitalSearchResult`, etc.
- `App.tsx` — all `/user/*` routes added, `DoctorManagement` route added
- `components/layout/DashboardLayout.tsx` — Doctors link in hospital admin sidebar
- `pages/hospitaladmin/IncomingReferrals.tsx` — Patient Requests tab added

---

## Setup & Run Commands

### 1. Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env and set SECRET_KEY at minimum

# Run migrations
python manage.py migrate

# Create superuser (for testing)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file (no changes needed for development)
cp .env.example .env

# Start development server
npm run dev
```

The Vite dev server proxies `/api` → `http://localhost:8000` automatically.

### 3. Build for production

```bash
# Frontend
cd frontend && npm run build

# Backend static files
cd backend && python manage.py collectstatic
```

---

## User Roles and Login Redirects

| Role | After Login |
|---|---|
| `user` (patient) | `/user/dashboard` |
| `health_worker` | `/hw/dashboard` |
| `hospital_staff` | `/hadmin/dashboard` |
| `hospital_admin` | `/hadmin/dashboard` |
| `system_admin` | `/admin/dashboard` |

---

## Map & Routing

- **Map tiles**: OpenStreetMap — free, no API key required
- **Routing**: Public OSRM (`https://router.project-osrm.org`) — free, no API key required
- **Library**: react-leaflet v4 + leaflet 1.9.x (already in package.json)
- Routes show actual road distance and travel time
- Falls back from driving to walking profile if no road found
- Handles missing coordinates and routing failures gracefully

---

## Testing the User Portal

1. Register a new account at `/register` — role defaults to `user`
2. Login — redirected to `/user/dashboard`
3. Search hospitals at `/user/hospitals`
4. View hospital detail, check doctors and availability
5. Submit an assistance request from the hospital detail page
6. View your requests at `/user/referrals`
7. Hospital admin can respond at `/hadmin/referrals` → Patient Requests tab
8. Hospital admin can manage doctors at `/hadmin/doctors`

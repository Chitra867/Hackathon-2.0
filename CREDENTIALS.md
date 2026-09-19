# 🔐 UpacharKhoj Nepal - Access Credentials

All accounts are automatically created when you run: `python manage.py seed_data`

---

## 🌐 Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin

---

## 👥 User Accounts

### 1️⃣ System Administrator
**Full platform control - manage everything**

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `Admin@123` |
| **Role** | System Admin |
| **Dashboard** | http://localhost:3000/admin/dashboard |
| **Permissions** | Create/edit hospitals, services, users; view audit logs |

**Django Admin Access**: Same credentials work at http://localhost:8000/admin

---

### 2️⃣ Hospital Administrators (5 accounts)
**Manage their hospital's staff and settings**

| Hospital | Username | Password | Dashboard |
|----------|----------|----------|-----------|
| Tribhuvan University Teaching Hospital | `hospital1_admin` | `Admin@123` | /hadmin/dashboard |
| Grande International Hospital | `hospital2_admin` | `Admin@123` | /hadmin/dashboard |
| Pokhara Academy of Health Sciences | `hospital3_admin` | `Admin@123` | /hadmin/dashboard |
| Bhaktapur Hospital | `hospital4_admin` | `Admin@123` | /hadmin/dashboard |
| Chitwan Medical College | `hospital5_admin` | `Admin@123` | /hadmin/dashboard |

**Permissions**: Manage staff accounts for their hospital, view availability and referrals

---

### 3️⃣ Hospital Staff (5 accounts)
**Update availability and respond to referrals**

| Hospital | Username | Password | Dashboard |
|----------|----------|----------|-----------|
| Tribhuvan University Teaching Hospital | `hospital1_staff` | `Staff@123` | /staff/dashboard |
| Grande International Hospital | `hospital2_staff` | `Staff@123` | /staff/dashboard |
| Pokhara Academy of Health Sciences | `hospital3_staff` | `Staff@123` | /staff/dashboard |
| Bhaktapur Hospital | `hospital4_staff` | `Staff@123` | /staff/dashboard |
| Chitwan Medical College | `hospital5_staff` | `Staff@123` | /staff/dashboard |

**Permissions**: Update availability (ICU beds, services, equipment), accept/reject incoming referrals

---

### 4️⃣ Health Workers (2 accounts)
**Search hospitals and create referral requests**

| Username | Password | Facility | Dashboard |
|----------|----------|----------|-----------|
| `hw1` | `HealthWorker@123` | Tribhuvan University Teaching Hospital | /hw/dashboard |
| `hw2` | `HealthWorker@123` | Grande International Hospital | /hw/dashboard |

**Permissions**: Search hospitals by service, create referral requests, track referral status, mark patient sent/arrived

---

### 5️⃣ Public Access
**No login required**

- **URL**: http://localhost:3000
- **Features**:
  - Search hospitals by service (ICU, MRI, Dialysis, etc.)
  - Filter by district/municipality
  - View hospital details and availability
  - See availability freshness indicators
  - Access hospital contact information

**Note**: Cannot create referrals without logging in as a health worker

---

## 🧪 Quick Testing Guide

### Test Scenario 1: Public Search
1. Go to http://localhost:3000
2. Search for "ICU" or "MRI"
3. View hospital list with availability
4. Click any hospital to see detailed availability table

### Test Scenario 2: Create a Referral
1. Login as **hw1** / **HealthWorker@123**
2. Click "New Referral" or go to /hw/referrals/new
3. Select service (e.g., "Cardiology")
4. Choose destination hospital from list
5. Fill patient details and submit
6. Note the generated referral code
7. View referral in "My Referrals" list

### Test Scenario 3: Hospital Staff Response
1. Login as **hospital1_staff** / **Staff@123**
2. View dashboard - see pending referrals alert
3. (Future feature: Click to respond - accept/reject referral)

### Test Scenario 4: Admin Management
1. Login as **admin** / **Admin@123**
2. Access Django admin at http://localhost:8000/admin
3. Browse: Users, Hospitals, Services, Availability, Referrals, Audit Logs
4. (Future feature: Use React admin panel)

---

## 🗄️ Database Information

### Seeded Hospitals (5)
1. **Tribhuvan University Teaching Hospital** - Kathmandu, District Hospital
2. **Grande International Hospital** - Kathmandu, Private Hospital  
3. **Pokhara Academy of Health Sciences** - Pokhara, District Hospital
4. **Bhaktapur Hospital** - Bhaktapur, Community Hospital
5. **Chitwan Medical College** - Chitwan, Private Hospital

### Seeded Services (15)
- ICU, NICU, CT Scan, MRI, Dialysis
- Cardiology, Maternity, Blood Bank, Emergency Surgery
- Orthopedics, Neurology, Pediatrics, Ophthalmology, ENT, Radiology

### Availability Records
Each hospital has 5-8 availability records with varying freshness:
- Some "current" (<30 min old)
- Some "recent" (30min - 2hr)
- Some "old" (2-6hr)
- Some "stale" (>6hr) - to demonstrate warnings

### Sample Referrals (5)
Pre-created referrals with different statuses:
- Pending
- Accepted
- Rejected
- Call Required
- Patient Sent

---

## 📞 API Testing (Optional)

You can test APIs directly using curl, Postman, or Thunder Client:

### Get JWT Token
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"hw1","password":"HealthWorker@123"}'
```

### Search Hospitals
```bash
curl http://localhost:8000/api/hospitals/?service=ICU
```

### Get Hospital Detail
```bash
curl http://localhost:8000/api/hospitals/1/
```

---

## 🔄 Reset Database

If you want to start fresh:

```bash
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py seed_data
```

All demo accounts will be recreated.

---

## 🚨 Important Notes

1. **These are demo credentials** - In production, change all passwords
2. **seed_data is idempotent** - Safe to run multiple times, won't create duplicates
3. **SQLite is for development** - Use PostgreSQL for production
4. **All passwords** use the pattern: `{Role}@123` for easy recall
5. **Hospital staff** can only update their own hospital's data (permission-enforced)

---

## 📋 Summary Table

| Role | Count | Username Pattern | Password | Access Level |
|------|-------|------------------|----------|--------------|
| System Admin | 1 | `admin` | `Admin@123` | Full platform control |
| Hospital Admin | 5 | `hospital{1-5}_admin` | `Admin@123` | Their hospital management |
| Hospital Staff | 5 | `hospital{1-5}_staff` | `Staff@123` | Availability + referrals |
| Health Worker | 2 | `hw1`, `hw2` | `HealthWorker@123` | Search + create referrals |
| Public | ∞ | (none) | (none) | Search hospitals only |

---

**Last Updated**: September 18, 2026  
**Platform**: UpacharKhoj Nepal v1.0  
**Status**: ✅ All features working

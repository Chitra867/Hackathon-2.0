import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import { Layout } from './components/layout/Layout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { UserLayout } from './components/layout/UserLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

/* ── PUBLIC ──────────────────────────────────────────────── */
import { SearchPage } from './pages/public/SearchPage';
import { HospitalDetailPage } from './pages/public/HospitalDetailPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { AboutPage } from './pages/public/AboutPage';

/* ── USER PORTAL ─────────────────────────────────────────── */
import { UserDashboard } from './pages/user/UserDashboard';
import { UserHospitalSearch } from './pages/user/UserHospitalSearch';
import { UserHospitalDetail } from './pages/user/UserHospitalDetail';
import { UserEmergencySearch } from './pages/user/UserEmergencySearch';
import { UserHospitalMap } from './pages/user/UserHospitalMap';
import { MyReferrals } from './pages/user/MyReferrals';
import { UserReferralDetail } from './pages/user/UserReferralDetail';
import { UserProfile } from './pages/user/UserProfile';
import { UserRequestHelp } from './pages/user/UserRequestHelp';
import { UserReferral } from './pages/user/UserReferral';

/* ── HOSPITAL ADMIN ──────────────────────────────────────── */
import { HADashboard } from './pages/hospitaladmin/HADashboard';
import { AvailabilityManagement } from './pages/hospitaladmin/AvailabilityManagement';
import { SpecialistEquipment } from './pages/hospitaladmin/SpecialistEquipment';
import { IncomingReferrals } from './pages/hospitaladmin/IncomingReferrals';
import { HARefDetail } from './pages/hospitaladmin/HARefDetail';
import { ReferralHistory } from './pages/hospitaladmin/ReferralHistory';
import { HospitalProfile } from './pages/hospitaladmin/HospitalProfile';
import { DoctorManagement } from './pages/hospitaladmin/DoctorManagement';
import { HAPatientManagement } from './pages/hospitaladmin/HAPatientManagement';
import { HANewReferral } from './pages/hospitaladmin/HANewReferral';

/* ── SUPER ADMIN ─────────────────────────────────────────── */
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { HospitalManagement } from './pages/admin/HospitalManagement';
import { AddEditHospital } from './pages/admin/AddEditHospital';
import { HospitalAdminManagement } from './pages/admin/HospitalAdminManagement';
import { ServiceManagement } from './pages/admin/ServiceManagement';
import { Reports } from './pages/admin/Reports';
import { AdminPatientRequests } from './pages/admin/AdminPatientRequests';

function App() {
  const { loadFromStorage } = useAuthStore();
  useEffect(() => { loadFromStorage(); }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Routes>

        {/* ── PUBLIC ──────────────────────────────────────── */}
        <Route element={<Layout />}>
          <Route path="/" element={<SearchPage />} />
          <Route path="/search" element={<Navigate to="/" replace />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/hospital/:id" element={<HospitalDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <h1 className="text-5xl font-bold text-[#172554]">404</h1>
                <p className="mt-3 text-gray-500">Page not found</p>
                <Link to="/" className="mt-5 inline-block rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800">
                  Go Home
                </Link>
              </div>
            </div>
          } />
        </Route>

        {/* ── USER PORTAL ─────────────────────────────────── */}
        <Route element={
          <ProtectedRoute allowedRoles={['user', 'health_worker', 'hospital_staff']}>
            <UserLayout />
          </ProtectedRoute>
        }>
          <Route path="/user/dashboard"         element={<UserDashboard />} />
          <Route path="/user/hospitals"         element={<UserHospitalSearch />} />
          <Route path="/user/hospitals/:id"     element={<UserHospitalDetail />} />
          <Route path="/user/emergency"         element={<UserEmergencySearch />} />
          <Route path="/user/map"               element={<UserHospitalMap />} />
          <Route path="/user/referrals"                     element={<MyReferrals />} />
          <Route path="/user/referrals/:id"             element={<UserReferralDetail />} />
          <Route path="/user/profile"                   element={<UserProfile />} />
          <Route path="/user/request-help"              element={<UserRequestHelp />} />
          <Route path="/user/new-referral"              element={<UserReferral />} />
        </Route>

        {/* ── HOSPITAL ADMIN ──────────────────────────────── */}
        <Route element={
          <ProtectedRoute allowedRoles={['hospital_admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/hadmin/dashboard"          element={<HADashboard />} />
          <Route path="/hadmin/availability"       element={<AvailabilityManagement />} />
          <Route path="/hadmin/specialists"        element={<SpecialistEquipment />} />
          <Route path="/hadmin/doctors"            element={<DoctorManagement />} />
          <Route path="/hadmin/referrals"          element={<IncomingReferrals />} />
          <Route path="/hadmin/referrals/new"      element={<HANewReferral />} />
          <Route path="/hadmin/referrals/:id"      element={<HARefDetail />} />
          <Route path="/hadmin/referral-history"   element={<ReferralHistory />} />
          <Route path="/hadmin/patients"           element={<HAPatientManagement />} />
          <Route path="/hadmin/patient-requests"   element={<HAPatientManagement />} />
          <Route path="/hadmin/profile"            element={<HospitalProfile />} />
        </Route>

        {/* ── SUPER ADMIN ─────────────────────────────────── */}
        <Route element={
          <ProtectedRoute allowedRoles={['system_admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/admin/dashboard"               element={<AdminDashboard />} />
          <Route path="/admin/hospitals"               element={<HospitalManagement />} />
          <Route path="/admin/hospitals/new"           element={<AddEditHospital />} />
          <Route path="/admin/hospitals/:id/edit"      element={<AddEditHospital />} />
          <Route path="/admin/hospital-admins"         element={<HospitalAdminManagement />} />
          <Route path="/admin/services"                element={<ServiceManagement />} />
          <Route path="/admin/reports"                 element={<Reports />} />
          <Route path="/admin/audit"                   element={<Reports />} />
          <Route path="/admin/patient-requests"        element={<AdminPatientRequests />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;

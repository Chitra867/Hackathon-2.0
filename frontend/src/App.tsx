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
import { ProtectedRoute } from './components/common/ProtectedRoute';


/* =========================================================
   PUBLIC PAGES
========================================================= */

import { SearchPage } from './pages/public/SearchPage';
import { HospitalDetailPage } from './pages/public/HospitalDetailPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { AboutPage } from './pages/public/AboutPage';


/* =========================================================
   HEALTH WORKER
========================================================= */

import { HWDashboard } from './pages/healthworker/HWDashboard';
import { HWReferrals } from './pages/healthworker/HWReferrals';
import { HWNewReferral } from './pages/healthworker/HWNewReferral';
import { HWReferralDetail } from './pages/healthworker/HWReferralDetail';


/* =========================================================
   HOSPITAL ADMIN
========================================================= */

import { HADashboard } from './pages/hospitaladmin/HADashboard';
import { AvailabilityManagement } from './pages/hospitaladmin/AvailabilityManagement';
import { SpecialistEquipment } from './pages/hospitaladmin/SpecialistEquipment';
import { IncomingReferrals } from './pages/hospitaladmin/IncomingReferrals';
import { HARefDetail } from './pages/hospitaladmin/HARefDetail';
import { ReferralHistory } from './pages/hospitaladmin/ReferralHistory';
import { HospitalProfile } from './pages/hospitaladmin/HospitalProfile';


/* =========================================================
   SUPER ADMIN
========================================================= */

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { HospitalManagement } from './pages/admin/HospitalManagement';
import { AddEditHospital } from './pages/admin/AddEditHospital';
import { HospitalAdminManagement } from './pages/admin/HospitalAdminManagement';
import { ServiceManagement } from './pages/admin/ServiceManagement';
import { Reports } from './pages/admin/Reports';


function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>

      {/* =====================================================
          TOAST NOTIFICATIONS
      ===================================================== */}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />


      <Routes>

        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route element={<Layout />}>

          {/* Home / Hospital Search */}

          <Route
            path="/"
            element={<SearchPage />}
          />


          {/* Old search URL redirects to home */}

          <Route
            path="/search"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />


          {/* About */}

          <Route
            path="/about"
            element={<AboutPage />}
          />


          {/* Hospital Details */}

          <Route
            path="/hospital/:id"
            element={<HospitalDetailPage />}
          />


          {/* Login */}

          <Route
            path="/login"
            element={<LoginPage />}
          />


          {/* Registration */}

          <Route
            path="/register"
            element={<RegisterPage />}
          />


          {/* =====================================================
              404 PAGE
          ===================================================== */}

          <Route
            path="*"
            element={
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">

                  <h1 className="text-5xl font-bold text-[#172554]">
                    404
                  </h1>

                  <p className="mt-3 text-gray-500">
                    Page not found
                  </p>

                  <Link
                    to="/"
                    className="
                      mt-5
                      inline-block
                      rounded-lg
                      bg-primary-700
                      px-5
                      py-2.5
                      text-sm
                      font-medium
                      text-white
                      hover:bg-primary-800
                    "
                  >
                    Go Home
                  </Link>

                </div>
              </div>
            }
          />

        </Route>


        {/* =====================================================
            HEALTH WORKER ROUTES
        ===================================================== */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={['health_worker']}
            >
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/hw/dashboard"
            element={<HWDashboard />}
          />

          <Route
            path="/hw/referrals"
            element={<HWReferrals />}
          />

          <Route
            path="/hw/referrals/new"
            element={<HWNewReferral />}
          />

          <Route
            path="/hw/referrals/:id"
            element={<HWReferralDetail />}
          />

        </Route>


        {/* =====================================================
            HOSPITAL ADMIN ROUTES
        ===================================================== */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={[
                'hospital_admin',
                'hospital_staff',
              ]}
            >
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/hadmin/dashboard"
            element={<HADashboard />}
          />

          <Route
            path="/hadmin/availability"
            element={<AvailabilityManagement />}
          />

          <Route
            path="/hadmin/specialists"
            element={<SpecialistEquipment />}
          />

          <Route
            path="/hadmin/referrals"
            element={<IncomingReferrals />}
          />

          <Route
            path="/hadmin/referrals/:id"
            element={<HARefDetail />}
          />

          <Route
            path="/hadmin/referral-history"
            element={<ReferralHistory />}
          />

          <Route
            path="/hadmin/profile"
            element={<HospitalProfile />}
          />

        </Route>


        {/* =====================================================
            SUPER ADMIN ROUTES
        ===================================================== */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={['system_admin']}
            >
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          <Route
            path="/admin/dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/hospitals"
            element={<HospitalManagement />}
          />

          <Route
            path="/admin/hospitals/new"
            element={<AddEditHospital />}
          />

          <Route
            path="/admin/hospitals/:id/edit"
            element={<AddEditHospital />}
          />

          <Route
            path="/admin/hospital-admins"
            element={<HospitalAdminManagement />}
          />

          <Route
            path="/admin/services"
            element={<ServiceManagement />}
          />

          <Route
            path="/admin/reports"
            element={<Reports />}
          />

          <Route
            path="/admin/audit"
            element={<Reports />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;
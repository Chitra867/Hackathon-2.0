import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { Toaster } from 'react-hot-toast';

import { useAuthStore } from './store/authStore';

import { Layout } from './components/layout/Layout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';


// ─────────────────────────────────────────────
// Public pages
// ─────────────────────────────────────────────

import { SearchPage } from './pages/public/SearchPage';
import { HospitalDetailPage } from './pages/public/HospitalDetailPage';
import { LoginPage } from './pages/public/LoginPage';


// ─────────────────────────────────────────────
// Health Worker pages
// ─────────────────────────────────────────────

import { HWDashboard } from './pages/healthworker/HWDashboard';
import { HWReferrals } from './pages/healthworker/HWReferrals';
import { HWNewReferral } from './pages/healthworker/HWNewReferral';
import { HWReferralDetail } from './pages/healthworker/HWReferralDetail';


// ─────────────────────────────────────────────
// Hospital Admin pages
// ─────────────────────────────────────────────

import { HADashboard } from './pages/hospitaladmin/HADashboard';
import { AvailabilityManagement } from './pages/hospitaladmin/AvailabilityManagement';
import { SpecialistEquipment } from './pages/hospitaladmin/SpecialistEquipment';
import { IncomingReferrals } from './pages/hospitaladmin/IncomingReferrals';
import { HARefDetail } from './pages/hospitaladmin/HARefDetail';
import { ReferralHistory } from './pages/hospitaladmin/ReferralHistory';
import { HospitalProfile } from './pages/hospitaladmin/HospitalProfile';


// ─────────────────────────────────────────────
// Super Admin pages
// ─────────────────────────────────────────────

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { HospitalManagement } from './pages/admin/HospitalManagement';
import { AddEditHospital } from './pages/admin/AddEditHospital';
import { HospitalAdminManagement } from './pages/admin/HospitalAdminManagement';
import { ServiceManagement } from './pages/admin/ServiceManagement';
import { Reports } from './pages/admin/Reports';

//register page
import { RegisterPage } from './pages/public/RegisterPage';

function App() {

  const { loadFromStorage } = useAuthStore();


  useEffect(() => {

    loadFromStorage();

  }, [loadFromStorage]);


  return (

    <BrowserRouter>

      {/* Toast notifications */}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,

          style: {
            background: '#363636',
            color: '#fff',
          },

          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },

          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />


      <Routes>


        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        <Route element={<Layout />}>


          {/* HOME PAGE = SEARCH PAGE */}

          <Route
            path="/"
            element={<SearchPage />}
          />


          {/* Old /search URL redirects to home */}

          <Route
            path="/search"
            element={
              <Navigate
                to="/"
                replace
              />
            }
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


        </Route>

        {/* Register */}

        <Route
          path="/register"
          element={<RegisterPage />}
        />



        {/* =====================================================
            HEALTH WORKER PORTAL
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
            HOSPITAL ADMIN PORTAL
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
            SUPER ADMIN PORTAL
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



        {/* =====================================================
            404 PAGE
        ===================================================== */}

        <Route element={<Layout />}>

          <Route
            path="*"
            element={

              <div className="min-h-[60vh] flex items-center justify-center">

                <div className="text-center">

                  <h1 className="text-6xl font-bold text-gray-300 mb-4">
                    404
                  </h1>

                  <p className="text-gray-600 mb-6">
                    Page not found
                  </p>

                  <a
                    href="/"
                    className="btn-primary"
                  >
                    Go Home
                  </a>

                </div>

              </div>

            }
          />

        </Route>


      </Routes>

    </BrowserRouter>

  );

}


export default App;
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// ── Public pages ──────────────────────────────────────────────────────────────
import { SearchPage } from './pages/public/SearchPage';
import { HospitalDetailPage } from './pages/public/HospitalDetailPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';

// ── Hospital Admin / Staff pages ──────────────────────────────────────────────
import { HADashboard } from './pages/hospitaladmin/HADashboard';
import { AvailabilityManagement } from './pages/hospitaladmin/AvailabilityManagement';
import { SpecialistEquipment } from './pages/hospitaladmin/SpecialistEquipment';
import { IncomingReferrals } from './pages/hospitaladmin/IncomingReferrals';
import { HARefDetail } from './pages/hospitaladmin/HARefDetail';
import { ReferralHistory } from './pages/hospitaladmin/ReferralHistory';
import { HospitalProfile } from './pages/hospitaladmin/HospitalProfile';

function App() {
  const { loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { background: '#363636', color: '#fff' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ── Public routes (no login required) ── */}
        <Route element={<Layout />}>
          <Route path="/"                             element={<SearchPage />} />
          <Route path="/search"                       element={<SearchPage />} />
          <Route path="/hospital/:id"                 element={<HospitalDetailPage />} />
          <Route path="/login"                        element={<LoginPage />} />
          <Route path="/register"                     element={<RegisterPage />} />
          <Route path="/forgot-password"              element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:uid/:token"   element={<ResetPasswordPage />} />
        </Route>

        {/* ── Hospital Admin / Staff portal ── */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['hospital_admin', 'hospital_staff']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/hadmin/dashboard"        element={<HADashboard />} />
          <Route path="/hadmin/availability"     element={<AvailabilityManagement />} />
          <Route path="/hadmin/specialists"      element={<SpecialistEquipment />} />
          <Route path="/hadmin/referrals"        element={<IncomingReferrals />} />
          <Route path="/hadmin/referrals/:id"    element={<HARefDetail />} />
          <Route path="/hadmin/referral-history" element={<ReferralHistory />} />
          <Route path="/hadmin/profile"          element={<HospitalProfile />} />
        </Route>

        {/* ── 404 ── */}
        <Route element={<Layout />}>
          <Route
            path="*"
            element={
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                  <p className="text-gray-600 mb-6">Page not found</p>
                  <a href="/" className="btn-primary">Go Home</a>
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

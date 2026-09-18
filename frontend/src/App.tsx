import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { Layout } from './components/layout/Layout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { SearchPage } from './pages/public/SearchPage';
import { HospitalDetailPage } from './pages/public/HospitalDetailPage';
import { LoginPage } from './pages/public/LoginPage';

// Health Worker pages
import { HWDashboard } from './pages/healthworker/HWDashboard';
import { HWReferrals } from './pages/healthworker/HWReferrals';
import { HWNewReferral } from './pages/healthworker/HWNewReferral';
import { HWReferralDetail } from './pages/healthworker/HWReferralDetail';

// Hospital Staff pages
import { StaffDashboard } from './pages/hospitalstaff/StaffDashboard';

// Placeholder pages for features not yet fully implemented
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="text-center py-16">
    <h1 className="text-2xl font-bold text-gray-700 mb-4">{title}</h1>
    <p className="text-gray-500">This page is under construction.</p>
  </div>
);

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
        {/* Public routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/hospital/:id" element={<HospitalDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Health Worker routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['health_worker']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/hw/dashboard" element={<HWDashboard />} />
          <Route path="/hw/referrals" element={<HWReferrals />} />
          <Route path="/hw/referrals/new" element={<HWNewReferral />} />
          <Route path="/hw/referrals/:id" element={<HWReferralDetail />} />
        </Route>

        {/* Hospital Staff routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['hospital_staff', 'hospital_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/availability" element={<PlaceholderPage title="Manage Availability" />} />
          <Route path="/staff/referrals" element={<PlaceholderPage title="Incoming Referrals" />} />
          <Route path="/staff/referrals/:id" element={<PlaceholderPage title="Referral Detail" />} />
        </Route>

        {/* Hospital Admin routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['hospital_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/hadmin/dashboard" element={<PlaceholderPage title="Hospital Admin Dashboard" />} />
          <Route path="/hadmin/staff" element={<PlaceholderPage title="Manage Staff" />} />
        </Route>

        {/* System Admin routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['system_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<PlaceholderPage title="System Admin Dashboard" />} />
          <Route path="/admin/hospitals" element={<PlaceholderPage title="Manage Hospitals" />} />
          <Route path="/admin/hospitals/new" element={<PlaceholderPage title="Add Hospital" />} />
          <Route path="/admin/hospitals/:id/edit" element={<PlaceholderPage title="Edit Hospital" />} />
          <Route path="/admin/services" element={<PlaceholderPage title="Manage Services" />} />
          <Route path="/admin/users" element={<PlaceholderPage title="Manage Users" />} />
          <Route path="/admin/audit" element={<PlaceholderPage title="Audit Log" />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Layout />}>
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

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    const roleRedirects: Record<string, string> = {
      system_admin: '/admin/dashboard',
      hospital_admin: '/hadmin/dashboard',
      hospital_staff: '/staff/dashboard',
      health_worker: '/hw/dashboard',
      patient: '/search',
    };
    return <Navigate to={roleRedirects[user.role] || '/search'} replace />;
  }

  return <>{children}</>;
};

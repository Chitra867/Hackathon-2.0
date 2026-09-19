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
    // Redirect to their own area
    const roleRedirects: Record<string, string> = {
      system_admin:   '/',                  // system_admin has no React portal — stays on public site
      hospital_admin: '/hadmin/dashboard',
      hospital_staff: '/hadmin/dashboard',
      health_worker:  '/search',
      patient:        '/search',
    };
    return <Navigate to={roleRedirects[user.role] || '/search'} replace />;
  }

  return <>{children}</>;
};

import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import {
  FiHome, FiSearch, FiList, FiPlusCircle, FiActivity,
  FiUsers, FiSettings, FiFileText, FiChevronLeft, FiChevronRight,
  FiBarChart2, FiMapPin, FiClock, FiShield,
} from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const getNavItems = (role: string): NavItem[] => {
  switch (role) {
    case 'system_admin':
      return [
        { to: '/admin/dashboard',       label: 'Dashboard',        icon: <FiBarChart2 /> },
        { to: '/admin/hospitals',        label: 'Hospitals',        icon: <FiMapPin /> },
        { to: '/admin/hospital-admins',  label: 'Hospital Admins',  icon: <FiUsers /> },
        { to: '/admin/services',         label: 'Services',         icon: <FiSettings /> },
        { to: '/admin/reports',          label: 'Reports',          icon: <FiFileText /> },
      ];
    case 'hospital_admin':
    case 'hospital_staff':
      return [
        { to: '/hadmin/dashboard',        label: 'Dashboard',           icon: <FiHome /> },
        { to: '/hadmin/availability',     label: 'Availability',        icon: <FiActivity /> },
        { to: '/hadmin/specialists',      label: 'Specialists & Equip', icon: <FiUsers /> },
        { to: '/hadmin/referrals',        label: 'Referrals',           icon: <FiList /> },
        { to: '/hadmin/referral-history', label: 'Referral History',    icon: <FiClock /> },
        { to: '/hadmin/profile',          label: 'Hospital Profile',    icon: <FiSettings /> },
      ];
    case 'health_worker':
      return [
        { to: '/hw/dashboard',       label: 'Dashboard',     icon: <FiHome /> },
        { to: '/search',             label: 'Find Hospital', icon: <FiSearch /> },
        { to: '/hw/referrals/new',   label: 'New Referral',  icon: <FiPlusCircle /> },
        { to: '/hw/referrals',       label: 'My Referrals',  icon: <FiList /> },
      ];
    default:
      return [];
  }
};

const portalLabel = (role: string) => {
  switch (role) {
    case 'system_admin':   return 'Super Admin';
    case 'hospital_admin': return 'Hospital Admin';
    case 'hospital_staff': return 'Hospital Staff';
    case 'health_worker':  return 'Health Worker';
    default: return 'Portal';
  }
};

const portalAccent = (role: string) => {
  switch (role) {
    case 'system_admin':   return 'bg-rose-600';
    case 'hospital_admin': return 'bg-blue-600';
    case 'hospital_staff': return 'bg-blue-500';
    case 'health_worker':  return 'bg-primary-700';
    default: return 'bg-gray-600';
  }
};

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();
  const navItems = getNavItems(user?.role ?? '');

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
        {/* Sidebar */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-gray-100 transition-all duration-200 flex-shrink-0 ${
            collapsed ? 'w-16' : 'w-58'
          }`}
        >
          {/* Portal badge */}
          {!collapsed && (
            <div className={`${portalAccent(user?.role ?? '')} px-4 py-2.5`}>
              <p className="text-white text-xs font-semibold tracking-wide uppercase">{portalLabel(user?.role ?? '')}</p>
              <p className="text-white/70 text-xs truncate">{user?.full_name || user?.username}</p>
            </div>
          )}
          {collapsed && (
            <div className={`${portalAccent(user?.role ?? '')} flex items-center justify-center py-2`}>
              <FiShield className="text-white text-sm" />
            </div>
          )}

          <div className="flex-1 py-3 overflow-y-auto">
            <nav className="space-y-0.5 px-2">
              {navItems.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700 border border-primary-100'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Hospital name */}
          {!collapsed && user?.hospital_name && (
            <div className="px-4 py-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 truncate">{user.hospital_name}</p>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center h-10 border-t border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import {
  FiHome, FiList, FiActivity,
  FiUsers, FiSettings, FiFileText, FiChevronLeft, FiChevronRight,
  FiBarChart2, FiMapPin, FiClock, FiShield, FiUser, FiInbox, FiArrowRight,
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
        { to: '/admin/dashboard',          label: 'Dashboard',         icon: <FiBarChart2 /> },
        { to: '/admin/hospitals',           label: 'Hospitals',         icon: <FiMapPin /> },
        { to: '/admin/hospital-admins',     label: 'Hospital Admins',   icon: <FiUsers /> },
        { to: '/admin/patient-requests',    label: 'Patient Requests',  icon: <FiInbox /> },
        { to: '/admin/services',            label: 'Services',          icon: <FiSettings /> },
        { to: '/admin/reports',             label: 'Reports',           icon: <FiFileText /> },
      ];
    case 'hospital_admin':
    case 'hospital_staff':
      return [
        { to: '/hadmin/dashboard',        label: 'Dashboard',        icon: <FiHome /> },
        { to: '/hadmin/patients',         label: 'Patients',         icon: <FiUsers /> },
        { to: '/hadmin/referrals',        label: 'Referrals',        icon: <FiList /> },
        { to: '/hadmin/referrals/new',    label: 'New Referral',     icon: <FiArrowRight /> },
        { to: '/hadmin/availability',     label: 'Availability',     icon: <FiActivity /> },
        { to: '/hadmin/doctors',          label: 'Doctors',          icon: <FiUser /> },
        { to: '/hadmin/profile',          label: 'Hospital Profile', icon: <FiSettings /> },
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

// Warm family, one shade per role, so badges stay distinguishable without
// breaking from the cream/brown theme used across the rest of the app.
const portalAccent = (role: string) => {
  switch (role) {
    case 'system_admin':   return 'bg-[#8b4f3f]'; // rust
    case 'hospital_admin': return 'bg-[#6b7c4f]'; // olive
    case 'hospital_staff': return 'bg-[#7c9163]'; // lighter olive
    case 'health_worker':  return 'bg-[#8b6a3f]'; // primary brown
    default: return 'bg-[#a89a82]';
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
    <div className="min-h-screen flex flex-col bg-[#faf6ee]">
      <Navbar />
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
        {/* Sidebar */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-[#ede0ce] transition-all duration-200 flex-shrink-0 ${
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
                        ? 'bg-[#ede0ce] text-[#4a3a24] border border-[#d9c39e]'
                        : 'text-[#8a7a63] hover:bg-[#faf1e0] hover:text-[#4a3a24]'
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
            <div className="px-4 py-2 border-t border-[#ede0ce]">
              <p className="text-xs text-[#a89a82] truncate">{user.hospital_name}</p>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center h-10 border-t border-[#ede0ce] text-[#a89a82] hover:text-[#4a3a24] hover:bg-[#faf1e0] transition-colors"
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
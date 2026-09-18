import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import {
  FiHome, FiSearch, FiList, FiPlusCircle, FiActivity,
  FiUsers, FiSettings, FiFileText, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const getNavItems = (role: string): NavItem[] => {
  switch (role) {
    case 'health_worker':
      return [
        { to: '/hw/dashboard',       label: 'Dashboard',       icon: <FiHome /> },
        { to: '/search',             label: 'Find Hospital',   icon: <FiSearch /> },
        { to: '/hw/referrals/new',   label: 'New Referral',    icon: <FiPlusCircle /> },
        { to: '/hw/referrals',       label: 'My Referrals',    icon: <FiList /> },
      ];
    case 'hospital_staff':
      return [
        { to: '/staff/dashboard',    label: 'Dashboard',       icon: <FiHome /> },
        { to: '/staff/availability', label: 'Availability',    icon: <FiActivity /> },
        { to: '/staff/referrals',    label: 'Incoming Refs',   icon: <FiList /> },
      ];
    case 'hospital_admin':
      return [
        { to: '/hadmin/dashboard',   label: 'Dashboard',       icon: <FiHome /> },
        { to: '/hadmin/staff',       label: 'Manage Staff',    icon: <FiUsers /> },
        { to: '/staff/availability', label: 'Availability',    icon: <FiActivity /> },
        { to: '/staff/referrals',    label: 'Referrals',       icon: <FiList /> },
      ];
    case 'system_admin':
      return [
        { to: '/admin/dashboard',    label: 'Dashboard',       icon: <FiHome /> },
        { to: '/admin/hospitals',    label: 'Hospitals',       icon: <FiSettings /> },
        { to: '/admin/services',     label: 'Services',        icon: <FiList /> },
        { to: '/admin/users',        label: 'Users',           icon: <FiUsers /> },
        { to: '/admin/audit',        label: 'Audit Log',       icon: <FiFileText /> },
      ];
    default:
      return [];
  }
};

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();
  const navItems = getNavItems(user?.role ?? '');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">
        {/* Sidebar */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-gray-100 transition-all duration-200 ${
            collapsed ? 'w-16' : 'w-56'
          }`}
        >
          <div className="flex-1 py-4 overflow-y-auto">
            {!collapsed && (
              <div className="px-4 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {user?.role_display ?? 'Navigation'}
                </p>
              </div>
            )}
            <nav className="space-y-0.5 px-2">
              {navItems.map((item) => {
                const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
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

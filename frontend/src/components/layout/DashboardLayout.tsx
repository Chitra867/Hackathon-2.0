import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import {
  FiHome, FiList, FiActivity,
  FiUsers, FiSettings, FiChevronLeft, FiChevronRight,
  FiClock, FiShield,
} from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/hadmin/dashboard',        label: 'Dashboard',           icon: <FiHome /> },
  { to: '/hadmin/availability',     label: 'Availability',        icon: <FiActivity /> },
  { to: '/hadmin/specialists',      label: 'Specialists & Equip', icon: <FiUsers /> },
  { to: '/hadmin/referrals',        label: 'Referrals',           icon: <FiList /> },
  { to: '/hadmin/referral-history', label: 'Referral History',    icon: <FiClock /> },
  { to: '/hadmin/profile',          label: 'Hospital Profile',    icon: <FiSettings /> },
];

const portalLabel = (role: string) => {
  if (role === 'hospital_admin') return 'Hospital Admin';
  if (role === 'hospital_staff') return 'Hospital Staff';
  return 'Portal';
};

const portalAccent = (role: string) => {
  if (role === 'hospital_admin') return 'bg-[#6b7c4f]';
  if (role === 'hospital_staff') return 'bg-[#7c9163]';
  return 'bg-[#a89a82]';
};

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen flex flex-col bg-[#faf6ee]">
      <Navbar />
      <div className="flex flex-1 max-w-screen-2xl mx-auto w-full">

        {/* ── Sidebar ── */}
        <aside
          className={`hidden md:flex flex-col bg-white border-r border-[#ede0ce] transition-all duration-200 flex-shrink-0 ${
            collapsed ? 'w-16' : 'w-56'
          }`}
        >
          {/* Portal badge */}
          {!collapsed ? (
            <div className={`${portalAccent(user?.role ?? '')} px-4 py-2.5`}>
              <p className="text-white text-xs font-semibold tracking-wide uppercase">
                {portalLabel(user?.role ?? '')}
              </p>
              <p className="text-white/70 text-xs truncate">
                {user?.first_name || user?.username}
              </p>
            </div>
          ) : (
            <div className={`${portalAccent(user?.role ?? '')} flex items-center justify-center py-2.5`}>
              <FiShield className="text-white text-sm" />
            </div>
          )}

          {/* Nav items */}
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
              <p className="text-xs text-[#a89a82] truncate" title={user.hospital_name}>
                🏥 {user.hospital_name}
              </p>
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

        {/* ── Main content ── */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

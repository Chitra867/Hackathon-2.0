import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiSearch, FiAlertTriangle, FiMap,
  FiList, FiUser, FiLogOut, FiChevronLeft,
  FiChevronRight, FiActivity, FiPlus, FiArrowRight,
} from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/user/dashboard',    label: 'Dashboard',        icon: <FiHome /> },
  { to: '/user/hospitals',    label: 'Find Hospitals',   icon: <FiSearch /> },
  { to: '/user/emergency',    label: 'Emergency',        icon: <FiAlertTriangle /> },
  { to: '/user/map',          label: 'Hospital Map',     icon: <FiMap /> },
  { to: '/user/request-help', label: 'Request Help',     icon: <FiPlus /> },
  { to: '/user/new-referral', label: 'Refer to Another', icon: <FiArrowRight /> },
  { to: '/user/referrals',    label: 'My Requests',      icon: <FiList /> },
  { to: '/user/profile',      label: 'My Profile',       icon: <FiUser /> },
];

export const UserLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  return (
    /*
     * h-screen + flex-col gives us a precise full-viewport column.
     * overflow-hidden prevents any child from blowing past the viewport.
     */
    <div className="h-screen flex flex-col bg-[#faedd7] overflow-hidden">

      {/* ── Top navbar — fixed height ─────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-[#e5dcc8] px-4 h-14 flex items-center justify-between z-20 shadow-sm">
        <Link to="/user/dashboard" className="flex items-center gap-2">
          <GiHeartPlus className="text-2xl text-[#216d73]" />
          <span className="text-lg font-bold text-[#1c3d3f] hidden sm:block">UpacharKhoj</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-[#6b7d79]">
            Welcome,{' '}
            <span className="font-semibold text-[#1c3d3f]">
              {user?.first_name || user?.username}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-[#6b7d79] hover:text-[#a15b4a] transition-colors px-2 py-1.5 rounded-lg hover:bg-[#f6e9e5]"
          >
            <FiLogOut />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      {/*
       * ── Body row — fills all remaining height ────────────
       * flex-1 + min-h-0 ensures this row shrinks to fit without
       * overflowing the parent h-screen container.
       */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">

        {/* ── Sidebar (desktop) ─────────────────────────── */}
        <aside
          className={`hidden md:flex flex-col flex-shrink-0 bg-white border-r border-[#e5dcc8] transition-all duration-200 ${
            collapsed ? 'w-16' : 'w-56'
          }`}
        >
          {/* Portal badge */}
          {!collapsed ? (
            <div className="flex-shrink-0 bg-[#216d73] px-4 py-2.5">
              <p className="text-white text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5">
                <FiActivity /> Patient Portal
              </p>
              <p className="text-[#cfe3e1] text-xs truncate">
                {user?.full_name || user?.username}
              </p>
            </div>
          ) : (
            <div className="flex-shrink-0 bg-[#216d73] flex items-center justify-center py-2.5">
              <FiActivity className="text-white" />
            </div>
          )}

          <nav className="flex-1 py-3 overflow-y-auto min-h-0">
            <div className="space-y-0.5 px-2">
              {NAV_ITEMS.map(item => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#eef3f2] text-[#216d73] border border-[#c7dbd8]'
                        : 'text-[#6b7d79] hover:bg-[#faf6ee] hover:text-[#1c3d3f]'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Logout button */}
          {!collapsed && (
            <div className="flex-shrink-0 px-2 pb-3 border-t border-[#e5dcc8] pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#a15b4a] hover:bg-[#f6e9e5] transition-colors"
              >
                <FiLogOut className="flex-shrink-0" />
                Logout
              </button>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex-shrink-0 flex items-center justify-center h-10 border-t border-[#e5dcc8] text-[#aabfb9] hover:text-[#216d73] hover:bg-[#faf6ee] transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </aside>

        {/*
         * ── Main content ─────────────────────────────────
         * flex-1 + min-w-0 + min-h-0: fills remaining width/height.
         * overflow-hidden so the page itself controls its own scroll.
         */}
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav className="md:hidden flex-shrink-0 fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5dcc8] z-30 flex overflow-x-auto">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-shrink-0 flex flex-col items-center justify-center py-2 px-3 text-xs transition-colors ${
                active ? 'text-[#216d73]' : 'text-[#aabfb9]'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-0.5 leading-none whitespace-nowrap">
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiLogOut, FiUser, FiUserPlus } from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

export const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, getDashboardPath } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
      setMenuOpen(false);
    } catch {
      toast.error('Logout failed');
    }
  };

  const navLinks = [
    { to: '/', label: 'Find Hospital' },
    { to: '/about', label: 'About' },
    ...(authenticated && user?.role !== 'user'
      ? [{ to: getDashboardPath(), label: 'Dashboard' }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/search';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#e8dfcf] bg-[#fffdf9]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Main bar */}
        <div className="flex h-14 items-center justify-between gap-3">

          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="group flex shrink-0 items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#07545e] shadow-sm transition-transform group-hover:scale-105">
              <GiHeartPlus className="text-[18px] text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight text-[#172554]">UpacharKhoj</div>
              <div className="text-[9px] font-semibold tracking-[0.14em] text-[#9a7b3c]">NEPAL</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center rounded-full border border-[#ebe3d5] bg-[#f8f4eb] p-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? 'bg-white text-[#07545e] shadow-sm'
                    : 'text-[#59636d] hover:bg-white/80 hover:text-[#07545e]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex shrink-0 items-center gap-1">
            {authenticated ? (
              <>
                {/* Notifications */}
                <button
                  type="button"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#edf5f3] hover:text-[#07545e]"
                  aria-label="Notifications"
                >
                  <FiBell className="text-base" />
                  {unreadCount() > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none">
                      {unreadCount() > 9 ? '9+' : unreadCount()}
                    </span>
                  )}
                </button>

                {/* Desktop user */}
                <div className="hidden items-center gap-1 md:flex">
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-2 rounded-full border border-[#e8dfcf] bg-white px-2.5 py-1.5 transition hover:border-[#b9d1cc] hover:bg-[#f7fbfa]"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dceeea] text-xs font-bold text-[#07545e]">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden text-left lg:block">
                      <div className="max-w-[110px] truncate text-xs font-semibold text-[#25324a]">
                        {user?.first_name || user?.username}
                      </div>
                      <div className="text-[10px] capitalize text-[#94a3b8]">
                        {user?.role_display || user?.role?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748b] transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <FiLogOut className="text-sm" />
                  </button>
                </div>
              </>
            ) : (
              /* Desktop auth buttons */
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 rounded-full border border-[#ddd6c9] bg-white px-4 py-2 text-sm font-semibold text-[#334155] transition hover:border-[#b8c9c6] hover:bg-[#fafcfb]"
                >
                  <FiUser className="text-xs" /> Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-full bg-[#07545e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#043f47]"
                >
                  <FiUserPlus className="text-xs" /> Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#475569] transition hover:bg-[#f4efe5] md:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile menu — slides in below the bar */}
        {menuOpen && (
          <div className="border-t border-[#eee7dc] py-2 md:hidden">
            <nav className="space-y-0.5 mb-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    isActive(link.to)
                      ? 'bg-[#e8f3f0] text-[#07545e]'
                      : 'text-[#475569] hover:bg-[#f5f1e9] hover:text-[#07545e]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {authenticated ? (
              <div className="border-t border-[#eee7dc] pt-2 space-y-0.5">
                <div className="flex items-center gap-3 rounded-xl bg-[#f8f4eb] px-4 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dceeea] text-xs font-bold text-[#07545e]">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[#25324a]">
                      {user?.first_name || user?.username}
                    </div>
                    <div className="text-xs capitalize text-[#94a3b8]">
                      {user?.role_display || user?.role?.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <FiLogOut /> Sign Out
                </button>
              </div>
            ) : (
              <div className="border-t border-[#eee7dc] pt-2 space-y-1.5">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#ddd6c9] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155]"
                >
                  <FiUser /> Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#07545e] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <FiUserPlus /> Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

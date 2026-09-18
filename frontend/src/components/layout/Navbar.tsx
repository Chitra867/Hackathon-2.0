import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiMenu,
  FiX,
  FiBell,
  FiLogOut,
  FiUser,
  FiUserPlus,
} from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

export const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    user,
    logout,
    isAuthenticated,
    getDashboardPath,
  } = useAuthStore();

  const { unreadCount } = useNotificationStore();

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();

    toast.success('Logged out successfully');

    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/search', label: 'Find Hospital' },
    { to: '/about', label: 'About' },
    ...(isAuthenticated()
      ? [{ to: getDashboardPath(), label: 'Dashboard' }]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === '/search') {
      return location.pathname === '/search';
    }

    if (path === '/about') {
      return location.pathname === '/about';
    }

    return location.pathname.startsWith(path);
  };

  return (
    <header className="border-b border-[#e8dfcf] bg-[#fffdf9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-[72px] items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#07545e] shadow-sm transition-transform group-hover:scale-105">
              <GiHeartPlus className="text-[22px] text-white" />
            </div>

            <div className="leading-tight">
              <div className="text-lg font-bold tracking-[-0.02em] text-[#172554]">
                UpacharKhoj
              </div>

              <div className="text-[11px] font-medium tracking-[0.14em] text-[#9a7b3c]">
                NEPAL
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center rounded-full border border-[#ebe3d5] bg-[#f8f4eb] p-1.5 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? 'bg-white text-[#07545e] shadow-sm'
                    : 'text-[#59636d] hover:bg-white/80 hover:text-[#07545e]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">

            {isAuthenticated() ? (
              <>
                {/* Notifications */}
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#edf5f3] hover:text-[#07545e]"
                  aria-label="Notifications"
                >
                  <FiBell className="text-lg" />

                  {unreadCount() > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount() > 9 ? '9+' : unreadCount()}
                    </span>
                  )}
                </button>

                {/* User */}
                <div className="hidden items-center gap-2 md:flex">
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-2 rounded-full border border-[#e8dfcf] bg-white px-3 py-2 transition hover:border-[#b9d1cc] hover:bg-[#f7fbfa]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dceeea] text-xs font-bold text-[#07545e]">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>

                    <div className="hidden text-left lg:block">
                      <div className="max-w-[120px] truncate text-sm font-semibold text-[#25324a]">
                        {user?.first_name || user?.username}
                      </div>

                      <div className="text-[10px] capitalize text-[#94a3b8]">
                        {user?.role_display ||
                          user?.role?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#64748b] transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <FiLogOut />
                  </button>
                </div>
              </>
            ) : (
              /* Login + Signup */
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-full border border-[#ddd6c9] bg-white px-5 py-2.5 text-sm font-semibold text-[#334155] transition hover:border-[#b8c9c6] hover:bg-[#fafcfb]"
                >
                  <FiUser />
                  Login
                </Link>

                <Link
                  to="/register"
                  className="flex items-center gap-2 rounded-full bg-[#07545e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#043f47] hover:shadow-md"
                >
                  <FiUserPlus />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#475569] transition hover:bg-[#f4efe5] md:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="border-t border-[#eee7dc] pb-4 pt-3 md:hidden">

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-full px-5 py-3 text-sm font-medium transition ${
                    isActive(link.to)
                      ? 'bg-[#e8f3f0] text-[#07545e]'
                      : 'text-[#475569] hover:bg-[#f5f1e9] hover:text-[#07545e]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {isAuthenticated() ? (
              <div className="mt-3 border-t border-[#eee7dc] pt-3">

                <div className="mb-2 flex items-center gap-3 rounded-[24px] bg-[#f8f4eb] px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dceeea] text-xs font-bold text-[#07545e]">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-[#25324a]">
                      {user?.first_name || user?.username}
                    </div>

                    <div className="text-xs capitalize text-[#94a3b8]">
                      {user?.role_display ||
                        user?.role?.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <FiLogOut />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-2 border-t border-[#eee7dc] pt-3">

                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full border border-[#ddd6c9] bg-white px-5 py-3 text-sm font-semibold text-[#334155]"
                >
                  <FiUser />
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-full bg-[#07545e] px-5 py-3 text-sm font-semibold text-white"
                >
                  <FiUserPlus />
                  Sign Up
                </Link>

              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

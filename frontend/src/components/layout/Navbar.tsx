import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiMenu, FiX, FiBell, FiLogOut,
  FiUser, FiUserPlus, FiExternalLink, FiSearch,
} from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

const DJANGO_ADMIN_URL = 'http://127.0.0.1:8000/admin/';

export const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, getDashboardPath } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link to="/" className="flex flex-shrink-0 items-center gap-2">
            <GiHeartPlus className="text-2xl text-primary-700" />
            <div>
              <span className="block text-lg font-bold leading-tight text-primary-800">
                UpacharKhoj
              </span>
              <span className="hidden text-xs leading-tight text-gray-500 sm:block">Nepal</span>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/search"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/' || location.pathname === '/search'
                  ? 'text-primary-700'
                  : 'text-gray-600 hover:text-primary-700'
              }`}
            >
              Find Hospital
            </Link>

            {/* Dashboard link — only for logged-in non-admin users */}
            {isAuthenticated() && user?.role !== 'system_admin' && (
              <Link
                to={getDashboardPath()}
                className={`text-sm font-medium transition-colors ${
                  isActive('/hadmin')
                    ? 'text-primary-700'
                    : 'text-gray-600 hover:text-primary-700'
                }`}
              >
                Dashboard
              </Link>
            )}

            {/* Admin Panel — always visible to everyone */}
            <a
              href={DJANGO_ADMIN_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-[#c9a87c] bg-[#fdf3e7] px-3 py-1.5 text-sm font-semibold text-[#8b5a2b] transition-colors hover:bg-[#f7e8d0]"
            >
              <FiExternalLink className="text-xs" />
              Admin Panel
            </a>
          </nav>

          {/* ── Right side ── */}
          <div className="flex items-center gap-2">

            {isAuthenticated() ? (
              <>
                {/* Notifications */}
                <button
                  type="button"
                  className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-700"
                  aria-label="Notifications"
                >
                  <FiBell />
                  {unreadCount() > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                      {unreadCount() > 9 ? '9+' : unreadCount()}
                    </span>
                  )}
                </button>

                {/* User avatar + name (desktop) */}
                <div className="hidden items-center gap-2 md:flex">
                  <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden text-left lg:block">
                      <div className="max-w-[110px] truncate text-sm font-medium leading-tight text-gray-800">
                        {user?.first_name || user?.username}
                      </div>
                      <div className="text-xs capitalize leading-tight text-gray-400">
                        {user?.role_display || user?.role?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <FiLogOut />
                  </button>
                </div>
              </>
            ) : (
              /* Login + Sign Up (desktop, not logged in) */
              <div className="hidden items-center gap-2 md:flex">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FiUser className="text-sm" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800"
                >
                  <FiUserPlus className="text-sm" />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="space-y-1 border-t border-gray-100 py-3 md:hidden">

            {/* Find Hospital */}
            <Link
              to="/search"
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === '/' || location.pathname === '/search'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
              }`}
            >
              <FiSearch className="mr-2 inline" />
              Find Hospital
            </Link>

            {/* Dashboard — non-admin logged-in users */}
            {isAuthenticated() && user?.role !== 'system_admin' && (
              <Link
                to={getDashboardPath()}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/hadmin')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                Dashboard
              </Link>
            )}

            {/* Admin Panel — always visible */}
            <a
              href={DJANGO_ADMIN_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg border border-[#c9a87c] bg-[#fdf3e7] px-3 py-2 text-sm font-semibold text-[#8b5a2b]"
            >
              <FiExternalLink />
              Admin Panel
            </a>

            {/* Divider */}
            <div className="border-t border-gray-100 pt-2 mt-1">
              {isAuthenticated() ? (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {user?.first_name || user?.username}
                      </div>
                      <div className="text-xs capitalize text-gray-400">
                        {user?.role_display || user?.role?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-1">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <FiUser />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg bg-primary-700 px-3 py-2 text-sm font-medium text-white hover:bg-primary-800"
                  >
                    <FiUserPlus />
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

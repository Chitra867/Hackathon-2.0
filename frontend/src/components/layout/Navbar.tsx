import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiLogOut, FiSearch, FiUser, FiUserPlus } from 'react-icons/fi';
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

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { to: '/search', label: 'Find Hospital' },
    ...(isAuthenticated() ? [{ to: getDashboardPath(), label: 'Dashboard' }] : []),
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <GiHeartPlus className="text-2xl text-primary-700" />
            <div>
              <span className="font-bold text-primary-800 text-lg leading-tight">UpacharKhoj</span>
              <span className="hidden sm:block text-xs text-gray-500 leading-tight">Nepal</span>
            </div>
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.to) ? 'text-primary-700' : 'text-gray-600 hover:text-primary-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search icon */}
            <Link
              to="/search"
              className="p-2 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
              aria-label="Search hospitals"
            >
              <FiSearch />
            </Link>

            {isAuthenticated() ? (
              <>
                {/* Notifications */}
                <button
                  className="relative p-2 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <FiBell />
                  {unreadCount() > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount() > 9 ? '9+' : unreadCount()}
                    </span>
                  )}
                </button>

                {/* User avatar + name */}
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-xs">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:block text-left">
                      <div className="text-sm font-medium text-gray-800 leading-tight truncate max-w-[100px]">
                        {user?.first_name || user?.username}
                      </div>
                      <div className="text-xs text-gray-400 leading-tight capitalize">
                        {user?.role_display || user?.role?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <FiLogOut />
                  </button>
                </div>
              </>
            ) : (
              /* Login + Sign Up buttons */
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FiUser className="text-sm" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors"
                >
                  <FiUserPlus className="text-sm" />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated() ? (
              <>
                <div className="px-3 py-2 border-t border-gray-100 mt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-xs">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{user?.first_name || user?.username}</div>
                      <div className="text-xs text-gray-400 capitalize">{user?.role_display}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <FiLogOut /> Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-gray-100 pt-2 mt-1 space-y-1">
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    <FiUser /> Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-lg"
                    onClick={() => setMenuOpen(false)}
                  >
                    <FiUserPlus /> Sign Up
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

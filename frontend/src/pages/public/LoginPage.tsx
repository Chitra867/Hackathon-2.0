import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError, isAuthenticated, getDashboardPath } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from || getDashboardPath(), { replace: true });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(username, password);
      toast.success(`Welcome back, ${username}!`);
      navigate(from || getDashboardPath(), { replace: true });
    } catch {
      // Error is set in store
    }
  };

  const DEMO_ACCOUNTS = [
    { label: 'System Admin', username: 'admin', password: 'Admin@123' },
    { label: 'Hospital Admin', username: 'hospital1_admin', password: 'Admin@123' },
    { label: 'Hospital Staff', username: 'hospital1_staff', password: 'Staff@123' },
    { label: 'Health Worker', username: 'hw1', password: 'HealthWorker@123' },
  ];

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <GiHeartPlus className="text-3xl text-primary-700" />
            <span className="text-2xl font-bold text-primary-800">UpacharKhoj</span>
          </Link>
          <p className="text-gray-600 text-sm mt-2">Healthcare Availability & Referral Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Sign In</h1>

          {/* Demo accounts */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs font-semibold text-blue-700 mb-2">Demo Accounts (click to fill):</p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => fillDemo(acc.username, acc.password)}
                  className="text-xs px-2 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium">{acc.label}</div>
                  <div className="text-blue-400">{acc.username}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5 mb-4">
              <FiAlertCircle className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username" className="label">Username</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  className="input pl-9"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary btn-lg mt-2"
              disabled={isLoading || !username || !password}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link to="/search" className="text-sm text-gray-500 hover:text-primary-700 transition-colors">
              Continue as public visitor → Search hospitals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

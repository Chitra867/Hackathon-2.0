import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiExternalLink } from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const DJANGO_ADMIN_URL = 'http://127.0.0.1:8000/admin/';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminError, setIsAdminError] = useState(false);
  const { login, isLoading, error, clearError, isAuthenticated, getDashboardPath } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(from || getDashboardPath(), { replace: true });
    }
  }, []);

  useEffect(() => { clearError(); setIsAdminError(false); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsAdminError(false);
    try {
      await login(username, password);
      toast.success(`Welcome back, ${username}!`);
      navigate(from || getDashboardPath(), { replace: true });
    } catch (err: any) {
      // If the error is about system admin, show the special redirect hint
      const msg: string = err?.message || '';
      if (msg.toLowerCase().includes('system administrator') || msg.toLowerCase().includes('/admin/')) {
        setIsAdminError(true);
      }
    }
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
          <p className="text-gray-500 text-sm mt-1">Nepal Healthcare Coordination Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h1>
          <p className="text-sm text-gray-500 mb-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-700 font-medium hover:underline">
              Create one free
            </Link>
          </p>

          {/* Admin redirect hint */}
          {isAdminError && (
            <div className="bg-[#fdf3e7] border border-[#e2b97a] rounded-xl px-4 py-4 mb-5">
              <p className="text-sm font-semibold text-[#7c4a1e] mb-1">
                System administrators cannot log in here.
              </p>
              <p className="text-xs text-[#a0622a] mb-3">
                Please use the Admin Panel to log in with your admin credentials.
              </p>
              <a
                href={DJANGO_ADMIN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#8b4f3f] hover:bg-[#7a3f30] text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <FiExternalLink />
                Open Admin Panel
              </a>
            </div>
          )}

          {/* Generic error (non-admin) */}
          {error && !isAdminError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              <FiAlertCircle className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="form-group mb-0">
              <label htmlFor="username" className="label">Username</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  className="input pl-9"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Enter your password"
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
              className="w-full btn-primary btn-lg justify-center mt-2"
              disabled={isLoading || !username || !password}
            >
              {isLoading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              New to UpacharKhoj?{' '}
              <Link to="/register" className="text-primary-700 font-medium hover:underline">
                Create a free account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Hospital staff or admin?{' '}
          <span className="text-gray-500">Use the same login — you'll be redirected to your portal.</span>
        </p>
      </div>
    </div>
  );
};

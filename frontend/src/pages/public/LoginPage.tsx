import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
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

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(username, password);
      toast.success(`Welcome back, ${username}!`);
      navigate(from || getDashboardPath(), { replace: true });
    } catch {
      /* Error shown from store */
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#faf8f3] px-4 py-10">
      <div className="w-full max-w-[440px] rounded-[24px] border border-[#e9e3d9] bg-white px-6 py-9 shadow-[0_12px_40px_rgba(30,50,45,0.05)] sm:px-9">

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#172554]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[#718096]">
            Sign in to your UpacharKhoj account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-[#334155]">
              Username or Email
            </label>

            <div className="relative">
              <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                required
                autoFocus
                autoComplete="username"
                className="h-12 w-full rounded-full border border-[#e2e5e3] bg-[#fcfcfa] pl-11 pr-4 text-sm text-[#334155] outline-none transition placeholder:text-[#a0a8b3] focus:border-[#07545e] focus:bg-white focus:ring-2 focus:ring-[#07545e]/10"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium text-[#334155]">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-[#07545e] hover:underline">
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="h-12 w-full rounded-full border border-[#e2e5e3] bg-[#fcfcfa] pl-11 pr-12 text-sm text-[#334155] outline-none transition placeholder:text-[#a0a8b3] focus:border-[#07545e] focus:bg-white focus:ring-2 focus:ring-[#07545e]/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#07545e]"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#06434b] text-sm font-semibold text-white shadow-[0_6px_16px_rgba(6,67,75,0.18)] transition hover:bg-[#032f35] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-100">
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Register */}
        <p className="mt-7 text-center text-sm text-[#718096]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-[#07545e] hover:underline">
            Create one free
          </Link>
        </p>

        <p className="mt-5 text-center text-xs leading-5 text-[#94a3b8]">
          Hospital staff and admins can use the same login.
        </p>
      </div>
    </div>
  );
};
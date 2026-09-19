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
    if (isAuthenticated()) navigate(from || getDashboardPath(), { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { clearError(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(username, password);
      toast.success(`Welcome back, ${username}!`);
      navigate(from || getDashboardPath(), { replace: true });
    } catch { /* Error shown from store */ }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#faf8f3] px-4 py-8">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#e9e3d9] bg-white px-5 py-7 shadow-[0_8px_30px_rgba(30,50,45,0.07)] sm:px-8 sm:py-9">

        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold tracking-tight text-[#172554] sm:text-2xl">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-[#718096]">
            Sign in to your UpacharKhoj account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <FiAlertCircle className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-[#334155]">
              Username or Email
            </label>
            <div className="relative">
              <FiUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                required
                autoFocus
                autoComplete="username"
                className="h-11 w-full rounded-full border border-[#e2e5e3] bg-[#fcfcfa] pl-10 pr-4 text-sm text-[#334155] outline-none transition placeholder:text-[#a0a8b3] focus:border-[#07545e] focus:bg-white focus:ring-2 focus:ring-[#07545e]/10"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium text-[#334155]">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-medium text-[#07545e] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="h-11 w-full rounded-full border border-[#e2e5e3] bg-[#fcfcfa] pl-10 pr-11 text-sm text-[#334155] outline-none transition placeholder:text-[#a0a8b3] focus:border-[#07545e] focus:bg-white focus:ring-2 focus:ring-[#07545e]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#07545e]"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#06434b] text-sm font-semibold text-white shadow-md transition hover:bg-[#032f35] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#718096]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-[#07545e] hover:underline">
            Create one free
          </Link>
        </p>
        <p className="mt-3 text-center text-xs leading-5 text-[#94a3b8]">
          Hospital staff and admins can use the same login.
        </p>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiUser, FiLock, FiMail, FiPhone,
  FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle,
} from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated, getDashboardPath } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password2: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) navigate(getDashboardPath(), { replace: true });
  }, []);

  useEffect(() => { clearError(); }, []);

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (form.password !== form.password2) {
      toast.error('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    try {
      await register({
        username: form.username,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        password: form.password,
        password2: form.password2,
      });
      toast.success(`Welcome to UpacharKhoj, ${form.first_name || form.username}!`);
      navigate(getDashboardPath(), { replace: true });
    } catch {
      // error is set in store and shown below
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-500', text: 'text-red-500', width: 'w-1/4' };
    if (p.length < 8) return { label: 'Weak', color: 'bg-orange-400', text: 'text-orange-500', width: 'w-2/4' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p))
      return { label: 'Fair', color: 'bg-yellow-400', text: 'text-yellow-600', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', text: 'text-green-600', width: 'w-full' };
  };
  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <GiHeartPlus className="text-3xl text-primary-700" />
            <span className="text-2xl font-bold text-primary-800">UpacharKhoj</span>
          </Link>
          <p className="text-gray-500 text-sm mt-1">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
          <p className="text-sm text-gray-500 mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-700 font-medium hover:underline">
              Sign in
            </Link>
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              <FiAlertCircle className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name row */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group mb-0">
                <label className="label">First Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input pl-9"
                    placeholder="Rajan"
                    value={form.first_name}
                    onChange={(e) => set('first_name', e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
              </div>
              <div className="form-group mb-0">
                <label className="label">Last Name</label>
                <input
                  className="input"
                  placeholder="Sharma"
                  value={form.last_name}
                  onChange={(e) => set('last_name', e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Username */}
            <div className="form-group mb-0">
              <label className="label">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9"
                  placeholder="Choose a username"
                  value={form.username}
                  onChange={(e) => set('username', e.target.value)}
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group mb-0">
              <label className="label">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="input pl-9"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group mb-0">
              <label className="label">Phone Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  className="input pl-9"
                  placeholder="98XXXXXXXX"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group mb-0">
              <label className="label">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  required
                  autoComplete="new-password"
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
              {strength && (
                <div className="mt-1.5">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`}
                    />
                  </div>
                  <p className={`text-xs mt-0.5 ${strength.text}`}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group mb-0">
              <label className="label">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-9 pr-10"
                  placeholder="Repeat your password"
                  value={form.password2}
                  onChange={(e) => set('password2', e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {form.password2 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.password === form.password2
                      ? <FiCheckCircle className="text-green-500" />
                      : <FiAlertCircle className="text-red-400" />}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary btn-lg justify-center mt-2"
              disabled={isLoading || !form.username || !form.email || !form.password || !form.password2}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            By registering you agree to use this platform for legitimate healthcare coordination.
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';

export const ResetPasswordPage: React.FC = () => {
  const { uid = '', token = '' } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ new_password: '', new_password2: '' });

  const set = (k: keyof typeof form, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.new_password !== form.new_password2) {
      setError('Passwords do not match.');
      return;
    }
    if (form.new_password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPasswordConfirm(uid, token, form.new_password, form.new_password2);
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      const data = err.response?.data;
      const msg =
        data?.detail ||
        (Array.isArray(data?.new_password) ? data.new_password[0] : data?.new_password) ||
        'Reset failed. The link may have expired.';
      setError(msg);
    } finally {
      setLoading(false);
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
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-green-600 text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your password has been changed. Redirecting to sign in…
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <FiArrowLeft /> Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your new password below.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
                  <FiAlertCircle className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group mb-0">
                  <label className="label">New Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pl-9 pr-10"
                      placeholder="Min 8 characters"
                      value={form.new_password}
                      onChange={(e) => set('new_password', e.target.value)}
                      required
                      autoFocus
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
                </div>

                <div className="form-group mb-0">
                  <label className="label">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input pl-9 pr-10"
                      placeholder="Repeat your password"
                      value={form.new_password2}
                      onChange={(e) => set('new_password2', e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                    {form.new_password2 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {form.new_password === form.new_password2
                          ? <FiCheckCircle className="text-green-500" />
                          : <FiAlertCircle className="text-red-400" />}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full btn-primary btn-lg justify-center mt-2"
                  disabled={loading || !form.new_password || !form.new_password2}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting…
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-primary-700 transition-colors"
                >
                  <FiArrowLeft /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

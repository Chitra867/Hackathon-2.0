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

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.new_password2) { setError('Passwords do not match.'); return; }
    if (form.new_password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await authApi.resetPasswordConfirm(uid, token, form.new_password, form.new_password2);
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; new_password?: string | string[] } } };
      const data = e.response?.data;
      const msg =
        data?.detail ||
        (Array.isArray(data?.new_password) ? data.new_password[0] : data?.new_password) ||
        'Reset failed. The link may have expired.';
      setError(msg as string);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'h-11 w-full rounded-full border border-[#e2e5e3] bg-[#fcfcfa] pl-10 pr-10 text-sm text-[#334155] outline-none transition placeholder:text-[#a0a8b3] focus:border-[#07545e] focus:bg-white focus:ring-2 focus:ring-[#07545e]/10';

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#faf8f3] px-4 py-8">
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-[#172554] hover:text-[#07545e] transition-colors">
            <GiHeartPlus className="text-2xl text-[#07545e]" />
            <span className="text-xl font-bold">UpacharKhoj</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-[#e9e3d9] bg-white px-5 py-7 shadow-[0_8px_30px_rgba(30,50,45,0.07)] sm:px-8">
          {success ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <FiCheckCircle className="text-2xl text-green-600" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#172554]">Password Reset!</h2>
              <p className="mb-6 text-sm text-[#64748b]">
                Your password has been changed. Redirecting to sign in…
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <FiArrowLeft /> Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-[#172554] sm:text-2xl">Set New Password</h1>
                <p className="mt-1.5 text-sm text-[#64748b]">Enter your new password below.</p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <FiAlertCircle className="shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={inputCls}
                      placeholder="Min 8 characters"
                      value={form.new_password}
                      onChange={e => set('new_password', e.target.value)}
                      required autoFocus autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#07545e]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#334155]">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={inputCls}
                      placeholder="Repeat your password"
                      value={form.new_password2}
                      onChange={e => set('new_password2', e.target.value)}
                      required autoComplete="new-password"
                    />
                    {form.new_password2 && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {form.new_password === form.new_password2
                          ? <FiCheckCircle className="text-green-500" />
                          : <FiAlertCircle className="text-red-400" />}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !form.new_password || !form.new_password2}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#06434b] text-sm font-semibold text-white shadow-md transition hover:bg-[#032f35] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Resetting…</>
                  ) : 'Reset Password'}
                </button>
              </form>

              <div className="mt-5 border-t border-[#ede8de] pt-4 text-center">
                <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-[#64748b] hover:text-[#07545e] transition-colors">
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

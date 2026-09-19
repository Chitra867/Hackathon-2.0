import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import { authApi } from '../../lib/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; email?: string[] } } };
      const msg =
        e.response?.data?.detail ||
        e.response?.data?.email?.[0] ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#faf8f3] px-4 py-8">
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-[#172554] hover:text-[#07545e] transition-colors">
            <GiHeartPlus className="text-2xl text-[#07545e]" />
            <span className="text-xl font-bold">UpacharKhoj</span>
          </Link>
          <p className="mt-1 text-xs text-[#94a3b8]">Nepal Healthcare Coordination Platform</p>
        </div>

        <div className="rounded-2xl border border-[#e9e3d9] bg-white px-5 py-7 shadow-[0_8px_30px_rgba(30,50,45,0.07)] sm:px-8">
          {!submitted ? (
            <>
              <div className="mb-5">
                <h1 className="text-xl font-bold text-[#172554] sm:text-2xl">Forgot Password?</h1>
                <p className="mt-1.5 text-sm text-[#64748b]">
                  Enter the email linked to your account — we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <FiAlertCircle className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#334155]">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input
                      id="email"
                      type="email"
                      className="h-11 w-full rounded-full border border-[#e2e5e3] bg-[#fcfcfa] pl-10 pr-4 text-sm text-[#334155] outline-none transition placeholder:text-[#a0a8b3] focus:border-[#07545e] focus:bg-white focus:ring-2 focus:ring-[#07545e]/10"
                      placeholder="your@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!email || loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#06434b] text-sm font-semibold text-white shadow-md transition hover:bg-[#032f35] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Sending…</>
                  ) : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-5 border-t border-[#ede8de] pt-4 text-center">
                <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-[#64748b] hover:text-[#07545e] transition-colors">
                  <FiArrowLeft /> Back to Sign In
                </Link>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <FiCheckCircle className="text-2xl text-green-600" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-[#172554]">Check Your Email</h2>
              <p className="mb-6 text-sm text-[#64748b]">
                If an account exists for <strong>{email}</strong>, you'll receive a reset link shortly.
                Check your spam folder if you don't see it.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <FiArrowLeft /> Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

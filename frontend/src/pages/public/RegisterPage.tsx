
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiUser,
  FiLock,
  FiMail,
  FiPhone,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
} from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    getDashboardPath,
  } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: '', email: '', first_name: '', last_name: '',
    phone: '', password: '', password2: '',
  });

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getDashboardPath(), { replace: true });
    }
  }, []);
    if (isAuthenticated()) navigate(getDashboardPath(), { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { clearError(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof form, v: string) => {
    setForm((prev) => ({
      ...prev,
      [k]: v,
    }));
  };
  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (form.password !== form.password2) { toast.error('Passwords do not match.'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    try {
      await register({
        username: form.username, email: form.email,
        first_name: form.first_name, last_name: form.last_name,
        phone: form.phone, password: form.password, password2: form.password2,
      });

      toast.success(
        `Welcome to UpacharKhoj, ${form.first_name || form.username}!`
      );

      toast.success(`Welcome to UpacharKhoj, ${form.first_name || form.username}!`);
      navigate(getDashboardPath(), { replace: true });
    } catch {
      // Error is shown from the authentication store.
    }
    } catch { /* Error shown from store */ }
  };

  const passwordStrength = () => {
    const p = form.password;

    if (!p) return null;

    if (p.length < 6) {
      return {
        label: 'Too short',
        color: 'bg-red-500',
        text: 'text-red-500',
        width: 'w-1/4',
      };
    }

    if (p.length < 8) {
      return {
        label: 'Weak',
        color: 'bg-orange-400',
        text: 'text-orange-500',
        width: 'w-2/4',
      };
    }

    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) {
      return {
        label: 'Fair',
        color: 'bg-yellow-400',
        text: 'text-yellow-600',
        width: 'w-3/4',
      };
    }

    return {
      label: 'Strong',
      color: 'bg-green-500',
      text: 'text-green-600',
      width: 'w-full',
    };
    if (p.length < 6)  return { label: 'Too short', color: 'bg-red-500',    text: 'text-red-500',    width: 'w-1/4' };
    if (p.length < 8)  return { label: 'Weak',      color: 'bg-orange-400', text: 'text-orange-500', width: 'w-2/4' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p))
                       return { label: 'Fair',      color: 'bg-yellow-400', text: 'text-yellow-600', width: 'w-3/4' };
    return             { label: 'Strong',    color: 'bg-green-500',  text: 'text-green-600',  width: 'w-full' };
  };
  const strength = passwordStrength();

  const inputClass =
    'h-12 w-full rounded-full border border-[#e1e6e3] bg-white px-4 text-sm text-[#334155] outline-none transition placeholder:text-[#9ca8af] hover:border-[#b9cec8] focus:border-[#07545e] focus:ring-2 focus:ring-[#07545e]/10';

  const labelClass =
    'mb-2 block text-sm font-medium text-[#334155]';
  const inputCls = 'h-11 w-full rounded-full border border-[#e1e6e3] bg-white px-4 text-sm text-[#334155] outline-none transition placeholder:text-[#9ca8af] hover:border-[#b9cec8] focus:border-[#07545e] focus:ring-2 focus:ring-[#07545e]/10';
  const labelCls = 'mb-1.5 block text-sm font-medium text-[#334155]';

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#faf8f3] px-4 py-10 sm:px-6">

      {/* REGISTRATION CARD */}
      <div className="w-full max-w-[680px] overflow-hidden rounded-[28px] border border-[#e8e1d6] bg-white shadow-[0_16px_50px_rgba(30,50,45,0.07)]">
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#faf8f3] px-4 py-6 sm:py-10">
      <div className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-[#e8e1d6] bg-white shadow-[0_10px_35px_rgba(30,50,45,0.07)]">

        {/* HEADER */}
        <div className="border-b border-[#eee6db] bg-gradient-to-r from-[#f8f0df] via-[#faf8f2] to-[#eaf4f0] px-6 py-7 sm:px-9">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#07545e] shadow-sm">
              <GiHeartPlus className="text-2xl text-white" />
        {/* Header band */}
        <div className="border-b border-[#eee6db] bg-gradient-to-r from-[#f8f0df] via-[#faf8f2] to-[#eaf4f0] px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#07545e] shadow-sm">
              <GiHeartPlus className="text-xl text-white" />
            </div>
            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#08717a]">
                UpacharKhoj Nepal
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#172554]">
                Create your account
              </h1>

              <p className="mt-1 text-sm text-[#64748b]">
                A few details to get you started.
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#08717a]">UpacharKhoj Nepal</p>
              <h1 className="text-xl font-bold tracking-tight text-[#172554] sm:text-2xl">Create your account</h1>
              <p className="text-sm text-[#64748b]">A few details to get you started.</p>
            </div>

          </div>

        </div>

        {/* FORM CONTENT */}
        <div className="px-6 py-7 sm:px-9 sm:py-8">

          {/* SECTION HEADING */}
          <div className="mb-6">

            <h2 className="text-sm font-semibold text-[#07545e]">
              Your details
            </h2>

        {/* Form body */}
        <div className="px-5 py-5 sm:px-8 sm:py-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#07545e]">Your details</p>
            <p className="text-sm text-[#64748b]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#07545e] hover:underline">Sign in</Link>
            </p>
          </div>

          {/* REGISTRATION ERROR */}
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              <FiAlertCircle className="mt-0.5 shrink-0" />

              <span>{error}</span>

            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <FiAlertCircle className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {/* REGISTRATION FORM */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* FIRST NAME AND LAST NAME */}
            <div className="grid gap-4 sm:grid-cols-2">

              {/* FIRST NAME */}
            {/* Name row */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>

                <label
                  htmlFor="first_name"
                  className={labelClass}
                >
                  First Name
                </label>

                <input
                  id="first_name"
                  type="text"
                  className={inputClass}
                  placeholder="Rajan"
                  value={form.first_name}
                  onChange={(e) =>
                    set('first_name', e.target.value)
                  }
                  autoComplete="given-name"
                />

                <label htmlFor="first_name" className={labelCls}>First Name</label>
                <input id="first_name" type="text" className={inputCls} placeholder="Rajan"
                  value={form.first_name} onChange={e => set('first_name', e.target.value)} autoComplete="given-name" />
              </div>

              {/* LAST NAME */}
              <div>

                <label
                  htmlFor="last_name"
                  className={labelClass}
                >
                  Last Name
                </label>

                <input
                  id="last_name"
                  type="text"
                  className={inputClass}
                  placeholder="Sharma"
                  value={form.last_name}
                  onChange={(e) =>
                    set('last_name', e.target.value)
                  }
                  autoComplete="family-name"
                />

                <label htmlFor="last_name" className={labelCls}>Last Name</label>
                <input id="last_name" type="text" className={inputCls} placeholder="Sharma"
                  value={form.last_name} onChange={e => set('last_name', e.target.value)} autoComplete="family-name" />
              </div>

            </div>

            {/* USERNAME AND EMAIL */}
            <div className="grid gap-4 sm:grid-cols-2">

              {/* USERNAME */}
            {/* Username + email */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>

                <label
                  htmlFor="username"
                  className={labelClass}
                >
                  Username{' '}
                  <span className="text-red-500">*</span>
                </label>

                <label htmlFor="username" className={labelCls}>Username <span className="text-red-500">*</span></label>
                <div className="relative">

                  <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />

                  <input
                    id="username"
                    type="text"
                    className={`${inputClass} pl-11`}
                    placeholder="Choose a username"
                    value={form.username}
                    onChange={(e) =>
                      set('username', e.target.value)
                    }
                    required
                    autoComplete="username"
                    autoFocus
                  />

                  <FiUser className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input id="username" type="text" className={`${inputCls} pl-10`} placeholder="Choose a username"
                    value={form.username} onChange={e => set('username', e.target.value)}
                    required autoComplete="username" autoFocus />
                </div>

              </div>

              {/* EMAIL */}
              <div>

                <label
                  htmlFor="email"
                  className={labelClass}
                >
                  Email Address{' '}
                  <span className="text-red-500">*</span>
                </label>

                <label htmlFor="email" className={labelCls}>Email Address <span className="text-red-500">*</span></label>
                <div className="relative">

                  <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />

                  <input
                    id="email"
                    type="email"
                    className={`${inputClass} pl-11`}
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) =>
                      set('email', e.target.value)
                    }
                    required
                    autoComplete="email"
                  />

                  <FiMail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                  <input id="email" type="email" className={`${inputCls} pl-10`} placeholder="your@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)}
                    required autoComplete="email" />
                </div>

              </div>

            </div>

            {/* PHONE NUMBER */}
            <div>

              <label
                htmlFor="phone"
                className={labelClass}
              >
                Phone Number
              </label>

              <label htmlFor="phone" className={labelCls}>Phone Number</label>
              <div className="relative">

                <FiPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />

                <input
                  id="phone"
                  type="tel"
                  className={`${inputClass} pl-11`}
                  placeholder="98XXXXXXXX"
                  value={form.phone}
                  onChange={(e) =>
                    set('phone', e.target.value)
                  }
                  autoComplete="tel"
                />

                <FiPhone className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input id="phone" type="tel" className={`${inputCls} pl-10`} placeholder="98XXXXXXXX"
                  value={form.phone} onChange={e => set('phone', e.target.value)} autoComplete="tel" />
              </div>

            </div>

            {/* ACCOUNT SECURITY */}
            <div className="border-t border-[#eeeae2] pt-5">

              <h2 className="mb-4 text-sm font-semibold text-[#07545e]">
                Account security
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">

                {/* PASSWORD */}
            {/* Passwords */}
            <div className="border-t border-[#eeeae2] pt-4">
              <p className="mb-3 text-sm font-semibold text-[#07545e]">Account security</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>

                  <label
                    htmlFor="password"
                    className={labelClass}
                  >
                    Password{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <label htmlFor="password" className={labelCls}>Password <span className="text-red-500">*</span></label>
                  <div className="relative">

                    <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />

                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`${inputClass} pl-11 pr-11`}
                      placeholder="Min 8 characters"
                      value={form.password}
                      onChange={(e) =>
                        set('password', e.target.value)
                      }
                      required
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#07545e]"
                    >
                    <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input id="password" type={showPassword ? 'text' : 'password'}
                      className={`${inputCls} pl-10 pr-10`} placeholder="Min 8 characters"
                      value={form.password} onChange={e => set('password', e.target.value)}
                      required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#07545e]">
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>

                  </div>

                  {/* PASSWORD STRENGTH */}
                  {strength && (
                    <div className="mt-2">

                    <div className="mt-1.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#edf0ee]">

                        <div
                          className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`}
                        />

                      </div>

                      <p
                        className={`mt-1 text-xs ${strength.text}`}
                      >
                        {strength.label}
                      </p>

                    </div>
                  )}

                </div>

                {/* CONFIRM PASSWORD */}
                <div>

                  <label
                    htmlFor="password2"
                    className={labelClass}
                  >
                    Confirm Password{' '}
                    <span className="text-red-500">*</span>
                  </label>

                  <label htmlFor="password2" className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">

                    <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />

                    <input
                      id="password2"
                      type={showPassword ? 'text' : 'password'}
                      className={`${inputClass} pl-11 pr-11`}
                      placeholder="Repeat your password"
                      value={form.password2}
                      onChange={(e) =>
                        set('password2', e.target.value)
                      }
                      required
                      autoComplete="new-password"
                    />

                    <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                    <input id="password2" type={showPassword ? 'text' : 'password'}
                      className={`${inputCls} pl-10 pr-10`} placeholder="Repeat your password"
                      value={form.password2} onChange={e => set('password2', e.target.value)}
                      required autoComplete="new-password" />
                    {form.password2 && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2">

                        {form.password === form.password2 ? (
                          <FiCheckCircle className="text-green-500" />
                        ) : (
                          <FiAlertCircle className="text-red-400" />
                        )}

                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {form.password === form.password2
                          ? <FiCheckCircle className="text-green-500" />
                          : <FiAlertCircle className="text-red-400" />}
                      </span>
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* CREATE ACCOUNT BUTTON */}
            <button
              type="submit"
              disabled={
                isLoading ||
                !form.username ||
                !form.email ||
                !form.password ||
                !form.password2
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#06434b] text-sm font-semibold text-white shadow-[0_6px_16px_rgba(6,67,75,0.18)] transition hover:bg-[#032f35] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-100"
            >

              disabled={isLoading || !form.username || !form.email || !form.password || !form.password2}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#06434b] text-sm font-semibold text-white shadow-md transition hover:bg-[#032f35] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Creating account…</>
              ) : (
                <>Create Account <FiArrowRight /></>
              )}

            </button>

          </form>


          {/* SIGN IN SECTION - MOVED TO BOTTOM */}
          <div className="mt-6 border-t border-[#eee6db] pt-6 text-center">

            <p className="text-sm text-[#64748b]">
              Already have an account?{' '}

              <Link
                to="/login"
                className="inline-flex items-center gap-1 font-semibold text-[#07545e] transition-colors hover:text-[#08717a] hover:underline"
              >
                Sign in
                <FiArrowRight className="text-sm" />
              </Link>

            </p>

          </div>

          <p className="mt-4 text-center text-xs leading-5 text-[#94a3b8]">
            By registering you agree to use this platform for legitimate healthcare coordination.
          </p>
        </div>

      </div>

    </div>
  );
};

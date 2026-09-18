import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiShield, FiHome } from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

type PortalTab = 'admin' | 'hospital' | 'worker';

const TABS = [
  {
    key: 'admin' as PortalTab,
    label: 'Super Admin',
    title: 'Super Admin Portal',
    subtitle: 'System-wide administration',
    icon: <FiShield />,
    headerBg: 'bg-rose-600',
    activeBorder: 'border-rose-500',
    activeText: 'text-rose-600',
    btnClass: 'bg-rose-600 hover:bg-rose-700',
    demo: [{ label: 'System Admin', username: 'admin', password: 'Admin@123' }],
  },
  {
    key: 'hospital' as PortalTab,
    label: 'Hospital Admin',
    title: 'Hospital Admin Portal',
    subtitle: 'Manage your hospital',
    icon: <FiHome />,
    headerBg: 'bg-blue-600',
    activeBorder: 'border-blue-500',
    activeText: 'text-blue-600',
    btnClass: 'bg-blue-600 hover:bg-blue-700',
    demo: [
      { label: 'Hospital Admin', username: 'hospital1_admin', password: 'Admin@123' },
      { label: 'Hospital Staff', username: 'hospital1_staff', password: 'Staff@123' },
    ],
  },
  {
    key: 'worker' as PortalTab,
    label: 'Health Worker',
    title: 'Health Worker Portal',
    subtitle: 'Search & refer patients',
    icon: <FiUser />,
    headerBg: 'bg-primary-700',
    activeBorder: 'border-primary-600',
    activeText: 'text-primary-700',
    btnClass: 'bg-primary-700 hover:bg-primary-800',
    demo: [
      { label: 'Health Worker 1', username: 'hw1', password: 'HealthWorker@123' },
      { label: 'Health Worker 2', username: 'hw2', password: 'HealthWorker@123' },
    ],
  },
];

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PortalTab>('worker');
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
    setUsername('');
    setPassword('');
    clearError();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(username, password);
      toast.success(`Welcome back, ${username}!`);
      navigate(from || getDashboardPath(), { replace: true });
    } catch { /* error shown from store */ }
  };

  const fillDemo = (u: string, p: string) => { setUsername(u); setPassword(p); clearError(); };

  const tab = TABS.find((t) => t.key === activeTab)!;

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

        {/* Portal selector tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6 bg-white shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-1 text-xs font-medium transition-all border-b-2 ${
                activeTab === t.key
                  ? `${t.activeBorder} ${t.activeText} bg-gray-50`
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-sm">{t.icon}</span>
              <span className="hidden sm:block">{t.label}</span>
              <span className="sm:hidden text-[10px] leading-tight text-center">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Coloured header */}
          <div className={`${tab.headerBg} px-6 py-4 text-white flex items-center gap-3`}>
            <span className="text-2xl">{tab.icon}</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">{tab.title}</h1>
              <p className="text-xs opacity-75">{tab.subtitle}</p>
            </div>
          </div>

          <div className="p-6">
            {/* Demo accounts */}
            <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs font-semibold text-blue-700 mb-2">Demo accounts (click to fill):</p>
              <div className="flex flex-wrap gap-2">
                {tab.demo.map((d) => (
                  <button
                    key={d.username}
                    type="button"
                    onClick={() => fillDemo(d.username, d.password)}
                    className="text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="font-medium">{d.label}</div>
                    <div className="text-blue-400">{d.username}</div>
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
                <label htmlFor="login-username" className="label">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-username"
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
                <label htmlFor="login-password" className="label">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="login-password"
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
                className={`w-full btn btn-lg mt-2 text-white justify-center ${tab.btnClass}`}
                disabled={isLoading || !username || !password}
              >
                {isLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                ) : `Sign In`}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <Link to="/search" className="text-sm text-gray-500 hover:text-primary-700 transition-colors">
                Continue as public visitor → Search hospitals
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

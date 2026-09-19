
import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiSearch,
  FiAlertTriangle,
  FiMap,
  FiList,
  FiUser,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiArrowRight,
  FiHeart,
} from 'react-icons/fi';
import { GiHeartPlus } from 'react-icons/gi';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  {
    to: '/user/dashboard',
    label: 'Dashboard',
    icon: <FiHome />,
  },
  {
    to: '/user/hospitals',
    label: 'Find Hospitals',
    icon: <FiSearch />,
  },
  {
    to: '/user/emergency',
    label: 'Emergency',
    icon: <FiAlertTriangle />,
  },
  {
    to: '/user/map',
    label: 'Hospital Map',
    icon: <FiMap />,
  },
  {
    to: '/user/request-help',
    label: 'Request Help',
    icon: <FiPlus />,
  },
  {
    to: '/user/new-referral',
    label: 'Refer to Another',
    icon: <FiArrowRight />,
  },
  {
    to: '/user/referrals',
    label: 'My Requests',
    icon: <FiList />,
  },
  {
    to: '/user/profile',
    label: 'My Profile',
    icon: <FiUser />,
  },
];

export const UserLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const { user, logout } = useAuthStore();

  const location = useLocation();
  const navigate = useNavigate();

  const displayName =
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    'User';

  const firstName =
    user?.first_name ||
    displayName.split(' ')[0];

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join('');

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/');
    } catch {
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#faf8f3] overflow-hidden">

      {/* TOP NAVBAR */}
      <header className="flex-shrink-0 h-16 bg-white border-b border-[#e9e8e2] px-5 md:px-8 flex items-center justify-between z-20">

        {/* BRAND */}
        <Link
          to="/user/dashboard"
          className="flex items-center gap-3 group"
        >
          <div className="h-10 w-10 rounded-xl bg-[#0e6068] flex items-center justify-center shadow-sm group-hover:bg-[#0a4d54] transition-colors">
            <GiHeartPlus className="text-2xl text-white" />
          </div>

          <div className="hidden sm:block">
            <span className="text-xl font-bold tracking-tight text-[#173c40]">
              UpacharKhoj
            </span>
            <p className="text-[10px] tracking-widest uppercase text-[#899b98]">
              Healthcare made easier
            </p>
          </div>
        </Link>

        {/* RIGHT NAVBAR */}
        <div className="flex items-center gap-4">

          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-[#8b9996]">
                Welcome back
              </p>
              <p className="text-sm font-semibold text-[#173c40]">
                {firstName}
              </p>
            </div>

            <Link
              to="/user/profile"
              title="My Profile"
              className="h-10 w-10 rounded-full bg-[#e6f2ef] border border-[#d2e7e2] flex items-center justify-center text-sm font-bold text-[#0e6068] hover:bg-[#d5e9e4] transition-colors"
            >
              {initials}
            </Link>
          </div>

          <div className="h-7 w-px bg-[#e9e8e2] hidden sm:block" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-[#7d8b89] hover:text-[#bd604e] transition-colors rounded-xl px-3 py-2 hover:bg-[#fff0eb]"
            title="Logout"
          >
            <FiLogOut className="text-lg" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN BODY */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">

        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col flex-shrink-0 bg-white border-r border-[#e9e8e2] transition-all duration-300 ${
            collapsed ? 'w-[76px]' : 'w-[260px]'
          }`}
        >

          {/* USER PROFILE SECTION */}
          {!collapsed ? (
            <div className="px-4 pt-6 pb-5">

              <div className="rounded-2xl bg-gradient-to-br from-[#0e6068] to-[#16434a] p-4 relative overflow-hidden">

                {/* Decorative circles */}
                <div className="absolute -right-5 -top-7 w-24 h-24 rounded-full border border-white/10" />
                <div className="absolute -right-10 top-4 w-24 h-24 rounded-full border border-white/10" />

                <div className="relative z-10 flex items-center gap-3">

                  {/* AVATAR */}
                  <div className="h-12 w-12 flex-shrink-0 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-white text-lg font-bold">
                    {initials}
                  </div>

                  {/* USER INFORMATION */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-[#bfe1dc] mb-1">
                      Welcome back,
                    </p>

                    <h3 className="text-sm font-semibold text-white truncate">
                      {displayName}
                    </h3>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#9fdfbd]" />
                      <span className="text-[10px] text-[#c8e7de]">
                        Your healthcare space
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center pt-6 pb-5">
              <Link
                to="/user/profile"
                title={displayName}
                className="h-11 w-11 rounded-2xl bg-[#0e6068] flex items-center justify-center text-white text-sm font-bold shadow-sm"
              >
                {initials}
              </Link>
            </div>
          )}

          {/* NAVIGATION */}
          <nav className="flex-1 overflow-y-auto min-h-0 px-3 pb-4">

            {!collapsed && (
              <p className="px-3 mb-3 mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a2aca8]">
                Main Menu
              </p>
            )}

            <div className="space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      collapsed
                        ? 'justify-center px-2 py-3'
                        : 'px-3.5 py-3'
                    } ${
                      active
                        ? 'bg-[#e7f3f0] text-[#0e6068] shadow-sm'
                        : 'text-[#697d7c] hover:bg-[#f3f8f6] hover:text-[#0e6068]'
                    }`}
                  >

                    {/* ACTIVE INDICATOR */}
                    {active && !collapsed && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#0e6068]" />
                    )}

                    {/* ICON */}
                    <span
                      className={`flex-shrink-0 flex items-center justify-center text-[18px] ${
                        active
                          ? 'text-[#0e6068]'
                          : 'text-[#819795] group-hover:text-[#0e6068]'
                      }`}
                    >
                      {item.icon}
                    </span>

                    {/* LABEL */}
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">
                          {item.label}
                        </span>

                        {active && (
                          <FiChevronRight className="text-sm text-[#0e6068]" />
                        )}
                      </>
                    )}

                  </Link>
                );
              })}
            </div>
          </nav>

          {/* SIDEBAR BOTTOM */}
          {!collapsed && (
            <div className="px-4 pb-4">



              {/* LOGOUT */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-[#b96552] hover:bg-[#fff1ed] transition-colors"
              >
                <FiLogOut className="text-lg flex-shrink-0" />
                Logout
              </button>

            </div>
          )}

          {/* COLLAPSE BUTTON */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex-shrink-0 flex items-center justify-center h-11 border-t border-[#e9e8e2] text-[#91a3a0] hover:text-[#0e6068] hover:bg-[#f3f8f6] transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <FiChevronRight className="text-lg" />
            ) : (
              <FiChevronLeft className="text-lg" />
            )}
          </button>

        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
          <Outlet />
        </main>

      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden flex-shrink-0 fixed bottom-0 left-0 right-0 bg-white border-t border-[#e9e8e2] z-30 flex overflow-x-auto shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">

        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 py-3 px-3.5 text-[10px] font-medium transition-colors ${
                active
                  ? 'text-[#0e6068] bg-[#e7f3f0]'
                  : 'text-[#91a3a0] hover:text-[#0e6068]'
              }`}
            >
              <span className="text-xl">
                {item.icon}
              </span>

              <span className="leading-none whitespace-nowrap">
                {item.label.split(' ')[0]}
              </span>
            </Link>
          );
        })}

      </nav>

    </div>
  );
};
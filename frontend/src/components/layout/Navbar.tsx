import React, { useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  FiMenu,
  FiX,
  FiBell,
  FiLogOut,
  FiUser,
  FiUserPlus,
} from 'react-icons/fi';

import { GiHeartPlus } from 'react-icons/gi';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';


export const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    user,
    logout,
    isAuthenticated,
    getDashboardPath,
  } = useAuthStore();

  const { unreadCount } =
    useNotificationStore();

  const navigate = useNavigate();
  const location = useLocation();


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    await logout();

    toast.success(
      'Logged out successfully'
    );

    navigate('/');

    setMenuOpen(false);
  };


  /* =========================================================
     NAVIGATION LINKS
  ========================================================= */

  const navLinks = [
    {
      to: '/',
      label: 'Find Hospital',
    },
    {
      to: '/about',
      label: 'About',
    },

    ...(isAuthenticated()
      ? [
        {
          to: getDashboardPath(),
          label: 'Dashboard',
        },
      ]
      : []),
  ];


  /* =========================================================
     ACTIVE LINK
  ========================================================= */

  const isActive = (
    path: string
  ) => {
    if (path === '/') {
      return (
        location.pathname === '/' ||
        location.pathname === '/search'
      );
    }

    return location.pathname.startsWith(
      path
    );
  };


  return (
    <header className="border-b border-gray-100 bg-white shadow-sm">

      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        <div className="flex h-16 items-center justify-between">  


          {/* =================================================
              LOGO
          ================================================= */}

          <Link
            to="/"
            className="
              flex
              flex-shrink-0
              items-center
              gap-2
            "
          >
            <GiHeartPlus
              className="
                text-2xl
                text-primary-700
              "
            />

            <div>
              <span
                className="
                  block
                  text-lg
                  font-bold
                  leading-tight
                  text-primary-800
                "
              >
                UpacharKhoj
              </span>

              <span
                className="
                  hidden
                  text-xs
                  leading-tight
                  text-gray-500
                  sm:block
                "
              >
                Nepal
              </span>
            </div>
          </Link>


          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav
            className="
              hidden
              items-center
              gap-8
              md:flex
            "
          >
            {navLinks.map(
              (link) => (

                <Link
                  key={link.to}
                  to={link.to}
                  className={`
                    text-sm
                    font-medium
                    transition-colors

                    ${isActive(
                    link.to
                  )
                      ? 'text-primary-700'
                      : 'text-gray-600 hover:text-primary-700'
                    }
                  `}
                >
                  {link.label}
                </Link>

              )
            )}
          </nav>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            {isAuthenticated() ? (

              <>

                {/* Notifications */}

                <button
                  type="button"
                  className="
                    relative
                    rounded-lg
                    p-2
                    text-gray-500
                    transition-colors
                    hover:bg-primary-50
                    hover:text-primary-700
                  "
                  aria-label="Notifications"
                >
                  <FiBell />

                  {unreadCount() > 0 && (

                    <span
                      className="
                        absolute
                        right-1
                        top-1
                        flex
                        h-4
                        w-4
                        items-center
                        justify-center
                        rounded-full
                        bg-red-500
                        text-[10px]
                        text-white
                      "
                    >
                      {unreadCount() > 9
                        ? '9+'
                        : unreadCount()}
                    </span>

                  )}
                </button>


                {/* USER INFORMATION */}

                <div
                  className="
                    hidden
                    items-center
                    gap-2
                    md:flex
                  "
                >

                  <Link
                    to={
                      getDashboardPath()
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      rounded-lg
                      px-3
                      py-1.5
                      text-sm
                      text-gray-700
                      transition-colors
                      hover:bg-gray-100
                    "
                  >

                    <div
                      className="
                        flex
                        h-7
                        w-7
                        items-center
                        justify-center
                        rounded-full
                        bg-primary-100
                        text-xs
                        font-semibold
                        text-primary-700
                      "
                    >
                      {user?.username
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>


                    <div
                      className="
                        hidden
                        text-left
                        lg:block
                      "
                    >

                      <div
                        className="
                          max-w-[120px]
                          truncate
                          text-sm
                          font-medium
                          leading-tight
                          text-gray-800
                        "
                      >
                        {user?.first_name ||
                          user?.username}
                      </div>


                      <div
                        className="
                          text-xs
                          capitalize
                          leading-tight
                          text-gray-400
                        "
                      >
                        {user?.role_display ||
                          user?.role?.replace(
                            /_/g,
                            ' '
                          )}
                      </div>

                    </div>

                  </Link>


                  {/* Logout */}

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="
                      rounded-lg
                      p-2
                      text-gray-500
                      transition-colors
                      hover:bg-red-50
                      hover:text-red-600
                    "
                    aria-label="Sign out"
                    title="Sign out"
                  >
                    <FiLogOut />
                  </button>

                </div>

              </>

            ) : (

              /* LOGIN + SIGN UP */

              <div
                className="
                  hidden
                  items-center
                  gap-2
                  md:flex
                "
              >

                <Link
                  to="/login"
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-gray-700
                    transition-colors
                    hover:bg-gray-50
                  "
                >
                  <FiUser />

                  Login
                </Link>


                <Link
                  to="/register"
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-lg
                    bg-primary-700
                    px-4
                    py-2
                    text-sm
                    font-medium
                    text-white
                    transition-colors
                    hover:bg-primary-800
                  "
                >
                  <FiUserPlus />

                  Sign Up
                </Link>

              </div>

            )}


            {/* =================================================
                MOBILE MENU BUTTON
            ================================================= */}

            <button
              type="button"
              className="
                rounded-lg
                p-2
                text-gray-600
                hover:bg-gray-100
                md:hidden
              "
              onClick={() =>
                setMenuOpen(
                  !menuOpen
                )
              }
              aria-label="Toggle menu"
            >
              {menuOpen
                ? <FiX />
                : <FiMenu />}
            </button>

          </div>

        </div>


        {/* =====================================================
            MOBILE MENU
        ===================================================== */}

        {menuOpen && (

          <div
            className="
              space-y-1
              border-t
              border-gray-100
              py-3
              md:hidden
            "
          >

            {navLinks.map(
              (link) => (

                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className={`
                    block
                    rounded-lg
                    px-3
                    py-2
                    text-sm
                    font-medium
                    transition-colors

                    ${isActive(
                    link.to
                  )
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-primary-50 hover:text-primary-700'
                    }
                  `}
                >
                  {link.label}
                </Link>

              )
            )}


            {isAuthenticated() ? (

              <>

                {/* MOBILE USER */}

                <div
                  className="
                    mt-2
                    border-t
                    border-gray-100
                    px-3
                    py-3
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-full
                        bg-primary-100
                        text-xs
                        font-bold
                        text-primary-700
                      "
                    >
                      {user?.username
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>


                    <div>

                      <div
                        className="
                          text-sm
                          font-medium
                          text-gray-800
                        "
                      >
                        {user?.first_name ||
                          user?.username}
                      </div>


                      <div
                        className="
                          text-xs
                          capitalize
                          text-gray-400
                        "
                      >
                        {user?.role_display ||
                          user?.role?.replace(
                            /_/g,
                            ' '
                          )}
                      </div>

                    </div>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="
                    flex
                    w-full
                    items-center
                    gap-2
                    rounded-lg
                    px-3
                    py-2
                    text-left
                    text-sm
                    text-red-600
                    hover:bg-red-50
                  "
                >
                  <FiLogOut />

                  Sign Out
                </button>

              </>

            ) : (

              /* MOBILE LOGIN */

              <div
                className="
                  mt-2
                  space-y-1
                  border-t
                  border-gray-100
                  pt-2
                "
              >

                <Link
                  to="/login"
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-gray-700
                    hover:bg-gray-100
                  "
                >
                  <FiUser />

                  Login
                </Link>


                <Link
                  to="/register"
                  onClick={() =>
                    setMenuOpen(
                      false
                    )
                  }
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-primary-700
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-white
                    hover:bg-primary-800
                  "
                >
                  <FiUserPlus />

                  Sign Up
                </Link>

              </div>

            )}

          </div>

        )}

      </div>

    </header>
  );
};
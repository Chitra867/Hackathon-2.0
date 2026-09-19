import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  FiHome,
  FiUsers,
  FiFileText,
  FiSettings,
  FiCheckCircle,
  FiAlertCircle,
  FiLogIn,
  FiLogOut,
  FiActivity,
  FiRefreshCw,
} from 'react-icons/fi';

import toast from 'react-hot-toast';

import {
  format,
  isValid,
} from 'date-fns';

import {
  hospitalsApi,
  usersApi,
  auditApi,
} from '../../lib/api';

import type { AuditLog } from '../../types';

import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// --------------------------------------------------
// TYPES
// --------------------------------------------------

interface DashboardStats {
  totalHospitals: number | null;
  activeHospitals: number | null;
  pendingHospitals: number | null;
  totalUsers: number | null;
}

interface DashboardErrors {
  hospitals: boolean;
  activeHospitals: boolean;
  pendingHospitals: boolean;
  users: boolean;
  activity: boolean;
}

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const INITIAL_STATS: DashboardStats = {
  totalHospitals: null,
  activeHospitals: null,
  pendingHospitals: null,
  totalUsers: null,
};

const INITIAL_ERRORS: DashboardErrors = {
  hospitals: false,
  activeHospitals: false,
  pendingHospitals: false,
  users: false,
  activity: false,
};

const ACTIVITY_PAGE_SIZE = 8;

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

const safeText = (value: unknown): string => {
  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value);
  }

  return '';
};

// --------------------------------------------------
// EXTRACT API COUNT
// --------------------------------------------------

const extractCount = (
  data: unknown,
): number => {
  // Handle an API returning a complete array.

  if (Array.isArray(data)) {
    return data.length;
  }

  // Handle a standard Django REST Framework
  // paginated response.

  if (
    data !== null &&
    typeof data === 'object' &&
    'results' in data
  ) {
    const response = data as {
      count?: unknown;
      results?: unknown;
    };

    if (
      typeof response.count === 'number' &&
      Number.isSafeInteger(response.count) &&
      response.count >= 0
    ) {
      return response.count;
    }
  }

  throw new Error(
    'The API did not return a valid total count.',
  );
};

// --------------------------------------------------
// EXTRACT API RESULTS
// --------------------------------------------------

const extractResults = <T,>(
  data: unknown,
): T[] => {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data !== null &&
    typeof data === 'object' &&
    'results' in data
  ) {
    const response = data as {
      results?: unknown;
    };

    if (Array.isArray(response.results)) {
      return response.results as T[];
    }
  }

  throw new Error(
    'Invalid API response: expected a results array.',
  );
};

// --------------------------------------------------
// SAFE DATE FORMAT
// --------------------------------------------------

const formatActivityDate = (
  value: unknown,
): string => {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    return 'Date unavailable';
  }

  const date = new Date(value);

  if (!isValid(date)) {
    return 'Date unavailable';
  }

  try {
    return format(
      date,
      'MMM d, yyyy HH:mm',
    );
  } catch {
    return 'Date unavailable';
  }
};

// --------------------------------------------------
// ACTIVITY DATE FOR SORTING
// --------------------------------------------------

const getActivityTimestamp = (
  value: unknown,
): number => {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    return 0;
  }

  const timestamp = new Date(
    value,
  ).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
};

// --------------------------------------------------
// ACTIVITY ICON STYLES
// --------------------------------------------------

const getActivityStyle = (
  log: AuditLog,
) => {
  const actionCode = safeText(
    (log as AuditLog & { action?: string }).action,
  );

  const actionDisplay = safeText(
    log.action_display,
  );

  const action = (
    actionCode ||
    actionDisplay
  ).toLowerCase();

  if (
    action.includes('logout') ||
    action.includes('log_out')
  ) {
    return {
      icon: <FiLogOut />,
      bg: 'bg-[#f1e4cf]',
      color: 'text-[#a9702f]',
    };
  }

  if (
    action.includes('login') ||
    action.includes('log_in')
  ) {
    return {
      icon: <FiLogIn />,
      bg: 'bg-[#e4ead3]',
      color: 'text-[#5c7a3a]',
    };
  }

  if (
    action.includes('hospital') ||
    action.includes('verification')
  ) {
    return {
      icon: <FiHome />,
      bg: 'bg-[#f6e3c4]',
      color: 'text-[#b9761e]',
    };
  }

  return {
    icon: <FiActivity />,
    bg: 'bg-[#ebdcec]',
    color: 'text-[#7a4f85]',
  };
};

// --------------------------------------------------
// ADMIN DASHBOARD
// --------------------------------------------------

export const AdminDashboard: React.FC = () => {
  // ------------------------------------------------
  // STATE
  // ------------------------------------------------

  const [stats, setStats] = useState<DashboardStats>(
    INITIAL_STATS,
  );

  const [
    recentActivity,
    setRecentActivity,
  ] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [errors, setErrors] = useState<DashboardErrors>(
    INITIAL_ERRORS,
  );

  // ------------------------------------------------
  // REFRESH DASHBOARD
  // ------------------------------------------------

  const refreshDashboard = useCallback(() => {
    setRefreshKey(
      (previous) => previous + 1,
    );
  }, []);

  // ------------------------------------------------
  // LOAD DASHBOARD DATA
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);

      setRefreshing(refreshKey > 0);

      setErrors(INITIAL_ERRORS);

      try {
        /*
         * Request counts directly from the backend.
         *
         * This avoids calculating statistics from
         * only the first 100 hospital records.
         *
         * Hospital filtering uses the existing
         * Django API parameters:
         *
         * is_active
         * verification_status
         */

        const results = await Promise.allSettled([
          // Total hospitals

          hospitalsApi.list({
            page_size: 1,
          }),

          // Active hospitals

          hospitalsApi.list({
            is_active: 'true',
            page_size: 1,
          }),

          // Pending hospital verification

          hospitalsApi.list({
            verification_status: 'pending',
            page_size: 1,
          }),

          // Total registered users

          usersApi.list({
            page_size: 1,
          }),

          // Recent system activity

          auditApi.list({
            page_size: ACTIVITY_PAGE_SIZE,
            ordering: '-created_at',
          }),
        ]);

        if (cancelled) {
          return;
        }

        const [
          hospitalsResult,
          activeResult,
          pendingResult,
          usersResult,
          auditResult,
        ] = results;

        // ----------------------------------------
        // BUILD DASHBOARD STATISTICS
        // ----------------------------------------

        const updatedStats: DashboardStats = {
          ...INITIAL_STATS,
        };

        const updatedErrors: DashboardErrors = {
          ...INITIAL_ERRORS,
        };

        // Total hospitals

        if (
          hospitalsResult.status === 'fulfilled'
        ) {
          try {
            updatedStats.totalHospitals = extractCount(
              hospitalsResult.value.data,
            );
          } catch (error) {
            console.error(
              'Invalid total hospitals response:',
              error,
            );

            updatedErrors.hospitals = true;
          }
        } else {
          console.error(
            'Failed to load total hospitals:',
            hospitalsResult.reason,
          );

          updatedErrors.hospitals = true;
        }

        // Active hospitals

        if (
          activeResult.status === 'fulfilled'
        ) {
          try {
            updatedStats.activeHospitals = extractCount(
              activeResult.value.data,
            );
          } catch (error) {
            console.error(
              'Invalid active hospitals response:',
              error,
            );

            updatedErrors.activeHospitals = true;
          }
        } else {
          console.error(
            'Failed to load active hospitals:',
            activeResult.reason,
          );

          updatedErrors.activeHospitals = true;
        }

        // Pending hospitals

        if (
          pendingResult.status === 'fulfilled'
        ) {
          try {
            updatedStats.pendingHospitals = extractCount(
              pendingResult.value.data,
            );
          } catch (error) {
            console.error(
              'Invalid pending hospitals response:',
              error,
            );

            updatedErrors.pendingHospitals = true;
          }
        } else {
          console.error(
            'Failed to load pending hospitals:',
            pendingResult.reason,
          );

          updatedErrors.pendingHospitals = true;
        }

        // Total users

        if (
          usersResult.status === 'fulfilled'
        ) {
          try {
            updatedStats.totalUsers = extractCount(
              usersResult.value.data,
            );
          } catch (error) {
            console.error(
              'Invalid total users response:',
              error,
            );

            updatedErrors.users = true;
          }
        } else {
          console.error(
            'Failed to load total users:',
            usersResult.reason,
          );

          updatedErrors.users = true;
        }

        // ----------------------------------------
        // RECENT ACTIVITY
        // ----------------------------------------

        let updatedActivity: AuditLog[] = [];

        if (
          auditResult.status === 'fulfilled'
        ) {
          try {
            const activity = extractResults<AuditLog>(
              auditResult.value.data,
            );

            updatedActivity = [...activity]
              .sort(
                (a, b) =>
                  getActivityTimestamp(
                    b.created_at,
                  ) -
                  getActivityTimestamp(
                    a.created_at,
                  ),
              )
              .slice(
                0,
                ACTIVITY_PAGE_SIZE,
              );
          } catch (error) {
            console.error(
              'Invalid audit activity response:',
              error,
            );

            updatedErrors.activity = true;
          }
        } else {
          console.error(
            'Failed to load audit activity:',
            auditResult.reason,
          );

          updatedErrors.activity = true;
        }

        // ----------------------------------------
        // UPDATE STATE
        // ----------------------------------------

        if (cancelled) {
          return;
        }

        setStats(updatedStats);

        setRecentActivity(updatedActivity);

        setErrors(updatedErrors);

        const hasErrors = Object.values(
          updatedErrors,
        ).some(Boolean);

        if (hasErrors) {
          toast.error(
            'Some dashboard information could not be loaded.',
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          'Failed to load dashboard:',
          error,
        );

        setStats(INITIAL_STATS);

        setRecentActivity([]);

        setErrors({
          hospitals: true,
          activeHospitals: true,
          pendingHospitals: true,
          users: true,
          activity: true,
        });

        toast.error(
          'Unable to load dashboard information.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);

          setRefreshing(false);
        }
      }
    };

    void fetchDashboardData();

    // Prevent outdated responses from updating
    // the dashboard after the effect is cleaned up.

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // ------------------------------------------------
  // STATISTIC CARDS
  // ------------------------------------------------

  const statCards = [
    {
      label: 'Total Hospitals',
      value: stats.totalHospitals,
      icon: <FiHome />,
      bg: 'bg-[#f1e4cf]',
      ring: 'ring-[#e2cda3]',
      color: 'text-[#8b5a2b]',
      link: '/admin/hospitals',
      error: errors.hospitals,
    },

    {
      label: 'Active Hospitals',
      value: stats.activeHospitals,
      icon: <FiCheckCircle />,
      bg: 'bg-[#e4ead3]',
      ring: 'ring-[#c9d6a8]',
      color: 'text-[#5c7a3a]',
      link: '/admin/hospitals',
      error: errors.activeHospitals,
    },

    {
      label: 'Pending Verification',
      value: stats.pendingHospitals,
      icon: <FiAlertCircle />,
      bg: 'bg-[#f6e3c4]',
      ring: 'ring-[#ecc98a]',
      color: 'text-[#b9761e]',
      link: '/admin/hospitals',
      error: errors.pendingHospitals,
    },

    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: <FiUsers />,
      bg: 'bg-[#ebdcec]',
      ring: 'ring-[#d5b9d8]',
      color: 'text-[#7a4f85]',
      link: '/admin/hospital-admins',
      error: errors.users,
    },
  ];

  // ------------------------------------------------
  // QUICK ACTIONS
  // ------------------------------------------------

  const quickLinks = [
    {
      to: '/admin/hospitals/new',
      icon: <FiHome />,
      label: 'Add Hospital',
      desc: 'Register a new facility',
    },

    {
      to: '/admin/hospital-admins',
      icon: <FiUsers />,
      label: 'Manage Admins',
      desc: 'Assign hospital administrators',
    },

    {
      to: '/admin/services',
      icon: <FiSettings />,
      label: 'Services',
      desc: 'Manage medical service types',
    },

    {
      to: '/admin/reports',
      icon: <FiFileText />,
      label: 'Reports',
      desc: 'View referral statistics',
    },
  ];

  // ------------------------------------------------
  // ERROR STATE
  // ------------------------------------------------

  const hasAnyError = Object.values(
    errors,
  ).some(Boolean);

  // ------------------------------------------------
  // LOADING STATE
  // ------------------------------------------------

  if (loading && refreshKey === 0) {
    return (
      <LoadingSpinner
        text="Loading admin dashboard..."
      />
    );
  }

  // ------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------

  return (
    <div className="min-h-full bg-[#faf6ee] -m-4 p-4 md:-m-6 md:p-6">

      {/* ------------------------------------------
          PAGE HEADER
      ------------------------------------------ */}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">

        <div>
          <h1 className="page-title text-[#3d2f1c]">
            Super Admin Dashboard
          </h1>

          <p className="text-sm text-[#8a7a63]">
            System-wide overview of UpacharKhoj Nepal
          </p>
        </div>

        {/* REFRESH BUTTON */}

        <button
          type="button"
          onClick={refreshDashboard}
          disabled={loading || refreshing}
          className="btn-secondary btn-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw
            className={
              loading || refreshing
                ? 'animate-spin'
                : ''
            }
          />

          {loading || refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>

      </div>

      {/* ------------------------------------------
          API ERROR WARNING
      ------------------------------------------ */}

      {hasAnyError && !loading && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
        >

          <div className="flex items-center gap-2">

            <FiAlertCircle className="text-amber-600" />

            <p className="text-sm text-amber-800">
              Some dashboard information could not be
              loaded. Unavailable values are shown as —.
            </p>

          </div>

          <button
            type="button"
            onClick={refreshDashboard}
            className="btn-secondary btn-sm text-xs"
          >
            Try Again
          </button>

        </div>
      )}

      {/* ------------------------------------------
          STATISTIC CARDS
      ------------------------------------------ */}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

        {statCards.map((stat) => (

          <Link
            key={stat.label}
            to={stat.link}
            className="stat-card border border-[#ede0ce] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d9c39e] hover:shadow-lg"
          >

            {/* STAT ICON */}

            <div
              className={`stat-icon ${stat.bg} ring-1 ${stat.ring}`}
            >
              <span
                className={`text-xl ${stat.color}`}
              >
                {stat.icon}
              </span>
            </div>

            {/* STAT VALUE */}

            <div>

              <div className="text-2xl font-bold text-[#3d2f1c]">
                {stat.value !== null
                  ? stat.value
                  : '—'}
              </div>

              <div className="text-xs text-[#8a7a63]">
                {stat.label}
              </div>

              {stat.error && (
                <p className="mt-1 text-xs text-red-600">
                  Unable to load
                </p>
              )}

            </div>

          </Link>

        ))}

      </div>

      {/* ------------------------------------------
          ACTIVITY AND QUICK ACTIONS
      ------------------------------------------ */}

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ----------------------------------------
            RECENT SYSTEM ACTIVITY
        ---------------------------------------- */}

        <div className="card border border-[#ede0ce] bg-white">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="section-title m-0 text-[#3d2f1c]">
              Recent System Activity
            </h2>

            <button
              type="button"
              onClick={refreshDashboard}
              disabled={loading}
              className="text-sm font-medium text-[#8b5a2b] hover:text-[#6b4520] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh
            </button>

          </div>

          {/* ACTIVITY ERROR */}

          {errors.activity ? (

            <div className="py-8 text-center">

              <p className="mb-3 text-sm text-red-600">
                Unable to load recent activity.
              </p>

              <button
                type="button"
                onClick={refreshDashboard}
                disabled={loading}
                className="btn-secondary btn-sm disabled:opacity-50"
              >
                Try Again
              </button>

            </div>

          ) : recentActivity.length === 0 ? (

            /* EMPTY ACTIVITY */

            <p className="py-8 text-center text-sm text-[#8a7a63]">
              No activity recorded yet.
            </p>

          ) : (

            /* ACTIVITY LIST */

            <ul className="divide-y divide-[#f2e9d9]">

              {recentActivity.map((log) => {

                const style =
                  getActivityStyle(log);

                const description =
                  safeText(log.description) ||
                  'System activity recorded';

                const actionLabel =
                  safeText(log.action_display) ||
                  'Activity';

                return (

                  <li
                    key={log.id}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >

                    {/* ACTIVITY ICON */}

                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${style.bg} ${style.color}`}
                    >
                      <span className="text-sm">
                        {style.icon}
                      </span>
                    </div>

                    {/* ACTIVITY DETAILS */}

                    <div className="min-w-0 flex-1">

                      <p
                        className="truncate text-sm text-[#3d2f1c]"
                        title={description}
                      >
                        {description}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5">

                        {/* DATE */}

                        <span className="text-xs text-[#a89a82]">
                          {formatActivityDate(
                            log.created_at,
                          )}
                        </span>

                        <span className="text-[#d9c9ac]">
                          ·
                        </span>

                        {/* ACTION */}

                        <span
                          className={`text-xs font-medium ${style.color}`}
                        >
                          {actionLabel}
                        </span>

                      </div>

                    </div>

                  </li>

                );
              })}

            </ul>

          )}

        </div>

        {/* ----------------------------------------
            QUICK ACTIONS
        ---------------------------------------- */}

        <div className="card border border-[#ede0ce] bg-white">

          <h2 className="section-title text-[#3d2f1c]">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-3">

            {quickLinks.map((link) => (

              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 rounded-lg border border-[#ede0ce] p-3 transition-colors hover:border-[#d9c39e] hover:bg-[#faf1e0]"
              >

                {/* QUICK ACTION ICON */}

                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#f1e4cf] text-[#8b5a2b]">
                  {link.icon}
                </div>

                {/* QUICK ACTION TEXT */}

                <div className="min-w-0">

                  <div className="text-sm font-semibold text-[#3d2f1c]">
                    {link.label}
                  </div>

                  <div className="text-xs text-[#8a7a63]">
                    {link.desc}
                  </div>

                </div>

              </Link>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
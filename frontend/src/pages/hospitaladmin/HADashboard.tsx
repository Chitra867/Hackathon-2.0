import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity,
  FiList,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
} from 'react-icons/fi';

import { availabilityApi, referralsApi } from '../../lib/api';
import type { Availability, Referral, User } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { useAuthStore } from '../../store/authStore';

type DashboardUser = User & {
  hospital_detail?: { name: string } | null;
};

type DashboardAvailability = Availability & {
  service_detail?: { name: string } | null;
};

type DashboardReferral = Referral & {
  referring_facility_detail?: { name: string } | null;
};

const timestamp = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Fetch every availability page instead of assuming page_size is supported.
async function loadAvailability(
  hospitalId: number,
  isCurrent: () => boolean,
): Promise<DashboardAvailability[]> {
  const records = new Map<number, DashboardAvailability>();
  let page = 1;

  while (isCurrent()) {
    const response = await availabilityApi.list({
      hospital: hospitalId,
      is_active: 'true',
      ordering: '-updated_at',
      page,
    });

    if (!isCurrent()) return [];

    const previousSize = records.size;

    for (const record of response.data.results) {
      records.set(record.id, record);
    }

    if (!response.data.next) break;

    if (records.size === previousSize) {
      throw new Error('Availability pagination did not advance.');
    }

    page += 1;
  }

  return [...records.values()]
    .filter(
      (record) => record.is_active && record.hospital === hospitalId,
    )
    .sort(
      (a, b) => timestamp(b.updated_at) - timestamp(a.updated_at),
    );
}

export const HADashboard: React.FC = () => {
  const { user } = useAuthStore();
  const account = user as DashboardUser | null;
  const hospitalId = user?.hospital ?? null;

  const [availability, setAvailability] = useState<
    DashboardAvailability[]
  >([]);
  const [referrals, setReferrals] = useState<DashboardReferral[]>([]);
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [availabilityFailed, setAvailabilityFailed] = useState(false);
  const [referralsFailed, setReferralsFailed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let current = true;

    setAvailability([]);
    setReferrals([]);
    setPendingCount(null);
    setErrors([]);
    setAvailabilityFailed(false);
    setReferralsFailed(false);

    if (hospitalId === null) {
      setLoading(false);

      return () => {
        current = false;
      };
    }

    setLoading(true);

    const load = async () => {
      const [availabilityResult, referralsResult, pendingResult] =
        await Promise.allSettled([
          loadAvailability(hospitalId, () => current),

          referralsApi.list({
            destination_facility: hospitalId,
            ordering: '-created_at',
            page: 1,
          }),

          referralsApi.list({
            destination_facility: hospitalId,
            status: 'pending',
            page: 1,
          }),
        ]);

      // Ignore responses after unmounting or changing hospitals.
      if (!current) return;

      const messages: string[] = [];

      if (availabilityResult.status === 'fulfilled') {
        setAvailability(availabilityResult.value);
      } else {
        setAvailabilityFailed(true);
        messages.push('Could not load hospital availability.');
      }

      if (referralsResult.status === 'fulfilled') {
        setReferrals(
          referralsResult.value.data.results
            .filter(
              (record) => record.destination_facility === hospitalId,
            )
            .sort(
              (a, b) =>
                timestamp(b.created_at) - timestamp(a.created_at),
            )
            .slice(0, 5),
        );
      } else {
        setReferralsFailed(true);
        messages.push('Could not load recent referrals.');
      }

      if (pendingResult.status === 'fulfilled') {
        // The API count includes matching referrals across all pages.
        setPendingCount(pendingResult.value.data.count);
      } else {
        messages.push('Could not load the pending referral total.');
      }

      setErrors(messages);
      setLoading(false);
    };

    void load();

    return () => {
      current = false;
    };
  }, [hospitalId, reloadKey]);

  if (!user) {
    return (
      <div className="card" role="status">
        Account information is unavailable.{' '}
        <Link to="/login" className="text-primary-700 underline">
          Sign in again
        </Link>
        .
      </div>
    );
  }

  if (hospitalId === null) {
    return (
      <div className="card" role="status">
        <h1 className="page-title">No hospital assigned</h1>
        <p className="text-gray-600">
          Ask your system administrator to assign your account to a
          hospital.
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Loading dashboard…" />;
  }

  const hospitalName =
    account?.hospital_detail?.name ||
    user.hospital_name ||
    `Hospital #${hospitalId}`;

  // Records are sorted newest first.
  const bedRecord = availability.find(
    (record) => record.availability_type === 'bed',
  );

  const icuRecord = availability.find(
    (record) => record.availability_type === 'icu',
  );

  const availableResources = availability.filter(
    (record) =>
      record.status === 'available' || record.status === 'limited',
  ).length;

  const stats = [
    {
      label: 'Available Beds',
      value: bedRecord?.available_count ?? '—',
      sub: availabilityFailed
        ? 'Could not load'
        : bedRecord
          ? `of ${bedRecord.total_count ?? '?'} total`
          : 'Not reported',
      icon: <FiActivity />,
      bg: 'bg-blue-100',
      color: 'text-blue-600',
    },
    {
      label: 'ICU Available',
      value: icuRecord?.available_count ?? '—',
      sub: availabilityFailed
        ? 'Could not load'
        : icuRecord
          ? `Status: ${icuRecord.status}`
          : 'Not reported',
      icon: <FiAlertCircle />,
      bg: 'bg-red-100',
      color: 'text-red-600',
    },
    {
      label: 'Pending Referrals',
      value: pendingCount ?? '—',
      sub:
        pendingCount === null ? 'Could not load' : 'Awaiting response',
      icon: <FiClock />,
      bg: 'bg-yellow-100',
      color: 'text-yellow-600',
    },
    {
      label: 'Available/Limited Resources',
      value: availabilityFailed ? '—' : availableResources,
      sub: availabilityFailed
        ? 'Could not load'
        : 'Active availability records',
      icon: <FiCheckCircle />,
      bg: 'bg-green-100',
      color: 'text-green-600',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Hospital Admin Dashboard</h1>
          <p className="text-sm text-gray-500">
            {hospitalName} — Welcome back,{' '}
            <strong>{user.full_name || user.username}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          <FiRefreshCw aria-hidden="true" />
          {errors.length ? 'Retry' : 'Refresh'}
        </button>
      </div>

      {/* Request errors */}
      {errors.length > 0 && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
          <p className="mt-1">Select Retry to try again.</p>
        </div>
      )}

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`stat-icon shrink-0 ${stat.bg}`}>
              <span
                className={`text-xl ${stat.color}`}
                aria-hidden="true"
              >
                {stat.icon}
              </span>
            </div>

            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-gray-600">
                {stat.label}
              </div>
              <div className="text-xs text-gray-500">
                {stat.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resource status */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="section-title m-0">Resource Status</h2>
            <Link
              to="/hadmin/availability"
              className="text-sm text-primary-700 hover:underline"
            >
              Update
            </Link>
          </div>

          {availabilityFailed ? (
            <p className="py-4 text-sm text-red-700">
              Availability could not be loaded.
            </p>
          ) : availability.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">
              No active availability records.{' '}
              <Link
                to="/hadmin/availability"
                className="text-primary-700 underline"
              >
                Add availability
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {availability.slice(0, 8).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700">
                      {record.service_detail?.name ||
                        record.service_name ||
                        record.availability_type_display ||
                        record.availability_type}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Updated:{' '}
                      {timestamp(record.updated_at)
                        ? new Date(record.updated_at).toLocaleString()
                        : 'Not reported'}
                    </p>

                    {(record.freshness_label === 'old' ||
                      record.freshness_label === 'stale') && (
                      <p className="text-xs text-amber-700">
                        Needs a fresh update
                      </p>
                    )}
                  </div>

                  <span className="shrink-0">
                    <StatusBadge status={record.status} size="sm" />
                  </span>
                </div>
              ))}
            </div>
          )}

          {availability.length > 8 && (
            <Link
              to="/hadmin/availability"
              className="mt-4 inline-block text-sm text-primary-700 hover:underline"
            >
              View all {availability.length} records
            </Link>
          )}
        </div>

        {/* Recent referrals */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="section-title m-0">
              Recent Incoming Referrals
            </h2>
            <Link
              to="/hadmin/referrals"
              className="shrink-0 text-sm text-primary-700 hover:underline"
            >
              View all
            </Link>
          </div>

          {referralsFailed ? (
            <p className="py-4 text-sm text-red-700">
              Recent referrals could not be loaded.
            </p>
          ) : referrals.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">
              No incoming referrals yet.
            </p>
          ) : (
            <div className="space-y-2">
              {referrals.map((referral) => (
                <Link
                  key={referral.id}
                  to={`/hadmin/referrals/${referral.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs font-bold text-gray-700">
                      {referral.referral_code}
                    </span>

                    <p className="truncate text-xs text-gray-500">
                      {referral.referring_facility_detail?.name ||
                        referral.referring_facility_name ||
                        'Referring facility not provided'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`badge text-xs ${
                        referral.urgency === 'emergency'
                          ? 'bg-red-100 text-red-700'
                          : referral.urgency === 'urgent'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {referral.urgency}
                    </span>

                    <ReferralStatusBadge status={referral.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            to: '/hadmin/availability',
            icon: <FiActivity />,
            label: 'Update Availability',
            desc: 'Beds, ICU, services',
            bg: 'bg-blue-100',
            color: 'text-blue-600',
          },
          {
            to: '/hadmin/referrals',
            icon: <FiList />,
            label: 'Incoming Referrals',
            desc:
              pendingCount === null
                ? 'View referrals'
                : `${pendingCount} pending`,
            bg: 'bg-yellow-100',
            color: 'text-yellow-600',
          },
          {
            to: '/hadmin/profile',
            icon: <FiCheckCircle />,
            label: 'Hospital Profile',
            desc: 'View & update info',
            bg: 'bg-green-100',
            color: 'text-green-600',
          },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="card flex items-center gap-3 transition-shadow hover:shadow-md"
          >
            <div className={`stat-icon shrink-0 ${action.bg}`}>
              <span
                className={`text-xl ${action.color}`}
                aria-hidden="true"
              >
                {action.icon}
              </span>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-800">
                {action.label}
              </div>
              <div className="text-xs text-gray-500">
                {action.desc}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
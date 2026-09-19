import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiList, FiAlertTriangle, FiClock } from 'react-icons/fi';
import { availabilityApi, referralsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import type { Availability, Referral } from '../../types';
import { FreshnessTag } from '../../components/common/FreshnessTag';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.hospital) return;
    Promise.all([
      availabilityApi.list({ hospital: user.hospital, page_size: '50' }),
      referralsApi.list({ destination_facility: user.hospital, status: 'pending', page_size: '10' }),
    ])
      .then(([availRes, refRes]) => {
        setAvailability(availRes.data.results);
        setReferrals(refRes.data.results);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const staleCount = availability.filter((a) => a.freshness_label === 'stale').length;
  const oldCount = availability.filter((a) => a.freshness_label === 'old').length;
  const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;

  return (
    <div>
      <h1 className="page-title">Hospital Staff Dashboard</h1>

      <div className="mb-6 p-4 bg-primary-50 border border-primary-100 rounded-xl">
        <p className="text-sm text-primary-800">
          <strong>{user?.hospital_name || 'Your Hospital'}</strong>
        </p>
        <p className="text-xs text-primary-600 mt-1">
          Logged in as {user?.full_name || user?.username} ({user?.role_display})
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <FiActivity className="text-blue-600 text-xl" />, bg: 'bg-blue-100', label: 'Availability Records', value: availability.length },
          { icon: <FiAlertTriangle className="text-yellow-600 text-xl" />, bg: 'bg-yellow-100', label: 'Stale/Old Data', value: staleCount + oldCount },
          { icon: <FiClock className="text-orange-600 text-xl" />, bg: 'bg-orange-100', label: 'Pending Referrals', value: pendingReferrals },
          { icon: <FiList className="text-green-600 text-xl" />, bg: 'bg-green-100', label: 'Total Referrals', value: referrals.length },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.bg}`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {staleCount > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <FiAlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Stale Availability Data Detected</p>
            <p className="text-sm text-red-700 mt-1">
              {staleCount} availability record{staleCount !== 1 ? 's are' : ' is'} more than 6 hours old.{' '}
              <Link to="/staff/availability" className="underline font-medium">Update now</Link>
            </p>
          </div>
        </div>
      )}

      {pendingReferrals > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <FiClock className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Pending Referral Requests</p>
            <p className="text-sm text-blue-700 mt-1">
              {pendingReferrals} referral{pendingReferrals !== 1 ? 's' : ''} waiting for response.{' '}
              <Link to="/staff/referrals" className="underline font-medium">Review now</Link>
            </p>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link to="/staff/availability" className="card hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="stat-icon bg-teal-100"><FiActivity className="text-teal-600 text-xl" /></div>
          <div>
            <div className="font-semibold text-gray-900">Manage Availability</div>
            <div className="text-sm text-gray-500">Update bed, ICU, service status</div>
          </div>
        </Link>
        <Link to="/staff/referrals" className="card hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="stat-icon bg-orange-100"><FiList className="text-orange-600 text-xl" /></div>
          <div>
            <div className="font-semibold text-gray-900">Incoming Referrals</div>
            <div className="text-sm text-gray-500">Review and respond to requests</div>
          </div>
        </Link>
      </div>

      {/* Recent availability snapshot */}
      {availability.length > 0 && (
        <div className="card mt-6">
          <h2 className="section-title">Current Availability Snapshot</h2>
          <div className="space-y-2">
            {availability.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-gray-800 capitalize">{a.availability_type_display || a.availability_type}</span>
                  {a.available_count != null && (
                    <span className="text-gray-500 ml-2">({a.available_count})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${
                    a.status === 'available' ? 'bg-green-100 text-green-700' :
                    a.status === 'limited' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {a.status_display || a.status}
                  </span>
                  <FreshnessTag label={a.freshness_label} />
                </div>
              </div>
            ))}
          </div>
          {availability.length > 6 && (
            <Link to="/staff/availability" className="text-sm text-primary-700 hover:underline mt-3 block text-center">
              View all ({availability.length} records)
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

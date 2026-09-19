import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiList, FiClock, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { referralsApi } from '../../lib/api';
import type { Referral } from '../../types';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

export const HWDashboard: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    referralsApi.list({ page_size: 10 })
      .then((r) => setReferrals(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: referrals.length,
    pending: referrals.filter((r) => r.status === 'pending').length,
    accepted: referrals.filter((r) => r.status === 'accepted').length,
    rejected: referrals.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title m-0">Health Worker Dashboard</h1>
        <Link to="/hw/referrals/new" className="btn-primary btn-sm">
          <FiPlusCircle /> New Referral
        </Link>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Welcome, <strong>{user?.full_name || user?.username}</strong>
        {user?.hospital_name && <> — {user.hospital_name}</>}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <FiList className="text-blue-600 text-xl" />, bg: 'bg-blue-100', label: 'Total', value: stats.total },
          { icon: <FiClock className="text-yellow-600 text-xl" />, bg: 'bg-yellow-100', label: 'Pending', value: stats.pending },
          { icon: <FiCheckCircle className="text-green-600 text-xl" />, bg: 'bg-green-100', label: 'Accepted', value: stats.accepted },
          { icon: <FiXCircle className="text-red-600 text-xl" />, bg: 'bg-red-100', label: 'Rejected', value: stats.rejected },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.bg}`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent referrals */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title m-0">Recent Referrals</h2>
          <Link to="/hw/referrals" className="text-sm text-primary-700 hover:underline">View all</Link>
        </div>
        {loading ? <LoadingSpinner /> : referrals.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm">
            No referrals yet.{' '}
            <Link to="/hw/referrals/new" className="text-primary-700 underline">Create your first one</Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Destination</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {referrals.slice(0, 8).map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-medium">{r.referral_code}</td>
                    <td className="text-sm">{r.destination_facility_name}</td>
                    <td className="text-sm text-gray-600">{r.service_name}</td>
                    <td><ReferralStatusBadge status={r.status} /></td>
                    <td className="hidden sm:table-cell text-xs text-gray-500">
                      {format(new Date(r.created_at), 'MMM d')}
                    </td>
                    <td>
                      <Link to={`/hw/referrals/${r.id}`} className="text-primary-700 text-xs hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <Link to="/search" className="card hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="stat-icon bg-primary-100"><FiAlertCircle className="text-primary-600 text-xl" /></div>
          <div>
            <div className="font-semibold text-gray-900">Find Hospital</div>
            <div className="text-sm text-gray-500">Search by service availability</div>
          </div>
        </Link>
        <Link to="/hw/referrals" className="card hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="stat-icon bg-teal-100"><FiList className="text-teal-600 text-xl" /></div>
          <div>
            <div className="font-semibold text-gray-900">All Referrals</div>
            <div className="text-sm text-gray-500">Track your referral requests</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiList, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { availabilityApi, referralsApi } from '../../lib/api';
import type { Availability, Referral } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

export const HADashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.hospital) return;
    Promise.all([
      availabilityApi.list({ hospital: user.hospital, page_size: 50 }),
      referralsApi.list({ page_size: 20 }),
    ]).then(([avRes, refRes]) => {
      setAvailability(avRes.data.results);
      setReferrals(refRes.data.results);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.hospital]);

  const bedRecord = availability.find((a) => a.availability_type === 'bed');
  const icuRecord = availability.find((a) => a.availability_type === 'icu');
  const pendingReferrals = referrals.filter((r) => r.status === 'pending');
  const activeServices = availability.filter((a) => a.status === 'available' || a.status === 'limited').length;

  const stats = [
    { label: 'Available Beds', value: bedRecord?.available_count ?? '—', sub: bedRecord ? `of ${bedRecord.total_count ?? '?'} total` : 'Not reported', icon: <FiActivity />, bg: 'bg-blue-100', color: 'text-blue-600' },
    { label: 'ICU Available', value: icuRecord?.available_count ?? '—', sub: icuRecord ? `Status: ${icuRecord.status}` : 'Not reported', icon: <FiAlertCircle />, bg: 'bg-red-100', color: 'text-red-600' },
    { label: 'Pending Referrals', value: pendingReferrals.length, sub: 'Awaiting response', icon: <FiClock />, bg: 'bg-yellow-100', color: 'text-yellow-600' },
    { label: 'Active Services', value: activeServices, sub: 'Available or limited', icon: <FiCheckCircle />, bg: 'bg-green-100', color: 'text-green-600' },
  ];

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;

  return (
    <div>
      <h1 className="page-title">Hospital Admin Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">
        {user?.hospital_name || 'Your Hospital'} — Welcome back, <strong>{user?.full_name || user?.username}</strong>
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.bg}`}>
              <span className={`text-xl ${s.color}`}>{s.icon}</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs font-medium text-gray-600">{s.label}</div>
              <div className="text-xs text-gray-400">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Service Status Grid */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title m-0">Service Status</h2>
            <Link to="/hadmin/availability" className="text-sm text-primary-700 hover:underline">Update</Link>
          </div>
          {availability.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No availability data yet. <Link to="/hadmin/availability" className="text-primary-700 underline">Add now</Link></p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availability.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-gray-700 capitalize text-xs">{a.availability_type_display || a.availability_type}</span>
                  <StatusBadge status={a.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Referrals */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title m-0">Recent Incoming Referrals</h2>
            <Link to="/hadmin/referrals" className="text-sm text-primary-700 hover:underline">View all</Link>
          </div>
          {referrals.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No referrals yet.</p>
          ) : (
            <div className="space-y-2">
              {referrals.slice(0, 5).map((r) => (
                <Link key={r.id} to={`/hadmin/referrals/${r.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold text-gray-700">{r.referral_code}</span>
                    <p className="text-xs text-gray-500 truncate">{r.referring_facility_name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className={`badge text-xs ${r.urgency === 'emergency' ? 'bg-red-100 text-red-700' : r.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                      {r.urgency}
                    </span>
                    <ReferralStatusBadge status={r.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          { to: '/hadmin/availability', icon: <FiActivity />, label: 'Update Availability', desc: 'Beds, ICU, services', bg: 'bg-blue-100', color: 'text-blue-600' },
          { to: '/hadmin/referrals', icon: <FiList />, label: 'Incoming Referrals', desc: `${pendingReferrals.length} pending`, bg: 'bg-yellow-100', color: 'text-yellow-600' },
          { to: '/hadmin/profile', icon: <FiCheckCircle />, label: 'Hospital Profile', desc: 'View & update info', bg: 'bg-green-100', color: 'text-green-600' },
        ].map((l) => (
          <Link key={l.to} to={l.to} className="card hover:shadow-md transition-shadow flex items-center gap-3">
            <div className={`stat-icon ${l.bg}`}><span className={`text-xl ${l.color}`}>{l.icon}</span></div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{l.label}</div>
              <div className="text-xs text-gray-500">{l.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

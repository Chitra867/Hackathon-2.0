import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { referralsApi } from '../../lib/api';
import type { Referral, ReferralStatus } from '../../types';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const ALL_STATUSES = ['', 'pending', 'accepted', 'rejected', 'call_required', 'patient_sent', 'patient_arrived', 'cancelled'];
const URGENCIES = ['', 'emergency', 'urgent', 'routine'];

export const ReferralHistory: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page_size: 200 };
    if (statusFilter) params.status = statusFilter;
    if (urgencyFilter) params.urgency = urgencyFilter;
    referralsApi.list(params)
      .then((r) => setReferrals(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, urgencyFilter]);

  const filtered = referrals.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.referral_code.toLowerCase().includes(q) ||
      r.referring_facility_name?.toLowerCase().includes(q) ||
      r.patient_condition_summary?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1 className="page-title">Referral History</h1>
      <p className="text-sm text-gray-500 mb-4">All incoming referrals — search and filter below</p>

      {/* Filters */}
      <div className="card mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by code, hospital, condition…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : 'All statuses'}</option>
          ))}
        </select>
        <select className="input sm:w-36" value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
          {URGENCIES.map((u) => (
            <option key={u} value={u}>{u ? u.charAt(0).toUpperCase() + u.slice(1) : 'All urgency'}</option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner text="Loading history…" /> : filtered.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium">No referrals found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>From Hospital</th>
                  <th className="hidden sm:table-cell">Service</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-bold text-gray-700">{r.referral_code}</td>
                    <td>
                      <div className="font-medium text-sm text-gray-800">{r.referring_facility_name}</div>
                      <div className="text-xs text-gray-400 hidden sm:block truncate max-w-[140px]">{r.patient_condition_summary}</div>
                    </td>
                    <td className="hidden sm:table-cell text-sm text-gray-600">{r.service_name || '—'}</td>
                    <td>
                      <span className={`badge text-xs ${r.urgency === 'emergency' ? 'bg-red-100 text-red-700' : r.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                        {r.urgency}
                      </span>
                    </td>
                    <td><ReferralStatusBadge status={r.status as ReferralStatus} /></td>
                    <td className="hidden md:table-cell text-xs text-gray-500">{format(new Date(r.created_at), 'MMM d, yyyy')}</td>
                    <td>
                      <Link to={`/hadmin/referrals/${r.id}`} className="btn-secondary btn-sm text-xs">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">{filtered.length} of {referrals.length} referrals</div>
        </div>
      )}
    </div>
  );
};

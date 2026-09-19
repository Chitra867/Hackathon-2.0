import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlusCircle, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';
import { referralsApi } from '../../lib/api';
import type { Referral, ReferralStatus } from '../../types';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { LoadingSpinner, EmptyState } from '../../components/common/LoadingSpinner';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Call Required', value: 'call_required' },
  { label: 'Patient Sent', value: 'patient_sent' },
  { label: 'Arrived', value: 'patient_arrived' },
];

export const HWReferrals: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page_size: '50' };
    if (statusFilter) params.status = statusFilter;
    referralsApi.list(params)
      .then((r) => setReferrals(r.data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = referrals.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.referral_code.toLowerCase().includes(q) ||
      r.destination_facility_name.toLowerCase().includes(q) ||
      r.service_name.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title m-0">My Referrals</h1>
        <Link to="/hw/referrals/new" className="btn-primary btn-sm">
          <FiPlusCircle /> New Referral
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search by code, hospital, service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary-700 text-white border-primary-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner text="Loading referrals…" /> : filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No referrals found"
          description="Create a new referral to get started."
          action={<Link to="/hw/referrals/new" className="btn-primary btn-sm">Create Referral</Link>}
        />
      ) : (
        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Destination</th>
                  <th>Service</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Created</th>
                  <th className="hidden md:table-cell">Response</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-medium">{r.referral_code}</td>
                    <td className="text-sm font-medium">{r.destination_facility_name}</td>
                    <td className="text-sm text-gray-600">{r.service_name}</td>
                    <td>
                      <span className={`badge text-xs ${
                        r.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                        r.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {r.urgency_display || r.urgency}
                      </span>
                    </td>
                    <td><ReferralStatusBadge status={r.status as ReferralStatus} /></td>
                    <td className="hidden sm:table-cell text-xs text-gray-500">
                      {format(new Date(r.created_at), 'MMM d, HH:mm')}
                    </td>
                    <td className="hidden md:table-cell text-xs text-gray-500">
                      {r.responded_at ? format(new Date(r.responded_at), 'MMM d, HH:mm') : '—'}
                    </td>
                    <td>
                      <Link
                        to={`/hw/referrals/${r.id}`}
                        className="btn-secondary btn-sm text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

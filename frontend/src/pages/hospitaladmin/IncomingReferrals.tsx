import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { referralsApi, hospitalsApi } from '../../lib/api';
import type { Referral, ReferralStatus } from '../../types';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
  { key: '', label: 'All' },
];

const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  const map: Record<string, string> = {
    emergency: 'bg-red-100 text-red-700',
    urgent: 'bg-orange-100 text-orange-700',
    routine: 'bg-gray-100 text-gray-600',
  };
  return <span className={`badge text-xs ${map[urgency] ?? 'bg-gray-100 text-gray-600'}`}>{urgency}</span>;
};

export const IncomingReferrals: React.FC = () => {
  const { user } = useAuthStore();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [responding, setResponding] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    const params: Record<string, string | number> = { page_size: 100 };
    if (activeTab) params.status = activeTab;
    referralsApi.list(params)
      .then((r) => setReferrals(r.data.results))
      .catch(() => toast.error('Failed to load referrals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [activeTab]);

  const handleRespond = async (id: number, status: 'accepted' | 'rejected' | 'call_required', note = '') => {
    setResponding(id);
    try {
      await referralsApi.respond(id, { status, note });
      toast.success(`Referral ${status}`);
      load();
    } catch {
      toast.error('Failed to respond');
    } finally {
      setResponding(null);
    }
  };

  const filtered = referrals.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.referral_code.toLowerCase().includes(q) ||
      r.referring_facility_name?.toLowerCase().includes(q) ||
      r.patient_condition_summary?.toLowerCase().includes(q);
  });

  const getReferringPhone = async (facilityId: number) => {
    try {
      const res = await hospitalsApi.get(facilityId);
      const phone = res.data.emergency_contact || res.data.phone;
      if (phone) window.location.href = `tel:${phone}`;
      else toast.error('No phone number available');
    } catch { toast.error('Could not load hospital contact'); }
  };

  return (
    <div>
      <h1 className="page-title">Incoming Referrals</h1>
      <p className="text-sm text-gray-500 mb-4">Referrals directed to {user?.hospital_name || 'your hospital'}</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card mb-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by code, hospital or condition…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <LoadingSpinner text="Loading referrals…" /> : filtered.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium">No {activeTab || ''} referrals found</p>
          <p className="text-sm mt-1 text-gray-400">Referrals to your hospital will appear here</p>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs font-bold text-gray-700">{r.referral_code}</td>
                    <td>
                      <div className="font-medium text-sm text-gray-800">{r.referring_facility_name}</div>
                      <div className="text-xs text-gray-500 hidden sm:block truncate max-w-[150px]">{r.patient_condition_summary}</div>
                    </td>
                    <td className="hidden sm:table-cell text-sm text-gray-600">{r.service_name || '—'}</td>
                    <td><UrgencyBadge urgency={r.urgency} /></td>
                    <td><ReferralStatusBadge status={r.status as ReferralStatus} /></td>
                    <td className="hidden md:table-cell text-xs text-gray-500">{format(new Date(r.created_at), 'MMM d, HH:mm')}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        <Link to={`/hadmin/referrals/${r.id}`} className="btn-secondary btn-sm text-xs">View</Link>
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => handleRespond(r.id, 'accepted')} disabled={responding === r.id} className="btn-success btn-sm text-xs">Accept</button>
                            <button onClick={() => handleRespond(r.id, 'rejected')} disabled={responding === r.id} className="btn-danger btn-sm text-xs">Reject</button>
                            <button onClick={() => getReferringPhone(r.referring_facility)} className="btn-sm text-xs flex items-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100">
                              <FiPhone className="text-xs" /> Call
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">{filtered.length} referrals</div>
        </div>
      )}
    </div>
  );
};

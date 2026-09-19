import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter, FiChevronRight, FiActivity, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { patientRequestsApi } from '../../lib/api';
import type { PatientRequest, PatientRequestStatus } from '../../types';
import { PatientRequestStatusBadge } from '../../components/user/PatientRequestStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'call_required', label: 'Call Required' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const MyReferrals: React.FC = () => {
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRequests = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, page_size: 15 };
      if (statusFilter) params.status = statusFilter;
      if (searchQ) params.search = searchQ;
      const res = await patientRequestsApi.list(params);
      setRequests(res.data.results);
      setTotal(res.data.count);
      setTotalPages(Math.ceil(res.data.count / 15));
      setPage(p);
    } catch {
      toast.error('Could not load requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQ]);

  useEffect(() => { fetchRequests(1); }, [fetchRequests]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 pb-24 md:pb-6">
      <h1 className="text-xl font-bold text-[#172554]">My Referral Requests</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchRequests(1)}
            placeholder="Search by code or condition…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button
          onClick={() => fetchRequests(1)}
          className="px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors"
        >
          Search
        </button>
      </div>

      {loading && <div className="flex justify-center py-12"><LoadingSpinner /></div>}

      {!loading && requests.length === 0 && (
        <EmptyState
          title="No requests found"
          message="You have not submitted any assistance requests yet."
          action={<Link to="/user/hospitals" className="mt-3 inline-block px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors">Find a Hospital</Link>}
        />
      )}

      {!loading && requests.length > 0 && (
        <>
          <p className="text-sm text-gray-500">{total} request{total !== 1 ? 's' : ''}</p>

          <div className="space-y-2">
            {requests.map(req => (
              <Link
                key={req.id}
                to={`/user/referrals/${req.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-[#ede0ce] p-4 hover:border-primary-200 hover:shadow-sm transition-all"
              >
                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  req.status === 'pending' ? 'bg-amber-400'
                  : req.status === 'accepted' ? 'bg-green-500'
                  : req.status === 'rejected' ? 'bg-red-500'
                  : req.status === 'call_required' ? 'bg-blue-500'
                  : 'bg-gray-300'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#172554] truncate">
                      {req.destination_hospital_name}
                    </span>
                    <PatientRequestStatusBadge status={req.status as PatientRequestStatus} size="sm" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-xs text-gray-400 font-mono">{req.request_code}</span>
                    <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <FiActivity className="text-gray-300" />
                      {req.service_name || req.service_name_freetext || 'General Assistance'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <FiChevronRight className="text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button onClick={() => fetchRequests(page - 1)} disabled={page <= 1}
                className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0] transition-colors">
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button onClick={() => fetchRequests(page + 1)} disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0] transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

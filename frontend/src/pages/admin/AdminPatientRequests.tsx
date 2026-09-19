import React, { useEffect, useState, useCallback } from 'react';
import {
  FiInbox, FiSearch, FiFilter, FiRefreshCw, FiX,
  FiCheck, FiPhone, FiChevronDown, FiChevronUp,
  FiAlertCircle, FiClock, FiUser,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { patientRequestsApi } from '../../lib/api';
import type { PatientRequest, PatientRequestStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PatientRequestStatusBadge } from '../../components/user/PatientRequestStatusBadge';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'call_required', label: 'Call Required' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const RESPOND_OPTIONS: { value: PatientRequestStatus; label: string; color: string }[] = [
  { value: 'accepted',      label: 'Accept',        color: 'bg-green-600 hover:bg-green-700' },
  { value: 'call_required', label: 'Requires Call', color: 'bg-amber-500 hover:bg-amber-600' },
  { value: 'rejected',      label: 'Reject',        color: 'bg-red-600 hover:bg-red-700' },
];

interface RespondModal {
  request: PatientRequest;
  action: PatientRequestStatus;
}

export const AdminPatientRequests: React.FC = () => {
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modal, setModal] = useState<RespondModal | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async (pageNum = 1, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params: Record<string, string | number> = {
        page: pageNum,
        page_size: 15,
      };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await patientRequestsApi.list(params);
      setRequests(res.data.results);
      setTotal(res.data.count);
      setTotalPages(Math.ceil(res.data.count / 15));
      setPage(pageNum);
    } catch {
      toast.error('Failed to load patient requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchRequests(1);
  }, [fetchRequests]);

  const openModal = (req: PatientRequest, action: PatientRequestStatus) => {
    setModal({ request: req, action });
    setResponseNote('');
  };

  const handleRespond = async () => {
    if (!modal) return;
    setSubmitting(true);
    try {
      await patientRequestsApi.respond(modal.request.id, {
        status: modal.action,
        note: responseNote.trim() || undefined,
      });
      toast.success(`Request ${modal.action.replace('_', ' ')}.`);
      setModal(null);
      setResponseNote('');
      fetchRequests(page, true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to respond to request.');
    } finally {
      setSubmitting(false);
    }
  };

  const actionLabel = (action: PatientRequestStatus) => {
    switch (action) {
      case 'accepted':      return 'Accept this request?';
      case 'call_required': return 'Mark as Call Required?';
      case 'rejected':      return 'Reject this request?';
      default:              return 'Respond to request?';
    }
  };

  const actionColor = (action: PatientRequestStatus) => {
    switch (action) {
      case 'accepted':      return 'bg-green-600 hover:bg-green-700';
      case 'call_required': return 'bg-amber-500 hover:bg-amber-600';
      case 'rejected':      return 'bg-red-600 hover:bg-red-700';
      default:              return 'bg-primary-700 hover:bg-primary-800';
    }
  };

  return (
    <div className="bg-[#faf6ee] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#3d2f1c] flex items-center gap-2">
            <FiInbox className="text-primary-700" /> Patient Requests
          </h1>
          <p className="text-sm text-[#8a7a63] mt-0.5">
            Manage and respond to patient assistance requests from all hospitals
          </p>
        </div>
        <button
          onClick={() => fetchRequests(page, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ede0ce] bg-white text-sm text-[#8a7a63] hover:bg-[#faf1e0] transition-colors disabled:opacity-50"
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') fetchRequests(1); }}
            placeholder="Search by request code or condition…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm text-[#172554] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <FiX />
            </button>
          )}
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm text-[#172554] focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => fetchRequests(1)}
          className="px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors flex items-center gap-2"
        >
          <FiSearch /> Search
        </button>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-sm text-[#8a7a63] mb-3">
          {total} request{total !== 1 ? 's' : ''}
          {statusFilter ? ` with status "${STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}"` : ''}
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ede0ce] p-16 text-center">
          <FiInbox className="text-5xl text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">No patient requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const isExpanded = expandedId === req.id;
            const canRespond = req.status === 'pending' || req.status === 'call_required';

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm overflow-hidden"
              >
                {/* Summary row */}
                <div className="p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Top row: code + hospital + status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-[#f1e4cf] text-[#8b5a2b] px-2 py-0.5 rounded-md">
                        #{req.request_code}
                      </span>
                      <span className="text-sm font-semibold text-[#172554] truncate">
                        {req.destination_hospital_name}
                      </span>
                      <PatientRequestStatusBadge status={req.status} size="sm" />
                    </div>

                    {/* Patient info row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiUser className="flex-shrink-0" />
                        {req.patient_name}
                        {req.patient_age ? `, ${req.patient_age} yrs` : ''}
                      </span>
                      {req.contact_phone && (
                        <span className="flex items-center gap-1">
                          <FiPhone className="flex-shrink-0" />
                          {req.contact_phone}
                        </span>
                      )}
                      {req.service_name && (
                        <span className="text-primary-700 font-medium">{req.service_name}</span>
                      )}
                      <span className="flex items-center gap-1 text-gray-400">
                        <FiClock className="flex-shrink-0" />
                        {new Date(req.created_at).toLocaleDateString('en-NP', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Condition summary */}
                    <p className="mt-1.5 text-sm text-[#3d2f1c] line-clamp-2">{req.condition_summary}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canRespond && (
                      <>
                        <button
                          onClick={() => openModal(req, 'accepted')}
                          className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          title="Accept"
                          aria-label="Accept request"
                        >
                          <FiCheck />
                        </button>
                        <button
                          onClick={() => openModal(req, 'call_required')}
                          className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                          title="Requires Call"
                          aria-label="Mark as call required"
                        >
                          <FiPhone />
                        </button>
                        <button
                          onClick={() => openModal(req, 'rejected')}
                          className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          title="Reject"
                          aria-label="Reject request"
                        >
                          <FiX />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="p-2 rounded-lg border border-[#ede0ce] text-[#8a7a63] hover:bg-[#faf1e0] transition-colors"
                      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[#ede0ce] px-4 py-4 bg-[#faf6ee] space-y-3">
                    {req.notes && (
                      <div>
                        <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-1">Additional Notes</p>
                        <p className="text-sm text-[#3d2f1c]">{req.notes}</p>
                      </div>
                    )}

                    {req.service_name_freetext && (
                      <div>
                        <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-1">Requested Service (free-text)</p>
                        <p className="text-sm text-[#3d2f1c]">{req.service_name_freetext}</p>
                      </div>
                    )}

                    {req.response_note && (
                      <div className="bg-white rounded-xl border border-[#ede0ce] p-3">
                        <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-1">Response Note</p>
                        <p className="text-sm text-[#3d2f1c]">{req.response_note}</p>
                        {req.responded_at && (
                          <p className="text-xs text-gray-400 mt-1">
                            Responded {new Date(req.responded_at).toLocaleDateString('en-NP', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Event timeline */}
                    {req.events && req.events.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-2">Status History</p>
                        <ul className="space-y-1.5">
                          {req.events.map(ev => (
                            <li key={ev.id} className="flex items-start gap-2 text-xs text-[#3d2f1c]">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                              <span className="text-gray-400 flex-shrink-0">
                                {new Date(ev.created_at).toLocaleDateString('en-NP', {
                                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                              <span>
                                {ev.old_status ? (
                                  <><strong>{ev.old_status}</strong> → <strong>{ev.new_status}</strong></>
                                ) : (
                                  <strong>{ev.new_status}</strong>
                                )}
                                {ev.note ? ` — ${ev.note}` : ''}
                                {ev.actor_name ? ` (${ev.actor_name})` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Respond inline if actionable */}
                    {canRespond && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {RESPOND_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => openModal(req, opt.value)}
                            className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors ${opt.color}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex justify-center gap-2 mt-5">
          <button
            onClick={() => fetchRequests(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0] transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => fetchRequests(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0] transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Respond modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#3d2f1c]">{actionLabel(modal.action)}</h2>
                <p className="text-xs text-[#8a7a63] mt-0.5">
                  Request #{modal.request.request_code} · {modal.request.destination_hospital_name}
                </p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 ml-4">
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Request summary */}
            <div className="bg-[#faf6ee] rounded-xl border border-[#ede0ce] p-3 mb-4 text-sm text-[#3d2f1c]">
              <p className="font-medium">{modal.request.patient_name}
                {modal.request.patient_age ? `, ${modal.request.patient_age} yrs` : ''}
              </p>
              <p className="text-[#8a7a63] mt-0.5">{modal.request.condition_summary}</p>
            </div>

            {/* Alert icon for reject */}
            {modal.action === 'rejected' && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4 text-red-700 text-sm">
                <FiAlertCircle className="flex-shrink-0" />
                This will notify the patient that their request was rejected.
              </div>
            )}

            {/* Response note */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-1.5">
                Response Note <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={responseNote}
                onChange={e => setResponseNote(e.target.value)}
                rows={3}
                placeholder={
                  modal.action === 'accepted'      ? 'e.g. Bed available. Please bring the patient immediately.' :
                  modal.action === 'call_required' ? 'e.g. Please call 01-XXXXXXX before arriving.' :
                  'e.g. Unfortunately we are at capacity. Please try another hospital.'
                }
                className="w-full px-3 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm text-[#172554] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModal(null)}
                className="px-5 py-2.5 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] hover:bg-[#faf1e0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRespond}
                disabled={submitting}
                className={`px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2 ${actionColor(modal.action)}`}
              >
                {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

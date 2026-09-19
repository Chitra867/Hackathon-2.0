import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch, FiRefreshCw, FiChevronDown, FiChevronUp,
  FiPhone, FiClock, FiUser, FiArrowRight, FiX, FiFilter,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { patientRequestsApi } from '../../lib/api';
import type { PatientRequest, PatientRequestStatus } from '../../types';
import { PatientRequestStatusBadge } from '../../components/user/PatientRequestStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

function fmt(d?: string | null) {
  if (!d) return '—';
  try { return format(new Date(d), 'MMM d, yyyy · HH:mm'); }
  catch { return '—'; }
}

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending',       label: 'Pending' },
  { value: 'accepted',      label: 'Accepted' },
  { value: 'call_required', label: 'Call Required' },
  { value: 'rejected',      label: 'Rejected' },
  { value: 'cancelled',     label: 'Cancelled' },
];

const PAGE_SIZE = 15;

interface RespondModal {
  id: number;
  action: 'accepted' | 'rejected' | 'call_required';
  patientName: string;
  code: string;
}

export const HAPatientManagement: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const [patients, setPatients]     = useState<PatientRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [hasNext, setHasNext]       = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded]     = useState<number | null>(null);

  const [modal, setModal]           = useState<RespondModal | null>(null);
  const [modalNote, setModalNote]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPatients = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, page_size: PAGE_SIZE };
      if (status) params.status = status;
      if (search.trim()) params.search = search.trim();
      const res = await patientRequestsApi.list(params);
      if (!mountedRef.current) return;
      setPatients(res.data.results);
      setTotal(res.data.count);
      setHasNext(p * PAGE_SIZE < res.data.count);
      setPage(p);
    } catch {
      toast.error('Failed to load patients.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [status, search]);

  useEffect(() => { fetchPatients(1); }, [fetchPatients, refreshKey]);

  const handleRespond = async () => {
    if (!modal || submitting) return;
    if (modal.action === 'rejected' && !modalNote.trim()) {
      toast.error('Please provide a rejection reason.'); return;
    }
    setSubmitting(true);
    try {
      await patientRequestsApi.respond(modal.id, {
        status: modal.action as PatientRequestStatus,
        note: modalNote,
      });
      toast.success(
        modal.action === 'accepted' ? 'Request accepted.' :
        modal.action === 'rejected' ? 'Request rejected.' :
        'Marked as call required.'
      );
      setModal(null); setModalNote('');
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to respond.');
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#faf6ee] -m-4 md:-m-6 p-4 md:p-6 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#3d2f1c]">Patient Management</h1>
          <p className="text-sm text-[#8a7a63] mt-0.5">
            All patients who have submitted requests to {user?.hospital_name || 'your hospital'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/hadmin/referrals/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors">
            <FiArrowRight /> New Referral
          </Link>
          <button onClick={() => setRefreshKey(k => k + 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ede0ce] bg-white text-sm text-[#8a7a63] hover:bg-[#faf1e0] transition-colors">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchPatients(1)}
            placeholder="Search by patient name, code, or condition…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><FiX /></button>
          )}
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none">
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button onClick={() => fetchPatients(1)}
          className="px-5 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors flex items-center gap-2">
          <FiSearch /> Search
        </button>
      </div>

      {!loading && <p className="text-sm text-[#8a7a63] mb-3">{total} patient request{total !== 1 ? 's' : ''}</p>}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ede0ce] p-16 text-center shadow-sm">
          <div className="text-5xl mb-3">🏥</div>
          <p className="text-gray-400 text-sm">No patients found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map(pr => {
            const canRespond = pr.status === 'pending' || pr.status === 'call_required';
            const isExpanded = expanded === pr.id;
            return (
              <div key={pr.id} className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm overflow-hidden">
                <div className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-[#f1e4cf] text-[#8b5a2b] px-2 py-0.5 rounded-md">#{pr.request_code}</span>
                      <span className="text-sm font-semibold text-[#172554]">{pr.patient_name}</span>
                      {pr.patient_age ? <span className="text-xs text-gray-400">Age {pr.patient_age}</span> : null}
                      <PatientRequestStatusBadge status={pr.status} size="sm" />
                    </div>
                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                      {pr.service_name && <span className="text-primary-700 font-medium">{pr.service_name}</span>}
                      {pr.contact_phone && (
                        <span className="flex items-center gap-1"><FiPhone className="flex-shrink-0" />{pr.contact_phone}</span>
                      )}
                      <span className="flex items-center gap-1"><FiClock className="flex-shrink-0" />{fmt(pr.created_at)}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#3d2f1c] line-clamp-2">{pr.condition_summary}</p>
                    {pr.response_note && !canRespond && (
                      <p className="mt-1 text-xs text-[#8a7a63] italic">Response: {pr.response_note}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 flex-shrink-0">
                    {/* Refer this patient */}
                    <Link
                      to={`/hadmin/referrals/new?patient_request_id=${pr.id}&condition=${encodeURIComponent(pr.condition_summary)}&service=${encodeURIComponent(pr.service_name || '')}&age=${pr.patient_age ?? ''}`}
                      className="px-3 py-1.5 rounded-lg bg-[#f1e4cf] text-[#8b5a2b] text-xs font-medium hover:bg-[#e8d4b5] transition-colors flex items-center gap-1 whitespace-nowrap"
                      title="Refer this patient to another hospital"
                    >
                      <FiArrowRight /> Refer
                    </Link>

                    {canRespond && (
                      <>
                        <button title="Accept" onClick={() => { setModal({ id: pr.id, action: 'accepted', patientName: pr.patient_name, code: pr.request_code }); setModalNote(''); }}
                          className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"><FiUser className="text-sm" /></button>
                      </>
                    )}
                    {pr.contact_phone && (
                      <a href={`tel:${pr.contact_phone.replace(/[^\d+]/g, '')}`}
                        className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors" title="Call patient">
                        <FiPhone className="text-sm" />
                      </a>
                    )}
                    <button onClick={() => setExpanded(isExpanded ? null : pr.id)}
                      className="p-1.5 rounded-lg border border-[#ede0ce] text-[#8a7a63] hover:bg-[#faf1e0] transition-colors">
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-[#ede0ce] px-4 py-4 bg-[#faf6ee] space-y-3 text-sm">
                    {pr.notes && (
                      <div><span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">Notes: </span><span className="text-[#3d2f1c]">{pr.notes}</span></div>
                    )}
                    {pr.service_name_freetext && (
                      <div><span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">Requested service: </span><span className="text-[#3d2f1c]">{pr.service_name_freetext}</span></div>
                    )}
                    {pr.response_note && (
                      <div className="bg-white rounded-xl border border-[#ede0ce] p-3">
                        <span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">Response note: </span>
                        <span className="text-[#3d2f1c]">{pr.response_note}</span>
                        {pr.responded_at && <p className="text-xs text-gray-400 mt-0.5">Responded {fmt(pr.responded_at)}</p>}
                      </div>
                    )}
                    {/* Events */}
                    {pr.events?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-1.5">Status history</p>
                        <ul className="space-y-1.5">
                          {pr.events.map(ev => (
                            <li key={ev.id} className="flex items-start gap-2 text-xs text-[#3d2f1c]">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                              <span className="text-gray-400 flex-shrink-0">{fmt(ev.created_at)}</span>
                              <span>
                                {ev.old_status ? <><strong>{ev.old_status}</strong> → </> : ''}
                                <strong>{ev.new_status}</strong>
                                {ev.note ? ` — ${ev.note}` : ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Full respond controls in expanded area */}
                    {canRespond && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-[#ede0ce]">
                        <button onClick={() => { setModal({ id: pr.id, action: 'accepted', patientName: pr.patient_name, code: pr.request_code }); setModalNote(''); }}
                          className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">Accept</button>
                        <button onClick={() => { setModal({ id: pr.id, action: 'call_required', patientName: pr.patient_name, code: pr.request_code }); setModalNote(''); }}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors">Requires Call</button>
                        <button onClick={() => { setModal({ id: pr.id, action: 'rejected', patientName: pr.patient_name, code: pr.request_code }); setModalNote(''); }}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">Reject</button>
                        <Link to={`/hadmin/referrals/new?patient_request_id=${pr.id}&condition=${encodeURIComponent(pr.condition_summary)}&service=${encodeURIComponent(pr.service_name || '')}&age=${pr.patient_age ?? ''}`}
                          className="px-4 py-2 rounded-xl border border-[#ede0ce] text-[#8b5a2b] bg-[#f1e4cf] text-sm font-medium hover:bg-[#e8d4b5] transition-colors flex items-center gap-1">
                          <FiArrowRight /> Refer to Another Hospital
                        </Link>
                      </div>
                    )}
                    {!canRespond && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-[#ede0ce]">
                        <Link to={`/hadmin/referrals/new?condition=${encodeURIComponent(pr.condition_summary)}&service=${encodeURIComponent(pr.service_name || '')}&age=${pr.patient_age ?? ''}`}
                          className="px-4 py-2 rounded-xl border border-[#ede0ce] text-[#8b5a2b] bg-[#f1e4cf] text-sm font-medium hover:bg-[#e8d4b5] transition-colors flex items-center gap-1">
                          <FiArrowRight /> Refer to Another Hospital
                        </Link>
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
      {(page > 1 || hasNext) && !loading && (
        <div className="flex justify-center gap-2 mt-5">
          <button onClick={() => fetchPatients(page - 1)} disabled={page <= 1}
            className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0]">Previous</button>
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} · {total} total</span>
          <button onClick={() => fetchPatients(page + 1)} disabled={!hasNext}
            className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0]">Next</button>
        </div>
      )}

      {/* Respond modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#3d2f1c]">
                  {modal.action === 'accepted' ? '✓ Accept Request' :
                   modal.action === 'rejected' ? '✕ Reject Request' : '📞 Requires Call'}
                </h2>
                <p className="text-xs text-[#8a7a63] mt-0.5">#{modal.code} · {modal.patientName}</p>
              </div>
              <button onClick={() => { setModal(null); setModalNote(''); }} className="text-gray-400 hover:text-gray-600"><FiX className="text-xl" /></button>
            </div>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-1.5">
                {modal.action === 'rejected' ? 'Rejection Reason *' : 'Response Note (optional)'}
              </label>
              <textarea value={modalNote} onChange={e => setModalNote(e.target.value)} rows={3}
                placeholder={
                  modal.action === 'accepted'      ? 'e.g. Please come to Ward 3 with your ID.' :
                  modal.action === 'call_required' ? 'e.g. Call our front desk before arriving.' :
                  'Reason for rejection…'
                }
                className="w-full px-3 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setModal(null); setModalNote(''); }}
                className="px-5 py-2.5 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] hover:bg-[#faf1e0]">Cancel</button>
              <button onClick={handleRespond}
                disabled={submitting || (modal.action === 'rejected' && !modalNote.trim())}
                className={`px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center gap-2 transition-colors ${
                  modal.action === 'accepted' ? 'bg-green-600 hover:bg-green-700' :
                  modal.action === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-amber-500 hover:bg-amber-600'
                }`}>
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

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiRefreshCw, FiPhone, FiCheck, FiX, FiEye,
  FiChevronDown, FiChevronUp, FiAlertTriangle,
  FiClock, FiUser,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { referralsApi, patientRequestsApi } from '../../lib/api';
import type { Referral, ReferralStatus, PatientRequest, PatientRequestStatus } from '../../types';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { PatientRequestStatusBadge } from '../../components/user/PatientRequestStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

// Serializer returns nested objects — helper to extract fields safely
type WithDetail = {
  referring_facility_detail?: { name?: string; phone?: string; emergency_contact?: string };
  destination_facility_detail?: { name?: string };
  service_detail?: { name?: string };
};

function refFacilityName(r: Referral): string {
  return (r as unknown as WithDetail).referring_facility_detail?.name || 'Unknown Hospital';
}
function destFacilityName(r: Referral): string {
  return (r as unknown as WithDetail).destination_facility_detail?.name || 'Unknown Hospital';
}
function serviceName(r: Referral): string {
  return (r as unknown as WithDetail).service_detail?.name || '';
}
function refFacilityPhone(r: Referral): string {
  const d = (r as unknown as WithDetail).referring_facility_detail;
  return d?.emergency_contact || d?.phone || '';
}

type Section = 'referrals' | 'patient_requests';
type ReferralTab = '' | 'pending' | 'accepted' | 'rejected' | 'call_required';

const REF_TABS: { key: ReferralTab; label: string }[] = [
  { key: 'pending',       label: 'Pending' },
  { key: 'accepted',      label: 'Accepted' },
  { key: 'call_required', label: 'Call Required' },
  { key: 'rejected',      label: 'Rejected' },
  { key: '',              label: 'All' },
];

const PR_TABS: { key: string; label: string }[] = [
  { key: 'pending',       label: 'Pending' },
  { key: 'accepted',      label: 'Accepted' },
  { key: 'call_required', label: 'Call Required' },
  { key: 'rejected',      label: 'Rejected' },
  { key: '',              label: 'All' },
];

const URGENCY_COLOR: Record<string, string> = {
  emergency: 'bg-red-100 text-red-700 border-red-200',
  urgent:    'bg-orange-100 text-orange-700 border-orange-200',
  routine:   'bg-gray-100 text-gray-600 border-gray-200',
};

function fmt(d?: string | null) {
  if (!d) return '—';
  try { return format(new Date(d), 'MMM d, HH:mm'); }
  catch { return '—'; }
}

interface RespondModal {
  type: 'referral' | 'patient_request';
  id: number;
  action: 'accepted' | 'rejected' | 'call_required';
  label?: string;
  code?: string;
}

const PAGE_SIZE = 15;

export const IncomingReferrals: React.FC = () => {
  const { user } = useAuthStore();
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // ─── Section ──────────────────────────────────────────────
  const [section, setSection] = useState<Section>('referrals');

  // ─── Referrals state ──────────────────────────────────────
  const [referrals, setReferrals]   = useState<Referral[]>([]);
  const [refLoading, setRefLoading] = useState(true);
  const [refTab, setRefTab]         = useState<ReferralTab>('pending');
  const [refSearch, setRefSearch]   = useState('');
  const [refPage, setRefPage]       = useState(1);
  const [refTotal, setRefTotal]     = useState(0);
  const [refHasNext, setRefHasNext] = useState(false);
  const [expandedRef, setExpandedRef] = useState<number | null>(null);
  const [refKey, setRefKey]         = useState(0);

  // ─── Patient Requests state ────────────────────────────────
  const [requests, setRequests]     = useState<PatientRequest[]>([]);
  const [prLoading, setPrLoading]   = useState(true);
  const [prTab, setPrTab]           = useState('pending');
  const [prSearch, setPrSearch]     = useState('');
  const [prPage, setPrPage]         = useState(1);
  const [prTotal, setPrTotal]       = useState(0);
  const [prHasNext, setPrHasNext]   = useState(false);
  const [expandedPr, setExpandedPr] = useState<number | null>(null);
  const [prKey, setPrKey]           = useState(0);

  // ─── Respond modal ────────────────────────────────────────
  const [modal, setModal]       = useState<RespondModal | null>(null);
  const [modalNote, setModalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch referrals ──────────────────────────────────────
  const fetchReferrals = useCallback(async (page = 1) => {
    setRefLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (refTab) params.status = refTab;
      if (refSearch.trim()) params.search = refSearch.trim();
      const res = await referralsApi.list(params);
      if (!mountedRef.current) return;
      const data = res.data as { results?: Referral[]; count?: number } | Referral[];
      const results = Array.isArray(data) ? data : ((data as { results?: Referral[] }).results ?? []);
      const count   = Array.isArray(data) ? results.length : ((data as { count?: number }).count ?? results.length);
      setReferrals(results);
      setRefTotal(count);
      setRefHasNext(page * PAGE_SIZE < count);
      setRefPage(page);
    } catch { toast.error('Failed to load referrals.'); }
    finally { if (mountedRef.current) setRefLoading(false); }
  }, [refTab, refSearch]);

  useEffect(() => { fetchReferrals(1); }, [fetchReferrals, refKey]);

  // ─── Fetch patient requests ───────────────────────────────
  const fetchRequests = useCallback(async (page = 1) => {
    setPrLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: PAGE_SIZE };
      if (prTab) params.status = prTab;
      if (prSearch.trim()) params.search = prSearch.trim();
      const res = await patientRequestsApi.list(params);
      if (!mountedRef.current) return;
      setRequests(res.data.results);
      setPrTotal(res.data.count);
      setPrHasNext(page * PAGE_SIZE < res.data.count);
      setPrPage(page);
    } catch { toast.error('Failed to load service requests.'); }
    finally { if (mountedRef.current) setPrLoading(false); }
  }, [prTab, prSearch]);

  useEffect(() => { fetchRequests(1); }, [fetchRequests, prKey]);

  // ─── Respond ──────────────────────────────────────────────
  const handleRespond = async () => {
    if (!modal || submitting) return;
    if (modal.action === 'rejected' && !modalNote.trim()) {
      toast.error('Please provide a rejection reason.'); return;
    }
    setSubmitting(true);
    try {
      if (modal.type === 'referral') {
        await referralsApi.respond(modal.id, { status: modal.action, note: modalNote });
        setRefKey(k => k + 1);
      } else {
        await patientRequestsApi.respond(modal.id, { status: modal.action as PatientRequestStatus, note: modalNote });
        setPrKey(k => k + 1);
      }
      toast.success(
        modal.action === 'accepted' ? 'Accepted successfully.' :
        modal.action === 'rejected' ? 'Rejected.' :
        'Marked as call required.'
      );
      setModal(null); setModalNote('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error || 'Failed to respond.');
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  };

  const callPhone = (phone?: string) => {
    if (!phone) { toast.error('No phone number available.'); return; }
    window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
  };

  const openModal = (m: RespondModal) => { setModal(m); setModalNote(''); };

  // ─── Sub-components ───────────────────────────────────────
  const TabBar = ({ tabs, active, onChange }: {
    tabs: { key: string; label: string }[];
    active: string;
    onChange: (k: string) => void;
  }) => (
    <div className="flex gap-1 bg-white rounded-xl border border-[#ede0ce] p-1 w-fit mb-4 shadow-sm overflow-x-auto">
      {tabs.map(t => (
        <button key={t.key || 'all'} onClick={() => onChange(t.key)}
          className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            active === t.key ? 'bg-[#ede0ce] text-[#4a3a24]' : 'text-[#8a7a63] hover:bg-[#faf1e0]'
          }`}
        >{t.label}</button>
      ))}
    </div>
  );

  const SearchBar = ({ value, onChange, onSearch, placeholder }: {
    value: string; onChange: (v: string) => void;
    onSearch: () => void; placeholder: string;
  }) => (
    <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-3 mb-4 flex gap-2">
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>
      <button onClick={onSearch}
        className="px-4 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors flex items-center gap-1.5">
        <FiSearch /> Search
      </button>
    </div>
  );

  const Pagination = ({ page, hasNext, total, onPrev, onNext }: {
    page: number; hasNext: boolean; total: number;
    onPrev: () => void; onNext: () => void;
  }) => (
    page > 1 || hasNext ? (
      <div className="flex justify-center gap-2 mt-5">
        <button onClick={onPrev} disabled={page <= 1}
          className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0]">Previous</button>
        <span className="px-4 py-2 text-sm text-gray-500">Page {page} · {total} total</span>
        <button onClick={onNext} disabled={!hasNext}
          className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0]">Next</button>
      </div>
    ) : null
  );

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="bg-[#faf6ee] -m-4 md:-m-6 p-4 md:p-6 min-h-full">

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#3d2f1c]">Incoming Referrals &amp; Requests</h1>
          <p className="text-sm text-[#8a7a63] mt-0.5">{user?.hospital_name || 'Your hospital'}</p>
        </div>
        <button
          onClick={() => section === 'referrals' ? setRefKey(k => k + 1) : setPrKey(k => k + 1)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ede0ce] bg-white text-sm text-[#8a7a63] hover:bg-[#faf1e0] transition-colors">
          <FiRefreshCw className={(refLoading || prLoading) ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Section toggle */}
      <div className="flex gap-1 bg-white rounded-xl border border-[#ede0ce] p-1 w-fit mb-5 shadow-sm">
        {(['referrals', 'patient_requests'] as Section[]).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              section === s ? 'bg-primary-700 text-white' : 'text-[#8a7a63] hover:bg-[#faf1e0]'
            }`}>
            {s === 'referrals' ? 'Referrals' : 'Service Requests'}
            {s === 'referrals' && refTotal > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${section === s ? 'bg-white/30 text-white' : 'bg-primary-100 text-primary-700'}`}>{refTotal}</span>
            )}
            {s === 'patient_requests' && prTotal > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${section === s ? 'bg-white/30 text-white' : 'bg-primary-100 text-primary-700'}`}>{prTotal}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════ REFERRALS ═══════════════════════ */}
      {section === 'referrals' && (
        <>
          <TabBar tabs={REF_TABS} active={refTab} onChange={v => { setRefTab(v as ReferralTab); setRefPage(1); setExpandedRef(null); }} />
          <SearchBar value={refSearch} onChange={setRefSearch} onSearch={() => fetchReferrals(1)} placeholder="Search code, hospital, service, condition…" />

          {refLoading ? <div className="flex justify-center py-16"><LoadingSpinner /></div>
          : referrals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ede0ce] p-16 text-center shadow-sm">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-400 text-sm">No {refTab || ''} referrals found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map(ref => {
                const canRespond = ref.status === 'pending' || ref.status === 'call_required';
                const isExpanded = expandedRef === ref.id;
                const phone = refFacilityPhone(ref);
                return (
                  <div key={ref.id} className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm overflow-hidden">
                    <div className="p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs bg-[#f1e4cf] text-[#8b5a2b] px-2 py-0.5 rounded-md">{ref.referral_code}</span>
                          <span className="text-sm font-semibold text-[#172554] truncate">{refFacilityName(ref)}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${URGENCY_COLOR[ref.urgency] ?? URGENCY_COLOR.routine}`}>
                            {ref.urgency === 'emergency' ? '🚨 ' : ''}{ref.urgency_display || ref.urgency}
                          </span>
                          <ReferralStatusBadge status={ref.status as ReferralStatus} />
                        </div>
                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                          {serviceName(ref) && <span className="text-primary-700 font-medium">{serviceName(ref)}</span>}
                          {ref.patient_age && (
                            <span className="flex items-center gap-1">
                              <FiUser className="flex-shrink-0" />
                              Age {ref.patient_age}
                              {ref.patient_gender ? ` · ${ref.patient_gender === 'm' ? 'Male' : ref.patient_gender === 'f' ? 'Female' : 'Other'}` : ''}
                            </span>
                          )}
                          <span className="flex items-center gap-1"><FiClock className="flex-shrink-0" />{fmt(ref.created_at)}</span>
                        </div>
                        <p className="mt-1.5 text-sm text-[#3d2f1c] line-clamp-2">{ref.patient_condition_summary}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        {canRespond && (
                          <>
                            <button title="Accept"
                              onClick={() => openModal({ type: 'referral', id: ref.id, action: 'accepted', code: ref.referral_code })}
                              className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"><FiCheck /></button>
                            <button title="Requires Call"
                              onClick={() => openModal({ type: 'referral', id: ref.id, action: 'call_required', code: ref.referral_code })}
                              className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"><FiPhone /></button>
                            <button title="Reject"
                              onClick={() => openModal({ type: 'referral', id: ref.id, action: 'rejected', code: ref.referral_code })}
                              className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"><FiX /></button>
                          </>
                        )}
                        {phone && (
                          <button title="Call referring hospital" onClick={() => callPhone(phone)}
                            className="p-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"><FiPhone /></button>
                        )}
                        <Link to={`/hadmin/referrals/${ref.id}`} title="View detail"
                          className="p-2 rounded-lg border border-[#ede0ce] text-[#8a7a63] hover:bg-[#faf1e0] transition-colors"><FiEye /></Link>
                        <button onClick={() => setExpandedRef(isExpanded ? null : ref.id)}
                          className="p-2 rounded-lg border border-[#ede0ce] text-[#8a7a63] hover:bg-[#faf1e0] transition-colors">
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#ede0ce] px-4 py-4 bg-[#faf6ee] space-y-2 text-sm">
                        {ref.reason && <div><span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">Reason: </span><span className="text-[#3d2f1c]">{ref.reason}</span></div>}
                        <div><span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">To: </span><span className="text-[#3d2f1c]">{destFacilityName(ref)}</span></div>
                        {ref.responded_at && <div><span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">Responded: </span><span className="text-[#3d2f1c]">{fmt(ref.responded_at)}</span></div>}
                        {canRespond && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button onClick={() => openModal({ type: 'referral', id: ref.id, action: 'accepted', code: ref.referral_code })}
                              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700">Accept</button>
                            <button onClick={() => openModal({ type: 'referral', id: ref.id, action: 'call_required', code: ref.referral_code })}
                              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">Requires Call</button>
                            <button onClick={() => openModal({ type: 'referral', id: ref.id, action: 'rejected', code: ref.referral_code })}
                              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700">Reject</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <Pagination page={refPage} hasNext={refHasNext} total={refTotal}
            onPrev={() => fetchReferrals(refPage - 1)} onNext={() => fetchReferrals(refPage + 1)} />
        </>
      )}

      {/* ═══════════════════ PATIENT REQUESTS ════════════════ */}
      {section === 'patient_requests' && (
        <>
          <TabBar tabs={PR_TABS} active={prTab} onChange={v => { setPrTab(v); setPrPage(1); setExpandedPr(null); }} />
          <SearchBar value={prSearch} onChange={setPrSearch} onSearch={() => fetchRequests(1)} placeholder="Search code, patient name, condition…" />

          {prLoading ? <div className="flex justify-center py-16"><LoadingSpinner /></div>
          : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ede0ce] p-16 text-center shadow-sm">
              <div className="text-5xl mb-3">📩</div>
              <p className="text-gray-400 text-sm">No service requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(pr => {
                const canRespond = pr.status === 'pending' || pr.status === 'call_required';
                const isExpanded = expandedPr === pr.id;
                return (
                  <div key={pr.id} className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm overflow-hidden">
                    <div className="p-4 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs bg-[#f1e4cf] text-[#8b5a2b] px-2 py-0.5 rounded-md">#{pr.request_code}</span>
                          <span className="text-sm font-semibold text-[#172554]">{pr.patient_name}</span>
                          {pr.patient_age ? <span className="text-xs text-gray-400">Age {pr.patient_age}</span> : null}
                          <PatientRequestStatusBadge status={pr.status} size="sm" />
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                          {pr.service_name && <span className="text-primary-700 font-medium">{pr.service_name}</span>}
                          {pr.contact_phone && <span className="flex items-center gap-1"><FiPhone className="flex-shrink-0" />{pr.contact_phone}</span>}
                          <span className="flex items-center gap-1"><FiClock className="flex-shrink-0" />{fmt(pr.created_at)}</span>
                        </div>
                        <p className="mt-1.5 text-sm text-[#3d2f1c] line-clamp-2">{pr.condition_summary}</p>
                        {pr.response_note && !canRespond && (
                          <p className="mt-1 text-xs text-[#8a7a63] italic">Response: {pr.response_note}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        {canRespond && (
                          <>
                            <button title="Accept"
                              onClick={() => openModal({ type: 'patient_request', id: pr.id, action: 'accepted', label: pr.patient_name, code: pr.request_code })}
                              className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"><FiCheck /></button>
                            <button title="Requires Call"
                              onClick={() => openModal({ type: 'patient_request', id: pr.id, action: 'call_required', label: pr.patient_name, code: pr.request_code })}
                              className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"><FiPhone /></button>
                            <button title="Reject"
                              onClick={() => openModal({ type: 'patient_request', id: pr.id, action: 'rejected', label: pr.patient_name, code: pr.request_code })}
                              className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"><FiX /></button>
                          </>
                        )}
                        {pr.contact_phone && (
                          <button title="Call patient" onClick={() => callPhone(pr.contact_phone)}
                            className="p-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"><FiPhone /></button>
                        )}
                        <button onClick={() => setExpandedPr(isExpanded ? null : pr.id)}
                          className="p-2 rounded-lg border border-[#ede0ce] text-[#8a7a63] hover:bg-[#faf1e0] transition-colors">
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#ede0ce] px-4 py-4 bg-[#faf6ee] space-y-2 text-sm">
                        {pr.notes && <div><span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">Notes: </span><span className="text-[#3d2f1c]">{pr.notes}</span></div>}
                        {pr.service_name_freetext && <div><span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">Service (text): </span><span className="text-[#3d2f1c]">{pr.service_name_freetext}</span></div>}
                        {pr.response_note && (
                          <div className="bg-white rounded-xl border border-[#ede0ce] p-3">
                            <span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">Response: </span>
                            <span className="text-[#3d2f1c]">{pr.response_note}</span>
                          </div>
                        )}
                        {pr.events && pr.events.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-1">History</p>
                            <ul className="space-y-1">
                              {pr.events.map(ev => (
                                <li key={ev.id} className="flex items-start gap-2 text-xs text-[#3d2f1c]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                                  <span className="text-gray-400 flex-shrink-0 w-20">{fmt(ev.created_at)}</span>
                                  <span>
                                    {ev.old_status ? <><strong>{ev.old_status}</strong> → </> : ''}
                                    <strong>{ev.new_status}</strong>
                                    {ev.note ? ` — ${ev.note}` : ''}
                                    {ev.actor_name ? ` (${ev.actor_name})` : ''}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {canRespond && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button onClick={() => openModal({ type: 'patient_request', id: pr.id, action: 'accepted', label: pr.patient_name, code: pr.request_code })}
                              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700">Accept</button>
                            <button onClick={() => openModal({ type: 'patient_request', id: pr.id, action: 'call_required', label: pr.patient_name, code: pr.request_code })}
                              className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">Requires Call</button>
                            <button onClick={() => openModal({ type: 'patient_request', id: pr.id, action: 'rejected', label: pr.patient_name, code: pr.request_code })}
                              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700">Reject</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <Pagination page={prPage} hasNext={prHasNext} total={prTotal}
            onPrev={() => fetchRequests(prPage - 1)} onNext={() => fetchRequests(prPage + 1)} />
        </>
      )}

      {/* ═══════════════════ RESPOND MODAL ═══════════════════ */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#3d2f1c]">
                  {modal.action === 'accepted' ? '✓ Accept' : modal.action === 'rejected' ? '✕ Reject' : '📞 Requires Call'}
                </h2>
                <p className="text-xs text-[#8a7a63] mt-0.5">
                  {modal.type === 'referral' ? 'Referral' : 'Service Request'} #{modal.code}
                  {modal.label ? ` · ${modal.label}` : ''}
                </p>
              </div>
              <button onClick={() => { setModal(null); setModalNote(''); }} className="text-gray-400 hover:text-gray-600"><FiX className="text-xl" /></button>
            </div>

            {modal.action === 'rejected' && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4 text-red-700 text-sm">
                <FiAlertTriangle className="flex-shrink-0" /> A rejection reason is required.
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-1.5">
                {modal.action === 'rejected' ? 'Rejection Reason *' : 'Response Note (optional)'}
              </label>
              <textarea value={modalNote} onChange={e => setModalNote(e.target.value)} rows={3}
                placeholder={
                  modal.action === 'accepted'      ? 'e.g. ICU bed available — please come immediately.' :
                  modal.action === 'call_required' ? 'e.g. Please call the ward before arriving.' :
                  'Enter the reason for rejection…'
                }
                className="w-full px-3 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setModal(null); setModalNote(''); }}
                className="px-5 py-2.5 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] hover:bg-[#faf1e0]">Cancel</button>
              <button onClick={handleRespond}
                disabled={submitting || (modal.action === 'rejected' && !modalNote.trim())}
                className={`px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2 ${
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

export default IncomingReferrals;

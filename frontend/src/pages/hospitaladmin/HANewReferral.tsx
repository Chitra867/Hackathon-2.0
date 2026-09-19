import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft, FiSend, FiAlertTriangle, FiInfo,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { hospitalsApi, servicesApi, referralsApi, patientsApi } from '../../lib/api';
import type { HospitalListItem, Service } from '../../types';
import type { PatientSearchResult } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const URGENCY_OPTIONS = [
  { value: 'emergency', label: '🚨 Emergency — immediate threat to life' },
  { value: 'urgent',    label: '⚠️ Urgent — needs attention within hours' },
  { value: 'routine',   label: '📋 Routine — can wait, scheduled transfer' },
];

const GENDER_OPTIONS = [
  { value: '',      label: 'Not specified' },
  { value: 'm',     label: 'Male' },
  { value: 'f',     label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const HANewReferral: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillCondition = searchParams.get('condition') || '';
  const prefillService   = searchParams.get('service')   || '';
  const prefillAge       = searchParams.get('age')       || '';

  const [hospitals, setHospitals]   = useState<HospitalListItem[]>([]);
  const [services, setServices]     = useState<Service[]>([]);
  const [patients, setPatients]     = useState<PatientSearchResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    patient_user: '',               // selected patient id (string for select value)
    destination_facility: '',
    service: '',
    urgency: 'urgent',
    patient_age: prefillAge,
    patient_gender: '',
    patient_condition_summary: prefillCondition,
    reason: prefillService ? `Patient needs: ${prefillService}` : '',
    contact_phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  // Load hospitals, services, and registered patients in parallel
  useEffect(() => {
    Promise.all([
      hospitalsApi.list({
        page_size: 100,
        verification_status: 'verified',
        is_active: 'true',
      } as Record<string, string | number | boolean>),
      servicesApi.list({ page_size: '100' } as Record<string, string>),
      // Load all registered patients upfront for the dropdown
      patientsApi.list(),
    ]).then(([hRes, sRes, pRes]) => {
      setHospitals(hRes.data.results.filter(h => h.id !== user?.hospital));
      setServices(sRes.data.results ?? []);
      setPatients((pRes as { data: PatientSearchResult[] }).data);
    }).catch(() => toast.error('Failed to load form data.'))
      .finally(() => setLoadingData(false));
  }, [user?.hospital]);

  // When patient selection changes, auto-fill contact phone
  const handlePatientChange = (patientId: string) => {
    set('patient_user', patientId);
    if (patientId) {
      const p = patients.find(pt => String(pt.id) === patientId);
      if (p?.phone) {
        setForm(f => ({ ...f, patient_user: patientId, contact_phone: p.phone }));
        return;
      }
    }
    // No patient selected or no phone — clear auto-filled phone
    if (!patientId) {
      setForm(f => ({ ...f, patient_user: '', contact_phone: '' }));
    }
  };

  const set = (k: keyof typeof form, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.destination_facility) e.destination_facility = 'Please select a destination hospital.';
    if (!form.patient_condition_summary.trim()) e.patient_condition_summary = 'Condition summary is required.';
    if (!form.reason.trim()) e.reason = 'Please state the reason for referral.';
    if (form.patient_age && (Number(form.patient_age) < 0 || Number(form.patient_age) > 120)) {
      e.patient_age = 'Invalid age.';
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        destination_facility: Number(form.destination_facility),
        urgency: form.urgency,
        patient_condition_summary: form.patient_condition_summary.trim(),
        reason: form.reason.trim(),
      };
      if (form.service) payload.service = Number(form.service);
      if (form.patient_age) payload.patient_age = Number(form.patient_age);
      if (form.patient_gender) payload.patient_gender = form.patient_gender;
      if (form.contact_phone.trim()) payload.contact_phone = form.contact_phone.trim();
      if (form.patient_user) payload.patient_user = Number(form.patient_user);

      await referralsApi.create(payload as Parameters<typeof referralsApi.create>[0]);
      toast.success('Referral created successfully!');
      navigate('/hadmin/referrals');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
      const msg = resp
        ? (Object.values(resp).flat()[0] as string) ?? 'Failed to create referral.'
        : 'Failed to create referral.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatient = patients.find(p => String(p.id) === form.patient_user) ?? null;

  if (loadingData) {
    return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  }

  return (
    <div className="bg-[#faf6ee] -m-4 md:-m-6 p-4 md:p-6 min-h-full">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-[#ede0ce] text-[#8a7a63] hover:bg-[#faf1e0] transition-colors"
          >
            <FiArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#3d2f1c]">Create New Referral</h1>
            <p className="text-sm text-[#8a7a63] mt-0.5">
              Referring from: <strong>{user?.hospital_name || 'your hospital'}</strong>
            </p>
          </div>
        </div>

        {/* Emergency alert */}
        {form.urgency === 'emergency' && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-red-700 text-sm">
            <FiAlertTriangle className="flex-shrink-0 text-lg" />
            <span>
              Emergency referral — the destination hospital will be notified immediately.
              Ensure the patient is stable for transport.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-6 space-y-5">

          {/* ── Patient ──────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-[#3d2f1c] mb-1.5">
              Patient <span className="text-[#8a7a63] font-normal text-xs">(optional)</span>
            </label>
            <select
              value={form.patient_user}
              onChange={e => handlePatientChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none"
            >
              <option value="">— Select a registered patient —</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.full_name}{p.phone ? ` · ${p.phone}` : ''} (@{p.username})
                </option>
              ))}
            </select>
            {patients.length === 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <FiInfo className="flex-shrink-0" />
                No registered patients found.
              </p>
            )}
            {selectedPatient && (
              <p className="text-xs text-primary-700 mt-1.5">
                ✓ Contact phone auto-filled from patient profile. You can edit it below if needed.
              </p>
            )}
          </div>

          <div className="border-t border-[#f0e8d8]" />

          {/* ── Destination hospital ─────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-[#3d2f1c] mb-1.5">
              Destination Hospital <span className="text-red-500">*</span>
            </label>
            <select
              value={form.destination_facility}
              onChange={e => set('destination_facility', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none ${
                errors.destination_facility ? 'border-red-300' : 'border-[#ede0ce]'
              }`}
            >
              <option value="">Select destination hospital…</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name} — {h.district}</option>
              ))}
            </select>
            {errors.destination_facility && (
              <p className="text-xs text-red-600 mt-1">{errors.destination_facility}</p>
            )}
            {hospitals.length === 0 && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <FiInfo className="flex-shrink-0" />
                No other verified hospitals available.
              </p>
            )}
          </div>

          {/* ── Urgency ──────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-[#3d2f1c] mb-1.5">
              Urgency Level <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {URGENCY_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    form.urgency === opt.value
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-[#ede0ce] hover:bg-[#faf1e0]'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={opt.value}
                    checked={form.urgency === opt.value}
                    onChange={e => set('urgency', e.target.value)}
                    className="accent-primary-700"
                  />
                  <span className="text-sm text-[#3d2f1c]">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Service ──────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-[#3d2f1c] mb-1.5">
              Service Required
            </label>
            <select
              value={form.service}
              onChange={e => set('service', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none"
            >
              <option value="">Select service (optional)</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* ── Patient details ───────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-[#3d2f1c] mb-1.5">
              Patient Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Contact phone */}
              <div className="sm:col-span-1">
                <label className="block text-xs text-gray-500 mb-1">Contact Phone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.contact_phone}
                    onChange={e => set('contact_phone', e.target.value)}
                    placeholder="98XXXXXXXX"
                    className={`w-full px-3 py-2.5 rounded-xl border bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                      selectedPatient && selectedPatient.phone && form.contact_phone === selectedPatient.phone
                        ? 'border-primary-300'
                        : 'border-[#ede0ce]'
                    }`}
                  />
                  {selectedPatient && selectedPatient.phone && form.contact_phone === selectedPatient.phone && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-primary-600 font-medium bg-primary-50 px-1.5 py-0.5 rounded-md pointer-events-none">
                      auto
                    </span>
                  )}
                </div>
              </div>
              {/* Age */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Age</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={form.patient_age}
                  onChange={e => set('patient_age', e.target.value)}
                  placeholder="e.g. 45"
                  className={`w-full px-3 py-2.5 rounded-xl border bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                    errors.patient_age ? 'border-red-300' : 'border-[#ede0ce]'
                  }`}
                />
                {errors.patient_age && (
                  <p className="text-xs text-red-600 mt-1">{errors.patient_age}</p>
                )}
              </div>
              {/* Gender */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gender</label>
                <select
                  value={form.patient_gender}
                  onChange={e => set('patient_gender', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#ede0ce] bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 appearance-none"
                >
                  {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Condition summary ─────────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-[#3d2f1c] mb-1.5">
              Patient Condition Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.patient_condition_summary}
              onChange={e => set('patient_condition_summary', e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Describe the patient's current condition, diagnoses, vital signs, and immediate needs…"
              className={`w-full px-3 py-2.5 rounded-xl border bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none ${
                errors.patient_condition_summary ? 'border-red-300' : 'border-[#ede0ce]'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.patient_condition_summary
                ? <p className="text-xs text-red-600">{errors.patient_condition_summary}</p>
                : <span />
              }
              <p className="text-xs text-gray-400">{form.patient_condition_summary.length}/500</p>
            </div>
          </div>

          {/* ── Reason for referral ───────────────────────────────── */}
          <div>
            <label className="block text-sm font-semibold text-[#3d2f1c] mb-1.5">
              Reason for Referral <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Why is this patient being referred? e.g. No ICU capacity, specialist not available, equipment required…"
              className={`w-full px-3 py-2.5 rounded-xl border bg-[#faf6ee] text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none ${
                errors.reason ? 'border-red-300' : 'border-[#ede0ce]'
              }`}
            />
            {errors.reason && (
              <p className="text-xs text-red-600 mt-1">{errors.reason}</p>
            )}
          </div>

          {/* ── Submit ────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-2.5 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] hover:bg-[#faf1e0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${
                form.urgency === 'emergency'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary-700 hover:bg-primary-800'
              }`}
            >
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <FiSend />
              }
              {submitting ? 'Sending…' : 'Send Referral'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

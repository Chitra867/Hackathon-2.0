import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { hospitalsApi, servicesApi, patientRequestsApi } from '../../lib/api';
import type { HospitalListItem, Service } from '../../types';

/* ── Reusable hospital combobox ───────────────────────────────── */
interface HospitalComboboxProps {
  hospitals: HospitalListItem[];
  value: HospitalListItem | null;
  onChange: (h: HospitalListItem | null) => void;
  placeholder?: string;
  required?: boolean;
  excludeId?: number | null;
}

const HospitalCombobox: React.FC<HospitalComboboxProps> = ({
  hospitals,
  value,
  onChange,
  placeholder = 'Search hospital by name or district…',
  required,
  excludeId,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pool = excludeId ? hospitals.filter(h => h.id !== excludeId) : hospitals;

  const filtered = query.trim()
    ? pool.filter(h => {
        const q = query.toLowerCase();
        return (
          h.name.toLowerCase().includes(q) ||
          h.district.toLowerCase().includes(q) ||
          (h.municipality ?? '').toLowerCase().includes(q)
        );
      })
    : pool;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (h: HospitalListItem) => {
    onChange(h);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 w-full border rounded-xl px-3 py-2.5 bg-[#faf6ee] cursor-text transition-all ${
          open ? 'border-primary-400 ring-2 ring-primary-100' : 'border-[#ede0ce]'
        }`}
        onClick={() => setOpen(true)}
      >
        <FiSearch className="flex-shrink-0 text-gray-400 text-sm" />
        {value && !open ? (
          <span className="flex-1 text-sm text-[#172554] truncate">{value.name} — {value.district}</span>
        ) : (
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={value ? `${value.name} — ${value.district}` : placeholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            required={required && !value}
          />
        )}
        {value ? (
          <button type="button" onClick={handleClear} className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors">
            <FiX className="text-sm" />
          </button>
        ) : (
          <FiChevronDown className={`flex-shrink-0 text-gray-400 text-sm transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#ede0ce] rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 text-center">
                {query ? `No hospitals found for "${query}"` : 'No hospitals available'}
              </p>
            ) : (
              filtered.map(h => (
                <button
                  key={h.id}
                  type="button"
                  onMouseDown={() => handleSelect(h)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#faf1e0] transition-colors border-b border-[#f5ede0] last:border-0 ${
                    value?.id === h.id ? 'bg-primary-50 text-primary-800 font-medium' : 'text-[#172554]'
                  }`}
                >
                  <span className="font-medium">{h.name}</span>
                  <span className="text-gray-400 ml-1.5 text-xs">{h.district}{h.municipality ? `, ${h.municipality}` : ''}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main page ────────────────────────────────────────────────── */
export const UserReferral: React.FC = () => {
  const [hospitals, setHospitals] = useState<HospitalListItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  const [sourceHospital, setSourceHospital] = useState<HospitalListItem | null>(null);
  const [destHospital, setDestHospital] = useState<HospitalListItem | null>(null);

  const [form, setForm] = useState({
    service: '',
    service_name_freetext: '',
    contact_phone: '',
    patient_age: '',
    condition_summary: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  useEffect(() => {
    hospitalsApi
      .list({ page_size: 200, verification_status: 'verified', is_active: true } as Record<string, string | number | boolean>)
      .then(res => setHospitals(res.data.results))
      .catch(() => toast.error('Could not load hospitals.'))
      .finally(() => setHospitalsLoading(false));

    servicesApi
      .list({ page_size: '100' } as Record<string, string>)
      .then(res => setServices(res.data.results ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destHospital) { toast.error('Please select a destination hospital.'); return; }
    if (!form.condition_summary.trim()) { toast.error('Please describe the condition.'); return; }
    setSubmitting(true);
    try {
      const fromNote = sourceHospital ? `Referred from ${sourceHospital.name}. ` : '';
      const payload: Parameters<typeof patientRequestsApi.create>[0] = {
        destination_hospital: destHospital.id,
        condition_summary: form.condition_summary,
        notes: `${fromNote}${form.notes}`.trim() || undefined,
        contact_phone: form.contact_phone || undefined,
      };
      if (form.service) payload.service = Number(form.service);
      else if (form.service_name_freetext) payload.service_name_freetext = form.service_name_freetext;
      if (form.patient_age) payload.patient_age = Number(form.patient_age);

      const res = await patientRequestsApi.create(payload);
      setSuccessCode(res.data.request_code);
      toast.success(`Referral sent! Code: ${res.data.request_code}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const msg = (Object.values(e.response?.data ?? {}).flat()[0] as string) ?? 'Failed to submit referral.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessCode(null);
    setSourceHospital(null);
    setDestHospital(null);
    setForm({ service: '', service_name_freetext: '', contact_phone: '', patient_age: '', condition_summary: '', notes: '' });
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24 md:pb-6">
      {/* Page header */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <FiArrowRight className="text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#172554]">Refer to Another Hospital</h1>
            <p className="text-sm text-[#8a7a63]">Send a patient request directly to a different hospital</p>
          </div>
        </div>
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Use this form when a hospital cannot provide the care needed and you want to request assistance from another facility.
        </div>
      </div>

      {/* Form / Success */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">
        {successCode ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-green-700 font-semibold text-lg">✓ Referral Request Sent!</p>
            <p className="text-green-600 text-sm mt-1">
              Your request code: <span className="font-mono font-bold">{successCode}</span>
            </p>
            {destHospital && (
              <p className="text-green-600 text-xs mt-1">Sent to <strong>{destHospital.name}</strong></p>
            )}
            <p className="text-green-600 text-xs mt-1">The destination hospital will review and respond to your request.</p>
            <div className="flex gap-3 justify-center mt-4 flex-wrap">
              <Link to="/user/referrals" className="px-4 py-2 rounded-xl bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors">
                View My Requests
              </Link>
              <button onClick={handleReset} className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-gray-600 hover:bg-[#faf1e0] transition-colors">
                Send Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {hospitalsLoading ? (
              <div className="flex items-center gap-2 py-4 justify-center text-sm text-gray-400">
                <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
                Loading hospitals…
              </div>
            ) : (
              <>
                {/* Source hospital (optional) */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Current / Referring Hospital{' '}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-1.5">
                    The hospital where the patient currently is, or the one that cannot help.
                  </p>
                  <HospitalCombobox
                    hospitals={hospitals}
                    value={sourceHospital}
                    onChange={h => {
                      setSourceHospital(h);
                      // if dest was same as new source, clear dest
                      if (destHospital && h && destHospital.id === h.id) setDestHospital(null);
                    }}
                    placeholder="Search referring hospital (optional)…"
                    excludeId={destHospital?.id ?? null}
                  />
                </div>

                {/* Destination hospital */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Destination Hospital <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-400 mb-1.5">
                    The hospital you want to refer the patient to.
                  </p>
                  <HospitalCombobox
                    hospitals={hospitals}
                    value={destHospital}
                    onChange={setDestHospital}
                    placeholder="Search destination hospital…"
                    required
                    excludeId={sourceHospital?.id ?? null}
                  />
                </div>
              </>
            )}

            {/* Service */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Service Needed</label>
              <select
                value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300"
              >
                <option value="">Select a service (optional)</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {!form.service && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Or Describe the Service</label>
                <input
                  value={form.service_name_freetext}
                  onChange={e => setForm(f => ({ ...f, service_name_freetext: e.target.value }))}
                  placeholder="E.g. cardiac surgery, dialysis, NICU…"
                  className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            )}

            {/* Condition */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Condition Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={form.condition_summary}
                onChange={e => setForm(f => ({ ...f, condition_summary: e.target.value }))}
                rows={4}
                placeholder="Describe the medical condition and why a referral is needed…"
                className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </div>

            {/* Phone + Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contact Phone</label>
                <input
                  value={form.contact_phone}
                  onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                  placeholder="98XXXXXXXX"
                  className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Patient Age</label>
                <input
                  type="number" min={0} max={120}
                  value={form.patient_age}
                  onChange={e => setForm(f => ({ ...f, patient_age: e.target.value }))}
                  placeholder="e.g. 35"
                  className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Any other context for the receiving hospital…"
                className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </div>

            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <FiArrowRight className="flex-shrink-0" />
              The destination hospital will receive this as a patient request and respond with acceptance, call requirements, or rejection.
            </p>

            <button
              type="submit"
              disabled={submitting || !destHospital || !form.condition_summary.trim()}
              className="w-full py-3 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiArrowRight />}
              Send Referral Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiChevronLeft, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { userPortalApi, servicesApi, patientRequestsApi } from '../../lib/api';
import type { UserHospitalDetail as HospitalDetailType, Service } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const UserServiceRequest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState<HospitalDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);

  const [form, setForm] = useState({
    service: '' as string,
    service_name_freetext: '',
    contact_phone: '',
    patient_age: '',
    condition_summary: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    userPortalApi.getHospitalDetail(Number(id))
      .then(res => setHospital(res.data))
      .catch(() => toast.error('Hospital not found.'))
      .finally(() => setLoading(false));

    servicesApi.list({ page_size: '100' } as Record<string, string>)
      .then(res => setServices(res.data.results ?? []))
      .catch(() => {});
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.condition_summary.trim()) { toast.error('Please describe your condition.'); return; }
    if (!hospital) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        destination_hospital: hospital.id,
        condition_summary: form.condition_summary,
        notes: form.notes,
        contact_phone: form.contact_phone,
      };
      if (form.service) payload.service = Number(form.service);
      else if (form.service_name_freetext) payload.service_name_freetext = form.service_name_freetext;
      if (form.patient_age) payload.patient_age = Number(form.patient_age);

      const res = await patientRequestsApi.create(payload as Parameters<typeof patientRequestsApi.create>[0]);
      setSuccessCode(res.data.request_code);
      toast.success(`Request submitted! Code: ${res.data.request_code}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      const msg = Object.values(e.response?.data ?? {}).flat()[0] as string ?? 'Failed to submit request.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (!hospital) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Hospital not found.</p>
      <Link to="/user/hospitals" className="text-primary-700 text-sm mt-3 inline-block hover:underline">← Back to Search</Link>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24 md:pb-6">
      {/* Back */}
      <button
        onClick={() => navigate(`/user/hospitals/${id}`)}
        className="flex items-center gap-1 text-sm text-[#8a7a63] hover:text-primary-700 transition-colors"
      >
        <FiChevronLeft /> Back to {hospital.name}
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-primary-50 text-primary-700">
            <FiPlus className="text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#172554]">Request Help</h1>
            <p className="text-sm text-[#8a7a63]">{hospital.name}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Submit an assistance request to <strong>{hospital.name}</strong>. The hospital staff will review your request and respond.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">
        {successCode ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-green-700 font-semibold text-lg">✓ Request Submitted!</p>
            <p className="text-green-600 text-sm mt-1">
              Your request code: <span className="font-mono font-bold">{successCode}</span>
            </p>
            <p className="text-green-600 text-xs mt-1">Keep this code to track your request status.</p>
            <div className="flex gap-3 justify-center mt-4">
              <Link
                to="/user/referrals"
                className="px-4 py-2 rounded-xl bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
              >
                View My Requests
              </Link>
              <button
                onClick={() => setSuccessCode(null)}
                className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-gray-600 hover:bg-[#faf1e0] transition-colors"
              >
                Submit Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="E.g. physiotherapy, dialysis…"
                  className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Condition Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={form.condition_summary}
                onChange={e => setForm(f => ({ ...f, condition_summary: e.target.value }))}
                rows={4}
                placeholder="Briefly describe your medical condition or reason for visit…"
                className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </div>

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
                  type="number"
                  min={0}
                  max={120}
                  value={form.patient_age}
                  onChange={e => setForm(f => ({ ...f, patient_age: e.target.value }))}
                  placeholder="e.g. 35"
                  className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                placeholder="Any other relevant information…"
                className="w-full border border-[#ede0ce] rounded-xl px-3 py-2.5 text-sm bg-[#faf6ee] focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !form.condition_summary.trim()}
              className="w-full py-3 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <FiPlus />
              }
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

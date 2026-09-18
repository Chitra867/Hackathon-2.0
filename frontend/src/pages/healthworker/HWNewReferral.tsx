import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { hospitalsApi, servicesApi, referralsApi } from '../../lib/api';
import type { HospitalListItem, Service } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FreshnessTag } from '../../components/common/FreshnessTag';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const HWNewReferral: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [hospitals, setHospitals] = useState<HospitalListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    service: '',
    destination_facility: searchParams.get('destination') || '',
    urgency: 'routine' as 'emergency' | 'urgent' | 'routine',
    patient_age: '',
    patient_gender: '' as '' | 'm' | 'f' | 'other',
    patient_condition_summary: '',
    reason: '',
  });

  useEffect(() => {
    servicesApi.list({ page_size: '100' }).then((r) => setServices(r.data.results)).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.service) {
      setLoading(true);
      hospitalsApi.list({ service: formData.service, page_size: '50' })
        .then((r) => setHospitals(r.data.results))
        .finally(() => setLoading(false));
    }
  }, [formData.service]);

  const handleSubmit = async () => {
    if (!formData.destination_facility || !formData.service) {
      toast.error('Please select service and destination hospital');
      return;
    }
    if (!formData.patient_condition_summary.trim() || !formData.reason.trim()) {
      toast.error('Please provide patient condition summary and reason');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        destination_facility: Number(formData.destination_facility),
        service: Number(formData.service),
        urgency: formData.urgency,
        patient_age: formData.patient_age ? Number(formData.patient_age) : undefined,
        patient_gender: formData.patient_gender || undefined,
        patient_condition_summary: formData.patient_condition_summary,
        reason: formData.reason,
      };
      const res = await referralsApi.create(payload);
      toast.success(`Referral created: ${res.data.referral_code}`);
      navigate(`/hw/referrals/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create referral');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find((s) => s.id === Number(formData.service));
  const selectedHospital = hospitals.find((h) => h.id === Number(formData.destination_facility));

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="page-title">Create New Referral</h1>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${step >= s ? 'text-primary-700' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                step >= s ? 'bg-primary-700 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {s === 1 ? 'Service' : s === 2 ? 'Hospital' : 'Details'}
              </span>
            </div>
            {s < 3 && <FiArrowRight className="text-gray-300" />}
          </React.Fragment>
        ))}
      </div>

      <div className="card">
        {/* Step 1: Select Service */}
        {step === 1 && (
          <div>
            <h2 className="section-title">Step 1: Select Required Service</h2>
            <div className="form-group">
              <label htmlFor="service" className="label">What service does the patient need?</label>
              <select
                id="service"
                className="input"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              >
                <option value="">— Select a service —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setStep(2)}
              className="btn-primary"
              disabled={!formData.service}
            >
              Continue <FiArrowRight />
            </button>
          </div>
        )}

        {/* Step 2: Select Hospital */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title m-0">Step 2: Select Destination Hospital</h2>
              <button onClick={() => setStep(1)} className="btn-secondary btn-sm">
                <FiArrowLeft /> Back
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Hospitals that provide <strong>{selectedService?.name}</strong>
            </p>

            {loading ? <LoadingSpinner text="Finding hospitals…" /> : hospitals.length === 0 ? (
              <p className="text-sm text-gray-500 py-8 text-center">No hospitals found for this service.</p>
            ) : (
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {hospitals.map((h) => {
                  const avail = h.availability?.find((a) => a.service === Number(formData.service)) || h.availability?.[0];
                  return (
                    <label
                      key={h.id}
                      className={`block p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.destination_facility === String(h.id)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="destination"
                        value={h.id}
                        checked={formData.destination_facility === String(h.id)}
                        onChange={(e) => setFormData({ ...formData, destination_facility: e.target.value })}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{h.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{h.district}, {h.municipality}</div>
                        </div>
                        {avail && (
                          <div className="flex items-center gap-2">
                            <StatusBadge status={avail.status} size="sm" />
                            <FreshnessTag label={avail.freshness_label} />
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              className="btn-primary"
              disabled={!formData.destination_facility}
            >
              Continue <FiArrowRight />
            </button>
          </div>
        )}

        {/* Step 3: Patient Details */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title m-0">Step 3: Patient & Referral Details</h2>
              <button onClick={() => setStep(2)} className="btn-secondary btn-sm">
                <FiArrowLeft /> Back
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-sm">
              <div><strong>Service:</strong> {selectedService?.name}</div>
              <div><strong>Destination:</strong> {selectedHospital?.name}</div>
            </div>

            <div className="form-group">
              <label className="label">Urgency <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {[
                  { value: 'routine', label: 'Routine', color: 'border-gray-300' },
                  { value: 'urgent', label: 'Urgent', color: 'border-orange-300' },
                  { value: 'emergency', label: 'Emergency', color: 'border-red-500' },
                ].map((u) => (
                  <label key={u.value} className="flex-1">
                    <input
                      type="radio"
                      name="urgency"
                      value={u.value}
                      checked={formData.urgency === u.value}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-2 text-center text-sm cursor-pointer transition-all ${
                      formData.urgency === u.value
                        ? `${u.color} bg-opacity-10 font-semibold`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      {u.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="patient_age" className="label">Patient Age (optional)</label>
                <input
                  id="patient_age"
                  type="number"
                  className="input"
                  placeholder="e.g. 45"
                  value={formData.patient_age}
                  onChange={(e) => setFormData({ ...formData, patient_age: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="patient_gender" className="label">Patient Gender (optional)</label>
                <select
                  id="patient_gender"
                  className="input"
                  value={formData.patient_gender}
                  onChange={(e) => setFormData({ ...formData, patient_gender: e.target.value as any })}
                >
                  <option value="">— Select —</option>
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="condition" className="label">Patient Condition Summary <span className="text-red-500">*</span></label>
              <textarea
                id="condition"
                className="input"
                rows={3}
                placeholder="Brief summary of patient's condition…"
                value={formData.patient_condition_summary}
                onChange={(e) => setFormData({ ...formData, patient_condition_summary: e.target.value })}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">{formData.patient_condition_summary.length}/500</p>
            </div>

            <div className="form-group">
              <label htmlFor="reason" className="label">Reason for Referral <span className="text-red-500">*</span></label>
              <textarea
                id="reason"
                className="input"
                rows={2}
                placeholder="Why is the patient being referred to this facility?"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                maxLength={500}
              />
            </div>

            <button
              onClick={handleSubmit}
              className="btn-primary btn-lg w-full justify-center"
              disabled={submitting || !formData.patient_condition_summary.trim() || !formData.reason.trim()}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Referral…
                </>
              ) : (
                <>
                  <FiCheckCircle /> Create Referral
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

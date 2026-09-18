import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPhone, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { referralsApi, hospitalsApi } from '../../lib/api';
import type { Referral } from '../../types';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

export const HARefDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [responding, setResponding] = useState(false);

  const load = () => {
    if (!id) return;
    referralsApi.get(Number(id))
      .then((r) => setReferral(r.data))
      .catch(() => toast.error('Referral not found'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const handleRespond = async (status: 'accepted' | 'rejected' | 'call_required') => {
    if (!id) return;
    setResponding(true);
    try {
      await referralsApi.respond(Number(id), { status, note });
      toast.success(`Referral ${status.replace('_', ' ')}`);
      load();
    } catch {
      toast.error('Failed to respond');
    } finally {
      setResponding(false);
    }
  };

  const callReferringHospital = async () => {
    if (!referral) return;
    try {
      const res = await hospitalsApi.get(referral.referring_facility);
      const phone = res.data.emergency_contact || res.data.phone;
      if (phone) window.location.href = `tel:${phone}`;
      else toast.error('No phone number on record');
    } catch { toast.error('Could not load contact info'); }
  };

  if (loading) return <LoadingSpinner text="Loading referral…" fullPage />;
  if (!referral) return (
    <div className="text-center py-16">
      <p className="text-gray-500 mb-4">Referral not found</p>
      <button onClick={() => navigate(-1)} className="btn-secondary"><FiArrowLeft /> Back</button>
    </div>
  );

  const isPending = referral.status === 'pending' || referral.status === 'call_required';

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-700 mb-4">
        <FiArrowLeft /> Back to referrals
      </button>

      <div className="card mb-4">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">Referral Details</h1>
              <ReferralStatusBadge status={referral.status} />
            </div>
            <p className="text-sm text-gray-500">Code: <span className="font-mono font-bold text-gray-700">{referral.referral_code}</span></p>
          </div>
          <span className={`badge text-sm ${referral.urgency === 'emergency' ? 'bg-red-100 text-red-700' : referral.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
            {referral.urgency_display || referral.urgency}
          </span>
        </div>

        {/* Facilities */}
        <div className="grid sm:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Referring Facility</p>
            <p className="font-semibold text-gray-900">{referral.referring_facility_name}</p>
            <button onClick={callReferringHospital} className="mt-1 flex items-center gap-1 text-xs text-blue-700 hover:underline">
              <FiPhone className="text-xs" /> Call Hospital
            </button>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Destination (Your Hospital)</p>
            <p className="font-semibold text-gray-900">{referral.destination_facility_name}</p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="grid sm:grid-cols-2 gap-6 mb-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Patient Information</h3>
            <div className="space-y-1 text-sm text-gray-700">
              {referral.patient_age && <p>Age: <strong>{referral.patient_age}</strong></p>}
              {referral.patient_gender && <p>Gender: <strong>{referral.patient_gender_display || referral.patient_gender}</strong></p>}
              {!referral.patient_age && !referral.patient_gender && <p className="text-gray-400 text-xs">Not provided</p>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Service</h3>
            <p className="text-sm text-gray-800">{referral.service_name || 'Not specified'}</p>
          </div>
        </div>

        {/* Condition & Reason */}
        <div className="space-y-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Patient Condition</h3>
            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{referral.patient_condition_summary}</p>
          </div>
          {referral.reason && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Reason for Referral</h3>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{referral.reason}</p>
            </div>
          )}
        </div>

        {/* Response Actions */}
        {isPending && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="section-title">Respond to Referral</h3>
            <div className="form-group">
              <label className="label">Note (optional)</label>
              <textarea className="input" rows={2} placeholder="Add a note for the referring hospital…" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => handleRespond('accepted')} disabled={responding} className="btn-success">
                {responding ? 'Processing…' : '✓ Accept Referral'}
              </button>
              <button onClick={() => handleRespond('rejected')} disabled={responding} className="btn-danger">
                ✗ Reject Referral
              </button>
              <button onClick={() => handleRespond('call_required')} disabled={responding} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-medium text-sm">
                <FiPhone /> Request Call
              </button>
              <button onClick={callReferringHospital} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                <FiPhone /> Call Directly
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="section-title">Referral Timeline</h2>
        <div className="space-y-3">
          {referral.events && referral.events.length > 0 ? referral.events.map((ev) => (
            <div key={ev.id} className="flex gap-3">
              <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
                <FiClock className="text-xs" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold capitalize">{ev.new_status.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-400">{format(new Date(ev.created_at), 'MMM d, HH:mm')}</span>
                </div>
                <p className="text-xs text-gray-500">By {ev.actor_name || 'System'}</p>
                {ev.note && <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-1">{ev.note}</p>}
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-500">Created {format(new Date(referral.created_at), 'MMM d, yyyy HH:mm')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

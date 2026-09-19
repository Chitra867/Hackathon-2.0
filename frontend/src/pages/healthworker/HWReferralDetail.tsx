import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiClock, FiUser, FiAlertCircle } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { referralsApi } from '../../lib/api';
import type { Referral } from '../../types';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const HWReferralDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadReferral = () => {
    if (!id) return;
    setLoading(true);
    referralsApi.get(Number(id))
      .then((r) => setReferral(r.data))
      .catch(() => toast.error('Referral not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReferral(); }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id) return;
    setUpdating(true);
    try {
      await referralsApi.updateStatus(Number(id), { status: newStatus });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      loadReferral();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading referral…" fullPage />;
  if (!referral) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Referral not found</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">
          <FiArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  const canMarkSent = referral.status === 'accepted';
  const canMarkArrived = referral.status === 'patient_sent';

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-700 mb-4"
      >
        <FiArrowLeft /> Back to referrals
      </button>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl font-bold text-gray-900">Referral Details</h1>
              <ReferralStatusBadge status={referral.status} />
            </div>
            <p className="text-sm text-gray-500">Code: <span className="font-mono font-semibold text-gray-700">{referral.referral_code}</span></p>
          </div>
          <span className={`badge ${
            referral.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
            referral.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {referral.urgency_display || referral.urgency}
          </span>
        </div>

        {/* Facility info */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 mb-1">From (Referring Facility)</p>
            <p className="font-semibold text-gray-900">{referral.referring_facility_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">To (Destination Facility)</p>
            <p className="font-semibold text-gray-900">{referral.destination_facility_name}</p>
          </div>
        </div>

        {/* Service & Patient Info */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Service Required</h3>
            <p className="text-gray-900">{referral.service_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Patient Info</h3>
            <div className="text-sm text-gray-600 space-y-1">
              {referral.patient_age && <p>Age: {referral.patient_age}</p>}
              {referral.patient_gender && <p>Gender: {referral.patient_gender_display || referral.patient_gender}</p>}
              {!referral.patient_age && !referral.patient_gender && <p className="text-gray-400">Not provided</p>}
            </div>
          </div>
        </div>

        {/* Condition & Reason */}
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Patient Condition Summary</h3>
            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{referral.patient_condition_summary}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Reason for Referral</h3>
            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{referral.reason}</p>
          </div>
        </div>

        {/* Response note */}
        {referral.response_note && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Response from {referral.destination_facility_name}</p>
                <p className="text-sm text-yellow-700 mt-1">{referral.response_note}</p>
                {referral.responded_at && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {format(new Date(referral.responded_at), 'MMM d, yyyy HH:mm')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {canMarkSent && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 mb-3">
              <strong>Referral accepted!</strong> Mark the patient as sent when they are on the way.
            </p>
            <button
              onClick={() => handleUpdateStatus('patient_sent')}
              className="btn-success btn-sm"
              disabled={updating}
            >
              {updating ? 'Updating…' : 'Mark Patient Sent'}
            </button>
          </div>
        )}

        {canMarkArrived && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-sm text-teal-800 mb-3">
              Mark the patient as arrived when they reach the destination facility.
            </p>
            <button
              onClick={() => handleUpdateStatus('patient_arrived')}
              className="btn-success btn-sm"
              disabled={updating}
            >
              {updating ? 'Updating…' : 'Mark Patient Arrived'}
            </button>
          </div>
        )}

        {/* Timeline */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="section-title">Referral Timeline</h3>
          <div className="space-y-3">
            {referral.events && referral.events.length > 0 ? (
              referral.events.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                    <FiClock className="text-xs" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-800">
                        {event.new_status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(event.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">By {event.actor_name || 'System'}</p>
                    {event.note && <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">{event.note}</p>}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                  <FiClock className="text-xs" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Referral Created</p>
                  <p className="text-xs text-gray-500">{format(new Date(referral.created_at), 'MMM d, yyyy HH:mm')}</p>
                  <p className="text-xs text-gray-600">By {referral.created_by_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

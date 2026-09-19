import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiChevronLeft, FiMapPin, FiActivity, FiClock, FiAlertCircle, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { patientRequestsApi } from '../../lib/api';
import type { PatientRequest, PatientRequestStatus } from '../../types';
import { PatientRequestStatusBadge } from '../../components/user/PatientRequestStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const STATUS_STEPS: PatientRequestStatus[] = [
  'pending', 'call_required', 'accepted', 'cancelled',
];

function Timeline({ events }: { events: PatientRequest['events'] }) {
  if (!events.length) return <p className="text-gray-400 text-sm italic">No status history yet.</p>;
  return (
    <ol className="relative border-l-2 border-[#ede0ce] ml-2 space-y-4">
      {events.map((ev, i) => (
        <li key={ev.id} className="ml-5">
          <span className={`absolute -left-[7px] w-3.5 h-3.5 rounded-full border-2 border-white mt-0.5 ${
            i === events.length - 1 ? 'bg-primary-700' : 'bg-[#d9c39e]'
          }`} />
          <div className="flex items-center gap-2 flex-wrap">
            {ev.old_status && (
              <span className="text-xs text-gray-400 line-through">{ev.old_status}</span>
            )}
            {ev.old_status && <span className="text-xs text-gray-400">→</span>}
            <span className="text-sm font-medium text-[#172554] capitalize">{ev.new_status.replace('_', ' ')}</span>
            <span className="text-xs text-gray-400">by {ev.actor_name}</span>
          </div>
          {ev.note && <p className="text-sm text-gray-600 mt-0.5">{ev.note}</p>}
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <FiClock /> {new Date(ev.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ol>
  );
}

export const UserReferralDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<PatientRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    patientRequestsApi.get(Number(id))
      .then(res => setRequest(res.data))
      .catch(() => { toast.error('Request not found or access denied.'); navigate('/user/referrals'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!request) return;
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    setCancelling(true);
    try {
      const res = await patientRequestsApi.cancel(request.id);
      setRequest(res.data);
      toast.success('Request cancelled.');
    } catch {
      toast.error('Could not cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (!request) return null;

  const canCancel = !['accepted', 'rejected', 'cancelled'].includes(request.status);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4 pb-24 md:pb-6">
      {/* Back */}
      <button onClick={() => navigate('/user/referrals')} className="flex items-center gap-1 text-sm text-[#8a7a63] hover:text-primary-700 transition-colors">
        <FiChevronLeft /> My Requests
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 font-mono">#{request.request_code}</p>
            <h1 className="text-xl font-bold text-[#172554] mt-0.5">
              {request.destination_hospital_name}
            </h1>
            <p className="text-sm text-[#8a7a63] flex items-center gap-1 mt-0.5">
              <FiMapPin className="text-xs" /> {request.destination_hospital_district}
            </p>
          </div>
          <PatientRequestStatusBadge status={request.status as PatientRequestStatus} />
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">Service Requested</p>
            <p className="font-medium text-[#172554] flex items-center gap-1">
              <FiActivity className="text-xs text-gray-300" />
              {request.service_name || request.service_name_freetext || 'General Assistance'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Date Submitted</p>
            <p className="font-medium text-[#172554] flex items-center gap-1">
              <FiClock className="text-xs text-gray-300" />
              {new Date(request.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          {request.contact_phone && (
            <div>
              <p className="text-xs text-gray-400">Contact Phone</p>
              <a href={`tel:${request.contact_phone}`} className="font-medium text-primary-700 flex items-center gap-1 hover:underline">
                <FiPhone className="text-xs" /> {request.contact_phone}
              </a>
            </div>
          )}
          {request.patient_age && (
            <div>
              <p className="text-xs text-gray-400">Patient Age</p>
              <p className="font-medium text-[#172554]">{request.patient_age} years</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">Condition Summary</p>
          <p className="text-sm text-[#172554] bg-[#faf6ee] rounded-xl p-3 border border-[#ede0ce]">
            {request.condition_summary}
          </p>
        </div>

        {request.notes && (
          <div>
            <p className="text-xs text-gray-400 mb-1">Additional Notes</p>
            <p className="text-sm text-gray-600 bg-[#faf6ee] rounded-xl p-3 border border-[#ede0ce]">{request.notes}</p>
          </div>
        )}
      </div>

      {/* Hospital response */}
      {request.response_note && (
        <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[#8a7a63] uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <FiAlertCircle /> Hospital Response
          </h2>
          <p className="text-sm text-[#172554]">{request.response_note}</p>
          {request.responded_at && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <FiClock /> {new Date(request.responded_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Status timeline */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">
        <h2 className="text-sm font-semibold text-[#8a7a63] uppercase tracking-wide mb-3">Status History</h2>
        <Timeline events={request.events} />
      </div>

      {/* Next steps */}
      {request.status === 'accepted' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
          <p className="font-semibold mb-1">✓ Your request has been accepted!</p>
          <p>Please proceed to <strong>{request.destination_hospital_name}</strong>. Bring this request code: <span className="font-mono font-bold">{request.request_code}</span></p>
        </div>
      )}
      {request.status === 'call_required' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-semibold mb-1">📞 Hospital requires a call</p>
          <p>Please call <strong>{request.destination_hospital_name}</strong> directly to confirm your visit.</p>
        </div>
      )}
      {request.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">Request was not accepted</p>
          <p>This hospital could not accommodate your request. Please <Link to="/user/hospitals" className="underline font-medium">search for other hospitals</Link>.</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link to={`/user/hospitals/${request.destination_hospital}`}
          className="flex-1 text-center py-2.5 rounded-xl border border-primary-200 text-primary-700 text-sm font-medium hover:bg-primary-50 transition-colors">
          View Hospital
        </Link>
        {canCancel && (
          <button onClick={handleCancel} disabled={cancelling}
            className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {cancelling && <span className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />}
            Cancel Request
          </button>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPhone,
  FiClock,
  FiRefreshCw,
} from 'react-icons/fi';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';

import { referralsApi, hospitalsApi } from '../../lib/api';
import type { Referral, ReferralEvent } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

type ResponseStatus = 'accepted' | 'rejected' | 'call_required';

type Facility = {
  name?: string;
  emergency_contact?: string | null;
  phone?: string | null;
};

type DetailEvent = ReferralEvent & {
  actor_detail?: {
    full_name?: string;
    username?: string;
  } | null;
};

type DetailReferral = Referral & {
  referring_facility_detail?: Facility | null;
  destination_facility_detail?: Facility | null;
  service_detail?: { name?: string } | null;
  gender_display?: string;
  events: DetailEvent[];
};

function displayDate(value?: string | null): string {
  if (!value) return 'Not provided';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not provided';
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function usablePhone(value?: string | null): string {
  if (!value || !/^[+\d\s().-]+$/.test(value)) {
    return '';
  }

  const cleaned = value.replace(/[\s().-]/g, '');

  return /^\+?\d{3,20}$/.test(cleaned) ? cleaned : '';
}

function errorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) {
    return fallback;
  }

  if (!error.response) {
    return 'Cannot reach the server. Check your connection.';
  }

  const { status, data } = error.response;

  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (status === 404) {
    return 'Referral not found or unavailable to your account.';
  }

  if (status === 400 || status === 409) {
    if (data && typeof data === 'object') {
      for (const key of [
        'error',
        'detail',
        'non_field_errors',
        'note',
        'status',
      ]) {
        const value = (data as Record<string, unknown>)[key];

        if (typeof value === 'string') {
          return value;
        }

        if (Array.isArray(value) && typeof value[0] === 'string') {
          return value[0];
        }
      }
    }
  }

  return fallback;
}

export const HARefDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const parsedId =
    id && /^[1-9]\d*$/.test(id) ? Number(id) : NaN;

  const referralId = Number.isSafeInteger(parsedId)
    ? parsedId
    : null;

  const [referral, setReferral] = useState<DetailReferral | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [note, setNote] = useState('');

  const [responding, setResponding] =
    useState<ResponseStatus | null>(null);

  const [calling, setCalling] = useState(false);
  const [mustRefresh, setMustRefresh] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Invalidate requests when the page changes or unmounts.
  const version = useRef(0);

  // Immediate guards prevent duplicate clicks before React rerenders.
  const responseBusy = useRef(false);
  const callBusy = useRef(false);

  useEffect(() => {
    const requestVersion = ++version.current;

    responseBusy.current = false;
    callBusy.current = false;

    setResponding(null);
    setCalling(false);
    setReferral(null);
    setLoadError('');
    setActionMessage('');
    setMustRefresh(false);
    setNote('');

    if (referralId === null) {
      setLoading(false);

      return () => {
        version.current += 1;
      };
    }

    setLoading(true);

    const load = async () => {
      try {
        const response = await referralsApi.get(referralId);

        if (version.current === requestVersion) {
          setReferral(response.data);
        }
      } catch (error) {
        if (version.current === requestVersion) {
          setLoadError(
            errorMessage(
              error,
              'Could not load this referral. Please retry.',
            ),
          );
        }
      } finally {
        if (version.current === requestVersion) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      version.current += 1;
    };
  }, [referralId, reloadKey]);

  const isPending =
    referral?.status === 'pending' ||
    referral?.status === 'call_required';

  const canManage = Boolean(
    referral &&
      user &&
      (
        user.role === 'system_admin' ||
        (
          ['hospital_staff', 'hospital_admin'].includes(user.role) &&
          user.hospital === referral.destination_facility
        )
      ),
  );

  const handleRespond = async (status: ResponseStatus) => {
    if (
      !referral ||
      referral.id !== referralId ||
      !isPending ||
      !canManage ||
      mustRefresh ||
      responseBusy.current
    ) {
      return;
    }

    if (
      status === 'call_required' &&
      referral.status === 'call_required'
    ) {
      return;
    }

    const requestVersion = version.current;
    const targetId = referral.id;

    responseBusy.current = true;
    setResponding(status);
    setActionMessage('');

    try {
      const response = await referralsApi.respond(targetId, {
        status,
        note: note.trim(),
      });

      if (version.current !== requestVersion) {
        return;
      }

      // Update the status immediately after a successful response.
      setReferral(
        response.data?.id === targetId
          ? response.data
          : { ...referral, status },
      );

      setNote('');

      toast.success(
        status === 'call_required'
          ? 'Call requested'
          : `Referral ${status}`,
      );

      // Reload to obtain the latest timeline from the server.
      try {
        const latest = await referralsApi.get(targetId);

        if (version.current === requestVersion) {
          setReferral(latest.data);
        }
      } catch {
        if (version.current === requestVersion) {
          setActionMessage(
            'Your response was saved, but the latest details could not be loaded. Select Refresh.',
          );
          setMustRefresh(true);
        }
      }
    } catch (error) {
      if (version.current !== requestVersion) {
        return;
      }

      setActionMessage(
        `${errorMessage(
          error,
          'Could not confirm that your response was saved.',
        )} Refresh to check the latest status before trying again.`,
      );

      // A failed connection does not prove the server rejected the write.
      setMustRefresh(true);
    } finally {
      if (version.current === requestVersion) {
        responseBusy.current = false;
        setResponding(null);
      }
    }
  };

  const callReferringHospital = async () => {
    if (
      !referral ||
      referral.id !== referralId ||
      callBusy.current
    ) {
      return;
    }

    const requestVersion = version.current;

    callBusy.current = true;
    setCalling(true);

    try {
      const facility = referral.referring_facility_detail;

      let phone =
        usablePhone(facility?.emergency_contact) ||
        usablePhone(facility?.phone);

      if (!phone) {
        const response = await hospitalsApi.get(
          referral.referring_facility,
        );

        phone =
          usablePhone(response.data.emergency_contact) ||
          usablePhone(response.data.phone);
      }

      if (version.current !== requestVersion) {
        return;
      }

      if (phone) {
        window.location.href = `tel:${phone}`;
      } else {
        toast.error(
          'No usable phone number is recorded for this hospital.',
        );
      }
    } catch {
      if (version.current === requestVersion) {
        toast.error(
          'Could not open the hospital contact. Please try again.',
        );
      }
    } finally {
      if (version.current === requestVersion) {
        callBusy.current = false;
        setCalling(false);
      }
    }
  };

  if (referralId === null || loadError) {
    return (
      <div
        className="card mx-auto max-w-3xl text-center"
        role="alert"
      >
        <p className="mb-4 text-gray-700">
          {referralId === null
            ? 'Invalid referral link.'
            : loadError}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/hadmin/referrals" className="btn-secondary">
            <FiArrowLeft /> Back to referrals
          </Link>

          {referralId !== null && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setReloadKey((key) => key + 1)}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (
    loading ||
    !referral ||
    referral.id !== referralId
  ) {
    return (
      <LoadingSpinner text="Loading referral…" fullPage />
    );
  }

  const hasAge =
    referral.patient_age !== null &&
    referral.patient_age !== undefined;

  const gender =
    referral.gender_display ||
    referral.patient_gender_display ||
    (
      {
        m: 'Male',
        f: 'Female',
        other: 'Other',
      } as Record<string, string>
    )[referral.patient_gender] ||
    referral.patient_gender;

  const events = [...(referral.events ?? [])].sort((a, b) => {
    const left = Date.parse(a.created_at);
    const right = Date.parse(b.created_at);

    return (
      (Number.isNaN(left) ? 0 : left) -
        (Number.isNaN(right) ? 0 : right) ||
      a.id - b.id
    );
  });

  return (
    <div className="mx-auto max-w-3xl">
      {/* Navigation */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/hadmin/referrals"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-700"
        >
          <FiArrowLeft /> Back to referrals
        </Link>

        <button
          type="button"
          disabled={Boolean(responding) || calling}
          onClick={() => setReloadKey((key) => key + 1)}
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {actionMessage && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {actionMessage}
        </div>
      )}

      <div className="card mb-4">
        {/* Referral header */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                Referral Details
              </h1>
              <ReferralStatusBadge status={referral.status} />
            </div>

            <p className="text-sm text-gray-500">
              Code:{' '}
              <span className="font-mono font-bold text-gray-700">
                {referral.referral_code}
              </span>
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Created: {displayDate(referral.created_at)}
            </p>
          </div>

          <span
            className={`badge text-sm ${
              referral.urgency === 'emergency'
                ? 'bg-red-100 text-red-700'
                : referral.urgency === 'urgent'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {referral.urgency_display || referral.urgency}
          </span>
        </div>

        {/* Facilities */}
        <div className="mb-4 grid gap-4 rounded-lg border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-gray-500">
              Referring Facility
            </p>

            <p className="font-semibold text-gray-900">
              {referral.referring_facility_detail?.name ||
                referral.referring_facility_name ||
                `Hospital #${referral.referring_facility}`}
            </p>

            <button
              type="button"
              onClick={callReferringHospital}
              disabled={calling}
              className="mt-2 flex items-center gap-1 text-xs text-blue-700 hover:underline disabled:opacity-50"
            >
              <FiPhone />
              {calling ? 'Opening contact…' : 'Call Hospital'}
            </button>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-500">
              Destination Facility
            </p>

            <p className="font-semibold text-gray-900">
              {referral.destination_facility_detail?.name ||
                referral.destination_facility_name ||
                `Hospital #${referral.destination_facility}`}
            </p>
          </div>
        </div>

        {/* Patient information */}
        <div className="mb-4 grid gap-6 border-b border-gray-100 pb-4 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">
              Patient Information
            </h2>

            <div className="space-y-1 text-sm text-gray-700">
              {hasAge && (
                <p>
                  Age: <strong>{referral.patient_age}</strong>
                </p>
              )}

              {gender && (
                <p>
                  Gender: <strong>{gender}</strong>
                </p>
              )}

              {!hasAge && !gender && (
                <p className="text-xs text-gray-500">
                  Not provided
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-gray-700">
              Required Service
            </h2>
            <p className="text-sm text-gray-800">
              {referral.service_detail?.name ||
                referral.service_name ||
                'Not specified'}
            </p>
          </div>
        </div>

        {/* Condition and reason */}
        <div className="mb-4 space-y-3">
          <div>
            <h2 className="mb-1 text-sm font-semibold text-gray-700">
              Patient Condition
            </h2>
            <p className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
              {referral.patient_condition_summary || 'Not provided'}
            </p>
          </div>

          {referral.reason && (
            <div>
              <h2 className="mb-1 text-sm font-semibold text-gray-700">
                Reason for Referral
              </h2>
              <p className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
                {referral.reason}
              </p>
            </div>
          )}
        </div>

        {/* Response actions */}
        {isPending && canManage && (
          <div className="border-t border-gray-100 pt-4">
            <h2 className="section-title">Respond to Referral</h2>

            <div className="form-group">
              <label
                htmlFor="referral-response-note"
                className="label"
              >
                Note (optional)
              </label>

              <textarea
                id="referral-response-note"
                className="input"
                rows={3}
                placeholder="Add a note for the referring hospital…"
                value={note}
                disabled={Boolean(responding)}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRespond('accepted')}
                disabled={Boolean(responding) || mustRefresh}
                className="btn-success disabled:opacity-50"
              >
                {responding === 'accepted'
                  ? 'Accepting…'
                  : 'Accept Referral'}
              </button>

              <button
                type="button"
                onClick={() => handleRespond('rejected')}
                disabled={Boolean(responding) || mustRefresh}
                className="btn-danger disabled:opacity-50"
              >
                {responding === 'rejected'
                  ? 'Rejecting…'
                  : 'Reject Referral'}
              </button>

              <button
                type="button"
                onClick={() => handleRespond('call_required')}
                disabled={
                  Boolean(responding) ||
                  mustRefresh ||
                  referral.status === 'call_required'
                }
                className="btn-secondary disabled:opacity-50"
              >
                <FiPhone />
                {responding === 'call_required'
                  ? 'Requesting…'
                  : referral.status === 'call_required'
                    ? 'Call Already Requested'
                    : 'Request Call'}
              </button>
            </div>
          </div>
        )}

        {isPending && !canManage && (
          <p className="text-sm text-gray-500">
            Only authorized staff for the destination hospital can
            respond.
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="section-title">Referral Timeline</h2>

        <div className="space-y-3">
          {events.length ? (
            events.map((event) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <FiClock />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold capitalize">
                      {event.new_status.replace(/_/g, ' ')}
                    </span>

                    <span className="text-xs text-gray-500">
                      {displayDate(event.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    By{' '}
                    {event.actor_detail?.full_name ||
                      event.actor_detail?.username ||
                      event.actor_name ||
                      (
                        event.actor != null
                          ? `User #${event.actor}`
                          : 'System'
                      )}
                  </p>

                  {event.note && (
                    <p className="mt-1 whitespace-pre-wrap break-words rounded bg-gray-50 p-2 text-sm text-gray-700">
                      {event.note}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No timeline events recorded. Created{' '}
              {displayDate(referral.created_at)}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  FiPhone,
  FiSearch,
  FiRefreshCw,
} from 'react-icons/fi';

import toast from 'react-hot-toast';

import { format, isValid } from 'date-fns';

import {
  referralsApi,
  hospitalsApi,
  patientRequestsApi,
} from '../../lib/api';

import type {
  Referral,
  ReferralStatus,
  PatientRequest,
  PatientRequestStatus,
} from '../../types';

import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';

import { LoadingSpinner } from '../../components/common/LoadingSpinner';

import { useAuthStore } from '../../store/authStore';

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const PAGE_SIZE = 100;

const TABS = [
  {
    key: 'pending',
    label: 'Pending',
  },
  {
    key: 'accepted',
    label: 'Accepted',
  },
  {
    key: 'rejected',
    label: 'Rejected',
  },
  {
    key: '',
    label: 'All',
  },
] as const;

type TabKey = (typeof TABS)[number]['key'];

type ResponseStatus = 'accepted' | 'rejected';

// Top-level page sections: referrals vs patient requests
type PageSection = 'referrals' | 'patient_requests';

const PR_STATUS_COLORS: Record<string, string> = {
  pending:       'bg-yellow-100 text-yellow-800',
  accepted:      'bg-green-100 text-green-700',
  rejected:      'bg-red-100 text-red-700',
  call_required: 'bg-blue-100 text-blue-700',
  cancelled:     'bg-gray-100 text-gray-500',
};

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

const safeString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return '';
};

const formatReferralDate = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (!isValid(date)) {
    return '—';
  }

  return format(date, 'MMM d, yyyy HH:mm');
};

// --------------------------------------------------
// URGENCY BADGE
// --------------------------------------------------

const UrgencyBadge: React.FC<{
  urgency: string | null | undefined;
}> = ({ urgency }) => {
  const styles: Record<string, string> = {
    emergency: 'bg-red-100 text-red-700',

    urgent: 'bg-orange-100 text-orange-700',

    routine: 'bg-gray-100 text-gray-600',
  };

  const normalizedUrgency =
    urgency?.toLowerCase() || 'unknown';

  const badgeStyle =
    styles[normalizedUrgency] ||
    'bg-gray-100 text-gray-600';

  return (
    <span
      className={`badge text-xs ${badgeStyle}`}
    >
      {urgency || 'Unknown'}
    </span>
  );
};

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export const IncomingReferrals: React.FC = () => {
  const { user } = useAuthStore();

  // ------------------------------------------------
  // SECTION STATE (Referrals vs Patient Requests)
  // ------------------------------------------------

  const [pageSection, setPageSection] =
    useState<PageSection>('referrals');

  // ------------------------------------------------
  // PATIENT REQUESTS STATE
  // ------------------------------------------------

  const [patientRequests, setPatientRequests] = useState<PatientRequest[]>([]);
  const [prLoading, setPrLoading] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [prRefreshKey, setPrRefreshKey] = useState(0);
  const [prResponding, setPrResponding] = useState<number | null>(null);
  const prRespondingRef = useRef(false);

  // ------------------------------------------------
  // STATE
  // ------------------------------------------------

  const [referrals, setReferrals] = useState<
    Referral[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [activeTab, setActiveTab] =
    useState<TabKey>('pending');

  const [search, setSearch] = useState('');

  const [responding, setResponding] = useState<
    number | null
  >(null);

  const [calling, setCalling] = useState<
    number | null
  >(null);

  const [rejectingId, setRejectingId] = useState<
    number | null
  >(null);

  const [rejectionNote, setRejectionNote] =
    useState('');

  const [page, setPage] = useState(1);

  const [totalCount, setTotalCount] = useState<
    number | null
  >(null);

  const [hasNextPage, setHasNextPage] =
    useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  // ------------------------------------------------
  // REFS
  // ------------------------------------------------

  const mountedRef = useRef(false);

  const respondingRef = useRef(false);

  // ------------------------------------------------
  // FETCH REFERRALS
  // ------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;

    const fetchReferrals = async () => {
      setLoading(true);

      setError(null);

      try {
        const params: Record<
          string,
          string | number
        > = {
          page,
          page_size: PAGE_SIZE,
        };

        if (activeTab) {
          params.status = activeTab;
        }

        const response = await referralsApi.list(
          params,
        );

        if (cancelled) {
          return;
        }

        const data: unknown = response.data;

        let fetchedReferrals: Referral[] = [];

        let nextPage = false;

        let count: number | null = null;

        // Handle API returning an array directly.

        if (Array.isArray(data)) {
          fetchedReferrals = data as Referral[];

          nextPage = false;
        }

        // Handle Django REST Framework pagination.

        else if (
          data !== null &&
          typeof data === 'object' &&
          'results' in data
        ) {
          const paginatedData = data as {
            results?: unknown;
            next?: unknown;
            previous?: unknown;
            count?: unknown;
          };

          if (
            !Array.isArray(
              paginatedData.results,
            )
          ) {
            throw new Error(
              'Invalid referrals API response',
            );
          }

          fetchedReferrals =
            paginatedData.results as Referral[];

          if (
            typeof paginatedData.count ===
            'number'
          ) {
            count = paginatedData.count;
          }

          if (
            typeof paginatedData.next ===
            'string'
          ) {
            nextPage =
              paginatedData.next.length > 0;
          } else if (count !== null) {
            nextPage =
              page * PAGE_SIZE < count;
          }
        }

        // Unexpected API response.

        else {
          throw new Error(
            'Unexpected referrals API response format',
          );
        }

        if (cancelled) {
          return;
        }

        // If the current page becomes empty after
        // accepting/rejecting referrals, return to
        // the previous page.

        if (
          fetchedReferrals.length === 0 &&
          page > 1
        ) {
          setPage((currentPage) =>
            Math.max(1, currentPage - 1),
          );

          return;
        }

        setReferrals(fetchedReferrals);

        setHasNextPage(nextPage);

        setTotalCount(count);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          'Failed to fetch referrals:',
          err,
        );

        setError(
          'Unable to load referrals. Please try again.',
        );

        setReferrals([]);

        setTotalCount(null);

        setHasNextPage(false);

        toast.error(
          'Failed to load incoming referrals',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchReferrals();

    return () => {
      cancelled = true;

      mountedRef.current = false;
    };
  }, [activeTab, page, refreshKey]);

  // ------------------------------------------------
  // FETCH PATIENT REQUESTS
  // ------------------------------------------------

  useEffect(() => {
    if (!user?.hospital) return;
    let cancelled = false;

    const fetchPR = async () => {
      setPrLoading(true);
      setPrError(null);
      try {
        const res = await patientRequestsApi.list({
          destination_hospital: user.hospital as number,
          page_size: 100,
        });
        if (cancelled) return;
        const data = res.data;
        setPatientRequests(
          Array.isArray(data)
            ? (data as PatientRequest[])
            : (data as { results: PatientRequest[] }).results ?? [],
        );
      } catch {
        if (!cancelled) {
          setPrError('Unable to load patient requests. Please try again.');
          toast.error('Failed to load patient requests');
        }
      } finally {
        if (!cancelled) setPrLoading(false);
      }
    };

    void fetchPR();
    return () => { cancelled = true; };
  }, [user?.hospital, prRefreshKey]);

  const refreshPatientRequests = () => {
    setPrRefreshKey((k) => k + 1);
  };

  const handlePRRespond = async (
    id: number,
    status: PatientRequestStatus,
    note = '',
  ) => {
    if (prRespondingRef.current) return;
    prRespondingRef.current = true;
    setPrResponding(id);
    try {
      await patientRequestsApi.respond(id, { status, note });
      toast.success(
        status === 'accepted'
          ? 'Request accepted'
          : status === 'rejected'
            ? 'Request rejected'
            : 'Call required — patient notified',
      );
      refreshPatientRequests();
    } catch {
      toast.error('Failed to update request status. Please try again.');
    } finally {
      prRespondingRef.current = false;
      setPrResponding(null);
    }
  };

  // ------------------------------------------------
  // REFRESH REFERRALS
  // ------------------------------------------------

  const refreshReferrals = () => {
    setRefreshKey((previous) => previous + 1);
  };

  // ------------------------------------------------
  // CHANGE TAB
  // ------------------------------------------------

  const handleTabChange = (tab: TabKey) => {
    if (tab === activeTab) {
      return;
    }

    setActiveTab(tab);

    setPage(1);

    setSearch('');

    setRejectingId(null);

    setRejectionNote('');

    setReferrals([]);
  };

  // ------------------------------------------------
  // ACCEPT / REJECT REFERRAL
  // ------------------------------------------------

  const handleRespond = async (
    id: number,
    status: ResponseStatus,
    note = '',
  ) => {
    // Prevent duplicate API requests.

    if (respondingRef.current) {
      return;
    }

    // Rejection must have a reason.

    if (
      status === 'rejected' &&
      !note.trim()
    ) {
      toast.error(
        'Please provide a reason for rejection',
      );

      return;
    }

    respondingRef.current = true;

    setResponding(id);

    try {
      await referralsApi.respond(id, {
        status,
        note: note.trim(),
      });

      if (!mountedRef.current) {
        return;
      }

      if (status === 'accepted') {
        toast.success(
          'Referral accepted successfully',
        );
      } else {
        toast.success(
          'Referral rejected successfully',
        );
      }

      // Close rejection form.

      setRejectingId(null);

      setRejectionNote('');

      // Refresh current tab after successful response.

      refreshReferrals();
    } catch (err) {
      console.error(
        'Failed to respond to referral:',
        err,
      );

      if (mountedRef.current) {
        toast.error(
          'Failed to update referral status. Please try again.',
        );
      }
    } finally {
      respondingRef.current = false;

      if (mountedRef.current) {
        setResponding(null);
      }
    }
  };

  // ------------------------------------------------
  // REJECTION FORM
  // ------------------------------------------------

  const openRejectForm = (id: number) => {
    if (respondingRef.current) {
      return;
    }

    setRejectingId(id);

    setRejectionNote('');
  };

  const closeRejectForm = () => {
    if (respondingRef.current) {
      return;
    }

    setRejectingId(null);

    setRejectionNote('');
  };

  const confirmRejection = async (id: number) => {
    const note = rejectionNote.trim();

    if (!note) {
      toast.error(
        'Please enter a rejection reason',
      );

      return;
    }

    await handleRespond(
      id,
      'rejected',
      note,
    );
  };

  // ------------------------------------------------
  // CALL REFERRING HOSPITAL
  // ------------------------------------------------

  const getReferringPhone = async (
    facilityId: unknown,
    referralId: number,
  ) => {
    if (calling !== null) {
      return;
    }

    const hospitalId = Number(facilityId);

    if (
      !Number.isInteger(hospitalId) ||
      hospitalId <= 0
    ) {
      toast.error(
        'Invalid referring hospital ID',
      );

      return;
    }

    setCalling(referralId);

    try {
      const response = await hospitalsApi.get(
        hospitalId,
      );

      const hospital = response.data;

      const rawPhone =
        hospital?.emergency_contact ||
        hospital?.phone;

      if (!rawPhone) {
        toast.error(
          'No contact number available for this hospital',
        );

        return;
      }

      const phone = safeString(rawPhone)
        .trim()
        .replace(/[^\d+]/g, '')
        .replace(/(?!^)\+/g, '');

      if (
        !/^\+?\d{5,15}$/.test(phone)
      ) {
        toast.error(
          'Invalid hospital contact number',
        );

        return;
      }

      window.location.href = `tel:${phone}`;
    } catch (err) {
      console.error(
        'Failed to load hospital contact:',
        err,
      );

      toast.error(
        'Could not load hospital contact information',
      );
    } finally {
      if (mountedRef.current) {
        setCalling(null);
      }
    }
  };

  // ------------------------------------------------
  // SEARCH REFERRALS
  // ------------------------------------------------

  const filteredReferrals = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return referrals;
    }

    return referrals.filter((referral) => {
      const referralCode = safeString(
        referral.referral_code,
      ).toLowerCase();

      const hospitalName = safeString(
        referral.referring_facility_name,
      ).toLowerCase();

      const condition = safeString(
        referral.patient_condition_summary,
      ).toLowerCase();

      const service = safeString(
        referral.service_name,
      ).toLowerCase();

      const urgency = safeString(
        referral.urgency,
      ).toLowerCase();

      const status = safeString(
        referral.status,
      ).toLowerCase();

      return (
        referralCode.includes(query) ||
        hospitalName.includes(query) ||
        condition.includes(query) ||
        service.includes(query) ||
        urgency.includes(query) ||
        status.includes(query)
      );
    });
  }, [referrals, search]);

  // ------------------------------------------------
  // PAGINATION
  // ------------------------------------------------

  const handlePreviousPage = () => {
    if (loading || page <= 1) {
      return;
    }

    setPage((previous) =>
      Math.max(1, previous - 1),
    );

    setRejectingId(null);

    setRejectionNote('');
  };

  const handleNextPage = () => {
    if (loading || !hasNextPage) {
      return;
    }

    setPage((previous) => previous + 1);

    setRejectingId(null);

    setRejectionNote('');
  };

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <div>
      {/* ------------------------------------------
          PAGE HEADER
      ------------------------------------------ */}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">
            Incoming Referrals
          </h1>

          <p className="text-sm text-gray-500">
            Referrals directed to{' '}
            <span className="font-medium">
              {user?.hospital_name ||
                'your hospital'}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={pageSection === 'referrals' ? refreshReferrals : refreshPatientRequests}
          disabled={pageSection === 'referrals' ? loading : prLoading}
          className="btn-secondary btn-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw
            className={
              (pageSection === 'referrals' ? loading : prLoading) ? 'animate-spin' : ''
            }
          />

          Refresh
        </button>
      </div>

      {/* ------------------------------------------
          TOP-LEVEL SECTION TABS
      ------------------------------------------ */}

      <div className="mb-4 flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setPageSection('referrals')}
          className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            pageSection === 'referrals'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Referrals
        </button>
        <button
          type="button"
          onClick={() => setPageSection('patient_requests')}
          className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            pageSection === 'patient_requests'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Patient Requests
        </button>
      </div>

      {/* ------------------------------------------
          PATIENT REQUESTS SECTION
      ------------------------------------------ */}

      {pageSection === 'patient_requests' && (
        <div>
          {prLoading ? (
            <LoadingSpinner text="Loading patient requests..." />
          ) : prError ? (
            <div className="card py-10 text-center">
              <p className="mb-4 text-sm text-red-600">{prError}</p>
              <button type="button" onClick={refreshPatientRequests} className="btn-primary btn-sm">
                Try Again
              </button>
            </div>
          ) : patientRequests.length === 0 ? (
            <div className="card py-10 text-center text-gray-500">
              <div className="mb-3 text-4xl">📩</div>
              <p className="font-medium">No patient requests found</p>
              <p className="mt-1 text-sm text-gray-400">
                Patient requests directed to your hospital will appear here.
              </p>
            </div>
          ) : (
            <div className="card p-0">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Patient</th>
                      <th className="hidden sm:table-cell">Service</th>
                      <th className="hidden sm:table-cell">Condition</th>
                      <th>Status</th>
                      <th className="hidden md:table-cell">Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientRequests.map((pr) => {
                      const isPending = pr.status === 'pending';
                      const isActing = prResponding === pr.id;
                      return (
                        <tr key={pr.id}>
                          <td className="font-mono text-xs font-bold text-gray-700">
                            {pr.request_code || '—'}
                          </td>
                          <td>
                            <div className="text-sm font-medium text-gray-800">{pr.patient_name}</div>
                            {pr.contact_phone && (
                              <div className="text-xs text-gray-500">{pr.contact_phone}</div>
                            )}
                          </td>
                          <td className="hidden text-sm text-gray-600 sm:table-cell">
                            {pr.service_name || pr.service_name_freetext || '—'}
                          </td>
                          <td className="hidden text-sm text-gray-500 sm:table-cell max-w-[180px]">
                            <span className="line-clamp-2">{pr.condition_summary || '—'}</span>
                          </td>
                          <td>
                            <span
                              className={`badge text-xs ${PR_STATUS_COLORS[pr.status] ?? 'bg-gray-100 text-gray-600'}`}
                            >
                              {pr.status_display || pr.status}
                            </span>
                          </td>
                          <td className="hidden text-xs text-gray-500 md:table-cell">
                            {formatReferralDate(pr.created_at)}
                          </td>
                          <td>
                            {isPending && (
                              <div className="flex flex-wrap items-center gap-1">
                                <button
                                  type="button"
                                  disabled={prResponding !== null}
                                  onClick={() => void handlePRRespond(pr.id, 'accepted')}
                                  className="btn-success btn-sm text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isActing ? 'Processing...' : 'Accept'}
                                </button>
                                <button
                                  type="button"
                                  disabled={prResponding !== null}
                                  onClick={() => void handlePRRespond(pr.id, 'call_required')}
                                  className="btn-sm text-xs rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Call Required
                                </button>
                                <button
                                  type="button"
                                  disabled={prResponding !== null}
                                  onClick={() => void handlePRRespond(pr.id, 'rejected')}
                                  className="btn-danger btn-sm text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {!isPending && pr.response_note && (
                              <p className="text-xs text-gray-500 max-w-[180px] line-clamp-2">{pr.response_note}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
                <div className="text-xs text-gray-500">
                  {patientRequests.length} patient{' '}
                  {patientRequests.length === 1 ? 'request' : 'requests'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------
          REFERRALS SECTION (existing)
      ------------------------------------------ */}

      {pageSection === 'referrals' && (
        <div>
          {/* ------------------------------------------
              STATUS TABS
          ------------------------------------------ */}

          <div className="mb-4 flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
          {TABS.map((tab) => (
          <button
            key={tab.key || 'all'}
            type="button"
            onClick={() =>
              handleTabChange(tab.key)
            }
            className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------
          SEARCH
      ------------------------------------------ */}

      <div className="card mb-4">
        <div className="relative">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />

          <input
            type="search"
            className="input pl-9"
            placeholder="Search by code, hospital, service or condition..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Search incoming referrals"
          />
        </div>

        <p className="mt-2 text-xs text-gray-400">
          Search filters referrals on the current page.
        </p>
      </div>

      {/* ------------------------------------------
          LOADING STATE
      ------------------------------------------ */}

      {loading ? (
        <LoadingSpinner
          text="Loading incoming referrals..."
        />
      ) : error ? (
        /* ----------------------------------------
           ERROR STATE
        ---------------------------------------- */

        <div className="card py-10 text-center">
          <p className="mb-4 text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={refreshReferrals}
            className="btn-primary btn-sm"
          >
            Try Again
          </button>
        </div>
      ) : filteredReferrals.length === 0 ? (
        /* ----------------------------------------
           EMPTY STATE
        ---------------------------------------- */

        <div className="card py-10 text-center text-gray-500">
          <div className="mb-3 text-4xl">
            📋
          </div>

          <p className="font-medium">
            {search.trim()
              ? 'No matching referrals found'
              : activeTab
                ? `No ${activeTab} referrals found`
                : 'No referrals found'}
          </p>

          <p className="mt-1 text-sm text-gray-400">
            {search.trim()
              ? 'Try a different search term.'
              : 'Referrals directed to your hospital will appear here.'}
          </p>
        </div>
      ) : (
        /* ----------------------------------------
           REFERRALS TABLE
        ---------------------------------------- */

        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>

                  <th>From Hospital</th>

                  <th className="hidden sm:table-cell">
                    Service
                  </th>

                  <th>Urgency</th>

                  <th>Status</th>

                  <th className="hidden md:table-cell">
                    Date
                  </th>

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReferrals.map(
                  (referral) => {
                    const isResponding =
                      responding === referral.id;

                    const isCalling =
                      calling === referral.id;

                    const isPending =
                      referral.status ===
                      'pending';

                    const showRejectForm =
                      rejectingId ===
                      referral.id;

                    return (
                      <tr key={referral.id}>
                        {/* REFERRAL CODE */}

                        <td className="font-mono text-xs font-bold text-gray-700">
                          {referral.referral_code ||
                            '—'}
                        </td>

                        {/* REFERRING HOSPITAL */}

                        <td>
                          <div className="text-sm font-medium text-gray-800">
                            {referral.referring_facility_name ||
                              'Unknown hospital'}
                          </div>

                          <div
                            className="hidden max-w-[150px] truncate text-xs text-gray-500 sm:block"
                            title={
                              referral.patient_condition_summary ||
                              ''
                            }
                          >
                            {referral.patient_condition_summary ||
                              'No condition summary'}
                          </div>
                        </td>

                        {/* SERVICE */}

                        <td className="hidden text-sm text-gray-600 sm:table-cell">
                          {referral.service_name ||
                            '—'}
                        </td>

                        {/* URGENCY */}

                        <td>
                          <UrgencyBadge
                            urgency={
                              referral.urgency
                            }
                          />
                        </td>

                        {/* STATUS */}

                        <td>
                          <ReferralStatusBadge
                            status={
                              referral.status as ReferralStatus
                            }
                          />
                        </td>

                        {/* CREATED DATE */}

                        <td className="hidden text-xs text-gray-500 md:table-cell">
                          {formatReferralDate(
                            referral.created_at,
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="flex flex-wrap items-center gap-1">
                            {/* VIEW */}

                            <Link
                              to={`/hadmin/referrals/${referral.id}`}
                              className="btn-secondary btn-sm text-xs"
                            >
                              View
                            </Link>

                            {/* PENDING REFERRAL ACTIONS */}

                            {isPending && (
                              <>
                                {/* ACCEPT */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleRespond(
                                      referral.id,
                                      'accepted',
                                    )
                                  }
                                  disabled={
                                    responding !==
                                    null
                                  }
                                  className="btn-success btn-sm text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isResponding
                                    ? 'Processing...'
                                    : 'Accept'}
                                </button>

                                {/* REJECT */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    openRejectForm(
                                      referral.id,
                                    )
                                  }
                                  disabled={
                                    responding !==
                                    null
                                  }
                                  className="btn-danger btn-sm text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Reject
                                </button>

                                {/* CALL */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    void getReferringPhone(
                                      referral.referring_facility,
                                      referral.id,
                                    )
                                  }
                                  disabled={
                                    isCalling ||
                                    calling !==
                                      null
                                  }
                                  className="btn-sm flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <FiPhone
                                    className="text-xs"
                                    aria-hidden="true"
                                  />

                                  {isCalling
                                    ? 'Loading...'
                                    : 'Call'}
                                </button>
                              </>
                            )}
                          </div>

                          {/* ------------------------
                              REJECTION NOTE FORM
                          ------------------------ */}

                          {isPending &&
                            showRejectForm && (
                              <div className="mt-3 min-w-[220px] rounded-lg border border-red-200 bg-red-50 p-3">
                                <p className="mb-2 text-xs font-medium text-red-700">
                                  Reason for rejection
                                </p>

                                <textarea
                                  value={
                                    rejectionNote
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setRejectionNote(
                                      event.target
                                        .value,
                                    )
                                  }
                                  placeholder="Enter rejection reason..."
                                  rows={3}
                                  maxLength={500}
                                  disabled={
                                    isResponding
                                  }
                                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-red-400 focus:outline-none"
                                  aria-label="Rejection reason"
                                />

                                <div className="mt-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void confirmRejection(
                                        referral.id,
                                      )
                                    }
                                    disabled={
                                      isResponding ||
                                      !rejectionNote.trim()
                                    }
                                    className="btn-danger btn-sm text-xs disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isResponding
                                      ? 'Rejecting...'
                                      : 'Confirm Reject'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      closeRejectForm
                                    }
                                    disabled={
                                      isResponding
                                    }
                                    className="btn-secondary btn-sm text-xs disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          {/* --------------------------------------
              TABLE FOOTER
          -------------------------------------- */}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
            <div className="text-xs text-gray-500">
              Showing{' '}
              {filteredReferrals.length}{' '}
              {filteredReferrals.length === 1
                ? 'referral'
                : 'referrals'}

              {totalCount !== null &&
                !search.trim() && (
                  <>
                    {' '}
                    of {totalCount}
                  </>
                )}
            </div>

            {/* PAGINATION */}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={
                  handlePreviousPage
                }
                disabled={
                  page <= 1 || loading
                }
                className="btn-secondary btn-sm text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-xs text-gray-500">
                Page {page}
              </span>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={
                  !hasNextPage ||
                  loading
                }
                className="btn-secondary btn-sm text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};

export default IncomingReferrals;
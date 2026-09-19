import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  FiSearch,
  FiRefreshCw,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

import toast from 'react-hot-toast';

import { format, isValid } from 'date-fns';

import { referralsApi } from '../../lib/api';

import type {
  Referral,
  ReferralStatus,
} from '../../types';

import { ReferralStatusBadge } from '../../components/common/ReferralStatusBadge';

import { LoadingSpinner } from '../../components/common/LoadingSpinner';

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const API_PAGE_SIZE = 100;

const TABLE_PAGE_SIZE = 20;

const ALL_STATUSES = [
  '',
  'pending',
  'accepted',
  'rejected',
  'call_required',
  'patient_sent',
  'patient_arrived',
  'cancelled',
] as const;

const URGENCIES = [
  '',
  'emergency',
  'urgent',
  'routine',
] as const;

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

const safeText = (value: unknown): string => {
  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value);
  }

  return '';
};

const formatDate = (value: unknown): string => {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    return '—';
  }

  const date = new Date(value);

  if (!isValid(date)) {
    return '—';
  }

  try {
    return format(date, 'MMM d, yyyy');
  } catch {
    return '—';
  }
};

const formatLabel = (value: string): string => {
  if (!value) return '';

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// --------------------------------------------------
// API RESPONSE TYPE
// --------------------------------------------------

interface PaginatedReferralResponse {
  results: Referral[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

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

  const normalizedUrgency = safeText(urgency)
    .toLowerCase();

  const badgeStyle =
    styles[normalizedUrgency] ??
    'bg-gray-100 text-gray-600';

  return (
    <span
      className={`badge text-xs ${badgeStyle}`}
    >
      {formatLabel(urgency || 'Unknown')}
    </span>
  );
};

// --------------------------------------------------
// REFERRAL HISTORY COMPONENT
// --------------------------------------------------

export const ReferralHistory: React.FC = () => {
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

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [urgencyFilter, setUrgencyFilter] =
    useState('');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [refreshKey, setRefreshKey] =
    useState(0);

  // ------------------------------------------------
  // LOAD ALL REFERRAL HISTORY
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchReferralHistory = async () => {
      setLoading(true);

      setError(null);

      try {
        const allReferrals: Referral[] = [];

        const seenPages = new Set<string>();

        let apiPage = 1;

        let hasMorePages = true;

        /*
         * Fetch all pages so that searching and
         * filtering work across the entire history,
         * not just the first 100 or 200 referrals.
         *
         * Supports a direct array response and
         * standard Django REST Framework
         * page-number pagination.
         */

        while (hasMorePages) {
          const response = await referralsApi.list({
            page: apiPage,
            page_size: API_PAGE_SIZE,
          });

          if (cancelled) {
            return;
          }

          const data: unknown = response.data;

          let pageReferrals: Referral[] = [];

          let nextPage = false;

          // API returns a direct array.

          if (Array.isArray(data)) {
            pageReferrals = data as Referral[];

            nextPage = false;
          }

          // API returns a paginated response.

          else if (
            data !== null &&
            typeof data === 'object' &&
            'results' in data
          ) {
            const paginatedData =
              data as PaginatedReferralResponse;

            if (
              !Array.isArray(
                paginatedData.results,
              )
            ) {
              throw new Error(
                'Invalid referral history response',
              );
            }

            pageReferrals = paginatedData.results;

            /*
             * Standard DRF pagination provides
             * a next URL while more pages exist.
             */

            if (
              typeof paginatedData.next ===
              'string'
            ) {
              nextPage =
                paginatedData.next.length > 0;
            }

            /*
             * Some custom APIs return count
             * without a next URL.
             */

            else if (
              paginatedData.next === undefined &&
              typeof paginatedData.count ===
                'number'
            ) {
              nextPage =
                allReferrals.length +
                  pageReferrals.length <
                paginatedData.count;
            }
          }

          // Unexpected API response.

          else {
            throw new Error(
              'Unexpected referral history response format',
            );
          }

          /*
           * Prevent an infinite loop if the API
           * ignores the page parameter and keeps
           * returning the same results.
           */

          const pageSignature = JSON.stringify(
            pageReferrals.map(
              (referral) => referral.id,
            ),
          );

          if (
            pageReferrals.length > 0 &&
            seenPages.has(pageSignature)
          ) {
            throw new Error(
              'The referral API returned a repeated page. Please check backend pagination.',
            );
          }

          if (pageReferrals.length > 0) {
            seenPages.add(pageSignature);
          }

          allReferrals.push(...pageReferrals);

          if (
            pageReferrals.length === 0 &&
            nextPage
          ) {
            throw new Error(
              'The referral API returned an empty page but indicated more results.',
            );
          }

          hasMorePages = nextPage;

          apiPage += 1;
        }

        if (cancelled) {
          return;
        }

        setReferrals(allReferrals);

        setCurrentPage(1);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          'Failed to load referral history:',
          err,
        );

        setError(
          'Unable to load referral history. Please try again.',
        );

        setReferrals([]);

        toast.error(
          'Failed to load referral history',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchReferralHistory();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // ------------------------------------------------
  // REFRESH FUNCTION
  // ------------------------------------------------

  const refreshHistory = () => {
    setRefreshKey((previous) => previous + 1);
  };

  // ------------------------------------------------
  // CLEAR ALL FILTERS
  // ------------------------------------------------

  const clearFilters = () => {
    setSearch('');

    setStatusFilter('');

    setUrgencyFilter('');

    setCurrentPage(1);
  };

  // ------------------------------------------------
  // SEARCH AND FILTER
  // ------------------------------------------------

  const filteredReferrals = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return referrals.filter((referral) => {
      // Status filter.

      const matchesStatus =
        !statusFilter ||
        referral.status === statusFilter;

      // Urgency filter.

      const matchesUrgency =
        !urgencyFilter ||
        referral.urgency === urgencyFilter;

      // Search filter.

      const searchableFields = [
        referral.referral_code,
        referral.referring_facility_name,
        referral.patient_condition_summary,
        referral.service_name,
        referral.urgency,
        referral.status,
      ];

      const matchesSearch =
        !query ||
        searchableFields.some((value) =>
          safeText(value)
            .toLowerCase()
            .includes(query),
        );

      return (
        matchesStatus &&
        matchesUrgency &&
        matchesSearch
      );
    });
  }, [
    referrals,
    search,
    statusFilter,
    urgencyFilter,
  ]);

  // ------------------------------------------------
  // PAGINATION
  // ------------------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReferrals.length /
        TABLE_PAGE_SIZE,
    ),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const startIndex =
    (safeCurrentPage - 1) * TABLE_PAGE_SIZE;

  const endIndex =
    startIndex + TABLE_PAGE_SIZE;

  const paginatedReferrals = useMemo(() => {
    return filteredReferrals.slice(
      startIndex,
      endIndex,
    );
  }, [
    filteredReferrals,
    startIndex,
    endIndex,
  ]);

  const handlePreviousPage = () => {
    setCurrentPage((previous) =>
      Math.max(1, previous - 1),
    );
  };

  const handleNextPage = () => {
    setCurrentPage((previous) =>
      Math.min(totalPages, previous + 1),
    );
  };

  const showingFrom =
    filteredReferrals.length === 0
      ? 0
      : startIndex + 1;

  const showingTo = Math.min(
    endIndex,
    filteredReferrals.length,
  );

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(statusFilter) ||
    Boolean(urgencyFilter);

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
            Referral History
          </h1>

          <p className="text-sm text-gray-500">
            All incoming referrals — search and
            filter below
          </p>
        </div>

        {/* REFRESH BUTTON */}

        <button
          type="button"
          onClick={refreshHistory}
          disabled={loading}
          className="btn-secondary btn-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw
            className={
              loading ? 'animate-spin' : ''
            }
          />

          Refresh
        </button>
      </div>

      {/* ------------------------------------------
          FILTERS
      ------------------------------------------ */}

      <div className="card mb-4 flex flex-col gap-3 sm:flex-row">
        {/* SEARCH INPUT */}

        <div className="relative flex-1">
          <FiSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />

          <input
            type="search"
            className="input pl-9"
            placeholder="Search by code, hospital, condition..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);

              setCurrentPage(1);
            }}
            aria-label="Search referral history"
          />
        </div>

        {/* STATUS FILTER */}

        <select
          className="input sm:w-40"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(
              event.target.value,
            );

            setCurrentPage(1);
          }}
          aria-label="Filter by referral status"
        >
          {ALL_STATUSES.map((status) => (
            <option
              key={status || 'all'}
              value={status}
            >
              {status
                ? formatLabel(status)
                : 'All statuses'}
            </option>
          ))}
        </select>

        {/* URGENCY FILTER */}

        <select
          className="input sm:w-36"
          value={urgencyFilter}
          onChange={(event) => {
            setUrgencyFilter(
              event.target.value,
            );

            setCurrentPage(1);
          }}
          aria-label="Filter by urgency"
        >
          {URGENCIES.map((urgency) => (
            <option
              key={urgency || 'all'}
              value={urgency}
            >
              {urgency
                ? formatLabel(urgency)
                : 'All urgency'}
            </option>
          ))}
        </select>

        {/* CLEAR FILTERS */}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="btn-secondary btn-sm flex items-center justify-center gap-1 whitespace-nowrap"
          >
            <FiX />

            Clear
          </button>
        )}
      </div>

      {/* ------------------------------------------
          LOADING STATE
      ------------------------------------------ */}

      {loading ? (
        <LoadingSpinner
          text="Loading referral history..."
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
            onClick={refreshHistory}
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
            No referrals found
          </p>

          <p className="mt-1 text-sm text-gray-400">
            {hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'No referral history is available yet.'}
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn-secondary btn-sm mt-4"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        /* ----------------------------------------
           REFERRAL HISTORY TABLE
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

                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedReferrals.map(
                  (referral) => (
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
                          className="hidden max-w-[140px] truncate text-xs text-gray-400 sm:block"
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

                      {/* DATE */}

                      <td className="hidden text-xs text-gray-500 md:table-cell">
                        {formatDate(
                          referral.created_at,
                        )}
                      </td>

                      {/* VIEW DETAILS */}

                      <td>
                        <Link
                          to={`/hadmin/referrals/${referral.id}`}
                          className="btn-secondary btn-sm text-xs"
                          aria-label={`View referral ${
                            referral.referral_code ||
                            referral.id
                          }`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {/* --------------------------------------
              TABLE FOOTER
          -------------------------------------- */}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
            {/* REFERRAL COUNT */}

            <div className="text-xs text-gray-500">
              Showing {showingFrom}–
              {showingTo} of{' '}
              {filteredReferrals.length}{' '}
              {filteredReferrals.length === 1
                ? 'referral'
                : 'referrals'}
            </div>

            {/* PAGINATION CONTROLS */}

            <div className="flex items-center gap-2">
              {/* PREVIOUS */}

              <button
                type="button"
                onClick={
                  handlePreviousPage
                }
                disabled={
                  safeCurrentPage <= 1
                }
                className="btn-secondary btn-sm flex items-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiChevronLeft />

                Previous
              </button>

              {/* CURRENT PAGE */}

              <span className="whitespace-nowrap text-xs text-gray-500">
                Page {safeCurrentPage} of{' '}
                {totalPages}
              </span>

              {/* NEXT */}

              <button
                type="button"
                onClick={
                  handleNextPage
                }
                disabled={
                  safeCurrentPage >=
                  totalPages
                }
                className="btn-secondary btn-sm flex items-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next

                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralHistory;
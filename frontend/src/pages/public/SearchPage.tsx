import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useSearchParams,
  Link,
} from 'react-router-dom';

import {
  FiSearch,
  FiMapPin,
  FiPhone,
  FiChevronRight,
  FiClock,
  FiShield,
  FiHeart,
  FiUsers,
  FiRefreshCw,
  FiX,
  FiChevronLeft,
} from 'react-icons/fi';

import {
  hospitalsApi,
  servicesApi,
} from '../../lib/api';

import type {
  HospitalListItem,
  Service,
} from '../../types';

import { StatusBadge } from '../../components/common/StatusBadge';

import { FreshnessTag } from '../../components/common/FreshnessTag';

import {
  LoadingSpinner,
  EmptyState,
} from '../../components/common/LoadingSpinner';

import {
  format,
  isValid,
} from 'date-fns';

import heroImage from './images/hero.png';

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const PAGE_SIZE = 12;

const NEPAL_DISTRICTS = [
  'Achham',
  'Arghakhanchi',
  'Baglung',
  'Baitadi',
  'Bajhang',
  'Bajura',
  'Banke',
  'Bara',
  'Bardiya',
  'Bhaktapur',
  'Bhojpur',
  'Chitwan',
  'Dadeldhura',
  'Dailekh',
  'Dang',
  'Darchula',
  'Dhading',
  'Dhankuta',
  'Dhanusha',
  'Dolakha',
  'Dolpa',
  'Doti',
  'Gorkha',
  'Gulmi',
  'Humla',
  'Ilam',
  'Jajarkot',
  'Jhapa',
  'Jumla',
  'Kailali',
  'Kalikot',
  'Kanchanpur',
  'Kapilvastu',
  'Kaski',
  'Kathmandu',
  'Kavrepalanchok',
  'Khotang',
  'Lalitpur',
  'Lamjung',
  'Mahottari',
  'Makwanpur',
  'Manang',
  'Morang',
  'Mugu',
  'Mustang',
  'Myagdi',
  'Nawalpur',
  'Nuwakot',
  'Okhaldhunga',
  'Palpa',
  'Panchthar',
  'Parasi',
  'Parbat',
  'Parsa',
  'Pyuthan',
  'Ramechhap',
  'Rasuwa',
  'Rautahat',
  'Rolpa',
  'Rukum East',
  'Rukum West',
  'Rupandehi',
  'Salyan',
  'Sankhuwasabha',
  'Saptari',
  'Sarlahi',
  'Sindhuli',
  'Sindhupalchok',
  'Siraha',
  'Solukhumbu',
  'Sunsari',
  'Surkhet',
  'Syangja',
  'Tanahun',
  'Taplejung',
  'Terhathum',
  'Udayapur',
];

const POPULAR_SERVICES = [
  'ICU',
  'Cardiology',
  'Dialysis',
  'MRI',
  'CT Scan',
  'Maternity',
  'NICU',
];

// --------------------------------------------------
// TYPES
// --------------------------------------------------

interface PaginatedResponse<T> {
  results: T[];
  count?: number;
  next?: string | null;
}

interface BedInformation {
  label: string;
  count: number;
}

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

  return format(date, 'MMM d, HH:mm');
};

const formatPhone = (value: unknown): string | null => {
  const phone = safeText(value)
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '');

  if (!/^\+?\d{5,15}$/.test(phone)) {
    return null;
  }

  return phone;
};

const getPageNumber = (value: string | null): number => {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1
  ) {
    return 1;
  }

  return parsed;
};

const parseListResponse = <T,>(
  data: unknown,
): {
  results: T[];
  count: number | null;
  hasNext: boolean;
  paginated: boolean;
} => {
  // Supports APIs returning an array directly.

  if (Array.isArray(data)) {
    return {
      results: data as T[],
      count: data.length,
      hasNext: false,
      paginated: false,
    };
  }

  // Supports Django REST Framework pagination.

  if (
    data !== null &&
    typeof data === 'object' &&
    'results' in data
  ) {
    const response = data as PaginatedResponse<T>;

    if (!Array.isArray(response.results)) {
      throw new Error(
        'Invalid API response: results must be an array.',
      );
    }

    const count =
      typeof response.count === 'number' &&
      Number.isFinite(response.count)
        ? response.count
        : null;

    return {
      results: response.results,
      count,
      hasNext:
        typeof response.next === 'string' &&
        response.next.length > 0,
      paginated: true,
    };
  }

  throw new Error(
    'Unexpected API response format.',
  );
};

// --------------------------------------------------
// AVAILABILITY HELPERS
// --------------------------------------------------

const getActiveAvailability = (
  hospital: HospitalListItem,
) => {
  if (!Array.isArray(hospital.availability)) {
    return [];
  }

  return hospital.availability.filter(
    (availability) => availability.is_active === true,
  );
};

const getTopAvailability = (
  hospital: HospitalListItem,
) => {
  return getActiveAvailability(hospital).slice(0, 3);
};

const getRelevantAvailability = (
  hospital: HospitalListItem,
  serviceQuery: string,
) => {
  const active = getActiveAvailability(hospital);

  const query = serviceQuery.trim().toLowerCase();

  if (!query) {
    return active.slice(0, 3);
  }

  const matching = active.filter((availability) => {
    const serviceName = safeText(
      availability.service_name,
    ).toLowerCase();

    const availabilityType = safeText(
      availability.availability_type,
    ).toLowerCase();

    const availabilityLabel = safeText(
      availability.availability_type_display,
    ).toLowerCase();

    return (
      serviceName.includes(query) ||
      availabilityType.includes(query) ||
      availabilityLabel.includes(query)
    );
  });

  // Do not display unrelated resources as though
  // they were availability for the searched service.

  return matching.slice(0, 3);
};

const getBedInformation = (
  hospital: HospitalListItem,
): BedInformation | null => {
  const active = getActiveAvailability(hospital);

  const bedRecords = active.filter((availability) => {
    const type = safeText(
      availability.availability_type,
    ).toLowerCase();

    return (
      type.includes('bed') &&
      availability.available_count !== null &&
      availability.available_count !== undefined
    );
  });

  if (bedRecords.length === 0) {
    return null;
  }

  // Prefer a general bed record when one exists.
  // Keep the record's actual type in the displayed
  // label instead of calling every count total beds.

  const bedRecord =
    bedRecords.find((record) => {
      const type = safeText(
        record.availability_type,
      ).toLowerCase();

      return [
        'bed',
        'beds',
        'general_bed',
        'general_beds',
      ].includes(type);
    }) || bedRecords[0];

  const count = Number(bedRecord.available_count);

  if (
    !Number.isFinite(count) ||
    count < 0
  ) {
    return null;
  }

  return {
    label:
      safeText(
        bedRecord.availability_type_display,
      ) ||
      safeText(bedRecord.availability_type)
        .replace(/_/g, ' '),

    count,
  };
};

const getLatestUpdate = (
  hospital: HospitalListItem,
): string | null => {
  const availability = getActiveAvailability(hospital);

  let latestTimestamp = -Infinity;

  for (const record of availability) {
    if (!record.updated_at) {
      continue;
    }

    const date = new Date(record.updated_at);

    if (!isValid(date)) {
      continue;
    }

    latestTimestamp = Math.max(
      latestTimestamp,
      date.getTime(),
    );
  }

  if (!Number.isFinite(latestTimestamp)) {
    return null;
  }

  return formatDate(latestTimestamp);
};

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export const SearchPage: React.FC = () => {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  // ------------------------------------------------
  // URL PARAMETERS
  // ------------------------------------------------

  const serviceQ =
    searchParams.get('service')?.trim() || '';

  const districtQ =
    searchParams.get('district')?.trim() || '';

  const currentPage = getPageNumber(
    searchParams.get('page'),
  );

  // ------------------------------------------------
  // STATE
  // ------------------------------------------------

  const [hospitals, setHospitals] = useState<
    HospitalListItem[]
  >([]);

  const [services, setServices] = useState<
    Service[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<
    string | null
  >(null);

  const [total, setTotal] = useState<
    number | null
  >(null);

  const [hasNextPage, setHasNextPage] =
    useState(false);

  const [totalPages, setTotalPages] =
    useState(1);

  const [searchInput, setSearchInput] =
    useState(serviceQ);

  const [districtInput, setDistrictInput] =
    useState(districtQ);

  const [refreshKey, setRefreshKey] =
    useState(0);

  // ------------------------------------------------
  // SYNCHRONIZE INPUTS WITH URL
  // ------------------------------------------------

  useEffect(() => {
    setSearchInput(serviceQ);
    setDistrictInput(districtQ);
  }, [serviceQ, districtQ]);

  // ------------------------------------------------
  // LOAD HOSPITALS
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchHospitals = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string> = {
          page: String(currentPage),
          page_size: String(PAGE_SIZE),
        };

        if (serviceQ) {
          params.service = serviceQ;
        }

        if (districtQ) {
          params.district = districtQ;
        }

        const response = await hospitalsApi.list(params);

        if (cancelled) {
          return;
        }

        const result =
          parseListResponse<HospitalListItem>(
            response.data,
          );

        let fetchedHospitals = result.results;

        let nextPage = result.hasNext;

        let count = result.count;

        let pages = 1;

        // Handle an API returning a complete
        // unpaginated array.

        if (!result.paginated) {
          pages = Math.max(
            1,
            Math.ceil(
              fetchedHospitals.length / PAGE_SIZE,
            ),
          );

          const start =
            (currentPage - 1) * PAGE_SIZE;

          fetchedHospitals =
            fetchedHospitals.slice(
              start,
              start + PAGE_SIZE,
            );

          nextPage = currentPage < pages;
        } else {
          // Standard DRF pagination.

          if (count !== null) {
            pages = Math.max(
              1,
              Math.ceil(count / PAGE_SIZE),
            );

            nextPage =
              result.hasNext ||
              currentPage < pages;
          }
        }

        if (cancelled) {
          return;
        }

        setHospitals(fetchedHospitals);

        setTotal(count);

        setTotalPages(pages);

        setHasNextPage(nextPage);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          'Failed to load hospitals:',
          err,
        );

        setHospitals([]);

        setTotal(null);

        setTotalPages(1);

        setHasNextPage(false);

        setError(
          'Unable to load hospitals. Please check your connection and try again.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchHospitals();

    // Prevent previous searches from overwriting
    // results from a newer search.

    return () => {
      cancelled = true;
    };
  }, [
    serviceQ,
    districtQ,
    currentPage,
    refreshKey,
  ]);

  // ------------------------------------------------
  // LOAD SERVICE SUGGESTIONS
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchServices = async () => {
      try {
        const response = await servicesApi.list();

        if (cancelled) {
          return;
        }

        const result = parseListResponse<Service>(
          response.data,
        );

        setServices(result.results);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          'Failed to load service suggestions:',
          err,
        );

        setServices([]);
      }
    };

    void fetchServices();

    return () => {
      cancelled = true;
    };
  }, []);

  // ------------------------------------------------
  // UPDATE SEARCH PARAMETERS
  // ------------------------------------------------

  const updateSearch = (
    service: string,
    district: string,
    page = 1,
  ) => {
    const params: Record<string, string> = {};

    const cleanService = service.trim();

    const cleanDistrict = district.trim();

    if (cleanService) {
      params.service = cleanService;
    }

    if (cleanDistrict) {
      params.district = cleanDistrict;
    }

    if (page > 1) {
      params.page = String(page);
    }

    setSearchParams(params);
  };

  // ------------------------------------------------
  // SEARCH
  // ------------------------------------------------

  const handleSearch = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    updateSearch(
      searchInput,
      districtInput,
      1,
    );
  };

  // ------------------------------------------------
  // QUICK SERVICE
  // ------------------------------------------------

  const handleQuickService = (
    serviceName: string,
  ) => {
    setSearchInput(serviceName);

    updateSearch(
      serviceName,
      districtInput,
      1,
    );
  };

  // ------------------------------------------------
  // CLEAR FILTERS
  // ------------------------------------------------

  const clearAllFilters = () => {
    setSearchInput('');

    setDistrictInput('');

    setSearchParams({});
  };

  // ------------------------------------------------
  // REFRESH
  // ------------------------------------------------

  const refreshHospitals = () => {
    setRefreshKey((previous) => previous + 1);
  };

  // ------------------------------------------------
  // PAGINATION
  // ------------------------------------------------

  const goToPage = (page: number) => {
    if (
      loading ||
      page < 1 ||
      page === currentPage
    ) {
      return;
    }

    updateSearch(
      serviceQ,
      districtQ,
      page,
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ------------------------------------------------
  // SERVICE SUGGESTIONS
  // ------------------------------------------------

  const serviceSuggestions = useMemo(() => {
    const names = [
      ...POPULAR_SERVICES,
      ...services.map((service) => service.name),
    ];

    return [...new Set(names)].filter(Boolean);
  }, [services]);

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f8f4eb]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* ----------------------------------------
            HERO SECTION
        ---------------------------------------- */}

        <section className="relative mb-9 overflow-hidden rounded-[30px] border border-[#dfd1b5] shadow-[0_18px_45px_rgba(78,58,26,0.12)] md:min-h-[450px]">

          {/* HERO IMAGE */}

          <div
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundPosition: '72% 35%',
            }}
          />

          {/* LEFT OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-r from-[#faedd6] via-[#f7ead3]/75 to-transparent" />

          {/* BOTTOM OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#d8cbb3]/30 via-transparent to-transparent" />

          {/* HERO CONTENT */}

          <div className="relative z-10 px-7 pb-8 pt-10 md:px-11 md:pb-[205px] md:pt-11">
            <div className="max-w-[610px]">

              <h1 className="text-[39px] font-bold leading-[0.98] tracking-[-0.035em] text-[#13295b] sm:text-[48px] lg:text-[58px]">
                Find the right care

                <span className="block text-[#08606a]">
                  before you travel.
                </span>
              </h1>

              <p className="mt-5 max-w-[520px] text-[15px] leading-6 text-[#3f4851] md:text-base">
                Search hospitals by treatment,
                services, bed availability and
                specialist availability across Nepal.
              </p>

              {/* BENEFITS */}

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#4b4e47]">

                <span className="flex items-center gap-2">
                  <FiShield className="text-[#c08c2d]" />
                  Hospital-reported availability
                </span>

                <span className="flex items-center gap-2">
                  <FiUsers className="text-[#c08c2d]" />
                  Hospital information
                </span>

                <span className="flex items-center gap-2">
                  <FiHeart className="text-[#c08c2d]" />
                  Check before referral
                </span>

              </div>

            </div>
          </div>

          {/* --------------------------------------
              SEARCH PANEL
          -------------------------------------- */}

          <div className="relative z-20 mx-4 mb-5 mt-5 md:absolute md:bottom-5 md:left-8 md:right-8 md:m-0">

            <div className="rounded-[22px] border border-white/60 bg-gradient-to-r from-[#f7eee0]/95 via-[#aabfba]/95 to-[#08616b]/95 p-4 shadow-[0_14px_35px_rgba(25,59,62,0.25)] backdrop-blur-md">

              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1.5fr_0.8fr_auto]"
              >

                {/* SERVICE SEARCH */}

                <div>
                  <label
                    htmlFor="hospital-service-search"
                    className="mb-1.5 block text-[11px] font-semibold text-[#334155]"
                  >
                    What service do you need?
                  </label>

                  <div className="relative">

                    <FiSearch
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />

                    <input
                      id="hospital-service-search"
                      type="search"
                      value={searchInput}
                      onChange={(event) =>
                        setSearchInput(
                          event.target.value,
                        )
                      }
                      list="hospital-service-options"
                      placeholder="e.g. ICU, Dialysis, Cardiology, Maternity..."
                      className="h-11 w-full rounded-lg border border-white/80 bg-white/95 pl-9 pr-3 text-sm text-gray-800 shadow-sm outline-none focus:border-[#0c6670] focus:ring-2 focus:ring-[#0c6670]/20"
                    />

                    <datalist id="hospital-service-options">
                      {serviceSuggestions.map(
                        (service) => (
                          <option
                            key={service}
                            value={service}
                          />
                        ),
                      )}
                    </datalist>

                  </div>
                </div>

                {/* DISTRICT SEARCH */}

                <div>
                  <label
                    htmlFor="hospital-district-search"
                    className="mb-1.5 block text-[11px] font-semibold text-[#334155]"
                  >
                    Select District
                  </label>

                  <div className="relative">

                    <FiMapPin
                      className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-500"
                      aria-hidden="true"
                    />

                    <select
                      id="hospital-district-search"
                      value={districtInput}
                      onChange={(event) =>
                        setDistrictInput(
                          event.target.value,
                        )
                      }
                      className="h-11 w-full rounded-lg border border-white/80 bg-white/95 pl-9 pr-3 text-sm text-gray-800 outline-none"
                    >
                      <option value="">
                        All Districts
                      </option>

                      {districtInput &&
                        !NEPAL_DISTRICTS.includes(
                          districtInput,
                        ) && (
                          <option value={districtInput}>
                            {districtInput}
                          </option>
                        )}

                      {NEPAL_DISTRICTS.map(
                        (district) => (
                          <option
                            key={district}
                            value={district}
                          >
                            {district}
                          </option>
                        ),
                      )}
                    </select>

                  </div>
                </div>

                {/* SEARCH BUTTON */}

                <button
                  type="submit"
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d8b970]/60 bg-[#07545e] px-8 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#043f47]"
                >
                  <FiSearch />

                  Search Hospitals
                </button>

              </form>

              {/* POPULAR SERVICES */}

              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">

                <span className="mr-1 flex-shrink-0 text-xs font-semibold text-[#30474a]">
                  Popular Services
                </span>

                {POPULAR_SERVICES.map((service) => {
                  const active =
                    serviceQ.toLowerCase() ===
                    service.toLowerCase();

                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() =>
                        handleQuickService(service)
                      }
                      className={`flex-shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all ${
                        active
                          ? 'border-[#07545e] bg-[#07545e] text-white'
                          : 'border-white/60 bg-white/70 text-[#45555a] hover:bg-white hover:text-[#07545e]'
                      }`}
                    >
                      {service}
                    </button>
                  );
                })}

                {(serviceQ || districtQ) && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="ml-auto flex flex-shrink-0 items-center gap-1 text-xs font-semibold text-white hover:underline"
                  >
                    <FiX />

                    Clear Filters
                  </button>
                )}

              </div>

            </div>
          </div>

        </section>

        {/* ----------------------------------------
            HOSPITAL RESULTS HEADER
        ---------------------------------------- */}

        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

          <div>
            <h2 className="text-2xl font-bold text-[#172554]">
              Hospital Results
            </h2>

            <p className="mt-1 text-sm text-[#64748b]">
              Hospital-reported information from across Nepal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <div
              aria-live="polite"
              className="text-sm text-[#64748b]"
            >
              {loading
                ? 'Searching...'
                : error
                  ? 'Search unavailable'
                  : (
                    <>
                      <strong className="text-[#172554]">
                        {total !== null
                          ? total
                          : hospitals.length}
                      </strong>

                      {total === null
                        ? ' hospitals on this page'
                        : total === 1
                          ? ' hospital found'
                          : ' hospitals found'}

                      {serviceQ
                        ? ` for "${serviceQ}"`
                        : ''}

                      {districtQ
                        ? ` in ${districtQ}`
                        : ''}
                    </>
                  )}
            </div>

            {/* REFRESH BUTTON */}

            <button
              type="button"
              onClick={refreshHospitals}
              disabled={loading}
              aria-label="Refresh hospital results"
              title="Refresh hospital results"
              className="flex items-center gap-1 rounded-lg border border-[#dfd4bf] bg-white px-3 py-2 text-xs font-medium text-[#07545e] hover:bg-[#f5efe3] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw
                className={
                  loading ? 'animate-spin' : ''
                }
              />

              Refresh
            </button>

          </div>

        </div>

        {/* ----------------------------------------
            LOADING STATE
        ---------------------------------------- */}

        {loading ? (
          <LoadingSpinner
            text="Finding suitable hospitals..."
          />
        ) : error ? (

          /* --------------------------------------
              ERROR STATE
          -------------------------------------- */

          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-white px-6 py-10 text-center"
          >
            <p className="mb-4 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={refreshHospitals}
              className="btn-primary btn-sm"
            >
              Try Again
            </button>
          </div>

        ) : hospitals.length === 0 ? (

          /* --------------------------------------
              EMPTY STATE
          -------------------------------------- */

          <EmptyState
            icon="🏥"
            title={
              currentPage > 1
                ? 'No hospitals on this page'
                : 'No hospitals found'
            }
            description={
              currentPage > 1
                ? 'Try returning to the previous page.'
                : serviceQ || districtQ
                  ? 'No hospitals match your search. Try a different service or district.'
                  : 'No hospitals are currently listed.'
            }
            action={
              <button
                type="button"
                onClick={
                  currentPage > 1
                    ? () =>
                        goToPage(currentPage - 1)
                    : clearAllFilters
                }
                className="btn-secondary btn-sm"
              >
                {currentPage > 1
                  ? 'Previous Page'
                  : 'Clear Search'}
              </button>
            }
          />

        ) : (
          <>

            {/* ------------------------------------
                HOSPITAL CARDS
            ------------------------------------ */}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

              {hospitals.map((hospital) => {
                const avail =
                  getRelevantAvailability(
                    hospital,
                    serviceQ,
                  );

                const hasStale = avail.some(
                  (availability) =>
                    availability.freshness_label ===
                    'stale',
                );

                const bedInfo =
                  getBedInformation(hospital);

                const latestUpdate =
                  getLatestUpdate(hospital);

                const phone =
                  formatPhone(hospital.phone);

                return (
                  <article
                    key={hospital.id}
                    className="overflow-hidden rounded-[20px] border border-[#dfd4bf] bg-white shadow-[0_7px_24px_rgba(63,50,29,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(63,50,29,0.13)]"
                  >

                    {/* CARD HEADER */}

                    <div className="relative min-h-[105px] bg-gradient-to-r from-[#dae8df] via-[#f2eadb] to-[#b7d3d5] p-4">

                      <div className="flex justify-end">

                        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold capitalize text-[#2563eb] shadow-sm">
                          {hospital.type_display ||
                            hospital.type ||
                            'Hospital'}
                        </span>

                      </div>

                      <h3 className="mt-4 truncate text-lg font-bold text-[#172554]">
                        {hospital.name ||
                          'Unnamed Hospital'}
                      </h3>

                      <div className="mt-1 flex items-center gap-1 text-xs text-[#5c6470]">

                        <FiMapPin
                          aria-hidden="true"
                        />

                        <span className="truncate">
                          {hospital.district ||
                            'District not reported'}

                          {hospital.municipality
                            ? `, ${hospital.municipality}`
                            : ''}
                        </span>

                        {typeof hospital.distance_km ===
                          'number' &&
                          Number.isFinite(
                            hospital.distance_km,
                          ) && (
                            <span className="ml-auto flex-shrink-0 font-semibold text-[#07545e]">
                              {hospital.distance_km.toFixed(
                                1,
                              )}{' '}
                              km
                            </span>
                          )}

                      </div>

                    </div>

                    {/* CARD BODY */}

                    <div className="p-4">

                      {/* SERVICES */}

                      {Array.isArray(
                        hospital.services,
                      ) &&
                        hospital.services.length >
                          0 && (
                          <div className="mb-3 flex flex-wrap gap-1.5">

                            {hospital.services
                              .slice(0, 4)
                              .map((service) => (
                                <span
                                  key={service.id}
                                  className="rounded-full bg-[#f5efe3] px-2.5 py-1 text-[10px] font-medium text-[#6a5a43]"
                                >
                                  {service.service_name}
                                </span>
                              ))}

                            {hospital.services.length >
                              4 && (
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-gray-500">
                                  +
                                  {hospital.services.length -
                                    4}{' '}
                                  more
                                </span>
                              )}

                          </div>
                        )}

                      {/* AVAILABILITY */}

                      {avail.length > 0 ? (
                        <div className="mb-4 space-y-2">

                          {avail.map(
                            (availability) => (
                              <div
                                key={availability.id}
                                className="rounded-xl border border-[#eee4d4] bg-[#fcfaf6] p-3"
                              >

                                <div className="flex items-center justify-between gap-2">

                                  <span className="text-xs font-medium capitalize text-[#475569]">
                                    {availability.availability_type_display ||
                                      safeText(
                                        availability.availability_type,
                                      ).replace(
                                        /_/g,
                                        ' ',
                                      )}
                                  </span>

                                  <StatusBadge
                                    status={
                                      availability.status
                                    }
                                    size="sm"
                                  />

                                </div>

                                <div className="mt-2 flex items-center justify-between gap-2">

                                  {availability.available_count !=
                                    null && (
                                    <span className="text-[10px] text-[#64748b]">
                                      {availability.available_count}{' '}
                                      available
                                    </span>
                                  )}

                                  <FreshnessTag
                                    label={
                                      availability.freshness_label
                                    }
                                  />

                                </div>

                              </div>
                            ),
                          )}

                        </div>
                      ) : (

                        <div className="mb-4 rounded-xl border border-[#eee4d4] bg-[#fcfaf6] p-3">

                          <p className="text-xs font-semibold text-[#475569]">
                            {serviceQ
                              ? 'Matching availability not reported'
                              : 'Availability not reported'}
                          </p>

                          <p className="mt-1 text-[10px] text-[#94a3b8]">
                            Contact the hospital to confirm
                            current availability.
                          </p>

                        </div>

                      )}

                      {/* BED INFORMATION */}

                      {bedInfo && (
                        <div className="mb-3 text-xs font-medium text-[#475569]">

                          🛏 {bedInfo.label} available:{' '}

                          <strong
                            className={
                              bedInfo.count === 0
                                ? 'text-red-600'
                                : bedInfo.count < 5
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                            }
                          >
                            {bedInfo.count}
                          </strong>

                        </div>
                      )}

                      {/* LAST UPDATED */}

                      {latestUpdate && (
                        <div className="mb-3 flex items-center gap-1 text-xs text-[#94a3b8]">

                          <FiClock />

                          Updated {latestUpdate}

                        </div>
                      )}

                      {/* STALE WARNING */}

                      {hasStale && (
                        <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[10px] text-amber-700">
                          ⚠ Some availability information
                          may be outdated. Contact the
                          hospital to confirm.
                        </div>
                      )}

                      {/* CARD FOOTER */}

                      <div className="flex items-center justify-between gap-3 border-t border-[#eee4d4] pt-3">

                        {phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="flex items-center gap-1 text-xs font-medium text-[#07545e] hover:underline"
                          >
                            <FiPhone />

                            {hospital.phone}
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Contact unavailable
                          </span>
                        )}

                        <Link
                          to={`/hospital/${hospital.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#07545e] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#043f47]"
                        >
                          View Details

                          <FiChevronRight />
                        </Link>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>

            {/* ------------------------------------
                PAGINATION
            ------------------------------------ */}

            {(currentPage > 1 ||
              hasNextPage) && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">

                <button
                  type="button"
                  onClick={() =>
                    goToPage(currentPage - 1)
                  }
                  disabled={
                    currentPage <= 1 ||
                    loading
                  }
                  className="btn-secondary btn-sm flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiChevronLeft />

                  Previous
                </button>

                <span className="text-sm text-gray-600">
                  Page {currentPage}

                  {total !== null &&
                    ` of ${totalPages}`}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    goToPage(currentPage + 1)
                  }
                  disabled={
                    !hasNextPage ||
                    loading
                  }
                  className="btn-secondary btn-sm flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next

                  <FiChevronRight />
                </button>

              </div>
            )}

            {/* ------------------------------------
                DISCLAIMER
            ------------------------------------ */}

            <div className="mt-6 rounded-xl border border-[#dfbf75] bg-[#fff6de] px-4 py-3 text-center text-xs text-[#996a00]">
              ⚠ Availability information is
              hospital-reported and may change.
              Please confirm with the receiving
              hospital before patient transfer.
            </div>

          </>
        )}

      </div>
    </div>
  );
};

export default SearchPage;
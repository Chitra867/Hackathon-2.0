
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  Link,
  useSearchParams,
  useLocation,
} from 'react-router-dom';

import {
  FiSearch,
  FiMapPin,
  FiArrowRight,
  FiLock,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiShield,
  FiHeart,
  FiCheckCircle,
} from 'react-icons/fi';

import { FaHospital } from 'react-icons/fa';
import { MdMedicalServices, MdLocalHospital } from 'react-icons/md';

import { GiHeartPlus } from 'react-icons/gi';

import { hospitalsApi, userPortalApi } from '../../lib/api';

import type { HospitalListItem, SearchSuggestion } from '../../types';

import { useAuthStore } from '../../store/authStore';

import heroImage from './images/hero.png';

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const PAGE_SIZE = 12;

// All 77 districts of Nepal. Keep this independent of loaded hospital records.
const NEPAL_DISTRICTS = [
  'Achham', 'Arghakhanchi', 'Baglung', 'Baitadi', 'Bajhang',
  'Bajura', 'Banke', 'Bara', 'Bardiya', 'Bhaktapur',
  'Bhojpur', 'Chitwan', 'Dadeldhura', 'Dailekh', 'Dang',
  'Darchula', 'Dhading', 'Dhankuta', 'Dhanusha', 'Dolakha',
  'Dolpa', 'Doti', 'Gorkha', 'Gulmi', 'Humla',
  'Ilam', 'Jajarkot', 'Jhapa', 'Jumla', 'Kailali',
  'Kalikot', 'Kanchanpur', 'Kapilvastu', 'Kaski', 'Kathmandu',
  'Kavrepalanchok', 'Khotang', 'Lalitpur', 'Lamjung', 'Mahottari',
  'Makwanpur', 'Manang', 'Morang', 'Mugu', 'Mustang',
  'Myagdi', 'Nawalpur', 'Nuwakot', 'Okhaldhunga', 'Palpa',
  'Panchthar', 'Parasi', 'Parbat', 'Parsa', 'Pyuthan',
  'Ramechhap', 'Rasuwa', 'Rautahat', 'Rolpa', 'Rukum East',
  'Rukum West', 'Rupandehi', 'Salyan', 'Sankhuwasabha', 'Saptari',
  'Sarlahi', 'Sindhuli', 'Sindhupalchok', 'Siraha', 'Solukhumbu',
  'Sunsari', 'Surkhet', 'Syangja', 'Tanahun', 'Taplejung',
  'Terhathum', 'Udayapur',
];


interface HospitalListResponse {
  results: HospitalListItem[];
  next?: string | null;
}

// --------------------------------------------------
// Suggestion helpers
// --------------------------------------------------

const suggestionStyle: Record<SearchSuggestion['type'], { icon: React.ReactNode; badge: string }> = {
  hospital:  { icon: <FaHospital />,        badge: 'bg-[#eef3f2] text-[#216d73]' },
  service:   { icon: <MdMedicalServices />, badge: 'bg-[#eef3f2] text-[#538b8c]' },
  specialty: { icon: <MdLocalHospital />,   badge: 'bg-[#f2ece0] text-[#8a7350]' },
  district:  { icon: <FiMapPin />,          badge: 'bg-[#eef1f0] text-[#6b7d79]' },
};

const typeLabel = (type: SearchSuggestion['type']) => {
  switch (type) {
    case 'hospital':  return 'Hospital';
    case 'service':   return 'Service';
    case 'specialty': return 'Specialty';
    case 'district':  return 'District';
    default:          return '';
  }
};

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const location = useLocation();

  const { isAuthenticated } = useAuthStore();

  const authenticated = isAuthenticated();

  // URL search parameters
  const hospitalQuery =
    searchParams.get('search')?.trim() || '';

  const districtQuery =
    searchParams.get('district')?.trim() || '';

  // Form state
  const [searchInput, setSearchInput] = useState(
    hospitalQuery
  );

  const [districtInput, setDistrictInput] = useState(
    districtQuery
  );

  // Suggestion state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const suggestDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // Hospital data
  const [hospitals, setHospitals] = useState<
    HospitalListItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [page, setPage] = useState(1);

  const [refreshKey, setRefreshKey] = useState(0);

  // --------------------------------------------------
  // MEASURE DROPDOWN POSITION (must be first — used by fetchSuggestions)
  // --------------------------------------------------

  const measureDropdown = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setDropdownRect({
      top: r.bottom + window.scrollY + 4,
      left: r.left + window.scrollX,
      width: r.width,
    });
  }, []);

  // Keep portal dropdown anchored on scroll / resize
  useEffect(() => {
    if (!showSuggestions) return;
    measureDropdown();
    window.addEventListener('scroll', measureDropdown, true);
    window.addEventListener('resize', measureDropdown);
    return () => {
      window.removeEventListener('scroll', measureDropdown, true);
      window.removeEventListener('resize', measureDropdown);
    };
  }, [showSuggestions, measureDropdown]);

  // --------------------------------------------------
  // SEARCH SUBMIT (must be before handleSearchInputKeyDown)
  // --------------------------------------------------

  const doSubmit = useCallback(() => {
    const params: Record<string, string> = {};
    if (searchInput.trim()) params.search = searchInput.trim();
    if (districtInput.trim()) params.district = districtInput.trim();
    setPage(1);
    setSearchParams(params);
  }, [searchInput, districtInput, setSearchParams]);

  // --------------------------------------------------
  // SUGGESTION FETCH
  // --------------------------------------------------

  const fetchSuggestions = useCallback((q: string) => {
    if (suggestDebounce.current) clearTimeout(suggestDebounce.current);
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestDebounce.current = setTimeout(async () => {
      try {
        const res = await userPortalApi.getSearchSuggestions(q);
        setSuggestions(res.data.suggestions);
        if (res.data.suggestions.length > 0) {
          measureDropdown();
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
  }, [measureDropdown]);

  const handleSelectSuggestion = useCallback((s: SearchSuggestion) => {
    setSearchInput(s.label);
    setSuggestions([]);
    setShowSuggestions(false);
    const params: Record<string, string> = { search: s.label };
    if (districtInput.trim()) params.district = districtInput.trim();
    setPage(1);
    setSearchParams(params);
  }, [districtInput, setSearchParams]);

  const handleSearchInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSubmit();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        handleSelectSuggestion(suggestions[activeIdx]);
      } else {
        setShowSuggestions(false);
        doSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [showSuggestions, suggestions, activeIdx, doSubmit, handleSelectSuggestion]);

  // Close suggestion dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // --------------------------------------------------
  // SYNCHRONIZE INPUTS WITH URL
  // --------------------------------------------------

  useEffect(() => {
    setSearchInput(hospitalQuery);
    setDistrictInput(districtQuery);
    setPage(1);
  }, [hospitalQuery, districtQuery]);

  // --------------------------------------------------
  // LOAD HOSPITALS
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadHospitals = async () => {
      setLoading(true);
      setError('');

      try {
        const allHospitals: HospitalListItem[] = [];

        let currentPage = 1;

        while (true) {
          const response = await hospitalsApi.list({
            page: currentPage,
            page_size: 100,
          });

          if (cancelled) return;

          const data = response.data as
            | HospitalListResponse
            | HospitalListItem[];

          // Support an API returning an array.
          if (Array.isArray(data)) {
            // Client-side safety: only show active hospitals
            allHospitals.push(...data.filter(h => h.is_active !== false));
            break;
          }

          // Support paginated Django REST responses.
          if (!Array.isArray(data.results)) {
            throw new Error(
              'Invalid hospital API response'
            );
          }

          // Client-side safety: only show active hospitals
          allHospitals.push(...data.results.filter(h => h.is_active !== false));

          if (!data.next) {
            break;
          }

          currentPage += 1;
        }

        if (!cancelled) {
          setHospitals(allHospitals);
        }
      } catch (err) {
        console.error(
          'Failed to load hospitals:',
          err
        );

        if (!cancelled) {
          setHospitals([]);

          setError(
            'Unable to load hospitals. Please check your connection and try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHospitals();

    return () => {
      cancelled = true;
    };
  // location.key changes on every navigation — forces a fresh fetch each visit.
  // refreshKey handles manual refresh button clicks.
  }, [refreshKey, location.key]);

  // --------------------------------------------------
  // DISTRICT OPTIONS
  // --------------------------------------------------

  const districts = NEPAL_DISTRICTS;

  // --------------------------------------------------
  // FILTER HOSPITALS
  // --------------------------------------------------

  const filteredHospitals = useMemo(() => {
    const query = hospitalQuery.toLowerCase();

    const district = districtQuery.toLowerCase();

    return hospitals.filter((hospital) => {
      const name = (
        hospital.name || ''
      ).toLowerCase();

      const hospitalDistrict = (
        hospital.district || ''
      ).toLowerCase();

      const matchesName =
        !query || name.includes(query);

      const matchesDistrict =
        !district ||
        hospitalDistrict === district;

      return matchesName && matchesDistrict;
    });
  }, [hospitals, hospitalQuery, districtQuery]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHospitals.length / PAGE_SIZE)
  );

  const paginatedHospitals = filteredHospitals.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // --------------------------------------------------
  // SEARCH FORM SUBMIT
  // --------------------------------------------------

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowSuggestions(false);
    doSubmit();
  };

  // --------------------------------------------------
  // CLEAR FILTERS
  // --------------------------------------------------

  const clearFilters = () => {
    setSearchInput('');
    setDistrictInput('');
    setPage(1);
    setSearchParams({});
  };

  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  const refreshHospitals = () => {
    setRefreshKey((previous) => previous + 1);
  };

  // --------------------------------------------------
  // CHANGE PAGE
  // --------------------------------------------------

  const goToPage = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return;
    }

    setPage(nextPage);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f8f4eb]">

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* HERO SECTION */}

        <section className="relative mb-10 overflow-hidden rounded-[30px] border border-[#dfd1b5] shadow-[0_18px_45px_rgba(78,58,26,0.12)]">

          {/* HOSPITAL BACKGROUND IMAGE */}

          <div
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundPosition: '72% 35%',
            }}
          />

          {/* CREAM OVERLAY ON LEFT */}

          <div className="absolute inset-0 bg-gradient-to-r from-[#faedd6]/95 via-[#f7ead3]/45 to-transparent" />

          {/* SUBTLE BOTTOM OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#d8cbb3]/20 via-transparent to-transparent" />

          {/* HERO CONTENT */}

          <div className="relative z-10 px-7 pb-8 pt-10 md:px-11 md:pb-[215px] md:pt-11">

            <div className="max-w-[660px]">

              {/* BRAND BADGE */}

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d9e3df] bg-white/95 px-4 py-2 text-xs font-semibold text-[#07545e] shadow-sm">

                <GiHeartPlus className="text-base text-[#07545e]" />

                UPACHARKHOJ NEPAL

              </div>

              {/* HERO TITLE */}

              <h1 className="text-[36px] font-bold leading-[1.08] tracking-[-0.035em] text-[#13295b] sm:text-[46px] lg:text-[56px]">

                Find the right hospital

                <span className="mt-2 block text-[#08606a]">
                  for your healthcare needs.
                </span>

              </h1>

              {/* DESCRIPTION */}

              <p className="mt-5 max-w-[550px] text-[15px] font-medium leading-7 text-[#3f4851] md:text-base">

                Search hospitals across Nepal by name or district.
                Discover healthcare facilities and find the
                information you need before visiting.

              </p>

              {/* HERO BENEFITS */}

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#394a4b]">

                <span className="flex items-center gap-2">

                  <FiSearch className="text-[#08606a]" />

                  Search hospitals

                </span>

                <span className="flex items-center gap-2">

                  <FiMapPin className="text-[#08606a]" />

                  Explore districts

                </span>

                <span className="flex items-center gap-2">

                  <FiShield className="text-[#08606a]" />

                  Access hospital information

                </span>

              </div>

            </div>

          </div>

          {/* SEARCH PANEL */}

          <div className="relative z-20 mx-3 mb-4 mt-4 md:absolute md:bottom-4 md:left-6 md:right-6 md:m-0">

            <div className="rounded-[22px] border border-white/60 bg-gradient-to-r from-[#f7eee0]/95 via-[#aabfba]/95 to-[#08616b]/95 p-4 shadow-[0_14px_35px_rgba(25,59,62,0.25)] backdrop-blur-md sm:p-5">

              {/* SEARCH FORM */}

              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1.5fr_0.8fr_auto]"
              >

                {/* HOSPITAL NAME */}

                <div>

                  <label
                    htmlFor="hospital-name-search"
                    className="mb-2 block text-sm font-semibold text-[#30474a]"
                  >
                    Hospital Name
                  </label>

                  <div ref={searchContainerRef} className="relative">

                    <FiSearch
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#82949a] z-10"
                      aria-hidden="true"
                    />

                    <input
                      ref={inputRef}
                      id="hospital-name-search"
                      type="search"
                      value={searchInput}
                      onChange={(event) => {
                        setSearchInput(event.target.value);
                        fetchSuggestions(event.target.value);
                      }}
                      onKeyDown={handleSearchInputKeyDown}
                      onFocus={() => {
                        if (suggestions.length > 0) {
                          measureDropdown();
                          setShowSuggestions(true);
                        }
                      }}
                      autoComplete="off"
                      placeholder="Search by hospital name..."
                      className="h-12 w-full rounded-xl border border-white/80 bg-white pl-11 pr-4 text-sm text-[#173c40] shadow-sm outline-none transition focus:border-[#07545e] focus:ring-2 focus:ring-[#07545e]/20"
                    />

                    {/* SUGGESTIONS DROPDOWN — rendered in a portal to escape overflow:hidden */}
                    {showSuggestions && suggestions.length > 0 && dropdownRect && createPortal(
                      <ul
                        role="listbox"
                        style={{
                          position: 'absolute',
                          top: dropdownRect.top,
                          left: dropdownRect.left,
                          width: dropdownRect.width,
                          zIndex: 9999,
                        }}
                        className="overflow-hidden rounded-xl border border-[#dfd4bf] bg-white shadow-[0_8px_24px_rgba(25,59,62,0.18)]"
                      >
                        {suggestions.map((s, idx) => {
                          const style = suggestionStyle[s.type];
                          return (
                            <li
                              key={`${s.type}-${s.label}`}
                              role="option"
                              aria-selected={idx === activeIdx}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectSuggestion(s);
                              }}
                              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                idx === activeIdx
                                  ? 'bg-[#eef3f2]'
                                  : 'hover:bg-[#f5efe3]'
                              }`}
                            >
                              <span className="flex-shrink-0 text-[#07545e]">
                                {style.icon}
                              </span>
                              <span className="flex-1 truncate text-[#173c40]">
                                {s.label}
                              </span>
                              <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}>
                                {typeLabel(s.type)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>,
                      document.body
                    )}

                  </div>

                </div>

                {/* DISTRICT SEARCH */}

                <div>

                  <label
                    htmlFor="hospital-district-search"
                    className="mb-2 block text-sm font-semibold text-[#30474a] md:text-[#173c40]"
                  >
                    Select District
                  </label>

                  <div className="relative">

                    <FiMapPin
                      className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#82949a]"
                      aria-hidden="true"
                    />

                    <select
                      id="hospital-district-search"
                      value={districtInput}
                      onChange={(event) =>
                        setDistrictInput(event.target.value)
                      }
                      className="h-12 w-full rounded-xl border border-white/80 bg-white pl-11 pr-4 text-sm text-[#173c40] shadow-sm outline-none transition focus:border-[#07545e] focus:ring-2 focus:ring-[#07545e]/20"
                    >

                      <option value="">
                        All Districts
                      </option>

                      {districtInput &&
                        !districts.includes(districtInput) && (
                          <option value={districtInput}>
                            {districtInput}
                          </option>
                        )}

                      {districts.map((district) => (

                        <option
                          key={district}
                          value={district}
                        >
                          {district}
                        </option>

                      ))}

                    </select>

                  </div>

                </div>

                {/* SEARCH BUTTON */}

                <button
                  type="submit"
                  className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#d8b970]/60 bg-[#07545e] px-7 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#043f47]"
                >

                  <FiSearch className="text-base" />

                  Search Hospitals

                </button>

              </form>

              {/* SEARCH PANEL BOTTOM */}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/30 pt-3">

                <div className="flex items-center gap-2 text-xs font-medium text-[#30474a]">

                  <FiHeart className="text-[#07545e]" />

                  Discover hospitals across Nepal

                </div>

                {(hospitalQuery || districtQuery) && (

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-[#173c40] transition hover:bg-white/30 md:text-white"
                  >

                    <FiX />

                    Clear Filters

                  </button>

                )}

              </div>

            </div>

          </div>

        </section>

        {/* HOSPITAL RESULTS HEADER */}

        <section>

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <div className="mb-2 flex items-center gap-2">

                <span className="h-1 w-6 rounded-full bg-[#08606a]" />

                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#08606a]">
                  Explore Healthcare
                </span>

              </div>

              <h2 className="text-2xl font-bold text-[#13295b]">
                Hospital Directory
              </h2>

              <p className="mt-2 text-sm text-[#64748b]">
                Browse healthcare facilities across Nepal.
              </p>

            </div>

            {/* RESULTS COUNT AND REFRESH */}

            <div className="flex flex-wrap items-center gap-3">

              <div
                aria-live="polite"
                className="rounded-full border border-[#dfd4bf] bg-white px-4 py-2 text-sm text-[#475569]"
              >

                {loading
                  ? 'Searching...'
                  : error
                    ? 'Search unavailable'
                    : (
                      <>
                        <span className="font-bold text-[#07545e]">
                          {filteredHospitals.length}
                        </span>
                        {' '}
                        {filteredHospitals.length === 1
                          ? 'hospital found'
                          : 'hospitals found'}
                      </>
                    )}

              </div>

              <button
                type="button"
                onClick={refreshHospitals}
                disabled={loading}
                title="Refresh hospital results"
                aria-label="Refresh hospital results"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dfd4bf] bg-white text-[#07545e] shadow-sm transition hover:bg-[#f5efe3] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <FiRefreshCw
                  className={
                    loading ? 'animate-spin' : ''
                  }
                />

              </button>

            </div>

          </div>

          {/* LOADING STATE */}

          {loading ? (

            <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-[#dfd4bf] bg-white">

              <div className="text-center">

                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e1ece7] border-t-[#07545e]" />

                <p className="mt-4 text-sm text-[#64748b]">
                  Finding hospitals...
                </p>

              </div>

            </div>

          ) : error ? (

            /* ERROR STATE */

            <div className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center">

              <p className="text-sm text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={refreshHospitals}
                className="mt-5 rounded-xl bg-[#07545e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#043f47]"
              >
                Try Again
              </button>

            </div>

          ) : filteredHospitals.length === 0 ? (

            /* EMPTY STATE */

            <div className="rounded-2xl border border-[#dfd4bf] bg-white px-6 py-14 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e5f0ed] text-3xl text-[#07545e]">

                <GiHeartPlus />

              </div>

              <h3 className="mt-5 text-lg font-bold text-[#13295b]">
                No hospitals found
              </h3>

              <p className="mt-2 text-sm text-[#64748b]">
                Try another hospital name or district.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-[#07545e] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#043f47]"
              >
                Clear Search
              </button>

            </div>

          ) : (

            /* HOSPITAL CARDS */

            <>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {paginatedHospitals.map((hospital) => (

                  <article
                    key={hospital.id}
                    className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#dfd4bf] bg-white shadow-[0_7px_24px_rgba(63,50,29,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-[#a8c9c1] hover:shadow-[0_16px_35px_rgba(63,50,29,0.13)]"
                  >

                    {/* CARD HEADER */}

                    <div className="relative bg-gradient-to-r from-[#dae8df] via-[#f2eadb] to-[#b7d3d5] px-5 py-6">

                      <div className="mb-5 flex items-start justify-between gap-3">

                        {/* HOSPITAL ICON */}

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-2xl text-[#07545e] shadow-sm">

                          <GiHeartPlus />

                        </div>

                        {/* HOSPITAL TYPE */}

                        <span className="rounded-full border border-[#bfd9d2] bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-[#07545e] shadow-sm">

                          {hospital.type_display ||
                            hospital.type ||
                            'Hospital'}

                        </span>

                      </div>

                      {/* HOSPITAL NAME */}

                      <h3 className="text-lg font-bold text-[#13295b] transition-colors group-hover:text-[#07545e]">

                        {hospital.name ||
                          'Unnamed Hospital'}

                      </h3>

                      {/* HOSPITAL LOCATION */}

                      <p className="mt-2 flex items-center gap-2 text-sm text-[#475569]">

                        <FiMapPin className="flex-shrink-0 text-[#07545e]" />

                        <span>

                          {hospital.municipality
                            ? `${hospital.municipality}, `
                            : ''}

                          {hospital.district ||
                            'District not reported'}

                        </span>

                      </p>

                    </div>

                    {/* CARD BODY */}

                    <div className="flex flex-1 flex-col p-5">

                      {/* HOSPITAL INFORMATION */}

                      <div className="flex items-start gap-3 rounded-xl border border-[#e7ddc8] bg-[#fcfaf6] p-4">

                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#e5f0ed] text-[#07545e]">

                          {authenticated ? (
                            <FiCheckCircle />
                          ) : (
                            <FiLock />
                          )}

                        </div>

                        <div>

                          <p className="text-sm font-semibold text-[#30474a]">
                            Hospital Information
                          </p>

                          <p className="mt-1 text-xs leading-5 text-[#64748b]">

                            {authenticated
                              ? 'View hospital services, availability, doctors, and contact information.'
                              : 'Sign in to view hospital services, availability, doctors, and contact information.'}

                          </p>

                        </div>

                      </div>

                      {/* VIEW DETAILS BUTTON */}

                      <div className="mt-auto pt-5">

                        <Link
                          to={
                            authenticated
                              ? `/hospital/${hospital.id}`
                              : '/login'
                          }
                          state={
                            authenticated
                              ? undefined
                              : {
                                  from: {
                                    pathname: `/hospital/${hospital.id}`,
                                  },
                                }
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8b970]/40 bg-[#07545e] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#043f47] hover:shadow-md"
                        >

                          {authenticated ? (

                            <>
                              View Hospital Details
                              <FiArrowRight />
                            </>

                          ) : (

                            <>
                              <FiLock />
                              Sign in to View Details
                              <FiArrowRight />
                            </>

                          )}

                        </Link>

                      </div>

                    </div>

                  </article>

                ))}

              </div>

              {/* PAGINATION */}

              {totalPages > 1 && (

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">

                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-2 rounded-xl border border-[#dfd4bf] bg-white px-4 py-2.5 text-sm font-medium text-[#07545e] transition hover:bg-[#f5efe3] disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    <FiChevronLeft />

                    Previous

                  </button>

                  <span className="text-sm font-medium text-[#475569]">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    className="flex items-center gap-2 rounded-xl border border-[#dfd4bf] bg-white px-4 py-2.5 text-sm font-medium text-[#07545e] transition hover:bg-[#f5efe3] disabled:cursor-not-allowed disabled:opacity-40"
                  >

                    Next

                    <FiChevronRight />

                  </button>

                </div>

              )}

              {/* DISCLAIMER */}

              <div className="mt-8 rounded-xl border border-[#dfbf75] bg-[#fff6de] px-5 py-4 text-center text-xs leading-6 text-[#996a00]">

                <FiShield className="mr-1 inline-block" />

                Hospital information and service availability
                are provided by healthcare facilities and
                may change. Please confirm availability
                before visiting or arranging a patient transfer.

              </div>

            </>

          )}

        </section>

      </div>

    </div>
  );
};

export default SearchPage;
import React, {
  useState,
  useEffect,
  useCallback,
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

import { format } from 'date-fns';

import heroImage from './images/hero.png';


const NEPAL_DISTRICTS = [
  'Kathmandu',
  'Lalitpur',
  'Bhaktapur',
  'Chitwan',
  'Kaski',
  'Morang',
  'Rupandehi',
  'Sunsari',
  'Makwanpur',
  'Banke',
  'Pokhara',
  'Biratnagar',
  'Butwal',
  'Dharan',
  'Hetauda',
  'Nepalgunj',
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


export const SearchPage: React.FC = () => {

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [
    hospitals,
    setHospitals,
  ] = useState<HospitalListItem[]>([]);

  const [
    services,
    setServices,
  ] = useState<Service[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    total,
    setTotal,
  ] = useState(0);


  /* =========================================================
    URL PARAMETERS
  ========================================================= */

  const serviceQ =
    searchParams.get('service') || '';

  const districtQ =
    searchParams.get('district') || '';


  /* =========================================================
    LOCAL STATE
  ========================================================= */

  const [
    searchInput,
    setSearchInput,
  ] = useState(serviceQ);

  const [
    districtInput,
    setDistrictInput,
  ] = useState(districtQ);


  /* =========================================================
    LOAD HOSPITALS
  ========================================================= */

  const loadHospitals = useCallback(async () => {

    setLoading(true);

    try {

      const params: Record<string, string> = {};

      if (serviceQ) {
        params.service = serviceQ;
      }

      if (districtQ) {
        params.district = districtQ;
      }

      const response =
        await hospitalsApi.list(params);

      setHospitals(
        response.data.results
      );

      setTotal(
        response.data.count
      );

    } catch (error) {

      console.error(
        'Failed to load hospitals:',
        error
      );

      setHospitals([]);
      setTotal(0);

    } finally {

      setLoading(false);

    }

  }, [serviceQ, districtQ]);


  useEffect(() => {

    loadHospitals();

  }, [loadHospitals]);


  /* =========================================================
    LOAD SERVICES
  ========================================================= */

  useEffect(() => {

    servicesApi
      .list()
      .then((response) => {

        setServices(
          response.data.results
        );

      })
      .catch((error) => {

        console.error(
          'Failed to load services:',
          error
        );

      });

  }, []);


  /* =========================================================
    SEARCH
  ========================================================= */

  const handleSearch = () => {

    const params: Record<string, string> = {};

    if (searchInput.trim()) {
      params.service =
        searchInput.trim();
    }

    if (districtInput) {
      params.district =
        districtInput;
    }

    setSearchParams(params);

  };


  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {

    if (event.key === 'Enter') {
      handleSearch();
    }

  };


  /* =========================================================
    QUICK SERVICE
  ========================================================= */

  const handleQuickService = (
    serviceName: string
  ) => {

    setSearchInput(serviceName);

    const params: Record<string, string> = {
      service: serviceName,
    };

    if (districtInput) {
      params.district =
        districtInput;
    }

    setSearchParams(params);

  };


  /* =========================================================
    CLEAR FILTERS
  ========================================================= */

  const clearAllFilters = () => {

    setSearchInput('');

    setDistrictInput('');

    setSearchParams({});

  };


  /* =========================================================
    AVAILABILITY HELPERS
  ========================================================= */

  const getTopAvailability = (
    hospital: HospitalListItem
  ) => {

    return (
      hospital.availability
        ?.filter(
          (availability) =>
            availability.is_active
        )
        .slice(0, 3) ?? []
    );

  };


  /* =========================================================
     BED COUNT
  ========================================================= */

  const getBedCount = (
    hospital: HospitalListItem
  ): number | null => {

    const bedEntry =
      hospital.availability?.find(
        (availability) => {

          const type =
            availability
              .availability_type
              .toLowerCase();

          return (
            type.includes('bed') ||
            type.includes('icu') ||
            type.includes('ward')
          );

        }
      );

    return (
      bedEntry?.available_count ??
      null
    );

  };


  /* =========================================================
     RELEVANT AVAILABILITY
  ========================================================= */

  const getRelevantAvail = (
    hospital: HospitalListItem
  ) => {

    if (!serviceQ) {

      return getTopAvailability(
        hospital
      );

    }

    const query =
      serviceQ.toLowerCase();

    const serviceMatch =
      hospital.availability?.filter(
        (availability) => {

          const serviceName =
            availability.service_name
              ?.toLowerCase() || '';

          const availabilityType =
            availability
              .availability_type
              .toLowerCase();

          return (
            serviceName.includes(query) ||
            availabilityType.includes(query)
          );

        }
      );


    if (
      serviceMatch &&
      serviceMatch.length > 0
    ) {

      return serviceMatch.slice(
        0,
        3
      );

    }

    return getTopAvailability(
      hospital
    );

  };


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div className="min-h-screen bg-[#f8f4eb]">

      <div
        className="
          mx-auto
          max-w-7xl
          px-4
          py-6
          sm:px-6
        "
      >


        {/* =====================================================
            HERO
        ===================================================== */}

        <section
          className="
            relative
            mb-9
            overflow-hidden
            rounded-[30px]
            border
            border-[#dfd1b5]
            shadow-[0_18px_45px_rgba(78,58,26,0.12)]
            md:min-h-[450px]
          "
        >


          {/* HERO IMAGE */}

          <div
            className="
              absolute
              inset-0
              bg-cover
              bg-no-repeat
            "
            style={{
              backgroundImage:
                `url(${heroImage})`,

              /*
               * Focus image more toward the monastery/stupa.
               * Increase first value to move farther right.
               * Decrease second value to move upward.
               */
              backgroundPosition: '72% 35%',
            }}
          />


          {/* LEFT OVERLAY */}

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-[#faedd6]
              via-[#f7ead3]/75
              to-transparent
            "
          />


          {/* BOTTOM OVERLAY */}

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-[#d8cbb3]/30
              via-transparent
              to-transparent
            "
          />


          {/* HERO CONTENT */}

          <div
            className="
              relative
              z-10
              px-7
              pt-10
              pb-8
              md:px-11
              md:pt-11
              md:pb-[205px]
            "
          >

            <div className="max-w-[610px]">

              <h1
                className="
                  text-[39px]
                  font-bold
                  leading-[0.98]
                  tracking-[-0.035em]
                  text-[#13295b]
                  sm:text-[48px]
                  lg:text-[58px]
                "
              >
                Find the right care

                <span
                  className="
                    block
                    text-[#08606a]
                  "
                >
                  before you travel.
                </span>

              </h1>


              <p
                className="
                  mt-5
                  max-w-[520px]
                  text-[15px]
                  leading-6
                  text-[#3f4851]
                  md:text-base
                "
              >
                Search hospitals by treatment,
                service, bed availability and
                specialist availability across Nepal.
              </p>


              {/* BENEFITS */}

              <div
                className="
                  mt-6
                  flex
                  flex-wrap
                  gap-x-6
                  gap-y-3
                  text-sm
                  font-medium
                  text-[#4b4e47]
                "
              >

                <span
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <FiShield className="text-[#c08c2d]" />

                  Real-time availability
                </span>


                <span
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <FiUsers className="text-[#c08c2d]" />

                  Verified hospitals
                </span>


                <span
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <FiHeart className="text-[#c08c2d]" />

                  Safer referrals
                </span>

              </div>

            </div>

          </div>


          {/* =====================================================
              SEARCH PANEL
          ===================================================== */}

          <div
            className="
              relative
              z-20
              mx-4
              mb-5
              mt-5
              md:absolute
              md:bottom-5
              md:left-8
              md:right-8
              md:m-0
            "
          >

            <div
              className="
                rounded-[22px]
                border
                border-white/60
                bg-gradient-to-r
                from-[#f7eee0]/95
                via-[#aabfba]/95
                to-[#08616b]/95
                p-4
                shadow-[0_14px_35px_rgba(25,59,62,0.25)]
                backdrop-blur-md
              "
            >


              {/* SEARCH INPUTS */}

              <div
                className="
                  grid
                  grid-cols-1
                  items-end
                  gap-3
                  md:grid-cols-[1.5fr_0.8fr_auto]
                "
              >


                {/* SERVICE */}

                <div>

                  <label
                    className="
                      mb-1.5
                      block
                      text-[11px]
                      font-semibold
                      text-[#334155]
                    "
                  >
                    What service do you need?
                  </label>


                  <div className="relative">

                    <FiSearch
                      className="
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-gray-400
                      "
                    />


                    <input
                      type="text"
                      value={
                        searchInput
                      }
                      onChange={(event) =>
                        setSearchInput(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleKeyDown
                      }
                      list="service-options"
                      placeholder="e.g. ICU, Dialysis, Cardiology, Maternity..."
                      className="
                        h-11
                        w-full
                        rounded-lg
                        border
                        border-white/80
                        bg-white/95
                        pl-9
                        pr-3
                        text-sm
                        text-gray-800
                        outline-none
                        shadow-sm
                        focus:border-[#0c6670]
                        focus:ring-2
                        focus:ring-[#0c6670]/20
                      "
                    />


                    <datalist id="service-options">

                      {services.map(
                        (service) => (

                          <option
                            key={service.id}
                            value={service.name}
                          />

                        )
                      )}

                    </datalist>

                  </div>

                </div>


                {/* DISTRICT */}

                <div>

                  <label
                    className="
                      mb-1.5
                      block
                      text-[11px]
                      font-semibold
                      text-[#334155]
                    "
                  >
                    Select District
                  </label>


                  <div className="relative">

                    <FiMapPin
                      className="
                        absolute
                        left-3
                        top-1/2
                        z-10
                        -translate-y-1/2
                        text-gray-500
                      "
                    />


                    <select
                      value={
                        districtInput
                      }
                      onChange={(event) =>
                        setDistrictInput(
                          event.target.value
                        )
                      }
                      className="
                        h-11
                        w-full
                        rounded-lg
                        border
                        border-white/80
                        bg-white/95
                        pl-9
                        pr-3
                        text-sm
                        text-gray-800
                        outline-none
                      "
                    >

                      <option value="">
                        All Districts
                      </option>


                      {NEPAL_DISTRICTS.map(
                        (district) => (

                          <option
                            key={district}
                            value={district}
                          >
                            {district}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                </div>


                {/* SEARCH BUTTON */}

                <button
                  onClick={
                    handleSearch
                  }
                  className="
                    flex
                    h-11
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    border
                    border-[#d8b970]/60
                    bg-[#07545e]
                    px-8
                    text-sm
                    font-semibold
                    text-white
                    shadow-lg
                    transition-all
                    hover:bg-[#043f47]
                  "
                >
                  <FiSearch />

                  Search Hospitals
                </button>

              </div>


              {/* POPULAR SERVICES */}

              <div
                className="
                  mt-4
                  flex
                  items-center
                  gap-2
                  overflow-x-auto
                  pb-1
                "
              >

                <span
                  className="
                    mr-1
                    flex-shrink-0
                    text-xs
                    font-semibold
                    text-[#30474a]
                  "
                >
                  Popular Services
                </span>


                {POPULAR_SERVICES.map(
                  (service) => {

                    const active =
                      serviceQ
                        .toLowerCase() ===
                      service
                        .toLowerCase();


                    return (

                      <button
                        key={service}
                        type="button"
                        onClick={() =>
                          handleQuickService(
                            service
                          )
                        }
                        className={`
                          flex-shrink-0
                          rounded-full
                          border
                          px-4
                          py-2
                          text-xs
                          font-medium
                          transition-all

                          ${
                            active

                              ? `
                                border-[#07545e]
                                bg-[#07545e]
                                text-white
                              `

                              : `
                                border-white/60
                                bg-white/70
                                text-[#45555a]
                                hover:bg-white
                                hover:text-[#07545e]
                              `
                          }
                        `}
                      >
                        {service}
                      </button>

                    );

                  }
                )}


                {(serviceQ ||
                  districtQ) && (

                  <button
                    onClick={
                      clearAllFilters
                    }
                    className="
                      ml-auto
                      flex-shrink-0
                      text-xs
                      font-semibold
                      text-white
                      hover:underline
                    "
                  >
                    Clear Filters
                  </button>

                )}

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURED HOSPITALS
        ===================================================== */}

        <div
          className="
            mb-5
            flex
            flex-col
            justify-between
            gap-3
            sm:flex-row
            sm:items-end
          "
        >

          <div>

            <h2
              className="
                text-2xl
                font-bold
                text-[#172554]
              "
            >
              Featured Hospitals
            </h2>


            <p
              className="
                mt-1
                text-sm
                text-[#64748b]
              "
            >
              Live hospital information from across Nepal
            </p>

          </div>


          <div className="text-sm text-[#64748b]">

            {loading
              ? 'Searching...'
              : (
                <>
                  <strong className="text-[#172554]">
                    {total}
                  </strong>

                  {' hospital'}

                  {total !== 1
                    ? 's'
                    : ''}

                  {' found'}

                  {serviceQ
                    ? ` for "${serviceQ}"`
                    : ''}

                  {districtQ
                    ? ` in ${districtQ}`
                    : ''}
                </>
              )}

          </div>

        </div>


        {/* =====================================================
            RESULTS
        ===================================================== */}

        {loading ? (

          <LoadingSpinner
            text="Finding suitable hospitals..."
          />

        ) : hospitals.length === 0 ? (

          <EmptyState
            icon="🏥"
            title="No hospitals found"
            description={
              serviceQ
                ? `No hospitals currently report "${serviceQ}" as a service. Try another service or district.`
                : 'Try searching for ICU, Cardiology, MRI, Dialysis or another healthcare service.'
            }
            action={
              <button
                onClick={
                  clearAllFilters
                }
                className="
                  btn-secondary
                  btn-sm
                "
              >
                Clear Search
              </button>
            }
          />

        ) : (

          <>

            <div
              className="
                grid
                gap-5
                md:grid-cols-2
                xl:grid-cols-3
              "
            >

              {hospitals.map(
                (hospital) => {

                  const avail =
                    getRelevantAvail(
                      hospital
                    );


                  const hasStale =
                    avail.some(
                      (
                        availability
                      ) =>
                        availability
                          .freshness_label ===
                        'stale'
                    );


                  const bedCount =
                    getBedCount(
                      hospital
                    );


                  const latestUpdate =
                    avail.length > 0

                      ? avail.reduce(
                          (
                            latest,
                            availability
                          ) =>
                            new Date(
                              availability.updated_at
                            ) >
                            new Date(
                              latest.updated_at
                            )
                              ? availability
                              : latest
                        )

                      : null;


                  return (

                    <article
                      key={hospital.id}
                      className="
                        overflow-hidden
                        rounded-[20px]
                        border
                        border-[#dfd4bf]
                        bg-white
                        shadow-[0_7px_24px_rgba(63,50,29,0.08)]
                        transition-all
                        duration-200
                        hover:-translate-y-1
                        hover:shadow-[0_16px_35px_rgba(63,50,29,0.13)]
                      "
                    >


                      {/* CARD TOP */}

                      <div
                        className="
                          relative
                          min-h-[105px]
                          bg-gradient-to-r
                          from-[#dae8df]
                          via-[#f2eadb]
                          to-[#b7d3d5]
                          p-4
                        "
                      >

                        <div className="flex justify-end">

                          <span
                            className="
                              rounded-full
                              bg-white/90
                              px-2.5
                              py-1
                              text-[10px]
                              font-semibold
                              capitalize
                              text-[#2563eb]
                              shadow-sm
                            "
                          >
                            {hospital.type_display ||
                              hospital.type}
                          </span>

                        </div>


                        <h3
                          className="
                            mt-4
                            truncate
                            text-lg
                            font-bold
                            text-[#172554]
                          "
                        >
                          {hospital.name}
                        </h3>


                        <div
                          className="
                            mt-1
                            flex
                            items-center
                            gap-1
                            text-xs
                            text-[#5c6470]
                          "
                        >

                          <FiMapPin />


                          <span className="truncate">

                            {hospital.district}

                            {hospital.municipality
                              ? `, ${hospital.municipality}`
                              : ''}

                          </span>


                          {hospital.distance_km !=
                            null && (

                            <span
                              className="
                                ml-auto
                                flex-shrink-0
                                font-semibold
                                text-[#07545e]
                              "
                            >
                              {
                                hospital.distance_km.toFixed(
                                  1
                                )
                              }{' '}
                              km
                            </span>

                          )}

                        </div>

                      </div>


                      {/* CARD CONTENT */}

                      <div className="p-4">


                        {/* SERVICES */}

                        {hospital.services &&
                          hospital.services.length >
                            0 && (

                          <div
                            className="
                              mb-3
                              flex
                              flex-wrap
                              gap-1.5
                            "
                          >

                            {hospital.services
                              .slice(0, 4)
                              .map(
                                (
                                  service
                                ) => (

                                  <span
                                    key={
                                      service.id
                                    }
                                    className="
                                      rounded-full
                                      bg-[#f5efe3]
                                      px-2.5
                                      py-1
                                      text-[10px]
                                      font-medium
                                      text-[#6a5a43]
                                    "
                                  >
                                    {
                                      service.service_name
                                    }
                                  </span>

                                )
                              )}


                            {hospital.services.length >
                              4 && (

                              <span
                                className="
                                  rounded-full
                                  bg-gray-100
                                  px-2.5
                                  py-1
                                  text-[10px]
                                  text-gray-500
                                "
                              >
                                +
                                {
                                  hospital.services
                                    .length - 4
                                }{' '}
                                more
                              </span>

                            )}

                          </div>

                        )}


                        {/* AVAILABILITY */}

                        {avail.length > 0 ? (

                          <div
                            className="
                              mb-4
                              space-y-2
                            "
                          >

                            {avail.map(
                              (
                                availability
                              ) => (

                                <div
                                  key={
                                    availability.id
                                  }
                                  className="
                                    rounded-xl
                                    border
                                    border-[#eee4d4]
                                    bg-[#fcfaf6]
                                    p-3
                                  "
                                >

                                  <div
                                    className="
                                      flex
                                      items-center
                                      justify-between
                                      gap-2
                                    "
                                  >

                                    <span
                                      className="
                                        text-xs
                                        font-medium
                                        capitalize
                                        text-[#475569]
                                      "
                                    >
                                      {availability.availability_type_display ||
                                        availability.availability_type}
                                    </span>


                                    <StatusBadge
                                      status={
                                        availability.status
                                      }
                                      size="sm"
                                    />

                                  </div>


                                  <div
                                    className="
                                      mt-2
                                      flex
                                      items-center
                                      justify-between
                                      gap-2
                                    "
                                  >

                                    {availability.available_count !=
                                      null && (

                                      <span
                                        className="
                                          text-[10px]
                                          text-[#64748b]
                                        "
                                      >
                                        {
                                          availability.available_count
                                        }{' '}
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

                              )
                            )}

                          </div>

                        ) : (

                          <div
                            className="
                              mb-4
                              rounded-xl
                              border
                              border-[#eee4d4]
                              bg-[#fcfaf6]
                              p-3
                            "
                          >

                            <p
                              className="
                                text-xs
                                font-semibold
                                text-[#475569]
                              "
                            >
                              Live availability not reported
                            </p>


                            <p
                              className="
                                mt-1
                                text-[10px]
                                text-[#94a3b8]
                              "
                            >
                              Contact the hospital to confirm current availability.
                            </p>

                          </div>

                        )}


                        {/* BEDS + UPDATE */}

                        <div
                          className="
                            mb-3
                            flex
                            flex-wrap
                            items-center
                            justify-between
                            gap-2
                            text-xs
                          "
                        >

                          {bedCount != null && (

                            <span
                              className="
                                font-medium
                                text-[#475569]
                              "
                            >
                              🛏 Beds:{' '}

                              <strong
                                className={
                                  bedCount === 0
                                    ? 'text-red-600'
                                    : bedCount < 5
                                    ? 'text-amber-600'
                                    : 'text-emerald-700'
                                }
                              >
                                {bedCount}
                              </strong>

                            </span>

                          )}


                          {latestUpdate && (

                            <span
                              className="
                                flex
                                items-center
                                gap-1
                                text-[#94a3b8]
                              "
                            >

                              <FiClock />

                              {format(
                                new Date(
                                  latestUpdate.updated_at
                                ),
                                'MMM d, HH:mm'
                              )}

                            </span>

                          )}

                        </div>


                        {/* STALE WARNING */}

                        {hasStale && (

                          <div
                            className="
                              mb-3
                              rounded-lg
                              bg-amber-50
                              px-3
                              py-2
                              text-[10px]
                              text-amber-700
                            "
                          >
                            ⚠ Some data may be outdated.
                            Contact the hospital to confirm.
                          </div>

                        )}


                        {/* FOOTER */}

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            gap-3
                            border-t
                            border-[#eee4d4]
                            pt-3
                          "
                        >

                          {hospital.phone ? (

                            <a
                              href={`tel:${hospital.phone}`}
                              className="
                                flex
                                items-center
                                gap-1
                                text-xs
                                font-medium
                                text-[#07545e]
                                hover:underline
                              "
                            >
                              <FiPhone />

                              {hospital.phone}
                            </a>

                          ) : (

                            <span />

                          )}


                          <Link
                            to={`/hospital/${hospital.id}`}
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              rounded-lg
                              bg-[#07545e]
                              px-4
                              py-2
                              text-xs
                              font-semibold
                              text-white
                              shadow-sm
                              transition
                              hover:bg-[#043f47]
                            "
                          >
                            View Details

                            <FiChevronRight />
                          </Link>

                        </div>

                      </div>

                    </article>

                  );

                }
              )}

            </div>


            {/* DISCLAIMER */}

            <div
              className="
                mt-6
                rounded-xl
                border
                border-[#dfbf75]
                bg-[#fff6de]
                px-4
                py-3
                text-center
                text-xs
                text-[#996a00]
              "
            >
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
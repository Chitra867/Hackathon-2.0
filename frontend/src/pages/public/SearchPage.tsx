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
  FiAlertCircle,
  FiClock,
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

  const emergencyQ =
    searchParams.get('emergency') === 'true';


  /* =========================================================
     LOCAL INPUT STATE
  ========================================================= */

  const [
    searchInput,
    setSearchInput,
  ] = useState(serviceQ);


  const [
    districtInput,
    setDistrictInput,
  ] = useState(districtQ);


  const [
    emergencyOnly,
    setEmergencyOnly,
  ] = useState(emergencyQ);


  /* =========================================================
     LOAD HOSPITALS
  ========================================================= */

  const loadHospitals = useCallback(async () => {

    setLoading(true);

    try {

      const params: Record<
        string,
        string | boolean
      > = {};


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
     SYNC EMERGENCY FILTER WITH URL
  ========================================================= */

  useEffect(() => {

    setEmergencyOnly(
      emergencyQ
    );

  }, [emergencyQ]);


  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearch = (
    isEmergency?: boolean
  ) => {

    const params: Record<
      string,
      string
    > = {};


    if (searchInput.trim()) {

      params.service =
        searchInput.trim();

    }


    if (districtInput) {

      params.district =
        districtInput;

    }


    const emergency =
      isEmergency ?? emergencyOnly;


    if (emergency) {

      params.emergency =
        'true';

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
     CLEAR FILTERS
  ========================================================= */

  const clearAllFilters = () => {

    setSearchInput('');

    setDistrictInput('');

    setEmergencyOnly(false);

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
     CHECK EMERGENCY CAPABILITY
  ========================================================= */

  const isEmergencyCapable = (
    hospital: HospitalListItem
  ): boolean => {

    return (

      !!hospital.emergency_contact ||

      hospital.services?.some(
        (service) =>
          service.service_name
            .toLowerCase()
            .includes('emergency')
      ) ||

      hospital.availability?.some(
        (availability) =>

          availability.availability_type
            .toLowerCase()
            .includes('emergency') &&

          (
            availability.status ===
              'available' ||

            availability.status ===
              'limited'
          )
      ) ||

      false

    );

  };


  /* =========================================================
     FILTER EMERGENCY HOSPITALS
  ========================================================= */

  const displayedHospitals =
    emergencyOnly
      ? hospitals.filter(
          isEmergencyCapable
        )
      : hospitals;


  /* =========================================================
     GET BED COUNT
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
     GET RELEVANT AVAILABILITY
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

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">


      {/* =====================================================
          HERO
      ===================================================== */}

      <div className="text-center mb-8 pt-4">

        <span
          className="
            inline-block
            bg-blue-100
            text-blue-700
            text-xs
            font-semibold
            px-4
            py-2
            rounded-full
            mb-4
          "
        >
          Healthcare Availability & Referral Platform
        </span>


        <h1
          className="
            text-3xl
            md:text-5xl
            font-bold
            text-gray-900
          "
        >
          Find the right care{' '}

          <span className="text-blue-600">
            before you travel.
          </span>

        </h1>


        <p
          className="
            mt-4
            text-gray-500
            max-w-2xl
            mx-auto
          "
        >
          Search hospitals by treatment,
          bed availability, specialist
          availability and emergency services.
        </p>

      </div>


      {/* =====================================================
          SEARCH BAR
      ===================================================== */}

      <div
        className="
          bg-white
          rounded-xl
          shadow-sm
          border
          border-gray-100
          p-4
          mb-4
        "
      >

        <div
          className="
            flex
            flex-col
            sm:flex-row
            gap-3
            mb-3
          "
        >


          {/* Service Search */}

          <div className="relative flex-1">

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
              className="input pl-9"
              placeholder="Search by service: ICU, MRI, Dialysis..."
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              onKeyDown={handleKeyDown}
              list="service-options"
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


          {/* District */}

          <div className="relative sm:w-52">

            <FiMapPin
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
                z-10
              "
            />


            <select
              className="input pl-9"
              value={districtInput}
              onChange={(event) =>
                setDistrictInput(
                  event.target.value
                )
              }
            >

              <option value="">
                All districts
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


          {/* Search Button */}

          <button
            onClick={() =>
              handleSearch(false)
            }
            className="btn-primary px-6"
          >

            <FiSearch />

            Search

          </button>


          {/* Emergency Button */}

          <button
            onClick={() => {

              setEmergencyOnly(true);

              handleSearch(true);

            }}
            className="
              px-4
              py-2
              bg-red-600
              hover:bg-red-700
              text-white
              font-semibold
              rounded-lg
              flex
              items-center
              justify-center
              gap-2
              transition-colors
              text-sm
            "
          >

            <FiAlertCircle />

            Emergency

          </button>

        </div>


        {/* ===================================================
            EMERGENCY TOGGLE
        =================================================== */}

        <div className="flex items-center gap-3">

          <label
            className="
              flex
              items-center
              gap-2
              cursor-pointer
              select-none
            "
          >

            <div className="relative">

              <input
                type="checkbox"
                className="sr-only"
                checked={emergencyOnly}
                onChange={(event) => {

                  const checked =
                    event.target.checked;


                  setEmergencyOnly(
                    checked
                  );


                  const params: Record<
                    string,
                    string
                  > = {};


                  if (serviceQ) {

                    params.service =
                      serviceQ;

                  }


                  if (districtQ) {

                    params.district =
                      districtQ;

                  }


                  if (checked) {

                    params.emergency =
                      'true';

                  }


                  setSearchParams(
                    params
                  );

                }}
              />


              <div
                className={`
                  w-10
                  h-5
                  rounded-full
                  transition-colors

                  ${
                    emergencyOnly
                      ? 'bg-red-500'
                      : 'bg-gray-300'
                  }
                `}
              />


              <div
                className={`
                  absolute
                  top-0.5
                  left-0.5
                  w-4
                  h-4
                  bg-white
                  rounded-full
                  shadow
                  transition-transform

                  ${
                    emergencyOnly
                      ? 'translate-x-5'
                      : 'translate-x-0'
                  }
                `}
              />

            </div>


            <span
              className={`
                text-sm
                font-medium

                ${
                  emergencyOnly
                    ? 'text-red-700'
                    : 'text-gray-600'
                }
              `}
            >

              {emergencyOnly
                ? '🚨 Emergency filter ON — showing emergency-capable hospitals only'
                : 'Show emergency-capable hospitals only'}

            </span>

          </label>


          {emergencyOnly && (

            <button
              onClick={() => {

                setEmergencyOnly(false);


                const params: Record<
                  string,
                  string
                > = {};


                if (serviceQ) {

                  params.service =
                    serviceQ;

                }


                if (districtQ) {

                  params.district =
                    districtQ;

                }


                setSearchParams(
                  params
                );

              }}
              className="
                text-xs
                text-gray-500
                hover:text-red-600
                underline
              "
            >
              Clear
            </button>

          )}

        </div>

      </div>


      {/* =====================================================
          RESULTS HEADER
      ===================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          mb-4
        "
      >

        <div className="text-sm text-gray-600">

          {loading
            ? 'Searching...'
            : (
              <>

                {displayedHospitals.length >
                0 ? (

                  <span>

                    <strong>
                      {
                        displayedHospitals.length
                      }
                    </strong>


                    {emergencyOnly &&
                      total !==
                        displayedHospitals.length &&
                      ` of ${total}`}


                    {' hospital'}

                    {displayedHospitals.length !==
                    1
                      ? 's'
                      : ''}


                    {' found'}


                    {serviceQ
                      ? ` for "${serviceQ}"`
                      : ''}


                    {districtQ
                      ? ` in ${districtQ}`
                      : ''}


                    {emergencyOnly && (

                      <span
                        className="
                          ml-1
                          text-red-600
                          font-medium
                        "
                      >
                        · Emergency filter active
                      </span>

                    )}

                  </span>

                ) : (

                  <span>

                    No results

                    {emergencyOnly
                      ? ' with emergency capability'
                      : ''}

                  </span>

                )}

              </>
            )}

        </div>


        {(serviceQ ||
          districtQ ||
          emergencyOnly) && (

          <button
            onClick={
              clearAllFilters
            }
            className="
              text-xs
              text-gray-500
              hover:text-red-600
              underline
            "
          >

            Clear all filters

          </button>

        )}

      </div>


      {/* =====================================================
          RESULTS
      ===================================================== */}

      {loading ? (

        <LoadingSpinner
          text="Finding suitable hospitals..."
        />

      ) : displayedHospitals.length ===
        0 ? (

        <EmptyState
          icon="🏥"

          title={
            emergencyOnly
              ? 'No emergency-capable hospitals found'
              : 'No hospitals found'
          }

          description={
            emergencyOnly

              ? 'No hospitals with emergency services were found matching your filters. Try removing the emergency filter or changing your district.'

              : serviceQ

              ? `No hospitals currently report "${serviceQ}" as a service. Try a different term or remove the district filter.`

              : 'Try searching for ICU, Cardiology, MRI, Dialysis or another healthcare service.'
          }

          action={

            <div
              className="
                flex
                gap-3
                flex-wrap
                justify-center
              "
            >

              {emergencyOnly && (

                <button
                  onClick={() => {

                    setEmergencyOnly(
                      false
                    );


                    const params: Record<
                      string,
                      string
                    > = {};


                    if (serviceQ) {

                      params.service =
                        serviceQ;

                    }


                    if (districtQ) {

                      params.district =
                        districtQ;

                    }


                    setSearchParams(
                      params
                    );

                  }}
                  className="
                    btn-primary
                    btn-sm
                  "
                >

                  Remove Emergency Filter

                </button>

              )}


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

            </div>

          }
        />

      ) : (

        <div
          className="
            grid
            gap-4
            md:grid-cols-2
            xl:grid-cols-3
          "
        >

          {displayedHospitals.map(
            (hospital) => {


              const avail =
                getRelevantAvail(
                  hospital
                );


              const hasStale =
                avail.some(
                  (availability) =>
                    availability
                      .freshness_label ===
                    'stale'
                );


              const bedCount =
                getBedCount(
                  hospital
                );


              const emergencyCapable =
                isEmergencyCapable(
                  hospital
                );


              /* Most recent update */

              const latestUpdate =
                avail.length > 0

                  ? avail.reduce(
                      (
                        latest,
                        availability
                      ) => {

                        return (
                          new Date(
                            availability.updated_at
                          ) >
                          new Date(
                            latest.updated_at
                          )
                        )
                          ? availability
                          : latest;

                      }
                    )

                  : null;


              return (

                <div
                  key={hospital.id}
                  className={`
                    card
                    hover:shadow-md
                    transition-shadow
                    border

                    ${
                      emergencyOnly &&
                      emergencyCapable

                        ? `
                          border-red-300
                          bg-red-50/30
                        `

                        : hasStale

                        ? `
                          border-orange-200
                        `

                        : `
                          border-gray-100
                        `
                    }
                  `}
                >


                  {/* =========================================
                      EMERGENCY BADGE
                  ========================================= */}

                  {emergencyCapable && (

                    <div
                      className="
                        flex
                        items-center
                        gap-1
                        text-xs
                        text-red-700
                        font-medium
                        bg-red-50
                        border
                        border-red-100
                        rounded
                        px-2
                        py-0.5
                        mb-2
                        w-fit
                      "
                    >

                      <FiAlertCircle
                        className="
                          flex-shrink-0
                        "
                      />

                      Emergency Services Available

                    </div>

                  )}


                  {/* =========================================
                      HEADER
                  ========================================= */}

                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      mb-2
                    "
                  >

                    <div
                      className="
                        flex-1
                        min-w-0
                      "
                    >

                      <h3
                        className="
                          font-semibold
                          text-gray-900
                          text-base
                          leading-tight
                          truncate
                        "
                      >

                        {hospital.name}

                      </h3>


                      <div
                        className="
                          flex
                          items-center
                          gap-1
                          text-sm
                          text-gray-500
                          mt-1
                        "
                      >

                        <FiMapPin
                          className="
                            flex-shrink-0
                            text-xs
                          "
                        />


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
                              ml-1
                              text-primary-600
                              font-medium
                              text-xs
                              flex-shrink-0
                            "
                          >

                            ·{' '}
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


                    <span
                      className="
                        badge
                        bg-blue-50
                        text-blue-700
                        ml-2
                        flex-shrink-0
                        capitalize
                      "
                    >

                      {hospital.type_display ||
                        hospital.type}

                    </span>

                  </div>


                  {/* =========================================
                      BED COUNT
                  ========================================= */}

                  {bedCount != null && (

                    <div
                      className="
                        flex
                        items-center
                        gap-1.5
                        text-xs
                        mb-2
                        text-gray-700
                      "
                    >

                      <span className="font-medium">

                        🛏 Available beds:

                      </span>


                      <span
                        className={`
                          font-bold

                          ${
                            bedCount === 0

                              ? 'text-red-600'

                              : bedCount < 5

                              ? 'text-orange-600'

                              : 'text-green-700'
                          }
                        `}
                      >

                        {bedCount}

                      </span>

                    </div>

                  )}


                  {/* =========================================
                      SERVICES
                  ========================================= */}

                  {hospital.services &&
                    hospital.services.length >
                      0 && (

                    <div
                      className="
                        flex
                        flex-wrap
                        gap-1
                        mb-3
                      "
                    >

                      {hospital.services
                        .slice(0, 4)
                        .map(
                          (service) => (

                            <span
                              key={
                                service.id
                              }
                              className="
                                text-xs
                                bg-gray-100
                                text-gray-600
                                px-2
                                py-0.5
                                rounded-full
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
                            text-xs
                            text-gray-400
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


                  {/* =========================================
                      AVAILABILITY
                  ========================================= */}

                  {avail.length > 0 ? (

                    <div
                      className="
                        border-t
                        border-gray-100
                        pt-3
                        mb-3
                        space-y-2
                      "
                    >

                      {avail.map(
                        (availability) => (

                          <div
                            key={
                              availability.id
                            }
                            className="
                              flex
                              items-center
                              justify-between
                              gap-2
                              text-xs
                            "
                          >

                            <span
                              className="
                                text-gray-600
                                capitalize
                              "
                            >

                              {availability.availability_type_display ||
                                availability.availability_type}


                              {availability.available_count !=
                                null && (

                                <span
                                  className="
                                    ml-1
                                    font-medium
                                  "
                                >

                                  (
                                  {
                                    availability.available_count
                                  }
                                  )

                                </span>

                              )}

                            </span>


                            <div
                              className="
                                flex
                                items-center
                                gap-1.5
                              "
                            >

                              <StatusBadge
                                status={
                                  availability.status
                                }
                                size="sm"
                              />


                              {/* FIXED:
                                  FreshnessTag does not use size prop */}

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
                        border-t
                        border-gray-100
                        pt-3
                        mb-3
                      "
                    >

                      <div
                        className="
                          bg-gray-50
                          border
                          border-gray-100
                          rounded-lg
                          p-3
                        "
                      >

                        <p
                          className="
                            text-sm
                            font-medium
                            text-gray-700
                          "
                        >

                          Live availability not reported

                        </p>


                        <p
                          className="
                            text-xs
                            text-gray-400
                            mt-1
                          "
                        >

                          View hospital details or call
                          to confirm current availability.

                        </p>

                      </div>

                    </div>

                  )}


                  {/* =========================================
                      LAST UPDATED
                  ========================================= */}

                  {latestUpdate && (

                    <div
                      className="
                        flex
                        items-center
                        gap-1
                        text-xs
                        text-gray-400
                        mb-2
                      "
                    >

                      <FiClock
                        className="
                          flex-shrink-0
                        "
                      />


                      <span>

                        Updated{' '}

                        {format(
                          new Date(
                            latestUpdate.updated_at
                          ),
                          'MMM d, HH:mm'
                        )}

                      </span>

                    </div>

                  )}


                  {/* =========================================
                      STALE WARNING
                  ========================================= */}

                  {hasStale && (

                    <p
                      className="
                        text-xs
                        text-orange-600
                        mb-2
                      "
                    >

                      ⚠ Some data is stale —
                      call to confirm

                    </p>

                  )}


                  {/* =========================================
                      FOOTER
                  ========================================= */}

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      mt-2
                      pt-2
                      border-t
                      border-gray-100
                    "
                  >

                    {hospital.emergency_contact ||
                    hospital.phone ? (

                      <a
                        href={`tel:${
                          hospital.emergency_contact ||
                          hospital.phone
                        }`}
                        className="
                          flex
                          items-center
                          gap-1
                          text-xs
                          text-primary-700
                          hover:underline
                        "
                      >

                        <FiPhone
                          className="
                            text-xs
                          "
                        />


                        {hospital.emergency_contact ||
                          hospital.phone}

                      </a>

                    ) : (

                      <span />

                    )}


                    <Link
                      to={`/hospital/${hospital.id}`}
                      className="
                        btn-primary
                        btn-sm
                        text-xs
                      "
                    >

                      View Details

                      <FiChevronRight
                        className="
                          text-xs
                        "
                      />

                    </Link>

                  </div>

                </div>

              );

            }
          )}

        </div>

      )}

    </div>

  );

};

import React, { useEffect, useState } from 'react';

import {
  useParams,
  Link,
  useNavigate,
  useLocation,
  Navigate,
} from 'react-router-dom';

import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiGlobe,
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiClock,
  FiCheckCircle,
  FiHeart,
} from 'react-icons/fi';

import { GiHeartPlus } from 'react-icons/gi';

import { format, isValid } from 'date-fns';

import { hospitalsApi } from '../../lib/api';

import type { Hospital } from '../../types';

import { StatusBadge } from '../../components/common/StatusBadge';
import { FreshnessTag } from '../../components/common/FreshnessTag';
import { DataFreshnessAlert } from '../../components/common/DataFreshnessAlert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

export const HospitalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, isHealthWorker } = useAuthStore();

  const authenticated = isAuthenticated();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // LOAD HOSPITAL DETAILS

  useEffect(() => {
    if (!authenticated) return;

    if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
      setError('Invalid hospital ID.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadHospital = async () => {
      setLoading(true);
      setError('');
      setHospital(null);

      try {
        const response = await hospitalsApi.get(Number(id));

        if (!cancelled) {
          setHospital(response.data);
        }
      } catch (err) {
        console.error('Failed to load hospital:', err);

        if (!cancelled) {
          setError(
            'Unable to load hospital details. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadHospital();

    return () => {
      cancelled = true;
    };
  }, [id, authenticated]);

  // LOGIN PROTECTION

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
          },
        }}
      />
    );
  }

  // LOADING

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <LoadingSpinner text="Loading hospital details…" />
      </div>
    );
  }

  // ERROR

  if (error || !hospital) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16">

        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl text-primary-700">
            <GiHeartPlus />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-gray-900">
            {error || 'Hospital not found'}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            We couldn't retrieve the requested hospital information.
          </p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary mt-6 inline-flex items-center gap-2"
          >
            <FiArrowLeft />
            Go Back
          </button>

        </div>
      </div>
    );
  }

  // AVAILABILITY INFORMATION

  const activeAvailability = (
    hospital.availability || []
  ).filter((availability) => availability.is_active);

  const hasStale = activeAvailability.some(
    (availability) =>
      availability.freshness_label === 'stale'
  );

  const hasOld = activeAvailability.some(
    (availability) =>
      availability.freshness_label === 'old'
  );

  // HOSPITAL ADDRESS

  const hospitalAddress = [
    hospital.address,
    hospital.municipality,
    hospital.district,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-white">

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* BACK BUTTON */}

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary-700"
        >
          <FiArrowLeft />
          Back to results
        </button>

        {/* DATA FRESHNESS ALERT */}

        <DataFreshnessAlert
          hasStale={hasStale}
          hasOld={hasOld}
        />

        {/* HOSPITAL HEADER */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 via-white to-gray-50 px-6 py-8 sm:px-8">

            {/* HOSPITAL ICON */}

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl text-primary-700">
              <GiHeartPlus />
            </div>

            {/* HOSPITAL NAME */}

            <div className="flex flex-wrap items-center gap-3">

              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {hospital.name}
              </h1>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                {hospital.type_display || hospital.type}
              </span>

              {hospital.verification_status === 'verified' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  <FiCheckCircle />
                  Verified
                </span>
              )}

            </div>

            {/* ADDRESS */}

            <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">

              <FiMapPin className="mt-0.5 flex-shrink-0 text-primary-700" />

              <span>
                {hospitalAddress || 'Address not available'}
              </span>

            </div>

            {/* REFERRAL BUTTON */}

            {isHealthWorker() && (
              <Link
                to={`/user/new-referral?destination=${hospital.id}`}
                className="btn-primary mt-6 inline-flex items-center gap-2"
              >
                Request Referral to This Hospital
                <FiArrowRight />
              </Link>
            )}

          </div>

          {/* CONTACT INFORMATION */}

          <div className="px-6 py-6 sm:px-8">

            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FiPhone className="text-primary-700" />
              Hospital Contact Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {/* EMERGENCY CONTACT */}

              {hospital.emergency_contact && (
                <a
                  href={`tel:${hospital.emergency_contact}`}
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100"
                >

                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <FiPhone />
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-medium text-red-600">
                      Emergency Contact
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-red-700">
                      {hospital.emergency_contact}
                    </p>

                  </div>

                </a>
              )}

              {/* PHONE NUMBER */}

              {hospital.phone && (
                <a
                  href={`tel:${hospital.phone}`}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
                >

                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary-700">
                    <FiPhone />
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-medium text-gray-500">
                      Phone Number
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                      {hospital.phone}
                    </p>

                  </div>

                </a>
              )}

              {/* EMAIL */}

              {hospital.email && (
                <a
                  href={`mailto:${hospital.email}`}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
                >

                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary-700">
                    <FiMail />
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-medium text-gray-500">
                      Email Address
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                      {hospital.email}
                    </p>

                  </div>

                </a>
              )}

              {/* WEBSITE */}

              {hospital.website && (
                <a
                  href={hospital.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
                >

                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary-700">
                    <FiGlobe />
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-medium text-gray-500">
                      Hospital Website
                    </p>

                    <p className="mt-1 text-sm font-semibold text-primary-700">
                      Visit Website
                    </p>

                  </div>

                </a>
              )}

            </div>

            {!hospital.emergency_contact &&
              !hospital.phone &&
              !hospital.email &&
              !hospital.website && (
                <p className="text-sm text-gray-500">
                  Contact information has not been provided.
                </p>
              )}

          </div>

        </section>

        {/* HOSPITAL LOCATION */}

        {hospital.lat != null && hospital.lng != null && (
          <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FiMapPin className="text-primary-700" />
              Hospital Location
            </h2>

            <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5 text-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-primary-700 shadow-sm">
                <FiMapPin />
              </div>

              <p className="text-sm font-semibold text-gray-800">
                {hospital.district}, Nepal
              </p>

              <p className="text-xs text-gray-500">
                {Number(hospital.lat).toFixed(4)}°N,{' '}
                {Number(hospital.lng).toFixed(4)}°E
              </p>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${hospital.lat},${hospital.lng}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiMapPin />
                View on Map
                <FiArrowRight />
              </a>

            </div>

          </section>
        )}

        {/* CURRENT AVAILABILITY */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* AVAILABILITY HEADER */}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 sm:px-8">

            <div>

              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FiHeart className="text-primary-700" />
                Current Reported Availability
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Hospital-reported healthcare resource information
              </p>

            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
              <FiAlertCircle />
              Hospital-reported data
            </span>

          </div>

          {/* AVAILABILITY TABLE */}

          <div className="p-4 sm:p-6">

            {activeAvailability.length > 0 ? (

              <div className="overflow-x-auto rounded-xl border border-gray-200">

                <table className="w-full min-w-[650px] text-left text-sm">

                  <thead className="bg-gray-50 text-gray-600">

                    <tr>

                      <th className="px-4 py-3 font-semibold">
                        Type
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Status
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Count
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Last Updated
                      </th>

                      <th className="px-4 py-3 font-semibold">
                        Freshness
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-gray-100">

                    {activeAvailability.map((availability) => {

                      const updatedAt = new Date(
                        availability.updated_at
                      );

                      const formattedDate = isValid(updatedAt)
                        ? format(updatedAt, 'MMM d, HH:mm')
                        : 'Not available';

                      return (
                        <tr
                          key={availability.id}
                          className="transition-colors hover:bg-gray-50"
                        >

                          {/* TYPE */}

                          <td className="px-4 py-4">

                            <p className="font-medium capitalize text-gray-900">
                              {availability.availability_type_display ||
                                availability.availability_type}
                            </p>

                            {availability.service_name && (
                              <p className="mt-1 text-xs text-gray-500">
                                {availability.service_name}
                              </p>
                            )}

                            {availability.notes && (
                              <p className="mt-1 text-xs text-gray-500">
                                {availability.notes}
                              </p>
                            )}

                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4">

                            <StatusBadge
                              status={availability.status}
                            />

                          </td>

                          {/* COUNT */}

                          <td className="px-4 py-4 text-gray-600">

                            {availability.available_count != null
                              ? `${availability.available_count}${
                                  availability.total_count != null
                                    ? `/${availability.total_count}`
                                    : ''
                                }`
                              : '—'}

                          </td>

                          {/* LAST UPDATED */}

                          <td className="px-4 py-4">

                            <div className="flex items-center gap-1.5 text-xs text-gray-600">

                              <FiClock className="flex-shrink-0" />

                              {formattedDate}

                            </div>

                            <p className="mt-1 text-xs text-gray-400">
                              {availability.updated_by_name ||
                                availability.source}
                            </p>

                          </td>

                          {/* FRESHNESS */}

                          <td className="px-4 py-4">

                            <FreshnessTag
                              label={availability.freshness_label}
                              minutesAgo={availability.freshness_minutes}
                              showTime
                            />

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="rounded-xl bg-gray-50 px-6 py-10 text-center">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl text-primary-700">
                  <FiAlertCircle />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-gray-800">
                  Availability not reported
                </h3>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  No current availability data has been reported.
                  Contact the hospital directly to confirm availability.
                </p>

              </div>

            )}

          </div>

        </section>

        {/* HOSPITAL SERVICES */}

        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="mb-5">

            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <GiHeartPlus className="text-primary-700" />
              Hospital Services
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Medical services normally provided by this hospital
            </p>

          </div>

          {hospital.services && hospital.services.length > 0 ? (

            <div className="flex flex-wrap gap-3">

              {hospital.services.map((service) => (

                <span
                  key={service.id}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${
                    service.is_available
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-100 text-gray-500'
                  }`}
                >

                  {service.is_available ? (
                    <FiCheckCircle />
                  ) : (
                    <FiAlertCircle />
                  )}

                  {service.service_name}

                </span>

              ))}

            </div>

          ) : (

            <p className="rounded-xl bg-gray-50 px-5 py-6 text-center text-sm text-gray-500">
              No hospital services have been listed yet.
            </p>

          )}

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

            <p className="flex items-start gap-2 text-xs leading-5 text-blue-700">

              <FiAlertCircle className="mt-0.5 flex-shrink-0" />

              <span>
                Services listed are normally provided.
                Current availability may differ.
                Please contact the hospital to confirm.
              </span>

            </p>

          </div>

        </section>

        {/* BOTTOM ACTION */}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50 px-6 py-5">

          <div>

            <h3 className="text-sm font-semibold text-gray-900">
              Need further assistance?
            </h3>

            <p className="mt-1 text-xs text-gray-600">
              Explore hospitals or request healthcare assistance.
            </p>

          </div>

          <div className="flex flex-wrap gap-3">

            <Link
              to="/"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <FiArrowLeft />
              Find Hospitals
            </Link>

            <Link
              to="/user/request-help"
              className="btn-primary inline-flex items-center gap-2"
            >
              Request Help
              <FiArrowRight />
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
};
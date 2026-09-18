import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiGlobe, FiAlertCircle, FiArrowLeft, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
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
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, isHealthWorker } = useAuthStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    hospitalsApi.get(Number(id))
      .then((res) => setHospital(res.data))
      .catch(() => setError('Hospital not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading hospital details…" fullPage />;
  if (error || !hospital) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🏥</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{error || 'Hospital not found'}</h2>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <FiArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  const hasStale = hospital.availability?.some((a) => a.freshness_label === 'stale') ?? false;
  const hasOld = hospital.availability?.some((a) => a.freshness_label === 'old') ?? false;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-700 mb-4 transition-colors"
      >
        <FiArrowLeft /> Back to results
      </button>

      <DataFreshnessAlert hasStale={hasStale} hasOld={hasOld} />

      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{hospital.name}</h1>
              <span className="badge bg-blue-100 text-blue-700 capitalize">
                {hospital.type_display || hospital.type}
              </span>
              {hospital.verification_status === 'verified' && (
                <span className="badge bg-green-100 text-green-700">✓ Verified</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-gray-600 text-sm">
              <FiMapPin className="flex-shrink-0" />
              <span>{hospital.address}, {hospital.municipality}, {hospital.district}</span>
            </div>
          </div>
          {isAuthenticated() && isHealthWorker() && (
            <Link
              to={`/hw/referrals/new?destination=${hospital.id}`}
              className="btn-primary"
            >
              Request Referral to This Hospital
            </Link>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-4 grid sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
          {hospital.emergency_contact && (
            <a href={`tel:${hospital.emergency_contact}`} className="flex items-center gap-2 text-sm text-red-700 font-medium hover:underline">
              <FiPhone className="text-red-500" />
              Emergency: {hospital.emergency_contact}
            </a>
          )}
          {hospital.phone && (
            <a href={`tel:${hospital.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-700">
              <FiPhone /> {hospital.phone}
            </a>
          )}
          {hospital.email && (
            <a href={`mailto:${hospital.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-700 truncate">
              <FiMail /> {hospital.email}
            </a>
          )}
          {hospital.website && (
            <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-700 truncate">
              <FiGlobe /> Website
            </a>
          )}
        </div>
      </div>

      {/* Map placeholder */}
      {hospital.lat && hospital.lng && (
        <div className="card mb-4">
          <h2 className="section-title">Location</h2>
          <div className="bg-blue-50 border border-blue-100 rounded-lg h-40 flex items-center justify-center text-gray-500 text-sm">
            <FiMapPin className="mr-2 text-primary-600" />
            {hospital.lat.toFixed(4)}°N, {hospital.lng.toFixed(4)}°E — {hospital.district}
          </div>
        </div>
      )}

      {/* Availability */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title m-0">Current Reported Availability</h2>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <FiAlertCircle /> Hospital-reported data
          </span>
        </div>

        {hospital.availability && hospital.availability.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Count</th>
                  <th className="hidden md:table-cell">Last Updated</th>
                  <th>Freshness</th>
                </tr>
              </thead>
              <tbody>
                {hospital.availability.filter((a) => a.is_active).map((a) => (
                  <tr key={a.id}>
                    <td className="font-medium capitalize">
                      {a.availability_type_display || a.availability_type}
                      {a.service_name && (
                        <span className="block text-xs text-gray-400 font-normal">{a.service_name}</span>
                      )}
                      {a.notes && (
                        <span className="block text-xs text-gray-400 font-normal">{a.notes}</span>
                      )}
                    </td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="hidden sm:table-cell text-gray-600">
                      {a.available_count != null
                        ? `${a.available_count}${a.total_count != null ? `/${a.total_count}` : ''}`
                        : '—'}
                    </td>
                    <td className="hidden md:table-cell text-gray-500 text-xs">
                      <div className="flex items-center gap-1">
                        <FiClock className="flex-shrink-0" />
                        {format(new Date(a.updated_at), 'MMM d, HH:mm')}
                      </div>
                      <div className="text-gray-400">{a.updated_by_name || a.source}</div>
                    </td>
                    <td><FreshnessTag label={a.freshness_label} minutesAgo={a.freshness_minutes} showTime /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-4 text-center">
            No availability data reported yet. Call the hospital directly.
          </p>
        )}
      </div>

      {/* Services */}
      {hospital.services && hospital.services.length > 0 && (
        <div className="card">
          <h2 className="section-title">Services Normally Provided</h2>
          <div className="flex flex-wrap gap-2">
            {hospital.services.map((hs) => (
              <span
                key={hs.id}
                className={`badge ${hs.is_available ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'}`}
              >
                {hs.service_name}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Services listed are normally provided. Current availability may differ — check the table above.
          </p>
        </div>
      )}
    </div>
  );
};

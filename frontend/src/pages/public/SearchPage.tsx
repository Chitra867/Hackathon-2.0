import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiPhone, FiChevronRight, FiAlertCircle, FiClock } from 'react-icons/fi';
import { hospitalsApi, servicesApi } from '../../lib/api';
import type { HospitalListItem, Service } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FreshnessTag } from '../../components/common/FreshnessTag';
import { LoadingSpinner, EmptyState } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const NEPAL_DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Kaski',
  'Morang', 'Rupandehi', 'Sunsari', 'Makwanpur', 'Banke',
  'Pokhara', 'Biratnagar', 'Butwal', 'Dharan', 'Hetauda', 'Nepalgunj',
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<HospitalListItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const serviceQ = searchParams.get('service') || '';
  const districtQ = searchParams.get('district') || '';
  const emergencyQ = searchParams.get('emergency') === 'true';

  const [searchInput, setSearchInput] = useState(serviceQ);
  const [districtInput, setDistrictInput] = useState(districtQ);
  const [emergencyOnly, setEmergencyOnly] = useState(emergencyQ);

  const loadHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (serviceQ) params.service = serviceQ;
      if (districtQ) params.district = districtQ;
      const res = await hospitalsApi.list(params);
      setHospitals(res.data.results);
      setTotal(res.data.count);
    } catch {
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, [serviceQ, districtQ]);

  useEffect(() => { loadHospitals(); }, [loadHospitals]);
  useEffect(() => {
    servicesApi.list().then((r) => setServices(r.data.results)).catch(() => {});
  }, []);

  // Sync emergency toggle from URL
  useEffect(() => { setEmergencyOnly(emergencyQ); }, [emergencyQ]);

  const handleSearch = (isEmergency?: boolean) => {
    const params: Record<string, string> = {};
    if (searchInput.trim()) params.service = searchInput.trim();
    if (districtInput) params.district = districtInput;
    const em = isEmergency ?? emergencyOnly;
    if (em) params.emergency = 'true';
    setSearchParams(params);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const getTopAvailability = (hospital: HospitalListItem) =>
    hospital.availability?.filter((a) => a.is_active).slice(0, 3) ?? [];

  // For emergency toggle: highlight hospitals that have emergency service availability
  const isEmergencyCapable = (hospital: HospitalListItem): boolean => {
    return (
      !!hospital.emergency_contact ||
      hospital.services?.some((s) =>
        s.service_name.toLowerCase().includes('emergency')
      ) ||
      hospital.availability?.some((a) =>
        a.availability_type.toLowerCase().includes('emergency') &&
        (a.status === 'available' || a.status === 'limited')
      ) ||
      false
    );
  };

  // Filter results when emergency toggle is on
  const displayedHospitals = emergencyOnly
    ? hospitals.filter(isEmergencyCapable)
    : hospitals;

  // Get bed count from availability
  const getBedCount = (hospital: HospitalListItem): number | null => {
    const bedEntry = hospital.availability?.find((a) =>
      a.availability_type.toLowerCase().includes('bed') ||
      a.availability_type.toLowerCase().includes('icu') ||
      a.availability_type.toLowerCase().includes('ward')
    );
    return bedEntry?.available_count ?? null;
  };

  // Get most relevant availability for the searched service
  const getRelevantAvail = (hospital: HospitalListItem) => {
    if (!serviceQ) return getTopAvailability(hospital);
    const serviceMatch = hospital.availability?.filter((a) =>
      a.service_name?.toLowerCase().includes(serviceQ.toLowerCase()) ||
      a.availability_type.toLowerCase().includes(serviceQ.toLowerCase())
    );
    if (serviceMatch && serviceMatch.length > 0) return serviceMatch.slice(0, 3);
    return getTopAvailability(hospital);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Search bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder="Search by service: ICU, MRI, Dialysis…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              list="service-options"
            />
            <datalist id="service-options">
              {services.map((s) => <option key={s.id} value={s.name} />)}
            </datalist>
          </div>
          <div className="relative sm:w-52">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <select
              className="input pl-9"
              value={districtInput}
              onChange={(e) => setDistrictInput(e.target.value)}
            >
              <option value="">All districts</option>
              {NEPAL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={() => handleSearch(false)} className="btn-primary px-6">
            <FiSearch /> Search
          </button>
          <button
            onClick={() => {
              setEmergencyOnly(true);
              handleSearch(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            <FiAlertCircle /> Emergency
          </button>
        </div>

        {/* Emergency toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={emergencyOnly}
                onChange={(e) => {
                  setEmergencyOnly(e.target.checked);
                  const params: Record<string, string> = {};
                  if (serviceQ) params.service = serviceQ;
                  if (districtQ) params.district = districtQ;
                  if (e.target.checked) params.emergency = 'true';
                  setSearchParams(params);
                }}
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  emergencyOnly ? 'bg-red-500' : 'bg-gray-300'
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  emergencyOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
            <span className={`text-sm font-medium ${emergencyOnly ? 'text-red-700' : 'text-gray-600'}`}>
              {emergencyOnly ? '🚨 Emergency filter ON — showing emergency-capable hospitals only' : 'Show emergency-capable hospitals only'}
            </span>
          </label>
          {emergencyOnly && (
            <button
              onClick={() => {
                setEmergencyOnly(false);
                const params: Record<string, string> = {};
                if (serviceQ) params.service = serviceQ;
                if (districtQ) params.district = districtQ;
                setSearchParams(params);
              }}
              className="text-xs text-gray-500 hover:text-red-600 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {loading ? 'Searching…' : (
            <>
              {displayedHospitals.length > 0 ? (
                <span>
                  <strong>{displayedHospitals.length}</strong>
                  {emergencyOnly && total !== displayedHospitals.length && ` of ${total}`} hospital{displayedHospitals.length !== 1 ? 's' : ''} found
                  {serviceQ ? ` for "${serviceQ}"` : ''}
                  {districtQ ? ` in ${districtQ}` : ''}
                  {emergencyOnly && <span className="ml-1 text-red-600 font-medium">· Emergency filter active</span>}
                </span>
              ) : (
                <span>No results{emergencyOnly ? ' with emergency capability' : ''}</span>
              )}
            </>
          )}
        </div>
        {(serviceQ || districtQ || emergencyOnly) && (
          <button
            onClick={() => {
              setSearchInput('');
              setDistrictInput('');
              setEmergencyOnly(false);
              setSearchParams({});
            }}
            className="text-xs text-gray-500 hover:text-red-600 underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner text="Finding suitable hospitals…" />
      ) : displayedHospitals.length === 0 ? (
        <EmptyState
          icon="🏥"
          title={emergencyOnly ? 'No emergency-capable hospitals found' : 'No hospitals found'}
          description={
            emergencyOnly
              ? 'No hospitals with emergency services were found matching your filters. Try removing the emergency filter or changing your district.'
              : serviceQ
              ? `No hospitals currently report "${serviceQ}" as a service. Try a different term or remove the district filter.`
              : 'Enter a service to search for hospitals.'
          }
          action={
            <div className="flex gap-3 flex-wrap justify-center">
              {emergencyOnly && (
                <button
                  onClick={() => {
                    setEmergencyOnly(false);
                    const params: Record<string, string> = {};
                    if (serviceQ) params.service = serviceQ;
                    if (districtQ) params.district = districtQ;
                    setSearchParams(params);
                  }}
                  className="btn-primary btn-sm"
                >
                  Remove Emergency Filter
                </button>
              )}
              <button onClick={() => navigate('/')} className="btn-secondary btn-sm">
                Back to Home
              </button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayedHospitals.map((hospital) => {
            const avail = getRelevantAvail(hospital);
            const hasStale = avail.some((a) => a.freshness_label === 'stale');
            const bedCount = getBedCount(hospital);
            const isEmergency = isEmergencyCapable(hospital);
            // Most recent update
            const latestUpdate = avail.length > 0
              ? avail.reduce((latest, a) =>
                  new Date(a.updated_at) > new Date(latest.updated_at) ? a : latest
                )
              : null;

            return (
              <div
                key={hospital.id}
                className={`card hover:shadow-md transition-shadow border ${
                  emergencyOnly && isEmergency
                    ? 'border-red-300 bg-red-50/30'
                    : hasStale
                    ? 'border-orange-200'
                    : 'border-gray-100'
                }`}
              >
                {/* Emergency badge */}
                {isEmergency && (
                  <div className="flex items-center gap-1 text-xs text-red-700 font-medium bg-red-50 border border-red-100 rounded px-2 py-0.5 mb-2 w-fit">
                    <FiAlertCircle className="flex-shrink-0" />
                    Emergency Services Available
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">
                      {hospital.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <FiMapPin className="flex-shrink-0 text-xs" />
                      <span className="truncate">
                        {hospital.district}{hospital.municipality ? `, ${hospital.municipality}` : ''}
                      </span>
                      {hospital.distance_km != null && (
                        <span className="ml-1 text-primary-600 font-medium text-xs flex-shrink-0">
                          · {hospital.distance_km.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="badge bg-blue-50 text-blue-700 ml-2 flex-shrink-0 capitalize">
                    {hospital.type_display || hospital.type}
                  </span>
                </div>

                {/* Available beds highlight */}
                {bedCount != null && (
                  <div className="flex items-center gap-1.5 text-xs mb-2 text-gray-700">
                    <span className="font-medium">🛏 Available beds:</span>
                    <span className={`font-bold ${bedCount === 0 ? 'text-red-600' : bedCount < 5 ? 'text-orange-600' : 'text-green-700'}`}>
                      {bedCount}
                    </span>
                  </div>
                )}

                {/* Services */}
                {hospital.services && hospital.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {hospital.services.slice(0, 4).map((s) => (
                      <span key={s.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {s.service_name}
                      </span>
                    ))}
                    {hospital.services.length > 4 && (
                      <span className="text-xs text-gray-400">+{hospital.services.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Availability snapshot */}
                {avail.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 mb-3 space-y-1.5">
                    {avail.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 capitalize">
                          {a.availability_type_display || a.availability_type}
                          {a.available_count != null && (
                            <span className="ml-1 font-medium">({a.available_count})</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={a.status} size="sm" />
                          <FreshnessTag label={a.freshness_label} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Last updated */}
                {latestUpdate && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <FiClock className="flex-shrink-0" />
                    <span>Updated {format(new Date(latestUpdate.updated_at), 'MMM d, HH:mm')}</span>
                  </div>
                )}

                {/* Warnings */}
                {hasStale && (
                  <p className="text-xs text-orange-600 mb-2">⚠ Some data is stale — call to confirm</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  {hospital.emergency_contact || hospital.phone ? (
                    <a
                      href={`tel:${hospital.emergency_contact || hospital.phone}`}
                      className="flex items-center gap-1 text-xs text-primary-700 hover:underline"
                    >
                      <FiPhone className="text-xs" />
                      {hospital.emergency_contact || hospital.phone}
                    </a>
                  ) : <span />}
                  <Link
                    to={`/hospital/${hospital.id}`}
                    className="btn-primary btn-sm text-xs"
                  >
                    View Details
                    <FiChevronRight className="text-xs" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

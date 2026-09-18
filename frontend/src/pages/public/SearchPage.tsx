import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiPhone, FiChevronRight, FiFilter } from 'react-icons/fi';
import { hospitalsApi, servicesApi } from '../../lib/api';
import type { HospitalListItem, Service } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FreshnessTag } from '../../components/common/FreshnessTag';
import { LoadingSpinner, EmptyState } from '../../components/common/LoadingSpinner';

const NEPAL_DISTRICTS = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Chitwan', 'Kaski',
  'Morang', 'Rupandehi', 'Sunsari', 'Makwanpur', 'Banke',
];

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<HospitalListItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  const serviceQ = searchParams.get('service') || '';
  const districtQ = searchParams.get('district') || '';
  const [searchInput, setSearchInput] = useState(serviceQ);
  const [districtInput, setDistrictInput] = useState(districtQ);

  const loadHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
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
  useEffect(() => { servicesApi.list().then((r) => setServices(r.data.results)).catch(() => {}); }, []);

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (searchInput.trim()) params.service = searchInput.trim();
    if (districtInput) params.district = districtInput;
    setSearchParams(params);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const getTopAvailability = (hospital: HospitalListItem) =>
    hospital.availability?.filter((a) => a.is_active).slice(0, 3) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Search bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
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
          <div className="relative sm:w-48">
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
          <button onClick={handleSearch} className="btn-primary px-6">
            <FiSearch /> Search
          </button>
          <button
            className="sm:hidden btn-secondary px-3"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <FiFilter />
          </button>
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {loading ? 'Searching…' : (
            <>
              {total > 0 ? (
                <span><strong>{total}</strong> hospital{total !== 1 ? 's' : ''} found{serviceQ ? ` for "${serviceQ}"` : ''}{districtQ ? ` in ${districtQ}` : ''}</span>
              ) : (
                <span>No results</span>
              )}
            </>
          )}
        </div>
        {serviceQ && (
          <button
            onClick={() => { setSearchInput(''); setDistrictInput(''); setSearchParams({}); }}
            className="text-xs text-gray-500 hover:text-red-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner text="Finding suitable hospitals…" />
      ) : hospitals.length === 0 ? (
        <EmptyState
          icon="🏥"
          title="No hospitals found"
          description={serviceQ ? `No hospitals currently report "${serviceQ}" as a service. Try a different term or remove the district filter.` : 'Enter a service to search for hospitals.'}
          action={
            <button onClick={() => navigate('/')} className="btn-secondary btn-sm">
              Back to Home
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hospitals.map((hospital) => {
            const avail = getTopAvailability(hospital);
            const hasStale = avail.some((a) => a.freshness_label === 'stale');
            const hasLimited = avail.some((a) => a.status === 'limited');
            const hasUnavailable = avail.some((a) => a.status === 'unavailable' || a.status === 'full');

            return (
              <div key={hospital.id} className={`card hover:shadow-md transition-shadow border ${hasStale ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">
                      {hospital.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <FiMapPin className="flex-shrink-0 text-xs" />
                      <span className="truncate">{hospital.district}{hospital.municipality ? `, ${hospital.municipality}` : ''}</span>
                    </div>
                  </div>
                  <span className="badge bg-blue-50 text-blue-700 ml-2 flex-shrink-0 capitalize">
                    {hospital.type_display || hospital.type}
                  </span>
                </div>

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
                          {a.available_count != null && ` (${a.available_count})`}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={a.status} size="sm" />
                          <FreshnessTag label={a.freshness_label} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {hasStale && (
                  <p className="text-xs text-red-600 mb-2">⚠ Some data is stale — call to confirm</p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-2">
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

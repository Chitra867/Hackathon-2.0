import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiNavigation, FiMapPin, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { userPortalApi } from '../../lib/api';
import type { HospitalSearchResult } from '../../types';
import { MapView } from '../../components/user/MapView';
import { SearchFilters, type SearchFiltersState } from '../../components/user/SearchFilters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getRoute, type RouteResult } from '../../components/map/mapSetup';

export const UserHospitalMap: React.FC = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<SearchFiltersState>({ q: '', district: '', emergency: false });
  const [hospitals, setHospitals] = useState<HospitalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const [selectedHospital, setSelectedHospital] = useState<HospitalSearchResult | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Get user location on mount
  useEffect(() => {
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setLocLoading(false); },
      () => setLocLoading(false)
    );
  }, []);

  // Load all verified hospitals by default
  useEffect(() => {
    doSearch(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = async (initial = false) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await userPortalApi.searchHospitals({
        q: initial ? undefined : filters.q || undefined,
        district: initial ? undefined : filters.district || undefined,
        emergency: initial ? undefined : filters.emergency || undefined,
        lat: userLat ?? undefined,
        lng: userLng ?? undefined,
        page_size: 50,
      });
      setHospitals(res.data.results);
    } catch {
      toast.error('Could not load hospitals.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHospital = async (hospital: HospitalSearchResult) => {
    setSelectedHospital(hospital);
    if (!userLat || !userLng || !hospital.lat || !hospital.lng) return;
    setRouteLoading(true);
    setRoute(null);
    try {
      const r = await getRoute(userLat, userLng, hospital.lat, hospital.lng);
      if (r) setRoute(r);
    } catch {
      // silently fail, user can still see the marker
    } finally {
      setRouteLoading(false);
    }
  };

  const handleGetLocation = () => {
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); setLocLoading(false); toast.success('Location updated.'); },
      () => { setLocLoading(false); toast.error('Could not get your location.'); }
    );
  };

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-56px)] overflow-hidden">
      {/* Top controls */}
      <div className="flex-shrink-0 p-3 md:p-4 bg-white border-b border-[#ede0ce] space-y-2 z-10">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-[#172554]">Hospital Map</h1>
          <button
            onClick={handleGetLocation}
            disabled={locLoading}
            className="flex items-center gap-1.5 text-xs text-primary-700 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-60"
          >
            {locLoading
              ? <span className="w-3 h-3 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
              : <FiNavigation />}
            My Location
          </button>
        </div>
        <SearchFilters filters={filters} onChange={setFilters} onSearch={() => doSearch()} loading={loading} />
      </div>

      {/* Map + side panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Side panel — selected hospital info */}
        {selectedHospital && (
          <div className="hidden lg:flex flex-col w-80 flex-shrink-0 bg-white border-r border-[#ede0ce] overflow-y-auto">
            <div className="p-4 border-b border-[#ede0ce]">
              <h2 className="font-bold text-[#172554] text-base">{selectedHospital.name}</h2>
              <p className="text-xs text-[#8a7a63]">{selectedHospital.type_display}</p>
              <div className="flex items-start gap-1.5 text-xs text-gray-500 mt-1">
                <FiMapPin className="flex-shrink-0 mt-0.5" />
                {selectedHospital.address}, {selectedHospital.district}
              </div>
            </div>

            {routeLoading && (
              <div className="p-4 flex items-center gap-2 text-sm text-primary-700">
                <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
                Calculating route…
              </div>
            )}

            {route && (
              <div className="p-4 bg-green-50 border-b border-green-100">
                <p className="text-sm font-semibold text-green-700">Route Found</p>
                <div className="flex gap-4 mt-1 text-sm text-green-600">
                  <span>📏 {route.distanceKm} km</span>
                  <span>⏱ {route.durationMin} min</span>
                </div>
              </div>
            )}

            <div className="p-4 space-y-2">
              <div className="flex flex-wrap gap-1.5 text-xs">
                {['beds', 'icu', 'emergency_dept'].map(type => {
                  const rec = type === 'emergency_dept'
                    ? selectedHospital.emergency_dept
                    : selectedHospital[type as 'beds' | 'icu'];
                  const status = rec?.status ?? 'unknown';
                  const label = type === 'emergency_dept' ? 'Emergency' : type === 'icu' ? 'ICU' : 'Beds';
                  const cls = status === 'available' ? 'bg-green-50 text-green-700 border-green-200'
                    : status === 'limited' ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200';
                  return (
                    <span key={type} className={`px-2 py-0.5 rounded-full border ${cls}`}>
                      {label}: {status}
                    </span>
                  );
                })}
              </div>

              {selectedHospital.emergency_contact && (
                <a href={`tel:${selectedHospital.emergency_contact}`}
                  className="flex items-center gap-1.5 text-xs text-red-600 font-medium hover:underline">
                  📞 Emergency: {selectedHospital.emergency_contact}
                </a>
              )}

              <button
                onClick={() => navigate(`/user/hospitals/${selectedHospital.id}`)}
                className="w-full mt-2 py-2 rounded-xl bg-primary-700 text-white text-sm font-medium hover:bg-primary-800 transition-colors"
              >
                View Full Details
              </button>
            </div>

            {/* Hospital list */}
            <div className="border-t border-[#ede0ce] flex-1 overflow-y-auto">
              <p className="px-4 py-2 text-xs font-semibold text-[#8a7a63] uppercase tracking-wide bg-[#faf6ee]">
                {hospitals.length} Hospitals
              </p>
              {hospitals.map(h => (
                <button
                  key={h.id}
                  onClick={() => handleSelectHospital(h)}
                  className={`w-full text-left px-4 py-2.5 border-b border-[#f0e8d8] hover:bg-[#faf6ee] transition-colors ${
                    h.id === selectedHospital?.id ? 'bg-[#ede0ce]' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-[#172554] truncate">{h.name}</p>
                  <p className="text-xs text-gray-400 truncate">{h.district}</p>
                  {h.distance_km && <p className="text-xs text-primary-600">{h.distance_km} km</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
          {searched && !loading && hospitals.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FiAlertCircle className="text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No hospitals found. Try different filters.</p>
              </div>
            </div>
          )}
          <MapView
            hospitals={hospitals}
            selectedHospitalId={selectedHospital?.id}
            userLat={userLat}
            userLng={userLng}
            route={route}
            onHospitalSelect={handleSelectHospital}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiPhone, FiNavigation, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { userPortalApi } from '../../lib/api';
import type { HospitalSearchResult } from '../../types';
import { HospitalCard } from '../../components/user/HospitalCard';
import { MapView } from '../../components/user/MapView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getRoute, type RouteResult } from '../../components/map/mapSetup';

const EMERGENCY_SERVICES = [
  { label: 'Emergency Department', q: 'emergency' },
  { label: 'ICU Beds', q: 'icu' },
  { label: 'Emergency Surgery', q: 'surgery' },
  { label: 'Cardiac Emergency', q: 'cardiac emergency' },
  { label: 'Trauma / Accident', q: 'accident trauma' },
  { label: 'Burns', q: 'burn emergency' },
  { label: 'Maternity Emergency', q: 'maternity emergency' },
  { label: 'Pediatric Emergency', q: 'child pediatric emergency' },
];

export const UserEmergencySearch: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<HospitalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState('');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeHospital, setRouteHospital] = useState<HospitalSearchResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
      () => {}
    );
  }, []);

  const doSearch = async (q: string) => {
    setSelected(q);
    setLoading(true);
    setSearched(true);
    setRoute(null);
    setRouteHospital(null);
    try {
      const res = await userPortalApi.searchHospitals({
        q,
        emergency: true,
        lat: userLat ?? undefined,
        lng: userLng ?? undefined,
        page_size: 20,
      });
      setResults(res.data.results);
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirections = async (hospital: HospitalSearchResult) => {
    if (!userLat || !userLng) { toast.error('Enable location access for directions.'); return; }
    if (!hospital.lat || !hospital.lng) { toast.error('Hospital coordinates not available.'); return; }
    setRouteHospital(hospital);
    setShowMap(true);
    setRouteLoading(true);
    setRoute(null);
    try {
      const r = await getRoute(userLat, userLng, hospital.lat, hospital.lng);
      if (r) { setRoute(r); toast.success(`Route: ${r.distanceKm} km · ${r.durationMin} min`); }
      else toast.error('No road route found between these locations.');
    } catch { toast.error('Routing service unavailable.'); }
    finally { setRouteLoading(false); }
  };

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-4 md:p-6 max-w-5xl mx-auto pb-24 md:pb-6 space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 text-white shadow">
        <div className="flex items-center gap-2 mb-1">
          <FiAlertTriangle className="text-2xl" />
          <h1 className="text-xl font-bold">Emergency Hospital Search</h1>
        </div>
        <p className="text-red-100 text-sm">Find hospitals with available emergency services near you.</p>

        {/* National emergency numbers */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[['Ambulance', '102'], ['Police', '100'], ['Fire', '101']].map(([label, num]) => (
            <a key={num} href={`tel:${num}`}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
              <FiPhone /> {label}: {num}
            </a>
          ))}
        </div>
      </div>

      {/* Location warning */}
      {!userLat && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
          <FiNavigation />
          Enable location access for distance-sorted results and map directions.
        </div>
      )}

      {/* Emergency type selector */}
      <div>
        <h2 className="text-sm font-semibold text-[#8a7a63] uppercase tracking-wide mb-2">Select Emergency Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {EMERGENCY_SERVICES.map(svc => (
            <button key={svc.q} onClick={() => doSearch(svc.q)}
              className={`p-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                selected === svc.q
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-[#4a3a24] border-[#ede0ce] hover:bg-red-50 hover:border-red-200'
              }`}>
              🚨 {svc.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}

      {searched && !loading && results.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#ede0ce] p-8 text-center shadow-sm">
          <FiAlertCircle className="text-5xl text-gray-200 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No confirmed match found</p>
          <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
            No hospital has confirmed this emergency service as currently available.
            Please call the national emergency numbers listed above.
          </p>
        </div>
      )}

      {results.length > 0 && !loading && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">
              {results.length} hospital{results.length !== 1 ? 's' : ''} with emergency services
            </p>
            <button onClick={() => setShowMap(!showMap)}
              className="text-xs text-primary-700 border border-primary-200 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {showMap && (
            <div className="space-y-2">
              {routeLoading && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  <span className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                  Calculating emergency route…
                </div>
              )}
              {route && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 flex gap-4">
                  <span>📏 {route.distanceKm} km</span>
                  <span>⏱ {route.durationMin} min</span>
                  {routeHospital && <span>🏥 {routeHospital.name}</span>}
                </div>
              )}
              <MapView
                hospitals={results}
                selectedHospitalId={routeHospital?.id}
                userLat={userLat}
                userLng={userLng}
                route={route}
                onHospitalSelect={h => navigate(`/user/hospitals/${h.id}`)}
                className="w-full h-[400px]"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(h => (
              <HospitalCard key={h.id} hospital={h}
                onGetDirections={handleDirections}
                onViewMap={() => { setRouteHospital(h); setShowMap(true); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
    </div>
  );
};

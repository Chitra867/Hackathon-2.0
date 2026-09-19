import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiNavigation, FiMapPin, FiAlertCircle, FiPhone,
  FiChevronLeft, FiChevronRight, FiX, FiExternalLink, FiClock,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { userPortalApi } from '../../lib/api';
import type { HospitalSearchResult, SearchSuggestion } from '../../types';
import { MapView } from '../../components/user/MapView';
import { SearchFilters, type SearchFiltersState } from '../../components/user/SearchFilters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getRoute, type RouteResult } from '../../components/map/mapSetup';

/* ─────────────────────────────────────────────────────────────
   Availability badge
───────────────────────────────────────────────────────────── */
function StatusBadge({ label, status }: { label: string; status: string }) {
  const cls =
    status === 'available'                        ? 'bg-green-50 text-green-700 border-green-200' :
    status === 'limited'                          ? 'bg-amber-50 text-amber-700 border-amber-200' :
    status === 'unavailable' || status === 'full' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-gray-50 text-gray-400 border-gray-200';
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cls}`}>
      {label}: {status === 'unknown' ? '—' : status}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Detail panel
───────────────────────────────────────────────────────────── */
interface DetailPanelProps {
  hospital: HospitalSearchResult;
  route: RouteResult | null;
  routeLoading: boolean;
  onGetDirections: () => void;
  onClose: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  hospital, route, routeLoading, onGetDirections, onClose, navigate,
}) => (
  <div className="flex flex-col h-full bg-white">
    {/* Header */}
    <div className="flex-shrink-0 p-4 border-b border-[#ede0ce]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-bold text-[#172554] text-base leading-tight">{hospital.name}</h2>
          <p className="text-xs text-[#8a7a63] mt-0.5">{hospital.type_display}</p>
          <div className="flex items-start gap-1 text-xs text-gray-500 mt-1">
            <FiMapPin className="flex-shrink-0 mt-0.5" />
            <span>{hospital.address}, {hospital.district}</span>
          </div>
          {hospital.distance_km != null && (
            <p className="text-xs text-primary-600 font-medium mt-0.5">
              📏 {hospital.distance_km} km away
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <FiX />
        </button>
      </div>
    </div>

    {/* Route banner */}
    {routeLoading && (
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm text-primary-700 bg-primary-50 border-b border-primary-100">
        <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin flex-shrink-0" />
        Calculating route…
      </div>
    )}
    {route && !routeLoading && (
      <div className="flex-shrink-0 px-4 py-2.5 bg-green-50 border-b border-green-100">
        <p className="text-xs font-semibold text-green-700 mb-0.5">Route Found</p>
        <div className="flex gap-4 text-sm text-green-700 font-medium">
          <span>📏 {route.distanceKm} km</span>
          <span className="flex items-center gap-1">
            <FiClock className="text-xs" /> {route.durationMin} min
          </span>
        </div>
      </div>
    )}

    {/* Scrollable body */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Availability */}
      <div>
        <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-2">
          Availability
        </p>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge label="Beds"      status={hospital.beds?.status ?? 'unknown'} />
          <StatusBadge label="ICU"       status={hospital.icu?.status ?? 'unknown'} />
          <StatusBadge label="Emergency" status={hospital.emergency_dept?.status ?? 'unknown'} />
        </div>
        {(hospital.beds?.available != null || hospital.icu?.available != null) && (
          <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
            {hospital.beds?.available != null && (
              <span>Beds: <strong>{hospital.beds.available}</strong>/{hospital.beds.total ?? '?'} free</span>
            )}
            {hospital.icu?.available != null && (
              <span>ICU: <strong>{hospital.icu.available}</strong>/{hospital.icu.total ?? '?'} free</span>
            )}
          </div>
        )}
      </div>

      {/* On-duty doctors */}
      {hospital.on_duty_doctors_count > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-2">
            Doctors On Duty ({hospital.on_duty_doctors_count})
          </p>
          <div className="space-y-1.5">
            {hospital.on_duty_doctors.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="font-medium text-[#172554]">{d.name}</span>
                {d.specialty && <span className="text-gray-400">· {d.specialty}</span>}
              </div>
            ))}
            {hospital.on_duty_doctors_count > 4 && (
              <p className="text-xs text-gray-400">
                +{hospital.on_duty_doctors_count - 4} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Services */}
      {hospital.services?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-2">
            Services
          </p>
          <div className="flex flex-wrap gap-1.5">
            {hospital.services.slice(0, 8).map(s => (
              <span
                key={s.id}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                  s.is_available
                    ? 'bg-[#faf1e0] text-[#8b6a3f] border-[#ede0ce]'
                    : 'bg-gray-50 text-gray-400 border-gray-100 line-through'
                }`}
              >
                {s.name}
              </span>
            ))}
            {hospital.services.length > 8 && (
              <span className="text-xs text-gray-400 self-center">
                +{hospital.services.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Emergency contact */}
      {hospital.emergency_contact && (
        <div>
          <p className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide mb-2">
            Emergency
          </p>
          <a
            href={`tel:${hospital.emergency_contact}`}
            className="flex items-center gap-2 text-sm text-red-600 font-semibold hover:underline"
          >
            <FiPhone className="flex-shrink-0" />
            {hospital.emergency_contact}
          </a>
        </div>
      )}
    </div>

    {/* Action buttons */}
    <div className="flex-shrink-0 p-3 border-t border-[#ede0ce] space-y-2">
      <button
        onClick={onGetDirections}
        disabled={routeLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
      >
        {routeLoading
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <FiNavigation />}
        Get Directions
      </button>
      <button
        onClick={() => navigate(`/user/hospitals/${hospital.id}`)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary-200 text-primary-700 text-sm font-semibold hover:bg-primary-50 transition-colors"
      >
        <FiExternalLink /> View Full Details
      </button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Hospital list item
───────────────────────────────────────────────────────────── */
const HospitalListItem: React.FC<{
  hospital: HospitalSearchResult;
  selected: boolean;
  onClick: () => void;
}> = ({ hospital, selected, onClick }) => {
  const s = hospital.beds?.status ?? 'unknown';
  const dot =
    s === 'available'                        ? 'bg-green-500' :
    s === 'limited'                          ? 'bg-amber-400' :
    s === 'unavailable' || s === 'full'      ? 'bg-red-500'   : 'bg-gray-300';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-[#f0e8d8] transition-colors flex items-start gap-3 ${
        selected
          ? 'bg-[#faf1e0] border-l-2 border-l-primary-500'
          : 'hover:bg-[#faf6ee]'
      }`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold truncate ${selected ? 'text-primary-800' : 'text-[#172554]'}`}>
          {hospital.name}
        </p>
        <p className="text-xs text-gray-400 truncate">{hospital.district}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {hospital.distance_km != null && (
            <span className="text-xs text-primary-600 font-medium">
              {hospital.distance_km} km
            </span>
          )}
          {hospital.emergency_dept?.status === 'available' && (
            <span className="text-xs text-red-500 font-medium">🚨 Emergency</span>
          )}
        </div>
      </div>
      {selected && <FiChevronRight className="flex-shrink-0 text-primary-500 mt-0.5" />}
    </button>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export const UserHospitalMap: React.FC = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<SearchFiltersState>({
    q: '', district: '', emergency: false,
  });
  const [hospitals, setHospitals]     = useState<HospitalSearchResult[]>([]);
  const [loading, setLoading]         = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locLoading, setLocLoading]   = useState(false);

  const [selected, setSelected]       = useState<HospitalSearchResult | null>(null);
  const [route, setRoute]             = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const [panelView, setPanelView]     = useState<'list' | 'detail'>('list');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  // Keep lat/lng in refs so callbacks never go stale
  const latRef = useRef<number | null>(null);
  const lngRef = useRef<number | null>(null);
  useEffect(() => { latRef.current = userLat; }, [userLat]);
  useEffect(() => { lngRef.current = userLng; }, [userLng]);

  /* ── Geolocation ────────────────────────────────────────── */
  useEffect(() => {
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocLoading(false);
      },
      () => setLocLoading(false),
    );
  }, []);

  /* ── Core search function ───────────────────────────────── */
  /**
   * Always accepts explicit filters so there is NEVER a stale-closure problem.
   * Lat/lng come from refs (updated synchronously on state change).
   */
  const doSearch = useCallback(async (f: SearchFiltersState) => {
    setLoading(true);
    try {
      const res = await userPortalApi.searchHospitals({
        q:         f.q         || undefined,
        district:  f.district  || undefined,
        emergency: f.emergency || undefined,
        lat:       latRef.current ?? undefined,
        lng:       lngRef.current ?? undefined,
        page_size: 60,
      });
      setHospitals(res.data.results);
      setInitialLoaded(true);
    } catch {
      toast.error('Could not load hospitals.');
    } finally {
      setLoading(false);
    }
  }, []); // latRef/lngRef are stable refs — no deps needed

  // Initial load with empty filters
  useEffect(() => {
    doSearch({ q: '', district: '', emergency: false });
  }, [doSearch]);

  /* ── onSearch from SearchFilters ────────────────────────── */
  // SearchFilters already passes the current filters object — just forward it.
  const handleSearch = useCallback((f: SearchFiltersState) => {
    setFilters(f);  // keep parent state in sync
    doSearch(f);
  }, [doSearch]);

  /* ── Suggestion selected ────────────────────────────────── */
  const handleSuggestionSelect = useCallback((s: SearchSuggestion) => {
    const nf: SearchFiltersState = { ...filters, q: s.label };
    setFilters(nf);
    doSearch(nf);
  }, [filters, doSearch]);

  /* ── Select hospital on map / list ─────────────────────── */
  const handleSelectHospital = useCallback(async (h: HospitalSearchResult) => {
    setSelected(h);
    setPanelView('detail');
    setDrawerOpen(true);
    setRoute(null);
    if (latRef.current && lngRef.current && h.lat && h.lng) {
      setRouteLoading(true);
      try {
        const r = await getRoute(latRef.current, lngRef.current, h.lat, h.lng);
        if (r) setRoute(r);
      } catch { /* silent */ }
      finally { setRouteLoading(false); }
    }
  }, []);

  /* ── Get directions ─────────────────────────────────────── */
  const handleGetDirections = async () => {
    if (!userLat || !userLng) {
      toast.error('Enable location access to get directions.'); return;
    }
    if (!selected?.lat || !selected?.lng) {
      toast.error('Hospital coordinates unavailable.'); return;
    }
    setRouteLoading(true);
    try {
      const r = await getRoute(userLat, userLng, selected.lat, selected.lng);
      if (r) { setRoute(r); toast.success(`${r.distanceKm} km · ${r.durationMin} min`); }
      else toast.error('No route found.');
    } catch { toast.error('Routing unavailable.'); }
    finally { setRouteLoading(false); }
  };

  /* ── Get / refresh location ─────────────────────────────── */
  const handleGetLocation = () => {
    setLocLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocLoading(false);
        toast.success('Location updated.');
        // Re-run current search with updated location
        doSearch(filters);
      },
      () => { setLocLoading(false); toast.error('Could not get your location.'); },
    );
  };

  /* ── Close detail panel ─────────────────────────────────── */
  const handleCloseDetail = () => {
    setPanelView('list');
    setSelected(null);
    setRoute(null);
    setDrawerOpen(false);
  };

  /* ── Collapse / expand panel ────────────────────────────── */
  const togglePanel = () => setPanelCollapsed(c => !c);

  /* ─────────────────────────────────────────────────────────
     Render
  ───────────────────────────────────────────────────────── */
  return (
    /*
     * h-full: fills the <main> in UserLayout (which is flex-1 min-h-0).
     * overflow-hidden: clips children, prevents double scrollbars.
     */
    <div className="h-full flex flex-col overflow-hidden bg-[#faf6ee]">

      {/* ══ DESKTOP layout ══════════════════════════════════ */}
      <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left panel ─────────────────────────────────── */}
        <aside
          className={`flex flex-col flex-shrink-0 bg-white border-r border-[#ede0ce] transition-all duration-300 overflow-hidden ${
            panelCollapsed ? 'w-0' : 'w-[340px]'
          }`}
        >
          {!panelCollapsed && (
            <>
              {/* Search header */}
              <div className="flex-shrink-0 px-3 pt-3 pb-2 border-b border-[#ede0ce] bg-[#faf6ee] space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-sm font-bold text-[#172554]">🗺 Hospital Map</h1>
                  <button
                    onClick={handleGetLocation}
                    disabled={locLoading}
                    className="flex items-center gap-1.5 text-xs text-primary-700 border border-primary-200 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-60"
                  >
                    {locLoading
                      ? <span className="w-3 h-3 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
                      : <FiNavigation className="text-xs" />}
                    My Location
                  </button>
                </div>

                {/* SearchFilters — no card wrapper; parent provides bg/padding */}
                <SearchFilters
                  filters={filters}
                  onChange={setFilters}
                  onSearch={handleSearch}
                  onSuggestionSelect={handleSuggestionSelect}
                  loading={loading}
                />
              </div>

              {/* Sliding panel body */}
              <div className="flex-1 min-h-0 overflow-hidden relative">

                {/* List view */}
                <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${
                  panelView === 'detail' ? '-translate-x-full' : 'translate-x-0'
                }`}>
                  <div className="flex-shrink-0 px-4 py-2 bg-[#faf6ee] border-b border-[#ede0ce]">
                    <span className="text-xs font-semibold text-[#8a7a63] uppercase tracking-wide">
                      {loading
                        ? 'Searching…'
                        : `${hospitals.length} hospital${hospitals.length !== 1 ? 's' : ''} found`}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loading && (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    )}
                    {!loading && initialLoaded && hospitals.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <FiAlertCircle className="text-3xl text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">No hospitals found.</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Try different filters or clear the search.
                        </p>
                      </div>
                    )}
                    {hospitals.map(h => (
                      <HospitalListItem
                        key={h.id}
                        hospital={h}
                        selected={h.id === selected?.id}
                        onClick={() => handleSelectHospital(h)}
                      />
                    ))}
                  </div>
                </div>

                {/* Detail view */}
                <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${
                  panelView === 'detail' ? 'translate-x-0' : 'translate-x-full'
                }`}>
                  <div className="flex-shrink-0 px-4 py-2 border-b border-[#ede0ce] bg-[#faf6ee]">
                    <button
                      onClick={() => setPanelView('list')}
                      className="flex items-center gap-1.5 text-xs text-[#8a7a63] hover:text-primary-700 transition-colors"
                    >
                      <FiChevronLeft /> Back to list
                    </button>
                  </div>
                  {selected && (
                    <DetailPanel
                      hospital={selected}
                      route={route}
                      routeLoading={routeLoading}
                      onGetDirections={handleGetDirections}
                      onClose={handleCloseDetail}
                      navigate={navigate}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Panel collapse strip */}
        <button
          onClick={togglePanel}
          className="flex-shrink-0 w-5 flex items-center justify-center bg-white border-r border-[#ede0ce] text-gray-400 hover:text-primary-700 hover:bg-[#faf1e0] transition-colors z-10"
          title={panelCollapsed ? 'Show panel' : 'Hide panel'}
        >
          {panelCollapsed
            ? <FiChevronRight className="text-sm" />
            : <FiChevronLeft className="text-sm" />}
        </button>

        {/*
         * Map container — flex-1 + min-w-0 so it fills remaining width.
         * h-full is resolved by the parent flex row having min-h-0.
         * resizeTrigger re-invalidates Leaflet when the panel collapses/expands.
         */}
        <div className="flex-1 min-w-0 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2 text-sm text-primary-700">
                <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
                Searching…
              </div>
            </div>
          )}
          <MapView
            hospitals={hospitals}
            selectedHospitalId={selected?.id}
            userLat={userLat}
            userLng={userLng}
            route={route}
            onHospitalSelect={handleSelectHospital}
            resizeTrigger={panelCollapsed}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* ══ MOBILE layout ═══════════════════════════════════ */}
      <div className="md:hidden flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Search header */}
        <div className="flex-shrink-0 px-3 pt-3 pb-2 bg-white border-b border-[#ede0ce] space-y-2 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-[#172554]">🗺 Hospital Map</h1>
            <button
              onClick={handleGetLocation}
              disabled={locLoading}
              className="flex items-center gap-1.5 text-xs text-primary-700 border border-primary-200 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-60"
            >
              {locLoading
                ? <span className="w-3 h-3 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
                : <FiNavigation className="text-xs" />}
              Location
            </button>
          </div>
          <SearchFilters
            filters={filters}
            onChange={setFilters}
            onSearch={handleSearch}
            onSuggestionSelect={handleSuggestionSelect}
            loading={loading}
          />
          {initialLoaded && (
            <p className="text-xs text-[#8a7a63]">
              {loading
                ? 'Searching…'
                : `${hospitals.length} hospital${hospitals.length !== 1 ? 's' : ''} found`}
            </p>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 min-h-0 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-2 text-sm text-primary-700">
                <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
                Searching…
              </div>
            </div>
          )}
          <MapView
            hospitals={hospitals}
            selectedHospitalId={selected?.id}
            userLat={userLat}
            userLng={userLng}
            route={route}
            onHospitalSelect={handleSelectHospital}
            className="w-full h-full"
          />
        </div>

        {/* Mobile bottom drawer */}
        {selected && (
          <>
            <div
              className={`fixed inset-0 bg-black/20 z-30 transition-opacity duration-300 ${
                drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={handleCloseDetail}
            />
            <div
              className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${
                drawerOpen ? 'translate-y-0' : 'translate-y-full'
              }`}
              style={{ maxHeight: '65vh' }}
            >
              <div
                className="bg-white rounded-t-2xl shadow-2xl border-t border-[#ede0ce] flex flex-col overflow-hidden"
                style={{ maxHeight: '65vh' }}
              >
                <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <DetailPanel
                    hospital={selected}
                    route={route}
                    routeLoading={routeLoading}
                    onGetDirections={handleGetDirections}
                    onClose={handleCloseDetail}
                    navigate={navigate}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

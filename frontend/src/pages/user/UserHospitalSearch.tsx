import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiNavigation, FiGrid, FiMap as FiMapIcon } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { userPortalApi } from '../../lib/api';
import type { HospitalSearchResult } from '../../types';
import { SearchFilters, type SearchFiltersState } from '../../components/user/SearchFilters';
import { HospitalCard } from '../../components/user/HospitalCard';
import { MapView } from '../../components/user/MapView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { getRoute, type RouteResult } from '../../components/map/mapSetup';

export const UserHospitalSearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<SearchFiltersState>({
    q: searchParams.get('q') || '',
    district: searchParams.get('district') || '',
    emergency: searchParams.get('emergency') === 'true',
  });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const [results, setResults] = useState<HospitalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<HospitalSearchResult | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        () => {} // ignore denial
      );
    }
  }, []);

  const doSearch = useCallback(async (pageNum = 1, f?: SearchFiltersState) => {
    const currentFilters = f ?? filtersRef.current;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await userPortalApi.searchHospitals({
        q: currentFilters.q || undefined,
        district: currentFilters.district || undefined,
        emergency: currentFilters.emergency || undefined,
        lat: userLat ?? undefined,
        lng: userLng ?? undefined,
        page: pageNum,
        page_size: 20,
      });
      setResults(res.data.results);
      setTotalPages(res.data.total_pages);
      setTotal(res.data.count);
      setPage(pageNum);
    } catch {
      setError('Search failed. Please try again.');
      toast.error('Search failed.');
    } finally {
      setLoading(false);
    }
  }, [userLat, userLng]);

  // Auto-search on initial load (always — show all hospitals by default)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      doSearch(1);
    }
  }, [doSearch]);

  // Debounced search on filter change (q, district, emergency)
  // Update local filter state; debounce only for text (q) changes.
  // District / emergency changes go through onSearch directly (SearchFilters calls onSearch inline).
  const handleFiltersChange = (newFilters: SearchFiltersState) => {
    setFilters(newFilters);
    // Only debounce-search when the text query changes (typing in the input)
    if (newFilters.q !== filtersRef.current.q) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSearch(1, newFilters);
      }, 400);
    }
  };

  const handleSearchButton = (f?: SearchFiltersState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch(1, f ?? filtersRef.current);
  };

  const handleGetDirections = async (hospital: HospitalSearchResult) => {
    if (!userLat || !userLng) {
      toast.error('Enable location access to get directions.');
      return;
    }
    if (!hospital.lat || !hospital.lng) {
      toast.error('Hospital coordinates not available.');
      return;
    }
    setSelectedHospital(hospital);
    setViewMode('map');
    setRouteLoading(true);
    setRoute(null);
    try {
      const r = await getRoute(userLat, userLng, hospital.lat, hospital.lng);
      if (r) {
        setRoute(r);
        toast.success(`Route: ${r.distanceKm} km · ${r.durationMin} min`);
      } else {
        toast.error('Could not calculate route. No road found.');
      }
    } catch {
      toast.error('Routing service unavailable.');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleViewMap = (hospital: HospitalSearchResult) => {
    setSelectedHospital(hospital);
    setViewMode('map');
  };

  const showEmpty = hasSearched && !loading && !error && results.length === 0;

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 pb-24 md:pb-6">
      <h1 className="text-xl font-bold text-[#172554]">Find Hospitals</h1>

      <SearchFilters
        filters={filters}
        onChange={handleFiltersChange}
        onSearch={handleSearchButton}
        loading={loading}
      />

      {/* Location permission note */}
      {!userLat && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-sm text-blue-700">
          <FiNavigation />
          Enable location access for distance-sorted results and map directions.
        </div>
      )}

      {/* View toggle */}
      {results.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {total} hospital{total !== 1 ? 's' : ''} found
          </p>
          <div className="flex rounded-xl border border-[#ede0ce] overflow-hidden text-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-primary-700 text-white' : 'text-gray-500 hover:bg-[#faf1e0]'}`}
            >
              <FiGrid /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-primary-700 text-white' : 'text-gray-500 hover:bg-[#faf1e0]'}`}
            >
              <FiMapIcon /> Map
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">
          <FiAlertCircle /> {error}
        </div>
      )}

      {showEmpty && (
        <EmptyState
          title="No hospitals found"
          message="Try a different treatment name, service, or district."
        />
      )}

      {/* Map view */}
      {viewMode === 'map' && results.length > 0 && (
        <div className="space-y-2">
          {routeLoading && (
            <div className="flex items-center gap-2 text-sm text-primary-700 bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5">
              <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
              Calculating route…
            </div>
          )}
          {route && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 flex gap-4">
              <span>📏 {route.distanceKm} km</span>
              <span>⏱ {route.durationMin} min drive</span>
              {selectedHospital && <span>🏥 {selectedHospital.name}</span>}
            </div>
          )}
          <MapView
            hospitals={results}
            selectedHospitalId={selectedHospital?.id}
            userLat={userLat}
            userLng={userLng}
            route={route}
            onHospitalSelect={h => {
              setSelectedHospital(h);
              navigate(`/user/hospitals/${h.id}`);
            }}
            className="w-full h-[500px]"
          />
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && !loading && results.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map(h => (
              <HospitalCard
                key={h.id}
                hospital={h}
                onGetDirections={handleGetDirections}
                onViewMap={handleViewMap}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => doSearch(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0] transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => doSearch(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl border border-[#ede0ce] text-sm text-[#8a7a63] disabled:opacity-40 hover:bg-[#faf1e0] transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
};

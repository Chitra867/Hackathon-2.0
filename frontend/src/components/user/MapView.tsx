import React, { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import { latLngBounds } from 'leaflet';
import {
  NEPAL_MAP_OPTIONS,
  TILE_LAYER,
  NEPAL_DEFAULT_CENTER,
  FIT_OPTIONS,
  FLY_OPTIONS,
  createUserIcon,
  createHospitalIcon,
  createPinIcon,
} from '../map/mapSetup';
import '../map/markers.css';
import type { HospitalSearchResult } from '../../types';
import type { RouteResult } from '../map/mapSetup';

interface Props {
  hospitals: HospitalSearchResult[];
  selectedHospitalId?: number | null;
  userLat?: number | null;
  userLng?: number | null;
  route?: RouteResult | null;
  onHospitalSelect?: (hospital: HospitalSearchResult) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

function AutoFrame({
  hospitals,
  selectedId,
  userLat,
  userLng,
  route,
}: {
  hospitals: HospitalSearchResult[];
  selectedId?: number | null;
  userLat?: number | null;
  userLng?: number | null;
  route?: RouteResult | null;
}) {
  const map = useMap();
  const lastSig = useRef('');

  useEffect(() => {
    const sig = [
      selectedId ?? '-',
      hospitals.map(h => h.id).join(','),
      userLat?.toFixed(4) ?? '-',
      userLng?.toFixed(4) ?? '-',
      route ? route.distanceKm : '-',
    ].join('::');

    if (sig === lastSig.current) return;
    lastSig.current = sig;

    // If route exists, frame the whole route
    if (route && route.coordinates.length >= 2) {
      map.flyToBounds(latLngBounds(route.coordinates), FIT_OPTIONS);
      return;
    }

    // If a hospital is selected, fly to it
    if (selectedId) {
      const h = hospitals.find(x => x.id === selectedId);
      if (h?.lat && h?.lng) {
        map.flyTo([h.lat, h.lng], 15, FLY_OPTIONS);
        return;
      }
    }

    // Frame all visible hospitals + user location
    const points: [number, number][] = [];
    if (userLat && userLng) points.push([userLat, userLng]);
    hospitals.forEach(h => {
      if (h.lat && h.lng) points.push([h.lat, h.lng]);
    });
    if (points.length >= 2) {
      map.flyToBounds(latLngBounds(points), FIT_OPTIONS);
    } else if (points.length === 1) {
      map.flyTo(points[0], 13, FLY_OPTIONS);
    }
  }, [hospitals, selectedId, userLat, userLng, route, map]);

  return null;
}

export const MapView: React.FC<Props> = ({
  hospitals,
  selectedHospitalId,
  userLat,
  userLng,
  route,
  onHospitalSelect,
  className = 'w-full h-[450px]',
}) => {
  return (
    <MapContainer
      {...NEPAL_MAP_OPTIONS}
      center={NEPAL_DEFAULT_CENTER}
      zoom={7}
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ zIndex: 1 }}
    >
      <TileLayer {...TILE_LAYER} />

      <AutoFrame
        hospitals={hospitals}
        selectedId={selectedHospitalId}
        userLat={userLat}
        userLng={userLng}
        route={route}
      />

      {/* User location marker */}
      {userLat && userLng && (
        <Marker position={[userLat, userLng]} icon={createUserIcon()} zIndexOffset={1000}>
          <Popup>
            <div className="uk-popup-card">
              <h4>📍 Your Location</h4>
              <p>{userLat.toFixed(5)}, {userLng.toFixed(5)}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Hospital markers */}
      {hospitals.map(h => {
        if (!h.lat || !h.lng) return null;
        const isSelected = h.id === selectedHospitalId;
        const bedStatus = h.beds?.status ?? 'unknown';
        return (
          <Marker
            key={h.id}
            position={[h.lat, h.lng]}
            icon={createHospitalIcon(bedStatus, isSelected)}
            zIndexOffset={isSelected ? 900 : 0}
            eventHandlers={{ click: () => onHospitalSelect?.(h) }}
          >
            <Popup>
              <div className="uk-popup-card" style={{ minWidth: 200 }}>
                <h4>🏥 {h.name}</h4>
                <p className="text-xs text-gray-400">{h.type_display}</p>
                <p>{h.address}, {h.district}</p>
                {h.distance_km !== null && <p>📏 {h.distance_km} km away</p>}
                <div className="flex gap-1 flex-wrap mt-1">
                  <span className={`uk-popup-badge text-xs ${bedStatus === 'available' ? 'bg-green-100 text-green-700' : bedStatus === 'limited' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                    Beds: {h.beds?.status ?? 'Unknown'}
                  </span>
                  <span className={`uk-popup-badge text-xs ${h.emergency_dept?.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    Emergency: {h.emergency_dept?.status ?? 'Unknown'}
                  </span>
                </div>
                {h.emergency_contact && (
                  <a href={`tel:${h.emergency_contact}`} className="block mt-1.5 text-xs text-red-600 font-medium">
                    📞 {h.emergency_contact}
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Route polylines */}
      {route && route.coordinates.length >= 2 && (
        <>
          {/* White halo */}
          <Polyline
            positions={route.coordinates}
            pathOptions={{ color: '#ffffff', weight: 13, opacity: 0.55, lineCap: 'round', lineJoin: 'round' }}
          />
          {/* Route body */}
          <Polyline
            positions={route.coordinates}
            pathOptions={{ color: '#1d4ed8', weight: 7, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
          />
          {/* Animated flow */}
          <Polyline
            positions={route.coordinates}
            className="uk-route-flow"
            pathOptions={{ color: '#dbeafe', weight: 2.5, opacity: 0.9, lineCap: 'round' }}
          />
        </>
      )}

      {/* Destination pin if route exists */}
      {route && selectedHospitalId && (() => {
        const dest = hospitals.find(h => h.id === selectedHospitalId);
        if (!dest?.lat || !dest?.lng) return null;
        return (
          <Marker position={[dest.lat, dest.lng]} icon={createPinIcon('#15803d')} zIndexOffset={1100}>
            <Popup>
              <div className="uk-popup-card">
                <h4>🏁 {dest.name}</h4>
                <p>📏 {route.distanceKm} km · ⏱ {route.durationMin} min</p>
              </div>
            </Popup>
          </Marker>
        );
      })()}
    </MapContainer>
  );
};

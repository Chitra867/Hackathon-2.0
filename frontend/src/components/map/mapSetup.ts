/**
 * mapSetup.ts
 * Ported from SafeRoute-Nepal and adapted for UpacharKhoj hospital maps.
 * Uses react-leaflet v4 + Leaflet 1.9.x with OpenStreetMap tile layer.
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by bundlers
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Nepal viewport constants ──────────────────────────────

export const NEPAL_DEFAULT_CENTER: [number, number] = [28.3949, 84.124];

export const NEPAL_LEAFLET_BOUNDS: [[number, number], [number, number]] = [
  [26.35, 80.06],
  [30.45, 88.2],
];

export const NEPAL_MIN_ZOOM = 6;
export const NEPAL_MAX_ZOOM = 19;

// ── Shared map options ────────────────────────────────────

export const NEPAL_MAP_OPTIONS = {
  maxBounds: NEPAL_LEAFLET_BOUNDS,
  maxBoundsViscosity: 0.9,
  minZoom: NEPAL_MIN_ZOOM,
  maxZoom: NEPAL_MAX_ZOOM,
  zoomControl: true,
  scrollWheelZoom: true,
  zoomSnap: 0.25,
  zoomDelta: 0.5,
  wheelPxPerZoomLevel: 110,
  zoomAnimation: true,
  fadeAnimation: true,
  markerZoomAnimation: true,
  inertia: true,
  inertiaDeceleration: 2600,
} as const;

// ── Tile layer ────────────────────────────────────────────

export const TILE_LAYER = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  noWrap: true,
  maxZoom: NEPAL_MAX_ZOOM,
  keepBuffer: 4,
  updateWhenIdle: false,
  updateWhenZooming: false,
  crossOrigin: true,
} as const;

// ── Camera animation options ──────────────────────────────

export const FLY_OPTIONS = {
  animate: true,
  duration: 0.75,
  easeLinearity: 0.18,
} as const;

export const FIT_OPTIONS = {
  padding: [52, 52] as [number, number],
  maxZoom: 15,
  animate: true,
  duration: 0.75,
};

// ── Availability colour palette ───────────────────────────

export const STATUS_COLORS: Record<string, { stroke: string; fill: string; bg: string }> = {
  available:   { stroke: '#15803d', fill: '#dcfce7', bg: '#f0fdf4' },
  limited:     { stroke: '#b45309', fill: '#fef3c7', bg: '#fffbeb' },
  unavailable: { stroke: '#b91c1c', fill: '#fee2e2', bg: '#fef2f2' },
  full:        { stroke: '#7f1d1d', fill: '#fecaca', bg: '#fef2f2' },
  unknown:     { stroke: '#6b7280', fill: '#f3f4f6', bg: '#f9fafb' },
};

// ── Marker icon factories ─────────────────────────────────

/** Pulsing GPS dot for the user's current location. */
export function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: 'uk-marker uk-marker-user',
    html: `
      <span class="uk-user-ring"></span>
      <span class="uk-user-dot"></span>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

/** Hospital marker — colour varies by bed/emergency availability. */
export function createHospitalIcon(
  availabilityStatus: string = 'unknown',
  selected = false
): L.DivIcon {
  const { stroke } = STATUS_COLORS[availabilityStatus] ?? STATUS_COLORS.unknown;
  const size = selected ? 44 : 36;

  return L.divIcon({
    className: `uk-marker uk-marker-hospital${selected ? ' is-selected' : ''}`,
    html: `
      <span class="uk-hospital-body" style="
        width:${size}px;height:${size}px;
        background:white;
        border:2.5px solid ${stroke};
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.18);
        font-size:${selected ? 20 : 16}px;
      ">🏥</span>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

/** Teardrop destination pin. */
export function createPinIcon(color = '#0ea5e9'): L.DivIcon {
  return L.divIcon({
    className: 'uk-marker uk-marker-pin',
    html: `
      <span class="uk-pin-body" style="--uk-pin:${color};">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff"
          stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </span>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });
}

// ── Distance helpers ──────────────────────────────────────

/** Haversine great-circle distance in km. */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Routing (OSRM public) ─────────────────────────────────

export type RoutePoint = [number, number]; // [lat, lng]

export interface RouteResult {
  coordinates: RoutePoint[];
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: string;
  durationMin: string;
}

/**
 * Fetch a driving route between two coordinates using the public OSRM API.
 * Falls back to walking if no driving route is found.
 */
export async function getRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  signal?: AbortSignal
): Promise<RouteResult | null> {
  const profiles: Array<'driving' | 'foot'> = ['driving', 'foot'];

  for (const profile of profiles) {
    try {
      const url =
        `https://router.project-osrm.org/route/v1/${profile}/` +
        `${fromLng},${fromLat};${toLng},${toLat}` +
        `?overview=full&geometries=geojson&steps=false&alternatives=false`;

      const res = await fetch(url, {
        signal: signal ?? AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;

      const data = await res.json() as {
        code: string;
        routes?: Array<{
          distance: number;
          duration: number;
          geometry: { coordinates: [number, number][] };
        }>;
      };

      if (data.code !== 'Ok' || !data.routes?.length) continue;

      const route = data.routes[0];
      const coords: RoutePoint[] = route.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
      );

      return {
        coordinates: coords,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        distanceKm: (route.distance / 1000).toFixed(1),
        durationMin: Math.ceil(route.duration / 60).toString(),
      };
    } catch {
      // try next profile or return null
    }
  }

  return null;
}

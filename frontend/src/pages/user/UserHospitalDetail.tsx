import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiMapPin, FiPhone, FiMail, FiGlobe, FiAlertCircle,
  FiNavigation, FiChevronLeft,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { userPortalApi } from '../../lib/api';
import type { UserHospitalDetail as HospitalDetailType } from '../../types';
import { DoctorAvailability } from '../../components/user/DoctorAvailability';
import { BedAvailability } from '../../components/user/BedAvailability';
import { PatientRequestStatusBadge } from '../../components/user/PatientRequestStatusBadge';
import { MapView } from '../../components/user/MapView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getRoute, type RouteResult } from '../../components/map/mapSetup';

type Tab = 'overview' | 'doctors' | 'availability' | 'map';

export const UserHospitalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState<HospitalDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    userPortalApi.getHospitalDetail(Number(id))
      .then(res => setHospital(res.data))
      .catch(() => toast.error('Hospital not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      }, () => {});
    }
  }, []);

  const handleGetDirections = async () => {
    if (!userLat || !userLng) { toast.error('Enable location for directions.'); return; }
    if (!hospital?.lat || !hospital?.lng) { toast.error('Hospital coordinates not available.'); return; }
    setRouteLoading(true);
    setTab('map');
    try {
      const r = await getRoute(userLat, userLng, hospital.lat, hospital.lng);
      if (r) { setRoute(r); toast.success(`${r.distanceKm} km · ${r.durationMin} min`); }
      else toast.error('No road route found.');
    } catch { toast.error('Routing unavailable.'); }
    finally { setRouteLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  if (!hospital) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">Hospital not found.</p>
      <Link to="/user/hospitals" className="text-primary-700 text-sm mt-3 inline-block hover:underline">← Back to Search</Link>
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview',     label: 'Overview' },
    { key: 'doctors',      label: `Doctors (${hospital.doctors.length})` },
    { key: 'availability', label: 'Availability' },
    { key: 'map',          label: 'Map & Directions' },
  ];

  const fakeHospitalAsSearchResult = {
    id: hospital.id,
    name: hospital.name,
    type: hospital.type,
    type_display: hospital.type_display,
    address: hospital.address,
    district: hospital.district,
    municipality: hospital.municipality,
    lat: hospital.lat,
    lng: hospital.lng,
    phone: hospital.phone,
    emergency_contact: hospital.emergency_contact,
    distance_km: null,
    services: hospital.services,
    beds: hospital.availability.find(a => a.type === 'bed') ? {
      status: hospital.availability.find(a => a.type === 'bed')!.status,
      available: hospital.availability.find(a => a.type === 'bed')!.available_count,
      total: hospital.availability.find(a => a.type === 'bed')!.total_count,
      updated_at: hospital.availability.find(a => a.type === 'bed')!.updated_at,
    } : { status: 'unknown', available: null, total: null, updated_at: null },
    icu: hospital.availability.find(a => a.type === 'icu') ? {
      status: hospital.availability.find(a => a.type === 'icu')!.status,
      available: hospital.availability.find(a => a.type === 'icu')!.available_count,
      total: hospital.availability.find(a => a.type === 'icu')!.total_count,
      updated_at: hospital.availability.find(a => a.type === 'icu')!.updated_at,
    } : { status: 'unknown', available: null, total: null, updated_at: null },
    emergency_dept: hospital.availability.find(a => a.type === 'emergency')
      ? { status: hospital.availability.find(a => a.type === 'emergency')!.status, updated_at: hospital.availability.find(a => a.type === 'emergency')!.updated_at }
      : { status: 'unknown', updated_at: null },
    on_duty_doctors: hospital.doctors.filter(d => d.duty_status === 'on_duty').map(d => ({ name: d.name, specialty: d.specialty, duty_status: d.duty_status })),
    on_duty_doctors_count: hospital.doctors.filter(d => d.duty_status === 'on_duty').length,
  };

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 pb-24 md:pb-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-[#8a7a63] hover:text-primary-700 transition-colors">
        <FiChevronLeft /> Back
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#172554]">{hospital.name}</h1>
            <p className="text-sm text-[#8a7a63]">{hospital.type_display}</p>
          </div>
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full font-medium capitalize">
            ✓ Verified
          </span>
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <FiMapPin className="flex-shrink-0 mt-0.5 text-gray-400" />
            {hospital.address}, {hospital.district}{hospital.municipality ? `, ${hospital.municipality}` : ''}
          </div>
          {hospital.phone && (
            <div className="flex items-center gap-2">
              <FiPhone className="text-gray-400" />
              <a href={`tel:${hospital.phone}`} className="hover:underline">{hospital.phone}</a>
            </div>
          )}
          {hospital.emergency_contact && (
            <div className="flex items-center gap-2">
              <FiAlertCircle className="text-red-400" />
              <a href={`tel:${hospital.emergency_contact}`} className="text-red-600 font-medium hover:underline">
                Emergency: {hospital.emergency_contact}
              </a>
            </div>
          )}
          {hospital.email && (
            <div className="flex items-center gap-2">
              <FiMail className="text-gray-400" />
              <a href={`mailto:${hospital.email}`} className="hover:underline">{hospital.email}</a>
            </div>
          )}
          {hospital.website && (
            <div className="flex items-center gap-2">
              <FiGlobe className="text-gray-400" />
              <a href={hospital.website} target="_blank" rel="noreferrer" className="hover:underline text-primary-700">
                {hospital.website}
              </a>
            </div>
          )}
        </div>

        {/* Actions: only directions + emergency call */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={handleGetDirections}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <FiNavigation /> Get Directions
          </button>
          {hospital.emergency_contact && (
            <a
              href={`tel:${hospital.emergency_contact}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              📞 Call Emergency
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white rounded-xl border border-[#ede0ce] p-1 shadow-sm">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-primary-700 text-white' : 'text-[#8a7a63] hover:bg-[#faf1e0]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-[#ede0ce] shadow-sm p-5">

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#8a7a63] uppercase tracking-wide mb-2">Services Offered</h3>
              {hospital.services.length === 0
                ? <p className="text-gray-400 text-sm">No services listed.</p>
                : (
                  <div className="flex flex-wrap gap-2">
                    {hospital.services.map(s => (
                      <span
                        key={s.id}
                        className={`text-xs px-3 py-1 rounded-full border font-medium ${
                          s.is_available
                            ? 'bg-[#faf1e0] text-[#8b6a3f] border-[#ede0ce]'
                            : 'bg-gray-50 text-gray-400 border-gray-100 line-through'
                        }`}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                )
              }
            </div>

            {hospital.my_requests.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[#8a7a63] uppercase tracking-wide mb-2">Your Previous Requests</h3>
                <div className="space-y-2">
                  {hospital.my_requests.map(r => (
                    <Link
                      key={r.id}
                      to={`/user/referrals/${r.id}`}
                      className="flex items-center justify-between gap-2 p-3 bg-[#faf6ee] rounded-xl border border-[#ede0ce] hover:border-primary-200 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-mono text-gray-500">{r.request_code}</p>
                        <p className="text-sm text-[#172554] mt-0.5">{r.condition_summary}</p>
                      </div>
                      <PatientRequestStatusBadge status={r.status} size="sm" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Doctors */}
        {tab === 'doctors' && <DoctorAvailability doctors={hospital.doctors} />}

        {/* Availability */}
        {tab === 'availability' && <BedAvailability records={hospital.availability} />}

        {/* Map */}
        {tab === 'map' && (
          <div className="space-y-3">
            {routeLoading && (
              <div className="flex items-center gap-2 text-sm text-primary-700">
                <span className="w-4 h-4 border-2 border-primary-300 border-t-primary-700 rounded-full animate-spin" />
                Calculating route…
              </div>
            )}
            {route && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 flex gap-4">
                <span>📏 {route.distanceKm} km</span>
                <span>⏱ {route.durationMin} min</span>
              </div>
            )}
            {hospital.lat && hospital.lng ? (
              <MapView
                hospitals={[fakeHospitalAsSearchResult as Parameters<typeof MapView>[0]['hospitals'][0]]}
                selectedHospitalId={hospital.id}
                userLat={userLat}
                userLng={userLng}
                route={route}
                className="w-full h-[420px]"
              />
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No map coordinates available for this hospital.</p>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiMapPin, FiPhone, FiClock, FiNavigation, FiUser, FiAlertCircle,
} from 'react-icons/fi';
import { FaHospital, FaBed } from 'react-icons/fa';
import type { HospitalSearchResult } from '../../types';

interface Props {
  hospital: HospitalSearchResult;
  onGetDirections?: (hospital: HospitalSearchResult) => void;
  onViewMap?: (hospital: HospitalSearchResult) => void;
}

const statusColor: Record<string, string> = {
  available:   'text-green-700 bg-green-50 border-green-200',
  limited:     'text-amber-700 bg-amber-50 border-amber-200',
  unavailable: 'text-red-700 bg-red-50 border-red-200',
  full:        'text-red-800 bg-red-100 border-red-300',
  unknown:     'text-gray-500 bg-gray-50 border-gray-200',
};

const statusLabel: Record<string, string> = {
  available:   'Available',
  limited:     'Limited',
  unavailable: 'Unavailable',
  full:        'Full',
  unknown:     'Unknown',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[status] ?? statusColor.unknown}`}>
      {statusLabel[status] ?? status}
    </span>
  );
}

export const HospitalCard: React.FC<Props> = ({ hospital, onGetDirections, onViewMap }) => {
  return (
    <div className="bg-white rounded-xl border border-[#ede0ce] shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <FaHospital className="text-primary-700 mt-0.5 flex-shrink-0 text-lg" />
          <div>
            <h3 className="font-semibold text-[#172554] text-base leading-tight">{hospital.name}</h3>
            <p className="text-xs text-[#8a7a63] mt-0.5">{hospital.type_display}</p>
          </div>
        </div>
        {hospital.distance_km !== null && hospital.distance_km !== undefined && (
          <span className="text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full flex-shrink-0">
            {hospital.distance_km} km
          </span>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <FiMapPin className="flex-shrink-0" />
        <span className="truncate">{hospital.address}, {hospital.district}</span>
      </div>

      {/* Availability row */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 text-xs">
          <FaBed className="text-gray-400" />
          <span className="text-gray-500 mr-1">Beds:</span>
          <StatusPill status={hospital.beds?.status ?? 'unknown'} />
          {hospital.beds?.available !== null && hospital.beds?.available !== undefined && (
            <span className="text-gray-400">({hospital.beds.available}/{hospital.beds.total})</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <FiAlertCircle className="text-gray-400" />
          <span className="text-gray-500 mr-1">ICU:</span>
          <StatusPill status={hospital.icu?.status ?? 'unknown'} />
          {hospital.icu?.available !== null && hospital.icu?.available !== undefined && (
            <span className="text-gray-400">({hospital.icu.available}/{hospital.icu.total})</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs">
          <FiAlertCircle className="text-red-400" />
          <span className="text-gray-500 mr-1">Emergency:</span>
          <StatusPill status={hospital.emergency_dept?.status ?? 'unknown'} />
        </div>
      </div>

      {/* On-duty doctors */}
      {hospital.on_duty_doctors_count > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-green-700">
          <FiUser className="flex-shrink-0" />
          <span>
            {hospital.on_duty_doctors_count} doctor{hospital.on_duty_doctors_count !== 1 ? 's' : ''} on duty
            {hospital.on_duty_doctors.slice(0, 2).map(d => ` · ${d.specialty}`).join('')}
          </span>
        </div>
      )}

      {/* Services */}
      {hospital.services.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hospital.services.slice(0, 4).map(s => (
            <span key={s.id} className="text-xs bg-[#faf1e0] text-[#8b6a3f] border border-[#ede0ce] px-2 py-0.5 rounded-full">
              {s.name}
            </span>
          ))}
          {hospital.services.length > 4 && (
            <span className="text-xs text-gray-400">+{hospital.services.length - 4} more</span>
          )}
        </div>
      )}

      {/* Phone */}
      {(hospital.phone || hospital.emergency_contact) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FiPhone className="flex-shrink-0" />
          {hospital.emergency_contact ? (
            <a href={`tel:${hospital.emergency_contact}`} className="text-red-600 font-medium hover:underline">
              Emergency: {hospital.emergency_contact}
            </a>
          ) : (
            <a href={`tel:${hospital.phone}`} className="hover:underline">{hospital.phone}</a>
          )}
        </div>
      )}

      {/* Bed update time */}
      {hospital.beds?.updated_at && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <FiClock />
          <span>Beds updated: {new Date(hospital.beds.updated_at).toLocaleString()}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-[#f0e8d8] mt-auto">
        <Link
          to={`/user/hospitals/${hospital.id}`}
          className="flex-1 text-center text-xs font-medium bg-primary-700 text-white px-3 py-2 rounded-lg hover:bg-primary-800 transition-colors"
        >
          View Details
        </Link>
        {onViewMap && (
          <button
            onClick={() => onViewMap(hospital)}
            className="flex-1 text-xs font-medium border border-primary-200 text-primary-700 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors flex items-center justify-center gap-1"
          >
            <FiMapPin className="text-sm" /> Map
          </button>
        )}
        {onGetDirections && (
          <button
            onClick={() => onGetDirections(hospital)}
            className="flex-1 text-xs font-medium border border-green-200 text-green-700 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-1"
          >
            <FiNavigation className="text-sm" /> Directions
          </button>
        )}
        {hospital.emergency_contact && (
          <a
            href={`tel:${hospital.emergency_contact}`}
            className="flex-1 text-xs font-medium bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-center"
          >
            📞 Call
          </a>
        )}
      </div>
    </div>
  );
};

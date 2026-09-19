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

// Availability status keeps its own green/amber/red meaning on purpose —
// this is the one place in the app where "at a glance, is this safe" matters
// more than staying inside the brand palette. Everything else on the card
// (chrome, buttons, borders) uses the teal/sage/cream system.
const statusColor: Record<string, string> = {
  available:   'text-[#2f7a52] bg-[#eaf5ee] border-[#bfe0ca]',
  limited:     'text-[#a9762a] bg-[#faf1de] border-[#eed9a8]',
  unavailable: 'text-[#a15b4a] bg-[#f6e9e5] border-[#e6c6bb]',
  full:        'text-[#8a3f2f] bg-[#f2ddd6] border-[#e0b3a4]',
  unknown:     'text-[#8a978f] bg-[#eef1f0] border-[#d8ded9]',
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
    <div className="bg-white rounded-xl border border-[#e5dcc8] shadow-sm hover:shadow-md hover:border-[#aabfb9] transition-all p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#eef3f2] flex items-center justify-center flex-shrink-0">
            <FaHospital className="text-[#216d73] text-sm" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1c3d3f] text-base leading-tight">{hospital.name}</h3>
            <p className="text-xs text-[#8a8078] mt-0.5">{hospital.type_display}</p>
          </div>
        </div>
        {hospital.distance_km !== null && hospital.distance_km !== undefined && (
          <span className="text-xs font-medium text-[#216d73] bg-[#eef3f2] border border-[#c7dbd8] px-2 py-0.5 rounded-full flex-shrink-0">
            {hospital.distance_km} km
          </span>
        )}
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-[#8a8078]">
        <FiMapPin className="flex-shrink-0 text-[#aabfb9]" />
        <span className="truncate">{hospital.address}, {hospital.district}</span>
      </div>

      {/* Availability row */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5 text-xs">
          <FaBed className="text-[#aabfb9]" />
          <span className="text-[#8a8078]">Beds:</span>
          <StatusPill status={hospital.beds?.status ?? 'unknown'} />
          {hospital.beds?.available !== null && hospital.beds?.available !== undefined && (
            <span className="text-[#a3988a]">({hospital.beds.available}/{hospital.beds.total})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <FiAlertCircle className="text-[#aabfb9]" />
          <span className="text-[#8a8078]">ICU:</span>
          <StatusPill status={hospital.icu?.status ?? 'unknown'} />
          {hospital.icu?.available !== null && hospital.icu?.available !== undefined && (
            <span className="text-[#a3988a]">({hospital.icu.available}/{hospital.icu.total})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <FiAlertCircle className="text-[#c47b6a]" />
          <span className="text-[#8a8078]">Emergency:</span>
          <StatusPill status={hospital.emergency_dept?.status ?? 'unknown'} />
        </div>
      </div>

      {/* On-duty doctors */}
      {hospital.on_duty_doctors_count > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-[#2f7a52]">
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
            <span key={s.id} className="text-xs bg-[#f2ece0] text-[#8a7350] border border-[#e5dcc8] px-2 py-0.5 rounded-full">
              {s.name}
            </span>
          ))}
          {hospital.services.length > 4 && (
            <span className="text-xs text-[#a3988a]">+{hospital.services.length - 4} more</span>
          )}
        </div>
      )}

      {/* Phone */}
      {(hospital.phone || hospital.emergency_contact) && (
        <div className="flex items-center gap-1.5 text-xs text-[#8a8078]">
          <FiPhone className="flex-shrink-0 text-[#aabfb9]" />
          {hospital.emergency_contact ? (
            <a href={`tel:${hospital.emergency_contact}`} className="text-[#a15b4a] font-medium hover:underline">
              Emergency: {hospital.emergency_contact}
            </a>
          ) : (
            <a href={`tel:${hospital.phone}`} className="hover:underline hover:text-[#216d73]">{hospital.phone}</a>
          )}
        </div>
      )}

      {/* Bed update time */}
      {hospital.beds?.updated_at && (
        <div className="flex items-center gap-1 text-xs text-[#a3988a]">
          <FiClock />
          <span>Beds updated: {new Date(hospital.beds.updated_at).toLocaleString()}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-[#f2ece0] mt-auto">
        <Link
          to={`/user/hospitals/${hospital.id}`}
          className="flex-1 text-center text-xs font-medium bg-[#216d73] text-white px-3 py-2 rounded-lg hover:bg-[#184f54] transition-colors"
        >
          View Details
        </Link>
        {onViewMap && (
          <button
            onClick={() => onViewMap(hospital)}
            className="flex-1 text-xs font-medium border border-[#e5dcc8] text-[#216d73] px-3 py-2 rounded-lg hover:bg-[#eef3f2] hover:border-[#aabfb9] transition-colors flex items-center justify-center gap-1"
          >
            <FiMapPin className="text-sm" /> Map
          </button>
        )}
        {onGetDirections && (
          <button
            onClick={() => onGetDirections(hospital)}
            className="flex-1 text-xs font-medium border border-[#e5dcc8] text-[#2f7a52] px-3 py-2 rounded-lg hover:bg-[#eaf5ee] hover:border-[#bfe0ca] transition-colors flex items-center justify-center gap-1"
          >
            <FiNavigation className="text-sm" /> Directions
          </button>
        )}
        {hospital.emergency_contact && (
          <a
            href={`tel:${hospital.emergency_contact}`}
            className="flex-1 text-xs font-medium bg-[#f70000] text-white px-3 py-2 rounded-lg hover:bg-[#8a4a3b] transition-colors text-center flex items-center justify-center gap-1"
          >
            <FiPhone className="text-xs" /> Call
          </a>
        )}
      </div>
    </div>
  );
};
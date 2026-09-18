import React from 'react';
import type { AvailabilityStatus } from '../../types';

interface Props {
  status: AvailabilityStatus;
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<AvailabilityStatus, { bg: string; text: string; label: string }> = {
  available:   { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Available' },
  limited:     { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Limited' },
  unavailable: { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Unavailable' },
  full:        { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Full' },
  unknown:     { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Unknown' },
};

export const StatusBadge: React.FC<Props> = ({ status, label, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-0.5';
  return (
    <span className={`badge font-semibold rounded-full ${config.bg} ${config.text} ${sizeClass}`}>
      {label || config.label}
    </span>
  );
};

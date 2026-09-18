import React from 'react';
import type { ReferralStatus } from '../../types';

interface Props {
  status: ReferralStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<ReferralStatus, { bg: string; text: string; label: string }> = {
  pending:         { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  accepted:        { bg: 'bg-green-100',  text: 'text-green-800',  label: 'Accepted' },
  rejected:        { bg: 'bg-red-100',    text: 'text-red-800',    label: 'Rejected' },
  call_required:   { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Call Required' },
  patient_sent:    { bg: 'bg-teal-100',   text: 'text-teal-800',   label: 'Patient Sent' },
  patient_arrived: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Patient Arrived' },
  cancelled:       { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Cancelled' },
};

export const ReferralStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`badge font-semibold rounded-full ${config.bg} ${config.text} ${sizeClass}`}>
      {config.label}
    </span>
  );
};

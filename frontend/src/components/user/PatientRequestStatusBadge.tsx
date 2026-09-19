import React from 'react';
import type { PatientRequestStatus } from '../../types';

const CONFIG: Record<PatientRequestStatus, { label: string; cls: string }> = {
  pending:      { label: 'Pending',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted:     { label: 'Accepted',      cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected:     { label: 'Rejected',      cls: 'bg-red-50 text-red-700 border-red-200' },
  call_required:{ label: 'Call Required', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  cancelled:    { label: 'Cancelled',     cls: 'bg-gray-50 text-gray-500 border-gray-200' },
};

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export const PatientRequestStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const cfg = CONFIG[status as PatientRequestStatus] ?? {
    label: status,
    cls: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

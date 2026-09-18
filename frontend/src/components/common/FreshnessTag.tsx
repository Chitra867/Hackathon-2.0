import React from 'react';
import type { FreshnessLabel } from '../../types';

interface Props {
  label: FreshnessLabel;
  minutesAgo?: number;
  showTime?: boolean;
}

const FRESHNESS_CONFIG: Record<FreshnessLabel, { bg: string; text: string; dot: string; label: string }> = {
  current:  { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500',  label: 'Current' },
  recent:   { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500',   label: 'Recent' },
  old:      { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Old — verify' },
  stale:    { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500',    label: 'Stale' },
};

export const FreshnessTag: React.FC<Props> = ({ label, minutesAgo, showTime = false }) => {
  const config = FRESHNESS_CONFIG[label] || FRESHNESS_CONFIG.stale;

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
  };

  return (
    <span className={`badge ${config.bg} ${config.text} gap-1`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
      {showTime && minutesAgo !== undefined && (
        <span className="opacity-70 ml-1">({formatTime(minutesAgo)})</span>
      )}
    </span>
  );
};

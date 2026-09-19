import React from 'react';
import { FaBed } from 'react-icons/fa';
import { FiClock } from 'react-icons/fi';

interface AvailabilityRecord {
  id: number;
  type: string;
  type_display: string;
  status: string;
  status_display: string;
  available_count: number | null;
  total_count: number | null;
  notes: string;
  updated_at: string;
  freshness_label: string;
  age_minutes: number;
}

interface Props {
  records: AvailabilityRecord[];
}

const statusStyle: Record<string, { bar: string; text: string; bg: string }> = {
  available:   { bar: '#15803d', text: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  limited:     { bar: '#b45309', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  unavailable: { bar: '#b91c1c', text: 'text-red-700',   bg: 'bg-red-50 border-red-200'   },
  full:        { bar: '#7f1d1d', text: 'text-red-800',   bg: 'bg-red-100 border-red-300'  },
  unknown:     { bar: '#9ca3af', text: 'text-gray-500',  bg: 'bg-gray-50 border-gray-200'  },
};

const freshnessStyle: Record<string, string> = {
  current: 'text-green-600',
  recent:  'text-amber-600',
  old:     'text-orange-500',
  stale:   'text-red-500',
};

function freshnessText(minutes: number, label: string): string {
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago (${label})`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago (${label})`;
  return `${Math.floor(minutes / 1440)}d ago (${label})`;
}

export const BedAvailability: React.FC<Props> = ({ records }) => {
  if (records.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic py-4 text-center">
        No availability records reported for this hospital.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {records.map(rec => {
        const style = statusStyle[rec.status] ?? statusStyle.unknown;
        const pct =
          rec.available_count !== null && rec.total_count
            ? Math.round((rec.available_count / rec.total_count) * 100)
            : null;

        return (
          <div key={rec.id} className={`p-3 rounded-lg border ${style.bg}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <FaBed className={style.text} />
                <span className="font-medium text-sm text-[#172554]">{rec.type_display}</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.text}`}>
                {rec.status_display}
              </span>
            </div>

            {/* Count bar */}
            {rec.available_count !== null && rec.total_count !== null && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Available: {rec.available_count}</span>
                  <span className="text-gray-500">Total: {rec.total_count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${pct ?? 0}%`,
                      backgroundColor: style.bar,
                    }}
                  />
                </div>
              </div>
            )}

            {rec.notes && (
              <p className="text-xs text-gray-500 mt-1">{rec.notes}</p>
            )}

            <div className={`flex items-center gap-1 text-xs mt-1.5 ${freshnessStyle[rec.freshness_label] ?? 'text-gray-400'}`}>
              <FiClock />
              <span>{freshnessText(rec.age_minutes, rec.freshness_label)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

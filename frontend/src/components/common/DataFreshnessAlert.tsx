import React from 'react';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';

interface Props {
  hasStale: boolean;
  hasOld?: boolean;
}

export const DataFreshnessAlert: React.FC<Props> = ({ hasStale, hasOld }) => {
  if (!hasStale && !hasOld) return null;

  if (hasStale) {
    return (
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 mb-4">
        <FiAlertTriangle className="flex-shrink-0 mt-0.5 text-red-500" />
        <div>
          <strong>Stale data warning:</strong> Some availability information is more than 6 hours old.
          This data may not reflect current conditions. Contact the hospital directly to confirm availability.
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 mb-4">
      <FiInfo className="flex-shrink-0 mt-0.5 text-yellow-500" />
      <div>
        <strong>Note:</strong> Some availability data is 2–6 hours old. Verify with the hospital before transfer.
      </div>
    </div>
  );
};

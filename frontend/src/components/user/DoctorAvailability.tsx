import React from 'react';
import { FiUser, FiClock } from 'react-icons/fi';

interface DoctorInfo {
  id: number;
  name: string;
  specialty: string;
  qualification: string;
  duty_status: string;
  duty_status_display: string;
  consultation_days: string;
  consultation_time: string;
  updated_at: string;
}

interface Props {
  doctors: DoctorInfo[];
}

const dutyBadge: Record<string, string> = {
  on_duty:  'text-green-700 bg-green-50 border-green-200',
  off_duty: 'text-gray-500 bg-gray-50 border-gray-200',
  on_leave: 'text-amber-700 bg-amber-50 border-amber-200',
  unknown:  'text-gray-400 bg-gray-50 border-gray-100',
};

export const DoctorAvailability: React.FC<Props> = ({ doctors }) => {
  if (doctors.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic py-4 text-center">
        No doctor information available for this hospital.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {doctors.map(doc => (
        <div key={doc.id} className="flex items-start gap-3 p-3 bg-[#faf6ee] rounded-lg border border-[#ede0ce]">
          <div className="bg-primary-100 rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
            <FiUser className="text-primary-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[#172554] text-sm">Dr. {doc.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${dutyBadge[doc.duty_status] ?? dutyBadge.unknown}`}>
                {doc.duty_status_display}
              </span>
            </div>
            <p className="text-xs text-primary-700 font-medium mt-0.5">{doc.specialty}</p>
            {doc.qualification && (
              <p className="text-xs text-gray-500">{doc.qualification}</p>
            )}
            {(doc.consultation_days || doc.consultation_time) && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <FiClock className="flex-shrink-0" />
                <span>
                  {[doc.consultation_days, doc.consultation_time].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Updated: {new Date(doc.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

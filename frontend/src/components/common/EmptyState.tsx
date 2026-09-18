import React from 'react';
import { FiInbox } from 'react-icons/fi';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
      role="status"
      aria-label={title}
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon ? (
          <span className="text-gray-400 text-2xl" aria-hidden="true">
            {icon}
          </span>
        ) : (
          <FiInbox className="w-8 h-8 text-gray-400" aria-hidden="true" />
        )}
      </div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;

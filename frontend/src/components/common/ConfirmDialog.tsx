import React, { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBtn: 'btn-danger',
  },
  warning: {
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBtn: 'btn-primary',
  },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const config = variantConfig[variant];

  useEffect(() => {
    if (isOpen) {
      cancelBtnRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-slide-up">
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.iconBg}`}>
              <FiAlertTriangle className={`w-5 h-5 ${config.iconColor}`} aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
                {title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              ref={cancelBtnRef}
              className="btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBtn}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

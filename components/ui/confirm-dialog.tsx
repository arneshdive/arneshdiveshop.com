'use client';

import { Icon } from '@iconify/react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'solar:trash-bin-trash-linear',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBtn: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'solar:danger-triangle-linear',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700',
    },
    default: {
      icon: 'solar:question-circle-linear',
      iconBg: 'bg-neutral-100',
      iconColor: 'text-neutral-600',
      confirmBtn: 'bg-neutral-900 hover:bg-neutral-800',
    },
  };

  const styles = variantStyles[variant];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon icon={styles.icon} className={`w-5 h-5 ${styles.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-neutral-900">
                  {title}
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${styles.confirmBtn}`}
            >
              {isLoading && (
                <Icon icon="solar:spinner-line" className="w-4 h-4 animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

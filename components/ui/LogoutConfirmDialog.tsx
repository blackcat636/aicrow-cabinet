'use client';

import React from 'react';
import { ChevronLeftIcon } from '@/components/icons';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="hidden md:flex fixed inset-0 z-[9999] bg-black/80 items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading) onClose();
        }}
      >
        <div className="w-full max-w-[423px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] overflow-hidden">
          <div className="h-[67px] bg-[var(--color-secondary-3)] border-b border-[var(--color-secondary-4)] px-8 flex items-center justify-between">
            <p className="text-[14px] leading-[1.4] tracking-[0.28px] font-semibold uppercase text-[var(--color-secondary-10)]">
              Log Out
            </p>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-8 w-8 rounded-full border border-[var(--color-secondary-5)] text-[var(--color-secondary-10)] flex items-center justify-center text-[18px] leading-none disabled:opacity-60"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="px-8 py-6">
            <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-center text-[var(--color-secondary-10)]">
              Are you sure you want to log out of this account?
            </p>

            <div className="mt-6 pt-6 border-t border-[var(--color-secondary-4)] flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 h-12 rounded-[10px] border border-[var(--color-main)] bg-transparent text-[var(--color-main)] text-[16px] leading-[1.4] tracking-[0.32px] font-semibold disabled:opacity-60"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 h-12 rounded-[10px] bg-[var(--color-main)] text-[var(--color-secondary-10)] text-[16px] leading-[1.4] tracking-[0.32px] font-semibold disabled:opacity-60"
              >
                {loading ? '...' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed inset-x-0 top-[71px] bottom-0 z-[9999] bg-[var(--color-secondary-1)] overflow-y-auto px-4 pt-6 pb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-8 w-8 rounded-full border border-[var(--color-secondary-5)] flex items-center justify-center text-[var(--color-secondary-10)] disabled:opacity-60"
            aria-label="Back"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <p className="text-[14px] leading-[1.4] tracking-[0.28px] font-semibold uppercase text-[var(--color-secondary-10)]">
            Log Out
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-center text-[var(--color-secondary-10)]">
            Are you sure you want to log out of this account?
          </p>
          <div className="h-px bg-[var(--color-secondary-4)]" />
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-[48px] rounded-[10px] bg-[var(--color-main)] text-[var(--color-secondary-10)] text-[16px] leading-[1.4] tracking-[0.32px] font-semibold disabled:opacity-60"
          >
            {loading ? '...' : 'Log Out'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full h-[48px] rounded-[10px] border border-[var(--color-main)] bg-transparent text-[var(--color-main)] text-[16px] leading-[1.4] tracking-[0.32px] font-semibold disabled:opacity-60"
          >
            Discard
          </button>
        </div>
      </div>
    </>
  );
};


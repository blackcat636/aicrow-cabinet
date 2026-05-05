'use client';

import React, { useId } from 'react';
import { AlertTriangleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/spinner';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title: titleText,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'danger',
  loading = false,
}) => {
  const descriptionId = useId();

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
    onClose();
  };

  const iconWrap =
    type === 'danger'
      ? 'border border-red-500/30 bg-red-900/30 text-red-400'
      : type === 'warning'
        ? 'border border-yellow-500/30 bg-yellow-900/30 text-yellow-400'
        : 'border border-blue-500/30 bg-blue-900/30 text-blue-400';

  const confirmVariant =
    type === 'danger'
      ? 'destructive'
      : type === 'warning'
        ? 'secondary'
        : 'default';

  const modalTitle = (
    <span className="inline-flex items-center gap-3 text-left text-xl font-bold md:text-2xl">
      <span
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconWrap}`}
      >
        <AlertTriangleIcon className="h-6 w-6" />
      </span>
      <span>{titleText}</span>
    </span>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title={modalTitle}
      titleClassName="items-start normal-case leading-tight"
      descriptionId={descriptionId}
      size="sm"
      mobileLayout="overlay"
      showBackdrop
      closeOnBackdrop={!loading}
      closeOnEsc={!loading}
      showCloseButton
      className="!z-[9999]"
      panelClassName="border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)]"
    >
      <p
        id={descriptionId}
        className="mb-6 break-words text-base leading-relaxed text-[var(--color-secondary-8)] [overflow-wrap:anywhere]"
      >
        {message}
      </p>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (loading) return;
            onClose();
          }}
          disabled={loading}
          className="border-[var(--color-secondary-5)] text-[var(--color-secondary-10)] hover:bg-[var(--color-secondary-3)]"
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          onClick={handleConfirm}
          disabled={loading}
          className={
            type === 'warning'
              ? 'bg-amber-600 text-white hover:bg-amber-500'
              : type === 'info'
                ? ''
                : ''
          }
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" className="text-current" label="Loading" />
            </span>
          ) : (
            confirmText
          )}
        </Button>
      </div>
    </Modal>
  );
};

'use client';

import React from 'react';

import { FormActions } from '@/components/ui/FormActions';
import { Modal } from '@/components/ui/Modal';

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
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onClose();
      }}
      title="Log Out"
      titleClassName="text-[14px] uppercase tracking-[0.28px] !text-red-400 md:normal-case md:text-[14px] md:font-semibold md:leading-[1.4] md:tracking-[0.28px]"
      size="sm"
      mobileLayout="full"
      mobileBelowHeader
      showBackdrop
      backdropDesktopOnly
      closeOnBackdrop={!loading}
      closeOnEsc={!loading}
      showCloseButton
      mobileBackButton
      closeButtonClassName="!text-red-400 hover:!text-red-300"
      mobileBackButtonClassName="border-red-400/60 !text-red-400 hover:border-red-300 hover:!text-red-300"
      panelClassName="border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] md:max-w-[423px] md:rounded-[10px]"
    >
      <p className="px-0 pb-0 pt-2 text-center text-[16px] font-semibold leading-[1.4] tracking-[0.32px] text-[var(--color-secondary-10)] md:px-8 md:py-6">
        Are you sure you want to log out of this account?
      </p>

      <div className="mt-6 h-px bg-[var(--color-secondary-4)] md:hidden" aria-hidden />

      <FormActions
        className="px-4 pb-8 pt-6 md:border-t md:border-[var(--color-secondary-4)] md:px-8 md:pb-6 md:pt-6"
        primary={{
          label: 'Log Out',
          type: 'button',
          loading,
          disabled: loading,
          onClick: onConfirm,
        }}
        secondary={{
          label: 'Discard',
          onClick: onClose,
          disabled: loading,
        }}
      />
    </Modal>
  );
};

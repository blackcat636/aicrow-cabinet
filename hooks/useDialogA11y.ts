'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface UseDialogA11yOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEsc?: boolean;
  /** When true, Escape does not call onClose (e.g. while loading) */
  disabled?: boolean;
}

/**
 * Shared a11y behavior for modal/dialog overlays: Escape to close, body scroll lock.
 * Focus management (initial focus, focus trap) is handled by Modal or callers as needed.
 */
export function useDialogA11y({
  isOpen,
  onClose,
  closeOnEsc = true,
  disabled = false,
}: UseDialogA11yOptions): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleEsc = useCallback(
    (event: KeyboardEvent) => {
      if (!closeOnEsc || disabled) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    },
    [closeOnEsc, disabled]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleEsc]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);
}

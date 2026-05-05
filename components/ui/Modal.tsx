'use client';

import * as React from 'react';
import { useId, useEffect, useRef, useCallback } from 'react';

import { ChevronLeftIcon, XIcon } from '@/components/icons';
import { useDialogA11y } from '@/hooks/useDialogA11y';
import { cn } from '@/lib/utils';

const sizeToMaxWidth: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'md:max-w-[423px]',
  md: 'md:max-w-[540px]',
  lg: 'md:max-w-[640px]',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  size?: 'sm' | 'md' | 'lg';
  /** full: full-viewport sheet on mobile; overlay: centered card */
  mobileLayout?: 'full' | 'overlay';
  /** Profile-style mobile sheet below app header (top ~71px) */
  mobileBelowHeader?: boolean;
  /** Dimmed backdrop only from md (mobile uses solid sheet bg) */
  backdropDesktopOnly?: boolean;
  /** Mobile-only chevron that calls onClose (profile sheets) */
  mobileBackButton?: boolean;
  /** Desktop backdrop click (e.g. open discard confirm) instead of onClose */
  onBackdropClick?: () => void;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  ariaLabel?: string;
  /** Merged into the title `h2` when `title` is set */
  titleClassName?: string;
  /** Optional `id` of the dialog description element */
  descriptionId?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Rendered below the panel (e.g. auth switch-to-register strip) */
  afterPanel?: React.ReactNode;
  afterPanelClassName?: string;
  showBackdrop?: boolean;
  backdropClassName?: string;
  /** Auth modals often omit a visible close control */
  showCloseButton?: boolean;
  closeButtonClassName?: string;
  backButtonClassName?: string;
  mobileBackButtonClassName?: string;
  className?: string;
  panelClassName?: string;
  showMobileAccentBlob?: boolean;
}

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.getAttribute('aria-hidden') !== 'true'
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  showBack,
  onBack,
  size = 'md',
  mobileLayout = 'full',
  mobileBelowHeader = false,
  backdropDesktopOnly = false,
  mobileBackButton = false,
  onBackdropClick,
  closeOnBackdrop = true,
  closeOnEsc = true,
  ariaLabel,
  titleClassName,
  descriptionId,
  children,
  footer,
  afterPanel,
  afterPanelClassName,
  showBackdrop = true,
  backdropClassName,
  showCloseButton = true,
  closeButtonClassName,
  backButtonClassName,
  mobileBackButtonClassName,
  className,
  panelClassName,
  showMobileAccentBlob = false,
}: ModalProps): React.JSX.Element | null {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useDialogA11y({
    isOpen,
    onClose,
    closeOnEsc,
    disabled: false,
  });

  const backdropClass =
    backdropClassName ?? (mobileLayout === 'full' ? 'bg-black/60 md:bg-black/60' : 'bg-black/60');

  const handleBackdropMouseDown = useCallback(() => {
    if (onBackdropClick) {
      onBackdropClick();
      return;
    }
    if (closeOnBackdrop) {
      onClose();
    }
  }, [closeOnBackdrop, onBackdropClick, onClose]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const t = window.setTimeout(() => {
      if (showCloseButton && closeButtonRef.current) {
        closeButtonRef.current.focus();
        return;
      }
      const focusable = getFocusableElements(panelRef.current!);
      focusable[0]?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, showCloseButton]);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const node = panelRef.current;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements(node);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    node.addEventListener('keydown', handleKeyDown);
    return () => node.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const hasTitle = title != null && title !== '';
  const labelledBy = hasTitle ? titleId : undefined;

  const outerClass = mobileBelowHeader
    ? 'fixed inset-x-0 top-[71px] bottom-0 z-50 flex flex-col items-stretch justify-start overflow-y-auto pb-[env(safe-area-inset-bottom)] md:inset-0 md:items-center md:justify-center md:overflow-visible md:p-4 md:pb-0'
    : mobileLayout === 'overlay'
      ? 'fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4'
      : 'fixed inset-0 z-50 flex flex-col items-center justify-center p-0 md:p-4';

  const panelBase =
    'relative flex w-full flex-col border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] text-[var(--color-secondary-10)] shadow-xl overflow-hidden z-10';

  const mobileSizing =
    mobileLayout === 'full'
      ? 'h-full max-h-[100dvh] md:h-auto md:max-h-none rounded-none border-0 md:rounded-[20px] md:border'
      : 'max-h-[min(100dvh,640px)] rounded-[12px] border';

  return (
    <div className={cn(outerClass, className, 'pointer-events-none')}>
      {showBackdrop ? (
        <div
          className={cn(
            'pointer-events-auto absolute inset-0 z-0',
            backdropClass,
            backdropDesktopOnly && 'hidden md:block'
          )}
          aria-hidden
          onMouseDown={handleBackdropMouseDown}
        />
      ) : null}

      <div className="relative z-10 flex h-full w-full max-w-full flex-1 flex-col items-center justify-center pointer-events-none md:h-auto md:flex-none">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={descriptionId || undefined}
        aria-label={!hasTitle ? ariaLabel : undefined}
          className={cn(
            panelBase,
            'pointer-events-auto',
            sizeToMaxWidth[size],
            mobileSizing,
            mobileLayout === 'overlay' &&
              'mx-4 w-[calc(100%-2rem)] max-w-[min(100vw-2rem,540px)] md:mx-0 md:w-full',
            panelClassName
          )}
        >
        {showMobileAccentBlob ? (
          <div
            className="pointer-events-none absolute bottom-0 left-1/2 h-[299px] w-[299px] -translate-x-1/2 translate-y-1/2 rounded-[299px] bg-[#8D2EE2] blur-[139px] md:hidden"
            aria-hidden
          />
        ) : null}

        <div
          className={cn(
            'relative flex flex-shrink-0 items-center border-b border-[var(--color-secondary-4)] px-6 pb-4 pt-[64px] md:justify-center md:px-6 md:pt-8 md:pb-2',
            showBack &&
              'grid grid-cols-[auto_1fr_auto] gap-2 md:grid-cols-1 md:justify-center',
            !showBack && 'justify-between md:justify-center'
          )}
        >
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#757575] text-[#757575] transition-colors hover:border-white hover:bg-white/10 hover:text-white md:absolute md:left-4 md:top-4',
                backButtonClassName
              )}
              aria-label="Back"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          ) : mobileBackButton ? (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-secondary-5)] text-[var(--color-secondary-10)] md:hidden',
                mobileBackButtonClassName
              )}
              aria-label="Back"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          ) : (
            <div className="w-0 shrink-0 overflow-hidden md:hidden" aria-hidden />
          )}

          {hasTitle ? (
            <h2
              id={titleId}
              className={cn(
                'text-[26px] font-bold leading-[1.3] text-white md:text-center md:text-[32px] md:font-semibold md:leading-[1.4] md:tracking-[0.64px]',
                showBack && 'text-center',
                !showBack && 'flex-1 text-center md:flex-none md:contents',
                titleClassName
              )}
            >
              {title}
            </h2>
          ) : (
            <div className="flex-1 md:flex-none" />
          )}

          {showCloseButton ? (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className={cn(
                'flex shrink-0 items-center justify-center p-0 text-[#757575] transition-colors hover:text-white md:absolute md:right-4 md:top-4',
                closeButtonClassName
              )}
              aria-label="Close"
            >
              <XIcon className="h-8 w-8 shrink-0" />
            </button>
          ) : (
            <div className="w-8 shrink-0 md:hidden" aria-hidden />
          )}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-initial md:overflow-visible">
          <div className="flex-1 px-6 pb-6 pt-0 md:p-6 md:pt-4">{children}</div>
          {footer ? (
            <div className="flex-shrink-0 border-t border-[var(--color-secondary-4)] px-6 py-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
        {afterPanel ? (
          <div
            className={cn(
              'pointer-events-auto w-full max-w-full md:max-w-[540px]',
              size === 'sm' && 'md:max-w-[423px]',
              size === 'lg' && 'md:max-w-[640px]',
              afterPanelClassName
            )}
          >
            {afterPanel}
          </div>
        ) : null}
      </div>
    </div>
  );
}

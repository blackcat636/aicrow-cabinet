'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/spinner';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { VerificationCodeInput } from '@/components/ui/VerificationCodeInput';

interface VerifyEmailFormProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerified: () => void;
  showInitialToast?: boolean;
}

function StepIndicator({
  createLabel,
  verifyLabel,
}: {
  createLabel: string;
  verifyLabel: string;
}): React.JSX.Element {
  return (
    <div className="px-0 pb-2 pt-0 md:px-0">
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 rounded bg-[var(--color-secondary-4)]" />
        <div className="h-1 flex-1 rounded bg-[var(--color-main)]" />
      </div>
      <div className="mt-2 flex justify-between">
        <span className="text-xs text-[var(--color-secondary-6)]">{createLabel}</span>
        <span className="text-xs text-[var(--color-main)]">{verifyLabel}</span>
      </div>
    </div>
  );
}

export const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({
  isOpen,
  onClose,
  email,
  onVerified,
  showInitialToast = true,
}) => {
  const t = useTranslations('auth');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const toastShownRef = useRef(false);
  const formErrorId = useId();
  const codeId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setErrors({ code: t('verificationCodeRequired') });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = (await response.json()) as { error?: string; user?: unknown; accessToken?: string };

      if (!response.ok) {
        setError(data.error || t('verificationFailed'));
        return;
      }

      if (data.user && data.accessToken) {
        toast.success(t('emailVerifiedSuccess'), {
          description: t('youAreSignedIn'),
          duration: 5000,
        });

        onVerified();
      } else {
        setError(t('verificationSuccessfulButLoginFailed'));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('verificationFailed');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = window.setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [resendTimer]);

  useEffect(() => {
    if (isOpen && showInitialToast && !toastShownRef.current) {
      toast.success(t('verificationCodeSent'), {
        description: t('checkEmail', { email }),
        duration: 5000,
      });
      toastShownRef.current = true;
    }

    if (!isOpen) {
      toastShownRef.current = false;
    }
  }, [isOpen, email, showInitialToast, t]);

  const handleResendCode = async () => {
    setIsResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || t('resendCodeError'));
      } else {
        setSuccessMessage(t('resendCodeSuccess'));
        setResendTimer(60);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('resendCodeError');
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      setCode('');
      setError(null);
      setErrors({});
      setSuccessMessage(null);
      setResendTimer(60);
    }, 300);
  };

  const formGlobalDescribedBy = error ? formErrorId : undefined;

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('verifyEmail')}
      titleClassName="md:text-xl md:font-semibold md:leading-tight"
      size="sm"
      mobileLayout="overlay"
      showBackdrop
      showCloseButton
      panelClassName="border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)]"
    >
      <div className="space-y-4">
        <StepIndicator
          createLabel={t('createAccountStep')}
          verifyLabel={t('verifyEmailStep')}
        />

        <StatusBanner variant="info" className="text-sm">
          <p className="mb-2 text-[var(--color-secondary-8)]">{t('codeSentTo')}</p>
          <p className="font-semibold text-[var(--color-secondary-10)]">{email}</p>
          <p className="mt-2 text-xs text-[var(--color-secondary-6)]">
            {t('checkEmailAndEnterCode')}
          </p>
        </StatusBanner>

        {successMessage ? (
          <StatusBanner variant="success" className="text-sm">
            {successMessage}
          </StatusBanner>
        ) : null}

        {error ? (
          <StatusBanner variant="error" id={formErrorId} className="text-sm">
            {error}
          </StatusBanner>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label={t('verificationCode')}
            htmlFor={codeId}
            error={errors.code}
            required
          >
            <VerificationCodeInput
              id={codeId}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (errors.code) {
                  setErrors((prev) => ({ ...prev, code: '' }));
                }
              }}
              placeholder={t('enterVerificationCode')}
              aria-invalid={Boolean(errors.code)}
              aria-describedby={formGlobalDescribedBy}
              invalid={Boolean(errors.code)}
              maxLength={6}
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="figma"
              disabled={isLoading}
              className="h-12 w-full"
            >
              {isLoading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Spinner size="sm" className="text-white" label={t('verifying')} />
                  {t('verifying')}
                </span>
              ) : (
                t('verifyEmail')
              )}
            </Button>
          </div>

          <div className="space-y-2 text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending || resendTimer > 0}
              className="text-sm font-medium text-[var(--color-main)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isResending
                ? t('sending')
                : resendTimer > 0
                  ? t('resendCodeIn', { seconds: resendTimer })
                  : t('resendVerificationCode')}
            </button>
            <div>
              <button
                type="button"
                onClick={handleClose}
                className="text-sm font-medium text-[var(--color-secondary-6)] transition-colors hover:text-[var(--color-main)]"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

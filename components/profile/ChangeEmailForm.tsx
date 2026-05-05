'use client';

import React, { useState, useEffect, useId } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormActions } from '@/components/ui/FormActions';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { VerificationCodeInput } from '@/components/ui/VerificationCodeInput';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';

interface ChangeEmailFormProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSuccess: () => void;
}

type Step = 'email' | 'code';

export const ChangeEmailForm: React.FC<ChangeEmailFormProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onSuccess,
}) => {
  const t = useTranslations('profile.changeEmailForm');
  const tProfile = useTranslations('profile');
  const [step, setStep] = useState<Step>('email');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formErrorId = useId();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(newEmail)) return;

    if (newEmail === currentEmail) {
      setError(t('newEmailDifferent'));
      return;
    }

    setSendingCode(true);
    setError(null);
    setErrors({});

    try {
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newEmail }),
        cache: 'no-cache',
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      toast.success(t('codeSentSuccess', { email: currentEmail }));
      setStep('code');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('failedToSendCode');
      setError(message);
      toast.error(message);
    } finally {
      setSendingCode(false);
    }
  };

  const validateEmail = (emailValue: string): boolean => {
    if (!emailValue.trim()) {
      setErrors({ email: t('emailRequired') });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setErrors({ email: t('invalidEmailFormat') });
      return false;
    }
    return true;
  };

  const validateCode = (): boolean => {
    if (!code.trim()) {
      setErrors({ code: t('verificationCodeRequiredError') });
      return false;
    }
    return true;
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCode()) return;

    setIsLoading(true);
    setError(null);
    setErrors({});

    try {
      const response = await fetch('/api/auth/confirm-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: currentEmail, code }),
        cache: 'no-cache',
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm email change');
      }

      toast.success(t('emailChangedSuccess'));
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('failedToConfirm');
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setNewEmail('');
    setCode('');
    setError(null);
    setErrors({});
  };

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      resetForm();
    }, 300);
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const formGlobalDescribedBy = error ? formErrorId : undefined;

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={step === 'email' ? t('enterNewEmail') : t('enterVerificationCode')}
        titleClassName="text-[14px] uppercase md:normal-case md:text-xl md:font-semibold md:leading-tight"
        size="sm"
        mobileLayout="full"
        mobileBelowHeader
        showBackdrop
        backdropDesktopOnly
        onBackdropClick={() => setConfirmOpen(true)}
        closeOnBackdrop={false}
        closeOnEsc={false}
        showCloseButton
        mobileBackButton
        panelClassName="flex min-h-full flex-1 flex-col border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] md:min-h-0 md:flex-none md:rounded-xl md:border-gray-700 md:bg-gray-900"
      >
        <div className="flex flex-1 flex-col p-4 md:p-6">
          {sendingCode ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner
                size="xl"
                className="mb-4 text-[var(--color-main)]"
                label={t('sendingCodeMessage')}
              />
              <p className="text-[var(--color-secondary-7)]">{t('sendingCodeMessage')}</p>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <FormField label={t('currentEmail')} htmlFor="change-email-current">
                <Input
                  id="change-email-current"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="cursor-not-allowed opacity-80"
                />
              </FormField>

              <FormField label={t('newEmailRequired')} htmlFor="change-email-new" error={errors.email}>
                <Input
                  id="change-email-new"
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  placeholder={t('enterNewEmailPlaceholder')}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={formGlobalDescribedBy}
                  invalid={Boolean(errors.email)}
                />
              </FormField>

              {error ? (
                <StatusBanner variant="error" id={formErrorId} className="text-sm">
                  {error}
                </StatusBanner>
              ) : null}

              <FormActions
                primary={{
                  label: sendingCode ? t('sendingCode') : t('sendCode'),
                  type: 'submit',
                  loading: sendingCode,
                  disabled: sendingCode,
                }}
                secondary={{
                  label: tProfile('discard'),
                  onClick: handleClose,
                }}
              />
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <StatusBanner variant="success" className="mb-4 text-sm">
                {t('codeSentSuccessMessage', { email: currentEmail })}
              </StatusBanner>

              <FormField label={t('newEmail')} htmlFor="change-email-readonly">
                <Input
                  id="change-email-readonly"
                  type="email"
                  value={newEmail}
                  disabled
                  className="cursor-not-allowed opacity-80"
                />
              </FormField>

              <FormField
                label={t('verificationCodeRequired')}
                htmlFor="change-email-code"
                error={errors.code}
                hint={t('codeSentToCurrentEmail', { email: currentEmail })}
              >
                <VerificationCodeInput
                  id="change-email-code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (errors.code) {
                      setErrors({ ...errors, code: '' });
                    }
                  }}
                  placeholder={t('enterVerificationCodePlaceholder')}
                  normalizeUppercase
                  aria-invalid={Boolean(errors.code)}
                  aria-describedby={formGlobalDescribedBy}
                  invalid={Boolean(errors.code)}
                  maxLength={6}
                />
              </FormField>

              {error ? (
                <StatusBanner variant="error" id={formErrorId} className="text-sm">
                  {error}
                </StatusBanner>
              ) : null}

              <FormActions
                primary={{
                  label: isLoading ? t('confirming') : t('confirmChange'),
                  type: 'submit',
                  loading: isLoading,
                  disabled: isLoading,
                }}
                secondary={{
                  label: tProfile('discard'),
                  onClick: handleClose,
                }}
              />
            </form>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          handleClose();
        }}
        title={tProfile('discardChanges')}
        message={tProfile('discardChangesMessage')}
        confirmText={tProfile('discard')}
        cancelText={tProfile('keepEditing')}
        type="warning"
      />
    </>
  );
};

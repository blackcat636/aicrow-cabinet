'use client';

import React, { useEffect, useId, useState } from 'react';
import { authApi } from '@/lib/apiAuth';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Spinner } from '@/components/ui/spinner';
import { StatusBanner } from '@/components/ui/StatusBanner';

interface ResetPasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type Step = 'email' | 'code' | 'password';

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
}) => {
  const t = useTranslations('auth');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formErrorId = useId();

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setErrors({ email: t('emailRequired') });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: t('invalidEmailFormat') });
      return false;
    }
    return true;
  };

  const validateCode = (): boolean => {
    if (!code.trim()) {
      setErrors({ code: t('verificationCodeRequired') });
      return false;
    }
    return true;
  };

  const validatePasswords = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = t('newPasswordRequired');
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t('passwordMin6Chars');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) return;

    setIsLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword(email);
      setStep('code');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('failedToSendResetCode');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCode()) return;

    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords()) return;

    setIsLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({ email, code, newPassword });
      setSuccess(true);
      window.setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('failedToResetPassword');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setErrors({});
    setSuccess(false);
  };

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      resetForm();
    }, 300);
  };

  const modalTitle =
    step === 'email'
      ? t('resetPassword')
      : step === 'code'
        ? (
            <>
              <span className="block md:hidden">{t('verificationCodeTitleLine1')}</span>
              <span className="block md:hidden">{t('verificationCodeTitleLine2')}</span>
              <span className="hidden md:inline">{t('verificationCode')}</span>
            </>
          )
        : t('newPassword');

  const titleClassName =
    step === 'code' || step === 'password'
      ? 'text-center md:text-[22px] md:font-semibold md:leading-tight md:tracking-normal'
      : undefined;

  const formGlobalDescribedBy = error ? formErrorId : undefined;

  useEffect(() => {
    if (isOpen && initialEmail) {
      setEmail(initialEmail);
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      titleClassName={titleClassName}
      size="sm"
      mobileLayout="full"
      showBackdrop
      showCloseButton
      showBack={step === 'code' || step === 'password'}
      onBack={() => setStep(step === 'code' ? 'email' : 'code')}
      showMobileAccentBlob
      panelClassName="bg-[#1A1A1A] md:bg-[#282828] md:rounded-[12px]"
    >
      {error ? (
        <StatusBanner variant="error" id={formErrorId} className="mb-4">
          {error}
        </StatusBanner>
      ) : null}

      {success ? (
        <StatusBanner variant="success" className="mb-4">
          {t('passwordResetSuccess')}
        </StatusBanner>
      ) : null}

      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <FormField label={t('emailAddress')} htmlFor="reset-email" error={errors.email}>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('enterYourEmail')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={formGlobalDescribedBy}
              invalid={Boolean(errors.email)}
            />
          </FormField>

          <Button
            type="submit"
            variant="figma"
            disabled={isLoading}
            className="h-12 w-full text-[17px]"
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner size="sm" className="text-white" label={t('sendingCode')} />
                {t('sendingCode')}
              </span>
            ) : (
              t('sendResetCode')
            )}
          </Button>
        </form>
      ) : null}

      {step === 'code' ? (
        <form onSubmit={handleCodeSubmit} className="space-y-5">
          <p className="text-[15px] leading-[1.5] text-[var(--color-secondary-7)]">
            {t('verificationCodeSentTo')}{' '}
            <span className="font-medium text-white">{email}</span>
          </p>

          <FormField label={t('verificationCode')} htmlFor="reset-code" error={errors.code}>
            <Input
              id="reset-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('enterVerificationCode')}
              aria-invalid={Boolean(errors.code)}
              aria-describedby={formGlobalDescribedBy}
              invalid={Boolean(errors.code)}
              autoComplete="one-time-code"
            />
          </FormField>

          <Button type="submit" variant="figma" disabled={isLoading} className="h-12 w-full text-[17px]">
            {t('continue')}
          </Button>
        </form>
      ) : null}

      {step === 'password' ? (
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <FormField
            label={t('newPassword')}
            htmlFor="reset-new-password"
            error={errors.newPassword}
          >
            <PasswordInput
              id="reset-new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('enterNewPassword')}
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={formGlobalDescribedBy}
              invalid={Boolean(errors.newPassword)}
              getToggleAriaLabel={(visible) =>
                visible ? t('hidePassword') : t('showPassword')
              }
            />
          </FormField>

          <FormField
            label={t('confirmPassword')}
            htmlFor="reset-confirm-password"
            error={errors.confirmPassword}
            hint={t('passwordLength')}
          >
            <PasswordInput
              id="reset-confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('confirmNewPasswordPlaceholder')}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={formGlobalDescribedBy}
              invalid={Boolean(errors.confirmPassword)}
              getToggleAriaLabel={(visible) =>
                visible ? t('hidePassword') : t('showPassword')
              }
            />
          </FormField>

          <Button
            type="submit"
            variant="figma"
            disabled={isLoading}
            className="h-12 w-full text-[17px]"
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner size="sm" className="text-white" label={t('resettingPassword')} />
                {t('resettingPassword')}
              </span>
            ) : (
              t('resetPassword')
            )}
          </Button>
        </form>
      ) : null}
    </Modal>
  );
};

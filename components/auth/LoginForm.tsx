'use client';

import React, { useId, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/auth';
import { ResetPasswordForm } from './ResetPasswordForm';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Spinner } from '@/components/ui/spinner';
import { StatusBanner } from '@/components/ui/StatusBanner';
// import { FacebookLoginButton } from './FacebookLoginButton'; // Facebook auth disabled

interface LoginFormProps {
  // When variant is 'modal', uses isOpen/onClose overlay; when 'embedded', always renders inline
  variant?: 'modal' | 'embedded';
  isOpen?: boolean;
  onClose?: () => void;
  onSwitchToRegister: () => void;
  redirectUri?: string;
  service?: string;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  variant = 'modal',
  isOpen = false,
  onClose,
  onSwitchToRegister,
  redirectUri,
  service,
  className,
}) => {
  const t = useTranslations('auth');
  const tSso = useTranslations('sso');
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetPassword, setShowResetPassword] = useState(false);
  const emailId = useId();
  const passwordId = useId();
  const formErrorId = useId();

  const localizeAuthError = (rawError: string): string => {
    const normalized = rawError.trim().toLowerCase();

    if (
      normalized === 'invalid credentials' ||
      normalized === 'incorrect email or password'
    ) {
      return t('invalidCredentials');
    }

    return rawError;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('invalidEmailFormat');
    }

    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      clearError();
      const loginCredentials = {
        ...(formData as LoginRequest),
        redirectUri,
        service,
      };
      await login(loginCredentials);
      if (isModal && onClose) {
        onClose();
      }
    } catch (err: unknown) {
      // Error state is handled inside the auth context
      console.error('[LoginForm] Login error:', err);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const isModal = variant === 'modal';
  const formGlobalDescribedBy = error ? formErrorId : undefined;

  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
      {redirectUri ? (
        <StatusBanner variant="info" className="text-[14px]">
          {tSso('continueToExternalService', {
            service: service ? `: ${service}` : '',
          })}
        </StatusBanner>
      ) : null}

      {error ? (
        <StatusBanner variant="error" id={formErrorId}>
          {localizeAuthError(error)}
        </StatusBanner>
      ) : null}

      <FormField label={t('emailAddress')} htmlFor={emailId} error={errors.email}>
        <Input
          id={emailId}
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder={t('enterYourEmail')}
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={formGlobalDescribedBy}
          invalid={Boolean(errors.email)}
          className="rounded-[10px] md:rounded-[8px] md:bg-transparent"
        />
      </FormField>

      <FormField label={t('password')} htmlFor={passwordId} error={errors.password}>
        <PasswordInput
          id={passwordId}
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          placeholder={t('enterYourPassword')}
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={formGlobalDescribedBy}
          invalid={Boolean(errors.password)}
          getToggleAriaLabel={(visible) =>
            visible ? t('hidePassword') : t('showPassword')
          }
          className="rounded-[10px] md:rounded-[8px] md:bg-transparent"
        />
      </FormField>

      {isModal ? (
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setShowResetPassword(true)}
            className="text-left text-[14px] font-normal leading-[1.5] text-[#424242] hover:opacity-90 md:font-medium md:tracking-[0.28px] md:text-[#424242] md:hover:text-[var(--color-secondary-8)]"
          >
            {t('forgotPassword')}
          </button>
        </div>
      ) : null}

      <div className="space-y-3 pt-1">
        <Button
          type="submit"
          variant="figma"
          disabled={isLoading}
          className={isModal ? 'h-12 w-full rounded-[10px] md:rounded-[8px]' : 'h-12 w-full rounded-[8px] md:w-auto md:px-8'}
        >
          {isLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner size="sm" className="text-white" label={t('signingIn')} />
              {t('signingIn')}
            </span>
          ) : (
            t('signIn')
          )}
        </Button>
      </div>

      {!isModal ? (
        <div className="text-center pt-2">
          <div className="inline-flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setShowResetPassword(true)}
              className="text-sm font-medium text-[var(--color-secondary-7)] transition-colors hover:text-[var(--color-main)]"
            >
              {t('forgotPassword')}
            </button>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-sm font-medium text-[var(--color-secondary-7)] transition-colors hover:text-[var(--color-main)]"
            >
              {t('createAccount')}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );

  if (isModal && !isOpen) return null;

  if (isModal) {
    return (
      <>
        <Modal
          isOpen={isOpen}
          onClose={onClose ?? (() => {})}
          title={t('signIn')}
          size="md"
          mobileLayout="full"
          showBackdrop={false}
          showCloseButton={false}
          closeOnEsc={false}
          closeOnBackdrop={false}
          panelClassName="md:rounded-b-none md:border-b-0 md:px-[72px] md:pt-12 md:pb-0"
          afterPanel={
            <div className="w-full flex-shrink-0 border-0 bg-transparent px-6 pb-6 pt-5 md:border md:border-t-0 md:border-[var(--color-secondary-4)] md:bg-[var(--color-secondary-2)] md:px-[72px] md:pb-6 md:pt-5 md:rounded-b-[20px]">
              <p className="text-center text-[16px] leading-[1.4] text-[#757575] md:tracking-[0.32px]">
                {t('dontHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-semibold text-[var(--color-main)] underline decoration-[var(--color-main)] underline-offset-2 hover:opacity-90 md:no-underline"
                >
                  {t('signUp')}
                </button>
              </p>
            </div>
          }
        >
          <div className="mx-auto w-full max-w-[400px] px-0 pb-0 pt-0 md:max-w-none">
            {formBody}
            <div
              className="mt-2 h-px w-full flex-shrink-0 bg-[var(--color-secondary-4)] md:hidden"
              style={{ background: 'var(--color-secondary-4, #363639)' }}
              aria-hidden
            />
          </div>
        </Modal>

        <ResetPasswordForm
          isOpen={showResetPassword}
          onClose={() => setShowResetPassword(false)}
          initialEmail={formData.email}
        />
      </>
    );
  }

  return (
    <>
      <div className={className ?? ''}>
        <div className="w-full">{formBody}</div>
      </div>

      <ResetPasswordForm
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        initialEmail={formData.email}
      />
    </>
  );
};

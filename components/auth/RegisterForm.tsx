'use client';

import React, { useState, useEffect, useRef, useId } from 'react';

import { VerifyEmailForm } from './VerifyEmailForm';

import { useAuth } from '@/contexts/AuthContext';
import { RegisterRequest, RegisterResponse } from '@/types/auth';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Spinner } from '@/components/ui/spinner';
import { StatusBanner } from '@/components/ui/StatusBanner';
// import { FacebookLoginButton } from "./FacebookLoginButton"; // Facebook auth disabled

interface RegisterFormProps {
  variant?: 'modal' | 'embedded';
  isOpen?: boolean;
  onClose?: () => void;
  onSwitchToLogin: () => void;
  onRegistrationSuccess?: (email: string) => void;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  variant = 'modal',
  isOpen = false,
  onClose,
  onSwitchToLogin,
  onRegistrationSuccess,
  className,
}) => {
  const t = useTranslations('auth');
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const registrationEmailRef = useRef('');
  const formErrorId = useId();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.sessionStorage.getItem('registrationEmail');
    if (saved) {
      if (!registrationEmailRef.current) registrationEmailRef.current = saved;
      setRegistrationEmail((prev) => prev || saved);
    }
  }, []);

  const handleInputChange = (field: keyof RegisterRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
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
    } else if (formData.password.length < 8) {
      newErrors.password = t('passwordLength');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
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
      const result = (await register(formData)) as RegisterResponse;

      clearError();

      if (result?.requiresVerification) {
        const emailToUse = result.email || formData.email;

        setRegistrationEmail(emailToUse);
        registrationEmailRef.current = emailToUse;
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('registrationEmail', emailToUse);
        }

        if (onRegistrationSuccess) {
          onRegistrationSuccess(emailToUse);
        } else {
          setShowVerifyEmail(true);
        }
      } else if (isModal && onClose) {
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      console.error('Registration failed:', message);
    }
  };

  const handleEmailVerified = () => {
    window.location.reload();
  };

  const isModal = variant === 'modal';

  if (isModal && !isOpen) return null;

  const emailToUse =
    registrationEmail || registrationEmailRef.current || '';

  const formGlobalDescribedBy = error ? formErrorId : undefined;

  const registerFormFields = (
    <form
      onSubmit={handleSubmit}
      className={isModal ? 'mt-2 space-y-5 md:mt-8 md:space-y-6' : 'space-y-4'}
    >
      {error ? (
        <StatusBanner variant="error" id={formErrorId}>
          {error}
        </StatusBanner>
      ) : null}

      <FormField label={t('emailAddress')} htmlFor="register-email" error={errors.email} required={!isModal}>
        <Input
          id="register-email"
          type="email"
          placeholder={t('enterYourEmail')}
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={formGlobalDescribedBy}
          invalid={Boolean(errors.email)}
          className={isModal ? 'rounded-[10px] md:rounded-[8px] md:bg-transparent' : 'rounded-[8px]'}
        />
      </FormField>

      <FormField
        label={t('password')}
        htmlFor="register-password"
        error={errors.password}
        hint={!isModal ? t('passwordLength') : undefined}
        required={!isModal}
      >
        <PasswordInput
          id="register-password"
          placeholder={t('createAPassword')}
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={formGlobalDescribedBy}
          invalid={Boolean(errors.password)}
          getToggleAriaLabel={(visible) =>
            visible ? t('hidePassword') : t('showPassword')
          }
          className={isModal ? 'rounded-[10px] md:rounded-[8px] md:bg-transparent' : 'rounded-[8px]'}
        />
      </FormField>

      <FormField
        label={t('confirmPassword')}
        htmlFor="register-confirm-password"
        error={errors.confirmPassword}
        hint={isModal ? t('passwordLength') : undefined}
        required={!isModal}
      >
        <PasswordInput
          id="register-confirm-password"
          placeholder={t('confirmYourPassword')}
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={formGlobalDescribedBy}
          invalid={Boolean(errors.confirmPassword)}
          getToggleAriaLabel={(visible) =>
            visible ? t('hidePassword') : t('showPassword')
          }
          className={isModal ? 'rounded-[10px] md:rounded-[8px] md:bg-transparent' : 'rounded-[8px]'}
        />
      </FormField>

      {!isModal ? (
        <>
          <FormField label={t('firstName')} htmlFor="register-first-name">
            <Input
              id="register-first-name"
              type="text"
              placeholder={t('enterFirstName')}
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="rounded-[8px]"
            />
          </FormField>
          <FormField label={t('lastName')} htmlFor="register-last-name">
            <Input
              id="register-last-name"
              type="text"
              placeholder={t('enterLastName')}
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="rounded-[8px]"
            />
          </FormField>
          <FormField label={t('phone')} htmlFor="register-phone">
            <Input
              id="register-phone"
              type="tel"
              placeholder={t('enterPhone')}
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="rounded-[8px]"
            />
          </FormField>
        </>
      ) : null}

      <div className="space-y-3 pt-1">
        <Button
          type="submit"
          variant="figma"
          disabled={isLoading}
          className={
            isModal
              ? 'h-12 w-full rounded-[10px] md:rounded-[8px]'
              : 'h-12 w-full rounded-[8px]'
          }
        >
          {isLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Spinner size="sm" className="text-white" label={t('signingUp')} />
              {isModal ? t('signingUp') : t('signingUp')}
            </span>
          ) : isModal ? (
            t('next')
          ) : (
            t('createAccount')
          )}
        </Button>
      </div>

      {!isModal ? (
        <div className="border-t border-[var(--color-secondary-4)] pt-4 text-center">
          <p className="text-sm text-[var(--color-secondary-7)]">
            {t('alreadyHaveAccount')}{' '}
            <button
              type="button"
              onClick={() => {
                clearError();
                onSwitchToLogin();
              }}
              className="font-medium text-[var(--color-main)] hover:opacity-90"
            >
              {t('signIn')}
            </button>
          </p>
        </div>
      ) : null}
    </form>
  );

  return (
    <>
      <VerifyEmailForm
        email={emailToUse}
        isOpen={showVerifyEmail && !!emailToUse}
        onClose={() => {
          setShowVerifyEmail(false);
          setRegistrationEmail('');
          registrationEmailRef.current = '';
          if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem('registrationEmail');
          }
          if (isModal && onClose) {
            onClose();
          }
        }}
        onVerified={handleEmailVerified}
      />

      {!showVerifyEmail &&
        (isModal ? (
          <Modal
            isOpen={isOpen}
            onClose={onClose ?? (() => {})}
            title={t('signUp')}
            size="md"
            mobileLayout="full"
            showBackdrop={false}
            showCloseButton={false}
            closeOnEsc={false}
            closeOnBackdrop={false}
            panelClassName="md:rounded-b-none md:border-b-0 md:px-[72px] md:pt-12 md:pb-0"
            afterPanel={
              <div className="w-full flex-shrink-0 border-0 bg-transparent px-6 pb-6 pt-5 md:border md:border-t-0 md:border-[var(--color-secondary-4)] md:bg-[var(--color-secondary-2)] md:px-[72px] md:pb-6 md:pt-5 md:rounded-b-[20px]">
                <p className="text-center text-[16px] leading-[1.4] text-[#424242] md:text-[var(--color-secondary-8)] md:tracking-[0.32px]">
                  {t('alreadyHaveAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      clearError();
                      onSwitchToLogin();
                    }}
                    className="font-semibold text-[var(--color-main)] underline decoration-[var(--color-main)] underline-offset-2 hover:opacity-90 md:no-underline"
                  >
                    {t('signIn')}
                  </button>
                </p>
              </div>
            }
          >
            <div className="mx-auto w-full max-w-[400px] px-0 pb-0 pt-0 md:max-w-none">
              {registerFormFields}
              <div
                className="mt-2 h-px w-full flex-shrink-0 bg-[var(--color-secondary-4)] md:hidden"
                style={{ background: 'var(--color-secondary-4, #363639)' }}
                aria-hidden
              />
            </div>
          </Modal>
        ) : (
          <div className={className ?? ''}>{registerFormFields}</div>
        ))}
    </>
  );
};
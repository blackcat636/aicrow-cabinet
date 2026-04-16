'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/auth';
import { getDeviceId } from '@/lib/auth';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { ResetPasswordForm } from './ResetPasswordForm';
import { useTranslations } from 'next-intl';
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
  className
}) => {
  const t = useTranslations('auth');
  const tSso = useTranslations('sso');
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetPassword, setShowResetPassword] = useState(false);

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
        service
      };
      await login(loginCredentials);
      if (isModal && onClose) {
        onClose();
      }
    } catch (err: any) {
      // Error state is handled inside the auth context
      console.error('[LoginForm] Login error:', err);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isModal = variant === 'modal';
  if (isModal && !isOpen) return null;

  if (isModal) {
    return (
      <>
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-0 md:p-4">
          {/* Mobile: full-screen card. Desktop: centered card + sign-up block below */}
          <div className="relative flex h-full w-full max-h-[100dvh] flex-col md:h-auto md:max-h-[none] md:w-full md:max-w-[540px] md:rounded-[20px] md:border md:border-[var(--color-secondary-4)] md:bg-[var(--color-secondary-2)] md:pt-12 md:pb-6 md:px-[72px] md:rounded-b-none">
            <div className="flex flex-1 flex-col overflow-y-auto md:flex-initial md:overflow-visible">
              {/* Header: "Log In" centered */}
              <div className="flex flex-shrink-0 items-center justify-center px-6 pt-[64px] pb-4 md:pt-0 md:contents">
                <h2 className="text-[26px] leading-[1.3] font-bold text-white md:text-center md:text-[32px] md:leading-[1.4] md:tracking-[0.64px] md:font-semibold">
                  {t('signIn')}
                </h2>
              </div>

              <div className="">
              <form onSubmit={handleSubmit} className="mt-2 space-y-5 mx-auto w-full max-w-[400px] px-6 pb-6 md:px-0 md:pb-0 md:mt-8 md:space-y-6">
                {redirectUri && (
                  <div className="rounded-[8px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-1)] px-4 py-3 text-[14px] text-[var(--color-secondary-8)]">
                    {tSso('continueToExternalService', { service: service ? `: ${service}` : '' })}
                  </div>
                )}

                {error && (
                  <div className="rounded-[8px] border border-[#C42B2B] bg-[#C42B2B]/10 px-4 py-3 text-[14px] text-[#ff8d8d]">
                    {localizeAuthError(error)}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[15px] leading-[1.4] font-normal text-white md:font-medium md:text-[16px] md:tracking-[0.32px] md:text-[var(--color-secondary-8)]">
                    {t('emailAddress')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={t('enterYourEmail')}
                    className={`h-12 w-full rounded-[10px] border px-4 text-[16px] leading-[1.4] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#888888] md:rounded-[8px] md:bg-transparent md:placeholder:text-[var(--color-secondary-6)] md:text-[var(--color-secondary-10)] ${
                      errors.email ? 'border-[#C42B2B] bg-[#2C2C2C]' : 'border-[#666666] bg-[#2C2C2C] md:border-[var(--color-secondary-4)] md:bg-transparent'
                    }`}
                  />
                  {errors.email && <p className="text-[12px] text-[#ff8d8d]">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block text-[15px] leading-[1.4] font-normal text-white md:font-medium md:text-[16px] md:tracking-[0.32px] md:text-[var(--color-secondary-8)]">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder={t('enterYourPassword')}
                      className={`h-12 w-full rounded-[10px] border px-4 pr-11 text-[16px] leading-[1.4] text-white placeholder:text-[#888888] focus:outline-none focus:border-[#888888] md:rounded-[8px] md:bg-transparent md:placeholder:text-[var(--color-secondary-6)] md:text-[var(--color-secondary-10)] ${
                        errors.password ? 'border-[#C42B2B] bg-[#2C2C2C]' : 'border-[#666666] bg-[#2C2C2C] md:border-[var(--color-secondary-4)] md:bg-transparent'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white md:text-[var(--color-secondary-6)] md:hover:text-[var(--color-secondary-10)]"
                      aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                    >
                      {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[12px] text-[#ff8d8d]">{errors.password}</p>}
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="text-[14px] leading-[1.5] font-normal text-[#424242] hover:opacity-90 md:font-medium md:tracking-[0.28px] md:text-[#424242] md:hover:text-[var(--color-secondary-8)]"
                    >
                      {t('forgotPassword')}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-[10px] bg-[var(--color-main)] text-[16px] leading-[1.4] font-semibold text-white hover:opacity-95 disabled:opacity-60 md:rounded-[8px]"
                  >
                    {isLoading ? t('signingIn') : t('signIn')}
                  </button>
                  {/* Facebook auth disabled
                  <FacebookLoginButton className="h-12 w-full rounded-[10px] text-[16px] font-semibold justify-center bg-[#3B5998] hover:bg-[#334d82] md:rounded-[8px]" />
                  */}
                </div>
              </form>
              </div>

            {/* Mobile only: horizontal line below Facebook button */}
            <div className="mt-2 h-px w-full flex-shrink-0 bg-[var(--color-secondary-4)] md:hidden" style={{ background: 'var(--color-secondary-4, #363639)' }} aria-hidden />
            </div>
          </div>

          {/* Sign-up block: outside form card, in main block — line full width, text centered */}
          <div className="w-full flex-shrink-0 pt-5 px-6 pb-6 md:pt-5 md:pb-6 md:px-[72px] md:max-w-[540px] md:border md:border-[var(--color-secondary-4)] md:rounded-b-[20px] md:bg-[var(--color-secondary-2)]">
            <p className="text-center text-[16px] leading-[1.4] text-[#757575] md:text-[#757575] md:tracking-[0.32px]">
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
        </div>

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
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* SSO notice */}
          {redirectUri && (
            <div className="p-3 bg-purple-900/20 border border-purple-500/40 rounded-lg text-sm text-purple-100">
              {tSso('continueToExternalService', { service: service ? `: ${service}` : '' })}
            </div>
          )}
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-sm text-red-400">{localizeAuthError(error)}</p>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('emailAddress')} *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('enterYourEmail')}
              className={`w-full p-3 pr-10 bg-white/10 text-white placeholder-gray-300 border ${isModal ? 'rounded-full' : 'rounded-lg'} border-white/20 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.email ? 'border-red-500' : 'border-white/30'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('password')} *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={t('enterYourPassword')}
                className={`w-full p-3 pr-10 bg-white/10 text-white placeholder-gray-300 border ${isModal ? 'rounded-full' : 'rounded-lg'} border-white/20 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.password ? 'border-red-500' : 'border-white/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Actions - Sign In button */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={isLoading}
              className={`${isModal ? 'w-full' : 'w-auto'} inline-flex items-center justify-center px-8 py-2.5 bg-purple-600 text-white ${isModal ? 'rounded-full' : 'rounded-lg'} hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-purple-500/25`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('signingIn')}
                </div>
              ) : (
                t('signIn')
              )}
            </button>
          </div>

          {/* Facebook auth disabled
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {t('or')}
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>
          <FacebookLoginButton />
          */}

          {/* Forgot Password + Create account (embedded) */}
          <div className="text-center">
            <div className="inline-flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="text-sm text-gray-400 hover:text-purple-400 font-medium transition-colors"
              >
                {t('forgotPassword')}
              </button>
              {!isModal && (
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-sm text-gray-400 hover:text-purple-400 font-medium transition-colors"
                >
                  {t('createAccount')}
                </button>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>

    {/* Reset Password Form */}
    <ResetPasswordForm
      isOpen={showResetPassword}
      onClose={() => setShowResetPassword(false)}
      initialEmail={formData.email}
    />
    </>
  );
};

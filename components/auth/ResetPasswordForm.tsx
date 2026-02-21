'use client';

import React, { useState } from 'react';
import { authApi } from '@/lib/apiAuth';
import { XIcon, EyeIcon, EyeOffIcon, ChevronLeftIcon } from '@/components/icons';
import { useTranslations } from 'next-intl';

interface ResetPasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type Step = 'email' | 'code' | 'password';

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  isOpen,
  onClose,
  initialEmail = ''
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    } catch (err: any) {
      setError(err.message || t('failedToSendResetCode'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCode()) return;

    // Code is validated, move to password step
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
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('failedToResetPassword'));
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
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 md:bg-black/60">
      {/* Mobile: full-screen, no card. Desktop: centered modal card */}
      <div className="relative flex h-full w-full max-h-[100dvh] flex-col bg-[#1A1A1A] md:h-auto md:max-h-[none] md:w-full md:max-w-md md:rounded-[12px] md:border md:border-[var(--color-secondary-4)] md:bg-[#282828] md:shadow-xl overflow-hidden">
        {/* Mobile: purple gradient blob at bottom (Figma) */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[299px] h-[299px] rounded-[299px] bg-[#8D2EE2] blur-[139px] pointer-events-none md:hidden"
          aria-hidden
        />
        {/* Title row: mobile step 1 – title left + close right; mobile step 2/3 – back | title (centered) | close; desktop – title centered, close absolute */}
        <div
          className={`relative flex flex-shrink-0 items-center px-6 pt-[64px] pb-4 md:justify-center md:pt-8 md:pb-2 ${
            step === 'email' ? 'justify-between' : 'grid grid-cols-[auto_1fr_auto] gap-2 md:grid-cols-1'
          }`}
        >
          {/* Left: back button (step 2/3) or zero-width placeholder (step 1 so grid aligns) */}
          {step === 'code' || step === 'password' ? (
            <button
              type="button"
              onClick={() => setStep(step === 'code' ? 'email' : 'code')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#757575] text-[#757575] hover:bg-white/10 hover:text-white hover:border-white transition-colors md:absolute md:left-4 md:top-4"
              aria-label={t('back')}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-0 overflow-hidden md:hidden" aria-hidden />
          )}
          {/* Center: title — step 2 mobile = two lines centered (Figma); else single line */}
          <h2
            className={`text-[26px] leading-[1.3] font-bold text-white md:text-[22px] md:font-semibold md:leading-tight ${
              step === 'code' ? 'text-center md:text-center' : step === 'password' ? 'text-center md:text-center' : 'md:text-center'
            }`}
          >
            {step === 'email' && t('resetPassword')}
            {step === 'code' && (
              <>
                <span className="block md:hidden">{t('verificationCodeTitleLine1')}</span>
                <span className="block md:hidden">{t('verificationCodeTitleLine2')}</span>
                <span className="hidden md:inline">{t('verificationCode')}</span>
              </>
            )}
            {step === 'password' && t('newPassword')}
          </h2>
          {/* Right: close */}
          <button
            type="button"
            onClick={handleClose}
            className="flex shrink-0 items-center justify-center p-0 text-[#757575] hover:text-white transition-colors md:absolute md:right-4 md:top-4"
            aria-label="Close"
          >
            <XIcon className="w-8 h-8 shrink-0" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0 md:flex-initial md:overflow-visible md:p-6 md:pt-4">
          {error && (
            <div className="mb-4 rounded-[8px] border border-[#C42B2B] bg-[#C42B2B]/10 px-4 py-3 text-[14px] text-[#ff8d8d]">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-[8px] border border-green-600 bg-green-600/10 px-4 py-3 text-[14px] text-green-400">
              {t('passwordResetSuccess')}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[15px] leading-[1.4] font-normal text-[var(--color-secondary-7)]">
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('enterYourEmail')}
                  className={`h-12 w-full rounded-[8px] border px-4 text-[16px] leading-[1.4] text-white placeholder:text-[var(--color-secondary-6)] focus:outline-none focus:border-[var(--color-secondary-5)] bg-[#1E1E1E] ${
                    errors.email ? 'border-[#C42B2B]' : 'border-[var(--color-secondary-5)]'
                  }`}
                />
                {errors.email && (
                  <p className="text-[12px] text-[#ff8d8d]">{errors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-[8px] bg-[var(--color-main)] text-[17px] font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? t('sendingCode') : t('sendResetCode')}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-5">
              {/* Figma: "Verification code has been sent" then email in bright white */}
              <p className="text-[15px] leading-[1.5] text-[var(--color-secondary-7)]">
                {t('verificationCodeSentTo')}{' '}
                <span className="font-medium text-white">{email}</span>
              </p>

              <div className="space-y-2">
                <label className="block text-[15px] leading-[1.4] font-normal text-white">
                  {t('verificationCode')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('enterVerificationCode')}
                  className={`h-12 w-full rounded-[8px] border px-4 text-[16px] leading-[1.4] text-white placeholder:text-[var(--color-secondary-6)] bg-[#1E1E1E] focus:outline-none focus:border-[var(--color-secondary-5)] ${
                    errors.code ? 'border-[#C42B2B]' : 'border-[var(--color-secondary-5)]'
                  }`}
                />
                {errors.code && (
                  <p className="text-[12px] text-[#ff8d8d]">{errors.code}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-[8px] bg-[var(--color-main)] text-[17px] font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {t('continue')}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[15px] leading-[1.4] font-normal text-white">
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('enterNewPassword')}
                    className={`h-12 w-full rounded-[8px] border px-4 pr-11 text-[16px] leading-[1.4] text-white placeholder:text-[var(--color-secondary-6)] bg-[#1E1E1E] focus:outline-none focus:border-[var(--color-secondary-5)] ${
                      errors.newPassword ? 'border-[#C42B2B]' : 'border-[var(--color-secondary-5)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-secondary-6)] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-[12px] text-[#ff8d8d]">{errors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirmNewPasswordPlaceholder')}
                    className={`h-12 w-full rounded-[8px] border px-4 pr-11 text-[16px] leading-[1.4] text-white placeholder:text-[var(--color-secondary-6)] bg-[#1E1E1E] focus:outline-none focus:border-[var(--color-secondary-5)] ${
                      errors.confirmPassword ? 'border-[#C42B2B]' : 'border-[var(--color-secondary-5)]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-secondary-6)] hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[12px] text-[#ff8d8d]">{errors.confirmPassword}</p>
                )}
                <p className="text-[14px] leading-[1.5] text-[var(--color-secondary-6)]">
                  {t('passwordLength')}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-[8px] bg-[var(--color-main)] text-[17px] font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? t('resettingPassword') : t('resetPassword')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


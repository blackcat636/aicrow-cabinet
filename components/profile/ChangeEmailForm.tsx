'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, XIcon } from '@/components/icons';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
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
  onSuccess
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
      // Step 1: Send request to /auth/change-email with newEmail
      // API will send verification code to current (old) email
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newEmail }),
        cache: 'no-cache'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      toast.success(t('codeSentSuccess', { email: currentEmail }));
      setStep('code'); // Move to code step
    } catch (err: any) {
      setError(err.message || t('failedToSendCode'));
      toast.error(err.message || t('failedToSendCode'));
    } finally {
      setSendingCode(false);
    }
  };

  const validateEmail = (email: string): boolean => {
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
      // Step 2: Confirm email change with old email and code
      // API will change email to the newEmail that was sent in step 1
      const response = await fetch('/api/auth/confirm-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: currentEmail, code }),
        cache: 'no-cache'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm email change');
      }

      toast.success(t('emailChangedSuccess'));
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || t('failedToConfirm'));
      toast.error(err.message || t('failedToConfirm'));
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
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  // Open confirm dialog on Esc
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

  if (!isOpen) return null;

  return (
    <>
    <div
      className="fixed inset-x-0 top-[71px] bottom-0 md:inset-0 bg-[var(--color-secondary-1)] md:bg-black md:bg-opacity-80 md:flex md:items-center md:justify-center md:p-4 z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && window.innerWidth >= 768) {
          setConfirmOpen(true);
        }
      }}
    >
      <div className="bg-[var(--color-secondary-1)] md:bg-gray-900 md:rounded-xl md:max-w-md w-full md:border md:border-gray-700 md:shadow-2xl min-h-full md:min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 md:p-6 border-b border-[var(--color-secondary-4)] md:border-gray-700">
          <button
            onClick={handleClose}
            className="md:hidden h-8 w-8 rounded-full border border-[var(--color-secondary-5)] flex items-center justify-center text-[var(--color-secondary-10)]"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <h2 className="text-[14px] uppercase md:normal-case md:text-xl font-semibold text-white flex-1">
            {step === 'email' ? t('enterNewEmail') : t('enterVerificationCode')}
          </h2>
          <button
            onClick={handleClose}
            className="hidden md:flex p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {sendingCode ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-300">{t('sendingCodeMessage')}</p>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('currentEmail')}
                </label>
                <input
                  type="email"
                  value={currentEmail}
                  disabled
                  className="w-full p-3 bg-gray-800 text-gray-400 border border-gray-600 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('newEmailRequired')}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  placeholder={t('enterNewEmailPlaceholder')}
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="mt-4 flex flex-col md:flex-row gap-4 md:gap-3 md:pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="order-2 md:order-1 w-full md:flex-1 h-[48px] px-4 rounded-[10px] border border-[var(--color-main)] md:border-none bg-transparent md:bg-gray-700 text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-main)] md:text-gray-300 hover:bg-transparent md:hover:bg-gray-600 transition-colors"
                >
                  {tProfile('discard')}
                </button>
                <button
                  type="submit"
                  disabled={sendingCode}
                  className="order-1 md:order-2 w-full md:flex-1 h-[48px] px-4 rounded-[10px] bg-[var(--color-main)] md:bg-purple-600 hover:bg-[var(--color-main)] md:hover:bg-purple-700 text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingCode ? t('sendingCode') : t('sendCode')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              {/* Success message about code being sent */}
              <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
                <p className="text-sm text-green-400">
                  {t('codeSentSuccessMessage', { email: currentEmail })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('newEmail')}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  disabled
                  className="w-full p-3 bg-gray-800 text-gray-400 border border-gray-600 rounded-lg cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('verificationCodeRequired')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (errors.code) {
                      setErrors({ ...errors, code: '' });
                    }
                  }}
                  placeholder={t('enterVerificationCodePlaceholder')}
                  maxLength={6}
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase ${
                    errors.code ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-400">{errors.code}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {t('codeSentToCurrentEmail', { email: currentEmail })}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="mt-4 flex flex-col md:flex-row gap-4 md:gap-3 md:pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="order-2 md:order-1 w-full md:flex-1 h-[48px] px-4 rounded-[10px] border border-[var(--color-main)] md:border-none bg-transparent md:bg-gray-700 text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-main)] md:text-gray-300 hover:bg-transparent md:hover:bg-gray-600 transition-colors"
                >
                  {tProfile('discard')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="order-1 md:order-2 w-full md:flex-1 h-[48px] px-4 rounded-[10px] bg-[var(--color-main)] md:bg-purple-600 hover:bg-[var(--color-main)] md:hover:bg-purple-700 text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('confirming') : t('confirmChange')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
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


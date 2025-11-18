'use client';

import React, { useState } from 'react';
import { authApi } from '@/lib/apiAuth';
import { XIcon, EyeIcon, EyeOffIcon } from '@/components/icons';
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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {step === 'email' && t('forgotPasswordTitle')}
            {step === 'code' && t('enterVerificationCodeTitle')}
            {step === 'password' && t('setNewPasswordTitle')}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-full hover:bg-red-900/20"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded bg-purple-600"></div>
            <div className={`flex-1 h-1 rounded ${step === 'code' || step === 'password' ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
            <div className={`flex-1 h-1 rounded ${step === 'password' ? 'bg-purple-600' : 'bg-gray-700'}`}></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-purple-400">{t('enterEmail')}</span>
            <span className={`text-xs ${step === 'code' || step === 'password' ? 'text-purple-400' : 'text-gray-500'}`}>{t('enterCode')}</span>
            <span className={`text-xs ${step === 'password' ? 'text-purple-400' : 'text-gray-500'}`}>{t('newPassword')}</span>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-600 rounded-lg">
              <p className="text-sm text-green-400">{t('passwordResetSuccess')}</p>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('emailAddress')} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('enterYourEmail')}
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-purple-500/25"
              >
                {isLoading ? t('sendingCode') : t('sendResetCode')}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600 rounded-lg">
                <p className="text-sm text-blue-400">
                  {t('verificationCodeSentTo')} <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('verificationCode')} *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('enterVerificationCode')}
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-400">{errors.code}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full py-2 text-sm text-gray-400 hover:text-purple-400 font-medium transition-colors"
              >
                {t('back')}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-purple-500/25"
              >
                {t('continue')}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('newPassword')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('enterNewPassword')}
                    className={`w-full p-3 pr-10 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('confirmNewPassword')} *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('confirmNewPasswordPlaceholder')}
                    className={`w-full p-3 pr-10 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('code')}
                className="w-full py-2 text-sm text-gray-400 hover:text-purple-400 font-medium transition-colors"
              >
                {t('back')}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-purple-500/25"
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


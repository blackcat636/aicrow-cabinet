'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginRequest } from '@/types/auth';
import { getDeviceId } from '@/lib/auth';
import { XIcon, EyeIcon, EyeOffIcon } from '@/components/icons';
import { ResetPasswordForm } from './ResetPasswordForm';
import { useTranslations } from 'next-intl';
import { FacebookLoginButton } from './FacebookLoginButton';

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
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetPassword, setShowResetPassword] = useState(false);

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
    
    const logPrefix = '[LoginForm]';
    console.log(`${logPrefix} Form submitted:`, {
      hasEmail: !!formData.email,
      email: formData.email ? `${formData.email.substring(0, 3)}***` : 'none',
      hasPassword: !!formData.password,
      hasRedirectUri: !!redirectUri,
      redirectUri: redirectUri,
      service: service,
      isSSOFlow: !!(redirectUri || service)
    });
    
    if (!validateForm()) {
      console.warn(`${logPrefix} Form validation failed`);
      return;
    }

    try {
      clearError();
      console.log(`${logPrefix} Calling login function...`);
      await login({
        ...(formData as LoginRequest),
        redirectUri,
        service
      });
      console.log(`${logPrefix} Login successful`);
      if (isModal && onClose) {
        onClose();
      }
    } catch (err: any) {
      console.error(`${logPrefix} Login error:`, err);
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

  return (
    <>
    <div className={isModal ? "fixed inset-0 flex items-center justify-center p-4 z-50" : ""}>
      <div className={(isModal ? "bg-transparent rounded-2xl max-w-md w-full border border-white/10 shadow-2xl shadow-purple-500/20" : "") + (className ? ` ${className}` : '')}>
        {/* Header */}
        {isModal && (
          <div className="p-6 border-b border-white/10">
            <h2 className="text-2xl font-bold text-white">{t('accountTitle')}</h2>
            <p className="text-sm text-gray-300 mt-1">{t('welcomeMessage')}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={isModal ? "p-6 space-y-4" : "space-y-4"}>
          {/* SSO notice */}
          {redirectUri && (
            <div className="p-3 bg-purple-900/20 border border-purple-500/40 rounded-lg text-sm text-purple-100">
              Ви входите, щоб продовжити в зовнішній сервіс{service ? `: ${service}` : ''}.
            </div>
          )}
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
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

          {/* Social login separator */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              {t('or')}
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Facebook Login */}
          <FacebookLoginButton />

          {/* Actions */}
          <div className="pt-4 flex justify-center">
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

          {/* Switch to Register (only in modal to avoid duplicates in embedded) */}
          {isModal && (
            <div className="text-center pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-300">
                {t('dontHaveAccount')}{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  {t('signUp')}
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>

    {/* Reset Password Form */}
    {isModal && (
      <ResetPasswordForm
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        initialEmail={formData.email}
      />
    )}
    </>
  );
};

'use client';

import React, { useState, useLayoutEffect } from 'react';
import { ChevronLeftIcon, XIcon, EyeIcon, EyeOffIcon } from '@/components/icons';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTranslations } from 'next-intl';

interface ChangePasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'password';

// Step is always 'password' - we skip email input step

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const t = useTranslations('profile.changePasswordForm');
  const tProfile = useTranslations('profile');
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestInProgress, setRequestInProgress] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const toastIdRef = React.useRef<string | number | null>(null);
  const requestIdRef = React.useRef<number>(0);
  const isRequestingRef = React.useRef<boolean>(false); // Synchronous flag to prevent race condition
  const errorToastShownRef = React.useRef<boolean>(false); // Synchronous flag to prevent duplicate error toasts
  const successToastShownRef = React.useRef<boolean>(false); // Synchronous flag to prevent duplicate success toasts
  const mountIdRef = React.useRef<string>(`mount-${Date.now()}-${Math.random()}`); // Unique ID for this mount
  const lastIsOpenRef = React.useRef<boolean>(false); // Track last isOpen state
  const formOpenTimestampRef = React.useRef<number | null>(null); // Track when form was opened

  // Automatically send code when form opens
  React.useEffect(() => {
    // Cleanup function to cancel ongoing request
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setRequestInProgress(false);
    };
  }, []);

  // Separate effect to trigger request only once when form opens
  // Using useLayoutEffect for synchronous execution to prevent race conditions
  // This code is idempotent - works correctly even with React StrictMode double mounting
  useLayoutEffect(() => {
    if (!isOpen || !user?.email) {
      lastIsOpenRef.current = false;
      formOpenTimestampRef.current = null;
      if (typeof window !== 'undefined') {
        (window as any).__changePasswordOpenTimestamp = null;
      }
      return;
    }
    
    const currentTimestamp = Date.now();
    const windowStore = typeof window !== 'undefined' ? (window as any) : null;
    
    // CRITICAL: Check if request is already in progress globally (across all component instances)
    // This prevents duplicate requests even when React StrictMode causes double mounting
    if (windowStore?.__changePasswordRequestInProgress || windowStore?.__changePasswordAbortController) {
      // Update local refs to match global state
      lastIsOpenRef.current = true;
      formOpenTimestampRef.current = windowStore?.__changePasswordOpenTimestamp;
      return;
    }
    
    // Check if this is a new form opening (different timestamp)
    const globalTimestamp = windowStore?.__changePasswordOpenTimestamp;
    if (globalTimestamp && globalTimestamp === formOpenTimestampRef.current) {
      // Same opening - already handled
      return;
    }
    
    // CRITICAL ATOMIC OPERATION: Claim the global lock
    // Set global flags FIRST - this prevents other component instances from proceeding
    if (windowStore) {
      windowStore.__changePasswordRequestInProgress = true;
      windowStore.__changePasswordOpenTimestamp = currentTimestamp;
      const globalAbortController = new AbortController();
      windowStore.__changePasswordAbortController = globalAbortController;
      
      // Also set local refs
      lastIsOpenRef.current = true;
      formOpenTimestampRef.current = currentTimestamp;
      isRequestingRef.current = true;
      abortControllerRef.current = globalAbortController;
    } else {
      // Fallback for SSR or when window is not available
      lastIsOpenRef.current = true;
      formOpenTimestampRef.current = currentTimestamp;
      isRequestingRef.current = true;
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
    }
    
    // Trigger the request
    const mountId = mountIdRef.current;
    
    // Set up request
    errorToastShownRef.current = false;
    successToastShownRef.current = false;
    
    const requestId = ++requestIdRef.current;
    setRequestInProgress(true);
    setEmail(user.email);
    setCode('');
    setSendingCode(true);
    setError(null);
    setErrors({});
    
    const currentToastId = toastIdRef.current;
    const currentRequestId = requestId;
    
    // Use the global abort controller if available, otherwise use local
    const controllerToUse = typeof window !== 'undefined' && (window as any).__changePasswordAbortController
      ? (window as any).__changePasswordAbortController
      : abortControllerRef.current;
    
    fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: user.email }),
      cache: 'no-cache',
      signal: controllerToUse?.signal
    })
      .then(async (response) => {
        if (controllerToUse?.signal.aborted) {
          return;
        }
        
        const data = await response.json();
        if (!response.ok) {
          const errorMsg = data.error || data.message || 'Failed to send verification code';
          throw new Error(errorMsg);
        }
        
        // Check if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          setStep('password');
          return;
        }
        
        // CRITICAL: Check if success toast already shown - show only once
        // This prevents duplicate toasts even if two requests complete simultaneously
        if (successToastShownRef.current) {
          // Toast already shown by another request - skip
          setStep('password');
          return;
        }
        
        // Mark toast as shown FIRST, then show it
        // This prevents second request from showing duplicate toast
        successToastShownRef.current = true;
        
        toast.success(t('codeSentSuccess', { email: user.email }));
        setStep('password');
      })
      .catch((err: any) => {
        if (err.name === 'AbortError') {
          return;
        }
        
        // Check if this is still the latest request
        if (currentRequestId !== requestIdRef.current) {
          setError(err.message || 'Failed to send verification code');
          setStep('password');
          return;
        }
        
        // Check if error toast already shown
        if (errorToastShownRef.current) {
          setError(err.message || 'Failed to send verification code');
          setStep('password');
          return;
        }
        
        errorToastShownRef.current = true;
        const errorMessage = err.message || 'Failed to send verification code';
        setError(errorMessage);
        
        // Reset success flag if error occurred (so user can retry)
        successToastShownRef.current = false;
        
        toast.error(errorMessage);
        setStep('password');
      })
      .finally(() => {
        if (currentRequestId === requestIdRef.current) {
          abortControllerRef.current = null;
          isRequestingRef.current = false;
          setRequestInProgress(false);
          setSendingCode(false);
          errorToastShownRef.current = false;
          successToastShownRef.current = false;
        }
      });
      
    return () => {
      // Only cleanup if form is closing
      if (!isOpen || !user?.email) {
        const controller = typeof window !== 'undefined' && (window as any).__changePasswordAbortController
          ? (window as any).__changePasswordAbortController
          : abortControllerRef.current;
        if (controller) {
          controller.abort();
        }
      }
    };
  }, [isOpen, user?.email]);

  // Reset when form closes and clear code field when opens
  React.useEffect(() => {
    if (!isOpen) {
      // Clear global state when form closes
      if (typeof window !== 'undefined') {
        if ((window as any).__changePasswordAbortController) {
          (window as any).__changePasswordAbortController.abort();
          (window as any).__changePasswordAbortController = null;
        }
        (window as any).__changePasswordRequestInProgress = false;
        (window as any).__changePasswordOpenTimestamp = null;
      }
      
      // Clear local state
      setRequestInProgress(false);
      isRequestingRef.current = false;
      toastIdRef.current = null;
      errorToastShownRef.current = false;
      successToastShownRef.current = false;
      formOpenTimestampRef.current = null;
      setCode(''); // Clear code field
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    } else {
      // Clear code field when form opens to prevent autofill
      setCode('');
      errorToastShownRef.current = false; // Reset error toast flag when opening form
      successToastShownRef.current = false; // Reset success toast flag when opening form
    }
  }, [isOpen]);

  const validateCode = (): boolean => {
    if (!code.trim()) {
      setErrors({ code: t('verificationCodeRequiredError') });
      return false;
    }
    return true;
  };

  const validatePasswords = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = t('passwordRequired');
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t('passwordMinLength');
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('passwordsDoNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCode() || !validatePasswords()) return;

    setIsLoading(true);
    setError(null);
    setErrors({});

    try {
      // Step 2: Reset password with email, code, and new password
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code, newPassword }),
        cache: 'no-cache'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      toast.success(t('passwordChangedSuccess'));
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || t('failedToReset'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('password');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setErrors({});
    setSendingCode(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      resetForm();
    }, 300);
  };

  // Open confirm dialog on Esc
  React.useEffect(() => {
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
            {t('enterNewPassword')}
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
              <p className="text-gray-300">{t('sendingCode')}</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Success message about code being sent - only show if no error */}
              {!error && email && (
                <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
                  <p className="text-sm text-green-400">
                    {t('codeSentSuccessMessage', { email })}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('verificationCodeRequired')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (errors.code) {
                      setErrors({ ...errors, code: '' });
                    }
                  }}
                  placeholder={t('enterVerificationCodePlaceholder')}
                  maxLength={6}
                  autoComplete="off"
                  autoFocus={false}
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  name="verification-code"
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-400">{errors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('newPasswordRequired')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) {
                        setErrors({ ...errors, newPassword: '' });
                      }
                    }}
                    placeholder={t('enterNewPasswordPlaceholder')}
                    className={`w-full p-3 pr-10 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.newPassword ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.newPassword}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {t('passwordMinLength')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('confirmNewPasswordRequired')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: '' });
                      }
                    }}
                    placeholder={t('confirmNewPasswordPlaceholder')}
                    className={`w-full p-3 pr-10 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
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
                  disabled={isLoading}
                  className="order-1 md:order-2 w-full md:flex-1 h-[48px] px-4 rounded-[10px] bg-[var(--color-main)] md:bg-purple-600 hover:bg-[var(--color-main)] md:hover:bg-purple-700 text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('changing') : t('changePassword')}
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


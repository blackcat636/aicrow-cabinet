'use client';

import React, { useState, useLayoutEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormActions } from '@/components/ui/FormActions';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Spinner } from '@/components/ui/spinner';
import { StatusBanner } from '@/components/ui/StatusBanner';
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
  const tAuth = useTranslations('auth');
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('password');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
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
    window.setTimeout(() => {
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
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={t('enterNewPassword')}
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
                label={t('sendingCode')}
              />
              <p className="text-[var(--color-secondary-7)]">{t('sendingCode')}</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {!error && email ? (
                <StatusBanner variant="success" className="mb-4 text-sm">
                  {t('codeSentSuccessMessage', { email })}
                </StatusBanner>
              ) : null}

              <FormField
                label={t('verificationCodeRequired')}
                htmlFor="change-password-code"
                error={errors.code}
              >
                <Input
                  id="change-password-code"
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
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  name="verification-code"
                  aria-invalid={Boolean(errors.code)}
                  invalid={Boolean(errors.code)}
                />
              </FormField>

              <FormField
                label={t('newPasswordRequired')}
                htmlFor="change-password-new"
                error={errors.newPassword}
                hint={t('passwordMinLength')}
              >
                <PasswordInput
                  id="change-password-new"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) {
                      setErrors({ ...errors, newPassword: '' });
                    }
                  }}
                  placeholder={t('enterNewPasswordPlaceholder')}
                  aria-invalid={Boolean(errors.newPassword)}
                  invalid={Boolean(errors.newPassword)}
                  getToggleAriaLabel={(visible) =>
                    visible ? tAuth('hidePassword') : tAuth('showPassword')
                  }
                />
              </FormField>

              <FormField
                label={t('confirmNewPasswordRequired')}
                htmlFor="change-password-confirm"
                error={errors.confirmPassword}
              >
                <PasswordInput
                  id="change-password-confirm"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  placeholder={t('confirmNewPasswordPlaceholder')}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  invalid={Boolean(errors.confirmPassword)}
                  getToggleAriaLabel={(visible) =>
                    visible ? tAuth('hidePassword') : tAuth('showPassword')
                  }
                />
              </FormField>

              {error ? (
                <StatusBanner variant="error" className="text-sm">
                  {error}
                </StatusBanner>
              ) : null}

              <FormActions
                primary={{
                  label: isLoading ? t('changing') : t('changePassword'),
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


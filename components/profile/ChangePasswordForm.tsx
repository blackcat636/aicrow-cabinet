'use client';

import React, { useState, useLayoutEffect } from 'react';
import { XIcon, EyeIcon, EyeOffIcon } from '@/components/icons';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

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
        
        toast.success(`Verification code has been sent to ${user.email}`);
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
      setErrors({ code: 'Verification code is required' });
      return false;
    }
    return true;
  };

  const validatePasswords = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

      toast.success('Password changed successfully');
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
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
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setConfirmOpen(true);
        }
      }}
    >
      <div className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Enter New Password
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {sendingCode ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-300">Sending verification code...</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Success message about code being sent - only show if no error */}
              {!error && email && (
                <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
                  <p className="text-sm text-green-400">
                    ✓ Verification code has been sent to {email}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code *
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
                  placeholder="Enter verification code"
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
                  New Password *
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
                    placeholder="Enter new password"
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
                  Password must be at least 6 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password *
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
                    placeholder="Confirm new password"
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
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
      title="Discard changes?"
      message="Are you sure you want to cancel and discard the changes?"
      confirmText="Discard"
      cancelText="Keep editing"
      type="warning"
    />
    </>
  );
};


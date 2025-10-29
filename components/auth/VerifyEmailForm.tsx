'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from '@/components/icons';
import { toast } from 'sonner';

interface VerifyEmailFormProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerified: () => void;
  showInitialToast?: boolean;
}

export const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({
  isOpen,
  onClose,
  email,
  onVerified,
  showInitialToast = true
}) => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendTimer, setResendTimer] = useState(60); // Start with 60 seconds
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const toastShownRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setErrors({ code: 'Verification code is required' });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      // Update auth context with user data
      if (data.user && data.accessToken) {
        // Show success toast
        toast.success('Email verified successfully!', {
          description: 'You are now signed in',
          duration: 5000,
        });
        
        // Close this form and let the parent handle the success
        onVerified();
      } else {
        setError('Verification successful but could not log in');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Timer for resend code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Initialize timer when form opens and show success toast (if enabled)
  useEffect(() => {
    if (isOpen && showInitialToast && !toastShownRef.current) {
      // Show success toast when form opens
      toast.success('Verification code has been sent to your email', {
        description: `Please check ${email} for the verification code`,
        duration: 5000,
      });
      toastShownRef.current = true;
    }
    
    // Reset toast flag when form closes
    if (!isOpen) {
      toastShownRef.current = false;
    }
  }, [isOpen, email, showInitialToast]);

  const handleResendCode = async () => {
    setIsResending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend verification code');
      } else {
        setSuccessMessage('Verification code has been resent to your email');
        setResendTimer(60); // Set 60 second cooldown
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setCode('');
      setError(null);
      setErrors({});
      setSuccessMessage(null);
      setResendTimer(60); // Reset to 60 for next time
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Verify Email</h2>
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
            <div className="flex-1 h-1 rounded bg-gray-700"></div>
            <div className="flex-1 h-1 rounded bg-purple-600"></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500">Create Account</span>
            <span className="text-xs text-purple-400">Verify Email</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info Message */}
          <div className="p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
            <p className="text-sm text-blue-400 mb-2">
              We've sent a verification code to:
            </p>
            <p className="text-sm font-semibold text-blue-300">{email}</p>
            <p className="text-xs text-gray-400 mt-2">
              Please check your email and enter the verification code below.
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-900/20 border border-green-600 rounded-lg">
              <p className="text-sm text-green-400">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    setErrors(prev => ({ ...prev, code: '' }));
                  }
                }}
                placeholder="Enter verification code"
                className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.code ? 'border-red-500' : 'border-gray-600'
                }`}
                maxLength={6}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-400">{errors.code}</p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg shadow-purple-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
            </div>

            {/* Resend Code */}
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending || resendTimer > 0}
                className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  'Sending...'
                ) : resendTimer > 0 ? (
                  `Resend code in ${resendTimer}s`
                ) : (
                  'Resend verification code'
                )}
              </button>
              <div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm text-gray-400 hover:text-purple-400 font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


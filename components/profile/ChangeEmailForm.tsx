'use client';

import React, { useState, useEffect } from 'react';
import { XIcon } from '@/components/icons';
import { toast } from 'sonner';

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
  const [step, setStep] = useState<Step>('email');
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(newEmail)) return;

    if (newEmail === currentEmail) {
      setError('New email must be different from current email');
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

      toast.success(`Код для зміни пошти був відправлений на ${currentEmail}`);
      setStep('code'); // Move to code step
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      toast.error(err.message || 'Не вдалося відправити код підтвердження');
    } finally {
      setSendingCode(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Invalid email format' });
      return false;
    }
    return true;
  };

  const validateCode = (): boolean => {
    if (!code.trim()) {
      setErrors({ code: 'Verification code is required' });
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

      toast.success('Email changed successfully');
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm email change');
      toast.error(err.message || 'Не вдалося підтвердити зміну пошти');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {step === 'email' ? 'Enter New Email' : 'Enter Verification Code'}
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
              <p className="text-gray-300">Відправка коду підтвердження...</p>
            </div>
          ) : step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Email
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
                  New Email *
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
                  placeholder="Enter new email address"
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
                  disabled={sendingCode}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingCode ? 'Sending...' : 'Send Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              {/* Success message about code being sent */}
              <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg">
                <p className="text-sm text-green-400">
                  ✓ Код для зміни пошти був відправлений на {currentEmail}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Email
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
                  Verification Code *
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
                  placeholder="Enter verification code"
                  maxLength={6}
                  className={`w-full p-3 bg-gray-800 text-white placeholder-gray-400 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 uppercase ${
                    errors.code ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-400">{errors.code}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Введіть код, який був відправлений на вашу поточну пошту ({currentEmail})
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Confirming...' : 'Confirm Change'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


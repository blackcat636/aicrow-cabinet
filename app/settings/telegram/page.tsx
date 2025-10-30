'use client';

import React, { useState, useEffect } from 'react';
import { telegramApi } from '@/lib/apiTelegram';
import { TelegramStatusResponse } from '@/types/telegram';
import { CopyIcon, CheckIcon, ExternalLinkIcon } from '@/components/icons';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessToken } from '@/lib/auth';
import { AppLayout } from '@/components/AppLayout';

const TelegramSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TelegramStatusResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load Telegram status on component mount
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await telegramApi.getStatus();
      setStatus(response.data);
    } catch (err: any) {
      // Handle 404 error gracefully - API endpoint might not exist yet
      if (err.status === 404) {
        setError('Telegram integration is not available yet. Please contact support.');
        setStatus({ isLinked: false, notificationsEnabled: false });
      } else {
        setError(err.message || 'Error loading Telegram status');
        console.error('Error loading Telegram status:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateLink = async () => {
    setIsGeneratingLink(true);
    setError(null);
    
    try {
      const response = await telegramApi.generateLink();
      setGeneratedLink(response.data.deepLink);
      toast.success('Link generated successfully!');
    } catch (err: any) {
      if (err.status === 404) {
        setError('Telegram integration is not available yet. Please contact support.');
      } else {
        setError(err.message || 'Error generating link');
      }
      console.error('Error generating link:', err);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyLink = async () => {
    if (generatedLink) {
      try {
        await navigator.clipboard.writeText(generatedLink);
        setLinkCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setLinkCopied(false), 2000);
      } catch (err) {
        toast.error('Error copying link');
      }
    }
  };

  const openTelegram = () => {
    if (generatedLink) {
      window.open(generatedLink, '_blank');
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await telegramApi.updateSettings({ notificationsEnabled: enabled });
      setStatus(prev => prev ? { ...prev, notificationsEnabled: enabled } : null);
      toast.success(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      if (err.status === 404) {
        setError('Telegram integration is not available yet. Please contact support.');
      } else {
        setError(err.message || 'Error updating settings');
      }
      console.error('Error updating settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const unlinkAccount = async () => {
    setShowConfirmDialog(true);
  };

  const confirmUnlink = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);
    setError(null);
    
    try {
      await telegramApi.unlink();
      setStatus(prev => prev ? { ...prev, isLinked: false } : null);
      toast.success('Telegram account unlinked successfully');
    } catch (err: any) {
      if (err.status === 404) {
        setError('Telegram integration is not available yet. Please contact support.');
      } else {
        setError(err.message || 'Error unlinking account');
      }
      console.error('Error unlinking account:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-full">
        <div className="max-w-5xl mx-auto py-6 h-full flex flex-col">
          {/* Outer container similar to Workflows */}
          <div className="rounded-lg border border-gray-700 bg-[#141519] h-full flex flex-col">
            {/* Header inside gray block */}
            <div className="flex items-center justify-between p-6">
              <div className="ml-6">
                <h2 className="text-2xl font-bold text-white">Telegram Settings</h2>
                <p className="text-gray-300 mt-1">Manage your Telegram account connection and notifications</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && !status && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                </div>
              )}

              {/* Status Section */}
              {status && (
                <div className="space-y-4">
                  {/* Connection Status Card */}
                  <div className="p-[1px] rounded-2xl bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
                    <div className="bg-black rounded-2xl p-6 h-full w-full">
                    <h2 className="text-lg font-medium text-white mb-5 text-center">Connection Status</h2>
                    
                    <div className="flex items-center justify-center py-4">
                      {status.isLinked ? (
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-900/30 border border-green-700 rounded-full">
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 font-medium text-sm">Telegram account connected</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-red-900/30 border border-red-700 rounded-full">
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                          <span className="text-red-400 font-medium text-sm">Telegram account not connected</span>
                        </div>
                      )}
                    </div>

                    {status.isLinked && (
                      <div className="mt-6 space-y-2 text-sm">
                        {status.telegramUsername && (
                          <div className="text-gray-400">
                            <span className="text-gray-500">Username:</span> <span className="text-gray-300">{status.telegramUsername}</span>
                          </div>
                        )}
                        {status.telegramFirstName && (
                          <div className="text-gray-400">
                            <span className="text-gray-500">Name:</span> <span className="text-gray-300">{status.telegramFirstName}{status.telegramLastName && ` ${status.telegramLastName}`}</span>
                          </div>
                        )}
                        {status.linkedAt && (
                          <div className="text-gray-400">
                            <span className="text-gray-500">Connected:</span> <span className="text-gray-300">{new Date(status.linkedAt).toLocaleDateString('en-US')}</span>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Actions Card */}
                  <div className="p-[1px] rounded-2xl bg-[linear-gradient(90deg,#A500E1_0%,#7B61FF_100%)] overflow-hidden">
                    <div className="bg-black rounded-2xl p-6 h-full w-full">
                    <div className="space-y-3">
                      {!status.isLinked ? (
                        <>
                          <button
                            onClick={generateLink}
                            disabled={isGeneratingLink}
                            className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                          >
                            {isGeneratingLink ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating link...
                              </div>
                            ) : (
                              'Connect Telegram Account'
                            )}
                          </button>
                          
                          {generatedLink && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 p-3 bg-[#0f1012] rounded-lg border border-gray-800">
                                <input
                                  type="text"
                                  value={generatedLink}
                                  readOnly
                                  className="flex-1 bg-transparent text-gray-300 text-xs"
                                />
                                <button
                                  onClick={copyLink}
                                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                >
                                  {linkCopied ? (
                                    <CheckIcon className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <CopyIcon className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={openTelegram}
                                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                >
                                  <ExternalLinkIcon className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 text-center">
                                Click the link or copy it to connect your Telegram account
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={unlinkAccount}
                          disabled={isLoading}
                          className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                        >
                          Disconnect Telegram Account
                        </button>
                      )}

                      <button
                        onClick={loadStatus}
                        disabled={isLoading}
                        className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        Refresh Status
                      </button>

                      {/* Notifications Toggle (visible only when Telegram is linked) */}
                      {status.isLinked && (
                        <button
                          onClick={() => toggleNotifications(!status.notificationsEnabled)}
                          disabled={isLoading}
                          className={`w-full py-3 rounded-xl transition-colors font-medium text-sm ${
                            status.notificationsEnabled
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          {status.notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141519] rounded-2xl p-8 max-w-md w-full border border-gray-600 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-white text-center mb-4">
              Disconnect Telegram Account
            </h3>

            {/* Message */}
            <p className="text-gray-300 text-center mb-8 leading-relaxed">
              Are you sure you want to disconnect your Telegram account? You will no longer receive notifications and will need to reconnect to use Telegram features.
            </p>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={confirmUnlink}
                disabled={isLoading}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Disconnecting...
                  </div>
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default TelegramSettingsPage;
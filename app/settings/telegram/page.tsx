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
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Telegram Settings</h1>
            <p className="text-gray-400">Manage your Telegram account connection and notifications</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !status && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          )}

          {/* Status Section */}
          {status && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                <h2 className="text-xl font-semibold text-white mb-4">Connection Status</h2>
                
                {status.isLinked ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 font-medium text-lg">Telegram account connected</span>
                    </div>
                    
                    {status.telegramUsername && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Username:</span> {status.telegramUsername}
                      </div>
                    )}
                    
                    {status.telegramFirstName && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Name:</span> {status.telegramFirstName}
                        {status.telegramLastName && ` ${status.telegramLastName}`}
                      </div>
                    )}
                    
                    {status.linkedAt && (
                      <div className="text-gray-300">
                        <span className="text-gray-400">Connected:</span> {new Date(status.linkedAt).toLocaleDateString('en-US')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-red-400 font-medium text-lg">Telegram account not connected</span>
                  </div>
                )}
              </div>

              {/* Notifications Settings */}
              {status.isLinked && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                  <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-lg">Receive notifications in Telegram</p>
                      <p className="text-sm text-gray-400">
                        {status.notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => toggleNotifications(!status.notificationsEnabled)}
                      disabled={isLoading}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        status.notificationsEnabled
                          ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-500/25'
                          : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-green-500/25'
                      } disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] border border-gray-500/20`}
                    >
                      {status.notificationsEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
                
                <div className="space-y-4">
                  {!status.isLinked ? (
                    <div className="space-y-4">
                      <button
                        onClick={generateLink}
                        disabled={isGeneratingLink}
                        className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                      >
                        {isGeneratingLink ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Generating link...
                          </div>
                        ) : (
                          'Connect Telegram Account'
                        )}
                      </button>
                      
                      {generatedLink && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg">
                            <input
                              type="text"
                              value={generatedLink}
                              readOnly
                              className="flex-1 bg-transparent text-gray-300 text-sm"
                            />
                            <button
                              onClick={copyLink}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                              {linkCopied ? (
                                <CheckIcon className="w-5 h-5 text-green-400" />
                              ) : (
                                <CopyIcon className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={openTelegram}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                              <ExternalLinkIcon className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-400">
                            Click the link or copy it to connect your Telegram account
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={unlinkAccount}
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-red-500/25 transform hover:scale-[1.02] active:scale-[0.98] border border-red-500/20"
                    >
                      Disconnect Telegram Account
                    </button>
                  )}
                  
                  <button
                    onClick={loadStatus}
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-gray-500/25 transform hover:scale-[1.02] active:scale-[0.98] border border-gray-500/20"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-600 shadow-2xl">
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
